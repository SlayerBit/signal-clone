import hashlib
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session, joinedload

from app.core.time_utils import utc_now
from app.models.entities import Contact, Conversation, ConversationMember, Message, MessageReceipt, User
from app.schemas.common import ConversationDetail, ConversationMemberDTO, ConversationSummary, MessageDTO, UserPublic
from app.services.message_service import message_to_dto


def direct_key(user_a: int, user_b: int) -> str:
    lo, hi = sorted([user_a, user_b])
    return hashlib.sha256(f"{lo}:{hi}".encode()).hexdigest()


def user_public(user: User) -> UserPublic:
    return UserPublic.model_validate(user)


def list_conversations(db: Session, user_id: int) -> list[ConversationSummary]:
    member_rows = (
        db.query(ConversationMember)
        .filter(ConversationMember.user_id == user_id)
        .all()
    )
    conv_ids = [m.conversation_id for m in member_rows]
    if not conv_ids:
        return []

    conversations = (
        db.query(Conversation)
        .filter(Conversation.id.in_(conv_ids))
        .order_by(Conversation.updated_at.desc())
        .all()
    )

    summaries: list[ConversationSummary] = []
    for conv in conversations:
        members = (
            db.query(ConversationMember)
            .options(joinedload(ConversationMember.user))
            .filter(ConversationMember.conversation_id == conv.id)
            .all()
        )
        member_users = [m.user for m in members]
        last_msg = (
            db.query(Message)
            .filter(Message.conversation_id == conv.id)
            .order_by(Message.created_at.desc())
            .first()
        )
        unread = _unread_count(db, user_id, conv.id)
        title = conv.title
        if conv.type == "direct":
            other = next((u for u in member_users if u.id != user_id), None)
            title = other.display_name if other else "Unknown"
        summaries.append(
            ConversationSummary(
                id=conv.id,
                type=conv.type,
                title=title,
                updated_at=conv.updated_at,
                unread_count=unread,
                last_message=message_to_dto(db, last_msg, user_id) if last_msg else None,
                members=[user_public(u) for u in member_users],
            )
        )
    return summaries


def _unread_count(db: Session, user_id: int, conversation_id: int) -> int:
    return (
        db.query(func.count(Message.id))
        .join(MessageReceipt, MessageReceipt.message_id == Message.id)
        .filter(
            Message.conversation_id == conversation_id,
            Message.sender_id != user_id,
            MessageReceipt.user_id == user_id,
            MessageReceipt.status != "read",
        )
        .scalar()
        or 0
    )


def get_or_create_direct(db: Session, user_id: int, other_user_id: int) -> Conversation:
    if user_id == other_user_id:
        raise HTTPException(status_code=400, detail="Cannot chat with yourself")
    other = db.query(User).filter(User.id == other_user_id).first()
    if not other:
        raise HTTPException(status_code=404, detail="User not found")
    key = direct_key(user_id, other_user_id)
    conv = db.query(Conversation).filter(Conversation.direct_key == key).first()
    if conv:
        return conv
    conv = Conversation(type="direct", direct_key=key, updated_at=utc_now())
    db.add(conv)
    db.flush()
    db.add_all(
        [
            ConversationMember(conversation_id=conv.id, user_id=user_id, role="member"),
            ConversationMember(conversation_id=conv.id, user_id=other_user_id, role="member"),
        ]
    )
    db.commit()
    db.refresh(conv)
    return conv


def create_group(db: Session, creator_id: int, title: str, member_ids: list[int]) -> Conversation:
    title = title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="Group name required")
    ids = set(member_ids)
    ids.add(creator_id)
    conv = Conversation(type="group", title=title, updated_at=utc_now())
    db.add(conv)
    db.flush()
    for uid in ids:
        role = "admin" if uid == creator_id else "member"
        db.add(ConversationMember(conversation_id=conv.id, user_id=uid, role=role))
    db.commit()
    db.refresh(conv)
    return conv


def get_conversation_detail(db: Session, user_id: int, conversation_id: int) -> ConversationDetail:
    conv = _require_member(db, user_id, conversation_id)
    members = (
        db.query(ConversationMember)
        .options(joinedload(ConversationMember.user))
        .filter(ConversationMember.conversation_id == conv.id)
        .all()
    )
    return ConversationDetail(
        id=conv.id,
        type=conv.type,
        title=conv.title,
        updated_at=conv.updated_at,
        members=[
            ConversationMemberDTO(
                user_id=m.user_id,
                role=m.role,
                user=user_public(m.user),
            )
            for m in members
        ],
    )


def _require_member(db: Session, user_id: int, conversation_id: int) -> Conversation:
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    member = (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == user_id,
        )
        .first()
    )
    if not member:
        raise HTTPException(status_code=403, detail="Not a member")
    return conv


def require_admin(db: Session, user_id: int, conversation_id: int) -> Conversation:
    conv = _require_member(db, user_id, conversation_id)
    if conv.type != "group":
        raise HTTPException(status_code=400, detail="Not a group conversation")
    member = (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == user_id,
        )
        .first()
    )
    if not member or member.role != "admin":
        raise HTTPException(status_code=403, detail="Admin required")
    return conv


def add_member(db: Session, admin_id: int, conversation_id: int, new_user_id: int) -> None:
    require_admin(db, admin_id, conversation_id)
    exists = (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == new_user_id,
        )
        .first()
    )
    if exists:
        raise HTTPException(status_code=409, detail="Already a member")
    user = db.query(User).filter(User.id == new_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.add(ConversationMember(conversation_id=conversation_id, user_id=new_user_id, role="member"))
    db.commit()


def remove_member(db: Session, admin_id: int, conversation_id: int, target_user_id: int) -> None:
    require_admin(db, admin_id, conversation_id)
    if admin_id == target_user_id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself as admin")
    (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == target_user_id,
        )
        .delete()
    )
    db.commit()


def search_conversations(db: Session, user_id: int, q: str) -> list[ConversationSummary]:
    q = q.strip().lower()
    all_convos = list_conversations(db, user_id)
    if not q:
        return all_convos
    return [c for c in all_convos if q in (c.title or "").lower()]


def add_contact(db: Session, owner_id: int, username: str | None, contact_user_id: int | None) -> Contact:
    if username:
        clean = username.strip().lstrip("@")
        user = (
            db.query(User)
            .filter(
                or_(
                    func.lower(User.username) == clean.lower(),
                    User.phone == clean,
                    User.phone == (clean if clean.startswith("+") else f"+{clean}"),
                )
            )
            .first()
        )
    else:
        user = db.query(User).filter(User.id == contact_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == owner_id:
        raise HTTPException(status_code=400, detail="Cannot add yourself")
    existing = (
        db.query(Contact)
        .filter(Contact.owner_id == owner_id, Contact.contact_user_id == user.id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Contact already exists")
    contact = Contact(owner_id=owner_id, contact_user_id=user.id)
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


def list_contacts(db: Session, owner_id: int) -> list[UserPublic]:
    rows = (
        db.query(User)
        .join(Contact, Contact.contact_user_id == User.id)
        .filter(Contact.owner_id == owner_id)
        .order_by(User.display_name)
        .all()
    )
    return [user_public(u) for u in rows]


def search_users(db: Session, q: str, exclude_id: int) -> list[UserPublic]:
    q = q.strip()
    if len(q) < 1:
        return []
    pattern = f"%{q.lower()}%"
    users = (
        db.query(User)
        .filter(
            User.id != exclude_id,
            or_(
                func.lower(User.username).like(pattern),
                func.lower(User.display_name).like(pattern),
                User.phone.like(f"%{q}%"),
            ),
        )
        .limit(20)
        .all()
    )
    return [user_public(u) for u in users]

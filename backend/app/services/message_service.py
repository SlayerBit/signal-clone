from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.core.time_utils import utc_now
from app.models.entities import ConversationMember, Message, MessageReaction, MessageReceipt, User
from app.schemas.common import MessageDTO, MessageReplyPreview, ReactionDTO


def message_to_dto(db: Session, msg: Message | None, viewer_id: int) -> MessageDTO | None:
    if not msg:
        return None
    reply_preview = None
    if msg.reply_to_id:
        parent = db.query(Message).filter(Message.id == msg.reply_to_id).first()
        if parent:
            sender = db.query(User).filter(User.id == parent.sender_id).first()
            reply_preview = MessageReplyPreview(
                id=parent.id,
                sender_id=parent.sender_id,
                body=parent.body[:200],
                sender_name=sender.display_name if sender else "Unknown",
            )
    reactions = (
        db.query(MessageReaction)
        .filter(MessageReaction.message_id == msg.id)
        .all()
    )
    reaction_dtos: list[ReactionDTO] = []
    for r in reactions:
        u = db.query(User).filter(User.id == r.user_id).first()
        reaction_dtos.append(
            ReactionDTO(emoji=r.emoji, user_id=r.user_id, user_name=u.display_name if u else "?")
        )
    sender_status = None
    if msg.sender_id == viewer_id:
        sender_status = _aggregate_sender_status(db, msg.id)

    msg_sender = db.query(User).filter(User.id == msg.sender_id).first()
    sender_name = msg_sender.display_name if msg_sender else "Unknown"
    sender_avatar_color = msg_sender.avatar_color if msg_sender else "#3b82f6"

    return MessageDTO(
        id=msg.id,
        conversation_id=msg.conversation_id,
        sender_id=msg.sender_id,
        sender_name=sender_name,
        sender_avatar_color=sender_avatar_color,
        body=msg.body,
        reply_to_id=msg.reply_to_id,
        reply_to=reply_preview,
        client_id=msg.client_id,
        created_at=msg.created_at,
        sender_status=sender_status,
        reactions=reaction_dtos,
    )


def _aggregate_sender_status(db: Session, message_id: int) -> str:
    receipts = db.query(MessageReceipt).filter(MessageReceipt.message_id == message_id).all()
    if not receipts:
        return "sent"
    statuses = [r.status for r in receipts]
    if all(s == "read" for s in statuses):
        return "read"
    if all(s in ("delivered", "read") for s in statuses):
        return "delivered"
    return "sent"


def list_messages(db: Session, user_id: int, conversation_id: int, before_id: int | None, limit: int) -> list[MessageDTO]:
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
    q = db.query(Message).filter(Message.conversation_id == conversation_id)
    if before_id:
        pivot = db.query(Message).filter(Message.id == before_id).first()
        if pivot:
            q = q.filter(Message.created_at < pivot.created_at)
    rows = q.order_by(Message.created_at.desc()).limit(limit).all()
    rows.reverse()
    out: list[MessageDTO] = []
    for m in rows:
        dto = message_to_dto(db, m, user_id)
        if dto:
            out.append(dto)
    return out


def create_message(
    db: Session,
    user_id: int,
    conversation_id: int,
    body: str,
    reply_to_id: int | None,
    client_id: str | None,
) -> Message:
    body = body.strip()
    if not body:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
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
    if reply_to_id:
        parent = db.query(Message).filter(Message.id == reply_to_id, Message.conversation_id == conversation_id).first()
        if not parent:
            raise HTTPException(status_code=400, detail="Invalid reply target")
    msg = Message(
        conversation_id=conversation_id,
        sender_id=user_id,
        body=body,
        reply_to_id=reply_to_id,
        client_id=client_id,
        created_at=utc_now(),
    )
    db.add(msg)
    db.flush()
    members = (
        db.query(ConversationMember)
        .filter(ConversationMember.conversation_id == conversation_id)
        .all()
    )
    for m in members:
        if m.user_id == user_id:
            continue
        db.add(
            MessageReceipt(
                message_id=msg.id,
                user_id=m.user_id,
                status="sent",
            )
        )
    from app.models.entities import Conversation

    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if conv:
        conv.updated_at = utc_now()
    db.commit()
    db.refresh(msg)
    return msg


def mark_delivered(db: Session, user_id: int, message_id: int) -> None:
    receipt = (
        db.query(MessageReceipt)
        .filter(MessageReceipt.message_id == message_id, MessageReceipt.user_id == user_id)
        .first()
    )
    if receipt and receipt.status != "read":
        receipt.status = "delivered"
        receipt.updated_at = utc_now()
        db.commit()


def mark_conversation_read(db: Session, user_id: int, conversation_id: int, up_to_message_id: int | None) -> list[int]:
    q = (
        db.query(MessageReceipt)
        .join(Message, Message.id == MessageReceipt.message_id)
        .filter(
            Message.conversation_id == conversation_id,
            MessageReceipt.user_id == user_id,
            MessageReceipt.status != "read",
        )
    )
    if up_to_message_id:
        pivot = db.query(Message).filter(Message.id == up_to_message_id).first()
        if pivot:
            q = q.filter(Message.created_at <= pivot.created_at)
    receipts = q.all()
    message_ids = []
    for r in receipts:
        r.status = "read"
        r.updated_at = utc_now()
        message_ids.append(r.message_id)
    db.commit()
    return message_ids


def upsert_reaction(db: Session, user_id: int, conversation_id: int, message_id: int, emoji: str) -> list[ReactionDTO]:
    emoji = emoji.strip()
    if not emoji:
        raise HTTPException(status_code=400, detail="Emoji required")
    msg = db.query(Message).filter(Message.id == message_id, Message.conversation_id == conversation_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    member = (
        db.query(ConversationMember)
        .filter(ConversationMember.conversation_id == conversation_id, ConversationMember.user_id == user_id)
        .first()
    )
    if not member:
        raise HTTPException(status_code=403, detail="Not a member")
    existing = (
        db.query(MessageReaction)
        .filter(MessageReaction.message_id == message_id, MessageReaction.user_id == user_id)
        .first()
    )
    if existing:
        existing.emoji = emoji
    else:
        db.add(MessageReaction(message_id=message_id, user_id=user_id, emoji=emoji))
    db.commit()
    return _reactions_for_message(db, message_id)


def remove_reaction(db: Session, user_id: int, conversation_id: int, message_id: int) -> list[ReactionDTO]:
    msg = db.query(Message).filter(Message.id == message_id, Message.conversation_id == conversation_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    (
        db.query(MessageReaction)
        .filter(MessageReaction.message_id == message_id, MessageReaction.user_id == user_id)
        .delete()
    )
    db.commit()
    return _reactions_for_message(db, message_id)


def _reactions_for_message(db: Session, message_id: int) -> list[ReactionDTO]:
    rows = db.query(MessageReaction).filter(MessageReaction.message_id == message_id).all()
    out = []
    for r in rows:
        u = db.query(User).filter(User.id == r.user_id).first()
        out.append(ReactionDTO(emoji=r.emoji, user_id=r.user_id, user_name=u.display_name if u else "?"))
    return out

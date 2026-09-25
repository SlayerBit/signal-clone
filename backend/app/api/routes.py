from fastapi import APIRouter, Cookie, Depends, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.core.config import settings
from app.database.session import get_db
from app.models.entities import Contact, User
from app.schemas.common import ConversationDetail, ConversationSummary, MessageDTO, UserPublic
from app.services import auth_service, conversation_service, message_service
from app.websocket.manager import manager

router = APIRouter(prefix="/api")


class IdentifierBody(BaseModel):
    identifier: str


class OtpBody(BaseModel):
    pending_token: str
    otp: str


class RegisterCompleteBody(BaseModel):
    setup_token: str
    display_name: str
    avatar_color: str | None = None


class PasswordLoginBody(BaseModel):
    identifier: str
    password: str


class DirectBody(BaseModel):
    user_id: int


class GroupBody(BaseModel):
    title: str
    member_ids: list[int]


class MessageBody(BaseModel):
    body: str
    reply_to_id: int | None = None
    client_id: str | None = None


class ReactionBody(BaseModel):
    emoji: str


class AddContactBody(BaseModel):
    username: str | None = None
    user_id: int | None = None


class ReadBody(BaseModel):
    message_id: int | None = None


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.cookie_name,
        value=token,
        httponly=True,
        samesite="lax",
        secure=settings.cookie_secure,
        max_age=settings.session_days * 86400,
    )


@router.post("/auth/register/start")
def register_start(body: IdentifierBody, db: Session = Depends(get_db)):
    token = auth_service.start_register(db, body.identifier)
    return {"pending_token": token, "hint": f"Use OTP {settings.mock_otp}"}


@router.post("/auth/register/verify-otp")
def register_verify(body: OtpBody):
    setup = auth_service.verify_register_otp(body.pending_token, body.otp)
    return {"setup_token": setup}


@router.post("/auth/register/complete")
def register_complete(body: RegisterCompleteBody, response: Response, db: Session = Depends(get_db)):
    user, token = auth_service.complete_register(db, body.setup_token, body.display_name, body.avatar_color)
    _set_session_cookie(response, token)
    return UserPublic.model_validate(user)


@router.post("/auth/login/start")
def login_start(body: IdentifierBody, db: Session = Depends(get_db)):
    token = auth_service.start_login(db, body.identifier)
    return {"pending_token": token, "hint": f"Use OTP {settings.mock_otp}"}


@router.post("/auth/login/verify-otp")
def login_verify(body: OtpBody, response: Response, db: Session = Depends(get_db)):
    user, token = auth_service.verify_login_otp(db, body.pending_token, body.otp)
    _set_session_cookie(response, token)
    return UserPublic.model_validate(user)


@router.post("/auth/login/password")
def login_password(body: PasswordLoginBody, response: Response, db: Session = Depends(get_db)):
    user, token = auth_service.login_with_password(db, body.identifier, body.password)
    _set_session_cookie(response, token)
    return UserPublic.model_validate(user)


@router.post("/auth/logout")
def logout(
    response: Response,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    session_token: str | None = Cookie(default=None, alias=settings.cookie_name),
):
    if session_token:
        auth_service.logout(db, session_token)
    response.delete_cookie(settings.cookie_name)
    return {"ok": True}


@router.get("/auth/me", response_model=UserPublic)
def me(user: User = Depends(get_current_user)):
    return UserPublic.model_validate(user)


@router.get("/users/search", response_model=list[UserPublic])
def search_users(q: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return conversation_service.search_users(db, q, user.id)


@router.get("/contacts", response_model=list[UserPublic])
def contacts(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return conversation_service.list_contacts(db, user.id)


@router.post("/contacts", response_model=UserPublic)
def add_contact(body: AddContactBody, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    contact = conversation_service.add_contact(db, user.id, body.username, body.user_id)
    u = db.query(User).filter(User.id == contact.contact_user_id).first()
    return UserPublic.model_validate(u)


@router.get("/conversations", response_model=list[ConversationSummary])
def conversations(q: str | None = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if q:
        return conversation_service.search_conversations(db, user.id, q)
    return conversation_service.list_conversations(db, user.id)


@router.get("/conversations/{conversation_id}", response_model=ConversationDetail)
def conversation_detail(conversation_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return conversation_service.get_conversation_detail(db, user.id, conversation_id)


@router.post("/conversations/direct")
def create_direct(body: DirectBody, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    conv = conversation_service.get_or_create_direct(db, user.id, body.user_id)
    return {"id": conv.id}


@router.post("/conversations/group")
def create_group(body: GroupBody, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    conv = conversation_service.create_group(db, user.id, body.title, body.member_ids)
    return {"id": conv.id}


@router.post("/conversations/{conversation_id}/members")
async def add_member(conversation_id: int, body: DirectBody, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    conversation_service.add_member(db, user.id, conversation_id, body.user_id)
    detail = conversation_service.get_conversation_detail(db, user.id, conversation_id)
    await manager.broadcast_conversation(
        conversation_id,
        {"type": "member.updated", "payload": detail.model_dump(mode="json")},
    )
    return {"ok": True}


@router.delete("/conversations/{conversation_id}/members/{member_user_id}")
async def remove_member(
    conversation_id: int, member_user_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    conversation_service.remove_member(db, user.id, conversation_id, member_user_id)
    detail = conversation_service.get_conversation_detail(db, user.id, conversation_id)
    await manager.broadcast_conversation(
        conversation_id,
        {"type": "member.updated", "payload": detail.model_dump(mode="json")},
    )
    return {"ok": True}


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageDTO])
def get_messages(
    conversation_id: int,
    before_id: int | None = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return message_service.list_messages(db, user.id, conversation_id, before_id, min(limit, 100))


@router.post("/conversations/{conversation_id}/messages", response_model=MessageDTO)
async def post_message(
    conversation_id: int,
    body: MessageBody,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    msg = message_service.create_message(db, user.id, conversation_id, body.body, body.reply_to_id, body.client_id)
    dto = message_service.message_to_dto(db, msg, user.id)
    await manager.broadcast_conversation(
        conversation_id,
        {"type": "message.new", "payload": dto.model_dump(mode="json")},
    )
    return dto


@router.post("/conversations/{conversation_id}/read")
async def mark_read(
    conversation_id: int,
    body: ReadBody,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ids = message_service.mark_conversation_read(db, user.id, conversation_id, body.message_id)
    from app.models.entities import Message

    for message_id in ids:
        msg = db.query(Message).filter(Message.id == message_id).first()
        if msg:
            await manager.send_to_user(
                msg.sender_id,
                {"type": "message.status", "payload": {"message_id": message_id, "user_id": user.id, "status": "read"}},
            )
    return {"updated": len(ids)}


@router.post("/conversations/{conversation_id}/messages/{message_id}/reactions")
async def add_reaction(
    conversation_id: int,
    message_id: int,
    body: ReactionBody,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    reactions = message_service.upsert_reaction(db, user.id, conversation_id, message_id, body.emoji)
    await manager.broadcast_conversation(
        conversation_id,
        {"type": "reaction.updated", "payload": {"message_id": message_id, "reactions": [r.model_dump() for r in reactions]}},
    )
    return reactions


@router.delete("/conversations/{conversation_id}/messages/{message_id}/reactions")
async def delete_reaction(
    conversation_id: int,
    message_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    reactions = message_service.remove_reaction(db, user.id, conversation_id, message_id)
    await manager.broadcast_conversation(
        conversation_id,
        {"type": "reaction.updated", "payload": {"message_id": message_id, "reactions": [r.model_dump() for r in reactions]}},
    )
    return reactions

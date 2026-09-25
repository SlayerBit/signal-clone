from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str | None
    phone: str | None
    display_name: str
    avatar_color: str
    bio: str | None = None
    is_online: bool
    last_seen_at: datetime | None


class MessageReplyPreview(BaseModel):
    id: int
    sender_id: int
    body: str
    sender_name: str


class ReactionDTO(BaseModel):
    emoji: str
    user_id: int
    user_name: str


class MessageDTO(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    body: str
    reply_to_id: int | None
    reply_to: MessageReplyPreview | None
    client_id: str | None
    created_at: datetime
    sender_status: str | None = None
    reactions: list[ReactionDTO] = []


class ConversationMemberDTO(BaseModel):
    user_id: int
    role: str
    user: UserPublic


class ConversationSummary(BaseModel):
    id: int
    type: str
    title: str | None
    updated_at: datetime
    unread_count: int
    last_message: MessageDTO | None
    members: list[UserPublic]
    is_muted: bool = False


class ConversationDetail(BaseModel):
    id: int
    type: str
    title: str | None
    members: list[ConversationMemberDTO]
    updated_at: datetime

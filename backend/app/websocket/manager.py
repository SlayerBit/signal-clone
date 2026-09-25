import asyncio
import json
from datetime import datetime
from typing import Any

from fastapi import WebSocket
from sqlalchemy.orm import Session

from app.database.session import SessionLocal
from app.models.entities import User
from app.schemas.common import UserPublic


class ConnectionManager:
    def __init__(self) -> None:
        self.active: dict[int, set[WebSocket]] = {}
        self.subscriptions: dict[int, set[int]] = {}  # conversation_id -> user_ids
        self._lock = asyncio.Lock()

    async def connect(self, user_id: int, ws: WebSocket) -> None:
        await ws.accept()
        async with self._lock:
            self.active.setdefault(user_id, set()).add(ws)
        self._set_presence(user_id, True)

    async def disconnect(self, user_id: int, ws: WebSocket) -> None:
        async with self._lock:
            conns = self.active.get(user_id, set())
            conns.discard(ws)
            if not conns:
                self.active.pop(user_id, None)
                for subs in self.subscriptions.values():
                    subs.discard(user_id)
                self._set_presence(user_id, False)

    def subscribe(self, user_id: int, conversation_id: int) -> None:
        self.subscriptions.setdefault(conversation_id, set()).add(user_id)

    def unsubscribe(self, user_id: int, conversation_id: int) -> None:
        subs = self.subscriptions.get(conversation_id)
        if subs:
            subs.discard(user_id)

    async def send_to_user(self, user_id: int, event: dict[str, Any]) -> None:
        payload = json.dumps(event)
        for ws in list(self.active.get(user_id, set())):
            try:
                await ws.send_text(payload)
            except Exception:
                pass

    async def broadcast_conversation(self, conversation_id: int, event: dict[str, Any], exclude_user: int | None = None) -> None:
        user_ids = self.subscriptions.get(conversation_id, set()) | self._member_ids(conversation_id)
        for uid in user_ids:
            if exclude_user and uid == exclude_user:
                continue
            await self.send_to_user(uid, event)

    async def broadcast_presence(self, user: UserPublic) -> None:
        event = {"type": "presence.updated", "payload": user.model_dump(mode="json")}
        for uid in list(self.active.keys()):
            await self.send_to_user(uid, event)

    def _member_ids(self, conversation_id: int) -> set[int]:
        db = SessionLocal()
        try:
            from app.models.entities import ConversationMember

            rows = db.query(ConversationMember.user_id).filter(ConversationMember.conversation_id == conversation_id).all()
            return {r[0] for r in rows}
        finally:
            db.close()

    def _set_presence(self, user_id: int, online: bool) -> None:
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return
            user.is_online = online
            if not online:
                user.last_seen_at = datetime.utcnow()
            db.commit()
            db.refresh(user)
            asyncio.create_task(self.broadcast_presence(UserPublic.model_validate(user)))
        finally:
            db.close()


manager = ConnectionManager()

import json

from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user_from_token
from app.database.session import SessionLocal
from app.models.entities import Message, User
from app.schemas.common import UserPublic
from app.services import message_service
from app.websocket.manager import manager


async def websocket_endpoint(websocket: WebSocket, session_token: str | None) -> None:
    db = SessionLocal()
    try:
        user = get_current_user_from_token(db, session_token)
        if not user:
            await websocket.close(code=4401)
            return
        user_id = user.id
        await manager.connect(user_id, websocket)
        try:
            while True:
                raw = await websocket.receive_text()
                data = json.loads(raw)
                event_db = SessionLocal()
                try:
                    await _handle_event(event_db, user_id, data)
                finally:
                    event_db.close()
        except WebSocketDisconnect:
            await manager.disconnect(user_id, websocket)
    finally:
        db.close()


async def _handle_event(db: Session, user_id: int, data: dict) -> None:
    event_type = data.get("type")
    payload = data.get("payload") or {}

    if event_type == "subscribe":
        manager.subscribe(user_id, int(payload["conversation_id"]))
    elif event_type == "unsubscribe":
        manager.unsubscribe(user_id, int(payload["conversation_id"]))
    elif event_type == "typing.start":
        cid = int(payload["conversation_id"])
        await manager.broadcast_conversation(
            cid,
            {"type": "typing", "payload": {"conversation_id": cid, "user_id": user_id, "is_typing": True}},
            exclude_user=user_id,
        )
    elif event_type == "typing.stop":
        cid = int(payload["conversation_id"])
        await manager.broadcast_conversation(
            cid,
            {"type": "typing", "payload": {"conversation_id": cid, "user_id": user_id, "is_typing": False}},
            exclude_user=user_id,
        )
    elif event_type == "message.delivered":
        message_service.mark_delivered(db, user_id, int(payload["message_id"]))
        msg = db.query(Message).filter(Message.id == int(payload["message_id"])).first()
        if msg:
            await manager.send_to_user(
                msg.sender_id,
                {
                    "type": "message.status",
                    "payload": {
                        "message_id": msg.id,
                        "user_id": user_id,
                        "status": "delivered",
                    },
                },
            )
    elif event_type == "message.read":
        cid = int(payload["conversation_id"])
        mid = payload.get("message_id")
        ids = message_service.mark_conversation_read(db, user_id, cid, int(mid) if mid else None)
        for message_id in ids:
            msg = db.query(Message).filter(Message.id == message_id).first()
            if msg:
                await manager.send_to_user(
                    msg.sender_id,
                    {
                        "type": "message.status",
                        "payload": {"message_id": message_id, "user_id": user_id, "status": "read"},
                    },
                )
    elif event_type == "presence.ping":
        u = db.query(User).filter(User.id == user_id).first()
        if u:
            u.is_online = True
            db.commit()
            await manager.broadcast_presence(UserPublic.model_validate(u))

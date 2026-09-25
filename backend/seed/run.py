from datetime import timedelta
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy.orm import Session


from app.core.security import hash_password
from app.core.time_utils import utc_now
from app.database.session import SessionLocal, engine
from app.models.entities import (
    Contact,
    Conversation,
    ConversationMember,
    Message,
    MessageReaction,
    MessageReceipt,
    User,
)
from app.services.conversation_service import direct_key


def seed_if_empty() -> None:
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            return
        _seed(db)
    finally:
        db.close()


def _seed(db: Session) -> None:
    now = utc_now()
    users = [
        User(
            id=1,
            username="om",
            phone="+919842946727",
            display_name="Om",
            avatar_color="#c4a574",
            password_hash=hash_password("123456"),
            bio="Building secure messaging demos",
            is_online=True,
            last_seen_at=now,
        ),
        User(
            id=2,
            username="rahul",
            phone="+919842946728",
            display_name="Rahul Sharma",
            avatar_color="#7c6bf0",
            password_hash=hash_password("123456"),
            is_online=True,
            last_seen_at=now - timedelta(minutes=2),
        ),
        User(
            id=3,
            username="priya",
            phone="+919811223344",
            display_name="Priya Nair",
            avatar_color="#e879f9",
            password_hash=hash_password("123456"),
            is_online=False,
            last_seen_at=now - timedelta(hours=1),
        ),
        User(
            id=4,
            username="arjun",
            phone="+919900112233",
            display_name="Arjun Mehta",
            avatar_color="#38bdf8",
            password_hash=hash_password("123456"),
            is_online=False,
            last_seen_at=now - timedelta(minutes=45),
        ),
        User(
            id=5,
            username="neha",
            phone="+919955667788",
            display_name="Neha Kapoor",
            avatar_color="#f97316",
            password_hash=hash_password("123456"),
            is_online=True,
            last_seen_at=now - timedelta(minutes=5),
        ),
        User(
            id=6,
            username="kavya",
            phone="+919966778899",
            display_name="Kavya Iyer",
            avatar_color="#4ade80",
            password_hash=hash_password("123456"),
            is_online=False,
            last_seen_at=now - timedelta(days=1),
        ),
    ]
    db.add_all(users)
    db.flush()

    for owner_id, contact_id in [(1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (2, 1), (3, 1)]:
        db.add(Contact(owner_id=owner_id, contact_user_id=contact_id))

    conv_om_rahul = Conversation(
        id=1,
        type="direct",
        direct_key=direct_key(1, 2),
        updated_at=now - timedelta(minutes=3),
    )
    conv_om_priya = Conversation(
        id=2,
        type="direct",
        direct_key=direct_key(1, 3),
        updated_at=now - timedelta(hours=2),
    )
    conv_om_neha = Conversation(
        id=3,
        type="direct",
        direct_key=direct_key(1, 5),
        updated_at=now - timedelta(minutes=20),
    )
    group = Conversation(
        id=4,
        type="group",
        title="Scaler AI Labs",
        updated_at=now - timedelta(minutes=8),
    )
    db.add_all([conv_om_rahul, conv_om_priya, conv_om_neha, group])
    db.flush()

    for cid, uids in [
        (1, [1, 2]),
        (2, [1, 3]),
        (3, [1, 5]),
        (4, [1, 2, 3, 4, 5]),
    ]:
        for uid in uids:
            role = "member"
            if cid == 4 and uid in (1, 2):
                role = "admin"
            db.add(ConversationMember(conversation_id=cid, user_id=uid, role=role))

    messages = [
        Message(
            id=1,
            conversation_id=1,
            sender_id=2,
            body="Om, did you finish the WebSocket handler for delivery receipts?",
            created_at=now - timedelta(hours=5),
        ),
        Message(
            id=2,
            conversation_id=1,
            sender_id=1,
            body="Almost — wiring read states now. Demo should be ready tonight.",
            created_at=now - timedelta(hours=4, minutes=50),
        ),
        Message(
            id=3,
            conversation_id=1,
            sender_id=2,
            body="Perfect. I'll test with two browser profiles once you push.",
            created_at=now - timedelta(minutes=30),
        ),
        Message(
            id=4,
            conversation_id=1,
            sender_id=2,
            body="Also remember seed data needs realistic copy, not lorem ipsum.",
            created_at=now - timedelta(minutes=28),
        ),
        Message(
            id=5,
            conversation_id=2,
            sender_id=3,
            body="Hey Om — sending you the API review notes when you're free.",
            created_at=now - timedelta(hours=3),
        ),
        Message(
            id=6,
            conversation_id=3,
            sender_id=5,
            body="Standup moved to 4 PM. Can you share the ERD screenshot?",
            created_at=now - timedelta(minutes=25),
        ),
        Message(
            id=7,
            conversation_id=4,
            sender_id=2,
            body="Welcome everyone — let's keep the Signal UI dark theme consistent.",
            created_at=now - timedelta(days=1),
        ),
        Message(
            id=8,
            conversation_id=4,
            sender_id=4,
            body="I'll take settings placeholders and calls/stories empty states.",
            created_at=now - timedelta(hours=6),
        ),
        Message(
            id=9,
            conversation_id=4,
            sender_id=1,
            body="Reply thread and reactions are in scope — I'll seed examples there.",
            created_at=now - timedelta(minutes=15),
            reply_to_id=8,
        ),
        Message(
            id=10,
            conversation_id=4,
            sender_id=3,
            body="Neha and I can run multi-user QA tomorrow morning.",
            created_at=now - timedelta(minutes=10),
        ),
    ]
    db.add_all(messages)
    db.flush()

    for msg in messages:
        members = db.query(ConversationMember).filter(ConversationMember.conversation_id == msg.conversation_id).all()
        for m in members:
            if m.user_id == msg.sender_id:
                continue
            status = "read" if msg.id <= 2 else "delivered"
            if msg.conversation_id == 1 and msg.id >= 3:
                status = "delivered"
            if msg.conversation_id == 3:
                status = "delivered"
            db.add(MessageReceipt(message_id=msg.id, user_id=m.user_id, status=status))

    db.add(MessageReaction(message_id=8, user_id=1, emoji="👍"))
    db.add(MessageReaction(message_id=8, user_id=3, emoji="🔥"))
    db.add(MessageReaction(message_id=2, user_id=2, emoji="✅"))

    db.commit()


if __name__ == "__main__":
    from app.database.session import Base

    if "--reset" in sys.argv or "--force" in sys.argv:
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
            _seed(db)
        finally:
            db.close()
        print("Database reset and seeded successfully.")
    else:
        Base.metadata.create_all(bind=engine)
        seed_if_empty()
        print("Seed complete.")


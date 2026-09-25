import re
from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import generate_token, hash_password, hash_token, session_expiry, verify_password
from app.models.entities import Session as DbSession
from app.models.entities import User

_pending: dict[str, dict] = {}


def _normalize_identifier(identifier: str) -> tuple[str | None, str | None]:
    identifier = identifier.strip()
    if identifier.startswith("+") or identifier.replace(" ", "").isdigit():
        phone = re.sub(r"\s+", "", identifier)
        if not phone.startswith("+"):
            phone = f"+{phone}"
        return None, phone
    username = identifier.lower().lstrip("@")
    return username, None


def start_register(db: Session, identifier: str) -> str:
    username, phone = _normalize_identifier(identifier)
    if username and db.query(User).filter(User.username == username).first():
        raise HTTPException(status_code=409, detail="Username already taken")
    if phone and db.query(User).filter(User.phone == phone).first():
        raise HTTPException(status_code=409, detail="Phone already registered")
    token = generate_token()
    _pending[token] = {
        "flow": "register",
        "username": username,
        "phone": phone,
        "expires": datetime.utcnow().timestamp() + 600,
    }
    return token


def verify_register_otp(pending_token: str, otp: str) -> str:
    data = _pending.get(pending_token)
    if not data or data.get("flow") != "register":
        raise HTTPException(status_code=400, detail="Invalid pending registration")
    if otp != settings.mock_otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    setup_token = generate_token()
    _pending[setup_token] = {**data, "flow": "register_setup", "expires": datetime.utcnow().timestamp() + 600}
    del _pending[pending_token]
    return setup_token


def complete_register(db: Session, setup_token: str, display_name: str, avatar_color: str | None) -> tuple[User, str]:
    data = _pending.get(setup_token)
    if not data or data.get("flow") != "register_setup":
        raise HTTPException(status_code=400, detail="Invalid setup token")
    user = User(
        username=data.get("username"),
        phone=data.get("phone"),
        display_name=display_name.strip(),
        avatar_color=avatar_color or "#c4a574",
        password_hash=hash_password(settings.mock_otp),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    del _pending[setup_token]
    session_token = _create_session(db, user.id)
    return user, session_token


def start_login(db: Session, identifier: str) -> str:
    username, phone = _normalize_identifier(identifier)
    user = None
    if username:
        user = db.query(User).filter(User.username == username).first()
    elif phone:
        user = db.query(User).filter(User.phone == phone).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    token = generate_token()
    _pending[token] = {
        "flow": "login",
        "user_id": user.id,
        "expires": datetime.utcnow().timestamp() + 600,
    }
    return token


def verify_login_otp(db: Session, pending_token: str, otp: str) -> tuple[User, str]:
    data = _pending.get(pending_token)
    if not data or data.get("flow") != "login":
        raise HTTPException(status_code=400, detail="Invalid pending login")
    if otp != settings.mock_otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    user = db.query(User).filter(User.id == data["user_id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    del _pending[pending_token]
    return user, _create_session(db, user.id)


def login_with_password(db: Session, identifier: str, password: str) -> tuple[User, str]:
    username, phone = _normalize_identifier(identifier)
    user = None
    if username:
        user = db.query(User).filter(User.username == username).first()
    elif phone:
        user = db.query(User).filter(User.phone == phone).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return user, _create_session(db, user.id)


def logout(db: Session, session_token: str) -> None:
    token_hash = hash_token(session_token)
    db.query(DbSession).filter(DbSession.token_hash == token_hash).delete()
    db.commit()


def _create_session(db: Session, user_id: int) -> str:
    token = generate_token()
    db.add(
        DbSession(
            user_id=user_id,
            token_hash=hash_token(token),
            expires_at=session_expiry(),
        )
    )
    db.commit()
    return token

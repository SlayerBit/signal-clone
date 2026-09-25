from datetime import datetime

from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_token
from app.database.session import get_db
from app.models.entities import Session as DbSession
from app.models.entities import User


def get_current_user(
    db: Session = Depends(get_db),
    session_token: str | None = Cookie(default=None, alias=settings.cookie_name),
) -> User:
    if not session_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    token_hash = hash_token(session_token)
    row = (
        db.query(DbSession)
        .filter(DbSession.token_hash == token_hash, DbSession.expires_at > datetime.utcnow())
        .first()
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")
    user = db.query(User).filter(User.id == row.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def get_current_user_from_token(db: Session, session_token: str | None) -> User | None:
    if not session_token:
        return None
    token_hash = hash_token(session_token)
    row = (
        db.query(DbSession)
        .filter(DbSession.token_hash == token_hash, DbSession.expires_at > datetime.utcnow())
        .first()
    )
    if not row:
        return None
    return db.query(User).filter(User.id == row.user_id).first()

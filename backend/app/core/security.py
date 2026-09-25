from datetime import datetime, timedelta
import hashlib
import secrets

from passlib.context import CryptContext

from app.core.config import settings
from app.core.time_utils import utc_now

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str | None) -> bool:
    if not password_hash:
        return False
    return pwd_context.verify(password, password_hash)


def generate_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    return hashlib.sha256(f"{settings.secret_key}:{token}".encode()).hexdigest()


def session_expiry() -> datetime:
    return utc_now() + timedelta(days=settings.session_days)


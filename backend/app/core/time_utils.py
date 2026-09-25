from datetime import datetime, timezone


def utc_now() -> datetime:
    """Return current UTC datetime without tzinfo for clean SQLite compatibility."""
    return datetime.now(timezone.utc).replace(tzinfo=None)

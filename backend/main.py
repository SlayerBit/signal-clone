import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.api.routes import router
from app.core.config import settings
from app.database.session import Base, engine
from app.websocket.handlers import websocket_endpoint

logger = logging.getLogger(__name__)


def run_sqlite_migrations(db_engine=None) -> None:
    """Safely apply missing column migrations to SQLite databases idempotently."""
    target_engine = db_engine or engine
    if target_engine.dialect.name != "sqlite":
        return

    inspector = inspect(target_engine)
    if "users" in inspector.get_table_names():
        columns = {col["name"] for col in inspector.get_columns("users")}
        if "avatar_id" not in columns:
            logger.info("Applying SQLite migration: adding users.avatar_id column...")
            with target_engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN avatar_id VARCHAR(32)"))
            logger.info("Applied SQLite migration: added users.avatar_id successfully.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(os.path.dirname(settings.database_url.replace("sqlite:///", "")) or ".", exist_ok=True)
    Base.metadata.create_all(bind=engine)
    run_sqlite_migrations(engine)
    if settings.seed_on_startup:
        from seed.run import seed_if_empty

        seed_if_empty()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)
origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.websocket("/ws")
async def ws_route(websocket: WebSocket, token: str | None = None):
    session_token = token or websocket.cookies.get(settings.cookie_name)
    await websocket_endpoint(websocket, session_token)


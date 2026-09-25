import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.config import settings
from app.database.session import Base, engine
from app.websocket.handlers import websocket_endpoint


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(os.path.dirname(settings.database_url.replace("sqlite:///", "")) or ".", exist_ok=True)
    Base.metadata.create_all(bind=engine)
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


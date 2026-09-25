# API Specification

## Endpoints Overview

- **Production REST Base URL:** `https://signal-clone-production-f521.up.railway.app`
- **Production WebSocket URL:** `wss://signal-clone-production-f521.up.railway.app/ws`
- **Local Dev REST Base URL:** `http://localhost:8000`
- **Local Dev WebSocket URL:** `ws://localhost:8000/ws`

All authenticated REST routes require the HTTP-only `session_token` cookie unless otherwise specified.

---

## System / Health

| Method | Path | Auth | Purpose | Response |
|--------|------|------|---------|----------|
| GET | `/health` | None | Service liveness / health check | `{"status": "ok"}` |

---

## Authentication

| Method | Path | Auth | Request Body | Response / Effect |
|--------|------|------|--------------|-------------------|
| POST | `/api/auth/register/start` | None | `{ "identifier": "string" }` | `{ "pending_token": "string", "hint": "Use OTP 123456" }` |
| POST | `/api/auth/register/verify-otp` | None | `{ "pending_token": "string", "otp": "123456" }` | `{ "setup_token": "string" }` |
| POST | `/api/auth/register/complete` | None | `{ "setup_token": "string", "display_name": "string", "avatar_color"?: "string", "avatar_id"?: "string" }` | Returns `UserPublic` object; sets HTTP-only `session_token` cookie |
| POST | `/api/auth/login/start` | None | `{ "identifier": "string" }` | `{ "pending_token": "string", "hint": "Use OTP 123456" }` |
| POST | `/api/auth/login/verify-otp` | None | `{ "pending_token": "string", "otp": "123456" }` | Returns `UserPublic` object; sets HTTP-only `session_token` cookie |
| POST | `/api/auth/login/password` | None | `{ "identifier": "string", "password": "string" }` | Returns `UserPublic` object; sets HTTP-only `session_token` cookie |
| POST | `/api/auth/logout` | Session Cookie | None | `{ "ok": true }`; clears `session_token` cookie |
| GET | `/api/auth/me` | Session Cookie | None | Returns current authenticated `UserPublic` profile |
| PATCH | `/api/auth/me` | Session Cookie | `{ "display_name"?: "string", "avatar_color"?: "string", "avatar_id"?: "string", "bio"?: "string" }` | Updates profile fields and returns updated `UserPublic` |

> **Mock OTP:** Use **`123456`** for all verification flows.

---

## Users & Contacts

| Method | Path | Auth | Request Body | Response |
|--------|------|------|--------------|----------|
| GET | `/api/users/search?q={query}` | Session Cookie | None | Returns `list[UserPublic]` matching search term |
| GET | `/api/contacts` | Session Cookie | None | Returns `list[UserPublic]` of saved contacts |
| POST | `/api/contacts` | Session Cookie | `{ "username"?: "string", "user_id"?: number }` | Adds contact; returns added `UserPublic` |

---

## Conversations

| Method | Path | Auth | Request Body | Response |
|--------|------|------|--------------|----------|
| GET | `/api/conversations?q={query}` | Session Cookie | None (optional search query `q`) | Returns `list[ConversationSummary]` sorted by recent activity |
| GET | `/api/conversations/{conversation_id}` | Session Cookie | None | Returns `ConversationDetail` including member roster |
| POST | `/api/conversations/direct` | Session Cookie | `{ "user_id": number }` | Returns or creates 1:1 conversation: `{"id": number}` |
| POST | `/api/conversations/group` | Session Cookie | `{ "title": "string", "member_ids": [number] }` | Creates group conversation: `{"id": number}` |
| POST | `/api/conversations/{conversation_id}/members` | Session Cookie (Admin) | `{ "user_id": number }` | Adds member; broadcasts update; returns `{"ok": true}` |
| DELETE | `/api/conversations/{conversation_id}/members/{member_user_id}` | Session Cookie (Admin) | None | Removes member; broadcasts update; returns `{"ok": true}` |
| POST | `/api/conversations/{conversation_id}/read` | Session Cookie | `{ "message_id"?: number }` | Marks messages read; broadcasts receipts; returns `{"updated": count}` |

---

## Messages

| Method | Path | Auth | Request Body | Response |
|--------|------|------|--------------|----------|
| GET | `/api/conversations/{conversation_id}/messages?before_id={id}&limit={limit}` | Session Cookie | Query params `before_id` (optional), `limit` (default 50, max 100) | Returns `list[MessageDTO]` in chronological order |
| POST | `/api/conversations/{conversation_id}/messages` | Session Cookie | `{ "body": "string", "reply_to_id"?: number, "client_id"?: "string" }` | Creates message, broadcasts `message.new`, returns `MessageDTO` |
| POST | `/api/conversations/{conversation_id}/messages/{message_id}/reactions` | Session Cookie | `{ "emoji": "string" }` | Upserts reaction, broadcasts `reaction.updated`, returns `list[ReactionGroup]` |
| DELETE | `/api/conversations/{conversation_id}/messages/{message_id}/reactions` | Session Cookie | None | Removes user's reaction, broadcasts update, returns `list[ReactionGroup]` |

---

## Error Handling

Standard error envelope:
```json
{
  "detail": "Error description message"
}
```
HTTP status codes used:
- `400 Bad Request`: Validation failure or business logic error
- `401 Unauthorized`: Missing or invalid session cookie / token
- `403 Forbidden`: Non-admin member attempted restricted operation (e.g., adding/removing group members)
- `404 Not Found`: Conversation, message, or user entity not found
- `409 Conflict`: Resource already exists (e.g., duplicate username or contact)
- `422 Unprocessable Entity`: Request body schema validation error

---

## WebSocket Protocol

- **Endpoint:** `wss://host/ws` (Production) or `ws://host/ws` (Local)
- **Handshake Authentication:** Authenticated via HTTP-only `session_token` cookie or optional `?token=<session_token>` query parameter. Unauthenticated connections are closed with code `4401`.

### Client → Server Events

| Event Type | Payload | Behavior |
|------------|---------|----------|
| `subscribe` | `{ "conversation_id": number }` | Subscribes socket to conversation events |
| `unsubscribe` | `{ "conversation_id": number }` | Unsubscribes socket from conversation events |
| `typing.start` | `{ "conversation_id": number }` | Broadcasts typing status to conversation members |
| `typing.stop` | `{ "conversation_id": number }` | Clears typing status |
| `message.delivered`| `{ "message_id": number }` | Updates delivery receipt in DB and notifies sender |
| `message.read` | `{ "conversation_id": number, "message_id"?: number }` | Marks messages read and notifies sender |
| `presence.ping` | `{}` | Heartbeat to refresh online presence |

### Server → Client Events

| Event Type | Payload | Description |
|------------|---------|-------------|
| `message.new` | `MessageDTO` | Inbound message with reply context and receipt status |
| `message.status` | `{ "message_id": number, "user_id": number, "status": "delivered" \| "read" }` | Realtime delivery / read receipt update |
| `typing` | `{ "conversation_id": number, "user_id": number, "is_typing": boolean }` | Typing indicator status change |
| `reaction.updated` | `{ "message_id": number, "reactions": list[ReactionGroup] }` | Aggregated reactions array for message |
| `member.updated` | `ConversationDetail` | Updated group member roster and roles |
| `presence.updated` | `UserPublic` | User online status (`is_online`) and `last_seen_at` update |

### Connection Lifecycle

1. **Connect:** On WebSocket accept, user presence is marked `is_online = True` in SQLite and broadcast via `presence.updated`.
2. **Channel Subscription:** Client issues `subscribe` for the active conversation; incoming messages and typing signals are routed to subscribers and conversation members.
3. **Disconnect:** On disconnect, active connections are cleaned up. When all connections for a user close, `is_online` is set to `False`, `last_seen_at` is updated to current UTC timestamp, and `presence.updated` is broadcast.


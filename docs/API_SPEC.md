# API Specification

Base URL: `http://localhost:8000` (dev) / Railway URL (prod).  
All authenticated REST routes require session cookie unless noted.

## Auth

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/register/start` | Start registration `{ identifier }` → `{ pending_token }` |
| POST | `/api/auth/register/verify-otp` | `{ pending_token, otp }` → `{ setup_token }` |
| POST | `/api/auth/register/complete` | `{ setup_token, display_name, avatar_color? }` → user + Set-Cookie |
| POST | `/api/auth/login/start` | `{ identifier }` → `{ pending_token }` |
| POST | `/api/auth/login/verify-otp` | `{ pending_token, otp }` → Set-Cookie |
| POST | `/api/auth/logout` | Invalidate session |
| GET | `/api/auth/me` | Current user profile |

Mock OTP: **`123456`** for all flows.

## Users & contacts

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/users/search?q=` | Search by username/display name |
| GET | `/api/contacts` | List contacts |
| POST | `/api/contacts` | `{ username \| user_id }` add contact |
| DELETE | `/api/contacts/{id}` | Remove contact |

## Conversations

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/conversations` | List with last message, unread, presence |
| GET | `/api/conversations/{id}` | Detail + members |
| POST | `/api/conversations/direct` | `{ user_id }` get or create DM |
| POST | `/api/conversations/group` | `{ title, member_ids[] }` create group |
| POST | `/api/conversations/{id}/members` | Admin add `{ user_id }` |
| DELETE | `/api/conversations/{id}/members/{user_id}` | Admin remove |
| POST | `/api/conversations/{id}/read` | Mark read through latest message |

## Messages

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/conversations/{id}/messages?before=&limit=` | Paginated history |
| POST | `/api/conversations/{id}/messages` | `{ body, reply_to_id?, client_id? }` |
| POST | `/api/conversations/{id}/messages/{msg_id}/reactions` | `{ emoji }` upsert |
| DELETE | `/api/conversations/{id}/messages/{msg_id}/reactions` | Remove own reaction |

## Errors

JSON: `{ "detail": "message" }` with appropriate HTTP status (400, 401, 403, 404, 409).

## WebSocket

**Endpoint:** `ws://host/ws` (cookie auth on handshake)

### Client → Server

| type | payload | behavior |
|------|---------|----------|
| `subscribe` | `{ conversation_id }` | Join conversation room |
| `unsubscribe` | `{ conversation_id }` | Leave room |
| `typing.start` | `{ conversation_id }` | Broadcast typing |
| `typing.stop` | `{ conversation_id }` | Stop typing |
| `message.delivered` | `{ message_id }` | Update receipt |
| `message.read` | `{ conversation_id, message_id? }` | Mark read + notify |
| `presence.ping` | `{}` | Refresh online status |

### Server → Client

| type | payload |
|------|---------|
| `message.new` | Full message DTO + receipts |
| `message.status` | `{ message_id, user_id, status }` |
| `typing` | `{ conversation_id, user_id, is_typing }` |
| `reaction.updated` | `{ message_id, reactions[] }` |
| `member.updated` | `{ conversation_id, members[] }` |
| `presence.updated` | `{ user_id, is_online, last_seen_at }` |

### Lifecycle

Connect → auto presence online → client `subscribe` per open chat → on disconnect mark offline after grace period.

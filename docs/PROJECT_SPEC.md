# Project Specification — Secure Messaging Platform (Signal Clone)

## A. Assignment Requirements (Authoritative)

| Area | Requirement | Status |
|------|-------------|--------|
| Stack | Next.js 15 (App Router) + TypeScript, Python FastAPI, SQLite (ACID compliant), WebSockets | Implemented |
| Auth | Register (phone/username), mock OTP (`123456`), profile, password & OTP login/logout, persistent session cookies | Implemented |
| Contacts | Conversation list, search chats & contacts, add contact, unread badges, previews, online/last-seen presence | Implemented |
| 1:1 Chat | Real-time text, timestamps, delivery/read receipts, typing indicators, message lifecycle, DB persistence | Implemented |
| Groups | Create, name, members, messaging, view/add/remove members, admin enforcement, persistence | Implemented |
| UX | Signal Desktop shell (Nav rail, chats sidebar, chat pane, composer, floating anchored action pills) | Implemented |
| Themes | **Signal Dark & Signal Light modes** with instant switching, custom accent colors, and persistent state | Implemented |
| Search | Dual search: conversation/contact list filter + in-chat message search with term highlighting | Implemented |
| Seed | Immediately demoable with multiple users, conversations, groups, messages, replies, and reactions | Implemented |
| Deliverables | `frontend/`, `backend/`, comprehensive documentation, visual QA automation suite | Implemented |

---

## B. Feature Matrix & Scope Classification

| Feature | Scope Class | Status | Implementation Details |
|---------|-------------|--------|------------------------|
| Registration (username/phone) | Mandatory | Verified | Multi-step registration flow (`/register`) with OTP verification |
| Mock OTP (`123456`) | Mandatory | Verified | Instant verification (`123456`) for streamlined evaluation |
| **Profile avatar selection** | **Mandatory** | **Verified** | Curated vector illustration presets + background color picker in onboarding (`/register`) and Settings (`/settings/profile`), persisted via `users.avatar_id` |
| **Notifications / toasts** | **Mandatory** | **Verified** | Reusable accessible toast notification system for auth, contacts, groups, messaging errors, and clipboard actions |
| Password login | Mandatory | Verified | Direct password login (`/login`) supported for demo accounts (`123456`) |
| OTP login | Mandatory | Verified | Passwordless login via identifier + mock OTP (`123456`) |
| Session cookies | Mandatory | Verified | HTTP-only session cookies with 14-day expiry and cryptographic hashing |
| Conversation list (recent sort) | Mandatory | Verified | Auto-reordering on new messages and receipts |
| Search conversations & contacts | Mandatory | Verified | Debounced real-time contact and thread search |
| Add contact | Mandatory | Verified | User discovery via username/user_id lookup with toast confirmation |
| Unread / last message preview | Mandatory | Verified | Unread counters, sender receipts, preview text |
| Online / last-seen | Mandatory | Verified | Real-time WebSocket presence ping & DB fallback |
| 1:1 real-time messaging | Mandatory | Verified | Full-duplex WebSocket broadcast & REST fallback |
| Message lifecycle | Mandatory | Verified | `sending` → `sent` → `delivered` → `read` |
| Typing indicators | Mandatory | Verified | Real-time typing start/stop with debounced cleanup |
| Group create & messaging | Mandatory | Verified | Multi-member groups with real-time distribution and toast feedback |
| Group member admin ops | Mandatory | Verified | Add/remove member authorization restricted to admin roles with toast alerts |
| **Reply / quoted messages** | **Selected Bonus** | Verified | Spatially anchored reply, composer preview, click-to-scroll jump |
| **Emoji reactions** | **Selected Bonus** | Verified | Spatially anchored picker, aggregated chips beneath bubble, toggle |
| **Light & Dark themes** | **Selected Bonus** | Verified | CSS design tokens, instant toggle, persistent state, zero FOUC |
| In-chat message search | Functional UX Enhancement | Verified | Header search with match counter, Prev/Next navigation, term highlight |
| Unified popover regions | Functional UX Enhancement | Verified | Grace timers and anti-clipping for reaction/action menus |
| **Linked Devices** | **Allowed Placeholder** | **Verified (Placeholder)** | Polished Settings surface (`/settings/linked-devices`) showing active desktop session and secondary device pairing notice |
| Voice & video calls | Allowed Placeholder | Verified (Placeholder) | Polished Signal dialogs detailing desktop demo scope |
| Stories | Allowed Placeholder | Verified (Placeholder) | Signal-style layout with "My Story" and contact status cards |
| Encrypted Backups / Privacy | Allowed Placeholder | Verified (Placeholder) | Realistic Signal Desktop preference cards and toggle switches |
| Attachments, disappearing messages, Signal E2EE, mobile apps | Excluded Scope | Intentionally Excluded | Kept out of scope to prioritize desktop core polish |

---

## C. Theme System & Visual Language

- **Signal Dark:** Grounded in deep charcoal `#121214` and slate `#1a1a1e`, matching official Signal Desktop dark mode.
- **Signal Light:** Clean minimalist canvas (`#f5f5f8` / `#ffffff`) with subtle borders and clear contrast.
- **Dynamic Accent Color:** Configurable in Appearance settings (Signal Blue, Emerald, Violet, Crimson, Amber, Graphite).
- **Persistence:** Stored in `localStorage` (`signal_theme`) and synced across page reloads with zero flash of unstyled content.

---

## D. Message Actions & Spatial Anchoring

- **Hover Actions Toolbar:** Positioned immediately adjacent to the hovered message bubble (adapts to left for outgoing, right for incoming) with no detached gap.
- **Emoji Picker:** Opens directly above the action bar and bubble.
- **Reaction Result:** Aggregated chips render directly beneath the message bubble with active toggle indicators.
- **Quoted Replies:** Renders with original sender identification, left accent border, and smooth click-to-scroll navigation to the referenced message.

---

## E. Seed Data

- **Primary Demo Account:** `om` / phone `+919842946727` — Password or OTP `123456`
- **Second Account:** `rahul` / phone `+919842946728` — Password or OTP `123456`
- **Other Demo Users:** `priya`, `arjun`, `neha`, `kavya` — Password or OTP `123456`
- **Pre-seeded Conversations:**
  - Direct 1:1 threads: Om ↔ Rahul, Om ↔ Priya, Om ↔ Neha
  - Group Chat: **Scaler AI Labs** (Om & Rahul admins; Priya, Arjun, Neha members) with multi-user replies and reactions.

---

## F. Production Deployment & Verification Status

### Production Endpoints

- **Frontend:** [https://signal-clone-pi.vercel.app](https://signal-clone-pi.vercel.app)
- **Backend API:** [https://signal-clone-production-f521.up.railway.app](https://signal-clone-production-f521.up.railway.app)
- **Health Check:** [https://signal-clone-production-f521.up.railway.app/health](https://signal-clone-production-f521.up.railway.app/health)
- **GitHub Repository:** [https://github.com/SlayerBit/signal-clone](https://github.com/SlayerBit/signal-clone)
- **Production Database:** SQLite database at `/data/app.db` on a persistent Railway volume mounted at `/data`.

### Verification Status & Boundaries

| Component / Flow | Environment | Status | Verification Evidence |
|------------------|-------------|--------|-----------------------|
| Backend `/health` endpoint | Production (Railway) | **Verified** | Live HTTP GET returns `{"status":"ok"}` |
| Frontend initial page load | Production (Vercel) | **Verified** | Live HTTP/2 GET returns 307 redirect to `/login` |
| REST API Unit & Integration Tests | Local (.venv) | **Verified** | 11/11 tests passing via `pytest tests/ -k "not visual_qa"` |
| Browser Visual QA & Multi-User Live Suite | Local (Chromium) | **Verified** | Passes via `python tests/visual_qa.py` (screenshots + dual session) |
| Live Production End-to-End Auth & WebSockets | Production (Cross-Origin) | **Configured** | Configured with `SameSite=None`, `Secure=True`, and CORS origin matching; not claimed as post-deployment verified against production live instances without active end-to-end telemetry. |


# Project Specification — Secure Messaging Platform (Signal Clone)

## A. Assignment requirements (authoritative)

| Area | Requirement |
|------|-------------|
| Stack | Next.js 15 (App Router) + TypeScript, Python FastAPI, SQLite (ACID compliant), WebSockets |
| Auth | Register (phone/username), mock OTP (`123456`), profile, login/logout, persistent session cookies |
| Contacts | Conversation list, search chats & contacts, add contact, unread badges, previews, online/last-seen |
| 1:1 chat | Real-time text, timestamps, delivery/read receipts, typing indicators, message lifecycle, DB persistence |
| Groups | Create, name, members, messaging, view/add/remove members, admin enforcement, persistence |
| UX | Signal Desktop shell (Nav rail, chats sidebar, chat pane, composer, floating anchored action pills) |
| Themes | **Signal Dark & Signal Light modes** with instant switching and persistent state |
| Search | Dual search: conversation/contact list filter + in-chat message search with term highlighting |
| Seed | Immediately demoable with multiple users, conversations, groups, messages, replies, and reactions |
| Deliverables | `frontend/`, `backend/`, comprehensive documentation, visual QA automation suite |

## B. Feature matrix

| Feature | Class | Status | Implementation Details |
|---------|-------|--------|------------------------|
| Registration (username/phone) | Mandatory | Implemented | Multi-step registration flow with verification |
| Mock OTP (`123456`) | Mandatory | Implemented | Instant verification for streamlined evaluator demos |
| Display name & avatar | Mandatory | Implemented | Initial avatar with dynamic color badge |
| Login / logout / session cookie | Mandatory | Implemented | HTTP-only session cookies with refresh persistence |
| Conversation list (recent sort) | Mandatory | Implemented | Auto-reordering on new messages and receipts |
| Search conversations & contacts | Mandatory | Implemented | Debounced real-time contact and thread search |
| Add contact | Mandatory | Implemented | Via user discovery / username lookup |
| Unread / last message preview | Mandatory | Implemented | Unread counters, sender receipts, preview text |
| Online / last-seen | Mandatory | Implemented | Real-time WebSocket presence ping & DB fallback |
| 1:1 real-time messaging | Mandatory | Implemented | Full-duplex WebSocket broadcast & REST fallback |
| Message lifecycle | Mandatory | Implemented | `sending` → `sent` → `delivered` → `read` |
| Typing indicators | Mandatory | Implemented | Real-time typing start/stop with debounced cleanup |
| Group create & messaging | Mandatory | Implemented | Multi-member groups with real-time distribution |
| Group member admin ops | Mandatory | Implemented | Add/remove member authorization with admin roles |
| In-chat message search | Enhancing UX | Implemented | Match navigation, counter, and text highlighting |
| **Reply / quoted messages** | **Selected bonus** | Implemented | Composer preview, anchored actions, click-to-scroll |
| **Emoji reactions** | **Selected bonus** | Implemented | Spatially anchored picker, aggregated chips beneath bubble |
| **Light & Dark themes** | **Selected bonus** | Implemented | CSS design tokens, instant toggle, persistent state |
| Voice/video calls | Product state | Implemented | Polished Signal dialogs explaining demo scope |
| Stories | Product surface | Implemented | Signal-style layout with "My Story" and status card |
| Encrypted Backups / Privacy | Product state | Implemented | Realistic Signal Desktop preference cards and toggles |
| Attachments, disappearing messages, keyboard shortcuts, mobile work | **Excluded** | Intentionally Excluded | Kept out of scope to prioritize desktop core polish |

## C. Theme System & Visual Language

- **Signal Dark:** Grounded in deep charcoal `#121214` and slate `#1a1a1e`, matching official Signal Desktop dark mode.
- **Signal Light:** Clean minimalist canvas (`#f5f5f8` / `#ffffff`) with subtle borders and clear contrast.
- **Dynamic Accent Color:** Configurable in Appearance settings (Signal Blue, Emerald, Violet, Crimson, Amber, Graphite).
- **Persistence:** Stored in `localStorage` (`signal_theme`) and synced across page reloads with zero flash of unstyled content.

## D. Message Actions & Spatial Anchoring

- **Hover Actions Toolbar:** Positioned immediately adjacent to the hovered message bubble (adapts to left for outgoing, right for incoming) with no detached gap.
- **Emoji Picker:** Opens directly above the action bar and bubble.
- **Reaction Result:** Aggregated chips render directly beneath the message bubble with active toggle indicators.
- **Quoted Replies:** Renders with original sender identification, left accent border, and smooth click-to-scroll navigation to the referenced message.

## E. Seed Data

- **Demo login:** `om` / phone `+919842946727` — Password or OTP `123456`
- **Second account:** `rahul` / phone `+919842946728` — Password or OTP `123456`
- **Other users:** `priya`, `arjun`, `neha`, `kavya`
- Pre-seeded 1:1 threads and the **Scaler AI Labs** group with replies and reactions.

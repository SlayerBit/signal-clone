# Secure Messaging Platform (Signal Clone)

Scaler AI Labs SDE Fullstack Assignment — Production-quality Signal Desktop experience built with **Next.js 15 (App Router)**, **Python FastAPI**, **SQLite (ACID compliant)**, and **WebSockets**.

---

## Key Highlights & Implemented Bonuses

In addition to all core mandatory requirements, three optional enhancements have been implemented:

1. **Reply-to / Quoted Messages:** Spatially anchored reply action on hover, real-time quote preview in the composer with dismiss control, embedded quotes inside message bubbles, and smooth click-to-scroll navigation to the referenced message.
2. **Emoji Reactions:** Contextually anchored reaction pill adjacent to message bubbles, instant emoji popup picker (`👍`, `❤️`, `😂`, `😮`, `😢`, `🔥`), aggregated interactive reaction chips rendered directly beneath the bubble, and real-time synchronization.
3. **Signal Light & Dark Theme Support:** Centralized CSS design token system supporting both **Signal Dark** and **Signal Light** modes. Accessible via the App menu and Settings > Appearance, with persistent state stored in `localStorage` and zero flash on load. Includes custom chat accent color selection (Signal Blue, Emerald, Violet, Crimson, Amber, Graphite).
4. **In-Chat Message Search:** Instant substring search across messages in the active thread with hit counter ("X of Y matches"), Previous/Next navigation controls, `<mark>` term highlighting, and auto-scroll.

---

## Demo Accounts

| User | Login identifier | Password / OTP | Notes |
|------|------------------|----------------|-------|
| **Om** (primary demo) | `om` or `+919842946727` | `123456` | Primary admin account with seeded chats |
| **Rahul** | `rahul` or `+919842946728` | `123456` | Active chat partner for multi-user testing |
| Priya | `priya` | `123456` | Contact with message history |
| Arjun | `arjun` | `123456` | Group member |
| Neha | `neha` | `123456` | Contact with message history |
| Kavya | `kavya` | `123456` | Contact |

> **Mock OTP:** Use **`123456`** for any OTP verification flow.

---

## Seeded Data & Workflows to Test

- **Direct Chats:** Om ↔ Rahul, Om ↔ Priya, Om ↔ Neha.
- **Group Chat:** **Scaler AI Labs** (Om & Rahul admins; Priya, Arjun, Neha members) with multi-user replies and reactions.
- **Message Hover Actions:** Hover any message bubble to see the floating pill toolbar (`Smile`, `Reply`, `More`) appear immediately adjacent to the bubble.
- **Emoji Reactions:** Click `Smile` or reaction chips below bubbles to add/toggle reactions.
- **Quoted Replies:** Click `Reply` on any message to populate the composer quote bar. Click quoted text in a message bubble to jump to the original message.
- **In-Chat Search:** Click the Search icon in the chat header, type a search phrase (e.g. `test` or `message`), and navigate matches with Enter/Shift+Enter.
- **Theme Switcher:** Switch between Signal Dark and Signal Light in `Settings > Appearance` or via the hamburger menu in the left rail.
- **Voice & Video Call Dialogs:** Click Phone or Video icons in the chat header to see polished Signal dialogs detailing demo capability scope.
- **Stories Surface:** Click the Stories icon in the navigation rail to explore the Signal Stories surface with "My Story" and contact updates.

---

## Multi-User Realtime Testing

1. Open **Browser A** (normal window): Login as `om`.
2. Open **Browser B** (incognito window): Login as `rahul`.
3. Open the **Om ↔ Rahul** conversation in both windows.
4. Type in Browser A: Browser B immediately displays the typing indicator (`Om is typing…`).
5. Send a message from Browser A: Browser B instantly renders the incoming message and marks it as delivered/read.
6. React with an emoji or send a quoted reply: Updates broadcast instantaneously to both sessions.

---

## Tech Stack

- **Frontend:** Next.js 15 (Turbopack, App Router), TypeScript, Tailwind CSS, Zustand, Lucide React
- **Backend:** Python 3.11+, FastAPI, SQLAlchemy, SQLite, Pydantic, WebSockets
- **Testing:** Pytest (API & integration suite) + Playwright (end-to-end visual QA & multi-user live session testing)

---

## Local Setup

### 1. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env   # optional; defaults work out of the box
mkdir -p data
PYTHONPATH=. python seed/run.py
uvicorn main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
echo "NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws" >> .env.local
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to open the application.

---

## Automated Testing

### Backend Unit & Integration Tests:
```bash
cd backend
PYTHONPATH=. pytest tests/ -k "not visual_qa"
```

### Browser Automation & Visual QA:
```bash
cd backend
python tests/visual_qa.py
```
This automated suite captures full-screen screenshots across all major views in both themes, tests message hover actions, reaction pickers, replies, search, dialogs, and runs a live 2-user simultaneous WebSocket session.

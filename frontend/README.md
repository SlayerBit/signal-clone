# Signal Clone — Frontend Web Client

Next.js 15 (App Router) client application for the Signal Desktop web experience.

## Production Deployment

- **Live URL:** [https://signal-clone-pi.vercel.app](https://signal-clone-pi.vercel.app)
- **Hosting:** Vercel
- **Backend API:** `https://signal-clone-production-f521.up.railway.app`
- **WebSocket URL:** `wss://signal-clone-production-f521.up.railway.app/ws`

---

## Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env.local` file in the `frontend/` directory:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
```

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

| Variable | Description | Default (Local) | Production Example |
|----------|-------------|-----------------|--------------------|
| `NEXT_PUBLIC_API_URL` | Base URL for FastAPI REST endpoints | `http://localhost:8000` | `https://signal-clone-production-f521.up.railway.app` |
| `NEXT_PUBLIC_WS_URL` | Full-duplex WebSocket connection URL | `ws://localhost:8000/ws` | `wss://signal-clone-production-f521.up.railway.app/ws` |

---

## Build & Quality Commands

```bash
# Type check and production build
npm run build

# Start production build locally
npm run start

# Run ESLint
npm run lint
```


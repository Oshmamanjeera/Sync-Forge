# SyncForge - Real-Time Collaborative Code Editor

SyncForge is a full-stack, real-time collaborative code editor built with a dark IDE aesthetic, CodeMirror, Socket.IO, Judge0 code execution, LiveKit Cloud video conferencing, and Google Gemini AI Copilot.

---

## 🚀 Architecture & Tech Stack

### Frontend (`/syncforge`)
- **Framework**: React 18 with Vite
- **Routing**: `react-router-dom`
- **Editor**: `@uiw/react-codemirror`
- **Language Grammars**:
  - `@codemirror/lang-javascript` (JavaScript / JSX)
  - `@codemirror/lang-python` (Python)
  - `@codemirror/lang-cpp` (C++)
  - `@codemirror/lang-java` (Java)
  - `@codemirror/lang-html` (HTML)
- **Theme**: `@codemirror/theme-one-dark`
- **Real-time Engine**: `socket.io-client`
- **Video & Audio**: `@livekit/components-react`, `@livekit/components-styles`, `livekit-client`
- **Icons**: `lucide-react`
- **Design**:
  - Background `#0f1117` with subtle dot-grid
  - Panels `#161822`, Borders `#262a3a`
  - Amber accent `#f2a93b`, Teal accent `#33d6a6`
  - Fonts: *JetBrains Mono* (code, headings, tabs) & *Inter* (UI)
  - Logo: `Sync-Forge` with a blinking teal cursor

### Backend (`/syncforge-server`)
- **Runtime**: Node.js 18+ (Node 20 LTS)
- **Server**: Express & HTTP server
- **Real-time Gateway**: `socket.io`
- **Security & CORS**: `cors`, `dotenv`
- **Video Signaler**: `livekit-server-sdk`
- **AI Integration**: `@google/genai` (Gemini Flash model: `gemini-flash-latest`)
- **Execution Service**: Judge0 CE Public API

---

## 📂 Project Structure

```text
syncforge-project/
├── syncforge/                    # React + Vite Frontend
│   ├── .env.example              # Sample frontend environment config
│   ├── .env                      # Local frontend configuration
│   ├── index.html                # HTML template with Google Fonts
│   ├── vite.config.js            # Vite bundler configuration
│   ├── package.json
│   └── src/
│       ├── main.jsx              # Application bootstrap & router
│       ├── index.css             # Theme, dot-grid, scrollbars, blinking cursor
│       ├── socket.js             # Singleton Socket.IO instance
│       ├── App.jsx               # Route definitions
│       ├── pages/
│       │   ├── Home.jsx          # Room creation & joining portal
│       │   └── RoomPage.jsx      # Collaborative IDE workspace
│       └── components/
│           ├── Navbar.jsx        # Navigation & studio controls
│           ├── ParticipantsDropdown.jsx # Google Meet style presence menu
│           ├── Toasts.jsx        # Join/leave event toasts
│           ├── ChatSidebar.jsx   # Dual-channel chat with cursor hover effect
│           ├── OutputPanel.jsx   # Execution terminal
│           ├── VideoCallArea.jsx # LiveKit video stage & controls
│           └── AICopilotSidebar.jsx # Gemini AI code assistant
│
├── syncforge-server/             # Express + Socket.IO Backend
│   ├── .env.example              # Sample backend environment config
│   ├── .env                      # Local backend secrets
│   ├── package.json
│   ├── test-syncforge.js         # End-to-end integration test suite
│   └── src/
│       └── server.js             # Express API & Socket.IO server
│
└── README.md                     # Full setup & documentation
```

---

## 🛠️ Getting Started

### Prerequisites
- Node.js 18 or higher (Node 20 recommended)
- npm or pnpm

### 1. Backend Setup (`syncforge-server`)

1. Open a terminal and navigate to `syncforge-server`:
   ```bash
   cd syncforge-server
   ```
2. Copy environment file and configure keys:
   ```bash
   cp .env.example .env
   ```
3. Update `.env` with your credentials:
   ```ini
   PORT=5000
   CLIENT_ORIGIN=http://localhost:5173

   # LiveKit Cloud (Optional for Video Calls)
   LIVEKIT_API_KEY=your_livekit_api_key
   LIVEKIT_API_SECRET=your_livekit_api_secret

   # Google Gemini API Key (For AI Copilot)
   GEMINI_API_KEY=your_gemini_api_key
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start the backend:
   ```bash
   npm start
   # Or for auto-reload during development:
   npm run dev
   ```
   The backend will start listening at `http://localhost:5000`.

---

### 2. Frontend Setup (`syncforge`)

1. In a separate terminal, navigate to `syncforge`:
   ```bash
   cd syncforge
   ```
2. Copy environment file:
   ```bash
   cp .env.example .env
   ```
3. Verify environment variables in `.env`:
   ```ini
   VITE_SERVER_URL=http://localhost:5000
   VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start the Vite development server:
   ```bash
   npm run dev
   ```
6. Open your browser and navigate to `http://localhost:5173`.

---

## 🧪 Verification & Automated Testing

An automated end-to-end integration test is provided in `syncforge-server/test-syncforge.js`. It validates:
- **Health Check**: Confirms server availability and active room metrics.
- **Stage 1 & 2 (Rooms, Code Sync, Host Tracking)**:
  - Verifies first user joins and is designated as Host by username.
  - Verifies room state & code sync to second client upon joining.
  - Verifies live bidirectional code change broadcasts without infinite loops (`isRemoteChange` ref).
  - Verifies `user-joined` and `user-left` events.
  - Verifies host reassignment to the longest-present user when the host disconnects.
- **Stage 3 (Chat)**:
  - Verifies message transmission on both `casual` and `important` channels.
  - Verifies chat history persistence per room.
- **Stage 4 (Code Execution)**:
  - Executes code through Judge0's public CE endpoint and asserts output.
- **Stage 5 (Video Conference)**:
  - Requests a signed LiveKit JWT AccessToken from `/get-livekit-token`.
- **Stage 6 (AI Copilot)**:
  - Calls `/ai-copilot` verifying communication with Google Gemini.

To run the verification test suite:
```bash
cd syncforge-server
node test-syncforge.js
```

---

## 🧩 Architectural Highlights & Bug Prevention

1. **Singleton Socket Connection**: Socket.IO client is instantiated exactly once in `src/socket.js` and imported into components, preventing duplicate sockets on re-renders.
2. **Clean Event Cleanup**: Named callback functions are used for `socket.on` and `socket.off` so that React 18 StrictMode mount-unmount cycles cleanly clean up listeners without leaking handlers.
3. **Top-Level Socket Handlers**: In `server.js`, all `socket.on` handlers are registered directly at the top level of `io.on('connection')`.
4. **Echo Prevention**: An `isRemoteChange` ref flag ensures incoming remote code edits do not trigger unnecessary outbound broadcasts.
5. **Presence & Host Tracking by Username**: The host is tracked by username rather than socket ID, allowing a user who refreshes to maintain their host privileges.
6. **Dynamic Tab Cursor Highlight**: Dual chat tabs implement cursor-tracking coordinates to cast a soft teal/green spotlight that follows mouse movement across the bar.
7. **Production-Ready Bundling**: Vite code splits and optimizes CodeMirror language modules into a fast static production build.


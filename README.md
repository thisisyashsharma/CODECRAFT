# CodeCraft ⚡
### Real-Time Collaborative Code Editor & Interactive Canvas Workspace

CodeCraft is an ultra-modern, full-stack collaborative IDE and virtual workspace built for developers, coding interviewers, students, and teams. It pairs real-time bi-directional code editing with an interactive collaborative whiteboard canvas and an integrated multi-language code execution engine.

---

## ✨ Features

- **⚡ Real-Time Code Synchronization**: Sub-millisecond synchronized code editing powered by Socket.io WebSockets.
- **🎨 Collaborative Whiteboard Canvas**: Create and share interactive canvas tabs to sketch system architectures, flowcharts, and diagrams in real-time with your team.
- **🚀 Integrated Code Execution Engine**: Run code directly inside the browser with input (`stdin`), output (`stdout`), error logs (`stderr`), and execution timing. Supports **JavaScript**, **Python**, **C++**, **Java**, **Rust**, and **Go**.
- **📑 Multi-Tab Workspace**: Effortlessly open, manage, switch, and close multiple code and canvas tabs in isolated collaborative rooms.
- **👥 Live Room Presence & Avatars**: Unique room ID generation, real-time collaborator list, dynamic user avatars, and instant join/leave toast notifications.
- **💎 Refined Dark UI/UX**: Built with Tailwind CSS, Lucide icons, glassmorphic floating toolbars, and responsive layouts tailored for desktop, tablet, and mobile.
- **📋 One-Click Room Sharing**: Quickly generate unique room IDs and copy invitation links to your clipboard.

---

## 🛠️ Tech Stack

### Frontend
- **React 18**: Modern component architecture and reactive state management.
- **CodeMirror 5**: High-performance editor with Dracula theme, auto-closing brackets, line numbering, and multiple language modes.
- **Tailwind CSS**: Custom dark titanium design system with glassmorphic micro-interactions.
- **Socket.io Client**: Robust WebSocket communication with auto-reconnection and polling fallback.
- **Lucide React**: Crisp vector iconography.
- **React Router v6**: Client-side single-page routing with dynamic room parameters.
- **React Hot Toast**: Real-time notifications and action alerts.

### Backend
- **Node.js & Express**: HTTP REST API and static asset hosting.
- **Socket.io**: Real-time WebSocket event orchestration, room management, and state broadcast.
- **Execution Engine**: Local child-process isolation for Node.js/Python combined with Wandbox remote compiler integration for compiled languages (C++, Java, Rust, Go).

---

## 📁 Project Structure

```
CODECRAFT/
├── public/                 # Static assets, HTML shell, and app icons
├── src/
│   ├── components/
│   │   ├── common/         # Buttons, animated counters, particle effects
│   │   ├── navigation/     # Responsive mobile navigation bars
│   │   ├── CollabCanvas.js # Multi-user HTML5 canvas whiteboard
│   │   ├── WorkspaceTabs.js# Dynamic workspace tab management
│   │   ├── editor.js       # CodeMirror collaborative editor wrapper
│   │   └── Client.js       # Collaborator avatar badge
│   ├── pages/
│   │   ├── Home.js         # Landing page to create or join rooms
│   │   └── EditorPage.js   # Main IDE workspace
│   ├── context/            # Global theme & application context
│   ├── Actions.js          # Shared Socket.io event constants
│   ├── socket.js           # Socket.io connection factory & fallback
│   ├── App.js              # Route definitions & notification container
│   └── index.css           # Tailwind CSS directives & global styling
├── server.js               # Express + Socket.io backend server
├── render.yaml             # Render.com blueprint configuration
├── vercel.json             # Vercel SPA routing rewrite configuration
└── package.json            # Scripts and dependencies
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### 1. Clone the Repository
```bash
git clone https://github.com/thisisyashsharma/CODECRAFT.git
cd CODECRAFT
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Locally

You can run both the frontend and the backend simultaneously:

#### Terminal 1: Start Backend Server
```bash
npm run server:dev
```
*Backend runs on `http://localhost:5000`*

#### Terminal 2: Start Frontend Development Server
```bash
npm run start:front
```
*Frontend opens at `http://localhost:3000`*

---

## 🌐 Deployment Guide

### Option 1: Deploy on Vercel (Frontend) + Render (Backend)

Because Vercel serverless functions do not maintain persistent WebSockets, host the backend on Render/Railway and the frontend on Vercel.

#### Step 1: Deploy the Backend on Render
1. Log in to [Render.com](https://render.com) and click **New +** > **Web Service**.
2. Connect your GitHub repository `thisisyashsharma/CODECRAFT`.
3. Set:
   - **Build Command**: `npm install`
   - **Start Command**: `npm run server:prod` (or `node server.js`)
   - **Plan**: Free
4. Deploy and copy your backend URL: e.g. `https://codecraft-backend.onrender.com`.

#### Step 2: Deploy Frontend on Vercel
1. Log in to [Vercel.com](https://vercel.com) and click **Add New...** > **Project**.
2. Select your `CODECRAFT` repository.
3. In **Environment Variables**, add:
   - **Name**: `REACT_APP_BACKEND_URL`
   - **Value**: `https://codecraft-backend.onrender.com` *(your Render backend URL)*
4. Click **Deploy**. Vercel will build and launch your frontend with full SPA route rewrites configured via `vercel.json`.

---

### Option 2: Unified Single-Service Deployment (Render / Railway)

You can also deploy CodeCraft as a **single unified service** where `server.js` serves both the static production React build and WebSockets:

1. Create a new **Web Service** on Render or Railway from this repo.
2. Set:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
3. Everything (Frontend UI, Socket.io, and Code Runner) will run under one URL with zero extra configuration!

---

## 📡 Socket.io Event Protocol

| Event | Origin | Description |
| :--- | :--- | :--- |
| `join` | Client $\rightarrow$ Server | Join a room with `{ roomId, username }` |
| `joined` | Server $\rightarrow$ Room | Broadcast updated client list & sync initial room state |
| `code-change` | Client $\leftrightarrow$ Server | Broadcast code buffer edits to all room participants |
| `sync-code` | Client $\rightarrow$ Target Client | Transmit code snapshot to newly connected users |
| `language-change`| Client $\leftrightarrow$ Server | Synchronize programming language selection |
| `tab-open` | Client $\leftrightarrow$ Server | Synchronize opening a new code or whiteboard tab |
| `tab-close` | Client $\leftrightarrow$ Server | Synchronize closing a tab across all room occupants |
| `canvas-draw` | Client $\leftrightarrow$ Server | Broadcast real-time canvas drawing strokes |
| `canvas-clear` | Client $\leftrightarrow$ Server | Broadcast canvas reset |
| `disconnected` | Server $\rightarrow$ Room | Notify collaborators when a user disconnects |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl` + `Enter` / `Cmd` + `Enter` | Execute Code |
| `Escape` | Close Console Drawer / Dismiss Dialogs |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to open an issue or submit a pull request:
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — feel free to use it for personal, commercial, or educational projects.

# IntellMeet — AI-Powered Enterprise Meeting & Collaboration Platform

IntellMeet is a production-grade full-stack MERN enterprise platform combining real-time WebRTC video meetings, AI meeting intelligence, team chat, post-meeting dashboards, and Kanban task management.

## 🚀 Repository Structure

```
IntellMeet/
├── client/          # React 19 + TypeScript + Vite Frontend (shadcn/ui, Tailwind CSS v4, Zustand, TanStack Query)
├── server/          # Node.js + Express + TypeScript Backend (MongoDB, Redis, Socket.io, JWT Auth)
└── .gitignore       # Git ignore settings
```

## 🛠️ Tech Stack Overview

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, TanStack Query
- **Backend**: Node.js, Express, Mongoose (MongoDB), Redis, Socket.io
- **Security**: JWT (Access + Refresh Tokens in httpOnly cookies), Bcrypt password hashing, Helmet, Rate Limiting
- **Real-Time**: Socket.io + WebRTC (Signaling contract with `join-room`, `offer`, `answer`, `ice-candidate`, `send-message`)

---

## ⚡ Quick Start Guide (Local Setup)

### 1. Environment Variables Setup

Create a `.env` file in `/server` directory:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/intellmeet
JWT_SECRET=super_secret_access_jwt_key_2026
JWT_REFRESH_SECRET=super_secret_refresh_jwt_key_2026
REDIS_URL=redis://localhost:6379
CLIENT_URL=http://localhost:5173
```

### 2. Install & Run Server (Backend)

```bash
cd server
npm install
npm run dev
```

### 3. Install & Run Client (Frontend)

```bash
cd client
npm install
npm run dev
```

---

## 🔐 WebRTC Socket.io Signaling Contract & Event Reference

- `join-room`: Joins a specific meeting room session.
- `leave-room`: Leaves the current meeting room session.
- `offer`: Transmits WebRTC SDP offer to peer target.
- `answer`: Transmits WebRTC SDP answer back to host peer.
- `ice-candidate`: Exchanges ICE candidates for peer-to-peer connection setup.
- `send-message`: Transmits in-meeting chat messages scoped strictly to `meetingId`.
- `new-message`: Broadcasts incoming chat to all participants in the meeting room.
- `action-item-assigned`: Emits real-time task assignment notification.

---

## 🛡️ Security Architecture & Tradeoffs

### Refresh Token Security: `httpOnly` Cookie vs `localStorage`
- **localStorage**: Vulnerable to Cross-Site Scripting (XSS) attacks. If an attacker injects malicious JavaScript, they can access tokens directly.
- **httpOnly Cookies**: Protected against client-side JavaScript theft. Browsers automatically attach cookies to requests without exposing the raw secret to client scripts. Combined with `SameSite=Strict` and `Secure` flags, it significantly prevents XSS token theft and CSRF attacks.

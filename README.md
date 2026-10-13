# IntellMeet — AI-Powered Enterprise Meeting & Collaboration Platform

IntellMeet is a production-grade full-stack MERN enterprise platform combining real-time WebRTC video meetings, AI meeting intelligence, team chat, post-meeting dashboards, and Kanban task management.

## 🚀 Monorepo Repository Structure

```
IntellMeet/
├── client/                 # React 19 + TypeScript + Vite Frontend (shadcn/ui, Tailwind CSS v4, Zustand)
│   ├── Dockerfile          # Nginx production container build
│   └── src/
├── server/                 # Node.js + Express + TypeScript Backend (MongoDB, Redis, Socket.io, JWT Auth)
│   ├── Dockerfile          # Multi-stage production container build
│   ├── k8s/                # Kubernetes manifests & service deployments
│   ├── helm/               # Configurable Helm charts & values.yaml
│   └── src/
├── .github/workflows/      # GitHub Actions CI/CD Pipeline (lint, test, build, deploy)
└── docker-compose.yml      # Local full-stack cluster container orchestration
```

---

## 🛠️ Complete 4-Week Execution Breakdown (Zidio Development)

### 🔹 Week 1 – Core Backend & Authentication Foundation
- **Architecture Setup**: Configured Node.js, Express, TypeScript, and MongoDB connection with robust folder architecture.
- **Authentication & Security**: Built JWT access token + refresh token cookie rotation, bcrypt password hashing, rate limiting, and RBAC (Admin/Member).
- **Meeting Schema & Signaling**: Created Meeting models, CRUD endpoints, and initial Socket.io signaling server (`join-room`, `offer`, `answer`, `ice-candidate`).
- **Caching & Real-Time**: Integrated Redis for session and room state caching with event-driven notifications.

### 🔹 Week 2 – Frontend & Real-Time Video Meeting Core
- **Modern UI Setup**: Built high-performance React 19 + Vite frontend with Tailwind CSS, Lucide icons, and Zustand state store.
- **Meeting Room & WebRTC**: Developed full WebRTC peer-to-peer video streaming with adaptive multi-user grid and live participant presence.
- **In-Meeting Controls**: Uniform touch-responsive squircle control dock (Mic, Camera, Screen Share, Recording, Mute All).
- **Collaboration & Chat**: Integrated real-time bidirectional in-meeting chat, participant lists, and invite links.

### 🔹 Week 3 – AI Meeting Intelligence & Agile Collaboration
- **AI Speech-to-Text & Summaries**: Integrated OpenAI transcription and automated AI meeting summary generation with key takeaways.
- **Action Item Extraction**: Automatic extraction of actionable tasks with owners and priority levels directly from transcripts.
- **Post-Meeting Hub**: Rich analytics dashboard showing meeting duration, participant attendance, summary downloads, and CSV exports.
- **Agile Kanban Board**: Drag-and-drop task workflow (`To Do`, `In Progress`, `Done`) with real-time socket updates.

### 🔹 Week 4 – Cloud Deployment, Mobile Responsiveness & Observability
- **Production Containerization**: Multi-stage Docker builds for client (Nginx) and server (Alpine Node.js) with docker-compose.
- **Kubernetes & Helm**: Authored Kubernetes manifests, services, and configurable Helm charts.
- **CI/CD Automation**: GitHub Actions pipeline for linting, typechecking, building, and deployment verification.
- **100% Cross-Device Responsiveness**: Mobile navigation drawer, touch controls, and adaptive grids tested across iPhone, Android, tablet, and desktop.
- **Cloud Live Deployment**: Deployed live on Vercel (`https://intell-meet-zidio-dun.vercel.app/`) and Render (`https://intellmeet-zidio-ff1v.onrender.com`).
- **Observability**: Prometheus `/metrics` monitoring and system health endpoints.

---

## ⚡ Quick Start Guide (Local Development Setup)

### 1. Environment Variables (`server/.env`)

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/intellmeet
JWT_SECRET=super_secret_access_jwt_key_2026
JWT_REFRESH_SECRET=super_secret_refresh_jwt_key_2026
REDIS_URL=redis://127.0.0.1:6379
CLIENT_URL=http://localhost:5173
OPENAI_API_KEY=your_openai_key_here
```

### 2. Run with Docker Compose (One-Command Full Stack)

```bash
docker-compose up --build
```

---

## 📽️ Submission Deliverables Checklist (Zidio Development / LogicVeda)

- [x] **Project Documentation PDF**: Structure prepared following pages 8-12 guidelines.
- [x] **GitHub Repository**: Organized MERN monorepo structure.
- [x] **README.md**: Comprehensive architecture and setup guide.
- [x] **Live Demo Setup**: Configured for Vercel/Render deployment.
- [x] **Observability**: Prometheus `/metrics` endpoint configured.

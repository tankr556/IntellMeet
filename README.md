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

## 🛠️ Complete 4-Week Technical Architecture

### 1. Backend & Real-Time Engine (Week 1 & 2)
- **Node.js + Express**: REST API server with JWT access token + httpOnly refresh token cookie rotation.
- **WebRTC + Socket.io**: Low-latency peer-to-peer video conferencing signaling (`join-room`, `offer`, `answer`, `ice-candidate`).
- **Redis Session Caching**: Event-driven room metadata isolation and pub/sub adapter setup.

### 2. AI Intelligence & Team Collaboration (Week 3)
- **OpenAI Speech & GPT Intelligence**: Automated speech-to-text transcription, AI summaries, and structured action item extraction.
- **Post-Meeting Hub**: Summary dashboard with CSV exports and instant action item conversion.
- **Agile Kanban Board**: 3-Column task workflow (`To Do`, `In Progress`, `Done`) with real-time status updates.

### 3. Containerization, Kubernetes & Observability (Week 4)
- **Docker Multi-Stage**: Lightweight production images using Alpine Linux and Nginx reverse proxy.
- **Kubernetes + Helm**: Replicated microservice deployment manifests and configurable `values.yaml`.
- **GitHub Actions CI/CD**: Automated linting, building, container packaging, and deployment pipeline.
- **Prometheus Observability**: Active `/metrics` endpoint for monitoring request rates and WebRTC socket connection health.

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

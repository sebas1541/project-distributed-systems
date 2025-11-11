# Smart Planner AI

Task manager with voice input and AI insights.

**Team**: Natalia Bernal, Sebastián Cañón Castellanos

## Quick Start

### 1. Backend
```bash
git clone https://github.com/sebas1541/project-distributed-systems
cd project-distributed-systems
docker-compose up --build
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## Environment Setup

Create a `.env` file with:
```bash
# Google OAuth (for auth + calendar)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_secret

# Google Gemini AI (for insights)
GEMINI_API_KEY=your_api_key
```

Get keys from:
- Google OAuth: [console.cloud.google.com](https://console.cloud.google.com)
- Gemini API: [aistudio.google.com](https://aistudio.google.com)

## How It Works

### Architecture
5 microservices + frontend communicating through **Traefik** (API Gateway) and **RabbitMQ** (message broker):

```
Frontend (Next.js) → Traefik → Microservices
                        ↓
                    RabbitMQ (events)
```

**Services:**
- **Auth Service**: JWT authentication
- **Task Service**: CRUD operations
- **AI Service**: Voice transcription (Whisper) + NLP
- **Scheduler Service**: Google Calendar sync
- **Insights Service**: AI insights (Gemini) + WebSocket notifications

### Traefik Routes
All backend requests go through Traefik on port 80:
```
/api/auth/*      → Auth Service (3001)
/api/tasks/*     → Task Service (3002)
/api/ai/*        → AI Service (3003)
/api/scheduler/* → Scheduler Service (3004)
/api/insights/*  → Insights Service (3005)
/notifications   → WebSocket for real-time notifications
```

### RabbitMQ Flow
Event-driven communication between services:

```
Voice Recording → AI Service (Whisper + NLP)
       ↓
   Extract task data
       ↓
   Publish to 'tasks' exchange → task.created
       ↓
   ┌──────────────┬──────────────┐
   ↓              ↓              ↓
Scheduler     Insights      Task Service
(Calendar)  (Notifications)   (Database)
```

**Exchanges**: `tasks`, `notifications`  
**Queues**: 5 total (insights, scheduler events)  
**Events**: task.created, task.updated, task.deleted

## Tech Stack

**Backend**: NestJS, PostgreSQL, Redis, RabbitMQ  
**Frontend**: Next.js 15, React, Tailwind, Socket.IO  
**AI**: Whisper.cpp, Google Gemini  
**Infra**: Docker, Traefik

# Locus - Self-hosted Computer Vision Platform

A modern, self-hosted computer vision platform for zone-based detection and analytics.

## Project Structure

```
locus/
├── frontend/          # Next.js web application
├── backend/           # FastAPI backend API
├── database/          # Database schemas
├── docs/              # Documentation
├── docker-compose.yml # Container orchestration
└── README.md
```

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- Or for local development:
  - Node.js 20+
  - Python 3.12+
  - [uv](https://docs.astral.sh/uv/) (Python package manager)

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/Kongesque/zonenet-ui.git
cd zonenet-ui

# Start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Local Development

**Backend:**
```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/health` | Health check | No |
| POST | `/api/auth/login` | Login with password | No |
| POST | `/api/auth/logout` | Logout (clear cookie) | Yes |
| GET | `/api/auth/me` | Check auth status | Yes |

## Environment Variables

Create a `.env` file in the root directory:

```env
# Auth
LOCUS_PASSWORD=your-secure-password
SECRET_KEY=your-secret-key

# URLs
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Features

- 🔐 Simple password authentication
- 📹 Real-time video stream monitoring
- 🎯 Zone-based object detection
- 📊 Analytics dashboard
- 🐳 Docker-ready deployment

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend  | Next.js 15, React, Tailwind CSS, shadcn/ui |
| Backend   | FastAPI, Python 3.12, Pydantic |
| Database  | SQLite (events), DuckDB (analytics) |
| Auth      | JWT cookies, single password |

## License

MIT
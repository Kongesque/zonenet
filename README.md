# Locus - Self-hosted Spatial Analytics Platform

A modern, self-hosted Spatial Analytics platform for zone-based detection and analytics.

## Project Structure

```
locus/
├── frontend/          # Next.js web application
├── backend/           # FastAPI backend API
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
git clone https://github.com/Kongesque/locus.git
cd locus

# Start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Local Development

**Prerequisite:** Ensure you have Node.js and Python/uv installed.

```bash
# Install dependencies for both services
make install

# Start backend and frontend in parallel with hot-reload
make dev
```

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

Full interactive API documentation is available at:
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Core Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/health` | System health check | No |
| POST | `/api/auth/setup` | Initial password setup (first run only) | No |
| GET | `/api/auth/status` | Check if setup is complete | No |
| POST | `/api/auth/login` | Login with password (sets HTTP-only cookie) | No |
| POST | `/api/auth/logout` | Logout (clears cookie) | Yes |
| GET | `/api/auth/me` | Check current session status | Yes |

## Environment Variables

Create a `.env` file in the root directory (or `backend/.env` for backend-only dev).

```env
# Auth (REQUIRED)
LOCUS_PASSWORD=your-secure-password
SECRET_KEY=your-secret-key-change-this-in-prod

# URLs
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000

# Backend Options
DEBUG=True
RESET_PASSWORD=False  # Set to True and restart to reset admin password
```

## Key Features

- **🔐 Secured Access**: Simple but secure single-password authentication with Argon2id hashing and HttpOnly cookies.
- **📹 Real-time Monitoring**: Low-latency video streaming support.
- **🎯 Zone Analytics**:
    - Draw custom polygon zones on video.
    - **YOLO11 Object Detection**: State-of-the-art object detection (Nano model default).
- **🐳 Production Ready**: Dockerized deployment with automated health checks.

## API Endpoints

Full interactive API documentation is available at:
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Core Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/health` | System health check | No |
| POST | `/api/auth/setup` | Initial password setup (first run only) | No |
| POST | `/api/auth/login` | Login with password (sets HTTP-only cookie) | No |
| GET | `/api/auth/me` | Check current session status | Yes |

### Video Analytics Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/video/upload` | Upload video for processing | Yes |
| POST | `/api/video/{id}/process` | Start async YOLO processing job | Yes |
| GET | `/api/video/tasks` | List all analytic tasks | Yes |
| GET | `/api/video/{id}/stream` | Stream original video | Yes |
| GET | `/api/video/{id}/result` | Stream processed (annotated) video | Yes |

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend**  | Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, Recharts |
| **Backend**   | FastAPI, Python 3.12, Pydantic, uv, SlowAPI |
| **AI / ML**   | YOLO11 (Ultralytics), OpenCV, NumPy |
| **Database**  | SQLite (auth, events), DuckDB (analytics) |
| **Auth**      | Single Password, Argon2id, JWT (HttpOnly Cookies) |

## License

MIT
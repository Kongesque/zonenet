# ZoneNet: AI Object Counter & Analytics | Custom Region Tracking w/ YOLO11 👁️

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)
![YOLO11](https://img.shields.io/badge/YOLO-11-green)
![Next.js 15](https://img.shields.io/badge/Next.js-15-black)

ZoneNet is a professional-grade **Computer Vision** application for **Real-time Object Counting** and **Video Analytics**. Using **YOLO11** and **ByteTrack**, it enables **Custom Regions of Interest (ROI)** for accurate tracking in retail, traffic, livestock, and industrial scenarios.

![ZoneNet AI Object Counting Demo with Custom Polygon Zones](demo/demo.gif)

## 🚀 Features

- **Custom ROI**: Draw polygons to count objects only in specific areas
- **Line Crossing Counter**: 2-point lines with **IN/OUT direction detection**
- **80 COCO Classes**: Select any object type (Person, Car, etc.)
- **Model Selection**: YOLO11 Nano to XLarge
- **Live Camera Support**: RTSP streams and webcams
- **Dwell Time Analysis**: Track how long objects stay in zones
- **Data Export**: CSV and JSON formats
- **Privacy-First**: All processing happens locally

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS v4 |
| **Backend** | FastAPI, Python 3.10+ |
| **AI/ML** | YOLO11, ByteTrack, OpenCV |
| **Database** | SQLite |

## 📦 Project Structure

```
ZoneNet/
├── frontend/                 # Next.js application
│   ├── src/app/             # Pages (home, zone, result, camera, live)
│   ├── src/components/      # React components
│   └── src/utils/           # API client, types
│
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── api/routes/      # API endpoints (jobs, camera, system)
│   │   ├── core/            # YOLO11 detection logic
│   │   ├── models/          # Pydantic schemas
│   │   └── services/        # DB, file handling, processing
│   └── pyproject.toml       # Python dependencies
│
├── docker-compose.yml        # Container orchestration
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- [uv](https://github.com/astral-sh/uv) (Python package manager)

### Installation

```bash
# Clone
git clone https://github.com/Kongesque/zonenet.git
cd zonenet

# Backend
cd backend && uv sync && cd ..

# Frontend
cd frontend && npm install && cd ..
```

### Running

**Development Mode:**

```bash
# Terminal 1 - Backend
cd backend
uv run uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Open **http://localhost:3000**

**Docker:**

```bash
docker-compose up --build
```

## 🎮 Usage

1. **Upload** a video (MP4, WebM)
2. **Draw zones** on the preview frame
3. **Select target class** and confidence
4. **Process** and view results

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/jobs` | POST | Upload video |
| `/api/jobs/{id}` | GET | Get job details |
| `/api/jobs/{id}/process` | POST | Start processing |
| `/api/jobs/{id}/export` | GET | Export CSV/JSON |
| `/api/camera` | POST | Create live stream |
| `/api/system-info` | GET | GPU/system info |

## 📄 License

MIT License - see [LICENSE](LICENSE)

## 🙏 Acknowledgments

- [Ultralytics](https://ultralytics.com/) for YOLO11
- [ByteTrack](https://github.com/ifzhang/ByteTrack) for object tracking
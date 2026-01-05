# Locus
## The Open Source Vision Analytics Engine.
### Turn RTSP streams into queryable data. Dockerized, API-First, and 100% Offline.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)
![YOLO11](https://img.shields.io/badge/YOLO-11-green)
![Next.js 15](https://img.shields.io/badge/Next.js-15-black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED.svg)

**Locus** is a self-hosted computer vision platform that sits on top of your existing NVR. It uses **YOLO11** to transform video pixels into JSON events, allowing you to query your physical world like a database. Built for the **Private Cloud**.

https://github.com/user-attachments/assets/647da3b4-74e2-4da8-872c-6d9200b7c0af

## 📋 Table of Contents
- [Real-World Applications](#-real-world-applications)
- [Key Features](#-key-features)
- [Tech Stack](#-%EF%B8%8F-tech-stack)
- [Quick Start](#-quick-start)
- [Usage](#-usage)
- [API Endpoints](#-api-endpoints)
- [License](#-license)

## 🌍 Real-World Applications

**Locus** is versatile and can be deployed for various **AI analytics** scenarios:

- **Retail Intelligence**: Monitor store footfall, analyze customer dwell times in specific aisles, and optimize store layout.
- **Smart Traffic Management**: Count vehicles crossing intersections, classify vehicle types (cars, trucks, buses), and detect traffic flow direction.
- **Industrial Safety**: Create exclusion zones around dangerous machinery and detect unauthorized personnel entry in real-time.
- **Crowd Management**: Monitor crowd density in public spaces, events, or venues to ensure safety and compliance.
- **Logistics & Warehousing**: Track package movement on conveyor belts or monitor forklift paths.

## 🚀 Key Features

- **Running on Your Metal**: CUDA, Coral.
- **Private by Design**: No cloud, no telemetry.
- **Geometry-based Logic**: Draw polygons, not just grids.
- **Advanced Geofencing & ROI**: Draw precise, multi-point polygon zones to count objects only where it matters.
- **Directional Line Crossing**: Set up virtual tripwires to count objects entering (IN) or exiting (OUT) a specific area.
- **Comprehensive Object Recognition**: Detect and track over **80 COCO classes** (People, Vehicles, Animals, etc.) out of the box.
- **Flexible Model Selection**: Choose between **YOLO11 Nano, Small, Medium, Large, or XLarge** to balance speed (FPS) and accuracy based on your hardware.
- **Real-Time Streaming**: Support for **RTSP / HTTP streams** for live IP camera integration, as well as local webcam support.
- **Insightful Analytics**:
    - **Dwell Time Analysis**: Measure how long objects stay within a defined zone.
    - **Data Export**: Download your tracking data in **CSV and JSON** formats.

## 🛠️ Tech Stack

- **Frontend**: [Next.js 15](https://nextjs.org/), React 19, Tailwind CSS v4
- **Backend**: [FastAPI](https://fastapi.tiangolo.com/), Python 3.10+
- **AI/ML**: [YOLO11](https://github.com/ultralytics/ultralytics), ByteTrack, OpenCV
- **Deployment**: Docker & Docker Compose

## 🚀 Quick Start

**Prerequisites**: Python 3.10+, Node.js 18+, [uv](https://github.com/astral-sh/uv).

### Installation

```bash
git clone https://github.com/kongesque/locus.git
cd locus

# Backend
cd backend && uv sync && cd ..

# Frontend
cd frontend && npm install && cd ..
```

### Running Locally

```bash
# Terminal 1 - Backend
cd backend && uv run uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend && npm run dev
```

Visit **http://localhost:3000** for the dashboard and **http://localhost:8000/docs** for API docs.

**Docker Production:**

```bash
docker-compose up --build -d
```

## 🎮 Usage

1. **Upload Source**: Upload a video file (MP4, AVI, WebM) or connect a Live Camera Stream.
2. **Configure Zones**: Use the interactive drawing tool to create polygon zones or counting lines on the video preview.
3. **Select Objects**: Choose which classes to track (e.g., 'person', 'car') and set confidence thresholds.
4. **Analyze**: Start the processing job. Watch real-time annotations and view live counting statistics.
5. **Export**: Download the tracking report for external reporting.

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/jobs` | POST | Initialize a new video processing job |
| `/api/jobs/{id}/process` | POST | Trigger tracking on a specific job |
| `/api/jobs/{id}/analytics` | GET | Retrieve counting stats and dwell times |
| `/api/camera` | POST | Add a new RTSP camera stream |
| `/api/system/health` | GET | Check GPU availability and system status |

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.
# ZoneNet: AI Object Counter & Analytics | Custom Region Tracking w/ YOLO11 👁️

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)
![YOLO11](https://img.shields.io/badge/YOLO-11-green)

ZoneNet is a professional-grade **Computer Vision** application designed for precise **Real-time Object Counting** and **Video Analytics**. Leveraging the power of **YOLO11** and **ByteTrack**, it allows users to define **Custom Regions of Interest (ROI)** for accurate tracking in retail, traffic management, livestock management,and industrial safety scenarios. Built with Flask and Tailwind CSS, it offers a seamless, local-first solution for data-driven insights.

![ZoneNet AI Object Counting Demo with Custom Polygon Zones](demo/demo.gif)

## 🚀 Features

- **Custom Region of Interest (ROI)**: Draw specific polygons on your video to precision-count objects only within defined areas. Perfect for specific lane counting or zone monitoring.
- **Dynamic Object Selection**: Select ANY of the 80 COCO classes (Person, Car, Bicycle, etc.) to track and count. No code changes required!
- **Adjustable Confidence**: Fine-tune detection sensitivity with a built-in confidence threshold slider (Default: 35%).
- **Accurate Tracking**: Uses **ByteTrack** for robust object tracking and consistency.
- **Real-time Detection**: Powered by the state-of-the-art **YOLO11** model for low-latency processing.
- **Real-time Analytics 📊**: View object counting trends over time with interactive charts for actionable insights.
- **Data Export 💾**: Download your detection data as CSV for offline analysis and reporting.
- **History & Management**: Automatically saves processed jobs. Rename or delete past tasks easily.
- **Privacy-First**: All processing happens locally on your machine. No video data is sent to the cloud.

## 🎯 Target Use Cases

- **Retail Analytics**: Count customer footfall in specific store aisles or entryways.
- **Traffic Management**: Monitor vehicle flow, classify vehicle types (cars, trucks, buses), and analyze lane usage.
- **Industrial Safety**: Monitor restricted zones for unauthorized personnel entry.
- **Smart Cities**: Analyze usage of public spaces, parks, and walkways.
- **Livestock Monitoring**: Track and count animals (cows, sheep) in fields or enclosures.

## 🛠️ Tech Stack

- **Backend**: Python, Flask, SQLite (for job persistence)
- **AI/ML**: OpenCV, Ultralytics YOLO11, ByteTrack
- **Frontend**: Tailwind CSS v4, Jinja2, Vanilla JS
- **Package Management**: [uv](https://github.com/astral-sh/uv) (Python), npm (CSS)

## 📦 Installation

This project uses `uv` for lightning-fast Python dependency management and `npm` for styling.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Kongesque/zonenet.git
   cd zonenet
   ```

2. **Install `uv` (if not already installed):**
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```
   *For other installation methods (pip, etc.), refer to the [uv documentation](https://docs.astral.sh/uv/getting-started/installation/).*

3. **Install Python dependencies:**
   ```bash
   uv sync
   ```

4. **Install CSS dependencies & build:**
   ```bash
   npm install
   npm run build
   ```

## 🎮 Usage

1. **Start the application:**
   ```bash
   uv run app.py
   ```

2. **Open the Web UI:**
   Navigate to `http://127.0.0.1:5000`.

3. **Workflow:**
   - **Upload**: Drop a video file (MP4, WebM) on the main board.
   - **Configure**:
     - **Draw Logic**: Click to define the polygon points for your counting zone.
     - **Target Object**: Select what you want to count (e.g., "Person", "Car", "Cow") from the sidebar.
     - **Confidence**: Adjust the sensitivity slider (40% recommended).
   - **Process**: Click "Process" to start the AI analysis.
   - **Result**: Watch the processed video with real-time counting and download the result.

## ⚙️ Advanced Configuration

### Object Classes
ZoneNet maps the standard **COCO 80 classes**. You can select these directly from the UI. 

### Confidence Threshold
- **Lower (~10-20%)**: Catches more objects but may include false positives (e.g., seeing a "car" in a shadow).
- **Default (35%)**: The "sweet spot" balanced for general tracking.
- **Higher (>60%)**: Only counts objects the model is extremely sure about.
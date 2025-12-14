# ZoneNet 👁️

A powerful, modern web application leveraging **YOLO11** and **Flask** for accurate, real-time object counting within user-defined regions.

![Demo](demo/demo.gif)

## 🚀 Features

- **Custom Region of Interest (ROI)**: Draw specific polygons on your video to precision-count objects only within defined areas.
- **Dynamic Object Selection**: Select ANY of the 80 COCO classes (Person, Car, Bicycle, etc.) to track and count. No code changes required!
- **Adjustable Confidence**: Fine-tune detection sensitivity with a built-in confidence threshold slider (Default: 40%).
- **Accurate Tracking**: Uses **ByteTrack** for robust object tracking and consistency.
- **Real-time Detection**: Powered by the state-of-the-art **YOLO11** model.
- **Modern UI**: Sleek, Vercel-inspired dark mode interface built with **Tailwind CSS v4**.
- **History & Management**: Automatically saves processed jobs. Rename or delete past tasks easily.

## 🛠️ Tech Stack

- **Backend**: Python, Flask, SQLite (for job persistence)
- **AI/ML**: OpenCV, Ultralytics YOLO11, ByteTrack
- **Frontend**: Tailwind CSS v4, Jinja2, Vanilla JS
- **Package Management**: [uv](https://github.com/astral-sh/uv) (Python), npm (CSS)

## 📦 Installation

This project uses `uv` for lightning-fast Python dependency management and `npm` for styling.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Kongesque/custom-region-object-counter-YOLOV8.git
   cd custom-region-object-counter-YOLOV8
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
- **Default (40%)**: The "sweet spot" balanced for general tracking.
- **Higher (>60%)**: Only counts objects the model is extremely sure about.

### Database
Jobs are stored in `tasks.db` (SQLite). The database schema is automatically migrated on app startup.

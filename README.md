# ZoneNet 👁️

A powerful web application leveraging **YOLO11** and **Flask** for accurate, real-time object counting within user-defined regions.

![Demo](demo/demo.gif)

## 🚀 Features

- **Custom Region of Interest (ROI)**: Draw specific polygons on your video to count objects only within defined areas.
- **Accurate Tracking**: Uses **ByteTrack** for robust object tracking and consistency.
- **Real-time Detection**: Powered by the state-of-the-art **YOLO11** model (pre-trained on COCO).
- **User-Friendly Interface**: Simple web UI for uploading videos, drawing regions, and viewing results.
- **Exportable Results**: Processed videos are saved with annotations.

## 🛠️ Tech Stack

- **Backend**: Python, Flask
- **Computer Vision**: OpenCV, Ultralytics YOLO11
- **Frontend**: Tailwind CSS v4
- **Package Management**: [uv](https://github.com/astral-sh/uv) (Python), npm (CSS)

## 📦 Installation

This project uses `uv` for lightning-fast Python dependency management and `npm` for Tailwind CSS.

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
   Open your browser and navigate to `http://127.0.0.1:5000`.

3. **Workflow:**
   - **Upload**: Select your target video file (MP4, etc.) on the home page.
   - **Draw**: You will be presented with the first frame. Click to define points for your polygon Region of Interest (ROI).
   - **Submit**: Click "Run" to start processing.
   - **Result**: Watch the processed video with real-time counting.

## 🗄️ Database Management

The project uses a SQLite database (`tasks.db`) to store job information securely. A utility script is provided to manage this data.

### View Jobs
List all jobs currently in the database:
```bash
uv run manage_db.py view
```

### Cleanup Files (Prune)
Delete all **input videos** and **temporary frames**, keeping only the processed output videos to save space:
```bash
uv run manage_db.py prune
```

### Clear Database
Delete **ALL data** (including output videos) and reset the database:
```bash
uv run manage_db.py clear
```

## ⚙️ Configuration

The current model is configured to detect **cattle/cows** (COCO Class ID `19`).

To change the target object class, modify `detector.py`:
```python
# detector.py
ClassID = [19] # Change this ID used for valid detection
```
*Common IDs: 0 (Person), 2 (Car), 19 (Cow).*

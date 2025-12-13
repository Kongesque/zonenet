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
- **Package Management**: [uv](https://github.com/astral-sh/uv)

## 📦 Installation

This project uses `uv` for lightning-fast dependency management.

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

3. **Install dependencies:**
   ```bash
   uv sync
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

## ⚙️ Configuration

The current model is configured to detect **cattle/cows** (COCO Class ID `19`).

To change the target object class, modify `detector.py`:
```python
# detector.py
ClassID = [19] # Change this ID used for valid detection
```
*Common IDs: 0 (Person), 2 (Car), 19 (Cow).*

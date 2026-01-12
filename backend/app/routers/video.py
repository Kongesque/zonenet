import shutil
import uuid
import os
import json
import cv2  # Added for thumbnail generation
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from app.schemas.video import ProcessRequest, TaskResponse
from app.services.detector import process_video_task
from app.core.config import settings

router = APIRouter()

# Directories
MEDIA_DIR = Path(settings.DATA_DIR) / "media"
INPUT_DIR = MEDIA_DIR / "uploads"
OUTPUT_DIR = MEDIA_DIR / "outputs"
TASKS_DIR = Path(settings.DATA_DIR) / "tasks"
THUMBNAILS_DIR = MEDIA_DIR / "thumbnails"

# Ensure dirs exist
INPUT_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
TASKS_DIR.mkdir(parents=True, exist_ok=True)
THUMBNAILS_DIR.mkdir(parents=True, exist_ok=True)

# --- Persistence Helpers ---
def save_task(task_id: str, data: dict):
    """Save task data to JSON file."""
    file_path = TASKS_DIR / f"{task_id}.json"
    with open(file_path, "w") as f:
        json.dump(data, f, indent=2)

def load_tasks() -> dict:
    """Load all task JSON files into memory."""
    loaded_tasks = {}
    if not TASKS_DIR.exists():
        return {}
    
    for file_path in TASKS_DIR.glob("*.json"):
        try:
            with open(file_path, "r") as f:
                data = json.load(f)
                loaded_tasks[data["id"]] = data
        except Exception as e:
            print(f"Failed to load task {file_path}: {e}")
    return loaded_tasks

# Initialize tasks from disk
tasks = load_tasks()
print(f"Loaded {len(tasks)} tasks from disk.")

def generate_thumbnail(video_path: str, thumbnail_path: str):
    """Extract first frame as thumbnail."""
    try:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
             return False
        ret, frame = cap.read()
        cap.release()
        
        if ret:
            cv2.imwrite(thumbnail_path, frame)
            return True
        return False
    except Exception as e:
        print(f"Thumbnail generation failed: {e}")
        return False

@router.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    """Upload a video file for processing."""
    task_id = str(uuid.uuid4())
    filename = f"{task_id}_{file.filename}"
    file_path = INPUT_DIR / filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Generate Thumbnail
    thumb_filename = f"{task_id}.jpg"
    thumb_path = THUMBNAILS_DIR / thumb_filename
    has_thumbnail = generate_thumbnail(str(file_path), str(thumb_path))
    
    task_data = {
        "id": task_id,
        "status": "pending",
        "filename": filename,
        "input_path": str(file_path),
        "created_at": str(uuid.uuid1().time), # timestamp placehoder
        "name": file.filename,
        "format": "mp4" # Assumption
    }
    
    if has_thumbnail:
        task_data["thumbnail_url"] = f"/api/video/{task_id}/thumbnail"
    
    tasks[task_id] = task_data
    save_task(task_id, task_data)
    
    return {"task_id": task_id}

@router.get("/tasks")
async def get_tasks():
    """Get all tasks list."""
    # Convert dict to list and sort by creation (roughly)
    return sorted(list(tasks.values()), key=lambda x: x.get('created_at', ''), reverse=True)

@router.get("/{task_id}")
async def get_task_status(task_id: str):
    """Get status of a specific task."""
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    return tasks[task_id]

@router.get("/{task_id}/thumbnail")
async def get_thumbnail(task_id: str):
    """Get video thumbnail."""
    thumb_filename = f"{task_id}.jpg"
    thumb_path = THUMBNAILS_DIR / thumb_filename
    
    if not thumb_path.exists():
        # Return default placeholder or 404
        # For now, 404 is fine, frontend can fallback
        raise HTTPException(status_code=404, detail="Thumbnail not found")
        
    return FileResponse(thumb_path, media_type="image/jpeg")

@router.get("/{task_id}/stream")
async def stream_video(task_id: str):
    """Stream the ORIGINAL uploaded video."""
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")
        
    video_path = tasks[task_id]["input_path"]
    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video file missing")
        
    return FileResponse(video_path, media_type="video/mp4")

@router.get("/{task_id}/result")
async def stream_result(task_id: str):
    """Stream the PROCESSED output video."""
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")
        
    output_filename = f"{task_id}_output.mp4"
    output_path = OUTPUT_DIR / output_filename
    
    if not output_path.exists():
         # If processing, maybe return a default placeholder or 404
         if tasks[task_id]["status"] == "processing":
             raise HTTPException(status_code=202, detail="Processing in progress")
         raise HTTPException(status_code=404, detail="Result not found")
         
    return FileResponse(output_path, media_type="video/mp4")

def run_processing_job(task_id: str, request: ProcessRequest):
    """Background job wrapper."""
    try:
        tasks[task_id]["status"] = "processing"
        save_task(task_id, tasks[task_id])
        
        input_path = tasks[task_id]["input_path"]
        output_filename = f"{task_id}_output.mp4"
        output_path = OUTPUT_DIR / output_filename
        
        # Run synchronous heavy processing
        result = process_video_task(
            input_path=input_path,
            output_path=str(output_path),
            zones=request.zones,
            model_name=request.model
        )
        
        tasks[task_id]["status"] = "completed"
        tasks[task_id]["result_url"] = f"/api/video/{task_id}/result"
        tasks[task_id]["count"] = result["count"]
        print(f"Task {task_id} completed. Count: {result['count']}")
        save_task(task_id, tasks[task_id])
        
    except Exception as e:
        print(f"Task {task_id} failed: {e}")
        tasks[task_id]["status"] = "failed"
        tasks[task_id]["error"] = str(e)
        save_task(task_id, tasks[task_id])

@router.post("/{task_id}/process")
async def start_processing(
    task_id: str, 
    request: ProcessRequest,
    background_tasks: BackgroundTasks
):
    """Start asynchronous video processing."""
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")
        
    # Add to background queue
    background_tasks.add_task(run_processing_job, task_id, request)
    
    return {"status": "processing", "message": "Job started in background"}

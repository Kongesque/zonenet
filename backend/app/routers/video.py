import shutil
import uuid
import os
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from app.schemas.video import ProcessRequest, TaskResponse
from app.services.detector import process_video_task
from app.core.config import settings

router = APIRouter()

# Directories
VIDEO_DIR = Path(settings.DATA_DIR) / "videos"
INPUT_DIR = VIDEO_DIR / "input"
OUTPUT_DIR = VIDEO_DIR / "output"

# Ensure dirs exist
INPUT_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# In-memory task store (replace with DB/Redis in prod)
# { task_id : { status, filename, result_url, created_at, ... } }
tasks = {}

@router.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    """Upload a video file for processing."""
    task_id = str(uuid.uuid4())
    filename = f"{task_id}_{file.filename}"
    file_path = INPUT_DIR / filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    tasks[task_id] = {
        "id": task_id,
        "status": "pending",
        "filename": filename,
        "input_path": str(file_path),
        "created_at": str(uuid.uuid1().time), # timestamp placehoder
        "name": file.filename,
        "format": "mp4" # Assumption
    }
    
    return {"task_id": task_id}

@router.get("/tasks")
async def get_tasks():
    """Get all tasks list."""
    # Convert dict to list
    return list(tasks.values())

@router.get("/{task_id}")
async def get_task_status(task_id: str):
    """Get status of a specific task."""
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    return tasks[task_id]

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
        
    except Exception as e:
        print(f"Task {task_id} failed: {e}")
        tasks[task_id]["status"] = "failed"
        tasks[task_id]["error"] = str(e)

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

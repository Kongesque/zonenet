"""
WebSocket Routes for Live Video Streaming
"""
import base64
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.db import get_job
from app.core.live_detector import live_detection, stop_live_stream

router = APIRouter()


@router.websocket("/ws/live/{task_id}")
async def live_stream_endpoint(websocket: WebSocket, task_id: str):
    """
    WebSocket endpoint for live video streaming.
    Streams processed frames from RTSP/webcam source with detection overlays.
    """
    await websocket.accept()
    
    try:
        # Get job data
        job = get_job(task_id)
        if not job:
            await websocket.send_json({"error": "Job not found"})
            await websocket.close()
            return
        
        # Validate source type
        source_type = job.get("source_type")
        if source_type not in ("rtsp", "webcam"):
            await websocket.send_json({"error": "Not a live stream job"})
            await websocket.close()
            return
        
        stream_url = job.get("stream_url")
        zones = job.get("zones", [])
        frame_size = (job.get("frame_width", 640), job.get("frame_height", 480))
        confidence = job.get("confidence", 35)
        model = job.get("model", "yolo11n.pt")
        tracker_config = job.get("tracker_config")
        
        # Start streaming frames
        for jpeg_bytes, counts in live_detection(
            stream_url=stream_url,
            zones=zones,
            frame_size=frame_size,
            task_id=task_id,
            conf=confidence,
            model_name=model,
            tracker_config=tracker_config,
            source_type=source_type
        ):
            try:
                # Convert JPEG bytes to base64
                frame_base64 = base64.b64encode(jpeg_bytes).decode("utf-8")
                
                # Send frame and counts as JSON
                await websocket.send_json({
                    "type": "frame",
                    "frame": frame_base64,
                    "counts": counts
                })
            except WebSocketDisconnect:
                break
            except Exception:
                break
    
    except WebSocketDisconnect:
        pass
    finally:
        # Stop the live stream
        stop_live_stream(task_id)

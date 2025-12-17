import os
import uuid
import cv2
from werkzeug.utils import secure_filename
from flask import session
from core.vision_utils import extract_frame
from utils.db import create_job, update_job

def handle_upload(file, upload_folder):
    """
    Handles video file upload, saves it, and extracts the first frame.
    """
    taskID = str(uuid.uuid4())
    filename = taskID + "_" + secure_filename(file.filename) 
    filepath = os.path.join(upload_folder, filename)
    file.save(filepath)
    session['taskID'] = taskID
    
    # Init Job in DB
    create_job(taskID, secure_filename(file.filename), filepath)
    
    # Ensure frame directory exists
    frame_dir = "uploads/frames"
    os.makedirs(frame_dir, exist_ok=True)
    
    frame_path = os.path.join(frame_dir, "frame_" + taskID + ".jpg")
    
    first_frame = extract_frame(filepath, 0)
    if first_frame is not None:
         cv2.imwrite(frame_path, first_frame)
         frame = cv2.imread(frame_path)
         if frame is not None:
            frame_size = frame.shape[1], frame.shape[0] # width, height
            update_job(taskID, frame_path=frame_path, frame_width=frame_size[0], frame_height=frame_size[1])
    
    return taskID

def handle_rtsp_source(stream_url, source_type='rtsp'):
    """
    Creates a job for RTSP/webcam source by capturing a single frame for zone setup.
    
    Args:
        stream_url: RTSP URL string or webcam index as string (e.g., "0")
        source_type: "rtsp" or "webcam"
    
    Returns:
        taskID: Generated task ID
        
    Raises:
        ValueError: If unable to connect to stream
    """
    taskID = str(uuid.uuid4())
    
    # Connect to stream - webcam uses integer index
    if source_type == 'webcam':
        cap = cv2.VideoCapture(int(stream_url))
    else:
        cap = cv2.VideoCapture(stream_url)
    
    # Try to grab a frame (with timeout-like attempt)
    success = False
    for _ in range(30):  # Try for ~1 second
        success, frame = cap.read()
        if success:
            break
    
    if not success:
        cap.release()
        raise ValueError(f"Could not connect to stream: {stream_url}")
    
    # Get frame dimensions
    height, width = frame.shape[:2]
    
    # Ensure frame directory exists
    frame_dir = "uploads/frames"
    os.makedirs(frame_dir, exist_ok=True)
    
    # Save frame for zone selection
    frame_path = os.path.join(frame_dir, f"frame_{taskID}.jpg")
    cv2.imwrite(frame_path, frame)
    
    cap.release()
    
    # Create job with stream info (no video_path for live sources)
    create_job(taskID, "Live Stream", None)
    update_job(taskID, 
               source_type=source_type, 
               stream_url=stream_url,
               frame_path=frame_path,
               frame_width=width,
               frame_height=height)
    
    return taskID

def safe_remove_file(file_path):
    """
    Safely removes a file if it exists, ignoring errors.
    """
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
        except OSError:
            pass

def clear_all_uploads():
    """
    Removes all files in the frames and videos folders.
    """
    dirs_to_clean = ["uploads/frames", "uploads/videos"]
    
    for directory in dirs_to_clean:
        if os.path.exists(directory):
            for filename in os.listdir(directory):
                file_path = os.path.join(directory, filename)
                try:
                    if os.path.isfile(file_path):
                        os.remove(file_path)
                except OSError:
                    pass

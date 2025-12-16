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

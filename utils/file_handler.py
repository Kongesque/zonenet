import os
import uuid
import cv2
from werkzeug.utils import secure_filename
from flask import session
from core.vision_utils import extract_frame

def handle_upload(file, upload_folder):
    """
    Handles video file upload, saves it, and extracts the first frame.
    """
    taskID = str(uuid.uuid4())
    filename = taskID + "_" + secure_filename(file.filename) 
    filepath = os.path.join(upload_folder, filename)
    file.save(filepath)
    session['taskID'] = taskID
    session['video_path_' + taskID] = filepath
    
    # Ensure frame directory exists
    frame_dir = "static/files/frame"
    os.makedirs(frame_dir, exist_ok=True)
    
    frame_path = os.path.join(frame_dir, "frame_" + taskID + ".jpg")
    
    video_path = session.get('video_path_' + taskID, None)
    if video_path:
        first_frame = extract_frame(video_path, 0)
        if first_frame is not None:
             cv2.imwrite(frame_path, first_frame)
             frame = cv2.imread(frame_path)
             if frame is not None:
                frame_size = frame.shape[1], frame.shape[0]
                session['frame_size_' + taskID] = frame_size
                session['points_' + taskID] = []
                session['color_' + taskID] = (5, 189, 251)
    
    return taskID

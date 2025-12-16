import time
from core.detector import detection
from utils.db import update_job
from utils.file_handler import clear_all_uploads

def run_processing_pipeline(taskID, job, target_class, confidence):
    start_time = time.time()
    
    last_progress = 0
    final_detection_events = []
    
    for frame, progress, detection_events in detection(
        job['video_path'], 
        job['points'], 
        (job['frame_width'], job['frame_height']), 
        job['color'], 
        taskID, 
        target_class, 
        confidence
    ):
        final_detection_events = detection_events
        # Update progress in DB every 5% to avoid too many writes
        if progress >= last_progress + 5 or progress == 100:
            update_job(taskID, progress=progress)
            last_progress = progress
        
    end_time = time.time()
    process_time = round(end_time - start_time, 2)
    
    update_job(taskID, process_time=process_time, status='completed', detection_data=final_detection_events)
    

    clear_all_uploads()  # Remove all frames in frames folder


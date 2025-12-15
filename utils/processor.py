import time
from core.detector import detection
from utils.db import update_job
from utils.file_handler import safe_remove_file, clear_all_frames

def run_processing_pipeline(taskID, job, target_class, confidence):
    start_time = time.time()
    
    for _ in detection(
        job['video_path'], 
        job['points'], 
        (job['frame_width'], job['frame_height']), 
        job['color'], 
        taskID, 
        target_class, 
        confidence
    ):
        pass
        
    end_time = time.time()
    process_time = round(end_time - start_time, 2)
    
    update_job(taskID, process_time=process_time, status='completed')
    
    safe_remove_file(job.get('video_path'))
    clear_all_frames()  # Remove all frames in frames folder


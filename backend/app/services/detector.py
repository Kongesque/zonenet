import cv2
import time
import numpy as np
from collections import defaultdict
from ultralytics import YOLO
from app.schemas.video import Zone
from app.core.config import settings

def process_video_task(
    input_path: str,
    output_path: str,
    zones: list[Zone],
    model_name: str = "yolo11n"
):
    """
    Run YOLO detection on video with defined zones.
    Adapted from example/detector.py for Locus backend.
    """
    # Load Model
    model = YOLO(f"{model_name}.pt")
    
    # Video Setup
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        raise ValueError(f"Could not open video: {input_path}")
        
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    # Output Setup
    # Use 'mp4v' or 'avc1' for mp4 (avc1 is H.264, universally supported)
    fourcc = cv2.VideoWriter_fourcc(*'avc1')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    # Tracking Setup
    track_history = defaultdict(lambda: [])
    crossed_objects = {}  # {track_id: bool}
    
    # Pre-calculate zones
    zone_polygons = []
    zone_filters = [] # List of class ID sets for each zone
    
    # Standard COCO classes mapping (could be imported from config)
    # ultralytics model.names is a dict {0: 'person', 1: 'bicycle', ...}
    class_name_to_id = {v: k for k, v in model.names.items()}

    for z in zones:
        poly_points = np.array([[int(p.x), int(p.y)] for p in z.points], np.int32)
        zone_polygons.append(poly_points)
        
        # Resolve class filters
        if not z.classes:
            zone_filters.append(None) # Allow all
        else:
            allowed_ids = set()
            for cname in z.classes:
                if cname in class_name_to_id:
                    allowed_ids.add(class_name_to_id[cname])
            zone_filters.append(allowed_ids)

    # Process Frames
    frame_count = 0
    start_time = time.time()
    
    # Frame Skipping Logic (Target ~12 FPS for performance)
    target_fps = 12
    should_process_interval = max(1, int(round(fps / target_fps)))
    
    while cap.isOpened():
        success, frame = cap.read()
        if not success:
            break
            
        frame_count += 1
        
        # Skip frames to boost speed
        if frame_count % should_process_interval != 0:
            continue
            
        # Run YOLO with Tracking
        # persist=True ensures ID consistency across frames
        results = model.track(frame, persist=True, verbose=False)
        
        if frame_count % (should_process_interval * 10) == 0:
            print(f"Processing frame {frame_count}/{total_frames} ({frame_count/total_frames*100:.1f}%)")
        
        if results[0].boxes is not None and results[0].boxes.id is not None:
            boxes = results[0].boxes.xywh.cpu()
            track_ids = results[0].boxes.id.int().cpu().tolist()
            class_ids = results[0].boxes.cls.int().cpu().tolist()
            
            # Plot detections first (optional, standard visualize)
            # frame = results[0].plot() 
            # OR draw custom later
            
            for box, track_id, cls_id in zip(boxes, track_ids, class_ids):
                x, y, w, h = box
                center_x, center_y = int(x), int(y)
                
                track = track_history[track_id]
                track.append((float(x), float(y)))
                if len(track) > 30:
                    track.pop(0)
                
                # Check Zones
                is_counted = False
                in_wrong_zone = False # If object is in a zone but filtered out
                
                for i, polygon in enumerate(zone_polygons):
                    # Check class filter
                    if zone_filters[i] is not None:
                        if cls_id not in zone_filters[i]:
                            continue # Skip this zone check for this class type

                    # Point Polygon Test
                    # >0 = inside, <0 = outside, 0 = on edge
                    inside = cv2.pointPolygonTest(polygon, (center_x, center_y), False)
                    
                    if inside >= 0:
                        # Mark as counted
                        if track_id not in crossed_objects:
                            crossed_objects[track_id] = True
                        is_counted = True
                        break # Counted in at least one valid zone
                
                # Visualize
                color = (0, 255, 0) if is_counted else (0, 0, 255) # Green vs Red
                cv2.circle(frame, (center_x, center_y), 5, color, -1)
                
                # Draw bounding box (simple)
                x1 = int(x - w/2)
                y1 = int(y - h/2)
                x2 = int(x + w/2)
                y2 = int(y + h/2)
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                
                # Label
                label = f"{model.names[cls_id]} #{track_id}"
                cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

        # Draw Zones
        for poly in zone_polygons:
             cv2.polylines(frame, [poly], True, (255, 200, 0), 2)

        # Draw Count
        count_text = f"Count: {len(crossed_objects)}"
        cv2.putText(frame, count_text, (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        
        out.write(frame)
        
    cap.release()
    out.release()
    
    return {
        "count": len(crossed_objects),
        "duration": time.time() - start_time
    }

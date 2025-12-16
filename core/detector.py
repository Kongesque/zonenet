import cv2
from collections import defaultdict

from ultralytics import YOLO

import colorsys
import time
import numpy as np

def get_color_from_class_id(class_id):
    """
    Generate a distinct color based on class ID using Golden Angle Approximation.
    Matches the frontend logic in zone.js.
    """
    hue = ((class_id * 137.508) % 360) / 360.0
    saturation = 0.85
    lightness = 0.55
    
    # colorsys.hls_to_rgb takes (h, l, s)
    r, g, b = colorsys.hls_to_rgb(hue, lightness, saturation)
    
    # Convert to 0-255 and return as BGR (for OpenCV)
    return (int(b * 255), int(g * 255), int(r * 255))


def point_to_line_distance(point, line_start, line_end):
    """Calculate perpendicular distance from a point to a line segment."""
    px, py = point
    x1, y1 = line_start
    x2, y2 = line_end
    
    # Line segment vector
    dx, dy = x2 - x1, y2 - y1
    
    # Handle degenerate case where line is a point
    if dx == 0 and dy == 0:
        return np.sqrt((px - x1)**2 + (py - y1)**2)
    
    # Parameter t for closest point on infinite line
    t = max(0, min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)))
    
    # Closest point on the line segment
    closest_x = x1 + t * dx
    closest_y = y1 + t * dy
    
    return np.sqrt((px - closest_x)**2 + (py - closest_y)**2)


def check_line_crossing(prev_pos, curr_pos, line_start, line_end):
    """Check if movement from prev_pos to curr_pos crosses the line segment."""
    def ccw(A, B, C):
        return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0])
    
    A, B = prev_pos, curr_pos
    C, D = line_start, line_end
    
    return ccw(A, C, D) != ccw(B, C, D) and ccw(A, B, C) != ccw(A, B, D)


def detection(path_x, Area, frame_size, areaColor, taskID, target_class=19, conf=40):

    # Constants
    ClassID = [target_class]
    SOURCE_VIDEO = path_x
    DESTIN_VIDEO = 'uploads/outputs/' + 'output_' + taskID + '.mp4'

    font = cv2.FONT_ITALIC
    frame_counter = 0
    track_history = defaultdict(lambda: [])
    track_history = defaultdict(lambda: [])
    crossed_objects = {}
    detection_events = []

   
    width = frame_size[0]
    height = frame_size[1]


    BASE_FONT_SIZE = 1.5
    font_scale = min(width, height) / 1000 * BASE_FONT_SIZE
    BASE_FONT_THICKNESS = 3
    font_thickness = max(width, height) // 1000 * BASE_FONT_THICKNESS

    model = YOLO('weights/yolo11n.pt')

    cap = cv2.VideoCapture(SOURCE_VIDEO)

    targetFPS = 12
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    newFPS = targetFPS if fps > targetFPS else fps
    interval = fps / newFPS
    
    process_idx = 0
    
    fourcc = cv2.VideoWriter_fourcc(*'avc1')
    out = cv2.VideoWriter(DESTIN_VIDEO, fourcc, newFPS, (width, height))

    start_time = time.time()

    area_np = np.array(Area, np.int32)

    while cap.isOpened():
        
        target_frame_idx = round(interval * process_idx)
        
        # If the current frame matches the target frame 
        if (frame_counter + 1) != target_frame_idx:
             # If we passed the target (should process next)
             if (frame_counter + 1) > target_frame_idx:
                 process_idx += 1
                 target_frame_idx = round(interval * process_idx)
             
             if (frame_counter + 1) != target_frame_idx:
                success = cap.grab()
                if not success:
                    break
                frame_counter += 1
                continue
        
        # Target frame reached
        process_idx += 1
        success, frame = cap.read()
        
        if not success:
            break
        
        frame_counter += 1


        # Normalize confidence to 0.0-1.0 range
        conf_float = conf / 100.0
        results = model.track(frame, classes=ClassID, persist=True, save=False, tracker="bytetrack.yaml", conf=conf_float)
        boxes = results[0].boxes.xywh.cpu()
        track_ids = results[0].boxes.id.int().cpu().tolist() if results[0].boxes is not None and results[0].boxes.id is not None else []

        frame = results[0].plot()


        center_x, center_y = 0, 0
        
        # Determine if we're using a line (2 points) or polygon (3+ points)
        is_line_mode = len(Area) == 2

        for box, track_id in zip(boxes, track_ids):
            x, y, w, h = box
            center_x, center_y = int(x), int(y)
            
            track = track_history[track_id]
            track.append((float(x), float(y)))
            if len(track) > 30:
                track.pop(0)
            
            # Check if object is in zone (different logic for line vs polygon)
            in_zone = False
            if is_line_mode:
                # For 2-point line: check if object crosses the line
                if len(track) >= 2:
                    prev_pos = track[-2]
                    curr_pos = track[-1]
                    line_pt1 = (int(Area[0][0]), int(Area[0][1]))
                    line_pt2 = (int(Area[1][0]), int(Area[1][1]))
                    in_zone = check_line_crossing(prev_pos, curr_pos, line_pt1, line_pt2)
            else:
                # For 3+ point polygon: use standard containment test
                results = cv2.pointPolygonTest(area_np, ((center_x, center_y)), False)
                in_zone = results >= 0

            if in_zone:
                if track_id not in crossed_objects:
                    crossed_objects[track_id] = True
                    # Log event
                    timestamp = round(frame_counter / fps, 2)
                    detection_events.append({
                        "time": timestamp,
                        "count": len(crossed_objects)
                    })
                    
                cv2.circle(frame, (center_x, center_y), 9, (244, 133, 66), -1) # Blue (Counting) GBR

            else:
                if track_id in crossed_objects and crossed_objects[track_id] == True:
                    cv2.circle(frame, (center_x, center_y), 9, (83, 168, 51), -1) # Green (Counted) GBR
                else:
                    cv2.circle(frame, (center_x, center_y), 9, (54, 67, 234), -1) # Red (Not Counted) GBR

        # Draw the zone (line or polygon)
        if is_line_mode:
            pt1 = (int(Area[0][0]), int(Area[0][1]))
            pt2 = (int(Area[1][0]), int(Area[1][1]))
            cv2.line(frame, pt1, pt2, areaColor, 3)
        else:
            cv2.polylines(frame, [area_np], True, areaColor, 3)
        
        count_text = f"Count: {len(crossed_objects)}"

        # Generate color based on class ID for text overlay
        text_color = get_color_from_class_id(target_class)

        count_text_position = (int(width * 0.855), int(height * 0.97))
        cv2.putText(frame, count_text, count_text_position, font, font_scale, text_color, font_thickness) 
        
        # Only resize if necessary
        if frame.shape[1] != width or frame.shape[0] != height:
             frame = cv2.resize(frame, (width, height))
             
        out.write(frame)
        
        # Calculate progress percentage
        progress = int((frame_counter / total_frames) * 100) if total_frames > 0 else 0
        
        if success:
            yield frame, progress, detection_events
        else:
            break
        
    cap.release()
    out.release()
    cv2.destroyAllWindows()
    end_time = time.time()
    process_time = end_time - start_time
    print("Processing time:", process_time, "seconds")

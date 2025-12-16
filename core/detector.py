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


def detection(path_x, zones, frame_size, taskID, conf=40):
    """
    Process video with multiple detection zones.
    
    Args:
        path_x: Path to source video
        zones: List of zone objects [{id, points, classId, color}, ...]
        frame_size: Tuple of (width, height)
        taskID: Task identifier for output file naming
        conf: Confidence threshold (1-100)
    """
    # Constants
    SOURCE_VIDEO = path_x
    DESTIN_VIDEO = 'uploads/outputs/' + 'output_' + taskID + '.mp4'

    font = cv2.FONT_ITALIC
    frame_counter = 0
    track_history = defaultdict(lambda: [])
    
    # Per-zone tracking: {zone_id: {track_id: True}}
    crossed_objects_per_zone = {z['id']: {} for z in zones}
    
    # Detection events for each zone
    detection_events = []

    width = frame_size[0]
    height = frame_size[1]

    BASE_FONT_SIZE = 1.2
    font_scale = min(width, height) / 1000 * BASE_FONT_SIZE
    BASE_FONT_THICKNESS = 2
    font_thickness = max(1, max(width, height) // 1000 * BASE_FONT_THICKNESS)

    model = YOLO('weights/yolo11n.pt')

    cap = cv2.VideoCapture(SOURCE_VIDEO)

    targetFPS = 24
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    newFPS = targetFPS if fps > targetFPS else fps
    interval = fps / newFPS
    
    process_idx = 0
    
    fourcc = cv2.VideoWriter_fourcc(*'avc1')
    out = cv2.VideoWriter(DESTIN_VIDEO, fourcc, newFPS, (width, height))

    start_time = time.time()

    # Preprocess zones
    zone_data = []
    all_class_ids = set()
    for zone in zones:
        points = zone.get('points', [])
        if len(points) < 2:
            continue
            
        # Convert points to proper format
        area = [(p['x'], p['y']) for p in points]
        area_np = np.array(area, np.int32)
        
        class_id = zone.get('classId', 19)
        all_class_ids.add(class_id)
        
        # Get color from zone (already in RGB from frontend)
        zone_color = zone.get('color', [255, 255, 0])
        # Convert to BGR for OpenCV
        bgr_color = (zone_color[2], zone_color[1], zone_color[0])
        
        zone_data.append({
            'id': zone['id'],
            'area': area,
            'area_np': area_np,
            'class_id': class_id,
            'color': bgr_color,
            'is_line': len(points) == 2,
            'label': zone.get('label', f'Zone {len(zone_data) + 1}')
        })
    
    # Convert class IDs to list for YOLO
    ClassIDs = list(all_class_ids) if all_class_ids else [19]

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
        results = model.track(frame, classes=ClassIDs, persist=True, save=False, tracker="bytetrack.yaml", conf=conf_float)
        boxes = results[0].boxes.xywh.cpu()
        track_ids = results[0].boxes.id.int().cpu().tolist() if results[0].boxes is not None and results[0].boxes.id is not None else []
        detected_classes = results[0].boxes.cls.int().cpu().tolist() if results[0].boxes is not None else []

        frame = results[0].plot()

        center_x, center_y = 0, 0
        
        # Process each detection
        for i, (box, track_id) in enumerate(zip(boxes, track_ids)):
            x, y, w, h = box
            center_x, center_y = int(x), int(y)
            detected_class = detected_classes[i] if i < len(detected_classes) else -1
            
            track = track_history[track_id]
            track.append((float(x), float(y)))
            if len(track) > 30:
                track.pop(0)
            
            # Check each zone
            for zd in zone_data:
                # Only check if detection matches zone's target class
                if detected_class != zd['class_id']:
                    continue
                    
                zone_id = zd['id']
                
                # Check if object is in zone (different logic for line vs polygon)
                in_zone = False
                if zd['is_line']:
                    # For 2-point line: check if object crosses the line
                    if len(track) >= 2:
                        prev_pos = track[-2]
                        curr_pos = track[-1]
                        line_pt1 = (int(zd['area'][0][0]), int(zd['area'][0][1]))
                        line_pt2 = (int(zd['area'][1][0]), int(zd['area'][1][1]))
                        in_zone = check_line_crossing(prev_pos, curr_pos, line_pt1, line_pt2)
                else:
                    # For 3+ point polygon: use standard containment test
                    result = cv2.pointPolygonTest(zd['area_np'], ((center_x, center_y)), False)
                    in_zone = result >= 0

                if in_zone:
                    if track_id not in crossed_objects_per_zone[zone_id]:
                        crossed_objects_per_zone[zone_id][track_id] = True
                        # Log event
                        timestamp = round(frame_counter / fps, 2)
                        detection_events.append({
                            "time": timestamp,
                            "zone_id": zone_id,
                            "class_id": zd['class_id'],
                            "count": len(crossed_objects_per_zone[zone_id])
                        })
                        
                    cv2.circle(frame, (center_x, center_y), 9, (244, 133, 66), -1) # Blue (Counting) GBR

                else:
                    if track_id in crossed_objects_per_zone[zone_id] and crossed_objects_per_zone[zone_id][track_id] == True:
                        cv2.circle(frame, (center_x, center_y), 9, (83, 168, 51), -1) # Green (Counted) GBR
                    else:
                        cv2.circle(frame, (center_x, center_y), 9, (54, 67, 234), -1) # Red (Not Counted) GBR

        # Draw all zones
        for zd in zone_data:
            if zd['is_line']:
                pt1 = (int(zd['area'][0][0]), int(zd['area'][0][1]))
                pt2 = (int(zd['area'][1][0]), int(zd['area'][1][1]))
                cv2.line(frame, pt1, pt2, zd['color'], 3)
            else:
                cv2.polylines(frame, [zd['area_np']], True, zd['color'], 3)
        
        # Draw count text for each zone (stacked vertically)
        y_offset = int(height * 0.05)
        for idx, zd in enumerate(zone_data):
            zone_id = zd['id']
            count = len(crossed_objects_per_zone.get(zone_id, {}))
            text_color = get_color_from_class_id(zd['class_id'])
            
            # Zone label with count
            zone_label = zd.get('label', f'Zone {idx + 1}')
            count_text = f"{zone_label}: {count}"
            
            text_position = (int(width * 0.02), y_offset + int(idx * height * 0.05))
            cv2.putText(frame, count_text, text_position, font, font_scale, text_color, font_thickness)
        
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

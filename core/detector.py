import cv2
from collections import defaultdict

from ultralytics import YOLO
import time
import numpy as np

def detection(path_x, Area, frame_size, areaColor, taskID):

    # Constants
    ClassID = [19]
    SOURCE_VIDEO = path_x
    DESTIN_VIDEO = 'static/files/output/' + 'output_' + taskID + '.mp4'

    font = cv2.FONT_ITALIC
    frame_counter = 0
    track_history = defaultdict(lambda: [])
    crossed_objects = {}
   
    width = frame_size[0]
    height = frame_size[1]


    BASE_FONT_SIZE = 1.5
    font_scale = min(width, height) / 1000 * BASE_FONT_SIZE
    BASE_FONT_THICKNESS = 3
    font_thickness = max(width, height) // 1000 * BASE_FONT_THICKNESS

    model = YOLO('yolo11n.pt')

    cap = cv2.VideoCapture(SOURCE_VIDEO)

    targetFPS = 12
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    newFPS = targetFPS if fps > targetFPS else fps
    interval = fps / newFPS
    array = set(round(interval * i) for i in range(total_frames))
    fourcc = cv2.VideoWriter_fourcc(*'avc1')
    out = cv2.VideoWriter(DESTIN_VIDEO, fourcc, newFPS, (width, height))

    start_time = time.time()

    while cap.isOpened():
        success, frame = cap.read()
        
        if not success:
            break
        
        frame_counter += 1

        if frame_counter not in array: 
            continue
        # if frame_counter % 5 != 0: continue

        results = model.track(frame, classes=ClassID, persist=True, save=False, tracker="bytetrack.yaml")
        boxes = results[0].boxes.xywh.cpu()
        track_ids = results[0].boxes.id.int().cpu().tolist() if results[0].boxes is not None and results[0].boxes.id is not None else []

        frame = results[0].plot()


        center_x, center_y = 0, 0

        for box, track_id in zip(boxes, track_ids):
            x, y, w, h = box
            center_x, center_y = int(x), int(y)
            results = cv2.pointPolygonTest(np.array(Area, np.int32), ((center_x, center_y)), False)
            
            track = track_history[track_id]
            track.append((float(x), float(y)))
            if len(track) > 30:
                track.pop(0)

            if results >= 0:
                if track_id not in crossed_objects:
                    crossed_objects[track_id] = True
                    
                cv2.circle(frame, (center_x, center_y), 9, (244, 133, 66), -1) # Blue (Counting) GBR

            else:
                if track_id in crossed_objects and crossed_objects[track_id] == True:
                    cv2.circle(frame, (center_x, center_y), 9, (83, 168, 51), -1) # Green (Counted) GBR
                else:
                    cv2.circle(frame, (center_x, center_y), 9, (54, 67, 234), -1) # Red (Not Counted) GBR

        cv2.polylines(frame, [np.array(Area, np.int32)], True, areaColor, 3)
        
        count_text = f"Count: {len(crossed_objects)}"

        count_text_position = (int(width * 0.855), int(height * 0.97))
        cv2.putText(frame, count_text, count_text_position, font, font_scale, (230, 232, 232), font_thickness) #  (5, 189, 251)
        
        frame = cv2.resize(frame, (width, height))
        out.write(frame)
        
        if success:
            yield frame
        else:
            break
        
    cap.release()
    out.release()
    cv2.destroyAllWindows()
    end_time = time.time()
    process_time = end_time - start_time
    print("Processing time:", process_time, "seconds")


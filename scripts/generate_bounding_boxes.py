import cv2
import numpy as np
from ultralytics import YOLO
from pathlib import Path
import torch
import json

def process_video(video_path, output_path, json_path, frame_interval=15):
    """
    Process video to detect people and save bounding boxes data.
    Args:
        video_path: Path to input video
        output_path: Path to save output video (commented out)
        json_path: Path to save bounding boxes data
        frame_interval: Process every Nth frame
    """

    model = YOLO("yolov8s.pt")  

    
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise ValueError(f"Error opening video file: {video_path}")

    
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    

    frame_count = 0
    last_boxes = None
    boxes_data = {
        "video_info": {
            "name": video_path.name,
            "width": width,
            "height": height,
            "fps": fps,
            "total_frames": total_frames,
            "frame_interval": frame_interval
        },
        "frames": {}
    }

    print(f"Processing video: {video_path.name}")
    print(f"Total frames: {total_frames}")

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        if frame_count % frame_interval == 0:
            
            results = model.predict(
                frame,
                classes=[0],  
                conf=0.2,     
                iou=0.2,      
                verbose=False
            )
            
            boxes = []
            confidences = []
            
            
            for r in results:
                for box in r.boxes:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    
                    x1, y1 = max(0, int(x1)), max(0, int(y1))
                    x2, y2 = min(width, int(x2)), min(height, int(y2))
                    boxes.append([x1, y1, x2, y2])
                    confidences.append(float(box.conf))
            
            last_boxes = boxes
            last_confidences = confidences
        
        
        if last_boxes:
            boxes_data["frames"][str(frame_count)] = {
                "boxes": last_boxes,
                "confidences": last_confidences,
                "is_keyframe": frame_count % frame_interval == 0
            }
        else:
            boxes_data["frames"][str(frame_count)] = {
                "boxes": [],
                "confidences": [],
                "is_keyframe": frame_count % frame_interval == 0
            }

        
        
        frame_count += 1
        if frame_count % 100 == 0:
            print(f"Processed {frame_count}/{total_frames} frames")

    
    cap.release()
    

    
    with open(json_path, 'w') as f:
        json.dump(boxes_data, f, indent=2)
    print(f"Bounding boxes data saved to: {json_path}")

def main():
    
    videos_dir = Path("public/videos")
    json_dir = Path("public") 
    json_dir.mkdir(exist_ok=True)
    
    video_files = sorted(videos_dir.glob("*.mp4"))
    
    if not video_files:
        print("No video files found")
        return
        
    for video_path in video_files:
        
        if video_path.stem.endswith('_boxes'):
            continue
            
        print(f"\nProcessing video: {video_path.name}")
        output_path = videos_dir / f"{video_path.stem}_boxes.mp4"  
        json_path = json_dir / f"{video_path.stem}_boxes.json"
        process_video(video_path, output_path, json_path)

if __name__ == "__main__":
    main()

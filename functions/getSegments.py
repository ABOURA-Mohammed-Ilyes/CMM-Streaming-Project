import os
import json
from flask import send_file, abort

def get_video_segments(upload_folder, folder_name, height):
    folder_path = os.path.join(upload_folder, folder_name)
    json_path = os.path.join(folder_path, f"{folder_name}.json")

    if not os.path.exists(json_path):
        return None

    with open(json_path, 'r') as json_file:
        video_info = json.load(json_file)
    
    segments_info = video_info.get("segments", {})
    segments = [f"segment_{i:04d}.mp4" for i in range(segments_info["count"])]
    return segments

def get_segment(upload_folder, folder_name, height, segment):
    # Construire le chemin complet vers le segment
    segment_folder_path = os.path.join(upload_folder, folder_name, height)
    segment_path = os.path.join(segment_folder_path, segment)

    # Vérifier si le segment existe
    if os.path.exists(segment_path):
        return send_file(segment_path, mimetype='video/mp4')
    else:
        # Retourner une erreur 404 si le segment n'existe pas
        abort(404, description="Segment non trouvé")





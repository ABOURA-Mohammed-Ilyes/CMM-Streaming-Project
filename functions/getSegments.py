import os
import json
from flask import send_file, abort, make_response

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

    # Extraire l'extension du fichier
    _, ext = os.path.splitext(segment)

    if ext.lower() == '.jpg':
        # Vérifier si le segment MP4 correspondant existe
        mp4_segment = segment.replace('.jpg', '.mp4')
        mp4_segment_path = os.path.join(segment_folder_path, mp4_segment)

        if os.path.exists(mp4_segment_path):
            # Le segment MP4 existe, retourner l'image JPG
            response = make_response(send_file(segment_path, mimetype='image/jpeg'))
            response.headers['Segment-Exists'] = 'true'
            return response
        else:
            # Le segment MP4 n'existe pas, retourner l'image par défaut
            default_image_path = os.path.join(upload_folder, 'segment_not_found.jpg')
            if os.path.exists(default_image_path):
                response = make_response(send_file(default_image_path, mimetype='image/jpeg'))
                response.headers['Segment-Exists'] = 'false'
                return response
            else:
                abort(404, description="Image par défaut introuvable")
    elif ext.lower() == '.mp4':
        # Vérifier si le segment MP4 existe
        if os.path.exists(segment_path):
            return send_file(segment_path, mimetype='video/mp4')
        else:
            # Retourner la vidéo vide par défaut
            empty_video_path = os.path.join(upload_folder, 'empty.mp4')
            if os.path.exists(empty_video_path):
                return send_file(empty_video_path, mimetype='video/mp4')
            else:
                abort(404, description="Vidéo vide par défaut introuvable")
    else:
        # Type de fichier non pris en charge
        abort(404, description="Type de fichier non pris en charge")


# def get_segment(upload_folder, folder_name, height, segment):
#     # Construire le chemin complet vers le segment
#     segment_folder_path = os.path.join(upload_folder, folder_name, height)
#     segment_path = os.path.join(segment_folder_path, segment)

#     # Vérifier si le segment existe
#     if os.path.exists(segment_path):
#         return send_file(segment_path, mimetype='video/mp4')
#     else:
#         # Retourner une erreur 404 si le segment n'existe pas
#         abort(404, description="Segment non trouvé")




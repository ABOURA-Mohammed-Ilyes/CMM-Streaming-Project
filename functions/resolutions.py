import os
import ffmpeg
import json
from functions.segmentation import segment_video

def create_resolutions(upload_folder, folder_name, target_resolution):
    folder_path = os.path.join(upload_folder, folder_name)
    json_path = os.path.join(folder_path, f"{folder_name}.json")

    # Charger les informations vidéo depuis le JSON
    with open(json_path, 'r') as json_file:
        video_info = json.load(json_file)

    video_path = video_info["Chemin"]
    output_resolution_folder = os.path.join(folder_path, target_resolution)
    os.makedirs(output_resolution_folder, exist_ok=True)

    # Créer la vidéo redimensionnée
    resized_video_path = os.path.join(output_resolution_folder, f"{folder_name}_{target_resolution}.mp4")
    ffmpeg.input(video_path).output(resized_video_path, vf=f"scale=-2:{target_resolution.split('p')[0]}").run()

    # Segmenter la vidéo redimensionnée
    segment_video(output_resolution_folder, resized_video_path, json_path, update_json=False)

    # Supprimer la vidéo redimensionnée une fois la segmentation terminée
    os.remove(resized_video_path)
    return True


def delete_original_video(upload_folder, folder_name):
    """
    Supprime la vidéo originale après le traitement des résolutions.
    """
    folder_path = os.path.join(upload_folder, folder_name)
    json_path = os.path.join(folder_path, f"{folder_name}.json")

    # Charger le chemin de la vidéo originale depuis le JSON
    with open(json_path, 'r') as json_file:
        video_info = json.load(json_file)
    original_video_path = video_info.get("Chemin")

    # Supprimer la vidéo originale
    if os.path.exists(original_video_path):
        os.remove(original_video_path)
        return True
    return False


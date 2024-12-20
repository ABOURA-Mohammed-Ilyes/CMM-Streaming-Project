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
    # Extraire la hauteur cible en s'assurant que target_resolution est un nombre
    target_height = int(''.join(filter(str.isdigit, target_resolution)))
    resized_video_path = os.path.join(output_resolution_folder, f"{folder_name}_{target_resolution}.mp4")
    ffmpeg.input(video_path).output(resized_video_path, vf=f"scale=-2:{target_height}").run()

    # Segmenter la vidéo redimensionnée
    segment_video(output_resolution_folder, resized_video_path, json_path, update_json=False)

    # Mettre à jour le JSON pour ajouter la nouvelle résolution dans segments.folder
    existing_folder = video_info.get('segments', {}).get('folder', '')
    # Séparer les résolutions existantes
    existing_resolutions = [res.strip() for res in existing_folder.split(',') if res.strip()]
    # Ajouter la nouvelle résolution si elle n'est pas déjà présente
    if target_resolution not in existing_resolutions:
        existing_resolutions.append(target_resolution)
        # Recréer la chaîne avec les résolutions séparées par des virgules
        video_info['segments']['folder'] = ', '.join(existing_resolutions)
        # Sauvegarder les informations mises à jour dans le JSON
        with open(json_path, 'w') as json_file:
            json.dump(video_info, json_file, indent=4)

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


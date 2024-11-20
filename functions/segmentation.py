import os
import uuid
import json
import ffmpeg
from flask import current_app, jsonify
from werkzeug.utils import secure_filename


def get_video_info(video_path):
    """
    Utilise ffmpeg-python pour obtenir la durée et la résolution de la vidéo.
    """
    try:
        probe = ffmpeg.probe(video_path)
        format_info = probe['format']
        stream_info = next((stream for stream in probe['streams'] if stream['codec_type'] == 'video'), None)

        duration = float(format_info['duration'])
        height = int(stream_info['height'])

        return {"duration": duration, "height": height}
    except Exception as e:
        print(f"Erreur lors de l'obtention des informations de la vidéo : {e}")
        return {"duration": "Inconnue", "height": "Inconnue"}

def process_video_intervals(input_video_path, output_video_path, time_intervals):
    try:
        segment_paths = []
        segment_dir = os.path.dirname(output_video_path)

        # Ensure that paths use forward slashes
        input_video_path = os.path.abspath(input_video_path).replace('\\', '/')
        output_video_path = os.path.abspath(output_video_path).replace('\\', '/')
        segment_dir = os.path.abspath(segment_dir).replace('\\', '/')

        for i, interval in enumerate(time_intervals):
            start_time = interval['start']
            end_time = interval['end']
            duration = end_time - start_time
            segment_filename = f"segment_{i}.mp4"
            segment_path = os.path.join(segment_dir, segment_filename).replace('\\', '/')

            # Extract the segment
            (
                ffmpeg
                .input(input_video_path, ss=start_time, t=duration)
                .output(segment_path, c='copy')
                .overwrite_output()
                .run()
            )

            segment_paths.append(segment_path)

        # Create the segments.txt file with absolute paths and forward slashes
        list_file_path = os.path.join(segment_dir, 'segments.txt').replace('\\', '/')
        with open(list_file_path, 'w') as f:
            for segment_path in segment_paths:
                # Paths are already absolute and use forward slashes
                f.write(f"file '{segment_path}'\n")

        # Print the content of segments.txt for debugging
        print("Contenu de segments.txt :")
        with open(list_file_path, 'r') as f_debug:
            print(f_debug.read())

        # Concatenate the segments using ffmpeg-python
        (
            ffmpeg
            .input(list_file_path, format='concat', safe=0)
            .output(output_video_path, c='copy')
            .overwrite_output()
            .run()
        )

        # Clean up temporary files
        for segment_path in segment_paths:
            os.remove(segment_path)
        os.remove(list_file_path)

        return True
    except Exception as e:
        print(f"Erreur lors du traitement des intervalles de temps : {e}")
        raise  # Re-raise the exception to be caught in the calling function

def save_video_and_info(file, upload_folder, time_intervals=None):
    # Code to generate GUID and create unique folder
    video_name = secure_filename(file.filename)
    guid = uuid.uuid4()
    folder_name = f"{os.path.splitext(video_name)[0]}_{guid}"
    folder_path = os.path.join(upload_folder, folder_name)
    os.makedirs(folder_path, exist_ok=True)

    # Enregistrer la vidéo originale temporairement
    temp_video_path = os.path.join(folder_path, f"original_{folder_name}.mp4")
    file.save(temp_video_path)

    # Traiter les intervalles de temps si fournis
    if time_intervals:
        final_video_path = os.path.join(folder_path, f"{folder_name}.mp4")
        success = process_video_intervals(temp_video_path, final_video_path, time_intervals)
        if not success:
            return jsonify({"error": "Erreur lors du traitement des intervalles de temps"}), 500
        # Supprimer la vidéo originale temporaire si le traitement a réussi
        os.remove(temp_video_path)
    else:
        # Renommer la vidéo originale comme vidéo finale
        final_video_path = os.path.join(folder_path, f"{folder_name}.mp4")
        os.rename(temp_video_path, final_video_path)

    # Récupérer les informations de la vidéo finale
    video_info = get_video_info(final_video_path)
    video_info.update({
        "NomVideo": video_name,
        "NomDossier": folder_name,
        "Chemin": final_video_path
    })

    # Enregistrer les informations dans un fichier JSON
    json_filename = f"{folder_name}.json"
    json_filepath = os.path.join(folder_path, json_filename)
    with open(json_filepath, 'w') as json_file:
        json.dump(video_info, json_file, indent=4)

    return folder_name  # Retourne le nom du dossier

def segment_video_original(folder_path, json_path):
    # Charger les informations depuis le fichier JSON
    with open(json_path, 'r') as json_file:
        video_info = json.load(json_file)

    video_path = video_info["Chemin"]
    duration = video_info["duration"]
    height = int(video_info["height"])
    segment_folder_name = f"{height}"  # Dossier pour les segments (e.g., "720")
    segment_folder_path = os.path.join(folder_path, segment_folder_name)
    os.makedirs(segment_folder_path, exist_ok=True)

    segment_duration = 10  # Durée de chaque segment en secondes
    num_segments = int(duration // segment_duration) + (1 if duration % segment_duration > 0 else 0)

    # Créer les segments avec ffmpeg
    for i in range(num_segments):
        start_time = i * segment_duration
        segment_filename = f"segment_{i:04d}.mp4"
        segment_path = os.path.join(segment_folder_path, segment_filename)

        ffmpeg.input(video_path, ss=start_time, t=segment_duration).output(segment_path).run()

    # Mettre à jour le JSON avec les informations des segments
    video_info["segments"] = {
        "folder": segment_folder_name,
        "count": num_segments,
        "segment_duration": segment_duration,
        "segments": [f"segment_{i:04d}.mp4" for i in range(num_segments)]
    }

    # Sauvegarder les informations mises à jour dans le JSON
    with open(json_path, 'w') as json_file:
        json.dump(video_info, json_file, indent=4)

    return video_info["segments"], segment_folder_name

def segment_video(folder_path, video_path, json_path, update_json=True):
    with open(json_path, 'r') as json_file:
        video_info = json.load(json_file)

    # Déterminer les paramètres de segmentation
    duration = video_info["duration"]
    segment_duration = 10  # En secondes
    num_segments = int(duration // segment_duration) + (1 if duration % segment_duration > 0 else 0)
    resolution_folder = os.path.basename(folder_path)  # Utiliser le nom du dossier pour identifier la résolution

    # Créer le dossier pour stocker les segments si nécessaire
    os.makedirs(folder_path, exist_ok=True)
    
    # Créer chaque segment avec ffmpeg
    for i in range(num_segments):
        start_time = i * segment_duration
        segment_filename = f"segment_{i:04d}.mp4"
        segment_path = os.path.join(folder_path, segment_filename)

        ffmpeg.input(video_path, ss=start_time, t=segment_duration).output(segment_path).run()

    # Mettre à jour le fichier JSON avec les informations des segments si nécessaire
    if update_json:
        video_info["segments"] = {
            "original_resolution": video_info["height"],
            "count": num_segments,
            "segment_duration": segment_duration,
            "segments": [f"segment_{i:04d}.mp4" for i in range(num_segments)]
        }
        video_info["available_resolutions"] = video_info.get("available_resolutions", []) + [resolution_folder]

        # Sauvegarder les informations mises à jour dans le JSON
        with open(json_path, 'w') as json_file:
            json.dump(video_info, json_file, indent=4)

    return True
import ffmpeg
import os

class VideoProcessingError(Exception):
    """Exception personnalisée pour les erreurs de traitement vidéo."""
    pass

def segment_video(video_path, video_original_name, video_id, segments_folder='Uploads', segment_duration=10):
    # Extraire le nom de la vidéo sans extension
    video_name = os.path.splitext(os.path.basename(video_original_name))[0]

    # Récupérer la résolution de la vidéo
    resolution = get_video_resolution(video_path)
    if resolution == "unknown":
        raise VideoProcessingError("Impossible de récupérer la résolution de la vidéo.")

    # Créer le dossier segments/nouveau_dossier_de_resolution
    output_directory = os.path.join(segments_folder, f"{video_name}_{video_id}", resolution)
    os.makedirs(output_directory, exist_ok=True)

    # Définir le modèle de nom pour les segments
    output_template = os.path.join(output_directory, "segment_%03d.mp4")
    
    try:
        (
            ffmpeg
            .input(video_path)
            .output(output_template, format='segment', segment_time=segment_duration, reset_timestamps=1, vcodec='copy', acodec='copy')
            .run(capture_stdout=True, capture_stderr=True)
        )
    except ffmpeg.Error as e:
        print("Erreur lors de la segmentation :", e.stderr.decode())
        raise VideoProcessingError("Erreur lors de la segmentation de la vidéo.")  # Lever une exception

    # Récupère les segments générés et retourne leurs chemins
    segment_files = sorted([f for f in os.listdir(output_directory) if f.startswith("segment_")])
    segment_urls = [os.path.join(output_directory, segment) for segment in segment_files]

    return segment_urls


def get_video_resolution(video_path):
    try:
        probe = ffmpeg.probe(video_path)
        video_stream = next((stream for stream in probe['streams'] if stream['codec_type'] == 'video'), None)
        if video_stream is None:
            raise VideoProcessingError("Aucun flux vidéo trouvé.")

        height = video_stream['height']
        return f"{height}p"
    except ffmpeg.Error as e:
        print("Erreur lors de la récupération de la résolution :", e.stderr.decode())
        return "unknown"
    except StopIteration:
        print("Erreur : Aucun flux vidéo dans le fichier.")
        return "unknown"
    

def create_resolutions(video_path, video_id, target_resolutions=['720p', '480p', '360p']):
    """
    Crée des versions de la vidéo dans des résolutions inférieures et retourne les chemins de ces vidéos.
    """
    # Obtenir la résolution actuelle de la vidéo
    current_resolution = get_video_resolution(video_path)
    current_height = int(current_resolution.replace("p", ""))

    # Filtrer les résolutions à créer
    resolutions_to_create = [res for res in target_resolutions if int(res.replace("p", "")) < current_height]
    
    # Stocker les chemins des vidéos créées
    created_videos = {}

    # Créer les vidéos pour chaque résolution inférieure
    for resolution in resolutions_to_create:
        height = int(resolution.replace("p", ""))
        
        # Définir le dossier de destination avec l'ID
        output_folder = os.path.join(f"Uploads")
        os.makedirs(output_folder, exist_ok=True)  # Créer le dossier si nécessaire
        
        output_path = os.path.join(output_folder, f"{resolution}_{os.path.splitext(os.path.basename(video_path))[0]}.mp4")
        
        try:
            (
                ffmpeg
                .input(video_path)
                .output(output_path, vf=f"scale=-2:{height}", vcodec='libx264', acodec='aac')
                .run(capture_stdout=True, capture_stderr=True)
            )
            created_videos[resolution] = output_path
        except ffmpeg.Error as e:
            print(f"Erreur lors de la création de la résolution {resolution} :", e.stderr.decode())
            raise VideoProcessingError(f"Erreur lors de la création de la résolution {resolution}")

    return created_videos

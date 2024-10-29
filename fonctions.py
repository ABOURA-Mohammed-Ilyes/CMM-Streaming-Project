import ffmpeg
import os

def segment_video(video_path, video_id, segments_folder='segments', segment_duration=10):
    # Crée le dossier de segments s'il n'existe pas
    os.makedirs(segments_folder, exist_ok=True)
    
    # Définir le modèle de nom pour les segments
    output_template = os.path.join(segments_folder, f"{video_id}_segment_%03d.mp4")
    
    try:
        (
            ffmpeg
            .input(video_path)
            .output(output_template, format='segment', segment_time=segment_duration, reset_timestamps=1)
            .run()
        )
    except ffmpeg.Error as e:
        print("Erreur lors de la segmentation :", e)
        return []

    segment_files = sorted([f for f in os.listdir(segments_folder) if f.startswith(video_id)])
    segment_urls = [os.path.join(segments_folder, segment) for segment in segment_files]

    return segment_urls

import os
import uuid
from flask import Flask, request, jsonify, render_template
from fonctions import segment_video, create_resolutions, VideoProcessingError

app = Flask(__name__)

UPLOAD_FOLDER = 'Uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/')
def home():
    return render_template('streaming.html')

@app.route('/upload', methods=['POST'])
def upload_video():
    if 'file' not in request.files:
        return jsonify({'error': 'Aucun fichier trouvé dans la requête'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Nom de fichier vide'}), 400

    # Générer un identifiant unique et chemin temporaire pour la vidéo
    video_id = str(uuid.uuid4())
    video_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    
    # Enregistrer temporairement la vidéo
    file.save(video_path)

    try:
        # Créer les résolutions inférieures de la vidéo
        resolutions_videos = create_resolutions(video_path, video_id)

        # Segmentation de la vidéo principale
        segments_main = segment_video(video_path, video_path, video_id)

        # Segmentation des versions à résolution inférieure
        all_segments = {'original': segments_main}
        for resolution, res_video_path in resolutions_videos.items():
            all_segments[resolution] = segment_video(res_video_path, video_path, video_id)
            os.remove(res_video_path)  # Supprimer chaque vidéo redimensionnée après segmentation

        # Supprimer la vidéo originale après segmentation
        os.remove(video_path)
    except VideoProcessingError as e:
        # Supprimer les fichiers temporaires en cas d'erreur
        os.remove(video_path)
        return jsonify({'error': str(e)}), 500

    return jsonify({'message': 'Vidéo téléchargée et segmentée avec succès', 'segments': all_segments}), 200
if __name__ == '__main__':
    app.run(debug=True)

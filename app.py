from flask import Flask, request, jsonify, render_template
import os
import uuid
from fonctions import segment_video

app = Flask(__name__)

UPLOAD_FOLDER = 'uploads'
SEGMENTS_FOLDER = 'segments'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(SEGMENTS_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SEGMENTS_FOLDER'] = SEGMENTS_FOLDER

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

    # Sauvegarde temporaire de la vidéo
    video_id = str(uuid.uuid4())
    video_path = os.path.join(app.config['UPLOAD_FOLDER'], video_id + "_" + file.filename)
    file.save(video_path)

    # Appelle la fonction de segmentation
    segments = segment_video(video_path, video_id, app.config['SEGMENTS_FOLDER'])

    return jsonify({'message': 'Vidéo téléchargée et segmentée avec succès', 'segments': segments}), 200

if __name__ == '__main__':
    app.run(debug=True)

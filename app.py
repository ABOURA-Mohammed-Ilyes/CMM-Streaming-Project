import os
from flask import Flask, render_template, jsonify, request
from functions.segmentation import save_video_and_info, segment_video_original
from functions.displayVideos import get_all_video_metadata
from functions.getSegments import get_segment
from functions.resolutions import create_resolutions, delete_original_video
import json 

app = Flask(__name__)

###### variables ######
UPLOAD_FOLDER = 'static/uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


###### PAGES ######
@app.route('/')
def home():
    return render_template('home.html')

@app.route('/upload')
def upload():
    return render_template('upload.html')


@app.route('/watch')
def watch():
    return render_template('watch.html')



##### API CALL ######

@app.route('/api/upload', methods=['POST'])
def upload_video():
    if 'video' not in request.files:
        return jsonify({"error": "Aucun fichier trouvé"}), 400

    file = request.files['video']
    if file.filename == '':
        return jsonify({"error": "Nom de fichier vide"}), 400

    # Récupérer les intervalles de temps depuis le formulaire
    time_intervals = request.form.get('time_intervals')
    if time_intervals:
        try:
            time_intervals = json.loads(time_intervals)
        except json.JSONDecodeError:
            return jsonify({"error": "Format des intervalles de temps invalide"}), 400
    else:
        time_intervals = None

    # Enregistrer la vidéo et les informations
    folder_name = save_video_and_info(file, app.config['UPLOAD_FOLDER'], time_intervals)
    return jsonify({"success": f"Vidéo sauvegardée dans le dossier {folder_name}", "folder_name": folder_name}), 200

@app.route('/api/segment/<folder_name>', methods=['POST'])
def segment_route(folder_name):
    folder_path = os.path.join(app.config['UPLOAD_FOLDER'], folder_name)
    json_path = os.path.join(folder_path, f"{folder_name}.json")

    if not os.path.exists(json_path):
        return jsonify({"error": "Fichier JSON non trouvé"}), 404
    
    segments_info, resolution = segment_video_original(folder_path, json_path)
    return jsonify({"success": "Segmentation terminée", "segments": segments_info, "resolution" : resolution}), 200

@app.route('/api/videos', methods=['GET'])
def fetch_videos():
    video_data = get_all_video_metadata(app.config['UPLOAD_FOLDER'])
    return jsonify(video_data), 200

@app.route('/api/video_info/<folder_name>', methods=['GET'])
def fetch_video_info(folder_name):
    # Passer le nom du dossier à la fonction s'il est spécifié, sinon traiter tous les dossiers
    video_data = get_all_video_metadata(app.config['UPLOAD_FOLDER'], folder_name=folder_name)
    
    return jsonify(video_data), 200

@app.route('/api/segments/<folder_name>/<resolution>/<segment>', methods=['GET'])
def fetch_segment(folder_name, resolution, segment):
    return get_segment(app.config['UPLOAD_FOLDER'], folder_name, resolution, segment)

@app.route('/api/create_resolution/<folder_name>/<resolution>', methods=['POST'])
def create_resolution(folder_name, resolution):
    # Appel de la fonction pour créer la résolution
    resolution_created = create_resolutions(app.config['UPLOAD_FOLDER'], folder_name, resolution)

    if resolution_created:
        return jsonify({"success": f"Résolution {resolution} créée avec succès et vidéo originale supprimée"}), 200
    else:
        return jsonify({"error": f"Erreur lors de la création de la résolution {resolution}"}), 500

@app.route('/api/delete_original/<folder_name>', methods=['POST'])
def delete_original(folder_name):
    # Appel de la fonction pour supprimer la vidéo originale
    success = delete_original_video(app.config['UPLOAD_FOLDER'], folder_name)

    if success:
        return jsonify({"success": "Vidéo originale supprimée avec succès"}), 200
    else:
        return jsonify({"error": "Erreur : la vidéo originale n'a pas été trouvée ou suppression échouée"}), 404
    













    

###### MAIN ######
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

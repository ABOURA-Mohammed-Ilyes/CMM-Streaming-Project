from flask import Flask, request, jsonify, render_template
import os

app = Flask(__name__)

# Configuration pour le dossier d'upload
UPLOAD_FOLDER = 'Uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/')
def home():
    return render_template('streaming.html')  # Affiche le fichier HTML comme page d'accueil

@app.route('/upload', methods=['POST'])
def upload_video():
    # Vérifie si un fichier a été envoyé
    if 'file' not in request.files:
        return jsonify({'error': 'Aucun fichier trouvé dans la requête'}), 400

    file = request.files['file']

    # Vérifie que le fichier a un nom et une extension valide
    if file.filename == '':
        return jsonify({'error': 'Nom de fichier vide'}), 400

    # Enregistre le fichier dans le dossier d'uploads
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(file_path)

    return jsonify({'message': 'Vidéo téléchargée avec succès', 'file_path': file_path}), 200

if __name__ == '__main__':
    app.run(debug=True)

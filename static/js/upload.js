class VideoUploader {
    constructor() {
        this.videoInput = document.getElementById('videoInput');
        this.statusContainer = document.getElementById('uploadStatus');
        this.init();
    }

    init() {
        this.videoInput.addEventListener('change', (event) => {
            const files = event.target.files;
            Array.from(files).forEach((file) => {
                this.createStatusElement(file.name);
                this.uploadVideo(file);
            });
        });
    }

    createStatusElement(fileName) {
        const statusElement = document.createElement('div');
        statusElement.classList.add('upload-status');
        statusElement.id = `status-${fileName}`;
        statusElement.innerHTML = `<strong>${fileName}</strong>: <span class="status-text">En attente...</span>`;
        this.statusContainer.appendChild(statusElement);
    }

    updateStatus(fileName, statusText) {
        const statusElement = document.getElementById(`status-${fileName}`);
        if (statusElement) {
            statusElement.querySelector('.status-text').textContent = statusText;
        }
    }

    uploadVideo(file) {
        const formData = new FormData();
        formData.append('video', file);

        this.updateStatus(file.name, 'Upload en cours...');

        fetch('/api/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.updateStatus(file.name, 'Upload terminé.');
                console.log(`Upload de ${file.name} terminé.`);
                const folderName = data.folder_name;
                this.segmentVideo(file.name, folderName);
            } else {
                this.updateStatus(file.name, 'Erreur lors de l\'upload.');
                console.error(`Erreur lors de l'upload de ${file.name}.`);
            }
        })
        .catch(error => {
            this.updateStatus(file.name, 'Erreur lors de l\'upload.');
            console.error(`Erreur lors de l'upload de ${file.name}: ${error}`);
        });
    }

    segmentVideo(fileName, folderName) {
        this.updateStatus(fileName, 'Segmentation en cours...');

        fetch(`/api/segment/${folderName}`, {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.updateStatus(fileName, 'Segmentation terminée.');
                console.log(`Segmentation de ${fileName} terminée.`);
                this.createResolutions(fileName, folderName, data.resolution);
            } else {
                this.updateStatus(fileName, 'Erreur lors de la segmentation.');
                console.error(`Erreur lors de la segmentation de ${fileName}.`);
            }
        })
        .catch(error => {
            this.updateStatus(fileName, 'Erreur lors de la segmentation.');
            console.error(`Erreur lors de la segmentation de ${fileName}: ${error}`);
        });
    }

    createResolutions(fileName, folderName, originalResolution) {
        const resolutions = this.getTargetResolutions(originalResolution);
    
        // Boucle pour créer chaque résolution l'une après l'autre
        resolutions.reduce((promise, resolution) => {
            return promise.then(() => {
                return this.createResolution(fileName, folderName, resolution);
            });
        }, Promise.resolve())
        .then(() => {
            // Appel API pour supprimer la vidéo originale après les résolutions
            this.deleteOriginalVideo(fileName, folderName);
        });
    }

    getTargetResolutions(originalResolution) {
        // Définir les résolutions cibles en fonction de la résolution d'origine
        if (originalResolution === '1080') return ['720', '480', '360'];
        if (originalResolution === '720') return ['480', '360'];
        if (originalResolution === '480') return ['360'];
        return []; // Si la résolution est déjà 360p, aucune création
    }

    createResolution(fileName, folderName, resolution) {
        this.updateStatus(fileName, `Création de la résolution ${resolution}...`);

        return fetch(`/api/create_resolution/${folderName}/${resolution}`, {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.updateStatus(fileName, `Résolution ${resolution} terminée.`);
                console.log(`Résolution ${resolution} de ${fileName} terminée.`);
            } else {
                this.updateStatus(fileName, `Erreur lors de la création de la résolution ${resolution}.`);
                console.error(`Erreur lors de la création de la résolution ${resolution} pour ${fileName}.`);
            }
        })
        .catch(error => {
            this.updateStatus(fileName, `Erreur lors de la création de la résolution ${resolution}.`);
            console.error(`Erreur lors de la création de la résolution ${resolution} pour ${fileName}: ${error}`);
        });
    }

    deleteOriginalVideo(fileName, folderName) {
        this.updateStatus(fileName, 'Suppression de la vidéo originale...');
    
        fetch(`/api/delete_original/${folderName}`, {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.updateStatus(fileName, 'Vidéo originale supprimée.');
                console.log(`Vidéo originale de ${fileName} supprimée.`);
                window.location.href = '/';
            } else {
                this.updateStatus(fileName, 'Erreur lors de la suppression de la vidéo originale.');
                console.error(`Erreur lors de la suppression de la vidéo originale de ${fileName}.`);
            }
        })
        .catch(error => {
            this.updateStatus(fileName, 'Erreur lors de la suppression de la vidéo originale.');
            console.error(`Erreur lors de la suppression de la vidéo originale de ${fileName}: ${error}`);
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new VideoUploader();
});
class VideoUploader {
    constructor() {
        this.videoInput = document.getElementById('videoInput');
        this.statusContainer = document.getElementById('uploadStatus');
        this.files = {};
        this.init();
    }

    init() {
        this.videoInput.addEventListener('change', (event) => {
            const files = event.target.files;
            Array.from(files).forEach((file) => {
                // Générer un identifiant unique pour chaque fichier pour éviter les collisions de noms
                const fileId = `${file.name}-${Date.now()}`;
                this.files[fileId] = file;
                this.createStatusElement(fileId, file);
                this.loadVideoMetadata(file, fileId);
            });
        });
    }

    loadVideoMetadata(file, fileId) {
        const fileURL = URL.createObjectURL(file);
        const video = document.createElement('video');
        video.preload = 'metadata';

        video.onloadedmetadata = () => {
            window.URL.revokeObjectURL(fileURL);
            const duration = video.duration;
            const videoHeight = video.videoHeight;

            this.files[fileId].duration = duration;
            this.files[fileId].videoHeight = videoHeight;

            const statusElement = document.getElementById(`status-${fileId}`);
            const durationElement = statusElement.querySelector('.video-duration');
            durationElement.textContent = `Durée : ${this.formatTime(duration)}`;

            // Afficher les options de résolution
            this.displayResolutionOptions(fileId, videoHeight);
        };

        video.src = fileURL;
    }

    mapResolution(videoHeight) {
        if (videoHeight >= 1080) return '1080';
        if (videoHeight >= 720) return '720';
        if (videoHeight >= 640) return '640';
        if (videoHeight >= 480) return '480';
        if (videoHeight >= 360) return '360';
        if (videoHeight >= 240) return '240';
        return '240';
    }

    getTargetResolutions(originalResolution) {
        const resolutions = [];
        const allResolutions = ['1080', '720', '640', '480', '360', '240'];

        const index = allResolutions.indexOf(originalResolution);
        if (index !== -1) {
            // Inclure toutes les résolutions égales ou inférieures à la résolution originale
            return allResolutions.slice(index);
        }
        return ['240'];
    }

    displayResolutionOptions(fileId, videoHeight) {
        const originalResolution = this.mapResolution(videoHeight);
        this.files[fileId].originalResolution = originalResolution; // Stocker la résolution originale
        const resolutions = this.getTargetResolutions(originalResolution);
    
        const statusElement = document.getElementById(`status-${fileId}`);
        const resolutionOptionsContainer = document.createElement('div');
        resolutionOptionsContainer.classList.add('resolution-options-container');
    
        const label = document.createElement('label');
        label.textContent = 'Choisissez les résolutions à créer :';
        resolutionOptionsContainer.appendChild(label);
    
        // Ajouter une option "Tout"
        const selectAllCheckbox = document.createElement('input');
        selectAllCheckbox.type = 'checkbox';
        selectAllCheckbox.id = `resolution-${fileId}-all`;
        selectAllCheckbox.classList.add('resolution-checkbox-all');
    
        const selectAllLabel = document.createElement('label');
        selectAllLabel.htmlFor = selectAllCheckbox.id;
        selectAllLabel.textContent = 'Tout';
    
        resolutionOptionsContainer.appendChild(selectAllCheckbox);
        resolutionOptionsContainer.appendChild(selectAllLabel);
        resolutionOptionsContainer.appendChild(document.createElement('br'));
    
        // Écouteur pour la case "Tout"
        selectAllCheckbox.addEventListener('change', () => {
            const checkboxes = resolutionOptionsContainer.querySelectorAll('.resolution-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = selectAllCheckbox.checked;
            });
        });
    
        // Ajouter les cases à cocher pour chaque résolution
        resolutions.forEach(resolution => {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = resolution;
            checkbox.id = `resolution-${fileId}-${resolution}`;
            checkbox.classList.add('resolution-checkbox');
    
            // Cocher par défaut la résolution originale
            if (resolution === originalResolution) {
                checkbox.checked = true;
            }
    
            const checkboxLabel = document.createElement('label');
            checkboxLabel.htmlFor = checkbox.id;
            checkboxLabel.textContent = `${resolution}p`;
    
            resolutionOptionsContainer.appendChild(checkbox);
            resolutionOptionsContainer.appendChild(checkboxLabel);
            resolutionOptionsContainer.appendChild(document.createElement('br'));
    
            // Écouteur pour les cases à cocher individuelles
            checkbox.addEventListener('change', () => {
                if (!checkbox.checked) {
                    selectAllCheckbox.checked = false;
                } else {
                    const checkboxes = resolutionOptionsContainer.querySelectorAll('.resolution-checkbox');
                    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                    selectAllCheckbox.checked = allChecked;
                }
            });
        });
    
        statusElement.appendChild(resolutionOptionsContainer);
    }
    

    formatTime(seconds) {
        const secNum = parseInt(seconds, 10);
        const hours = Math.floor(secNum / 3600);
        const minutes = Math.floor((secNum - (hours * 3600)) / 60);
        const secs = Math.floor(secNum % 60);

        return [hours, minutes, secs]
            .map(v => v < 10 ? '0' + v : v)
            .join(':');
    }

    parseTime(timeStr) {
        const parts = timeStr.split(':').map(part => part.trim());
        if (parts.length === 3) {
            const hours = parseInt(parts[0], 10);
            const minutes = parseInt(parts[1], 10);
            const seconds = parseFloat(parts[2]);
            return hours * 3600 + minutes * 60 + seconds;
        } else if (parts.length === 2) {
            const minutes = parseInt(parts[0], 10);
            const seconds = parseFloat(parts[1]);
            return minutes * 60 + seconds;
        } else if (parts.length === 1) {
            return parseFloat(parts[0]);
        } else {
            return NaN;
        }
    }

    createStatusElement(fileId, file) {
        const statusElement = document.createElement('div');
        statusElement.classList.add('upload-status');
        statusElement.id = `status-${fileId}`;

        const fileNameElement = document.createElement('strong');
        fileNameElement.textContent = file.name;

        const durationElement = document.createElement('div');
        durationElement.classList.add('video-duration');
        durationElement.textContent = 'Durée : Chargement...';

        const videoPreview = document.createElement('video');
        videoPreview.classList.add('video-preview');
        videoPreview.controls = true;
        videoPreview.style.width = '100%';

        const fileURL = URL.createObjectURL(file);
        videoPreview.src = fileURL;

        videoPreview.onloadeddata = () => {
            URL.revokeObjectURL(fileURL);
        };

        const statusTextElement = document.createElement('span');
        statusTextElement.classList.add('status-text');
        statusTextElement.textContent = 'En attente...';

        const timeIntervalsContainer = document.createElement('div');
        timeIntervalsContainer.classList.add('time-intervals-container');

        const errorContainer = document.createElement('div');
        errorContainer.classList.add('error-container');

        const addTimeIntervalButton = document.createElement('button');
        addTimeIntervalButton.textContent = 'Ajouter un intervalle de temps';
        addTimeIntervalButton.classList.add('small-button'); // Réduction de la taille du bouton
        addTimeIntervalButton.addEventListener('click', () => {
            this.addTimeInterval(timeIntervalsContainer, videoPreview);
        });

        const uploadButton = document.createElement('button');
        uploadButton.textContent = 'Upload';
        uploadButton.classList.add('small-button'); // Réduction de la taille du bouton
        uploadButton.addEventListener('click', () => {
            this.uploadVideoWithIntervals(fileId);
        });

        // Création du conteneur pour les boutons
        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('button-container');
        buttonContainer.appendChild(addTimeIntervalButton);
        buttonContainer.appendChild(uploadButton);

        statusElement.appendChild(fileNameElement);
        statusElement.appendChild(document.createTextNode(': '));
        statusElement.appendChild(statusTextElement);
        statusElement.appendChild(durationElement);
        statusElement.appendChild(videoPreview);
        statusElement.appendChild(timeIntervalsContainer);
        statusElement.appendChild(buttonContainer); // Ajout du conteneur de boutons
        statusElement.appendChild(errorContainer);

        this.statusContainer.appendChild(statusElement);
    }

    addTimeInterval(container, videoPreview) {
        const intervalDiv = document.createElement('div');
        intervalDiv.classList.add('time-interval');

        const startInput = document.createElement('input');
        startInput.type = 'text';
        startInput.placeholder = 'Début (HH:MM:SS)';
        startInput.classList.add('start-time');

        const setStartButton = document.createElement('button');
        setStartButton.textContent = 'Définir début';
        setStartButton.classList.add('small-button'); // Réduction de la taille du bouton
        setStartButton.addEventListener('click', () => {
            const currentTime = videoPreview.currentTime;
            startInput.value = this.formatTime(currentTime);
        });

        const endInput = document.createElement('input');
        endInput.type = 'text';
        endInput.placeholder = 'Fin (HH:MM:SS)';
        endInput.classList.add('end-time');

        const setEndButton = document.createElement('button');
        setEndButton.textContent = 'Définir fin';
        setEndButton.classList.add('small-button'); // Réduction de la taille du bouton
        setEndButton.addEventListener('click', () => {
            const currentTime = videoPreview.currentTime;
            endInput.value = this.formatTime(currentTime);
        });

        const removeButton = document.createElement('button');
        removeButton.textContent = 'Supprimer';
        removeButton.classList.add('small-button'); // Réduction de la taille du bouton
        removeButton.addEventListener('click', () => {
            container.removeChild(intervalDiv);
        });

        // Ajout des éléments au conteneur de l'intervalle
        intervalDiv.appendChild(startInput);
        intervalDiv.appendChild(setStartButton);
        intervalDiv.appendChild(endInput);
        intervalDiv.appendChild(setEndButton);
        intervalDiv.appendChild(removeButton);

        container.appendChild(intervalDiv);
    }

    uploadVideoWithIntervals(fileId) {
        const file = this.files[fileId];
        if (!file) {
            console.error(`Fichier ${fileId} non trouvé.`);
            return;
        }

        const statusElement = document.getElementById(`status-${fileId}`);
        const errorContainer = statusElement.querySelector('.error-container');
        errorContainer.innerHTML = ''; // Réinitialiser les erreurs précédentes

        const timeIntervalsContainer = statusElement.querySelector('.time-intervals-container');
        const intervalDivs = timeIntervalsContainer.querySelectorAll('.time-interval');

        const timeIntervals = Array.from(intervalDivs).map(intervalDiv => {
            const startTimeStr = intervalDiv.querySelector('.start-time').value;
            const endTimeStr = intervalDiv.querySelector('.end-time').value;

            const startTime = this.parseTime(startTimeStr);
            const endTime = this.parseTime(endTimeStr);

            return { start: startTime, end: endTime, startStr: startTimeStr, endStr: endTimeStr };
        });

        // Validation des intervalles
        let hasError = false;
        timeIntervals.forEach(interval => {
            if (isNaN(interval.start) || isNaN(interval.end)) {
                const errorMsg = `Les heures doivent être au format HH:MM:SS. Erreur sur l'intervalle ${interval.startStr} - ${interval.endStr}`;
                this.displayError(errorContainer, errorMsg);
                hasError = true;
            } else if (interval.start >= interval.end) {
                const errorMsg = `L'heure de début doit être inférieure à l'heure de fin. Erreur sur l'intervalle ${interval.startStr} - ${interval.endStr}`;
                this.displayError(errorContainer, errorMsg);
                hasError = true;
            } else if (interval.end > file.duration) {
                const errorMsg = `L'heure de fin ne peut pas dépasser la durée de la vidéo. Erreur sur l'intervalle ${interval.startStr} - ${interval.endStr}`;
                this.displayError(errorContainer, errorMsg);
                hasError = true;
            }
        });

        if (hasError) {
            return;
        }

        // Récupérer les résolutions sélectionnées
        const resolutionOptionsContainer = statusElement.querySelector('.resolution-options-container');
        const selectedResolutionCheckboxes = resolutionOptionsContainer.querySelectorAll('.resolution-checkbox:checked');
        const selectedResolutions = Array.from(selectedResolutionCheckboxes).map(cb => cb.value);

        if (selectedResolutions.length === 0) {
            this.displayError(errorContainer, 'Veuillez sélectionner au moins une résolution.');
            return;
        }

        // Stocker les résolutions sélectionnées
        this.files[fileId].selectedResolutions = selectedResolutions;

        // Créer le FormData avec la vidéo, les intervalles de temps et les résolutions sélectionnées
        const formData = new FormData();
        formData.append('video', file);
        formData.append('time_intervals', JSON.stringify(timeIntervals.map(interval => ({ start: interval.start, end: interval.end }))));
        formData.append('selected_resolutions', JSON.stringify(selectedResolutions));

        this.updateStatus(fileId, 'Upload en cours...');

        fetch('/api/upload', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.updateStatus(fileId, 'Upload terminé.');
                    const folderName = data.folder_name;
                    // Appeler la segmentation
                    this.segmentVideo(fileId, folderName);
                } else {
                    this.updateStatus(fileId, 'Erreur lors de l\'upload.');
                    console.error(`Erreur lors de l'upload de ${file.name}: ${data.error}`);
                }
            })
            .catch(error => {
                this.updateStatus(fileId, 'Erreur lors de l\'upload.');
                console.error(`Erreur lors de l'upload de ${file.name}: ${error}`);
            });
    }

    segmentVideo(fileId, folderName) {
        this.updateStatus(fileId, 'Segmentation en cours...');

        fetch(`/api/segment/${folderName}`, {
            method: 'POST'
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.updateStatus(fileId, 'Segmentation terminée.');
                    console.log(`Segmentation de ${fileId} terminée.`);
                    // Utiliser les résolutions sélectionnées
                    const selectedResolutions = this.files[fileId].selectedResolutions;
                    this.createResolutions(fileId, folderName, selectedResolutions);
                } else {
                    this.updateStatus(fileId, 'Erreur lors de la segmentation.');
                    console.error(`Erreur lors de la segmentation de ${fileId}: ${data.error}`);
                }
            })
            .catch(error => {
                this.updateStatus(fileId, 'Erreur lors de la segmentation.');
                console.error(`Erreur lors de la segmentation de ${fileId}: ${error}`);
            });
    }

    updateStatus(fileId, statusText) {
        const statusElement = document.getElementById(`status-${fileId}`);
        if (statusElement) {
            statusElement.querySelector('.status-text').textContent = statusText;
        }
    }

    displayError(container, message) {
        const errorMsg = document.createElement('div');
        errorMsg.classList.add('error-message');
        errorMsg.textContent = message;
        container.appendChild(errorMsg);
    }

    createResolutions(fileId, folderName, selectedResolutions) {
        // Récupérer la résolution originale
        const originalResolution = this.files[fileId].originalResolution;

        // Filtrer les résolutions pour exclure la résolution originale
        const resolutionsToCreate = selectedResolutions.filter(resolution => resolution !== originalResolution);

        if (resolutionsToCreate.length === 0) {
            // Si aucune résolution à créer (parce que seule la résolution originale était sélectionnée)
            this.updateStatus(fileId, 'Toutes les résolutions sont déjà disponibles.');
            // Appeler la suppression de la vidéo originale si nécessaire
            this.deleteOriginalVideo(fileId, folderName);
            return;
        }

        // Boucle pour créer chaque résolution l'une après l'autre
        resolutionsToCreate.reduce((promise, resolution) => {
            return promise.then(() => {
                return this.createResolution(fileId, folderName, resolution);
            });
        }, Promise.resolve())
            .then(() => {
                // Appel API pour supprimer la vidéo originale après les résolutions
                this.deleteOriginalVideo(fileId, folderName);
            });
    }

    createResolution(fileId, folderName, resolution) {
        this.updateStatus(fileId, `Création de la résolution ${resolution}p...`);

        return fetch(`/api/create_resolution/${folderName}/${resolution}`, {
            method: 'POST'
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.updateStatus(fileId, `Résolution ${resolution}p terminée.`);
                    console.log(`Résolution ${resolution}p de ${fileId} terminée.`);
                } else {
                    this.updateStatus(fileId, `Erreur lors de la création de la résolution ${resolution}p.`);
                    console.error(`Erreur lors de la création de la résolution ${resolution}p pour ${fileId}: ${data.error}`);
                }
            })
            .catch(error => {
                this.updateStatus(fileId, `Erreur lors de la création de la résolution ${resolution}p.`);
                console.error(`Erreur lors de la création de la résolution ${resolution}p pour ${fileId}: ${error}`);
            });
    }

    deleteOriginalVideo(fileId, folderName) {
        this.updateStatus(fileId, 'Suppression de la vidéo originale...');

        fetch(`/api/delete_original/${folderName}`, {
            method: 'POST'
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.updateStatus(fileId, 'Vidéo originale supprimée.');
                    console.log(`Vidéo originale de ${fileId} supprimée.`);
                    // Vous pouvez rediriger ou mettre à jour l'interface ici
                } else {
                    this.updateStatus(fileId, 'Erreur lors de la suppression de la vidéo originale.');
                    console.error(`Erreur lors de la suppression de la vidéo originale de ${fileId}: ${data.error}`);
                }
            })
            .catch(error => {
                this.updateStatus(fileId, 'Erreur lors de la suppression de la vidéo originale.');
                console.error(`Erreur lors de la suppression de la vidéo originale de ${fileId}: ${error}`);
            });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new VideoUploader();
});

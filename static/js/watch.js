class VideoPlayer {
    constructor() {
        this.videoPlayer = document.getElementById("videoPlayer");
        this.segmentList = document.getElementById("segmentList");
        this.resolutionButtons = document.getElementById("resolutionButtons");
        this.currentSegmentIndex = 0;
        this.segments = [];
        this.segmentExists = []; // Nouveau tableau pour stocker l'état des segments
        this.currentResolution = null;

        this.initialize();
    }

    async initialize() {
        const urlParams = new URLSearchParams(window.location.search);
        const folderName = urlParams.get("v");
        const resolution = urlParams.get("res");
        let segmentindex = urlParams.get("seg");
        
        this.currentResolution = resolution;
    
        if (folderName && resolution) {
            await this.loadSegments(folderName, resolution);
            if (this.segments.length) {
                await this.setupPlaylist(); // Rendre asynchrone et attendre l'initialisation de la playlist

                // Si segmentindex est défini, le convertir en entier, sinon démarrer à 0
                segmentindex = segmentindex ? parseInt(segmentindex, 10) : 0;
                this.currentSegmentIndex = segmentindex;
    
                // Charger et jouer le segment initial, puis mettre en évidence
                this.playSegment(this.currentSegmentIndex);
                this.updatePlaylistHighlight(this.currentSegmentIndex);
            }
            await this.createResolutionButtons(folderName);
        }
    }

    async loadSegments(folderName, resolution) {
        try {
            const response = await fetch(`/api/video_info/${folderName}`);
            const data = await response.json();

            if (data.length > 0 && data[0].segments && data[0].segments.segments) {
                this.segments = data[0].segments.segments;
            } else {
                console.error("Unexpected data format:", data);
                this.segments = [];
            }
        } catch (error) {
            console.error("Error fetching segments:", error);
        }
    }

    async createResolutionButtons(folderName) {
        try {
            const response = await fetch(`/api/video_info/${folderName}`);
            const data = await response.json();
    
            if (data[0].segments && data[0].segments.folder) {
                const availableResolutions = data[0].segments.folder.split(',').map(res => res.trim());
    
                this.resolutionButtons.innerHTML = '';
    
                availableResolutions.forEach((res) => {
                    if (res !== this.currentResolution) {
                        const button = document.createElement("button");
                        button.textContent = `${res}p`;
                        button.classList.add('small-button'); // Ajout de la classe pour le style
                        button.addEventListener("click", () => {
                            const currentSegment = this.currentSegmentIndex;
                            window.location.href = `/watch?v=${folderName}&res=${res}&seg=${currentSegment}`;
                        });
                        this.resolutionButtons.appendChild(button);
                    }
                });
            } else {
                console.error("Résolutions disponibles non trouvées dans les données reçues:", data);
            }
        } catch (error) {
            console.error("Erreur lors de la récupération des résolutions:", error);
        }
    }

    async setupPlaylist() {
        this.segmentList.innerHTML = ''; 
        const urlParams = new URLSearchParams(window.location.search);
        const folderName = urlParams.get("v");
        const resolution = this.currentResolution;
        
        this.segmentExists = []; // Initialiser le tableau
    
        for (let index = 0; index < this.segments.length; index++) {
            const segment = this.segments[index];
            const thumbnailUrl = `/api/segments/${folderName}/${resolution}/${segment.replace('.mp4', '.jpg')}`;
            const segmentUrl = `/api/segments/${folderName}/${resolution}/${segment}`;
    
            try {
                // Vérifier si le segment existe
                const response = await fetch(thumbnailUrl);
                const segmentExistsHeader = response.headers.get('Segment-Exists');
                const segmentExists = segmentExistsHeader === 'true';
                this.segmentExists[index] = segmentExists;
    
                // Obtenir la taille du segment si celui-ci existe
                let sizeInMB = '';
                if (segmentExists) {
                    const headResponse = await fetch(segmentUrl, { method: 'HEAD' });
                    if (headResponse.ok) {
                        const contentLength = headResponse.headers.get('Content-Length');
                        if (contentLength) {
                            sizeInMB = (contentLength / (1024)).toFixed(2) + ' KB';
                        } else {
                            sizeInMB = 'Taille inconnue';
                        }
                    } else {
                        sizeInMB = 'Taille inconnue';
                    }
                }
    
                // Créer l'élément de liste pour le segment
                const listItem = document.createElement("li");
                listItem.classList.add("segment-item");
    
                // Ajouter un gestionnaire d'événements pour rendre l'élément cliquable
                listItem.addEventListener("click", (event) => {
                    event.preventDefault();
                    this.playSegment(index);
                });
    
                // Créer une image pour la vignette
                const thumbnail = document.createElement("img");
                thumbnail.src = thumbnailUrl;
                thumbnail.alt = `Vignette du Segment ${index + 1}`;
                thumbnail.classList.add("segment-thumbnail");
    
                // Créer un élément de texte pour le nom du segment et la taille
                const text = document.createElement("span");
                text.classList.add("segment-text");
    
                if (segmentExists) {
                    text.textContent = `Segment ${index + 1} (${resolution}p - ${sizeInMB})`;
                } else {
                    text.textContent = `Segment perdu`;
                    listItem.classList.add("segment-missing");
                }
    
                listItem.appendChild(thumbnail);
                listItem.appendChild(text);
                this.segmentList.appendChild(listItem);
            } catch (error) {
                console.error(`Erreur lors du traitement du segment ${index + 1}:`, error);
            }
        }
    
        this.videoPlayer.addEventListener("ended", () => this.playNextSegment());
    }

    playSegment(index) {
        if (index >= 0 && index < this.segments.length) {
            if (!this.segmentExists[index]) {
                this.videoPlayer.pause();
                this.videoPlayer.src = '';
                this.displayErrorMessage(`Segment perdu. Impossible de lire le segment ${index + 1}.`);
                return;
            }

            this.clearErrorMessage(); // Effacer les messages d'erreur précédents

            const urlParams = new URLSearchParams(window.location.search);
            const folderName = urlParams.get("v");
            const resolution = this.currentResolution;
            const segmentUrl = `/api/segments/${folderName}/${resolution}/${this.segments[index]}`;

            this.videoPlayer.src = segmentUrl;
            this.videoPlayer.play();

            this.updatePlaylistHighlight(index);
            this.currentSegmentIndex = index;
        } else {
            this.displayErrorMessage("Segment invalide ou hors limites.");
        }
    }

    playNextSegment() {
        this.currentSegmentIndex = parseInt(this.currentSegmentIndex, 10) + 1;
        if (this.currentSegmentIndex < this.segments.length) {
            this.playSegment(this.currentSegmentIndex);
        } else {
            // Plus de segments à lire
            this.videoPlayer.pause();
        }
    }

    updatePlaylistHighlight(index) {
        Array.from(this.segmentList.children).forEach((item, i) => {
            item.classList.toggle("playing", i === index);
        });
    }

    displayErrorMessage(message) {
        const errorContainer = document.getElementById("errorContainer");
        if (!errorContainer) {
            // Crée un conteneur d'erreur s'il n'existe pas
            const container = document.createElement("div");
            container.id = "errorContainer";
            container.style.color = "red";
            container.style.marginTop = "10px";
            container.textContent = message;

            document.body.appendChild(container);
        } else {
            // Met à jour le message d'erreur existant
            errorContainer.textContent = message;
        }
    }

    clearErrorMessage() {
        const errorContainer = document.getElementById("errorContainer");
        if (errorContainer) {
            errorContainer.textContent = '';
        }
    }
}

document.addEventListener("DOMContentLoaded", () => new VideoPlayer());

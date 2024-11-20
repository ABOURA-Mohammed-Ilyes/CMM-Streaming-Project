class VideoPlayer {
    constructor() {
        this.videoPlayer = document.getElementById("videoPlayer");
        this.segmentList = document.getElementById("segmentList");
        this.resolutionButtons = document.getElementById("resolutionButtons");
        this.currentSegmentIndex = 0;
        this.segments = [];
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
                this.setupPlaylist(); // Initialise la playlist avec tous les segments
    
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
                // Extraire les résolutions disponibles depuis segments.folder
                const availableResolutions = data[0].segments.folder.split(',').map(res => res.trim());
    
                this.resolutionButtons.innerHTML = ''; // Effacer les boutons existants
    
                availableResolutions.forEach((res) => {
                    // Exclure la résolution actuelle
                    if (res !== this.currentResolution) {
                        const button = document.createElement("button");
                        button.textContent = `${res}p`;
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

    setupPlaylist() {
        this.segmentList.innerHTML = ''; 
        const urlParams = new URLSearchParams(window.location.search);
        const folderName = urlParams.get("v");
        const resolution = this.currentResolution;
        
        this.segments.forEach((segment, index) => {
            const listItem = document.createElement("li");
            listItem.classList.add("segment-item");
            
            // Ajouter un gestionnaire d'événements au <li> pour le rendre cliquable
            listItem.addEventListener("click", (event) => {
                event.preventDefault();
                this.playSegment(index);
            });
    
            // Crée une image pour le segment
            const thumbnail = document.createElement("img");
            thumbnail.src = `/api/segments/${folderName}/${resolution}/${segment.replace('.mp4', '.jpg')}`;
            thumbnail.alt = `Thumbnail for Segment ${index + 1}`;
            thumbnail.classList.add("segment-thumbnail");
    
            const text = document.createElement("span");
            text.textContent = `Segment ${index + 1}`;
            text.classList.add("segment-text");
    
            listItem.appendChild(thumbnail); // Ajouter la vignette
            listItem.appendChild(text); // Ajouter le texte
            this.segmentList.appendChild(listItem);
        });
    
        this.videoPlayer.addEventListener("ended", () => this.playNextSegment());
    }
    

    playSegment(index) {
        if (index >= 0 && index < this.segments.length) {
            const urlParams = new URLSearchParams(window.location.search);
            const folderName = urlParams.get("v");
            const resolution = this.currentResolution; // Utilise la résolution courante
            const segmentUrl = `/api/segments/${folderName}/${resolution}/${this.segments[index]}`;
            
            // Vérifie si le segment est accessible
            fetch(segmentUrl, { method: 'HEAD' })
                .then((response) => {
                    if (response.ok) {
                        this.videoPlayer.src = segmentUrl;
                        this.videoPlayer.play();
    
                        this.updatePlaylistHighlight(index);
                        this.currentSegmentIndex = index;
                    } else {
                        this.displayErrorMessage(`Impossible de trouver le segment ${index + 1}.`);
                    }
                })
                .catch((error) => {
                    console.error("Erreur lors de la tentative de récupération du segment :", error);
                    this.displayErrorMessage(`Une erreur est survenue en essayant de charger le segment ${index + 1}.`);
                });
        } else {
            this.displayErrorMessage("Segment invalide ou hors limites.");
        }
    }
    
    // Méthode pour afficher un message d'erreur dans l'interface utilisateur
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

    playNextSegment() {
        this.currentSegmentIndex = parseInt(this.currentSegmentIndex, 10) + 1;
        this.playSegment(this.currentSegmentIndex);
    }

    updatePlaylistHighlight(index) {
        Array.from(this.segmentList.children).forEach((item, i) => {
            item.classList.toggle("playing", i === index);
        });
    }
}

document.addEventListener("DOMContentLoaded", () => new VideoPlayer());

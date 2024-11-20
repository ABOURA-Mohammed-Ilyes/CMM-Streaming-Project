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

            if (data.length > 0 && data[0].available_resolutions) {
                const availableResolutions = data[0].available_resolutions;
                this.resolutionButtons.innerHTML = ''; // Clear existing buttons

                availableResolutions.forEach((res) => {
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
            }
        } catch (error) {
            console.error("Error fetching resolutions:", error);
        }
    }

    setupPlaylist() {
        this.segmentList.innerHTML = ''; 
        this.segments.forEach((_, index) => {
            const listItem = document.createElement("li");
            listItem.classList.add("segment-item");

            const link = document.createElement("a");
            link.href = "#";
            link.textContent = `Segment ${index + 1}`;
            link.addEventListener("click", (event) => {
                event.preventDefault();
                this.playSegment(index);
            });

            listItem.appendChild(link);
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
            this.videoPlayer.src = segmentUrl;
            this.videoPlayer.play();
    
            this.updatePlaylistHighlight(index);
            this.currentSegmentIndex = index;
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

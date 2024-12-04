class VideoLibrary {
    constructor() {
        this.videoContainer = document.getElementById("videos-list");
        this.fetchAndDisplayVideos();
    }

    async fetchAndDisplayVideos() {
        try {
            const response = await fetch('/api/videos');
            const videoData = await response.json();
            this.populateVideoLibrary(videoData);
        } catch (error) {
            console.error("Erreur lors de la récupération des vidéos :", error);
        }
    }

    populateVideoLibrary(videos) {
        this.videoContainer.innerHTML = "";

        videos.forEach(video => {
            const videoElement = document.createElement("div");
            videoElement.classList.add("video-container");

            const resolutions = video.segments.folder.split(',').map(res => res.trim());

            const resolutionLinks = [`<a href="#" class="auto-btn" data-video-id="${video.NomDossier}" data-resolutions="${resolutions.join(',')}">Auto</a>`]
                .concat(resolutions.map(res => 
                    `<a href="/watch?v=${video.NomDossier}&res=${res}&seg=0">${res}p</a>`
                )).join(" | ");

            videoElement.innerHTML = `
                <h3>${video.NomVideo}</h3>
                <p>Durée: ${Math.floor(video.duration / 60)} min ${Math.round(video.duration % 60)} s</p>
                <p>Résolutions disponibles: ${resolutionLinks}</p>
            `;

            this.videoContainer.appendChild(videoElement);
        });

        this.addAutoButtonEventListeners();
    }

    addAutoButtonEventListeners() {
        const autoButtons = document.querySelectorAll('.auto-btn');
        autoButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                const videoId = button.getAttribute('data-video-id');
                const availableResolutions = button.getAttribute('data-resolutions').split(',').map(res => res.trim()).sort((a, b) => b - a);
                this.measureBandwidth().then(bandwidth => {
                    const resolution = this.getResolutionFromBandwidth(bandwidth, availableResolutions);
                    window.location.href = `/watch?v=${videoId}&res=${resolution}&seg=0`;
                });
            });
        });
    }

    async measureBandwidth() {
        const startTime = new Date().getTime();
        const response = await fetch('/test_video');
        const blob = await response.blob();
        const endTime = new Date().getTime();
        const duration = (endTime - startTime) / 1000;
        const fileSize = blob.size * 8 / (1024 * 1024);
        const bandwidth = fileSize / duration;
        console.log(`Bande passante mesurée: ${bandwidth.toFixed(2)} Mbps`);
        return bandwidth;
    }

    getResolutionFromBandwidth(bandwidth, availableResolutions) {
        const possibleResolutions = ['1080', '720', '640', '480', '360', '240'];
        let suggestedResolution;

        if (bandwidth >= 5) {
            suggestedResolution = '1080';
        } else if (bandwidth >= 3) {
            suggestedResolution = '720';
        } else if (bandwidth >= 2) {
            suggestedResolution = '640';
        } else if (bandwidth >= 1.5) {
            suggestedResolution = '480';
        } else if (bandwidth >= 1) {
            suggestedResolution = '360';
        } else {
            suggestedResolution = '240';
        }

        const indexOfSuggested = possibleResolutions.indexOf(suggestedResolution);
        const acceptableResolutions = possibleResolutions.slice(indexOfSuggested);

        for (const res of acceptableResolutions) {
            if (availableResolutions.includes(res)) {
                return res;
            }
        }

        console.warn('No acceptable resolution found, defaulting to lowest available resolution.');
        return availableResolutions[availableResolutions.length - 1];
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new VideoLibrary();
});

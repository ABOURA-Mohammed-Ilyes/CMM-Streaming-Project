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
        this.videoContainer.innerHTML = ""; // Clear the list before populating

        videos.forEach(video => {
            const videoElement = document.createElement("div");
            videoElement.classList.add("video-container");

            // Créer le lien pour "auto" avec la résolution d'origine
            const resolutionLinks = video.available_resolutions.map(res => 
                `<a href="/watch?v=${video.NomDossier}&res=${res}&seg=0">${res}p</a>`
            ).join(" | ");

            videoElement.innerHTML = `
                <h3>${video.NomVideo}</h3>
                <p>Durée: ${Math.floor(video.duration / 60)} min ${Math.round(video.duration % 60)} s</p>
                <p>Résolutions disponibles: ${resolutionLinks}</p>
            `;

            this.videoContainer.appendChild(videoElement);
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new VideoLibrary();
});

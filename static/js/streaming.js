const videoPlayer = document.getElementById('videoPlayer');
const videoSource = document.getElementById('videoSource');
const resolutionButtons = document.querySelectorAll('.resolution-button');
const recommendationList = document.getElementById('recommendationList');

const videos = ['video_720p.mp4', 'video_480p.mp4', 'video_360p.mp4'];

videos.forEach(video => {
    const item = document.createElement('div');
    item.classList.add('recommendation-item');
    item.textContent = video;
    item.addEventListener('click', () => {
        videoSource.src = video;
        videoPlayer.load();
        resolutionButtons.forEach(button => {
            button.classList.remove('active');
            if (button.getAttribute('data-src') === video) {
                button.classList.add('active');
            }
        });
    });
    recommendationList.appendChild(item);
});

resolutionButtons.forEach(button => {
    button.addEventListener('click', function() {
        resolutionButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        const selectedResolution = this.getAttribute('data-src');
        videoSource.src = selectedResolution;
        videoPlayer.load();
    });
});

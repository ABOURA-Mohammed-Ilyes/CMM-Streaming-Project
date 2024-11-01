document.getElementById("uploadForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const fileInput = document.getElementById("videoFile");
    const file = fileInput.files[0];

    if (!file) {
        alert("Veuillez sélectionner une vidéo.");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    fetch("/upload", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        const resultDiv = document.getElementById("result");
        if (data.error) {
            resultDiv.innerHTML = `<p style="color:red;">Erreur : ${data.error}</p>`;
        } else {
            resultDiv.innerHTML = `<p style="color:green;">${data.message}</p>`;
            console.log("Segments créés :", data.segments);
        }
    })
    .catch(error => {
        console.error("Erreur lors de l'upload :", error);
        document.getElementById("result").innerHTML = `<p style="color:red;">Erreur lors de l'upload.</p>`;
    });
});

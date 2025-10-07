const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Functie om de canvas grootte in te stellen
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Stel de canvas grootte in bij het laden
resizeCanvas();

// Pas de grootte aan als het venster verandert
window.addEventListener('resize', resizeCanvas);

// Nu zijn canvas.width en canvas.height altijd de schermgrootte.

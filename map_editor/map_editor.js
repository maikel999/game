// map_editor.js

const canvas = document.getElementById('editorCanvas');
const ctx = canvas.getContext('2d');
const jsonOutput = document.getElementById('jsonOutput');
const objectTypeSelect = document.getElementById('objectType');
const statusDisplay = document.getElementById('status');

// Vaste grootte van de bewerkbare map (de wereld)
const WORLD_WIDTH = 1200;
const WORLD_HEIGHT = 800;
canvas.width = WORLD_WIDTH;
canvas.height = WORLD_HEIGHT;

// Array om alle objecten op te slaan
let mapObjects = [];

// --- Hulpfuncties ---

// Teken alles op het canvas
function draw() {
    ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    
    // Teken de rand
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 5;
    ctx.strokeRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Teken alle objecten
    mapObjects.forEach(obj => {
        if (obj.type === 'wall') {
            ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
            ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        } else if (obj.type === 'item') {
            ctx.fillStyle = 'yellow';
            ctx.beginPath();
            ctx.arc(obj.x + 10, obj.y + 10, 10, 0, Math.PI * 2);
            ctx.fill();
        } else if (obj.type === 'spawn') {
            ctx.fillStyle = 'blue';
            ctx.fillRect(obj.x, obj.y, 40, 40);
        }
    });
    
    // Update de JSON uitvoer bij elke tekening
    updateJSONOutput();
    requestAnimationFrame(draw);
}

// Update het JSON-tekstvak
function updateJSONOutput() {
    jsonOutput.value = JSON.stringify(mapObjects, null, 2);
}

// --- Input Logica ---

function handlePlacement(e) {
    // Bepaal de muis/touch positie relatief aan het canvas
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const x = Math.floor(clientX - rect.left);
    const y = Math.floor(clientY - rect.top);
    
    // Bepaal het geselecteerde type
    const type = objectTypeSelect.value;
    
    let newObject = { type: type, x: x, y: y };

    // Voeg standaardafmetingen toe op basis van het type
    if (type === 'wall') {
        // Muren zijn hier standaard 100x20. Je kunt dit later aanpassen
        newObject.width = 100;
        newObject.height = 20;
    } else if (type === 'item') {
        // Items zijn kleinere punten
        newObject.width = 20;
        newObject.height = 20;
    } else if (type === 'spawn') {
        // Speler startpositie
        newObject.width = 40;
        newObject.height = 40;
        // Zorg dat er maar één spawn-punt is
        mapObjects = mapObjects.filter(obj => obj.type !== 'spawn');
    }

    mapObjects.push(newObject);
    statusDisplay.textContent = `Plaatste ${type} op (${x}, ${y}).`;
}

// Event listeners toevoegen
canvas.addEventListener('click', handlePlacement);
canvas.addEventListener('touchstart', (e) => {
    // We gebruiken touchstart om te plaatsen op mobiel
    if (e.touches.length === 1) {
        handlePlacement(e);
    }
});

// --- Knoppen Functies (Global scope voor onclick) ---

function clearMap() {
    if (confirm("Weet je zeker dat je alle objecten wilt wissen?")) {
        mapObjects = [];
        statusDisplay.textContent = "Map gewist.";
    }
}

function downloadJSON() {
    const jsonString = JSON.stringify(mapObjects, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'map_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    statusDisplay.textContent = "map_data.json gedownload. Kopieer ook de tekst!";
}

// Start de editor loop
draw();

// map_editor.js

const canvas = document.getElementById('editorCanvas');
const ctx = canvas.getContext('2d');
const jsonOutput = document.getElementById('jsonOutput');
const objectTypeSelect = document.getElementById('objectType');
const statusDisplay = document.getElementById('status');

// --- TILE & GAME CONSTANTS ---
const TILE_SIZE = 64; // Stel een geschikte grootte in, bijv. 64x64
const WORLD_WIDTH = 1280; 
const WORLD_HEIGHT = 960; 
canvas.width = WORLD_WIDTH;
canvas.height = WORLD_HEIGHT;

// --- ASSET CONFIGURATIE (DIT MOET JE AANPASSEN VOOR NIEUWE OBJECTEN) ---
const ASSET_CONFIG = [
    // Achtergrond (Wordt getegeld in de draw functie)
    { type: 'background', path: 'images/tile_grass.png', category: 'tile', default_size: TILE_SIZE },

    // Muren (Collision Objecten)
    { type: 'wall_h', path: 'images/Wooden_Fence_Horizontal.png', category: 'wall', default_size: TILE_SIZE },
    { type: 'wall_v', path: 'images/Wooden_Fence_Vertical.png', category: 'wall', default_size: TILE_SIZE },

    // Decoratie (Geen Collision, tenzij je dat later toevoegt)
    { type: 'tree_small', path: 'images/Tree_Small.png', category: 'decoration', default_size: TILE_SIZE },
    { type: 'tree_medium', path: 'images/Tree_Medium.png', category: 'decoration', default_size: TILE_SIZE },
    { type: 'tree_large', path: 'images/Tree_Large.png', category: 'decoration', default_size: TILE_SIZE * 2 }, // Dubbele grootte voor large tree

    // Speciale objecten
    { type: 'spawn', path: 'images/tile_spawn.png', category: 'special', default_size: TILE_SIZE * 2 },
    { type: 'item', path: 'images/tile_item.png', category: 'item', default_size: TILE_SIZE },

    { type: 'rock_large', path: 'images/rock_large.png', category: 'decoration', default_size: TILE_SIZE },
    
];

// --- GELADEN ASSETS ---
const tileImages = {}; // Hier slaan we de geladen Image objecten op (bijv. tileImages['wall_h'])
let assetsLoaded = false;
let imagesToLoad = ASSET_CONFIG.length;
let imagesLoaded = 0;


// Array om alle objecten op te slaan
let mapObjects = [];

// ======================================================================
// 3. INITIALISATIE FUNCTIES
// ======================================================================

function initializeEditor() {
    // 1. Vul de objectType dropdown
    ASSET_CONFIG.filter(config => config.type !== 'background').forEach(config => {
        const option = document.createElement('option');
        option.value = config.type;
        option.textContent = `${config.type} (${config.category})`;
        objectTypeSelect.appendChild(option);
    });
    
    // 2. Start het laden van de afbeeldingen
    ASSET_CONFIG.forEach(config => {
        const img = new Image();
        img.src = config.path;
        
        img.onload = () => {
            imagesLoaded++;
            if (imagesLoaded === imagesToLoad) {
                assetsLoaded = true;
                console.log("Alle tegelafbeeldingen geladen.");
            }
        };
        img.onerror = () => {
            console.error(`Fout bij het laden van afbeelding: ${img.src}`);
        };
        
        // Sla het geladen Image object op met de type-naam
        tileImages[config.type] = img;
    });

    // 3. Start de editor loop
    draw();
}


// ======================================================================
// 4. TEKEN FUNCTIES
// ======================================================================

function draw() {
    ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    
    if (!assetsLoaded) {
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText(`Laden: ${imagesLoaded}/${imagesToLoad} afbeeldingen...`, 10, 20);
        requestAnimationFrame(draw);
        return;
    }

    // Haal de achtergrondtegel op
    const backgroundTile = tileImages.background;

    // 1. Teken de Getegelde Achtergrond
    for (let x = 0; x < WORLD_WIDTH; x += TILE_SIZE) {
        for (let y = 0; y < WORLD_HEIGHT; y += TILE_SIZE) {
            ctx.drawImage(backgroundTile, x, y, TILE_SIZE, TILE_SIZE);
        }
    }
    
    // 2. Teken de objecten
    mapObjects.forEach(obj => {
        const img = tileImages[obj.type];

        if (img) {
            ctx.drawImage(img, obj.x, obj.y, obj.width, obj.height);
        } else {
            // Fallback voor onbekende types (dit zou niet mogen gebeuren)
            ctx.fillStyle = 'purple';
            ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        }
        
        // Optionele markering voor collideable objecten
        const config = ASSET_CONFIG.find(c => c.type === obj.type);
        if (config && (config.category === 'wall' || config.type === 'spawn')) {
             ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
             ctx.lineWidth = 1;
             ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
        }
    });
    
    // 3. Update de JSON uitvoer
    updateJSONOutput();
    requestAnimationFrame(draw);
}

// Update het JSON-tekstvak
function updateJSONOutput() {
    jsonOutput.value = JSON.stringify(mapObjects, null, 2);
}

// ======================================================================
// 5. INPUT EN PLAATSING
// ======================================================================

function handlePlacement(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // Grid Snapping
    const rawX = clientX - rect.left;
    const rawY = clientY - rect.top;
    
    const type = objectTypeSelect.value;
    const config = ASSET_CONFIG.find(c => c.type === type);

    if (!config) return; // Stop als type niet gevonden is

    // Plaatsing met snapping op basis van TILE_SIZE
    let x = Math.floor(rawX / TILE_SIZE) * TILE_SIZE;
    let y = Math.floor(rawY / TILE_SIZE) * TILE_SIZE;

    // Als de tegel groter is dan 1x1 (bv. Tree_Large), centreren we de klik
    // Zodat de linkerbovenhoek van het object op het raster staat
    if (config.default_size > TILE_SIZE) {
        // Zorgt ervoor dat grote objecten nog steeds op het TILE_SIZE raster snappen
        x = Math.floor(rawX / TILE_SIZE) * TILE_SIZE;
        y = Math.floor(rawY / TILE_SIZE) * TILE_SIZE;
    }
    
    let newObject = { 
        type: type, 
        x: x, 
        y: y,
        width: config.default_size, 
        height: config.default_size 
    };

    // Zorg dat er maar één 'spawn' punt is
    if (type === 'spawn') {
        mapObjects = mapObjects.filter(obj => obj.type !== 'spawn');
    }

    // Voorkom dubbele plaatsing op dezelfde locatie (alleen voor 1x1 objecten)
    const alreadyExists = mapObjects.some(obj => obj.x === x && obj.y === y && obj.type === type);
    
    if (!alreadyExists || type === 'spawn') {
        mapObjects.push(newObject);
        statusDisplay.textContent = `Plaatste ${type} op (${x}, ${y}).`;
    } else {
        statusDisplay.textContent = `Reeds een ${type} op (${x}, ${y}).`;
    }
}

// Event listeners
canvas.addEventListener('click', handlePlacement);
canvas.addEventListener('touchstart', (e) => {
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
    const collidableObjects = mapObjects.filter(obj => {
        const config = ASSET_CONFIG.find(c => c.type === obj.type);
        // We filteren alleen op objecten die een interactie in het spel hebben (geen decoratie)
        return config && (config.category === 'wall' || config.category === 'special' || config.category === 'item');
    });
    
    const jsonString = JSON.stringify(collidableObjects, null, 2);
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

// Start het laad- en initialisatieproces
initializeEditor();

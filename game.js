// ======================================================================
// 1. Initialisatie en Canvas Setup
// ======================================================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Spel Assets en Data ---
let MAP_OBJECTS = []; // Map data wordt hierin geladen
let gameReady = false; // Vlag om Game Loop te starten
const worldSize = 3000; 

// --- OMGEVINGS ASSET CONFIG (Definieert alle omgevingsafbeeldingen) ---
const ENV_ASSET_CONFIG = [
    { type: 'background', path: 'images/tile_grass.png', collides: false },
    { type: 'wall_h', path: 'images/Wooden_Fence_Horizontal.png', collides: true },
    { type: 'wall_v', path: 'images/Wooden_Fence_Vertical.png', collides: true },
    { type: 'tree_small', path: 'images/Tree_Small.png', collides: true },
    { type: 'tree_medium', path: 'images/Tree_Medium.png', collides: true },
    { type: 'tree_large', path: 'images/Tree_Large.png', collides: true }, 
    { type: 'spawn', path: '', collides: false }, 
   // { type: 'item', path: 'images/tile_item.png', collides: false },
];

const envImages = {}; // Container voor de geladen omgevingsafbeeldingen

// --- Speler Spritesheets ---
let playerSprites = {
    walk: new Image(),
    run: new Image(),
    idle: new Image(),
};
playerSprites.walk.src = 'images/Swordsman_lvl1_Walk_with_shadow.png';
playerSprites.run.src = 'images/Swordsman_lvl1_Run_with_shadow.png';
playerSprites.idle.src = 'images/Swordsman_lvl1_Idle.png';


// --- Canvas Resizing ---
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);


// ======================================================================
// 2. Speldata en Spelobjecten
// ======================================================================

const TILE_SIZE = 64; // Grootte voor achtergrondtegels

// Speler Object
const player = {
    worldX: 0,
    worldY: 0, 
    width: 200,
    height: 200,
    speed: 5,
    
    // ANIMATIE VARIABELEN
    frameX: 0,
    frameY: 0,
    frameWidth: 64, 
    frameHeight: 64, 
    animationTimer: 0,
    animationSpeed: 5, 
    isMoving: false,
    currentSheet: playerSprites.walk, 
    maxFrames: 4, // Standaard voor walk/run
};

// --- Joystick Setup ---
const JOYSTICK_MARGIN = 150; 
const JOYSTICK_BASE_RADIUS = 120; 
const JOYSTICK_LIMIT = 50; 

const joystick = {
    active: false,
    inputX: 0, 
    inputY: 0, 
    stickOffsetX: 0, 
    stickOffsetY: 0, 
    baseX: JOYSTICK_MARGIN + JOYSTICK_BASE_RADIUS,
    baseY: 0 
};


// ======================================================================
// 3. Input Handlers (Joystick) - Blijven hetzelfde
// ======================================================================

function handleInput(e) {
    e.preventDefault(); 
    if (!gameReady) return; 

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    joystick.baseY = canvas.height - (JOYSTICK_MARGIN + JOYSTICK_BASE_RADIUS);

    if (e.type === 'mousedown' || e.type === 'touchstart') {
        const distance = Math.sqrt(
            (clientX - joystick.baseX) ** 2 + (clientY - joystick.baseY) ** 2
        );
        if (distance <= JOYSTICK_BASE_RADIUS) {
            joystick.active = true;
        }
    }
    
    if (joystick.active) {
        let deltaX = clientX - joystick.baseX;
        let deltaY = clientY - joystick.baseY;
        
        const magnitude = Math.sqrt(deltaX ** 2 + deltaY ** 2);
        if (magnitude > JOYSTICK_LIMIT) {
            deltaX *= JOYSTICK_LIMIT / magnitude;
            deltaY *= JOYSTICK_LIMIT / magnitude;
        }

        joystick.stickOffsetX = deltaX;
        joystick.stickOffsetY = deltaY;
        
        joystick.inputX = deltaX / JOYSTICK_LIMIT;
        joystick.inputY = deltaY / JOYSTICK_LIMIT;
    }
}

function handleEnd() {
    joystick.active = false;
    joystick.inputX = 0;
    joystick.inputY = 0;
    joystick.stickOffsetX = 0;
    joystick.stickOffsetY = 0;
}

canvas.addEventListener('mousedown', handleInput);
canvas.addEventListener('mousemove', (e) => joystick.active && handleInput(e));
canvas.addEventListener('mouseup', handleEnd);
canvas.addEventListener('mouseout', handleEnd); 

canvas.addEventListener('touchstart', handleInput);
canvas.addEventListener('touchmove', handleInput);
canvas.addEventListener('touchend', handleEnd);


// ======================================================================
// 4. De Game Loop Functies
// ======================================================================

/**
 * Controleert op botsingen met alle collides: true objecten in de map.
 */
function checkCollision(x, y, width, height) {
    const playerLeft = x - width / 2;
    const playerRight = x + width / 2;
    const playerTop = y - height / 2;
    const playerBottom = y + height / 2;

    for (const obj of MAP_OBJECTS) {
        const config = ENV_ASSET_CONFIG.find(c => c.type === obj.type);
        
        // Controleer alleen objecten die botsing hebben
        if (config && config.collides) {
            const objLeft = obj.x;
            const objRight = obj.x + obj.width;
            const objTop = obj.y;
            const objBottom = obj.y + obj.height;

            if (
                playerRight > objLeft &&
                playerLeft < objRight &&
                playerBottom > objTop &&
                playerTop < objBottom
            ) {
                return true; 
            }
        }
    }
    return false;
}


function update() {
    let newX = player.worldX;
    let newY = player.worldY;
    
    const inputX = joystick.inputX;
    const inputY = joystick.inputY;

    // --- 1. Richting en Beweging/Idle Status Bepalen ---
    player.isMoving = (inputX !== 0 || inputY !== 0);

    if (player.isMoving) {
        player.currentSheet = playerSprites.walk; 
        player.maxFrames = 4;
        
        if (Math.abs(inputX) > Math.abs(inputY)) {
            player.frameY = (inputX < 0) ? 1 : 2; 
        } else {
            player.frameY = (inputY < 0) ? 3 : 0; 
        }
    } else {
        player.currentSheet = playerSprites.idle; 
        player.maxFrames = 8; // Idle heeft meer frames
    }
    
    // --- 2. Frame Animatie Timer ---
    player.animationTimer++;
    if (player.animationTimer >= player.animationSpeed) {
        player.frameX = (player.frameX + 1) % player.maxFrames; 
        player.animationTimer = 0;
    }

    // --- 3. Positie & Botsingen ---
    let desiredX = newX + inputX * player.speed;
    let desiredY = newY + inputY * player.speed;

    // Horizontale beweging (X-as)
    if (!checkCollision(desiredX, player.worldY, player.width, player.height)) {
        player.worldX = desiredX;
    }
    // Verticale beweging (Y-as)
    if (!checkCollision(player.worldX, desiredY, player.width, player.height)) {
        player.worldY = desiredY;
    }
    
    // Houd de speler binnen de wereldgrenzen
    const halfW = player.width / 2;
    const halfH = player.height / 2;
    player.worldX = Math.max(halfW, Math.min(player.worldX, worldSize - halfW));
    player.worldY = Math.max(halfH, Math.min(player.worldY, worldSize - halfH));
}


function draw() {
    if (!gameReady) {
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText("Laden...", canvas.width / 2, canvas.height / 2);
        requestAnimationFrame(draw);
        return;
    }

    update();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- CAMERA BEREKENING ---
    const cameraX = player.worldX - (canvas.width / 2);
    const cameraY = player.worldY - (canvas.height / 2);

    // Haal de achtergrondtegel op
    const backgroundTile = envImages.background;

    // --- TEKEN DE WERELD EN OBJECTEN ---

    // 1. Achtergrond (hele speelgebied getegeld)
    if (backgroundTile) {
        for (let x = 0; x < worldSize; x += TILE_SIZE) {
            for (let y = 0; y < worldSize; y += TILE_SIZE) {
                ctx.drawImage(backgroundTile, x - cameraX, y - cameraY, TILE_SIZE, TILE_SIZE);
            }
        }
    } else {
        // Fallback
        ctx.fillStyle = '#99CC99'; 
        ctx.fillRect(0 - cameraX, 0 - cameraY, worldSize, worldSize);
    }
    
    // 2. Teken alle objecten (Muren, Bomen, etc.)
    MAP_OBJECTS.forEach(obj => {
        const img = envImages[obj.type];
        
        if (img) {
            const screenX = obj.x - cameraX;
            const screenY = obj.y - cameraY;
            
            ctx.drawImage(img, screenX, screenY, obj.width, obj.height);
        }
    });

    // --- TEKEN DE SPELER (met Animatie) ---
    const playerScreenX = (canvas.width / 2) - (player.width / 2);
    const playerScreenY = (canvas.height / 2) - (player.height / 2);

    if (player.currentSheet.complete) {
        ctx.drawImage(
            player.currentSheet, 
            player.frameX * player.frameWidth,   
            player.frameY * player.frameHeight,  
            player.frameWidth,                   
            player.frameHeight,                  
            playerScreenX,                       
            playerScreenY,                       
            player.width,                        
            player.height                        
        );
    } else {
        ctx.fillStyle = 'red'; 
        ctx.fillRect(playerScreenX, playerScreenY, player.width, player.height);
    }
    

    // --- TEKEN DE STATISCHE UI (Joystick) - Blijft hetzelfde ---
    
    const stickX = joystick.baseX;
    const stickY = canvas.height - (JOYSTICK_MARGIN + JOYSTICK_BASE_RADIUS); 

    ctx.fillStyle = 'rgba(150, 150, 150, 0.4)';
    ctx.beginPath();
    ctx.arc(stickX, stickY, JOYSTICK_BASE_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(stickX + joystick.stickOffsetX, stickY + joystick.stickOffsetY, 30, 0, Math.PI * 2);
    ctx.fill();


    // --- GAME LOOP RECURSIE ---
    requestAnimationFrame(draw);
}


// ======================================================================
// 5. Setup en Start van de Game
// ======================================================================

/**
 * Laadt alle assets en data en start de Game Loop.
 */
async function loadGame() {
    try {
        // 1. Laad JSON Map Data
        const response = await fetch('maps/map_data.json');
        if (!response.ok) {
            throw new Error(`Fout bij het laden van map_data.json: ${response.status} ${response.statusText}`);
        }
        MAP_OBJECTS = await response.json();
        
        // 2. Definieer welke afbeeldingen geladen moeten worden
        const imagePromises = [];
        
        // Voeg speler spritesheets toe aan de laadlijst
        imagePromises.push(new Promise(resolve => playerSprites.walk.onload = resolve));
        imagePromises.push(new Promise(resolve => playerSprites.run.onload = resolve));
        imagePromises.push(new Promise(resolve => playerSprites.idle.onload = resolve));
        
        // Voeg omgevingsafbeeldingen toe aan de laadlijst
        ENV_ASSET_CONFIG.forEach(config => {
            if (config.path) { // Laad alleen als er een pad is gedefinieerd
                const img = new Image();
                img.src = config.path;
                envImages[config.type] = img; // Sla het Image object op
                imagePromises.push(new Promise(resolve => img.onload = resolve));
            }
        });


        // 3. Wacht tot ALLE afbeeldingen geladen zijn
        await Promise.all(imagePromises);

        // 4. Zoek Startpunt
        const spawnPoint = MAP_OBJECTS.find(obj => obj.type === 'spawn');
        if (spawnPoint) {
            player.worldX = spawnPoint.x + (spawnPoint.width / 2);
            player.worldY = spawnPoint.y + (spawnPoint.height / 2);
        } else {
            console.warn("Geen 'spawn' punt gevonden, start in het midden van de wereld.");
            player.worldX = worldSize / 2;
            player.worldY = worldSize / 2;
        }

        // Alles is klaar, start het spel!
        gameReady = true;
        console.log("Game assets en data succesvol geladen!");
        draw();

    } catch (error) {
        console.error("Fout tijdens het opstarten van het spel:", error);
        
        // Toon fout op het canvas
        ctx.fillStyle = 'red';
        ctx.font = '20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText("FATALE FOUT: Zie console voor details.", 50, 50);
        ctx.fillText("1. Map data laden mislukt? 2. Afbeelding paden onjuist?", 50, 80);
    }
}

// Start het laadproces
loadGame();

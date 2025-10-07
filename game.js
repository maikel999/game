// ======================================================================
// 1. Initialisatie en Canvas Setup
// ======================================================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Spel Assets en Data ---
let MAP_OBJECTS = []; // Map data wordt hierin geladen
let gameReady = false; // Vlag om Game Loop te starten

// Laad alle spritesheets
let playerSprites = {
    walk: new Image(),
    run: new Image(),
    // Toekomst: idle: new Image(),
};

// Stel de bronbestanden in (Zorg dat de namen EXACT overeenkomen!)
playerSprites.walk.src = 'images/Swordsman_lvl1_Walk_with_shadow.png';
playerSprites.run.src = 'images/Swordsman_lvl1_Run_with_shadow.png';

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

// Speler Object
const player = {
    worldX: 0,
    worldY: 0, 
    width: 200,
    height: 200,
    speed: 5,
    
    // ANIMATIE VARIABELEN
    frameX: 0, // Huidige kolom van het frame (0 tot 3)
    frameY: 0, // Huidige rij van de richting (0: Omlaag, 1: Links, 2: Rechts, 3: Omhoog)
    frameWidth: 64, // Breedte van één frame op de spritesheet
    frameHeight: 64, // Hoogte van één frame op de spritesheet
    animationTimer: 0,
    animationSpeed: 5, // Hoe lager, hoe sneller de animatie (frames per update)
    isMoving: false,
    currentSheet: playerSprites.walk, // De momenteel gebruikte spritesheet
};

const worldSize = 3000; 

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
// 3. Input Handlers (Joystick)
// ======================================================================

function handleInput(e) {
    e.preventDefault(); 
    if (!gameReady) return; // Negeer input voordat het spel is geladen

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
 * Controleert op botsingen met muur-objecten.
 */
function checkCollision(x, y, width, height) {
    const playerLeft = x - width / 2;
    const playerRight = x + width / 2;
    const playerTop = y - height / 2;
    const playerBottom = y + height / 2;

    for (const obj of MAP_OBJECTS) {
        if (obj.type === 'wall') {
            const wallLeft = obj.x;
            const wallRight = obj.x + obj.width;
            const wallTop = obj.y;
            const wallBottom = obj.y + obj.height;

            if (
                playerRight > wallLeft &&
                playerLeft < wallRight &&
                playerBottom > wallTop &&
                playerTop < wallBottom
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

    // --- 1. Richting en Beweging Bepalen ---
    player.isMoving = (inputX !== 0 || inputY !== 0);

    if (player.isMoving) {
        // Bepaal de kijkrichting (frameY)
        if (Math.abs(inputX) > Math.abs(inputY)) {
            player.frameY = (inputX < 0) ? 1 : 2; // 1: Links, 2: Rechts
        } else {
            player.frameY = (inputY < 0) ? 3 : 0; // 3: Omhoog, 0: Omlaag
        }
        
        // Kies de juiste spritesheet: nu gebruiken we altijd 'walk'
        player.currentSheet = playerSprites.walk; 
    }
    // Toekomst: ELSE zou playerSprites.idle kunnen gebruiken.

    // --- 2. Frame Animatie Timer ---
    player.animationTimer++;
    if (player.animationTimer >= player.animationSpeed) {
        // 4 frames per rij op de spritesheet
        player.frameX = (player.frameX + 1) % 4; 
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
        // Teken een laadscherm of wacht tot de data er is
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


    // --- TEKEN DE WERELD EN OBJECTEN ---

    // Achtergrond (hele speelgebied)
    ctx.fillStyle = '#99CC99'; 
    ctx.fillRect(0 - cameraX, 0 - cameraY, worldSize, worldSize);
    
    // Teken alle objecten (Muren, Items, etc.)
    MAP_OBJECTS.forEach(obj => {
        const screenX = obj.x - cameraX;
        const screenY = obj.y - cameraY;

        if (obj.type === 'wall') {
            ctx.fillStyle = '#666666'; 
            ctx.fillRect(screenX, screenY, obj.width, obj.height);
        } else if (obj.type === 'item') {
            ctx.fillStyle = 'gold'; 
            ctx.beginPath();
            ctx.arc(screenX + obj.width / 2, screenY + obj.height / 2, obj.width / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // --- TEKEN DE SPELER (met Animatie) ---
    const playerScreenX = (canvas.width / 2) - (player.width / 2);
    const playerScreenY = (canvas.height / 2) - (player.height / 2);

    if (player.currentSheet.complete) {
        ctx.drawImage(
            player.currentSheet, 
            player.frameX * player.frameWidth,   // sx
            player.frameY * player.frameHeight,  // sy
            player.frameWidth,                   // sWidth
            player.frameHeight,                  // sHeight
            playerScreenX,                       // dx
            playerScreenY,                       // dy
            player.width,                        // dWidth
            player.height                        // dHeight
        );
    } else {
        // Fallback als de afbeelding nog niet is geladen
        ctx.fillStyle = 'red'; 
        ctx.fillRect(playerScreenX, playerScreenY, player.width, player.height);
    }
    

    // --- TEKEN DE STATISCHE UI (Joystick) ---
    
    const stickX = joystick.baseX;
    const stickY = canvas.height - (JOYSTICK_MARGIN + JOYSTICK_BASE_RADIUS); 

    // Basis cirkel
    ctx.fillStyle = 'rgba(150, 150, 150, 0.4)';
    ctx.beginPath();
    ctx.arc(stickX, stickY, JOYSTICK_BASE_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Knop (stick)
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
        
        // 2. Zoek Startpunt
        const spawnPoint = MAP_OBJECTS.find(obj => obj.type === 'spawn');
        if (spawnPoint) {
            player.worldX = spawnPoint.x + (spawnPoint.width / 2);
            player.worldY = spawnPoint.y + (spawnPoint.height / 2);
        } else {
            console.warn("Geen 'spawn' punt gevonden, start in het midden van de wereld.");
            player.worldX = worldSize / 2;
            player.worldY = worldSize / 2;
        }

        // 3. Wacht tot afbeeldingen geladen zijn (optioneel, maar goed voor stabiliteit)
        await Promise.all([
            new Promise(resolve => playerSprites.walk.onload = resolve),
            new Promise(resolve => playerSprites.run.onload = resolve),
        ]);

        // Alles is klaar, start het spel!
        gameReady = true;
        console.log("Game assets en data succesvol geladen!");
        draw();

    } catch (error) {
        console.error("Fout tijdens het opstarten van het spel:", error);
        
        // Toon fout op het canvas als er iets misging
        ctx.fillStyle = 'red';
        ctx.font = '20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText("FATALE FOUT: Zie console voor details.", 50, 50);
        ctx.fillText("1. Lokale server? 2. map_data.json in /maps? 3. player.png in /images?", 50, 80);
    }
}

// Start het laadproces
loadGame();

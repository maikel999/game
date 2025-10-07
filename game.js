// ======================================================================
// 1. Initialisatie en Canvas Setup
// ======================================================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Spel Assets en Data ---
let MAP_OBJECTS = []; // Map data wordt hierin geladen
let playerImage = new Image();
playerImage.src = 'images/player.png'; // Zorg dat deze afbeelding bestaat!

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
    worldX: 0, // Wordt ingesteld na het laden van de map
    worldY: 0, 
    width: 40,
    height: 40,
    speed: 5 
};

const worldSize = 3000; // Voorlopige wereldgrootte

// --- Joystick Setup (Harde Waarden) ---
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
// 3. Input Handlers (Joystick Muis/Touch)
// ======================================================================

function handleInput(e) {
    e.preventDefault(); 

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
 * Controleert op botsingen met objecten in de map.
 * Dit is een zeer simpele AABB (Axis-Aligned Bounding Box) check.
 */
function checkCollision(x, y, width, height) {
    // Definieer de bounding box van de speler op de nieuwe positie
    const playerLeft = x - width / 2;
    const playerRight = x + width / 2;
    const playerTop = y - height / 2;
    const playerBottom = y + height / 2;

    for (const obj of MAP_OBJECTS) {
        if (obj.type === 'wall') {
            // Definieer de bounding box van het muur-object
            const wallLeft = obj.x;
            const wallRight = obj.x + obj.width;
            const wallTop = obj.y;
            const wallBottom = obj.y + obj.height;

            // Botsingsvoorwaarde
            if (
                playerRight > wallLeft &&
                playerLeft < wallRight &&
                playerBottom > wallTop &&
                playerTop < wallBottom
            ) {
                return true; // Botsing gedetecteerd
            }
        }
    }
    return false;
}


function update() {
    let newX = player.worldX;
    let newY = player.worldY;

    // Bereken de gewenste nieuwe positie
    let desiredX = newX + joystick.inputX * player.speed;
    let desiredY = newY + joystick.inputY * player.speed;

    // 1. Controleer verticale beweging (Y-as)
    if (!checkCollision(newX, desiredY, player.width, player.height)) {
        player.worldY = desiredY;
    }

    // 2. Controleer horizontale beweging (X-as)
    if (!checkCollision(desiredX, newY, player.width, player.height)) {
        player.worldX = desiredX;
    }

    // Zorg ervoor dat de speler in de speelwereld blijft (eenvoudige border)
    const halfW = player.width / 2;
    const halfH = player.height / 2;
    player.worldX = Math.max(halfW, Math.min(player.worldX, worldSize - halfW));
    player.worldY = Math.max(halfH, Math.min(player.worldY, worldSize - halfH));
}


function draw() {
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
            ctx.fillStyle = '#666666'; // Grijze muur
            ctx.fillRect(screenX, screenY, obj.width, obj.height);
        } else if (obj.type === 'item') {
            ctx.fillStyle = 'gold'; // Geel item
            ctx.beginPath();
            ctx.arc(screenX + obj.width / 2, screenY + obj.height / 2, obj.width / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // --- TEKEN DE SPELER ---
    const playerScreenX = (canvas.width / 2) - (player.width / 2);
    const playerScreenY = (canvas.height / 2) - (player.height / 2);

    if (playerImage.complete) {
        ctx.drawImage(playerImage, playerScreenX, playerScreenY, player.width, player.height);
    } else {
        // Fallback als de afbeelding nog niet is geladen
        ctx.fillStyle = 'blue';
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
 * Laadt de map en start de Game Loop.
 */
async function loadGame() {
    try {
        const response = await fetch('maps/map_data.json');
        if (!response.ok) {
            throw new Error(`Fout bij het laden van map_data.json: ${response.statusText}`);
        }
        MAP_OBJECTS = await response.json();
        
        // Zoek het startpunt en stel de spelerpositie in
        const spawnPoint = MAP_OBJECTS.find(obj => obj.type === 'spawn');
        if (spawnPoint) {
            player.worldX = spawnPoint.x + (spawnPoint.width / 2);
            player.worldY = spawnPoint.y + (spawnPoint.height / 2);
        } else {
            // Standaard startpositie als er geen 'spawn' is gevonden
            player.worldX = worldSize / 2;
            player.worldY = worldSize / 2;
        }

        console.log("Map data succesvol geladen!");
        
        // Start de Game Loop
        draw();

    } catch (error) {
        console.error("Fout tijdens het opstarten van het spel:", error);
        // Teken een foutmelding op het canvas
        ctx.fillStyle = 'red';
        ctx.font = '20px Arial';
        ctx.fillText("Kan map_data.json niet laden. Zorg voor een lokale server.", 50, 50);
    }
}

// Start het laadproces
loadGame();

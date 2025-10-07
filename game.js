// ======================================================================
// 1. Initialisatie en Canvas Setup
// ======================================================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

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
    worldX: 500,
    worldY: 500,
    width: 40,
    height: 40,
    speed: 5 
};

const worldSize = 3000; // Wereldgrootte van 3000x3000

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
    
    // De statische basispositie (X is constant, Y hangt af van canvas.height)
    baseX: JOYSTICK_MARGIN + JOYSTICK_BASE_RADIUS,
    baseY: 0 
};


// ======================================================================
// 3. Input Handlers (Joystick Muis/Touch)
// ======================================================================

function handleInput(e) {
    e.preventDefault(); 

    // Bepaal de muis/touch positie op het scherm
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    // Update de basis Y-positie (als het scherm groter/kleiner wordt)
    joystick.baseY = canvas.height - (JOYSTICK_MARGIN + JOYSTICK_BASE_RADIUS);

    // Bepaal of we net begonnen zijn met interactie (mousedown of touchstart)
    if (e.type === 'mousedown' || e.type === 'touchstart') {
        // Controleer of de klik binnen de joystick basis valt
        const distance = Math.sqrt(
            (clientX - joystick.baseX) ** 2 + (clientY - joystick.baseY) ** 2
        );

        if (distance <= JOYSTICK_BASE_RADIUS) {
            joystick.active = true;
        }
    }
    
    // Als de joystick actief is, bereken de beweging
    if (joystick.active) {
        let deltaX = clientX - joystick.baseX;
        let deltaY = clientY - joystick.baseY;
        
        // Beperk de afstand tot de ingestelde limiet
        const magnitude = Math.sqrt(deltaX ** 2 + deltaY ** 2);
        if (magnitude > JOYSTICK_LIMIT) {
            // Pas deltaX en deltaY aan zodat de knop binnen de limiet blijft
            deltaX *= JOYSTICK_LIMIT / magnitude;
            deltaY *= JOYSTICK_LIMIT / magnitude;
        }

        // Sla de offsets op voor het tekenen (visuele knop)
        joystick.stickOffsetX = deltaX;
        joystick.stickOffsetY = deltaY;
        
        // Sla de genormaliseerde input op (-1.0 tot 1.0) voor de beweging
        joystick.inputX = deltaX / JOYSTICK_LIMIT;
        joystick.inputY = deltaY / JOYSTICK_LIMIT;
    }
}

function handleEnd() {
    // Reset de joystick state als de vinger/muis wordt losgelaten
    joystick.active = false;
    joystick.inputX = 0;
    joystick.inputY = 0;
    joystick.stickOffsetX = 0;
    joystick.stickOffsetY = 0;
}

// Event Listeners voor zowel muis (desktop) als touch (mobiel)
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
 * Verantwoordelijk voor alle logica van het spel (beweging, botsingen, etc.).
 */
function update() {
    let newX = player.worldX;
    let newY = player.worldY;

    // Gebruik de joystick input om de speler te bewegen
    newX += joystick.inputX * player.speed;
    newY += joystick.inputY * player.speed;

    // Houd de speler binnen de wereldgrenzen (eenvoudige botsing met rand)
    const halfWidth = player.width / 2;
    const halfHeight = player.height / 2;

    player.worldX = Math.max(halfWidth, Math.min(newX, worldSize - halfWidth));
    player.worldY = Math.max(halfHeight, Math.min(newY, worldSize - halfHeight));
}

/**
 * Verantwoordelijk voor het tekenen van alle elementen op het canvas.
 */
function draw() {
    // --- 4.1. LOGICA ---
    update();

    // --- 4.2. WIS CANVAS ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);


    // --- 4.3. CAMERA BEREKENING ---
    const cameraX = player.worldX - (canvas.width / 2);
    const cameraY = player.worldY - (canvas.height / 2);


    // --- 4.4. TEKEN DE WERELD (met offset) ---
    ctx.fillStyle = 'darkgreen';
    ctx.fillRect(
        0 - cameraX, 
        0 - cameraY, 
        worldSize,
        worldSize
    );
    
    // Optioneel: Border van de wereld tekenen
    ctx.strokeStyle = 'brown';
    ctx.lineWidth = 20;
    ctx.strokeRect(
        1 - cameraX,
        1 - cameraY,
        worldSize - 2,
        worldSize - 2
    );

    // --- 4.5. TEKEN DE SPELER (statisch in het midden) ---
    ctx.fillStyle = 'blue';
    ctx.fillRect(
        (canvas.width / 2) - (player.width / 2),
        (canvas.height / 2) - (player.height / 2),
        player.width,
        player.height
    );
    

    // --- 4.6. TEKEN DE STATISCHE UI (Joystick) ---
    
    // Coördinaten van de getekende joystick basis
    const stickX = joystick.baseX;
    const stickY = canvas.height - (JOYSTICK_MARGIN + JOYSTICK_BASE_RADIUS); 

    // Joystick basis (buitenste cirkel)
    ctx.fillStyle = 'rgba(150, 150, 150, 0.4)';
    ctx.beginPath();
    ctx.arc(stickX, stickY, JOYSTICK_BASE_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Joystick knop (binnenste cirkel)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    // Gebruik de berekende offsets om de knop te laten bewegen
    ctx.arc(stickX + joystick.stickOffsetX, stickY + joystick.stickOffsetY, 30, 0, Math.PI * 2);
    ctx.fill();


    // --- 4.7. GAME LOOP RECURSIE ---
    requestAnimationFrame(draw);
}

// ======================================================================
// 5. Start de Game Loop
// ======================================================================
draw();

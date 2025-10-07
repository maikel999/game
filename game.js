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
    // worldX/worldY: De absolute positie in de (grote) speelwereld
    worldX: 500,
    worldY: 500,
    width: 40,
    height: 40,
    speed: 5
};

// State van de toetsenbordinvoer
const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

// Wereldgrootte (om te voorkomen dat de speler eruit loopt)
const worldSize = 3000; // Een speelwereld van 3000x3000

// ======================================================================
// 3. Input Handlers (Toetsenbord)
// ======================================================================

document.addEventListener('keydown', (e) => {
    switch (e.key.toLowerCase()) {
        case 'w':
            keys.w = true;
            break;
        case 'a':
            keys.a = true;
            break;
        case 's':
            keys.s = true;
            break;
        case 'd':
            keys.d = true;
            break;
    }
});

document.addEventListener('keyup', (e) => {
    switch (e.key.toLowerCase()) {
        case 'w':
            keys.w = false;
            break;
        case 'a':
            keys.a = false;
            break;
        case 's':
            keys.s = false;
            break;
        case 'd':
            keys.d = false;
            break;
    }
});


// ======================================================================
// 4. De Game Loop Functies
// ======================================================================

/**
 * Verantwoordelijk voor alle logica van het spel (beweging, botsingen, etc.).
 */
function update() {
    // Bereken de nieuwe positie
    let newX = player.worldX;
    let newY = player.worldY;

    if (keys.w) {
        newY -= player.speed;
    }
    if (keys.s) {
        newY += player.speed;
    }
    if (keys.a) {
        newX -= player.speed;
    }
    if (keys.d) {
        newX += player.speed;
    }

    // Houd de speler binnen de wereldgrenzen
    // Linkerbovenhoek is (0, 0), Rechterbenedenhoek is (worldSize, worldSize)
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
    // De camera offset is het verschil tussen de speler's wereldpositie en het midden van het scherm.
    const cameraX = player.worldX - (canvas.width / 2);
    const cameraY = player.worldY - (canvas.height / 2);


    // --- 4.4. TEKEN DE WERELD (met offset) ---
    // Dit creëert het parallax-effect: alles verschuift ten opzichte van de speler.
    
    // Wereld achtergrond (Grote groene rechthoek)
    ctx.fillStyle = 'darkgreen';
    ctx.fillRect(
        0 - cameraX, // Teken op wereldpositie 0,0 min de camera offset
        0 - cameraY,
        worldSize,
        worldSize
    );
    
    // Optioneel: Border van de wereld tekenen
    ctx.strokeStyle = 'brown';
    ctx.lineWidth = 20;
    ctx.strokeRect(
        1 - cameraX, // +1 is voor de lijnbreedte
        1 - cameraY,
        worldSize - 2, // -2 is voor de lijnbreedte
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
    
    // Optioneel: Tekst boven de speler (voor debug)
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`X:${Math.round(player.worldX)} Y:${Math.round(player.worldY)}`, 
                 canvas.width / 2, (canvas.height / 2) - 30);


    // --- 4.6. TEKEN DE STATISCHE UI (Joystick) ---
    // Dit wordt NIET beïnvloed door de camera offset.
    const margin = 50; // Nieuwe marge van de kant
    const baseRadius = 90; // Nieuwe, grotere straal
    
    // De linker-onderhoek is:
    const stickX = margin + baseRadius; 
    const stickY = canvas.height - margin - baseRadius;
    
    // Joystick basis (buitenste cirkel)
    ctx.fillStyle = 'rgba(150, 150, 150, 0.4)';
    ctx.beginPath();
    // Gebruik de nieuwe variabelen:
    ctx.arc(stickX, stickY, baseRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Richting indicator (voor WASD)
    let stickOffsetX = (keys.d - keys.a) * 30;
    let stickOffsetY = (keys.s - keys.w) * 30;

    // Joystick knop (binnenste cirkel)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(stickX + stickOffsetX, stickY + stickOffsetY, 30, 0, Math.PI * 2);
    ctx.fill();


    // --- 4.7. GAME LOOP RECURSIE ---
    // Vraag de browser om de functie opnieuw aan te roepen voor het volgende frame.
    requestAnimationFrame(draw);
}

// ======================================================================
// 5. Start de Game Loop
// ======================================================================
draw();

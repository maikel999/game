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
// Start en pas de grootte aan bij verandering van venster
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
    speed: 5 // Spelersnelheid
};

const worldSize = 3000; // Wereldgrootte van 3000x3000

// --- Joystick Setup ---
const JOYSTICK_MARGIN = 50; // Afstand van de randen
const JOYSTICK_BASE_RADIUS = 90; // Grootte van de buitenste cirkel
const JOYSTICK_LIMIT = 50; // Maximale uitslag van de knop

const joystick = {
    active: false,
    inputX: 0, // Richting op X-as (-1.0 tot 1.0)
    inputY: 0, // Richting op Y-as (-1.0 tot 1.0)
    stickOffsetX: 0, // Huidige positie van de knop X
    stickOffsetY: 0, // Huidige positie van de knop Y
    
    // De statische basispositie van de joystick (wordt berekend bij draw/input)
    baseX: JOYSTICK_MARGIN + JOYSTICK_BASE_RADIUS,
    baseY: 0 // Moet dynamisch worden ingesteld op basis van canvas.height
};


// ======================================================================
// 3. Input Handlers (Joystick Muis/Touch)
// ======================================================================

function handleInput(e) {
    e.preventDefault(); // Voorkom standaard browseracties zoals scrollen

    // Bepaal de muis/touch positie op het scherm
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    // Stel de basis Y-positie van de joystick in (nodig omdat canvas.height verandert)
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
            deltaX *= JOYSTICK_LIMIT / magnitude;
            deltaY *= JOYSTICK_LIMIT / magnitude;
        }

        // Sla de offsets op voor het tekenen
        joystick.stickOffsetX = deltaX;
        joystick.stickOffsetY = deltaY;
        
        // Sla de genormaliseerde input op (-1.0 tot 1.0) voor de update-functie
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

// Event Listeners voor zowel muis als touch
canvas.addEventListener('mousedown', handleInput);
// Zorg dat 'mousemove' alleen werkt als de muis al is ingedrukt (joystick.active)
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
    // Snelheid * genormaliseerde input (tussen -1 en 1)
    newX += joystick.inputX * player.speed;
    newY += joystick.inputY * player.speed;

    // Houd de speler binnen de wereldgrenzen
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
    // De speler staat in het midden van het scherm. De wereld wordt verschoven.
    const cameraX = player.worldX - (canvas.width / 2);
    const cameraY = player.worldY - (canvas.height / 2);


    // --- 4.4. TEKEN DE WERELD (met offset) ---
    // De groene achtergrond is de speelwereld.
    ctx.fillStyle = 'darkgreen';
    ctx.fillRect(
        0 - cameraX, // Wereld X-coördinaat 0 - camera offset
        0 - cameraY, // Wereld Y-coördinaat 0 - camera offset
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
    
    // Zorg ervoor dat de tekenpositie overeenkomt met de input basispositie
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
    // Gebruik de berekende offsets voor de knop
    ctx.arc(stickX + joystick.stickOffsetX, stickY + joystick.stickOffsetY, 30, 0, Math.PI * 2);
    ctx.fill();


    // --- 4.7. GAME LOOP RECURSIE ---
    requestAnimationFrame(draw);
}

// ======================================================================
// 5. Start de Game Loop
// ======================================================================
draw();
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

    // Gebruik de joystick input in plaats van de keys state
    // De inputX/Y is al tussen -1.0 en 1.0, perfect voor de snelheid.
    newX += joystick.inputX * player.speed;
    newY += joystick.inputY * player.speed;
    

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

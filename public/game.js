// game.js

// Big Head Football SLK: JavaScript Game Logic
// -----------------------------------------------

// 1. Variabile Globale pentru Elemente DOM
const mainMenu = document.getElementById('main-menu');
const singlePlayerBtn = document.getElementById('single-player-btn');
const multiplayerBtn = document.getElementById('multiplayer-btn');
const tutorialBtn = document.getElementById('tutorial-btn');

// Elemente pentru selecția jucătorului în multiplayer
const playerSelectionMenu = document.getElementById('player-selection-menu');
const selectPlayer1Btn = document.getElementById('select-player1-btn');
const selectPlayer2Btn = document.getElementById('select-player2-btn');
const playerSelectionStatus = document.getElementById('player-selection-status');
const backToMainMenuFromSelectionBtn = document.getElementById('back-to-main-menu-from-selection');


const gameSection = document.getElementById('game-section');
const gameCanvas = document.getElementById('gameCanvas');
const ctx = gameCanvas.getContext('2d');
const player1ScoreDisplay = document.getElementById('player1-score');
const player2ScoreDisplay = document.getElementById('player2-score');
const matchStatusDisplay = document.getElementById('match-status');
const powerupMessageDisplay = document.getElementById('powerup-message');
const connectionStatusMessage = document.getElementById('connection-status-message');
const backToMenuBtn = document.getElementById('back-to-menu-btn');

const tutorialSection = document.getElementById('tutorial-section');
const backToMenuFromTutorialBtn = document.getElementById('back-to-menu-from-tutorial-btn');

// ---

// 2. Inițializarea Stării Jocului (obiectul gameState)
const gameState = {
    gameRunning: false,
    gameMode: null, // 'singlePlayer' sau 'multiplayer'

    player1: null, 
    player2: null, 
    ball: null,    
    
    gravity: 0.5, 
    friction: 0.98, 
    ballFriction: 0.99, 
    
    keys: {}, 
    
    powerUp: null, 
    powerUpSpawnTimer: 0,
    powerUpInterval: 5000, 
    
    isPlayer1Local: false, 
    isPlayer2Local: false, 
    playerNum: 0, // 0 = not assigned, 1 = player1, 2 = player2
    socket: null, 
    isConnecting: false, // Flag pentru a preveni cererile multiple de rol
    
    localPlayer: null,  
    remotePlayer: null, 

    currentGoalWidth: 0, 
    currentGoalHeight: 0,
    affectedGoalPlayerId: null, 
    goalResetTimeout: null, 
    goalScoredPlayerId: null, 

    confettiParticles: [] 
};

// ---

// 3. Constante și Configurație
const PLAYER_MOVE_SPEED = 3; 
const PLAYER_JUMP_FORCE = -11; 
const PLAYER_SHOOT_FORCE_X = 12;
const PLAYER_SHOOT_FORCE_Y = -10;
const PLAYER_SKILL_COOLDOWN = 3000; 
const PLAYER_SHOOT_COOLDOWN = 300; 
const LUCI_POWERUP_DURATION = 20000; 
const LUCI_SKILL_BOOST = 1.5;

const GOAL_BASE_WIDTH = 20; 
const GOAL_BASE_HEIGHT = 100; 

const SKILL_ACTIVATION_KEY = 'x'; 

const HEAD_SIZE_FACTOR_LARGE = 1.5; 
const HEAD_SIZE_FACTOR_SMALL = 0.5; 
const HEAD_POWERUP_DURATION = 10000; 

const GOAL_SIZE_FACTOR_LARGE = 1.5; 
const GOAL_SIZE_FACTOR_SMALL = 0.5; 
const GOAL_POWERUP_DURATION = 8000; 

const POWERUP_DISAPPEAR_DURATION = 3000; 
const POWERUP_LANDING_Y = 370; 

const GOAL_ANIMATION_DURATION = 2000; 
const CONFETTI_COUNT = 100; 

// Dimensiunile fixe pentru coliziune (capul logic al jucătorului)
const PLAYER_COLLISION_HEAD_RADIUS = 30; 

// Dimensiunile imaginilor specificate:
const DEFAULT_HEAD_WIDTH = 60; 
const DEFAULT_HEAD_HEIGHT = 60; 

const DEFAULT_FOOT_WIDTH = 36; 
const DEFAULT_FOOT_HEIGHT = 21; 

// Căi către imaginile
const BACKGROUND_IMAGE_PATH = 'assets/images/background.png'; 
const BALL_IMAGE_PATH = 'assets/images/ball.png'; 

const LUCI_POWERUP_IMAGE_PATH = 'assets/images/luci_face.png';
const SKILL_ORB_IMAGE_PATH = 'assets/images/skill_orb.png';
const BIG_HEAD_IMAGE_PATH = 'assets/images/big_head.png'; 
const SMALL_HEAD_IMAGE_PATH = 'assets/images/small_head.png'; 
const BIG_GOAL_IMAGE_PATH = 'assets/images/big_goal.png';
const SMALL_GOAL_IMAGE_PATH = 'assets/images/small_goal.png';

// IMAGINI JUCATORI
const BULU_HEAD_IMAGE_PATH = 'assets/images/bulu_head.png';
const BULU_FOOT_IMAGE_PATH = 'assets/images/bulu_foot.png'; 

const WIZZEE_HEAD_IMAGE_PATH = 'assets/images/wizzee_head.png';
const WIZZEE_FOOT_IMAGE_PATH = 'assets/images/wizzee_foot.png'; 

// IMAGINI SPECIFICE DE CAP PENTRU POWER-UP-URI
const BULU_BIG_HEAD_IMAGE_PATH = 'assets/images/bulu_big_head.png';
const BULU_SMALL_HEAD_IMAGE_PATH = 'assets/images/bulu_small_head.png';
const WIZZEE_BIG_HEAD_IMAGE_PATH = 'assets/images/wizzee_big_head.png';
const WIZZEE_SMALL_HEAD_IMAGE_PATH = 'assets/images/wizzee_small_head.png';

// Obiecte Image (se vor încărca asincron)
const backgroundImage = new Image(); backgroundImage.src = BACKGROUND_IMAGE_PATH;
const ballImage = new Image(); ballImage.src = BALL_IMAGE_PATH;

const luciPowerUpImage = new Image(); luciPowerUpImage.src = LUCI_POWERUP_IMAGE_PATH;
const skillOrbImage = new Image(); skillOrbImage.src = SKILL_ORB_IMAGE_PATH;
const bigHeadImage = new Image(); bigHeadImage.src = BIG_HEAD_IMAGE_PATH; 
const smallHeadImage = new Image(); smallHeadImage.src = SMALL_HEAD_IMAGE_PATH; 
const bigGoalImage = new Image(); bigGoalImage.src = BIG_GOAL_IMAGE_PATH;
const smallGoalImage = new Image(); smallGoalImage.src = SMALL_GOAL_IMAGE_PATH;

const buluHeadImage = new Image(); buluHeadImage.src = BULU_HEAD_IMAGE_PATH;
const buluFootImage = new Image(); buluFootImage.src = BULU_FOOT_IMAGE_PATH;
const buluBigHeadImage = new Image(); buluBigHeadImage.src = BULU_BIG_HEAD_IMAGE_PATH;
const buluSmallHeadImage = new Image(); buluSmallHeadImage.src = BULU_SMALL_HEAD_IMAGE_PATH;

const wizzeeHeadImage = new Image(); wizzeeHeadImage.src = WIZZEE_HEAD_IMAGE_PATH;
const wizzeeFootImage = new Image(); wizzeeFootImage.src = WIZZEE_FOOT_IMAGE_PATH;
const wizzeeBigHeadImage = new Image(); wizzeeBigHeadImage.src = WIZZEE_BIG_HEAD_IMAGE_PATH;
const wizzeeSmallHeadImage = new Image(); wizzeeSmallHeadImage.src = WIZZEE_SMALL_HEAD_IMAGE_PATH;

// ---

// 4. Sistemul de Navigare Meniu/Secțiuni

function showSection(sectionToShow) {
    const allSections = [mainMenu, gameSection, tutorialSection, playerSelectionMenu];
    allSections.forEach(section => {
        if (section === sectionToShow) {
            section.classList.remove('hidden');
        } else {
            section.classList.add('hidden');
        }
    });
}

function startGameSinglePlayer() {
    console.log("startGameSinglePlayer() called.");
    gameState.gameMode = 'singlePlayer';
    gameState.gameRunning = false; 

    initializeGameEntities(); 
    gameState.localPlayer = gameState.player1;
    gameState.remotePlayer = gameState.player2; 
    gameState.playerNum = 1; // Always player 1 in single player

    showSection(gameSection); 
    resetRound(); 
    updateScoreUI();
    showGameMessage("Meci Single Player: Bulu vs AI (Wizzee)! Apasă orice tastă pentru a începe!", 'status', 0);
    connectionStatusMessage.classList.add('hidden'); 

    const startGameOnKeydown = (event) => {
        if (!gameState.gameRunning) { 
            gameState.gameRunning = true; 
            matchStatusDisplay.classList.add('hidden'); 
            window.removeEventListener('keydown', startGameOnKeydown); 
        }
    };
    window.addEventListener('keydown', startGameOnKeydown);
}

function showMultiplayerSelection() {
    console.log("showMultiplayerSelection() called.");
    showSection(playerSelectionMenu);
    playerSelectionStatus.textContent = "Alege Jucător 1 (Bulu) sau Jucător 2 (Wizzee).";
    connectionStatusMessage.classList.add('hidden'); 
}

function chooseMultiplayerRole(role) {
    if (gameState.isConnecting) { // Previne multiple click-uri/cereri
        console.log("Already trying to connect, please wait.");
        return;
    }
    gameState.isConnecting = true;

    console.log(`Trying to connect as Player ${role}`);
    gameState.gameMode = 'multiplayer';
    gameState.gameRunning = false; 
    gameState.playerNum = role; 

    initializeGameEntities(); 
    resetRound(); 
    updateScoreUI();

    showSection(gameSection); 
    connectionStatusMessage.textContent = 'Conectare la server...';
    connectionStatusMessage.classList.remove('hidden'); 
    matchStatusDisplay.classList.remove('hidden'); 
    matchStatusDisplay.textContent = "Așteptăm jucători..."; 

    setupMultiplayer(); 
    if (gameState.socket) {
        gameState.socket.emit('playerRoleRequest', { playerNum: role });
    }
}


function showTutorial() {
    console.log("showTutorial() called.");
    showSection(tutorialSection);
}

function backToMainMenu() {
    console.log("backToMainMenu() called.");
    gameState.gameRunning = false;
    gameState.gameMode = null;
    gameState.playerNum = 0;
    gameState.isPlayer1Local = false;
    gameState.isPlayer2Local = false;
    gameState.isConnecting = false; // Reset flag

    if (gameState.socket && gameState.socket.connected) { 
        gameState.socket.disconnect();
        gameState.socket = null;
        console.log("Deconectat de la server Socket.IO la revenirea la meniu.");
    }

    resetRound(); 
    player1ScoreDisplay.textContent = '0';
    player2ScoreDisplay.textContent = '0';
    
    matchStatusDisplay.classList.remove('hidden'); 
    matchStatusDisplay.textContent = ""; 
    powerupMessageDisplay.classList.add('hidden');
    connectionStatusMessage.classList.add('hidden');

    showSection(mainMenu); 
}

// ---

// 5. Date Principale Joc (Jucători, Minge, PowerUps)

function initializeGameEntities() {
    console.log("initializeGameEntities() called.");
    const playerVisualHeight = DEFAULT_HEAD_HEIGHT + (PLAYER_COLLISION_HEAD_RADIUS * 0.5) + DEFAULT_FOOT_HEIGHT; 
    
    gameState.player1 = {
        x: 100, 
        y: gameCanvas.height - playerVisualHeight, 
        dx: 0, dy: 0, 
        width: DEFAULT_HEAD_WIDTH, 
        height: playerVisualHeight, 
        headRadius: PLAYER_COLLISION_HEAD_RADIUS, 
        originalHeadRadius: PLAYER_COLLISION_HEAD_RADIUS, 
        color: '#FF6B6B', score: 0, isJumping: false, isGrounded: true, 
        canShoot: true, canSkill: true, isLuci: false, luciTimer: 0, isShooting: false, shotStartTime: 0, skillUses: 0, 
        hasBigHead: false, hasSmallHead: false,
        headImage: buluHeadImage, footImage: buluFootImage, 
        bigHeadImage: buluBigHeadImage, smallHeadImage: buluSmallHeadImage 
    };

    gameState.player2 = {
        x: gameCanvas.width - 160, 
        y: gameCanvas.height - playerVisualHeight, 
        dx: 0, dy: 0, 
        width: DEFAULT_HEAD_WIDTH, 
        height: playerVisualHeight, 
        headRadius: PLAYER_COLLISION_HEAD_RADIUS, 
        originalHeadRadius: PLAYER_COLLISION_HEAD_RADIUS, 
        color: '#4ECDC4', score: 0, isJumping: false, isGrounded: true, 
        canShoot: true, canSkill: true, isLuci: false, luciTimer: 0, isShooting: false, shotStartTime: 0, skillUses: 0, 
        hasBigHead: false, hasSmallHead: false,
        headImage: wizzeeHeadImage, footImage: wizzeeFootImage, 
        bigHeadImage: wizzeeBigHeadImage, smallHeadImage: wizzeeSmallHeadImage 
    };

    gameState.ball = {
        x: gameCanvas.width / 2, y: gameCanvas.height / 2, radius: 15, dx: 0, dy: 0, color: '#eee'
    };
    
    gameState.currentGoalWidth = GOAL_BASE_WIDTH;
    gameState.currentGoalHeight = GOAL_BASE_HEIGHT;
    gameState.affectedGoalPlayerId = null; 
    gameState.goalScoredPlayerId = null; 
    gameState.confettiParticles = []; 

    if (gameState.gameMode === 'singlePlayer') { 
        gameState.player1.score = 0;
        gameState.player2.score = 0;
    }
    console.log("initializeGameEntities() finished. Player1 is:", gameState.player1);
    console.log("initializeGameEntities() finished. Ball is:", gameState.ball);
}

// ---

// 6. Funcții Utilitare și Ajutătoare (Desenare, Notificări)

function drawPlayer(player) {
    if (!player) return;

    const bodyWidth = player.width; 
    const currentHeadRadius = player.headRadius; 
    
    const currentHeadVisualWidth = currentHeadRadius * 2; // Head radius IS scaled now for visual and collision
    const currentHeadVisualHeight = currentHeadRadius * 2;

    const footHeight = DEFAULT_FOOT_HEIGHT; 
    const footWidth = DEFAULT_FOOT_WIDTH; 
    const gapBetweenHeadAndFoot = PLAYER_COLLISION_HEAD_RADIUS * 0.5; 

    const headDrawX = player.x + bodyWidth / 2 - currentHeadVisualWidth / 2;
    const headDrawY = player.y; 

    // --- Desenăm Capul (Head) ---
    let currentHeadImage = player.headImage;
    if (player.hasBigHead && player.bigHeadImage && player.bigHeadImage.complete && player.bigHeadImage.naturalWidth > 0) {
        currentHeadImage = player.bigHeadImage;
    } else if (player.hasSmallHead && player.smallHeadImage && player.smallHeadImage.complete && player.smallHeadImage.naturalWidth > 0) {
        currentHeadImage = player.smallHeadImage;
    }

    if (currentHeadImage && currentHeadImage.complete && currentHeadImage.naturalWidth > 0) {
        ctx.drawImage(currentHeadImage, headDrawX, headDrawY, currentHeadVisualWidth, currentHeadVisualHeight);
    } else {
        ctx.beginPath();
        ctx.arc(player.x + bodyWidth / 2, headDrawY + currentHeadVisualHeight / 2, currentHeadVisualWidth / 2, 0, Math.PI * 2); 
        ctx.fillStyle = player.color;
        ctx.fill();
        ctx.closePath();
    }
    
    // --- Desenăm Laba Piciorului (Foot) ---
    let footRenderX = player.x + bodyWidth / 2 - footWidth / 2;
    let footRenderY = headDrawY + currentHeadVisualHeight + gapBetweenHeadAndFoot;

    if (player.isShooting && player.shotStartTime) {
        const kickDuration = PLAYER_SHOOT_COOLDOWN; 
        const animationProgress = (Date.now() - player.shotStartTime) / kickDuration;
        const clampedProgress = Math.min(1, Math.max(0, animationProgress));

        const maxArcHeight = currentHeadVisualHeight * 0.8; 
        const maxArcLateral = bodyWidth * 0.7; 

        const effectiveDirection = (player === gameState.player1) ? 1 : -1; 

        const arcYOffset = Math.sin(clampedProgress * Math.PI) * maxArcHeight;
        const arcXOffset = Math.sin(clampedProgress * Math.PI) * maxArcLateral * effectiveDirection;

        footRenderX = player.x + bodyWidth / 2 - footWidth / 2 + arcXOffset;
        footRenderY = (headDrawY + currentHeadVisualHeight) - arcYOffset; 
    }

    if (player.footImage && player.footImage.complete && player.footImage.naturalWidth > 0) {
        ctx.drawImage(player.footImage, footRenderX, footRenderY, footWidth, footHeight);
    } else {
        ctx.beginPath();
        ctx.rect(footRenderX, footRenderY, footWidth, footHeight);
        ctx.fillStyle = player.color; 
        ctx.fill();
        ctx.closePath();
    }

    // Dacă jucătorul este în modul Luci, desenăm fața lui Luci peste cap
    if (player.isLuci && luciPowerUpImage.complete && luciPowerUpImage.naturalWidth > 0) {
        ctx.drawImage(luciPowerUpImage, headDrawX, headDrawY, currentHeadVisualWidth, currentHeadVisualHeight);
    }

    // Afișează numărul de utilizări de skill deasupra jucătorului
    if (player.skillUses > 0) {
        ctx.fillStyle = 'yellow';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`S: ${player.skillUses}`, player.x + bodyWidth / 2, headDrawY - 10);
    }
}

function drawBall(ball) {
    if (!ball) return; 
    if (ballImage && ballImage.complete && ballImage.naturalWidth > 0) {
        ctx.drawImage(ballImage, ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2);
    } else {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.fill();
        ctx.closePath();
    }
}

// Modificăm drawGoal pentru a desena o poartă normală sau o poartă afectată vizual
function drawGoal(x, isLeftGoal) {
    let goalWidthToDraw = GOAL_BASE_WIDTH;
    let goalHeightToDraw = GOAL_BASE_HEIGHT;
    let goalColor = '#C0C0C0'; 

    if (gameState.affectedGoalPlayerId) {
        let affectedPlayerObject = null;
        if (gameState.gameMode === 'multiplayer') {
            affectedPlayerObject = (gameState.player1 && gameState.player1.id === gameState.affectedGoalPlayerId) ? gameState.player1 : (gameState.player2 && gameState.player2.id === gameState.affectedGoalPlayerId) ? gameState.player2 : null;
        } else { 
            affectedPlayerObject = (gameState.affectedGoalPlayerId === 'player1') ? gameState.player1 : (gameState.affectedGoalPlayerId === 'player2') ? gameState.player2 : null;
        }

        if (affectedPlayerObject) {
            const isAffectedPlayerGoal = (isLeftGoal && affectedPlayerObject === gameState.player1) || (!isLeftGoal && affectedPlayerObject === gameState.player2);
            
            if (isAffectedPlayerGoal) {
                goalWidthToDraw = gameState.currentGoalWidth;
                goalHeightToDraw = gameState.currentGoalHeight;
                goalColor = (affectedPlayerObject === gameState.player1) ? 'rgba(255, 0, 0, 0.7)' : 'rgba(0, 255, 255, 0.7)';
            }
        }
    }

    ctx.fillStyle = goalColor; 
    ctx.fillRect(x, gameCanvas.height - goalHeightToDraw, goalWidthToDraw, goalHeightToDraw);

    ctx.strokeStyle = '#FFFFFF'; 
    ctx.lineWidth = 2; 
    ctx.strokeRect(x, gameCanvas.height - goalHeightToDraw, goalWidthToDraw, goalHeightToDraw);

    ctx.beginPath();
    for (let i = 0; i <= goalWidthToDraw; i += goalWidthToDraw / 4) {
        ctx.moveTo(x + i, gameCanvas.height - goalHeightToDraw);
        ctx.lineTo(x + i, gameCanvas.height);
    }
    for (let i = 0; i <= goalHeightToDraw; i += goalHeightToDraw / 4) {
        ctx.moveTo(x, gameCanvas.height - goalHeightToDraw + i);
        ctx.lineTo(x + goalWidthToDraw, gameCanvas.height - goalHeightToDraw + i);
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; 
    ctx.stroke();
    ctx.closePath();
}

function drawPowerUp(powerUp) {
    if (!powerUp) return;

    let imgToDraw = null;
    switch(powerUp.type) {
        case 'luci': imgToDraw = luciPowerUpImage; break;
        case 'skillOrb': imgToDraw = skillOrbImage; break;
        case 'bigHead': imgToDraw = bigHeadImage; break;
        case 'smallHead': imgToDraw = smallHeadImage; break;
        case 'bigGoal': imgToDraw = bigGoalImage; break;
        case 'smallGoal': imgToDraw = smallGoalImage; break;
    }

    if (imgToDraw && imgToDraw.complete && imgToDraw.naturalWidth > 0) { 
        ctx.drawImage(imgToDraw, powerUp.x, powerUp.y, powerUp.size, powerUp.size);
    } else { 
        ctx.beginPath();
        ctx.arc(powerUp.x + powerUp.size / 2, powerUp.y + powerUp.size / 2, powerUp.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700'; 
        ctx.fill();
        ctx.closePath();
    }
}

function showGameMessage(message, type = 'status', duration = 3000) {
    let targetElement;
    
    matchStatusDisplay.classList.add('hidden');
    powerupMessageDisplay.classList.add('hidden');
    connectionStatusMessage.classList.add('hidden');

    if (type === 'powerup') {
        targetElement = powerupMessageDisplay;
    } else if (type === 'connection') {
        targetElement = connectionStatusMessage;
    } else { 
        targetElement = matchStatusDisplay;
        matchStatusDisplay.style.position = 'absolute';
        matchStatusDisplay.style.top = '50%';
        matchStatusDisplay.style.left = '50%';
        matchStatusDisplay.style.transform = 'translate(-50%, -50%)';
        matchStatusDisplay.style.fontSize = '2.5em'; 
    }

    targetElement.textContent = message;
    targetElement.classList.remove('hidden');

    if (duration > 0) {
        setTimeout(() => {
            targetElement.classList.add('hidden');
            if (type === 'status') { 
                matchStatusDisplay.style.position = '';
                matchStatusDisplay.style.top = '';
                matchStatusDisplay.style.left = '';
                matchStatusDisplay.style.transform = '';
                matchStatusDisplay.style.fontSize = ''; 
            }
        }, duration);
    }
}

// ---

// 7. Funcții de Actualizare UI

function updateScoreUI() {
    if (gameState.player1) player1ScoreDisplay.textContent = gameState.player1.score;
    if (gameState.player2) player2ScoreDisplay.textContent = gameState.player2.score;
}

function renderGame() {
    if (backgroundImage && backgroundImage.complete && backgroundImage.naturalWidth > 0) {
        ctx.drawImage(backgroundImage, 0, 0, gameCanvas.width, gameCanvas.height);
    } else {
        ctx.fillStyle = '#3b8e4e'; 
        ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
    }

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(gameCanvas.width / 2, 0);
    ctx.lineTo(gameCanvas.width / 2, gameCanvas.height);
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.arc(gameCanvas.width / 2, gameCanvas.height / 2, 50, 0, Math.PI * 2);
    ctx.stroke();
    ctx.closePath();

    drawGoal(0, true); 
    drawGoal(gameCanvas.width - GOAL_BASE_WIDTH, false); 

    drawPlayer(gameState.player1);
    drawPlayer(gameState.player2);
    drawBall(gameState.ball);

    if (gameState.powerUp) {
        drawPowerUp(gameState.powerUp);
    }

    if (gameState.goalScoredPlayerId) { 
        gameState.confettiParticles.forEach(particle => {
            ctx.fillStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${particle.alpha})`;
            ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
        });
        updateConfetti(); 
    }
}

// ---

// 8. Bucla Jocului și Fizica

function updatePlayerPhysics(player) {
    if (!player) return; 

    player.dy += gameState.gravity;

    player.x += player.dx;
    player.y += player.dy;

    const playerBottomY = player.y + player.height;

    if (playerBottomY >= gameCanvas.height) {
        player.y = gameCanvas.height - player.height; 
        player.dy = 0;
        player.isJumping = false;
        player.isGrounded = true; 
    } else {
        player.isGrounded = false; 
    }

    // Fricțiunea pe axa X este eliminată pentru oprire imediată
    if (player.x < 0) {
        player.x = 0;
        player.dx = 0;
    } else if (player.x + player.width > gameCanvas.width) {
        player.x = gameCanvas.width - player.width;
        player.dx = 0;
    }
}

function updateBallPhysics() {
    if (!gameState.ball) return; 

    gameState.ball.dy += gameState.gravity;

    gameState.ball.x += gameState.ball.dx;
    gameState.ball.y += gameState.ball.dy;

    gameState.ball.dx *= gameState.ballFriction;
    gameState.ball.dy *= gameState.ballFriction;

    if (gameState.ball.x - gameState.ball.radius < 0) {
        gameState.ball.x = gameState.ball.radius;
        gameState.ball.dx *= -1;
    }
    if (gameState.ball.x + gameState.ball.radius > gameCanvas.width) {
        gameState.ball.x = gameCanvas.width - gameState.ball.radius;
        gameState.ball.dx *= -1;
    }
    if (gameState.ball.y - gameState.ball.radius < 0) {
        gameState.ball.y = gameState.ball.radius;
        gameState.ball.dy *= -1;
    }
    if (gameState.ball.y + gameState.ball.radius > gameCanvas.height) {
        gameState.ball.y = gameCanvas.height - gameState.ball.radius;
        gameState.ball.dy *= -0.7;
        gameState.ball.dx *= 0.8;
    }
}

// Coliziune Jucător-Jucător (client-side)
function handlePlayerPlayerCollision(player1, player2) {
    if (!player1 || !player2) return;

    const rect1 = {
        x: player1.x,
        y: player1.y,
        width: player1.width,
        height: player1.height
    };
    const rect2 = {
        x: player2.x,
        y: player2.y,
        width: player2.width,
        height: player2.height
    };

    if (rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y) {
        
        // Dacă jucătorul 1 (care cade) este deasupra jucătorului 2
        if (player1.dy > 0 && rect1.y + rect1.height - player1.dy < rect2.y) { 
            player1.y = rect2.y - player1.height; 
            player1.dy = 0;
            player1.isGrounded = true; 
        } 
        // Dacă jucătorul 2 (care cade) este deasupra jucătorului 1
        else if (player2.dy > 0 && rect2.y + rect2.height - player2.dy < rect1.y) {
            player2.y = rect1.y - player2.height;
            player2.dy = 0;
            player2.isGrounded = true;
        }
        // Coliziune orizontală sau altă interacțiune
        else {
            const overlapX = Math.min(rect1.x + rect1.width, rect2.x + rect2.width) - Math.max(rect1.x, rect2.x);
            const overlapY = Math.min(rect1.y + rect1.height, rect2.y + rect2.height) - Math.max(rect1.y, rect2.y);

            if (overlapX < overlapY) { 
                if (rect1.x < rect2.x) {
                    player1.x -= overlapX / 2;
                    player2.x += overlapX / 2;
                } else {
                    player1.x += overlapX / 2;
                    player2.x -= overlapX / 2;
                }
                player1.dx *= -0.5; 
                player2.dx *= -0.5;
            } else { 
                if (rect1.y < rect2.y) {
                    player1.y -= overlapY / 2;
                    player2.y += overlapY / 2;
                } else {
                    player1.y += overlapY / 2;
                    player2.y -= overlapY / 2;
                }
                player1.dy *= -0.5; 
                player2.dy *= -0.5;
            }
        }
    }
}


function checkCircleCollision(circle1, circle2) {
    const dx = circle1.x - circle2.x;
    const dy = circle1.y - circle2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < circle1.radius + circle2.radius;
}

function handlePlayerBallCollision(player, ball) {
    if (!player || !ball) return; 

    // `player.headRadius` se scalează acum cu power-up-urile
    const playerHeadCenterX = player.x + player.width / 2;
    const playerHeadCenterY = player.y + player.headRadius; 

    if (checkCircleCollision(
        { x: playerHeadCenterX, y: playerHeadCenterY, radius: player.headRadius }, 
        { x: ball.x, y: ball.y, radius: ball.radius }
    )) {
        const collisionAngle = Math.atan2(ball.y - playerHeadCenterY, ball.x - playerHeadCenterX);
        let hitForce = 10; 

        if (player.isLuci) {
            hitForce *= LUCI_SKILL_BOOST;
        }

        ball.dx = Math.cos(collisionAngle) * hitForce;
        ball.dy = Math.sin(collisionAngle) * hitForce;

        if (player.dy < 0) { 
             ball.dy -= 5;
        }
        const overlap = (player.headRadius + ball.radius) - Math.sqrt(Math.pow(ball.x - playerHeadCenterX, 2) + Math.pow(ball.y - playerHeadCenterY, 2));
        ball.x += Math.cos(collisionAngle) * overlap;
        ball.y += Math.sin(collisionAngle) * overlap;
    }
}

// Funcții pentru Confetti
function createConfettiParticle() {
    const colors = [
        {r: 255, g: 0, b: 0},   
        {r: 0, g: 255, b: 0},   
        {r: 0, g: 0, b: 255},   
        {r: 255, g: 255, b: 0}, 
        {r: 255, g: 0, b: 255}, 
        {r: 0, g: 255, b: 255}  
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 5 + 3; 

    return {
        x: Math.random() * gameCanvas.width, 
        y: -size, 
        dx: (Math.random() - 0.5) * 5, 
        dy: Math.random() * 5 + 2, 
        size: size,
        color: randomColor,
        alpha: 1 
    };
}

function spawnConfetti(count) {
    gameState.confettiParticles = []; 
    for (let i = 0; i < count; i++) {
        gameState.confettiParticles.push(createConfettiParticle());
    }
}

function updateConfetti() {
    for (let i = gameState.confettiParticles.length - 1; i >= 0; i--) {
        const p = gameState.confettiParticles[i];
        p.x += p.dx;
        p.y += p.dy;
        p.alpha -= 0.02; 

        if (p.alpha <= 0 || p.y > gameCanvas.height) {
            gameState.confettiParticles.splice(i, 1); 
        }
    }
}


function gameLoop() {
    if (!gameState.gameRunning && !gameState.goalResetTimeout) { 
        ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height); 
        
        if (gameState.gameMode === 'multiplayer') {
            ctx.fillStyle = '#666';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(connectionStatusMessage.textContent || 'Așteptăm jucători...', gameCanvas.width / 2, gameCanvas.height / 2);
        }
        
        requestAnimationFrame(gameLoop); 
        return; 
    }

    if (gameState.gameRunning) {
        if (gameState.gameMode === 'singlePlayer') {
            handlePlayerMovement();
            processInputActions();
            handleAI();
            updatePlayerPhysics(gameState.player1);
            updatePlayerPhysics(gameState.player2);
            updateBallPhysics();
            handlePlayerPlayerCollision(gameState.player1, gameState.player2); 
            handlePlayerBallCollision(gameState.player1, gameState.ball);
            handlePlayerBallCollision(gameState.player2, gameState.ball);
            checkGoals();
            handlePowerUp(); 
            updateLuciPowerUpTimers(); 
        } else if (gameState.gameMode === 'multiplayer') {
            handlePlayerMovement(); 
            processInputActions(); 
        }
    }
    
    renderGame(); 
    requestAnimationFrame(gameLoop);
}

// ---

// 9. Gestionarea Input-ului Jucătorului

function handleKeyDown(event) {
    gameState.keys[event.key] = true;
    
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'c', 'v', 'n', 'm', SKILL_ACTIVATION_KEY].includes(event.key.toLowerCase())) { 
        event.preventDefault();
    }

    if (gameState.gameMode === 'multiplayer') {
        if (!gameState.socket || !gameState.socket.connected || gameState.playerNum === 0) return; 

        let inputData = { type: '', playerNum: gameState.playerNum };
        const currentPlayer = (gameState.playerNum === 1) ? gameState.player1 : gameState.player2;

        if (!currentPlayer) return; 

        if (event.key.toLowerCase() === 'w' || event.key.toLowerCase() === 'arrowup') {
             if (currentPlayer.isGrounded) { 
                 inputData.type = 'jump';
                 gameState.socket.emit('playerInput', inputData);
             }
        } else if (event.key.toLowerCase() === 'a' || event.key.toLowerCase() === 'arrowleft') {
             inputData.type = 'move'; inputData.key = event.key.toLowerCase();
             gameState.socket.emit('playerInput', inputData);
        } else if (event.key.toLowerCase() === 'd' || event.key.toLowerCase() === 'arrowright') {
             inputData.type = 'move'; inputData.key = event.key.toLowerCase();
             gameState.socket.emit('playerInput', inputData);
        } else if (event.key.toLowerCase() === 'c' || event.key.toLowerCase() === 'n') { 
            const currentPlayer = (gameState.playerNum === 1) ? gameState.player1 : gameState.player2;
            if (currentPlayer.canShoot) {
                currentPlayer.canShoot = false;
                currentPlayer.isShooting = true; 
                currentPlayer.shotStartTime = Date.now(); 
                setTimeout(() => { 
                    currentPlayer.canShoot = true; 
                    currentPlayer.isShooting = false; 
                    currentPlayer.shotStartTime = 0; 
                }, PLAYER_SHOOT_COOLDOWN);
                inputData.type = 'shoot';
                gameState.socket.emit('playerInput', inputData);
            }
        } else if (event.key.toLowerCase() === SKILL_ACTIVATION_KEY) { 
            const currentPlayer = (gameState.playerNum === 1) ? gameState.player1 : gameState.player2;
            if (currentPlayer.canSkill) { 
                if (currentPlayer.skillUses > 0) { 
                    currentPlayer.canSkill = false;
                    currentPlayer.isShooting = true; 
                    currentPlayer.shotStartTime = Date.now(); 
                    setTimeout(() => { 
                        currentPlayer.canSkill = true; 
                        currentPlayer.isShooting = false; 
                        currentPlayer.shotStartTime = 0; 
                    }, PLAYER_SKILL_COOLDOWN); 
                    inputData.type = 'skill';
                    gameState.socket.emit('playerInput', inputData);
                } else {
                    showGameMessage("Nu ai utilizări de skill!", 'status', 1000); 
                }
            }
        }
    } else if (gameState.gameMode === 'singlePlayer') {
        if (event.key.toLowerCase() === 'a' || event.key.toLowerCase() === 'd') {
            handlePlayerMovement(); 
        } else if (event.key.toLowerCase() === 'w') {
            handlePlayerMovement(); 
        } else if (event.key.toLowerCase() === 'c') {
            shoot(gameState.player1);
        } else if (event.key.toLowerCase() === SKILL_ACTIVATION_KEY) {
            useSkill(gameState.player1);
        }
    }
}

function handleKeyUp(event) {
    gameState.keys[event.key] = false;

    if (gameState.gameMode === 'multiplayer') {
        if (!gameState.socket || !gameState.socket.connected || gameState.playerNum === 0) return;

        if (event.key.toLowerCase() === 'a' || event.key.toLowerCase() === 'arrowleft' ||
            event.key.toLowerCase() === 'd' || event.key.toLowerCase() === 'arrowright') {
            gameState.socket.emit('playerInput', { type: 'stopMove', playerNum: gameState.playerNum });
        }
    } else if (gameState.gameMode === 'singlePlayer') {
        if (event.key.toLowerCase() === 'a' || event.key.toLowerCase() === 'd') {
            gameState.player1.dx = 0;
        }
    }
}

function handlePlayerMovement() {
    if (gameState.gameMode === 'singlePlayer') {
        if (gameState.isPlayer1Local && gameState.player1) { 
            let currentMoveSpeed = PLAYER_MOVE_SPEED;
            if (gameState.player1.isLuci) currentMoveSpeed *= LUCI_SKILL_BOOST;

            if (gameState.keys['a']) { 
                gameState.player1.dx = -currentMoveSpeed; 
            } else if (gameState.keys['d']) { 
                gameState.player1.dx = currentMoveSpeed; 
            } else { 
                gameState.player1.dx = 0; 
            }

            let currentJumpForce = PLAYER_JUMP_FORCE;
            if (gameState.player1.isLuci) currentJumpForce *= LUCI_SKILL_BOOST;
            if (gameState.keys['w'] && gameState.player1.isGrounded) { 
                gameState.player1.dy = currentJumpForce;
                gameState.player1.isJumping = true;
                gameState.player1.isGrounded = false; 
            }
        }
    } else if (gameState.gameMode === 'multiplayer') {
        // Mișcarea e dictată de server, clientul doar trimite input.
    }
}

function processInputActions() {
    // This function is mostly for actions that aren't continuously applied (like move)
}

// ---

// 10. Logica Principală a Jocului (Detecție Gol, Power-up "Luci", Șut, Skill)

function checkGoals() {
    const ball = gameState.ball;
    if (!ball || !gameState.player1 || !gameState.player2) return;

    const goalLineY = gameCanvas.height - gameState.currentGoalHeight; 

    let goalScored = false;
    let scorerPlayer = null;

    if (ball.x - ball.radius < gameState.currentGoalWidth && ball.y > goalLineY) {
        gameState.player2.score++;
        scorerPlayer = 'player2';
        goalScored = true;
    } else if (ball.x + ball.radius > gameCanvas.width - gameState.currentGoalWidth && ball.y > goalLineY) {
        gameState.player1.score++;
        scorerPlayer = 'player1';
        goalScored = true;
    }

    if (goalScored) {
        updateScoreUI();
        gameState.goalScoredPlayerId = scorerPlayer; 
        showGameMessage(`GOOOOOL BAAAAAAAA!`, 'status', GOAL_ANIMATION_DURATION); 
        spawnConfetti(CONFETTI_COUNT); 
        
        gameState.gameRunning = false; // Îngheață fizica jocului pe client

        if (gameState.goalResetTimeout) clearTimeout(gameState.goalResetTimeout); 
        gameState.goalResetTimeout = setTimeout(() => {
            resetRound();
            gameState.goalResetTimeout = null;
            gameState.goalScoredPlayerId = null; 
        }, GOAL_ANIMATION_DURATION); 
    }
}

function resetRound() {
    console.log("resetRound() called.");
    gameState.confettiParticles = []; 

    const playerVisualHeight = DEFAULT_HEAD_HEIGHT + (PLAYER_COLLISION_HEAD_RADIUS * 0.5) + DEFAULT_FOOT_HEIGHT; 

    if (gameState.player1) {
        gameState.player1.x = 100; gameState.player1.y = gameCanvas.height - playerVisualHeight; 
        gameState.player1.dx = 0; gameState.player1.dy = 0; gameState.player1.isJumping = false; gameState.player1.isGrounded = true;
        gameState.player1.isShooting = false; 
        gameState.player1.canShoot = true; 
        gameState.player1.canSkill = true; 
        if (gameState.player1.isLuci) { endLuciPowerUp(gameState.player1); }
        // Reset headRadius to original, then set hasBigHead/SmallHead to false
        gameState.player1.headRadius = gameState.player1.originalHeadRadius; 
        gameState.player1.hasBigHead = false; 
        gameState.player1.hasSmallHead = false;
        gameState.player1.skillUses = 0; 
    }

    if (gameState.player2) {
        gameState.player2.x = gameCanvas.width - 160; gameState.player2.y = gameCanvas.height - playerVisualHeight; 
        gameState.player2.dx = 0; gameState.player2.dy = 0; gameState.player2.isJumping = false; gameState.player2.isGrounded = true;
        gameState.player2.isShooting = false; 
        gameState.player2.canShoot = true;
        gameState.player2.canSkill = true;
        if (gameState.player2.isLuci) { endLuciPowerUp(gameState.player2); }
        // Reset headRadius to original, then set hasBigHead/SmallHead to false
        gameState.player2.headRadius = gameState.player2.originalHeadRadius; 
        gameState.player2.hasBigHead = false;
        gameState.player2.hasSmallHead = false;
        gameState.player2.skillUses = 0;
    }

    if (gameState.ball) {
        gameState.ball.x = gameCanvas.width / 2; gameState.ball.y = gameCanvas.height / 2;
        gameState.ball.dx = 0; gameState.ball.dy = 0;
    }

    gameState.currentGoalWidth = GOAL_BASE_WIDTH;
    gameState.currentGoalHeight = GOAL_BASE_HEIGHT;
    gameState.affectedGoalPlayerId = null; 

    gameState.powerUp = null; 
    gameState.powerUpSpawnTimer = 0;

    gameState.gameRunning = true; 
}

function handlePowerUp() {
    if (gameState.gameMode === 'multiplayer') return; 

    if (gameState.powerUp) {
        if (typeof gameState.powerUp.dy === 'undefined') { gameState.powerUp.dy = 0; }
        
        gameState.powerUp.dy += gameState.gravity * 0.2; 
        gameState.powerUp.y += gameState.powerUp.dy;

        if (gameState.powerUp.y + gameState.powerUp.size > POWERUP_LANDING_Y) {
            gameState.powerUp.y = POWERUP_LANDING_Y - gameState.powerUp.size;
            gameState.powerUp.dy = 0;
            if (!gameState.powerUp.groundedTimer) {
                gameState.powerUp.groundedTimer = Date.now();
            }
        }
    }

    if (gameState.powerUp && gameState.powerUp.groundedTimer) {
        if (Date.now() - gameState.powerUp.groundedTimer > POWERUP_DISAPPEAR_DURATION) {
            showGameMessage(`Power-up-ul de tip ${gameState.powerUp.type} a dispărut!`, 'status', 2000);
            gameState.powerUp = null;
            gameState.powerUpSpawnTimer = 0; 
            return; 
        }
    }

    if (!gameState.powerUp && gameState.gameRunning) { 
        gameState.powerUpSpawnTimer += 1000 / 60;

        if (gameState.powerUpSpawnTimer >= gameState.powerUpInterval) {
            const size = 40;
            const powerUpTypes = ['luci', 'skillOrb', 'bigHead', 'smallHead', 'bigGoal', 'smallGoal']; 
            const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];

            gameState.powerUp = {
                x: Math.random() * (gameCanvas.width - size),
                y: -size, 
                size: size,
                type: randomType, 
                dy: 0 
            };
            showGameMessage(`Un power-up de tip ${randomType} a apărut!`, 'powerup', 3000);
            gameState.powerUpSpawnTimer = 0;
        }
    }

    // Logică de colectare - VERIFICARE ACTIVA SI DUPA CE CADE
    if (gameState.powerUp) { 
        const players = [gameState.player1, gameState.player2].filter(p => p !== null); 
        for (const player of players) {
            if (player.x < gameState.powerUp.x + gameState.powerUp.size &&
                player.x + player.width > gameState.powerUp.x &&
                player.y < gameState.powerUp.y + gameState.powerUp.size &&
                player.y + player.height > gameState.powerUp.y) {

                switch (gameState.powerUp.type) {
                    case 'luci': activateLuciPowerUp(player); break;
                    case 'skillOrb': 
                        player.skillUses += 3; 
                        showGameMessage(`${player === gameState.player1 ? 'Bulu' : 'Wizzee'} a obținut Skill Orb! Utilizări: ${player.skillUses}`, 'powerup', 3000);
                        break;
                    case 'bigHead': activateHeadPowerUp(player, 'big'); break;
                    case 'smallHead': activateHeadPowerUp(player, 'small'); break;
                    case 'bigGoal': activateGoalPowerUp(player, 'big'); break; 
                    case 'smallGoal': activateGoalPowerUp(player, 'small'); break;
                }
                gameState.powerUp = null; 
                gameState.powerUpSpawnTimer = 0; 
                break;
            }
        }
    }
}

function activateLuciPowerUp(player) {
    if (player.isLuci) return; 

    player.isLuci = true;
    player.luciTimer = LUCI_POWERUP_DURATION;
    showGameMessage(`LUCI POWER! ${player === gameState.player1 ? 'Bulu' : 'Wizzee'} s-a transformat în Luci!`, 'powerup', LUCI_POWERUP_DURATION);
}

function endLuciPowerUp(player) {
    if (!player.isLuci) return;

    player.isLuci = false;
    player.luciTimer = 0;
    showGameMessage("Power-up-ul Luci a expirat!", 'status', 2000);
}

function activateHeadPowerUp(player, type) {
    if (player.hasBigHead || player.hasSmallHead) {
        endHeadPowerUp(player); 
    }

    if (type === 'big') {
        player.headRadius = player.originalHeadRadius * HEAD_SIZE_FACTOR_LARGE;
        player.hasBigHead = true;
        showGameMessage(`${player === gameState.player1 ? 'Bulu' : 'Wizzee'} are Cap MARE!`, 'powerup', HEAD_POWERUP_DURATION);
    } else if (type === 'small') {
        player.headRadius = player.originalHeadRadius * HEAD_SIZE_FACTOR_SMALL;
        player.hasSmallHead = true;
        showGameMessage(`${player === gameState.player1 ? 'Bulu' : 'Wizzee'} are Cap MIC!`, 'powerup', HEAD_POWERUP_DURATION);
    }

    setTimeout(() => {
        endHeadPowerUp(player);
    }, HEAD_POWERUP_DURATION);
}

function endHeadPowerUp(player) { 
    player.headRadius = player.originalHeadRadius; 
    player.hasBigHead = false;
    player.hasSmallHead = false;
    showGameMessage(`Capul ${player === gameState.player1 ? 'Bulu' : 'Wizzee'} a revenit la normal!`, 'status', 2000);
}

function activateGoalPowerUp(collectorPlayer, type) {
    let affectedPlayerSideId = null; 
    if (gameState.gameMode === 'singlePlayer') {
        affectedPlayerSideId = (collectorPlayer === gameState.player1) ? 'player2' : 'player1';
    } else { 
        console.error("activateGoalPowerUp called directly in multiplayer client, should be from server.");
        return; 
    }

    let goalWidthMultiplier = 1;
    let goalHeightMultiplier = 1;

    if (type === 'big') {
        goalWidthMultiplier = GOAL_SIZE_FACTOR_LARGE;
        goalHeightMultiplier = GOAL_SIZE_FACTOR_LARGE;
        showGameMessage(`Poarta adversarului e MARE!`, 'powerup', GOAL_POWERUP_DURATION);
    } else if (type === 'small') {
        goalWidthMultiplier = GOAL_SIZE_FACTOR_SMALL;
        goalHeightMultiplier = GOAL_SIZE_FACTOR_SMALL;
        showGameMessage(`Poarta adversarului e MICĂ!`, 'powerup', GOAL_POWERUP_DURATION);
    }

    gameState.affectedGoalPlayerId = affectedPlayerSideId;

    gameState.currentGoalWidth = GOAL_BASE_WIDTH * goalWidthMultiplier;
    gameState.currentGoalHeight = GOAL_BASE_HEIGHT * goalHeightMultiplier;
    
    setTimeout(() => {
        endGoalPowerUp(); 
    }, GOAL_POWERUP_DURATION);
}

function endGoalPowerUp() { 
    gameState.currentGoalWidth = GOAL_BASE_WIDTH;
    gameState.currentGoalHeight = GOAL_BASE_HEIGHT;
    gameState.affectedGoalPlayerId = null; 
    showGameMessage(`Poarta a revenit la normal!`, 'status', 2000);
}

function updateLuciPowerUpTimers() {
    if (gameState.gameMode === 'multiplayer') return; 

    const players = [gameState.player1, gameState.player2].filter(p => p !== null);
    players.forEach(player => {
        if (player.isLuci) {
            player.luciTimer -= (1000 / 60);
            if (player.luciTimer <= 0) {
                endLuciPowerUp(player);
            }
        }
    });
}

// Funcție ajutătoare pentru coliziunea dreptunghi-cerc (pentru picior și minge)
function checkRectCircleCollision(rectX, rectY, rectWidth, rectHeight, circleX, circleY, circleRadius) {
    const closestX = Math.max(rectX, Math.min(circleX, rectX + rectWidth));
    const closestY = Math.max(rectY, Math.min(circleY, rectY + rectHeight));

    const dx = circleX - closestX;
    const dy = circleY - closestY;
    const distanceSquared = (dx * dx) + (dy * dy);

    return distanceSquared < (circleRadius * circleRadius);
}


function shoot(player) {
    if (!player || !gameState.ball || !player.canShoot) return;

    player.canShoot = false;
    player.isShooting = true; 
    player.shotStartTime = Date.now(); 
    
    setTimeout(() => { 
        player.canShoot = true; 
        player.isShooting = false; 
        player.shotStartTime = 0; 
    }, PLAYER_SHOOT_COOLDOWN); 

    const currentHeadVisualHeight = player.headRadius * 2; 
    const footBaseY = player.y + currentHeadVisualHeight + (PLAYER_COLLISION_HEAD_RADIUS * 0.5); 
    
    const kickDuration = PLAYER_SHOOT_COOLDOWN; 
    const animationProgress = (Date.now() - player.shotStartTime) / kickDuration;
    const clampedProgress = Math.min(1, Math.max(0, animationProgress));

    const maxArcHeight = currentHeadVisualHeight * 0.8; 
    const maxArcLateral = player.width * 0.7; 

    const effectiveDirection = (player === gameState.player1) ? 1 : -1; 

    const arcYOffset = Math.sin(clampedProgress * Math.PI) * maxArcHeight;
    const arcXOffset = Math.sin(clampedProgress * Math.PI) * maxArcLateral * effectiveDirection;

    const animatedFootX = player.x + player.width / 2 - DEFAULT_FOOT_WIDTH / 2 + arcXOffset;
    const animatedFootY = (player.y + currentHeadVisualHeight) - arcYOffset; 
    
    if (checkRectCircleCollision(animatedFootX, animatedFootY, DEFAULT_FOOT_WIDTH, DEFAULT_FOOT_HEIGHT, gameState.ball.x, gameState.ball.y, gameState.ball.radius)) { 
        
        let shootForceX = PLAYER_SHOOT_FORCE_X;
        let shootForceY = PLAYER_SHOOT_FORCE_Y;
        if (player.isLuci) {
            shootForceX *= LUCI_SKILL_BOOST;
            shootForceY *= LUCI_SKILL_BOOST;
        }

        const direction = (player === gameState.player1) ? 1 : -1;

        gameState.ball.dx = direction * shootForceX;
        gameState.ball.dy = shootForceY;

        gameState.ball.x = animatedFootX + DEFAULT_FOOT_WIDTH / 2 + direction * (DEFAULT_FOOT_WIDTH / 2 + gameState.ball.radius + 5);
        gameState.ball.y = animatedFootY + DEFAULT_FOOT_HEIGHT / 2 - gameState.ball.radius; 
    } else {
        console.log("Client: Mingea nu e în zona piciorului pentru șut valid. Shot not applied.");
    }

    if (gameState.gameMode === 'multiplayer') {
        return; 
    }
}

function useSkill(player) {
    if (!player || !player.canSkill) return;

    if (player.skillUses <= 0) {
        showGameMessage("Nu ai utilizări de skill!", 'status', 1000);
        return;
    }

    player.canSkill = false; 
    player.isShooting = true; 
    player.shotStartTime = Date.now(); 
    setTimeout(() => { 
        player.canSkill = true; 
        player.isShooting = false; 
        player.shotStartTime = 0; 
    }, PLAYER_SKILL_COOLDOWN); 

    const currentHeadVisualHeight = player.headRadius * 2; 
    const footBaseY = player.y + currentHeadVisualHeight + (PLAYER_COLLISION_HEAD_RADIUS * 0.5); 
    
    const kickDuration = PLAYER_SKILL_COOLDOWN; 
    const animationProgress = (Date.now() - player.shotStartTime) / kickDuration;
    const clampedProgress = Math.min(1, Math.max(0, animationProgress));

    const maxArcHeight = currentHeadVisualHeight * 0.8; 
    const maxArcLateral = player.width * 0.7; 

    const effectiveDirection = (player === gameState.player1) ? 1 : -1;

    const arcYOffset = Math.sin(clampedProgress * Math.PI) * maxArcHeight;
    const arcXOffset = Math.sin(clampedProgress * Math.PI) * maxArcLateral * effectiveDirection;

    const animatedFootX = player.x + player.width / 2 - DEFAULT_FOOT_WIDTH / 2 + arcXOffset;
    const animatedFootY = (player.y + currentHeadVisualHeight) - arcYOffset; 

    if (checkRectCircleCollision(animatedFootX, animatedFootY, DEFAULT_FOOT_WIDTH, DEFAULT_FOOT_HEIGHT, gameState.ball.x, gameState.ball.y, gameState.ball.radius)) { 

        player.skillUses--; 

        if (player === gameState.player1) { 
            showGameMessage(`Bulu a folosit Bulu Rage! Utilizări rămase: ${player.skillUses}`, 'status', 2000);
            if (gameState.ball) {
                const directionToBall = gameState.ball.x - player.x;
                gameState.ball.dx += Math.sign(directionToBall) * 15;
                gameState.ball.dy -= 10;
            }
        } else if (player === gameState.player2) { 
            showGameMessage(`Wizzee a folosit Meme Slowmo! Utilizări rămase: ${player.skillUses}`, 'status', 2000);
            if (gameState.ball) {
                gameState.ball.originalDx = gameState.ball.dx;
                gameState.ball.originalDy = gameState.ball.dy;
                gameState.ball.dx *= 0.3;
                gameState.ball.dy *= 0.3;
                setTimeout(() => {
                    if (gameState.ball) {
                        gameState.ball.dx = gameState.ball.originalDx;
                        gameState.ball.dy = gameState.ball.originalDy;
                    }
                }, 1000);
            }
        }
    } else {
        console.log("Client: Mingea nu e în zona piciorului pentru skill valid. Skill not applied.");
        showGameMessage("Skill ratat! Mingea nu era în zonă!", 'status', 1500);
    }
}

// ---

// 11. Logica Inteligenței Artificiale (AI) - pentru modul Single Player

function handleAI() {
    if (gameState.gameMode !== 'singlePlayer' || !gameState.player2 || !gameState.ball) {
        return; 
    }

    const aiPlayer = gameState.player2;
    const ball = gameState.ball;

    const targetX = ball.x;

    const tolerance = 5; 
    if (targetX < aiPlayer.x - tolerance) {
        aiPlayer.dx = -PLAYER_MOVE_SPEED;
    } else if (targetX > aiPlayer.x + tolerance) {
        aiPlayer.dx = PLAYER_MOVE_SPEED;
    } else {
        aiPlayer.dx = 0; 
    }

    const aiPlayerCenterX = aiPlayer.x + aiPlayer.width / 2;

    if (aiPlayer.isGrounded && ball.y < aiPlayer.y + aiPlayer.height / 2 && Math.abs(ball.x - aiPlayerCenterX) < aiPlayer.width) {
        aiPlayer.dy = PLAYER_JUMP_FORCE;
        aiPlayer.isJumping = true;
        aiPlayer.isGrounded = false;
    }

    const shootDistance = 150; 
    if (Math.abs(ball.x - aiPlayerCenterX) < shootDistance && aiPlayer.x > gameCanvas.width / 2) {
        if (aiPlayer.canShoot && (Math.random() < 0.02 || ball.x < gameCanvas.width / 2 + 50)) {
            shoot(aiPlayer);
        }
        if (aiPlayer.canSkill && aiPlayer.skillUses > 0 && Math.random() < 0.01 && ball.x < gameCanvas.width / 2 + 100) { 
            useSkill(aiPlayer);
        }
    }

    if (aiPlayer.isLuci) {
        aiPlayer.dx *= LUCI_SKILL_BOOST;
        aiPlayer.dy = PLAYER_JUMP_FORCE * LUCI_SKILL_BOOST;
    }
}

// ---

// 12. Logica Multiplayer (Integrare Socket.IO)

function setupMultiplayer() {
    if (typeof io === 'undefined') {
        console.error("Socket.IO client library not loaded. Cannot set up multiplayer.");
        connectionStatusMessage.textContent = 'Eroare: Multiplayer indisponibil (Socket.IO lipsește).';
        return;
    }

    // Dacă socketul există deja și este conectat, nu crea un nou socket
    if (gameState.socket && gameState.socket.connected) {
        console.log("Socket deja conectat. Reutilizează socketul existent.");
        gameState.socket.emit('playerRoleRequest', { playerNum: gameState.playerNum }); // Re-trimite cererea de rol
        return;
    }

    gameState.socket = io(); 

    gameState.socket.on('connect', () => {
        connectionStatusMessage.textContent = 'Conectat la server. Așteptăm un adversar...';
        console.log('Conectat la server cu ID:', gameState.socket.id);
        // După conectare, trimite cererea de rol
        if (gameState.playerNum !== 0) { 
            gameState.socket.emit('playerRoleRequest', { playerNum: gameState.playerNum });
        }
        gameState.isConnecting = false; // Resetăm flag-ul după conectare
    });

    gameState.socket.on('playerAssigned', (data) => {
        gameState.playerNum = data.playerNum;
        connectionStatusMessage.textContent = data.message;
        console.log(data.message);

        if (gameState.playerNum === 1) {
            gameState.isPlayer1Local = true;
            gameState.isPlayer2Local = false;
            // playerSelectionStatus.textContent = `Ai fost asignat ca Jucătorul 1 (Bulu)!`; // This is specific to selection menu
        } else if (gameState.playerNum === 2) {
            gameState.isPlayer1Local = false;
            gameState.isPlayer2Local = true;
            // playerSelectionStatus.textContent = `Ai fost asignat ca Jucătorul 2 (Wizzee)!`; // This is specific to selection menu
        } else { 
            gameState.isPlayer1Local = false;
            gameState.isPlayer2Local = false;
            gameState.gameRunning = false;
            showGameMessage("Meciul e deja în desfășurare. Mai așteaptă!", 'status', 0);
            connectionStatusMessage.textContent = data.message; 
            gameState.socket.disconnect(); 
            setTimeout(() => { backToMainMenu(); }, 3000); // Revino la meniul principal după un scurt delay
            return; // Important: Ieșim pentru a nu procesa restul evenimentelor
        }
        // playerSelectionMenu.classList.add('hidden'); // This section is handled by chooseMultiplayerRole
    });

    gameState.socket.on('gameStateUpdate', (serverState) => {
        if (!gameState.player1 || !gameState.player2 || !gameState.ball) {
            gameState.player1 = { ...serverState.player1, headImage: buluHeadImage, footImage: buluFootImage, bigHeadImage: buluBigHeadImage, smallHeadImage: buluSmallHeadImage };
            gameState.player2 = { ...serverState.player2, headImage: wizzeeHeadImage, footImage: wizzeeFootImage, bigHeadImage: wizzeeBigHeadImage, smallHeadImage: wizzeeSmallHeadImage };
            gameState.ball = { ...serverState.ball, image: ballImage };
        } else {
            Object.assign(gameState.player1, serverState.player1);
            Object.assign(gameState.player2, serverState.player2);
            Object.assign(gameState.ball, serverState.ball);
        }
        gameState.currentGoalWidth = serverState.currentGoalWidth;
        gameState.currentGoalHeight = serverState.currentGoalHeight;
        gameState.affectedGoalPlayerId = serverState.affectedGoalPlayerId; 

        gameState.powerUp = serverState.powerUp; 
        if (gameState.powerUp) {
            switch (gameState.powerUp.type) {
                case 'luci': gameState.powerUp.image = luciPowerUpImage; break;
                case 'skillOrb': gameState.powerUp.image = skillOrbImage; break;
                case 'bigHead': gameState.powerUp.image = bigHeadImage; break;
                case 'smallHead': gameState.powerUp.image = smallHeadImage; break;
                case 'bigGoal': gameState.powerUp.image = bigGoalImage; break;
                case 'smallGoal': gameState.powerUp.image = smallGoalImage; break;
            }
        }

        gameState.gameRunning = serverState.gameRunning; 
        
        updateScoreUI(); 
    });

    gameState.socket.on('gameStartReady', () => {
        showGameMessage("Meciul poate începe! Apasă orice tastă!", 'status', 0);
        connectionStatusMessage.classList.add('hidden'); 
        const startGameOnKeydown = () => {
            if (gameState.gameMode === 'multiplayer' && gameState.gameRunning) {
                matchStatusDisplay.classList.add('hidden'); 
                window.removeEventListener('keydown', startGameOnKeydown);
            }
        };
        window.addEventListener('keydown', startGameOnKeydown);
    });

    gameState.socket.on('goalScored', (data) => {
        gameState.goalScoredPlayerId = data.player; 
        showGameMessage(`GOOOOOL BAAAAAAAA!`, 'status', GOAL_ANIMATION_DURATION);
        spawnConfetti(CONFETTI_COUNT); 
        
        gameState.gameRunning = false; 
        if (gameState.goalResetTimeout) clearTimeout(gameState.goalResetTimeout); 
        gameState.goalResetTimeout = setTimeout(() => {
            gameState.socket.emit('requestRoundReset'); 
            gameState.goalResetTimeout = null;
            gameState.goalScoredPlayerId = null; 
        }, GOAL_ANIMATION_DURATION + 500); 
    });

    gameState.socket.on('resetGame', () => {
        console.log("Jocul a fost resetat de server.");
        gameState.goalScoredPlayerId = null; 
        gameState.confettiParticles = []; 
    });

    gameState.socket.on('playerDisconnected', () => {
        showGameMessage("Un jucător s-a deconectat. Așteptăm noi jucători...", 'status', 0);
        gameState.gameRunning = false;
        gameState.isConnecting = false; // Permite reconectarea/alegerea altui rol
        // If it's a multiplayer game and a player disconnected, it means the match is no longer valid
        if (gameState.gameMode === 'multiplayer') {
             // Force back to main menu after a short delay
             setTimeout(() => { backToMainMenu(); }, 2000);
        }
    });

    gameState.socket.on('powerUpSpawned', (powerUpData) => {
    });

    gameState.socket.on('powerUpCollected', (data) => {
        switch (data.type) {
            case 'luci':
                showGameMessage(`LUCI POWER! ${data.collectedBy === 'player1' ? 'Bulu' : 'Wizzee'} s-a transformat în Luci!`, 'powerup', LUCI_POWERUP_DURATION);
                break;
            case 'skillOrb':
                showGameMessage(`${data.collectedBy === 'player1' ? 'Bulu' : 'Wizzee'} a obținut Skill Orb! Utilizări: ${data.skillUses}`, 'powerup', 3000);
                break;
            case 'bigHead':
                showGameMessage(`${data.collectedBy === 'player1' ? 'Bulu' : 'Wizzee'} are Cap MARE!`, 'powerup', HEAD_POWERUP_DURATION);
                break;
            case 'smallHead':
                showGameMessage(`${data.collectedBy === 'player1' ? 'Bulu' : 'Wizzee'} are Cap MIC!`, 'powerup', HEAD_POWERUP_DURATION);
                break;
            case 'bigGoal':
                showGameMessage(`Poarta adversarului e MARE!`, 'powerup', GOAL_POWERUP_DURATION);
                break;
            case 'smallGoal':
                showGameMessage(`Poarta adversarului e MICĂ!`, 'powerup', GOAL_POWERUP_DURATION);
                break;
        }
    });

    gameState.socket.on('luciPowerUpEnded', (data) => {
        showGameMessage(`Power-up-ul Luci a expirat pentru ${data.player === 'player1' ? 'Bulu' : 'Wizzee'}!`, 'status', 2000);
    });

    gameState.socket.on('headPowerUpEnded', (data) => {
        showGameMessage(`Capul ${data.player === 'player1' ? 'Bulu' : 'Wizzee'} a revenit la normal!`, 'status', 2000);
    });

    gameState.socket.on('goalPowerUpEnded', (data) => {
        showGameMessage(`Poarta a revenit la normal!`, 'status', 2000);
    });

    gameState.socket.on('powerUpDisappeared', (data) => {
        showGameMessage(`Power-up-ul de tip ${data.type} a dispărut!`, 'status', 2000);
    });

    gameState.socket.on('shootEffect', (data) => {
        console.log(`Jucătorul ${data.player} a șutat!`);
    });

    gameState.socket.on('skillUsed', (data) => {
        console.log(`Jucătorul ${data.player} a folosit skill-ul!`);
        showGameMessage(`${data.player === 'player1' ? 'Bulu' : 'Wizzee'} a folosit un skill! Utilizări rămase: ${data.skillUses}`, 'status', 2000);
    });
    
    gameState.socket.on('noSkillUses', (data) => {
        showGameMessage(`Nu ai utilizări de skill!`, 'status', 1000);
    });

    gameState.socket.on('disconnect', () => {
        connectionStatusMessage.textContent = 'Deconectat de la server.';
        gameState.gameRunning = false;
        gameState.isConnecting = false; // Permite reconectarea/alegerea altui rol
        showGameMessage("Deconectat de la server. Revino la meniu și încearcă din nou.", 'status', 0);
        console.log('Deconectat de la server.');
    });
}

// ---

// 13. Ascultători de Evenimente și Inițializare Joc

function setupMenuListeners() {
    singlePlayerBtn.addEventListener('click', startGameSinglePlayer);
    multiplayerBtn.addEventListener('click', showMultiplayerSelection); 
    selectPlayer1Btn.addEventListener('click', () => chooseMultiplayerRole(1));
    selectPlayer2Btn.addEventListener('click', () => chooseMultiplayerRole(2));
    backToMainMenuFromSelectionBtn.addEventListener('click', backToMainMenu);


    tutorialBtn.addEventListener('click', showTutorial);
    backToMenuBtn.addEventListener('click', backToMainMenu);
    backToMenuFromTutorialBtn.addEventListener('click', backToMainMenu); 
}

window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);

function initApplication() {
    console.log("initApplication started.");
    showSection(mainMenu);
    setupMenuListeners(); 
    const imagesToLoad = [
        luciPowerUpImage, skillOrbImage, bigHeadImage, smallHeadImage, bigGoalImage, smallGoalImage,
        buluHeadImage, buluFootImage, buluBigHeadImage, buluSmallHeadImage, 
        wizzeeHeadImage, wizzeeFootImage, wizzeeBigHeadImage, wizzeeSmallHeadImage, 
        backgroundImage, ballImage 
    ];
    let loadedImagesCount = 0;
    imagesToLoad.forEach(img => {
        img.onload = () => {
            loadedImagesCount++;
            console.log(`Imagine încărcată: ${img.src} (${loadedImagesCount}/${imagesToLoad.length})`);
            if (loadedImagesCount === imagesToLoad.length) {
                console.log("Toate imaginile jucătorilor și power-up-urilor s-au încărcat!");
            }
        };
        img.onerror = () => {
            console.error(`Eroare la încărcarea imaginii: ${img.src}. Asigură-te că fișierul există și calea este corectă.`);
        };
    });

    gameLoop(); 
    console.log("gameLoop started from initApplication.");
}

window.onload = initApplication;
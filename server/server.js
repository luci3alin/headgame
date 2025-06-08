// server/server.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path'); 

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '../public')));

// Starea globală a jocului pe server (sursa de adevăr)
// IMPORTANT: Această stare trebuie să conțină DOAR date serializabile JSON (primitive, obiecte simple, array-uri).
// NU OBIECTE COMPLEXE precum Image sau referințe circulare.
let serverGameState = {
    player1: { x: 100, y: 350, dx: 0, dy: 0, score: 0, isJumping: false, isGrounded: true, canShoot: true, canSkill: true, isLuci: false, luciTimer: 0, isShooting: false, shotStartTime: 0, skillUses: 0, headRadius: 30, originalHeadRadius: 30, hasBigHead: false, hasSmallHead: false, id: null }, // id-ul va fi setat la conectare
    player2: { x: 640, y: 350, dx: 0, dy: 0, score: 0, isJumping: false, isGrounded: true, canShoot: true, canSkill: true, isLuci: false, luciTimer: 0, isShooting: false, shotStartTime: 0, skillUses: 0, headRadius: 30, originalHeadRadius: 30, hasBigHead: false, hasSmallHead: false, id: null }, // id-ul va fi setat la conectare
    ball: { x: 400, y: 200, radius: 15, dx: 0, dy: 0 },
    gameRunning: false, 
    playersConnected: 0,
    player1Id: null, 
    player2Id: null, 
    powerUp: null, 
    powerUpSpawnTimer: 0,
    powerUpInterval: 5000, 
    
    currentGoalWidth: 0, 
    currentGoalHeight: 0,
    affectedGoalPlayerId: null, 
    goalResetTimeout: null 
};

// CONSTANTELE JOCULUI - TREBUIE SĂ FIE SINCROANE CU CELE DIN CLIENT (game.js)!
const GRAVITY = 0.5;
const FRICTION = 0.98; 
const BALL_FRICTION = 0.99;
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

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;

// Dimensiunile imaginilor specificate:
const DEFAULT_HEAD_WIDTH = 60; 
const DEFAULT_HEAD_HEIGHT = 60; 

const DEFAULT_FOOT_WIDTH = 36; 
const DEFAULT_FOOT_HEIGHT = 21; 

// Constante pentru dimensiunile jucătorului, bazate pe imagini
const PLAYER_HEAD_COLLISION_RADIUS = 30; // Raza capului pentru coliziune (fixă)
const PLAYER_GAP_HEAD_FOOT = PLAYER_HEAD_COLLISION_RADIUS * 0.5; // Spațiul dintre cap și picior

const PLAYER_WIDTH = DEFAULT_HEAD_WIDTH; 
const PLAYER_HEIGHT = DEFAULT_HEAD_HEIGHT + PLAYER_GAP_HEAD_FOOT + DEFAULT_FOOT_HEIGHT; 

const HEAD_SIZE_FACTOR_LARGE = 1.5; 
const HEAD_SIZE_FACTOR_SMALL = 0.5; 
const HEAD_POWERUP_DURATION = 10000; 

const GOAL_SIZE_FACTOR_LARGE = 1.5; 
const GOAL_SIZE_FACTOR_SMALL = 0.5; 
const GOAL_POWERUP_DURATION = 8000; 

const POWERUP_DISAPPEAR_DURATION = 3000; 
const POWERUP_LANDING_Y = 370; 

const GOAL_ANIMATION_DURATION = 2000; 

/**
 * Curăță obiectul serverGameState pentru a fi trimis în siguranță clientului.
 * Creează o copie a stării jocului și exclude/ajustează proprietățile
 * care nu sunt serializabile JSON sau care nu sunt necesare clientului direct de la server.
 * @returns {object} O copie a stării jocului cu proprietăți curate.
 */
function getCleanGameStateForClient() {
    // Folosim o abordare mai sigură de "deep copy" pentru a evita problemele de referințe circulare
    // și pentru a ne asigura că trimitem doar date simple.
    // De asemenea, vom crea manual structura pentru playeri.
    const cleanState = {
        player1: {
            x: serverGameState.player1.x,
            y: serverGameState.player1.y,
            dx: serverGameState.player1.dx,
            dy: serverGameState.player1.dy,
            score: serverGameState.player1.score,
            isJumping: serverGameState.player1.isJumping,
            isGrounded: serverGameState.player1.isGrounded,
            canShoot: serverGameState.player1.canShoot,
            canSkill: serverGameState.player1.canSkill,
            isLuci: serverGameState.player1.isLuci,
            luciTimer: serverGameState.player1.luciTimer,
            isShooting: serverGameState.player1.isShooting,
            shotStartTime: serverGameState.player1.shotStartTime,
            skillUses: serverGameState.player1.skillUses,
            headRadius: serverGameState.player1.headRadius,
            originalHeadRadius: serverGameState.player1.originalHeadRadius,
            hasBigHead: serverGameState.player1.hasBigHead,
            hasSmallHead: serverGameState.player1.hasSmallHead,
            id: serverGameState.player1Id // Trimitem socket ID ca string
        },
        player2: {
            x: serverGameState.player2.x,
            y: serverGameState.player2.y,
            dx: serverGameState.player2.dx,
            dy: serverGameState.player2.dy,
            score: serverGameState.player2.score,
            isJumping: serverGameState.player2.isJumping,
            isGrounded: serverGameState.player2.isGrounded,
            canShoot: serverGameState.player2.canShoot,
            canSkill: serverGameState.player2.canSkill,
            isLuci: serverGameState.player2.isLuci,
            luciTimer: serverGameState.player2.luciTimer,
            isShooting: serverGameState.player2.isShooting,
            shotStartTime: serverGameState.player2.shotStartTime,
            skillUses: serverGameState.player2.skillUses,
            headRadius: serverGameState.player2.headRadius,
            originalHeadRadius: serverGameState.player2.originalHeadRadius,
            hasBigHead: serverGameState.player2.hasBigHead,
            hasSmallHead: serverGameState.player2.hasSmallHead,
            id: serverGameState.player2Id // Trimitem socket ID ca string
        },
        ball: {
            x: serverGameState.ball.x,
            y: serverGameState.ball.y,
            radius: serverGameState.ball.radius,
            dx: serverGameState.ball.dx,
            dy: serverGameState.ball.dy
        },
        gameRunning: serverGameState.gameRunning,
        playersConnected: serverGameState.playersConnected,
        player1Id: serverGameState.player1Id,
        player2Id: serverGameState.player2Id,
        powerUp: serverGameState.powerUp ? { ...serverGameState.powerUp } : null, // Copiem powerUp dacă există
        powerUpSpawnTimer: serverGameState.powerUpSpawnTimer,
        powerUpInterval: serverGameState.powerUpInterval,
        currentGoalWidth: serverGameState.currentGoalWidth,
        currentGoalHeight: serverGameState.currentGoalHeight,
        affectedGoalPlayerId: serverGameState.affectedGoalPlayerId,
        goalResetTimeout: serverGameState.goalResetTimeout ? true : false // Trimitem doar un flag boolean
    };

    return cleanState;
}


// --- FUNCȚIILE LOGICII JOCULUI PE SERVER (DEFINITE ÎNAINTE DE A FI APELATE) ---
// Toate funcțiile helper și logica de joc sunt definite aici, pentru a fi disponibile.

function updatePlayerPhysicsServer(player) {
    player.dy += GRAVITY;
    player.x += player.dx;
    player.y += player.dy;
    
    // player.y este vârful capului. Pentru coliziunea cu solul, avem nevoie de baza piciorului.
    const playerBottomY = player.y + PLAYER_HEIGHT;

    if (playerBottomY >= CANVAS_HEIGHT) {
        player.y = CANVAS_HEIGHT - PLAYER_HEIGHT; 
        player.dy = 0;
        player.isJumping = false;
        player.isGrounded = true; 
    } else {
        player.isGrounded = false; 
    }

    // Fricțiunea pe orizontală este eliminată
    // player.dx va fi setat la 0 direct de la input (stopMove)
    if (player.x < 0) {
        player.x = 0; player.dx = 0;
    } else if (player.x + PLAYER_WIDTH > CANVAS_WIDTH) { 
        player.x = CANVAS_WIDTH - PLAYER_WIDTH; player.dx = 0;
    }
}

function updateBallPhysicsServer() {
    serverGameState.ball.dy += GRAVITY;
    serverGameState.ball.x += serverGameState.ball.dx;
    serverGameState.ball.y += serverGameState.ball.dy;
    serverGameState.ball.dx *= BALL_FRICTION; 
    serverGameState.ball.dy *= BALL_FRICTION; 

    if (serverGameState.ball.x - serverGameState.ball.radius < 0) {
        serverGameState.ball.x = serverGameState.ball.radius; serverGameState.ball.dx *= -1;
    }
    if (serverGameState.ball.x + serverGameState.ball.radius > CANVAS_WIDTH) {
        serverGameState.ball.x = CANVAS_WIDTH - serverGameState.ball.radius; serverGameState.ball.dx *= -1;
    }
    if (serverGameState.ball.y - serverGameState.ball.radius < 0) {
        serverGameState.ball.y = serverGameState.ball.radius; serverGameState.ball.dy *= -1;
    }
    if (serverGameState.ball.y + serverGameState.ball.radius > CANVAS_HEIGHT) {
        serverGameState.ball.y = CANVAS_HEIGHT - serverGameState.ball.radius; serverGameState.ball.dy *= -0.7; serverGameState.ball.dx *= 0.8;
    }
}

function checkCircleCollisionServer(circle1, circle2) {
    const dx = circle1.x - circle2.x;
    const dy = circle1.y - circle2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < circle1.radius + circle2.radius;
}

// Funcție ajutătoare pentru coliziunea dreptunghi-cerc (pentru picior și minge)
function checkRectCircleCollisionServer(rectX, rectY, rectWidth, rectHeight, circleX, circleY, circleRadius) {
    const closestX = Math.max(rectX, Math.min(circleX, rectX + rectWidth));
    const closestY = Math.max(rectY, Math.min(circleY, rectY + rectHeight));

    const dx = circleX - closestX;
    const dy = circleY - closestY;
    const distanceSquared = (dx * dx) + (dy * dy);

    return distanceSquared < (circleRadius * circleRadius);
}


function handlePlayerPlayerCollisionServer(player1, player2) {
    if (!player1 || !player2) return;

    const rect1 = {
        x: player1.x,
        y: player1.y,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT
    };
    const rect2 = {
        x: player2.x,
        y: player2.y,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT
    };

    if (rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y) {
        
        // Coliziune verticală (săritură peste)
        // Dacă jucătorul 1 (care cade) este deasupra jucătorului 2
        if (player1.dy > 0 && rect1.y + rect1.height - player1.dy < rect2.y) { 
            player1.y = rect2.y - PLAYER_HEIGHT; 
            player1.dy = 0;
            player1.isGrounded = true; 
        } 
        // Dacă jucătorul 2 (care cade) este deasupra jucătorului 1
        else if (player2.dy > 0 && rect2.y + rect2.height - player2.dy < rect1.y) {
            player2.y = rect1.y - PLAYER_HEIGHT;
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


function handlePlayerBallCollisionServer(player, ball) {
    const playerHeadCenterX = player.x + PLAYER_WIDTH / 2;
    const playerHeadCenterY = player.y + player.headRadius; 

    // Folosim player.headRadius care se scalează cu power-up-urile
    if (checkCircleCollisionServer(
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

function checkGoalsServer() {
    const ball = serverGameState.ball;
    const goalLineY = CANVAS_HEIGHT - serverGameState.currentGoalHeight; 

    if (ball.x - ball.radius < serverGameState.currentGoalWidth && ball.y > goalLineY) {
        serverGameState.player2.score++;
        io.emit('goalScored', { player: 'player2', score: serverGameState.player2.score });
        serverGameState.gameRunning = false; // Îngheață jocul pe server pentru animația de gol
    }

    if (ball.x + ball.radius > CANVAS_WIDTH - serverGameState.currentGoalWidth && ball.y > goalLineY) {
        serverGameState.player1.score++;
        io.emit('goalScored', { player: 'player1', score: serverGameState.player1.score });
        serverGameState.gameRunning = false; // Îngheață jocul pe server pentru animația de gol
    }
}

function resetServerRound() {
    // Resetăm starea jucătorilor și a mingii la pozițiile inițiale
    serverGameState.player1.x = 100; serverGameState.player1.y = CANVAS_HEIGHT - PLAYER_HEIGHT; serverGameState.player1.dx = 0; serverGameState.player1.dy = 0; serverGameState.player1.isJumping = false; serverGameState.player1.isGrounded = true; serverGameState.player1.isShooting = false; serverGameState.player1.canShoot = true; serverGameState.player1.canSkill = true; serverGameState.player1.skillUses = 0; 
    serverGameState.player1.headRadius = serverGameState.player1.originalHeadRadius; // Resetăm raza capului
    serverGameState.player1.hasBigHead = false; serverGameState.player1.hasSmallHead = false;
    serverGameState.player1.shotStartTime = 0; 

    if (serverGameState.player1.isLuci) { endServerLuciPowerUp(serverGameState.player1); }

    serverGameState.player2.x = CANVAS_WIDTH - 160; serverGameState.player2.y = CANVAS_HEIGHT - PLAYER_HEIGHT; serverGameState.player2.dx = 0; serverGameState.player2.dy = 0; serverGameState.player2.isJumping = false; serverGameState.player2.isGrounded = true; serverGameState.player2.isShooting = false; serverGameState.player2.canShoot = true; serverGameState.player2.canSkill = true; serverGameState.player2.skillUses = 0; 
    serverGameState.player2.headRadius = serverGameState.player2.originalHeadRadius; // Resetăm raza capului
    serverGameState.player2.hasBigHead = false; serverGameState.player2.hasSmallHead = false;
    serverGameState.player2.shotStartTime = 0; 
    if (serverGameState.player2.isLuci) { endServerLuciPowerUp(serverGameState.player2); }

    serverGameState.ball.x = CANVAS_WIDTH / 2; serverGameState.ball.y = CANVAS_HEIGHT / 2; serverGameState.ball.dx = 0; serverGameState.ball.dy = 0;
    serverGameState.powerUp = null;
    serverGameState.powerUpSpawnTimer = 0;

    serverGameState.currentGoalWidth = GOAL_BASE_WIDTH;
    serverGameState.currentGoalHeight = GOAL_BASE_HEIGHT;
    serverGameState.affectedGoalPlayerId = null; 
    
    io.emit('resetGame'); 
    serverGameState.gameRunning = true; // Permitem jocului să ruleze din nou
}

function handlePowerUpServer() {
    if (serverGameState.powerUp) {
        if (typeof serverGameState.powerUp.dy === 'undefined') { serverGameState.powerUp.dy = 0; }
        serverGameState.powerUp.dy += GRAVITY * 0.2; 
        serverGameState.powerUp.y += serverGameState.powerUp.dy;

        if (serverGameState.powerUp.y + serverGameState.powerUp.size > POWERUP_LANDING_Y) { 
            serverGameState.powerUp.y = POWERUP_LANDING_Y - serverGameState.powerUp.size;
            serverGameState.powerUp.dy = 0;
            if (!serverGameState.powerUp.groundedTimer) {
                serverGameState.powerUp.groundedTimer = Date.now();
            }
        }
    }

    if (serverGameState.powerUp && serverGameState.powerUp.groundedTimer) {
        if (Date.now() - serverGameState.powerUp.groundedTimer > POWERUP_DISAPPEAR_DURATION) {
            io.emit('powerUpDisappeared', { type: serverGameState.powerUp.type }); 
            serverGameState.powerUp = null;
            serverGameState.powerUpSpawnTimer = 0; 
            return; 
        }
    }

    if (!serverGameState.powerUp && serverGameState.gameRunning) { 
        serverGameState.powerUpSpawnTimer += (1000 / 60);

        if (serverGameState.powerUpSpawnTimer >= serverGameState.powerUpInterval) {
            const size = 40;
            const powerUpTypes = ['luci', 'skillOrb', 'bigHead', 'smallHead', 'bigGoal', 'smallGoal']; 
            const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];

            serverGameState.powerUp = {
                x: Math.random() * (CANVAS_WIDTH - size),
                y: -size, 
                size: size,
                type: randomType, 
                dy: 0 
            };
            io.emit('powerUpSpawned', serverGameState.powerUp); 
            serverGameState.powerUpSpawnTimer = 0;
        }
    }

    if (serverGameState.powerUp) { 
        const players = [serverGameState.player1, serverGameState.player2];
        for (const player of players) {
             if (player.x < serverGameState.powerUp.x + serverGameState.powerUp.size &&
                player.x + PLAYER_WIDTH > serverGameState.powerUp.x &&
                player.y < serverGameState.powerUp.y + serverGameState.powerUp.size &&
                player.y + PLAYER_HEIGHT > serverGameState.powerUp.y) {

                switch (serverGameState.powerUp.type) {
                    case 'luci':
                        activateServerLuciPowerUp(player);
                        io.emit('powerUpCollected', { collectedBy: player === serverGameState.player1 ? 'player1' : 'player2', type: 'luci' });
                        break;
                    case 'skillOrb':
                        player.skillUses += 3; 
                        io.emit('powerUpCollected', { collectedBy: player === serverGameState.player1 ? 'player1' : 'player2', type: 'skillOrb', skillUses: player.skillUses });
                        break;
                    case 'bigHead':
                        activateServerHeadPowerUp(player, 'big');
                        io.emit('powerUpCollected', { collectedBy: player === serverGameState.player1 ? 'player1' : 'player2', type: 'bigHead' });
                        break;
                    case 'smallHead':
                        activateServerHeadPowerUp(player, 'small');
                        io.emit('powerUpCollected', { collectedBy: player === serverGameState.player1 ? 'player1' : 'player2', type: 'smallHead' });
                        break;
                    case 'bigGoal':
                        const collectorPlayerSocketIdBig = (player.id === serverGameState.player1Id) ? serverGameState.player1Id : serverGameState.player2Id; 
                        activateServerGoalPowerUp(collectorPlayerSocketIdBig, 'big'); 
                        io.emit('powerUpCollected', { collectedBy: player === serverGameState.player1 ? 'player1' : 'player2', type: 'bigGoal' });
                        break;
                    case 'smallGoal':
                        const collectorPlayerSocketIdSmall = (player.id === serverGameState.player1Id) ? serverGameState.player1Id : serverGameState.player2Id;
                        activateServerGoalPowerUp(collectorPlayerSocketIdSmall, 'small');
                        io.emit('powerUpCollected', { collectedBy: player === serverGameState.player1 ? 'player1' : 'player2', type: 'smallGoal' });
                        break;
                }
                serverGameState.powerUp = null; 
                serverGameState.powerUpSpawnTimer = 0; 
                break;
            }
        }
    }
}

function activateServerLuciPowerUp(player, type) { 
    if (player.isLuci) return; 

    player.isLuci = true;
    player.luciTimer = LUCI_POWERUP_DURATION;
    setTimeout(() => { endServerLuciPowerUp(player); }, LUCI_POWERUP_DURATION);
}

function endServerLuciPowerUp(player) {
    if (!player.isLuci) return;

    player.isLuci = false;
    player.luciTimer = 0;
    io.emit('luciPowerUpEnded', { player: player === serverGameState.player1 ? 'player1' : 'player2' });
}

function activateServerHeadPowerUp(player, type) {
    if (player.hasBigHead || player.hasSmallHead) {
        endServerHeadPowerUp(player); 
    }

    if (type === 'big') {
        player.headRadius = player.originalHeadRadius * HEAD_SIZE_FACTOR_LARGE;
        player.hasBigHead = true;
    } else if (type === 'small') {
        player.headRadius = player.originalHeadRadius * HEAD_SIZE_FACTOR_SMALL;
        player.hasSmallHead = true;
    }

    setTimeout(() => {
        endServerHeadPowerUp(player);
    }, HEAD_POWERUP_DURATION);
}

function endServerHeadPowerUp(player) { 
    player.headRadius = player.originalHeadRadius; 
    player.hasBigHead = false;
    player.hasSmallHead = false;
    io.emit('headPowerUpEnded', { player: player === serverGameState.player1 ? 'player1' : 'player2' });
}

function activateServerGoalPowerUp(collectorPlayerSocketId, type) {
    let affectedPlayerSocketId = null;
    if (collectorPlayerSocketId === serverGameState.player1Id) {
        affectedPlayerSocketId = serverGameState.player2Id; 
    } else if (collectorPlayerSocketId === serverGameState.player2Id) {
        affectedPlayerSocketId = serverGameState.player1Id; 
    } else {
        console.error("activateServerGoalPowerUp: Collector ID not found or invalid.");
        return;
    }

    let goalWidthMultiplier = 1;
    let goalHeightMultiplier = 1;

    if (type === 'big') {
        goalWidthMultiplier = GOAL_SIZE_FACTOR_LARGE;
        goalHeightMultiplier = GOAL_SIZE_FACTOR_LARGE;
    } else if (type === 'small') {
        goalWidthMultiplier = GOAL_SIZE_FACTOR_SMALL;
        goalHeightMultiplier = GOAL_SIZE_FACTOR_SMALL;
    }

    serverGameState.currentGoalWidth = GOAL_BASE_WIDTH * goalWidthMultiplier;
    serverGameState.currentGoalHeight = GOAL_BASE_HEIGHT * goalHeightMultiplier;
    serverGameState.affectedGoalPlayerId = affectedPlayerSocketId; 

    setTimeout(() => {
        endServerGoalPowerUp(type);
    }, GOAL_POWERUP_DURATION);
}


function endServerGoalPowerUp(type) { 
    serverGameState.currentGoalWidth = GOAL_BASE_WIDTH;
    serverGameState.currentGoalHeight = GOAL_BASE_HEIGHT;
    serverGameState.affectedGoalPlayerId = null; 
    io.emit('goalPowerUpEnded', { type: type });
}

function updateLuciPowerUpTimersServer() {
    const players = [serverGameState.player1, serverGameState.player2];
    players.forEach(player => {
        if (player.isLuci) {
            player.luciTimer -= (1000 / 60); 
            if (player.luciTimer <= 0) {
                endServerLuciPowerUp(player);
            }
        }
    });
}

function shootServer(player) {
    if (!player.canShoot) return;

    const playerHeadCollisionRadius = player.headRadius; 
    const currentHeadVisualHeight = DEFAULT_HEAD_HEIGHT * (player.hasBigHead ? HEAD_SIZE_FACTOR_LARGE : player.hasSmallHead ? HEAD_SIZE_FACTOR_SMALL : 1);
    
    const footBaseY = player.y + currentHeadVisualHeight + PLAYER_GAP_HEAD_FOOT; 
    
    let animatedFootX = player.x + PLAYER_WIDTH / 2 - DEFAULT_FOOT_WIDTH / 2;
    let animatedFootY = footBaseY;

    const kickDuration = PLAYER_SHOOT_COOLDOWN; 
    const animationProgress = (Date.now() - player.shotStartTime) / kickDuration;
    const clampedProgress = Math.min(1, Math.max(0, animationProgress));

    const maxArcHeight = currentHeadVisualHeight * 0.8; 
    const maxArcLateral = PLAYER_WIDTH * 0.7; 

    const effectiveDirection = (player.x < serverGameState.ball.x) ? 1 : -1; 

    const arcYOffset = Math.sin(clampedProgress * Math.PI) * maxArcHeight;
    const arcXOffset = Math.sin(clampedProgress * Math.PI) * maxArcLateral * effectiveDirection;

    animatedFootX = player.x + PLAYER_WIDTH / 2 - DEFAULT_FOOT_WIDTH / 2 + arcXOffset;
    animatedFootY = (player.y + currentHeadVisualHeight) - arcYOffset; 

    if (checkRectCircleCollisionServer(animatedFootX, animatedFootY, DEFAULT_FOOT_WIDTH, DEFAULT_FOOT_HEIGHT, serverGameState.ball.x, serverGameState.ball.y, serverGameState.ball.radius)) { 
        
        player.canShoot = false;
        player.isShooting = true; 
        player.shotStartTime = Date.now(); 
        io.emit('shootEffect', { player: player === serverGameState.player1 ? 'player1' : 'player2' }); 

        setTimeout(() => { 
            player.canShoot = true; 
            player.isShooting = false; 
            player.shotStartTime = 0; 
        }, PLAYER_SHOOT_COOLDOWN);

        let shootForceX = PLAYER_SHOOT_FORCE_X;
        let shootForceY = PLAYER_SHOOT_FORCE_Y; 
        if (player.isLuci) {
            shootForceX *= LUCI_SKILL_BOOST;
            shootForceY *= LUCI_SKILL_BOOST;
        }

        const direction = (player === serverGameState.player1) ? 1 : -1;

        serverGameState.ball.dx = direction * shootForceX;
        serverGameState.ball.dy = shootForceY;

        serverGameState.ball.x = animatedFootX + DEFAULT_FOOT_WIDTH / 2 + direction * (DEFAULT_FOOT_WIDTH / 2 + serverGameState.ball.radius + 5);
        serverGameState.ball.y = animatedFootY + DEFAULT_FOOT_HEIGHT / 2 - serverGameState.ball.radius;
    } else {
        console.log("Server: Mingea nu e în zona piciorului pentru șut valid. Shot not applied.");
    }
}

function useSkillServer(player) {
    if (!player.canSkill) return;

    if (player.skillUses <= 0) {
        console.log("Server: Player has no skill uses.");
        io.emit('noSkillUses', { player: player === serverGameState.player1 ? 'player1' : 'player2' }); 
        return;
    }

    const playerHeadCollisionRadius = player.headRadius;
    const currentHeadVisualHeight = DEFAULT_HEAD_HEIGHT * (player.hasBigHead ? HEAD_SIZE_FACTOR_LARGE : player.hasSmallHead ? HEAD_SIZE_FACTOR_SMALL : 1);
    
    const footBaseY = player.y + currentHeadVisualHeight + PLAYER_GAP_HEAD_FOOT; 
    
    let animatedFootX = player.x + PLAYER_WIDTH / 2 - DEFAULT_FOOT_WIDTH / 2;
    let animatedFootY = footBaseY;

    const kickDuration = PLAYER_SKILL_COOLDOWN; 
    const animationProgress = (Date.now() - player.shotStartTime) / kickDuration;
    const clampedProgress = Math.min(1, Math.max(0, animationProgress));

    const maxArcHeight = currentHeadVisualHeight * 0.8; 
    const maxArcLateral = PLAYER_WIDTH * 0.7; 

    const effectiveDirection = (player.x < serverGameState.ball.x) ? 1 : -1; 

    const arcYOffset = Math.sin(clampedProgress * Math.PI) * maxArcHeight;
    const arcXOffset = Math.sin(clampedProgress * Math.PI) * maxArcLateral * effectiveDirection;

    animatedFootX = player.x + PLAYER_WIDTH / 2 - DEFAULT_FOOT_WIDTH / 2 + arcXOffset;
    animatedFootY = (player.y + currentHeadVisualHeight) - arcYOffset; 

    if (checkRectCircleCollisionServer(animatedFootX, animatedFootY, DEFAULT_FOOT_WIDTH, DEFAULT_FOOT_HEIGHT, serverGameState.ball.x, serverGameState.ball.y, serverGameState.ball.radius)) { 

        player.canSkill = false;
        player.isShooting = true; 
        player.shotStartTime = Date.now(); 
        setTimeout(() => { 
            player.canSkill = true; 
            player.isShooting = false; 
            player.shotStartTime = 0; 
        }, PLAYER_SKILL_COOLDOWN); 

        player.skillUses--; 

        if (player === serverGameState.player1) { 
            if (serverGameState.ball) {
                const directionToBall = serverGameState.ball.x - player.x;
                serverGameState.ball.dx += Math.sign(directionToBall) * 15;
                serverGameState.ball.dy -= 10;
            }
        } else if (player === serverGameState.player2) { 
            if (serverGameState.ball) {
                serverGameState.ball.originalDx = serverGameState.ball.dx;
                serverGameState.ball.originalDy = serverGameState.ball.dy;
                serverGameState.ball.dx *= 0.3;
                serverGameState.ball.dy *= 0.3;
                setTimeout(() => {
                    if (serverGameState.ball) {
                        serverGameState.ball.dx = serverGameState.ball.originalDx;
                        serverGameState.ball.dy = serverGameState.ball.originalDy;
                    }
                }, 1000);
            }
        }
        io.emit('skillUsed', { player: player === serverGameState.player1 ? 'player1' : 'player2', skillUses: player.skillUses }); 
    } else {
        console.log("Server: Mingea nu e în zona piciorului pentru skill valid. Skill not applied.");
        io.emit('noSkillUses', { player: player === serverGameState.player1 ? 'player1' : 'player2', message: "Skill ratat! Mingea nu era în zonă!" });
    }
}


// --- BUCLA PRINCIPALĂ A JOCULUI PE SERVER ---
function serverGameLoop() {
    // Jocul rulează chiar dacă a fost marcat un gol pentru animație
    if (!serverGameState.gameRunning && !serverGameState.goalResetTimeout && serverGameState.playersConnected < 2) { 
        return;
    }
    
    // Doar actualizăm fizica dacă jocul este "activ" (nu în timpul animației de gol)
    if (serverGameState.gameRunning) {
        updatePlayerPhysicsServer(serverGameState.player1);
        updatePlayerPhysicsServer(serverGameState.player2);
        updateBallPhysicsServer();

        handlePlayerPlayerCollisionServer(serverGameState.player1, serverGameState.player2); 
        handlePlayerBallCollisionServer(serverGameState.player1, serverGameState.ball);
        handlePlayerBallCollisionServer(serverGameState.player2, serverGameState.ball);

        checkGoalsServer();

        handlePowerUpServer();
        updateLuciPowerUpTimersServer(); 
    }

    // Trimitem întotdeauna starea jocului, indiferent dacă fizica este activă sau nu,
    // pentru a menține randarea pe client.
    io.emit('gameStateUpdate', getCleanGameStateForClient());
}

// Apelul setInterval care pornește gameLoop-ul.
setInterval(serverGameLoop, 1000 / 60);

// --- GESTIONAREA CONEXIUNILOR SOCKET.IO ---
io.on('connection', (socket) => {
    console.log('Un utilizator s-a conectat:', socket.id);

    // Inițializarea stării jucătorilor la conectare (reset power-ups, scores)
    // Această logică se întâmplă doar o dată, la prima conectare a unui jucător
    // (sau la reconectare dacă player1Id/player2Id este null)
    // Mutăm această logică mai sus pentru a ne asigura că se execută la fiecare conectare inițială
    // și resetăm complet starea pentru noii jucători dacă nu există deja un meci.
    if (serverGameState.playersConnected === 0) { // Doar dacă nu e nimeni conectat
        serverGameState.player1.headRadius = serverGameState.player1.originalHeadRadius;
        serverGameState.player2.headRadius = serverGameState.player2.originalHeadRadius;
        serverGameState.currentGoalWidth = GOAL_BASE_WIDTH;
        serverGameState.currentGoalHeight = GOAL_BASE_HEIGHT;
        serverGameState.affectedGoalPlayerId = null;
        serverGameState.player1.score = 0; 
        serverGameState.player2.score = 0;
        if (serverGameState.goalResetTimeout) clearTimeout(serverGameState.goalResetTimeout);
        serverGameState.goalResetTimeout = null;
        console.log('Primul jucător se conectează. Stare joc resetată.');
    }


    socket.on('playerRoleRequest', (data) => {
        const requestedPlayerNum = data.playerNum;

        // Verifică dacă acest socket este deja asignat
        if (socket.id === serverGameState.player1Id) {
            socket.emit('playerAssigned', { playerNum: 1, message: 'Ești deja Jucătorul 1 (Bulu)!' });
            console.log('Jucătorul 1 re-cere rolul:', socket.id);
            return;
        }
        if (socket.id === serverGameState.player2Id) {
            socket.emit('playerAssigned', { playerNum: 2, message: 'Ești deja Jucătorul 2 (Wizzee)!' });
            console.log('Jucătorul 2 re-cere rolul:', socket.id);
            return;
        }

        if (requestedPlayerNum === 1) {
            if (!serverGameState.player1Id) {
                serverGameState.player1Id = socket.id;
                // Asigurăm că ID-ul este setat și pe obiectul jucătorului
                serverGameState.player1.id = socket.id; 
                serverGameState.playersConnected++;
                socket.emit('playerAssigned', { playerNum: 1, message: 'Ești Jucătorul 1 (Bulu)! Așteptăm Jucătorul 2...' });
                console.log('Jucătorul 1 conectat:', socket.id);
            } else {
                socket.emit('playerAssigned', { playerNum: 0, message: 'Jucătorul 1 este deja ocupat. Încearcă Jucătorul 2!' });
                console.log('Jucătorul 1 deja ocupat pentru:', socket.id);
            }
        } else if (requestedPlayerNum === 2) {
            if (!serverGameState.player2Id) {
                serverGameState.player2Id = socket.id;
                // Asigurăm că ID-ul este setat și pe obiectul jucătorului
                serverGameState.player2.id = socket.id; 
                serverGameState.playersConnected++;
                socket.emit('playerAssigned', { playerNum: 2, message: 'Ești Jucătorul 2 (Wizzee)! Așteptăm Jucătorul 1...' });
                console.log('Jucătorul 2 conectat:', socket.id);
            } else {
                socket.emit('playerAssigned', { playerNum: 0, message: 'Jucătorul 2 este deja ocupat. Încearcă Jucătorul 1!' });
                console.log('Jucătorul 2 deja ocupat pentru:', socket.id);
            }
        } else {
            socket.emit('playerAssigned', { playerNum: 0, message: 'Rol invalid. Alege 1 sau 2.' });
            console.log('Cerere rol invalidă:', data.playerNum, 'de la', socket.id);
        }

        if (serverGameState.playersConnected === 2 && !serverGameState.gameRunning) {
            io.emit('gameStartReady'); 
            serverGameState.gameRunning = true; 
            console.log('Meciul poate începe!');
        }
    });

    // Trimitem starea inițială a jocului către noul client conectat
    socket.emit('gameStateUpdate', getCleanGameStateForClient());

    socket.on('requestRoundReset', () => {
        if (serverGameState.playersConnected === 2 && !serverGameState.goalResetTimeout) {
            serverGameState.gameRunning = false; 
            serverGameState.goalResetTimeout = setTimeout(() => { 
                resetServerRound();
                serverGameState.goalResetTimeout = null;
            }, GOAL_ANIMATION_DURATION); 
        }
    });


    socket.on('playerInput', (input) => {
        let playerToUpdate;
        if (input.playerNum === 1 && socket.id === serverGameState.player1Id) {
            playerToUpdate = serverGameState.player1;
        } else if (input.playerNum === 2 && socket.id === serverGameState.player2Id) {
            playerToUpdate = serverGameState.player2;
        }

        if (playerToUpdate && serverGameState.gameRunning) { 
            if (input.type === 'move') {
                let currentMoveSpeed = PLAYER_MOVE_SPEED;
                if (playerToUpdate.isLuci) currentMoveSpeed *= LUCI_SKILL_BOOST;
                if (input.key === 'a' || input.key === 'arrowleft') {
                    playerToUpdate.dx = -currentMoveSpeed;
                } else if (input.key === 'd' || input.key === 'arrowright') {
                    playerToUpdate.dx = currentMoveSpeed;
                }
            } else if (input.type === 'jump') {
                let currentJumpForce = PLAYER_JUMP_FORCE;
                if (playerToUpdate.isLuci) currentJumpForce *= LUCI_SKILL_BOOST;
                if (playerToUpdate.isGrounded) { 
                    playerToUpdate.dy = currentJumpForce;
                    playerToUpdate.isJumping = true;
                    playerToUpdate.isGrounded = false; 
                }
            } else if (input.type === 'stopMove') {
                playerToUpdate.dx = 0; 
            } else if (input.type === 'shoot') {
                shootServer(playerToUpdate);
            } else if (input.type === 'skill') {
                useSkillServer(playerToUpdate);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('Un utilizator s-a deconectat:', socket.id);
        
        // Verificăm dacă socket.id-ul care se deconectează corespunde unui jucător.
        // Apoi setăm acel slot ca liber.
        let wasPlayer = false;
        if (socket.id === serverGameState.player1Id) {
            serverGameState.player1Id = null;
            serverGameState.player1.id = null; // Asigură că și obiectul jucătorului are ID-ul curățat
            serverGameState.playersConnected--;
            wasPlayer = true;
            console.log('Jucătorul 1 deconectat.');
        } else if (socket.id === serverGameState.player2Id) {
            serverGameState.player2Id = null;
            serverGameState.player2.id = null; // Asigură că și obiectul jucătorului are ID-ul curățat
            serverGameState.playersConnected--;
            wasPlayer = true;
            console.log('Jucătorul 2 deconectat.');
        }

        if (wasPlayer) {
            if (serverGameState.playersConnected < 2) {
                serverGameState.gameRunning = false; 
                io.emit('playerDisconnected'); 
                console.log('Jocul oprit, așteaptă jucători noi...');
                // Resetăm runda pentru a curăța terenul dacă un jucător pleacă dintr-un meci activ
                resetServerRound(); 
            }
        }
        
        // Dacă toți jucătorii sunt deconectați, facem o resetare completă a stării globale
        // pentru a asigura un start curat pentru următorii jucători.
        if (serverGameState.playersConnected <= 0) {
            console.log('Toți jucătorii deconectați. Resetare completă server game state.');
            // Re-inițializăm serverGameState la valorile sale inițiale, inclusiv scorurile
            serverGameState = {
                player1: { x: 100, y: CANVAS_HEIGHT - PLAYER_HEIGHT, dx: 0, dy: 0, score: 0, isJumping: false, isGrounded: true, canShoot: true, canSkill: true, isLuci: false, luciTimer: 0, isShooting: false, shotStartTime: 0, skillUses: 0, headRadius: PLAYER_HEAD_COLLISION_RADIUS, originalHeadRadius: PLAYER_HEAD_COLLISION_RADIUS, hasBigHead: false, hasSmallHead: false, id: null }, 
                player2: { x: 640, y: CANVAS_HEIGHT - PLAYER_HEIGHT, dx: 0, dy: 0, score: 0, isJumping: false, isGrounded: true, canShoot: true, canSkill: true, isLuci: false, luciTimer: 0, isShooting: false, shotStartTime: 0, skillUses: 0, headRadius: PLAYER_HEAD_COLLISION_RADIUS, originalHeadRadius: PLAYER_HEAD_COLLISION_RADIUS, hasBigHead: false, hasSmallHead: false, id: null }, 
                ball: { x: 400, y: 200, radius: 15, dx: 0, dy: 0 },
                gameRunning: false, 
                playersConnected: 0,
                player1Id: null, 
                player2Id: null, 
                powerUp: null, 
                powerUpSpawnTimer: 0,
                powerUpInterval: 5000, 
                
                currentGoalWidth: 0, 
                currentGoalHeight: 0,
                affectedGoalPlayerId: null, 
                goalResetTimeout: null 
            };
        }
    });
});

server.listen(PORT, () => {
    console.log(`Serverul rulează pe portul ${PORT}`);
});
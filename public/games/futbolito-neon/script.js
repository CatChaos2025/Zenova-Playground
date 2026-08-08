// ===== Elementos del DOM =====
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

// ===== Configuración =====
const GOAL_WIDTH = 120;
const PLAYER_RADIUS = 22;
const BALL_RADIUS = 10;
const FRICTION = 0.985;
const BALL_FRICTION = 0.992;
const MAX_PLAYER_SPEED = 8;
const MATCH_TIME = 90; // segundos

// ===== Estado del juego =====
let isPlaying = false;
let animationId = null;
let timeLeft = MATCH_TIME;
let timerInterval = null;
let scorePlayer = 0;
let scoreCpu = 0;
let goalAnimation = 0; // frames de animación tras gol
let goalScorer = '';   // 'player' | 'cpu'

// Entidades
const player = { x: W / 2, y: H * 0.75, vx: 0, vy: 0 };
const cpu = { x: W / 2, y: H * 0.25, vx: 0, vy: 0, speed: 3.2 };
const ball = { x: W / 2, y: H / 2, vx: 0, vy: 0 };

// Input
let inputActive = false;
let inputX = W / 2;
let inputY = H * 0.75;

// ===== Controles =====
function handleInputStart(x, y) {
    inputActive = true;
    updateInput(x, y);
}

function handleInputMove(x, y) {
    if (!inputActive || !isPlaying) return;
    updateInput(x, y);
}

function handleInputEnd() {
    inputActive = false;
}

function updateInput(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    inputX = (clientX - rect.left) * scaleX;
    inputY = (clientY - rect.top) * scaleY;
}

// Mouse
canvas.addEventListener('mousedown', e => handleInputStart(e.clientX, e.clientY));
canvas.addEventListener('mousemove', e => handleInputMove(e.clientX, e.clientY));
canvas.addEventListener('mouseup', handleInputEnd);
canvas.addEventListener('mouseleave', handleInputEnd);

// Touch
canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    handleInputStart(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });
canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    handleInputMove(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });
canvas.addEventListener('touchend', e => { e.preventDefault(); handleInputEnd(); }, { passive: false });

// Botones
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);

// ===== Iniciar partido =====
function startGame() {
    scorePlayer = 0;
    scoreCpu = 0;
    timeLeft = MATCH_TIME;
    resetPositions();
    updateHUD();

    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('end-screen').classList.add('hidden');

    isPlaying = true;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!isPlaying) return;
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) endMatch();
    }, 1000);

    if (animationId) cancelAnimationFrame(animationId);
    gameLoop();
}

function resetPositions() {
    player.x = W / 2; player.y = H * 0.75; player.vx = 0; player.vy = 0;
    cpu.x = W / 2; cpu.y = H * 0.25; cpu.vx = 0; cpu.vy = 0;
    ball.x = W / 2; ball.y = H / 2; ball.vx = 0; ball.vy = 0;
    inputX = player.x; inputY = player.y;
}

// ===== Lógica principal =====
function update() {
    // Animación de gol (pausa breve)
    if (goalAnimation > 0) {
        goalAnimation--;
        if (goalAnimation === 0) resetPositions();
        return;
    }

    // --- Movimiento del jugador (segue hacia el input) ---
    if (inputActive) {
        // Limitar a la mitad inferior
        const targetX = Math.max(PLAYER_RADIUS, Math.min(W - PLAYER_RADIUS, inputX));
        const targetY = Math.max(H / 2 + PLAYER_RADIUS, Math.min(H - PLAYER_RADIUS, inputY));

        const dx = targetX - player.x;
        const dy = targetY - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 1) {
            const speed = Math.min(dist * 0.15, MAX_PLAYER_SPEED);
            player.vx = (dx / dist) * speed;
            player.vy = (dy / dist) * speed;
        } else {
            player.vx *= 0.5;
            player.vy *= 0.5;
        }
    } else {
        player.vx *= FRICTION;
        player.vy *= FRICTION;
    }

    player.x += player.vx;
    player.y += player.vy;
    clampEntity(player, PLAYER_RADIUS);

    // --- IA de la CPU ---
    updateCPU();

    // --- Física de la pelota ---
    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.vx *= BALL_FRICTION;
    ball.vy *= BALL_FRICTION;

    // Rebote en paredes laterales
    if (ball.x - BALL_RADIUS <= 0) { ball.x = BALL_RADIUS; ball.vx *= -0.8; }
    if (ball.x + BALL_RADIUS >= W) { ball.x = W - BALL_RADIUS; ball.vx *= -0.8; }

    // Rebote en techo/suelo (excepto zona de gol)
    const goalLeft = (W - GOAL_WIDTH) / 2;
    const goalRight = (W + GOAL_WIDTH) / 2;
    const inGoalZone = ball.x > goalLeft && ball.x < goalRight;

    if (!inGoalZone) {
        if (ball.y - BALL_RADIUS <= 0) { ball.y = BALL_RADIUS; ball.vy *= -0.8; }
        if (ball.y + BALL_RADIUS >= H) { ball.y = H - BALL_RADIUS; ball.vy *= -0.8; }
    }

    // --- Goles ---
    if (ball.y + BALL_RADIUS < -5 && inGoalZone) {
        scoreGoal('player');
        return;
    }
    if (ball.y - BALL_RADIUS > H + 5 && inGoalZone) {
        scoreGoal('cpu');
        return;
    }

    // --- Colisiones jugador/bola y cpu/bola ---
    resolveCollision(player, ball);
    resolveCollision(cpu, ball);

    // Limitar velocidad máxima de la bola
    const maxBallSpeed = 12;
    const bSpeed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
    if (bSpeed > maxBallSpeed) {
        ball.vx = (ball.vx / bSpeed) * maxBallSpeed;
        ball.vy = (ball.vy / bSpeed) * maxBallSpeed;
    }
}

// ===== IA de la CPU =====
function updateCPU() {
    let targetX = ball.x;
    let targetY = ball.y;

    // Si la bola está en su mitad, ir a por ella
    if (ball.y < H / 2) {
        targetX = ball.x;
        targetY = ball.y - 30; // Posicionarse ligeramente detrás
    } else {
        // Si la bola está en la mitad del jugador, volver al centro defensivo
        targetX = W / 2;
        targetY = H * 0.2;
    }

    // Limitar CPU a su mitad
    targetX = Math.max(PLAYER_RADIUS, Math.min(W - PLAYER_RADIUS, targetX));
    targetY = Math.max(PLAYER_RADIUS, Math.min(H / 2 - PLAYER_RADIUS, targetY));

    const dx = targetX - cpu.x;
    const dy = targetY - cpu.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 2) {
        const speed = Math.min(dist * 0.08, cpu.speed);
        cpu.vx = (dx / dist) * speed;
        cpu.vy = (dy / dist) * speed;
    } else {
        cpu.vx *= 0.5;
        cpu.vy *= 0.5;
    }

    cpu.x += cpu.vx;
    cpu.y += cpu.vy;
    clampEntity(cpu, PLAYER_RADIUS);
}

// ===== Colisión circular elástica =====
function resolveCollision(entity, b) {
    const dx = b.x - entity.x;
    const dy = b.y - entity.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = PLAYER_RADIUS + BALL_RADIUS;

    if (dist < minDist && dist > 0) {
        // Normal de colisión
        const nx = dx / dist;
        const ny = dy / dist;

        // Separar para evitar solapamiento
        const overlap = minDist - dist;
        b.x += nx * overlap;
        b.y += ny * overlap;

        // Transferir velocidad (golpe)
        const force = 6;
        b.vx += nx * force + entity.vx * 0.5;
        b.vy += ny * force + entity.vy * 0.5;
    }
}

function clampEntity(ent, r) {
    ent.x = Math.max(r, Math.min(W - r, ent.x));
    ent.y = Math.max(r, Math.min(H - r, ent.y));
}

function scoreGoal(scorer) {
    if (scorer === 'player') scorePlayer++;
    else scoreCpu++;

    goalScorer = scorer;
    goalAnimation = 60; // ~1 segundo de pausa
    updateHUD();
}

// ===== Dibujar =====
function draw() {
    // Césped
    ctx.fillStyle = '#0d2818';
    ctx.fillRect(0, 0, W, H);

    // Líneas del campo
    drawField();

    // Porterías
    drawGoals();

    // Jugadores
    drawCircle(player.x, player.y, PLAYER_RADIUS, '#00e5ff', '#0099cc');
    drawCircle(cpu.x, cpu.y, PLAYER_RADIUS, '#ff4757', '#cc2233');

    // Bola
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#ffffff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Texto de gol
    if (goalAnimation > 0) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, goalAnimation / 20);
        ctx.fillStyle = goalScorer === 'player' ? '#00e5ff' : '#ff4757';
        ctx.font = 'bold 48px Courier New';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 20;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fillText('¡GOL!', W / 2, H / 2 + 15);
        ctx.restore();
    }
}

function drawField() {
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;

    // Línea central
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.stroke();

    // Círculo central
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 50, 0, Math.PI * 2);
    ctx.stroke();

    // Punto central
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 4, 0, Math.PI * 2);
    ctx.fill();

    // Áreas
    const areaW = 200;
    const areaH = 80;
    ctx.strokeRect((W - areaW) / 2, 0, areaW, areaH);
    ctx.strokeRect((W - areaW) / 2, H - areaH, areaW, areaH);
}

function drawGoals() {
    const goalLeft = (W - GOAL_WIDTH) / 2;

    // Portería CPU (arriba)
    ctx.fillStyle = 'rgba(255,71,87,0.3)';
    ctx.fillRect(goalLeft, -5, GOAL_WIDTH, 8);
    ctx.strokeStyle = '#ff4757';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(goalLeft, 0);
    ctx.lineTo(goalLeft + GOAL_WIDTH, 0);
    ctx.stroke();

    // Portería Jugador (abajo)
    ctx.fillStyle = 'rgba(0,229,255,0.3)';
    ctx.fillRect(goalLeft, H - 3, GOAL_WIDTH, 8);
    ctx.strokeStyle = '#00e5ff';
    ctx.beginPath();
    ctx.moveTo(goalLeft, H);
    ctx.lineTo(goalLeft + GOAL_WIDTH, H);
    ctx.stroke();
}

function drawCircle(x, y, r, color, shadow) {
    ctx.fillStyle = color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = shadow;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Brillo interior
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(x - r * 0.2, y - r * 0.2, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
}

// ===== Bucle =====
function gameLoop() {
    if (!isPlaying && goalAnimation <= 0) return;
    update();
    draw();
    animationId = requestAnimationFrame(gameLoop);
}

// ===== Fin del partido =====
function endMatch() {
    isPlaying = false;
    clearInterval(timerInterval);
    cancelAnimationFrame(animationId);

    const titleEl = document.getElementById('end-title');
    const msgEl = document.getElementById('end-message');

    if (scorePlayer > scoreCpu) {
        titleEl.innerText = '🏆 ¡GANASTE!';
        titleEl.style.color = '#00e5ff';
        msgEl.innerText = `${scorePlayer} - ${scoreCpu} • ¡Gran partido!`;
    } else if (scoreCpu > scorePlayer) {
        titleEl.innerText = '😞 Perdiste';
        titleEl.style.color = '#ff4757';
        msgEl.innerText = `${scorePlayer} - ${scoreCpu} • La próxima será`;
    } else {
        titleEl.innerText = '🤝 Empate';
        titleEl.style.color = '#ffd32a';
        msgEl.innerText = `${scorePlayer} - ${scoreCpu} • Partido reñido`;
    }

    document.getElementById('end-screen').classList.remove('hidden');
}

// ===== HUD =====
function updateHUD() {
    document.getElementById('score-player').innerText = scorePlayer;
    document.getElementById('score-cpu').innerText = scoreCpu;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    document.getElementById('timer').innerText = `⏱️ ${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// Dibujar campo inicial
draw();
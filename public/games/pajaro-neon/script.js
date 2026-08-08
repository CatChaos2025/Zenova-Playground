// ===== Elementos del DOM =====
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// ===== Configuración =====
const W = canvas.width;
const H = canvas.height;

// Pájaro
const BIRD_X = 80;
const BIRD_R = 14;
const GRAVITY = 0.5;
const JUMP_STRENGTH = -8;

// Tuberías
const PIPE_WIDTH = 60;
const PIPE_GAP = 160;
const PIPE_SPEED = 2.5;
const PIPE_SPAWN_DISTANCE = 220;

// ===== Estado del juego =====
let bird = { y: H / 2, velocity: 0 };
let pipes = [];
let particles = [];
let stars = [];
let score = 0;
let highScore = localStorage.getItem('flappyHighScore') || 0;
let isPlaying = false;
let animationId = null;
let distanceSinceLastPipe = 0;

document.getElementById('high-score').innerText = highScore;

// ===== Crear estrellas de fondo =====
function createStars() {
    stars = [];
    for (let i = 0; i < 50; i++) {
        stars.push({
            x: Math.random() * W,
            y: Math.random() * H,
            size: Math.random() * 2 + 1,
            speed: Math.random() * 0.5 + 0.2
        });
    }
}

// ===== Botones =====
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);

// ===== Controles =====
canvas.addEventListener('mousedown', flap);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    flap();
}, { passive: false });

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        flap();
    }
});

function flap() {
    if (!isPlaying) return;
    bird.velocity = JUMP_STRENGTH;

    // Partículas al aletear
    for (let i = 0; i < 6; i++) {
        particles.push({
            x: BIRD_X - 10,
            y: bird.y + 5,
            vx: -Math.random() * 3 - 1,
            vy: (Math.random() - 0.5) * 2,
            life: 1,
            color: '#ffd32a'
        });
    }
}

// ===== Iniciar juego =====
function startGame() {
    bird = { y: H / 2, velocity: 0 };
    pipes = [];
    particles = [];
    score = 0;
    distanceSinceLastPipe = 0;

    createStars();
    updateScoreDisplay();

    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');

    isPlaying = true;
    if (animationId) cancelAnimationFrame(animationId);
    gameLoop();
}

// ===== Crear tubería =====
function spawnPipe() {
    const minTop = 60;
    const maxTop = H - PIPE_GAP - 100;
    const topHeight = minTop + Math.random() * (maxTop - minTop);

    pipes.push({
        x: W,
        topHeight: topHeight,
        gap: PIPE_GAP,
        passed: false
    });
}

// ===== Actualizar lógica =====
function update() {
    // Física del pájaro
    bird.velocity += GRAVITY;
    bird.y += bird.velocity;

    // Mover estrellas (parallax)
    stars.forEach(star => {
        star.x -= star.speed;
        if (star.x < 0) {
            star.x = W;
            star.y = Math.random() * H;
        }
    });

    // Generar tuberías
    distanceSinceLastPipe += PIPE_SPEED;
    if (distanceSinceLastPipe >= PIPE_SPAWN_DISTANCE) {
        spawnPipe();
        distanceSinceLastPipe = 0;
    }

    // Mover tuberías
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= PIPE_SPEED;

        // Sumar punto al pasar
        if (!pipes[i].passed && pipes[i].x + PIPE_WIDTH < BIRD_X - BIRD_R) {
            pipes[i].passed = true;
            score++;
            updateScoreDisplay();
        }

        // Eliminar fuera de pantalla
        if (pipes[i].x + PIPE_WIDTH < 0) {
            pipes.splice(i, 1);
            continue;
        }

        // Colisión
        if (checkCollision(pipes[i])) {
            endGame();
            return;
        }
    }

    // Colisión con suelo o techo
    if (bird.y + BIRD_R >= H || bird.y - BIRD_R <= 0) {
        createCrashParticles();
        endGame();
        return;
    }

    // Partículas
    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.03;
        return p.life > 0;
    });
}

// ===== Colisión con tubería =====
function checkCollision(pipe) {
    const birdLeft = BIRD_X - BIRD_R;
    const birdRight = BIRD_X + BIRD_R;
    const birdTop = bird.y - BIRD_R;
    const birdBottom = bird.y + BIRD_R;

    const pipeLeft = pipe.x;
    const pipeRight = pipe.x + PIPE_WIDTH;

    // Verificar si está en el rango horizontal de la tubería
    if (birdRight > pipeLeft && birdLeft < pipeRight) {
        // Choca con la tubería superior o inferior
        if (birdTop < pipe.topHeight || birdBottom > pipe.topHeight + pipe.gap) {
            return true;
        }
    }
    return false;
}

function createCrashParticles() {
    for (let i = 0; i < 25; i++) {
        particles.push({
            x: BIRD_X,
            y: bird.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1,
            color: Math.random() < 0.5 ? '#ffd32a' : '#ff4757'
        });
    }
}

// ===== Dibujar =====
function draw() {
    // Fondo con degradado
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0d0d1a');
    grad.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Estrellas
    stars.forEach(star => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    // Tuberías
    pipes.forEach(pipe => {
        // Tubería superior
        drawPipe(pipe.x, 0, pipe.topHeight, true);
        // Tubería inferior
        drawPipe(pipe.x, pipe.topHeight + pipe.gap, H - pipe.topHeight - pipe.gap, false);
    });

    // Partículas
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
        ctx.globalAlpha = 1;
    });

    // Pájaro
    drawBird();
}

function drawPipe(x, y, height, isTop) {
    // Cuerpo de la tubería
    ctx.fillStyle = '#2ed573';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#2ed573';
    ctx.fillRect(x, y, PIPE_WIDTH, height);
    ctx.shadowBlur = 0;

    // Borde brillante
    ctx.strokeStyle = '#7bed9f';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, PIPE_WIDTH, height);

    // Borde del hueco (labio de la tubería)
    const lipY = isTop ? y + height - 12 : y;
    ctx.fillStyle = '#7bed9f';
    ctx.fillRect(x - 4, lipY, PIPE_WIDTH + 8, 12);
}

function drawBird() {
    ctx.save();
    ctx.translate(BIRD_X, bird.y);

    // Rotación según velocidad
    const rotation = Math.max(-0.4, Math.min(0.6, bird.velocity * 0.08));
    ctx.rotate(rotation);

    // Cuerpo
    ctx.fillStyle = '#ffd32a';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ffd32a';
    ctx.beginPath();
    ctx.arc(0, 0, BIRD_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Ala
    ctx.fillStyle = '#ff9f1a';
    ctx.beginPath();
    ctx.ellipse(-5, 3, 8, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Ojo
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(6, -4, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0a0a14';
    ctx.beginPath();
    ctx.arc(8, -4, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Pico
    ctx.fillStyle = '#ff4757';
    ctx.beginPath();
    ctx.moveTo(BIRD_R - 2, -2);
    ctx.lineTo(BIRD_R + 8, 2);
    ctx.lineTo(BIRD_R - 2, 6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

// ===== Bucle principal =====
function gameLoop() {
    if (!isPlaying) return;
    update();
    draw();
    animationId = requestAnimationFrame(gameLoop);
}

// ===== Fin del juego =====
function endGame() {
    isPlaying = false;
    cancelAnimationFrame(animationId);

    document.getElementById('final-score').innerText = score;

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('flappyHighScore', highScore);
        document.getElementById('new-record').classList.remove('hidden');
    } else {
        document.getElementById('new-record').classList.add('hidden');
    }

    document.getElementById('high-score').innerText = highScore;
    document.getElementById('game-over-screen').classList.remove('hidden');
}

function updateScoreDisplay() {
    document.getElementById('score').innerText = score;
}
// ===== Elementos del DOM =====
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// ===== Configuración =====
const W = canvas.width;
const H = canvas.height;
const LANES = 3;
const LANE_WIDTH = W / LANES;
const PLAYER_Y = H - 130;

// Dimensiones de hitboxes
const PLAYER_W = 30;
const PLAYER_H = 55;
const CAR_W = 46;
const CAR_H = 75;

// ===== Estado del juego =====
let playerLane = 1;
let playerX = laneCenter(1);
let targetX = laneCenter(1);
let playerTilt = 0;

let enemies = [];
let particles = [];
let roadOffset = 0;
let speed = 4;
let baseSpeed = 4;
let score = 0;
let highScore = localStorage.getItem('motoHighScore') || 0;
let isPlaying = false;
let animationId = null;
let spawnTimer = 0;
let spawnInterval = 60; // frames entre spawns

// Colores de coches neón
const CAR_COLORS = ['#ff4757', '#00e5ff', '#ff9f1a', '#a55eea', '#2ed573', '#ffd32a'];

document.getElementById('high-score').innerText = highScore;

// ===== Botones =====
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);

// ===== Controles de teclado =====
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        changeLane(-1);
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        changeLane(1);
    }
});

// ===== Controles táctiles (botones) =====
document.getElementById('btn-left').addEventListener('touchstart', (e) => { e.preventDefault(); changeLane(-1); });
document.getElementById('btn-left').addEventListener('mousedown', () => changeLane(-1));
document.getElementById('btn-right').addEventListener('touchstart', (e) => { e.preventDefault(); changeLane(1); });
document.getElementById('btn-right').addEventListener('mousedown', () => changeLane(1));

// ===== Toque en el canvas (mitad izq/der) =====
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const touchX = (e.touches[0].clientX - rect.left) * scaleX;
    changeLane(touchX < W / 2 ? -1 : 1);
}, { passive: false });

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const clickX = (e.clientX - rect.left) * scaleX;
    changeLane(clickX < W / 2 ? -1 : 1);
});

function laneCenter(lane) {
    return LANE_WIDTH * lane + LANE_WIDTH / 2;
}

function changeLane(dir) {
    if (!isPlaying) return;
    const newLane = playerLane + dir;
    if (newLane >= 0 && newLane < LANES) {
        playerLane = newLane;
        targetX = laneCenter(playerLane);
    }
}

// ===== Iniciar juego =====
function startGame() {
    enemies = [];
    particles = [];
    playerLane = 1;
    playerX = laneCenter(1);
    targetX = laneCenter(1);
    playerTilt = 0;
    speed = 4;
    baseSpeed = 4;
    score = 0;
    spawnTimer = 0;
    spawnInterval = 60;
    roadOffset = 0;

    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');

    isPlaying = true;
    if (animationId) cancelAnimationFrame(animationId);
    gameLoop();
}

// ===== Crear enemigo =====
function spawnEnemy() {
    // Buscar carriles disponibles (sin enemigos muy recientes)
    const availableLanes = [];
    for (let l = 0; l < LANES; l++) {
        const blocked = enemies.some(e => e.lane === l && e.y < 120);
        if (!blocked) availableLanes.push(l);
    }

    if (availableLanes.length === 0) return;

    const lane = availableLanes[Math.floor(Math.random() * availableLanes.length)];

    enemies.push({
        lane: lane,
        x: laneCenter(lane),
        y: -CAR_H,
        width: CAR_W,
        height: CAR_H,
        color: CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)],
        speedFactor: 0.7 + Math.random() * 0.5, // coches más lentos/rápidos
        passed: false
    });
}

// ===== Actualizar lógica =====
function update() {
    // Movimiento suave del jugador
    const dx = targetX - playerX;
    playerX += dx * 0.18;
    playerTilt = Math.max(-0.25, Math.min(0.25, dx * 0.008));

    // Líneas de carretera
    roadOffset += speed;
    if (roadOffset > 50) roadOffset = 0;

    // Spawn de enemigos
    spawnTimer++;
    if (spawnTimer >= spawnInterval) {
        spawnEnemy();
        spawnTimer = 0;
    }

    // Mover enemigos y detectar colisiones
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.y += speed * e.speedFactor;

        // Sumar punto al esquivar
        if (!e.passed && e.y > PLAYER_Y + PLAYER_H) {
            e.passed = true;
            score += 10;
            updateScoreDisplay();
        }

        // Eliminar fuera de pantalla
        if (e.y > H + CAR_H) {
            enemies.splice(i, 1);
            continue;
        }

        // Colisión
        if (checkCollision(playerX, PLAYER_Y, PLAYER_W, PLAYER_H, e.x, e.y, e.width, e.height)) {
            createCrashParticles();
            endGame();
            return;
        }
    }

    // Partículas de velocidad
    if (Math.random() < 0.3) {
        particles.push({
            x: Math.random() < 0.5 ? 15 : W - 15,
            y: -10,
            length: 10 + Math.random() * 20,
            speed: speed * 2,
            alpha: 0.5
        });
    }

    particles = particles.filter(p => {
        p.y += p.speed;
        p.alpha -= 0.01;
        return p.y < H && p.alpha > 0;
    });

    // Aumentar dificultad
    speed += 0.0008;
    if (spawnInterval > 35) spawnInterval -= 0.005;

    // Distancia
    score += Math.floor(speed / 10);
    if (Math.random() < 0.1) updateScoreDisplay();
}

// ===== Colisión AABB con margen de tolerancia =====
function checkCollision(px, py, pw, ph, ex, ey, ew, eh) {
    const margin = 6;
    return (
        px - pw / 2 + margin < ex + ew / 2 - margin &&
        px + pw / 2 - margin > ex - ew / 2 + margin &&
        py + margin < ey + eh - margin &&
        py + ph - margin > ey + margin
    );
}

function createCrashParticles() {
    for (let i = 0; i < 30; i++) {
        particles.push({
            x: playerX + (Math.random() - 0.5) * 30,
            y: PLAYER_Y + (Math.random() - 0.5) * 50,
            length: 5 + Math.random() * 10,
            speed: -2 - Math.random() * 5,
            alpha: 1
        });
    }
}

// ===== Dibujar =====
function draw() {
    // Fondo
    ctx.fillStyle = '#16161f';
    ctx.fillRect(0, 0, W, H);

    // Césped a los lados
    ctx.fillStyle = '#0d1a0d';
    ctx.fillRect(0, 0, 25, H);
    ctx.fillRect(W - 25, 0, 25, H);

    // Carretera
    ctx.fillStyle = '#1e1e2a';
    ctx.fillRect(25, 0, W - 50, H);

    // Bordes de carretera
    ctx.fillStyle = '#ff9f1a';
    ctx.fillRect(25, 0, 4, H);
    ctx.fillRect(W - 29, 0, 4, H);

    // Líneas de carril discontinuas
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 4;
    ctx.setLineDash([30, 20]);
    ctx.lineDashOffset = -roadOffset;

    for (let l = 1; l < LANES; l++) {
        const x = 25 + (W - 50) / LANES * l;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
    }
    ctx.setLineDash([]);

    // Partículas de velocidad
    particles.forEach(p => {
        ctx.globalAlpha = p.alpha;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, p.y + p.length);
        ctx.stroke();
        ctx.globalAlpha = 1;
    });

    // Dibujar enemigos
    enemies.forEach(e => drawCar(e));

    // Dibujar jugador
    if (isPlaying || particles.length > 0) {
        drawMoto(playerX, PLAYER_Y, playerTilt);
    }
}

// Dibujar un coche (vista desde atrás)
function drawCar(car) {
    const x = car.x - car.width / 2;
    const y = car.y;

    ctx.save();

    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(x + 3, y + 3, car.width, car.height);

    // Cuerpo
    ctx.fillStyle = car.color;
    ctx.beginPath();
    ctx.roundRect(x, y, car.width, car.height, 8);
    ctx.fill();

    // Ventanas
    ctx.fillStyle = 'rgba(20, 20, 40, 0.8)';
    ctx.fillRect(x + 6, y + 10, car.width - 12, 18);
    ctx.fillRect(x + 6, y + car.height - 25, car.width - 12, 15);

    // Luces traseras rojas
    ctx.fillStyle = '#ff1a1a';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff1a1a';
    ctx.fillRect(x + 4, y + car.height - 8, 10, 5);
    ctx.fillRect(x + car.width - 14, y + car.height - 8, 10, 5);
    ctx.shadowBlur = 0;

    ctx.restore();
}

// Dibujar la moto (vista desde atrás)
function drawMoto(x, y, tilt) {
    ctx.save();
    ctx.translate(x, y + PLAYER_H / 2);
    ctx.rotate(tilt);
    ctx.translate(-x, -(y + PLAYER_H / 2));

    // Efecto de nitro/velocidad
    const flameLength = speed * 3;
    const grad = ctx.createLinearGradient(x, y + PLAYER_H, x, y + PLAYER_H + flameLength);
    grad.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
    grad.addColorStop(1, 'rgba(255, 100, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x - 6, y + PLAYER_H);
    ctx.lineTo(x + 6, y + PLAYER_H);
    ctx.lineTo(x, y + PLAYER_H + flameLength);
    ctx.closePath();
    ctx.fill();

    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(x + 3, y + PLAYER_H / 2 + 5, 15, PLAYER_H / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rueda trasera
    ctx.fillStyle = '#222';
    ctx.fillRect(x - 7, y + PLAYER_H - 18, 14, 18);

    // Cuerpo de la moto
    ctx.fillStyle = '#ff9f1a';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff9f1a';
    ctx.beginPath();
    ctx.roundRect(x - 10, y + 15, 20, PLAYER_H - 25, 6);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Rueda delantera
    ctx.fillStyle = '#222';
    ctx.fillRect(x - 6, y, 12, 16);

    // Piloto (casco)
    ctx.fillStyle = '#ff4757';
    ctx.beginPath();
    ctx.arc(x, y + 25, 8, 0, Math.PI * 2);
    ctx.fill();

    // Hombros del piloto
    ctx.fillStyle = '#333';
    ctx.fillRect(x - 11, y + 30, 22, 12);

    ctx.restore();
}

// ===== Bucle principal =====
function gameLoop() {
    if (!isPlaying && particles.length === 0) return;

    if (isPlaying) update();
    else {
        // Animación de choque
        particles = particles.filter(p => {
            p.y += p.speed;
            p.alpha -= 0.03;
            return p.alpha > 0;
        });
    }

    draw();

    if (isPlaying || particles.length > 0) {
        animationId = requestAnimationFrame(gameLoop);
    }
}

// ===== Fin del juego =====
function endGame() {
    isPlaying = false;

    setTimeout(() => {
        const finalScore = Math.floor(score / 10);
        document.getElementById('final-score').innerText = finalScore;

        if (finalScore > highScore) {
            highScore = finalScore;
            localStorage.setItem('motoHighScore', highScore);
            document.getElementById('new-record').classList.remove('hidden');
        } else {
            document.getElementById('new-record').classList.add('hidden');
        }

        document.getElementById('high-score').innerText = highScore;
        document.getElementById('game-over-screen').classList.remove('hidden');
    }, 800);
}

function updateScoreDisplay() {
    document.getElementById('score').innerText = Math.floor(score / 10);
    document.getElementById('speed-display').innerText = Math.floor(speed * 20) + ' km/h';
}
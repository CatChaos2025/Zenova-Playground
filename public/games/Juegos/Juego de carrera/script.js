const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const speedEl = document.getElementById('speedDisplay');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlaySubtitle = document.getElementById('overlaySubtitle');
const startBtn = document.getElementById('startButton');

// Ajuste de tamaño eficiente
function resize() {
  const wrapper = canvas.parentElement;
  canvas.width = wrapper.clientWidth;
  canvas.height = wrapper.clientHeight;
}
window.addEventListener('resize', resize);
resize();

// Estado del juego
let gameRunning = false;
let score = 0;
let highScore = parseInt(localStorage.getItem('neonRacerHigh')) || 0;
let baseSpeed = 5;
let currentSpeed = 5;
let frame = 0;
let keys = {};
let tilt = 0;

highScoreEl.innerText = highScore;

// Jugador
const player = {
  x: 0, y: 0, w: 36, h: 60, dx: 0,
  turbo: false, turboTimer: 0
};

// OBJECT POOLING (Solución definitiva al lag de partículas)
// Creamos arrays fijos y reutilizamos los objetos en lugar de crear nuevos
const MAX_PARTICLES = 60;
const particlesPool = Array.from({length: MAX_PARTICLES}, () => ({
  x: 0, y: 0, vx: 0, vy: 0, life: 0, color: '', size: 0, active: false
}));

const MAX_EXHAUST = 30;
const exhaustPool = Array.from({length: MAX_EXHAUST}, () => ({
  x: 0, y: 0, vx: 0, vy: 0, life: 0, color: '', size: 0, active: false
}));

let enemies = [];
let roadLines = [];
let stars = [];

// Inicializar entorno estático
for(let i = 0; i < 15; i++) roadLines.push({ y: i * 60 });
for(let i = 0; i < 40; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 1.5 + 0.5,
    speed: Math.random() * 3 + 1
  });
}

// Inputs
window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if(e.code === 'Space' && gameRunning) { e.preventDefault(); activateTurbo(); }
});
window.addEventListener('keyup', e => keys[e.code] = false);
startBtn.addEventListener('click', startGame);

function startGame() {
  gameRunning = true;
  score = 0; baseSpeed = 5; currentSpeed = 5; frame = 0;
  enemies = [];
  
  // Resetear pools
  particlesPool.forEach(p => p.active = false);
  exhaustPool.forEach(p => p.active = false);
  
  player.x = canvas.width / 2 - player.w / 2;
  player.y = canvas.height - 120;
  player.turbo = false; player.dx = 0; tilt = 0;
  
  overlay.classList.remove('active');
  loop();
}

function gameOver() {
  gameRunning = false;
  if(score > highScore) {
    highScore = score;
    localStorage.setItem('neonRacerHigh', highScore);
    highScoreEl.innerText = highScore;
  }
  overlayTitle.innerText = "GAME OVER";
  overlaySubtitle.innerText = `PUNTUACIÓN: ${score} | RÉCORD: ${highScore}`;
  startBtn.innerText = "REINTENTAR";
  overlay.classList.add('active');
}

// Funciones helper para usar el Object Pooling
function spawnParticle(x, y, vx, vy, life, color, size) {
  for(let p of particlesPool) {
    if(!p.active) {
      p.x=x; p.y=y; p.vx=vx; p.vy=vy; p.life=life; p.color=color; p.size=size; p.active=true;
      return;
    }
  }
}

function spawnExhaust(x, y, vx, vy, life, color, size) {
  for(let p of exhaustPool) {
    if(!p.active) {
      p.x=x; p.y=y; p.vx=vx; p.vy=vy; p.life=life; p.color=color; p.size=size; p.active=true;
      return;
    }
  }
}

function activateTurbo() {
  if(player.turbo) return;
  player.turbo = true;
  player.turboTimer = 180;
  for(let i=0; i<10; i++) {
    spawnParticle(
      player.x + player.w/2, player.y + player.h,
      (Math.random()-0.5)*6, Math.random()*4+2, 
      25, Math.random()>0.5?'#ff0':'#f80', Math.random()*3+2
    );
  }
}

function spawnEnemy() {
  if(enemies.length >= 10) return; // Límite estricto de enemigos
  const laneWidth = canvas.width / 3;
  const lane = Math.floor(Math.random() * 3);
  enemies.push({
    x: (lane * laneWidth) + (laneWidth - 36)/2,
    y: -60, w: 36, h: 60,
    color: ['#f0f', '#ff0', '#f55', '#0f0'][Math.floor(Math.random()*4)],
    speedOffset: Math.random() * 2
  });
}

// === DIBUJADO OPTIMIZADO (SIN SHADOWBLUR) ===
function drawGlowCar(x, y, w, h, tiltAngle, isTurbo, mainColor, glowColor) {
  ctx.save();
  ctx.translate(x + w/2, y + h/2);
  ctx.rotate(tiltAngle);

  // 1. Capa de "Glow" simulado (mucho más rápido que shadowBlur)
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = glowColor;
  ctx.beginPath();
  ctx.moveTo(0, -h/2 - 2); ctx.lineTo(w/2 - 2, -h/4 - 2); ctx.lineTo(w/2 + 2, h/4 + 2);
  ctx.lineTo(w/2, h/2 - 2); ctx.lineTo(-w/2, h/2 - 2); ctx.lineTo(-w/2 - 2, h/4 + 2);
  ctx.lineTo(-w/2 + 2, -h/4 - 2); ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // 2. Llamas escape
  if(isTurbo || Math.abs(player.dx) > 2) {
    const fl = isTurbo ? 25 : 12;
    const grad = ctx.createLinearGradient(0, h/2, 0, h/2 + fl);
    grad.addColorStop(0, isTurbo ? '#fff' : '#ff0');
    grad.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.moveTo(-5, h/2); ctx.lineTo(0, h/2 + fl + Math.random()*5); ctx.lineTo(5, h/2); ctx.fill();
  }

  // 3. Cuerpo principal nítido
  const bodyGrad = ctx.createLinearGradient(-w/2, 0, w/2, 0);
  bodyGrad.addColorStop(0, '#005577'); bodyGrad.addColorStop(0.5, mainColor); bodyGrad.addColorStop(1, '#005577');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.moveTo(0, -h/2); ctx.lineTo(w/2 - 4, -h/4); ctx.lineTo(w/2, h/4);
  ctx.lineTo(w/2 - 2, h/2 - 4); ctx.lineTo(-w/2 + 2, h/2 - 4);
  ctx.lineTo(-w/2, h/4); ctx.lineTo(-w/2 + 4, -h/4); ctx.closePath();
  ctx.fill();

  // Detalles (alerón, cabina, luces) simplificados pero visibles
  ctx.fillStyle = '#004466'; ctx.fillRect(-w/2 - 2, h/2 - 10, w + 4, 5);
  ctx.fillStyle = '#001122';
  ctx.beginPath(); ctx.moveTo(0,-h/4); ctx.lineTo(w/3,-h/8); ctx.lineTo(w/3,h/8); ctx.lineTo(0,h/6); ctx.lineTo(-w/3,h/8); ctx.lineTo(-w/3,-h/8); ctx.fill();
  ctx.fillStyle = 'rgba(0,255,255,0.3)';
  ctx.beginPath(); ctx.moveTo(0,-h/4); ctx.lineTo(w/4,-h/8); ctx.lineTo(w/4,0); ctx.lineTo(0,h/8); ctx.fill();
  
  ctx.fillStyle = isTurbo ? '#ff0' : '#fff';
  ctx.fillRect(-w/2+3, -h/2+5, 4, 3); ctx.fillRect(w/2-7, -h/2+5, 4, 3);
  ctx.fillStyle = '#f00';
  ctx.fillRect(-w/2+3, h/2-8, 4, 3); ctx.fillRect(w/2-7, h/2-8, 4, 3);

  ctx.restore();
}

function update() {
  if(!gameRunning) return;
  frame++;
  
  // Dificultad progresiva suave
  if(frame % 900 === 0) baseSpeed += 0.2;
  currentSpeed = baseSpeed * (player.turbo ? 1.6 : 1);

  // Movimiento jugador
  if(keys['ArrowLeft']) { player.dx = -6; tilt = Math.max(tilt - 0.08, -0.25); } 
  else if(keys['ArrowRight']) { player.dx = 6; tilt = Math.min(tilt + 0.08, 0.25); } 
  else { player.dx *= 0.85; tilt *= 0.9; }
  
  player.x += player.dx;
  player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));

  if(player.turbo && --player.turboTimer <= 0) player.turbo = false;

  // Escape constante (limitado por pool)
  if(frame % 4 === 0) {
    spawnExhaust(
      player.x + player.w/2 + (Math.random()-0.5)*4, player.y + player.h,
      (Math.random()-0.5), Math.random()*2+2, 
      12, player.turbo ? '#ff0' : '#0ff', Math.random()*2+1
    );
  }

  // Actualizar estrellas y carretera
  stars.forEach(s => { s.y += s.speed * (player.turbo ? 2 : 1); if(s.y > canvas.height) { s.y = 0; s.x = Math.random() * canvas.width; }});
  roadLines.forEach(l => { l.y += currentSpeed; if(l.y > canvas.height) l.y = -60; });

  // Spawn enemigos controlado
  if(frame % Math.max(40, 80 - Math.floor(baseSpeed*2)) === 0) spawnEnemy();

  // Actualizar enemigos (bucle inverso para borrar seguro)
  for(let i = enemies.length-1; i >= 0; i--) {
    let e = enemies[i];
    e.y += currentSpeed + e.speedOffset;
    
    // Colisión AABB
    if (player.x < e.x + e.w && player.x + player.w > e.x &&
        player.y < e.y + e.h && player.y + player.h > e.y) {
      // Usar partículas del pool para explosión
      for(let k=0; k<10; k++) spawnParticle(player.x+player.w/2, player.y+player.h/2, (Math.random()-0.5)*8, (Math.random()-0.5)*8, 20, '#0ff', 3);
      for(let k=0; k<10; k++) spawnParticle(e.x+e.w/2, e.y+e.h/2, (Math.random()-0.5)*8, (Math.random()-0.5)*8, 20, e.color, 3);
      gameOver(); return;
    }
    
    if(e.y > canvas.height + 50) { enemies.splice(i, 1); score += 10; scoreEl.innerText = score; }
  }

  // Actualizar pools (desactivar si vida llega a 0)
  for(let p of particlesPool) { if(p.active) { p.x+=p.vx; p.y+=p.vy; p.vx*=0.95; p.vy*=0.95; if(--p.life<=0) p.active=false; }}
  for(let p of exhaustPool) { if(p.active) { p.x+=p.vx; p.y+=p.vy; p.size*=0.95; if(--p.life<=0) p.active=false; }}

  speedEl.innerText = Math.floor(currentSpeed * 20);
}

function draw() {
  // Fondo con estela
  ctx.fillStyle = 'rgba(5,5,10,0.6)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Estrellas
  ctx.fillStyle = '#fff';
  for(let s of stars) { ctx.globalAlpha=0.3; ctx.fillRect(s.x,s.y,s.size,s.size); }
  ctx.globalAlpha=1;

  // Líneas carretera
  ctx.strokeStyle = 'rgba(0,255,255,0.1)'; ctx.lineWidth = 2; ctx.setLineDash([20, 20]);
  for(let l of roadLines) {
    ctx.beginPath(); ctx.moveTo(canvas.width/3, l.y); ctx.lineTo(canvas.width/3, l.y+30); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(canvas.width*2/3, l.y); ctx.lineTo(canvas.width*2/3, l.y+30); ctx.stroke();
  }
  ctx.setLineDash([]);

  // Dibujar partículas activas del pool (sin shadowBlur, ultra rápido)
  for(let p of exhaustPool) { if(p.active) { ctx.globalAlpha=p.life/12; ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill(); }}
  for(let p of particlesPool) { if(p.active) { ctx.globalAlpha=p.life/20; ctx.fillStyle=p.color; ctx.fillRect(p.x,p.y,p.size,p.size); }}
  ctx.globalAlpha=1;

  // Dibujar carros usando la función optimizada
  drawGlowCar(player.x, player.y, player.w, player.h, tilt, player.turbo, '#00ffff', '#00ffff');
  for(let e of enemies) drawGlowCar(e.x, e.y, e.w, e.h, 0, false, e.color, e.color);
}

function loop() {
  update();
  draw();
  if(gameRunning) requestAnimationFrame(loop);
}

// Inicio
resize();
player.x = canvas.width / 2 - player.w / 2;
player.y = canvas.height - 120;
draw();
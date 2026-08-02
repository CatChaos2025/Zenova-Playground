const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const frenzyBar = document.getElementById('frenzy-bar');
const overlay = document.getElementById('overlay');
const titleEl = document.getElementById('overlay-title');
const subEl = document.getElementById('overlay-subtitle');
const startBtn = document.getElementById('start-btn');

let W, H;
function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Audio Context
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, dur, type='sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + dur);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + dur);
}

// Estado del juego
let gameActive = false;
let score = 0; // Altura máxima alcanzada
let frenzy = 0;
let cameraY = 0;
let shake = 0;
let frame = 0;

// Jugador
const player = {
    x: W/2, y: H/2,
    vx: 0, vy: 0,
    radius: 10,
    gravity: 0.4,
    bounceForce: -12,
    color: '#0ff'
};

// Plataformas y partículas
let platforms = [];
let particles = [];
let keys = {};

// Inputs
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if(e.code === 'Space' && gameActive && player.vy > 0) {
        player.vy -= 5; // Impulso extra
        createParticles(player.x, player.y + player.radius, 5, '#ff0');
        playSound(600, 0.1, 'square');
    }
});
window.addEventListener('keyup', e => keys[e.code] = false);

startBtn.addEventListener('click', () => {
    if(!gameActive) startGame();
});

function startGame() {
    gameActive = true;
    score = 0;
    frenzy = 0;
    cameraY = 0;
    shake = 0;
    frame = 0;
    
    player.x = W/2;
    player.y = H/2;
    player.vx = 0;
    player.vy = -5;
    
    platforms = [];
    particles = [];
    
    // Generar plataformas iniciales
    for(let i=0; i<10; i++) {
        spawnPlatform(H - i * 120);
    }
    
    overlay.classList.remove('active');
    updateUI();
    loop();
}

function gameOver() {
    gameActive = false;
    titleEl.innerText = "CAÍDA FINAL";
    subEl.innerText = `Altura Máxima: ${Math.floor(score)}m | Frenesí Max: x${(frenzy/20).toFixed(1)}`;
    startBtn.innerText = "REINTENTAR";
    overlay.classList.add('active');
    playSound(150, 0.6, 'sawtooth');
}

function spawnPlatform(yPos) {
    const width = 80 + Math.random() * 60;
    platforms.push({
        x: Math.random() * (W - width),
        y: yPos,
        w: width,
        h: 12,
        type: Math.random() > 0.8 ? 'breakable' : 'normal',
        rotation: 0,
        rotSpeed: (Math.random() - 0.5) * 0.03,
        active: true
    });
}

function createParticles(x, y, count, color) {
    for(let i=0; i<count; i++) {
        particles.push({
            x, y,
            vx: (Math.random()-0.5)*6,
            vy: (Math.random()-0.5)*6,
            life: 30,
            color,
            size: Math.random()*3+1
        });
    }
}

function update() {
    if(!gameActive) return;
    frame++;
    
    // Movimiento horizontal
    if(keys['ArrowLeft'] || keys['KeyA']) player.vx -= 0.8;
    if(keys['ArrowRight'] || keys['KeyD']) player.vx += 0.8;
    player.vx *= 0.92; // Fricción
    player.x += player.vx;
    
    // Límites pantalla (wrap around)
    if(player.x < -player.radius) player.x = W + player.radius;
    if(player.x > W + player.radius) player.x = -player.radius;
    
    // Gravedad
    player.vy += player.gravity;
    player.y += player.vy;
    
    // Cámara sigue al jugador si sube
    if(player.y < cameraY + H * 0.4) {
        cameraY = player.y - H * 0.4;
    }
    
    // Game Over si cae demasiado
    if(player.y > cameraY + H + 100) {
        gameOver();
        return;
    }
    
    // Actualizar score (altura máxima)
    const currentHeight = Math.floor((H/2 - player.y + cameraY) / 10);
    if(currentHeight > score) score = currentHeight;
    
    // Spawn nuevas plataformas
    const highestPlat = Math.min(...platforms.map(p => p.y));
    if(highestPlat > cameraY - 100) {
        spawnPlatform(highestPlat - 100 - Math.random()*40);
    }
    
    // Colisiones con plataformas
    platforms.forEach(p => {
        if(!p.active) return;
        
        // Solo colisionar si cae hacia abajo
        if(player.vy > 0 && 
           player.y + player.radius >= p.y && 
           player.y + player.radius <= p.y + p.h + player.vy &&
           player.x >= p.x - 10 && player.x <= p.x + p.w + 10) {
            
            // Rebote
            player.vy = player.bounceForce * (1 + frenzy/100);
            player.y = p.y - player.radius;
            
            // Efectos
            shake = 5 + frenzy/10;
            createParticles(player.x, player.y + player.radius, 8, p.type==='breakable'?'#f0f':'#0ff');
            playSound(400 + frenzy*2, 0.15, 'triangle');
            
            // Frenesí
            frenzy = Math.min(100, frenzy + 5);
            
            // Romper plataforma breakable
            if(p.type === 'breakable') {
                p.active = false;
                createParticles(p.x + p.w/2, p.y, 15, '#f0f');
                frenzy += 10;
                playSound(800, 0.2, 'sawtooth');
            }
        }
        
        // Rotación de plataformas
        p.rotation += p.rotSpeed;
    });
    
    // Limpiar plataformas fuera de pantalla
    platforms = platforms.filter(p => p.y < cameraY + H + 200 && p.active !== false);
    
    // Decaer frenesí lentamente
    if(frenzy > 0) frenzy -= 0.1;
    
    // Partículas
    particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.2; // gravedad partículas
        p.life--;
    });
    particles = particles.filter(p => p.life > 0);
    
    shake *= 0.9;
    updateUI();
}

function updateUI() {
    scoreEl.innerText = `${score}m`;
    frenzyBar.style.width = frenzy + '%';
}

function draw() {
    // Fondo con estela
    ctx.fillStyle = 'rgba(3,3,8,0.3)';
    ctx.fillRect(0, 0, W, H);
    
    ctx.save();
    // Screen shake
    ctx.translate((Math.random()-0.5)*shake, (Math.random()-0.5)*shake);
    // Cámara
    ctx.translate(0, -cameraY);
    
    // Plataformas
    platforms.forEach(p => {
        if(!p.active) return;
        ctx.save();
        ctx.translate(p.x + p.w/2, p.y + p.h/2);
        ctx.rotate(p.rotation);
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.type==='breakable' ? '#f0f' : '#0ff';
        ctx.fillStyle = p.type==='breakable' ? '#f0f' : '#0ff';
        ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
        
        // Detalle central
        ctx.fillStyle = '#000';
        ctx.fillRect(-p.w/2 + 5, -p.h/2 + 3, p.w - 10, p.h - 6);
        
        ctx.restore();
    });
    
    // Partículas
    particles.forEach(p => {
        ctx.globalAlpha = p.life / 30;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
    
    // Jugador
    ctx.shadowBlur = 25;
    ctx.shadowColor = frenzy > 50 ? '#ff0' : '#0ff';
    ctx.fillStyle = frenzy > 50 ? '#ff0' : '#0ff';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius * (1 + Math.sin(frame*0.2)*0.1), 0, Math.PI*2);
    ctx.fill();
    
    // Estela del jugador
    ctx.strokeStyle = `rgba(${frenzy>50?'255,255,0':'0,255,255'}, 0.3)`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x - player.vx*3, player.y - player.vy*3);
    ctx.stroke();
    
    ctx.restore();
}

function loop() {
    update();
    draw();
    if(gameActive) requestAnimationFrame(loop);
}

// Render inicial
draw();
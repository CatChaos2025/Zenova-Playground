const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Configuración de rendimiento
const MAX_PARTICULAS = 150; // Límite máximo de partículas
const MAX_TRAIL = 15;       // Longitud máxima del rastro

const estado = {
    modo: 'titulo',
    puntuacion: 0,
    record: parseInt(localStorage.getItem('fruitSlicerRecord')) || 0,
    vidas: 3,
    tiempo: 0,
    frutas: [],
    particulas: [],
    combo: 0,
    ultimoCorte: 0,
    frutasCortadas: 0
};

const tiposFruta = [
    { emoji: '🍎', color: '#ff3333', puntos: 10 },
    { emoji: '🍊', color: '#ff9933', puntos: 12 },
    { emoji: '🍋', color: '#ffcc33', puntos: 15 },
    { emoji: '🍉', color: '#ff6666', puntos: 20 },
    { emoji: '🍇', color: '#9933ff', puntos: 18 },
    { emoji: '🍓', color: '#ff3366', puntos: 15 },
    { emoji: '🥝', color: '#66cc33', puntos: 12 },
    { emoji: '🍍', color: '#ffcc00', puntos: 25 }
];

class Fruta {
    constructor() {
        const tipo = tiposFruta[Math.floor(Math.random() * tiposFruta.length)];
        this.emoji = tipo.emoji;
        this.color = tipo.color;
        this.puntos = tipo.puntos;
        this.radio = 25;
        
        this.x = Math.random() * (canvas.width - 100) + 50;
        this.y = canvas.height + 50;
        // Velocidad aleatoria pero controlada
        this.vx = (Math.random() - 0.5) * 3; 
        this.vy = -(Math.random() * 4 + 13); 
        this.gravedad = 0.2;
        this.rotacion = 0;
        this.velRotacion = (Math.random() - 0.5) * 0.15;
        this.cortada = false;
        this.activa = true;
    }
    
    actualizar() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravedad;
        this.rotacion += this.velRotacion;
        
        // Si cae fuera de la pantalla, marcar como inactiva
        if (this.y > canvas.height + 60) {
            this.activa = false;
            if (!this.cortada && !(this instanceof Bomba)) {
                perderVida();
            }
        }
    }
    
    dibujar() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotacion);
        ctx.font = '45px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, 0, 0);
        ctx.restore();
    }
}

class Bomba extends Fruta {
    constructor() {
        super();
        this.emoji = ''; // La dibujamos manualmente
        this.esBomba = true;
    }
    
    dibujar() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(0, 0, 28, 0, Math.PI * 2);
        ctx.fill();
        // Brillo
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.arc(-8, -8, 6, 0, Math.PI * 2);
        ctx.fill();
        // Mecha
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -28);
        ctx.lineTo(10, -40);
        ctx.stroke();
        // Chispa
        ctx.fillStyle = Math.random() > 0.5 ? '#ff6600' : '#ffff00';
        ctx.beginPath();
        ctx.arc(10, -40, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Particula {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.color = color;
        this.size = Math.random() * 6 + 2;
        this.life = 1.0;
        this.decay = Math.random() * 0.03 + 0.02; // Velocidad de desvanecimiento
    }
    
    actualizar() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.15; // Gravedad ligera
        this.life -= this.decay;
    }
    
    dibujar() {
        if (this.life <= 0) return;
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size); // Rect es más rápido que Arc
        ctx.globalAlpha = 1;
    }
}

// Input optimizado
const mouse = { x: 0, y: 0, down: false, trail: [] };

function handleInput(x, y, isDown) {
    mouse.x = x;
    mouse.y = y;
    mouse.down = isDown;
    
    if (isDown) {
        mouse.trail.push({ x, y });
        if (mouse.trail.length > MAX_TRAIL) mouse.trail.shift();
    } else {
        mouse.trail = [];
    }
}

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    handleInput(e.clientX - rect.left, e.clientY - rect.top, mouse.down);
});
canvas.addEventListener('mousedown', () => {
    mouse.down = true;
    if (estado.modo !== 'jugando') iniciarJuego();
});
canvas.addEventListener('mouseup', () => mouse.down = false);

// Touch support
canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    handleInput(t.clientX - rect.left, t.clientY - rect.top, true);
    if (estado.modo !== 'jugando') iniciarJuego();
}, {passive: false});

canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    handleInput(t.clientX - rect.left, t.clientY - rect.top, true);
}, {passive: false});

canvas.addEventListener('touchend', e => {
    e.preventDefault();
    mouse.down = false;
    mouse.trail = [];
});

function iniciarJuego() {
    estado.modo = 'jugando';
    estado.puntuacion = 0;
    estado.vidas = 3;
    estado.frutas = [];
    estado.particulas = [];
    estado.combo = 0;
    estado.frutasCortadas = 0;
    actualizarUI();
}

function perderVida() {
    estado.vidas--;
    actualizarUI();
    if (estado.vidas <= 0) gameOver();
}

function gameOver() {
    estado.modo = 'gameover';
    if (estado.puntuacion > estado.record) {
        estado.record = estado.puntuacion;
        localStorage.setItem('fruitSlicerRecord', estado.record);
    }
}

function crearExplosion(x, y, color, cantidad = 10) {
    for (let i = 0; i < cantidad; i++) {
        if (estado.particulas.length < MAX_PARTICULAS) {
            estado.particulas.push(new Particula(x, y, color));
        }
    }
}

function detectarCorte() {
    if (mouse.trail.length < 2) return;
    
    const p1 = mouse.trail[mouse.trail.length - 2];
    const p2 = mouse.trail[mouse.trail.length - 1];
    
    let cortesEnFrame = 0;

    estado.frutas.forEach(fruta => {
        if (!fruta.activa || fruta.cortada) return;
        
        // Colisión simple círculo-punto (más rápida que línea)
        const dist = Math.hypot(fruta.x - p2.x, fruta.y - p2.y);
        
        if (dist < fruta.radio + 10) {
            if (fruta.esBomba) {
                crearExplosion(fruta.x, fruta.y, '#ff0000', 30);
                fruta.activa = false;
                estado.vidas = 0; // Muerte instantánea o daño grande
                actualizarUI();
                gameOver();
            } else {
                fruta.cortada = true;
                fruta.activa = false;
                cortesEnFrame++;
                crearExplosion(fruta.x, fruta.y, fruta.color, 15);
                estado.puntuacion += fruta.puntos;
                estado.frutasCortadas++;
            }
        }
    });

    if (cortesEnFrame > 0) {
        const ahora = Date.now();
        if (ahora - estado.ultimoCorte < 400) estado.combo++;
        else estado.combo = 1;
        estado.ultimoCorte = ahora;
        estado.puntuacion += estado.combo * 5;
        actualizarUI();
    }
}

function actualizarUI() {
    document.getElementById('score').textContent = estado.puntuacion;
    document.getElementById('record').textContent = estado.record;
    document.getElementById('vidas').textContent = '❤️'.repeat(Math.max(0, estado.vidas));
}

function loop() {
    estado.tiempo++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fondo simple
    ctx.fillStyle = '#1a0a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (estado.modo === 'titulo') {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0,0,canvas.width, canvas.height);
        ctx.fillStyle = '#ff6600';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('FRUIT SLICER', canvas.width/2, canvas.height/2 - 20);
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText('Click para empezar', canvas.width/2, canvas.height/2 + 40);
        requestAnimationFrame(loop);
        return;
    }

    if (estado.modo === 'gameover') {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0,0,canvas.width, canvas.height);
        ctx.fillStyle = '#ff3333';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 20);
        ctx.fillStyle = '#fff';
        ctx.font = '30px Arial';
        ctx.fillText(`Puntos: ${estado.puntuacion}`, canvas.width/2, canvas.height/2 + 40);
        ctx.font = '20px Arial';
        ctx.fillText('Click para reiniciar', canvas.width/2, canvas.height/2 + 80);
        requestAnimationFrame(loop);
        return;
    }

    // Generar frutas
    if (estado.tiempo % 40 === 0 && Math.random() < 0.8) {
        estado.frutas.push(new Fruta());
    }
    if (estado.tiempo % 150 === 0 && Math.random() < 0.5) {
        estado.frutas.push(new Bomba());
    }

    // Actualizar y dibujar frutas
    estado.frutas = estado.frutas.filter(f => f.activa);
    estado.frutas.forEach(f => {
        f.actualizar();
        f.dibujar();
    });

    // Detectar cortes
    if (mouse.down) detectarCorte();

    // Dibujar Trail (Espada)
    if (mouse.trail.length > 1) {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffff';
        ctx.beginPath();
        ctx.moveTo(mouse.trail[0].x, mouse.trail[0].y);
        for (let i = 1; i < mouse.trail.length; i++) {
            ctx.lineTo(mouse.trail[i].x, mouse.trail[i].y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    // Actualizar y dibujar partículas
    estado.particulas = estado.particulas.filter(p => p.life > 0);
    estado.particulas.forEach(p => {
        p.actualizar();
        p.dibujar();
    });

    // Combo Text
    if (estado.combo > 1) {
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`COMBO x${estado.combo}`, canvas.width/2, 100);
    }

    requestAnimationFrame(loop);
}

document.getElementById('record').textContent = estado.record;
loop();
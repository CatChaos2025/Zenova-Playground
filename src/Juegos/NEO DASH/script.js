const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ============ CONSTANTES (AJUSTADAS PARA MAYOR VELOCIDAD) ============
const GRAVEDAD = 0.7;
const SALTO = -12;
const VELOCIDAD_BASE = 9; // Aumentado de 6 a 9
const SUELO_Y = canvas.height - 60;

// ============ ESTADO ============
const estado = {
    modo: 'titulo',
    puntuacion: 0,
    record: parseInt(localStorage.getItem('neoDashRecord')) || 0,
    velocidad: VELOCIDAD_BASE,
    tiempo: 0,
    jugador: null,
    obstaculos: [],
    particulas: [],
    fondoOffset: 0,
    spawnTimer: 0
};

// ============ JUGADOR ============
class Jugador {
    constructor() {
        this.x = 100;
        this.y = SUELO_Y - 30;
        this.size = 30;
        this.vy = 0;
        this.grounded = true;
        this.rotation = 0;
        this.trail = [];
    }

    actualizar() {
        this.vy += GRAVEDAD;
        this.y += this.vy;

        if (this.y + this.size >= SUELO_Y) {
            this.y = SUELO_Y - this.size;
            this.vy = 0;
            this.grounded = true;
            this.rotation = Math.round(this.rotation / (Math.PI / 2)) * (Math.PI / 2);
        } else {
            this.grounded = false;
            this.rotation += 0.2; // Rotación más rápida
        }

        this.trail.push({ x: this.x, y: this.y, rotation: this.rotation, alpha: 1 });
        if (this.trail.length > 8) this.trail.shift();
        this.trail.forEach(t => t.alpha -= 0.12);
    }

    saltar() {
        if (this.grounded) {
            this.vy = SALTO;
            this.grounded = false;
            crearParticulas(this.x + this.size/2, this.y + this.size, '#00ffff', 10);
        }
    }

    dibujar() {
        this.trail.forEach(t => {
            if (t.alpha <= 0) return;
            ctx.save();
            ctx.translate(t.x + this.size/2, t.y + this.size/2);
            ctx.rotate(t.rotation);
            ctx.fillStyle = `rgba(0, 255, 255, ${t.alpha * 0.3})`;
            ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
            ctx.restore();
        });

        ctx.save();
        ctx.translate(this.x + this.size/2, this.y + this.size/2);
        ctx.rotate(this.rotation);
        
        ctx.fillStyle = '#00ffff';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffff';
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000';
        ctx.fillRect(2, -8, 6, 6);
        ctx.fillRect(2, 2, 6, 6);
        
        ctx.restore();
    }
}

// ============ OBSTÁCULOS ============
class Obstaculo {
    constructor(x, tipo) {
        this.x = x;
        this.tipo = tipo;
        this.width = 30;
        this.height = 30;
        this.y = SUELO_Y - this.height;
        this.pasado = false;
    }

    actualizar() {
        this.x -= estado.velocidad;
    }

    dibujar() {
        ctx.fillStyle = '#ff0055';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff0055';

        if (this.tipo === 'pincho') {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + this.height);
            ctx.lineTo(this.x + this.width/2, this.y);
            ctx.lineTo(this.x + this.width, this.y + this.height);
            ctx.closePath();
            ctx.fill();
        } else if (this.tipo === 'doble_pincho') {
            this.width = 60;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + this.height);
            ctx.lineTo(this.x + 15, this.y);
            ctx.lineTo(this.x + 30, this.y + this.height);
            ctx.lineTo(this.x + 45, this.y);
            ctx.lineTo(this.x + 60, this.y + this.height);
            ctx.closePath();
            ctx.fill();
        } else if (this.tipo === 'muro') {
            this.height = 50;
            this.y = SUELO_Y - this.height;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = '#ff3377';
            ctx.fillRect(this.x + 5, this.y + 5, this.width - 10, this.height - 10);
        }

        ctx.shadowBlur = 0;
    }

    getHitbox() {
        if (this.tipo === 'pincho' || this.tipo === 'doble_pincho') {
            return {
                x: this.x + 5,
                y: this.y + 10,
                width: this.width - 10,
                height: this.height - 10
            };
        }
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

// ============ PARTÍCULAS ============
class Particula {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.color = color;
        this.size = Math.random() * 4 + 2;
        this.life = 1;
    }

    actualizar() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.03;
        this.size *= 0.95;
    }

    dibujar() {
        if (this.life <= 0) return;
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

function crearParticulas(x, y, color, cantidad) {
    for (let i = 0; i < cantidad; i++) {
        estado.particulas.push(new Particula(x, y, color));
    }
}

// ============ LÓGICA DEL JUEGO ============
function iniciarJuego() {
    estado.modo = 'jugando';
    estado.puntuacion = 0;
    estado.velocidad = VELOCIDAD_BASE;
    estado.tiempo = 0;
    estado.spawnTimer = 0;
    estado.jugador = new Jugador();
    estado.obstaculos = [];
    estado.particulas = [];
    actualizarUI();
}

function generarObstaculo() {
    const tipos = ['pincho', 'pincho', 'doble_pincho', 'muro'];
    const tipo = tipos[Math.floor(Math.random() * tipos.length)];
    estado.obstaculos.push(new Obstaculo(canvas.width + 50, tipo));
}

function verificarColisiones() {
    const j = estado.jugador;
    const jBox = {
        x: j.x + 5,
        y: j.y + 5,
        width: j.size - 10,
        height: j.size - 10
    };

    for (let obs of estado.obstaculos) {
        const oBox = obs.getHitbox();
        
        if (jBox.x < oBox.x + oBox.width &&
            jBox.x + jBox.width > oBox.x &&
            jBox.y < oBox.y + oBox.height &&
            jBox.y + jBox.height > oBox.y) {
            
            gameOver();
            return;
        }
    }
}

function gameOver() {
    estado.modo = 'gameover';
    crearParticulas(estado.jugador.x + 15, estado.jugador.y + 15, '#00ffff', 40);
    crearParticulas(estado.jugador.x + 15, estado.jugador.y + 15, '#ff0055', 30);
    
    if (estado.puntuacion > estado.record) {
        estado.record = estado.puntuacion;
        localStorage.setItem('neoDashRecord', estado.record);
    }
    actualizarUI();
}

function actualizarUI() {
    document.getElementById('score').textContent = estado.puntuacion;
    document.getElementById('record').textContent = estado.record;
}

// ============ DIBUJO ============
function dibujarFondo() {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#0a0a1a');
    grad.addColorStop(1, '#1a0a2e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    estado.fondoOffset = (estado.fondoOffset - estado.velocidad * 0.5) % 40;
    ctx.strokeStyle = 'rgba(255, 0, 255, 0.1)';
    ctx.lineWidth = 1;
    
    for (let x = estado.fondoOffset; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    ctx.fillStyle = '#1a1a3e';
    ctx.fillRect(0, SUELO_Y, canvas.width, canvas.height - SUELO_Y);
    
    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff00ff';
    ctx.beginPath();
    ctx.moveTo(0, SUELO_Y);
    ctx.lineTo(canvas.width, SUELO_Y);
    ctx.stroke();
    ctx.shadowBlur = 0;
}

function dibujarTitulo() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.font = 'bold 60px Courier New';
    ctx.fillStyle = '#00ffff';
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#00ffff';
    ctx.fillText('NEO DASH', cx, cy - 30);
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = '#ff00ff';
    ctx.font = '20px Courier New';
    ctx.fillText('Evita los obstáculos rojos', cx, cy + 20);
    
    const alpha = 0.5 + Math.sin(estado.tiempo * 0.08) * 0.5;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px Courier New';
    ctx.fillText('Presiona ESPACIO o CLICK', cx, cy + 70);
    ctx.globalAlpha = 1;
    
    if (estado.record > 0) {
        ctx.fillStyle = '#ffd700';
        ctx.font = '16px Courier New';
        ctx.fillText(`🏆 Récord: ${estado.record}`, cx, cy + 110);
    }
}

function dibujarGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.font = 'bold 50px Courier New';
    ctx.fillStyle = '#ff0055';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff0055';
    ctx.fillText('¡CHOCASTE!', cx, cy - 40);
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = '#fff';
    ctx.font = '24px Courier New';
    ctx.fillText(`Puntuación: ${estado.puntuacion}`, cx, cy + 10);
    
    if (estado.puntuacion >= estado.record && estado.puntuacion > 0) {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 20px Courier New';
        ctx.fillText('🏆 ¡NUEVO RÉCORD!', cx, cy + 45);
    }
    
    const alpha = 0.5 + Math.sin(estado.tiempo * 0.08) * 0.5;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 18px Courier New';
    ctx.fillText('Presiona ESPACIO o CLICK', cx, cy + 90);
    ctx.globalAlpha = 1;
}

// ============ INPUT ============
function manejarInput(e) {
    if (e.type === 'keydown' && e.code !== 'Space' && e.code !== 'ArrowUp') return;
    if (e.type === 'keydown') e.preventDefault();

    if (estado.modo === 'titulo') {
        iniciarJuego();
    } else if (estado.modo === 'jugando') {
        estado.jugador.saltar();
    } else if (estado.modo === 'gameover') {
        estado.modo = 'titulo';
    }
}

window.addEventListener('keydown', manejarInput);
canvas.addEventListener('mousedown', manejarInput);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    manejarInput(e);
}, { passive: false });

// ============ LOOP PRINCIPAL ============
function loop() {
    estado.tiempo++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    dibujarFondo();
    
    if (estado.modo === 'titulo') {
        dibujarTitulo();
        requestAnimationFrame(loop);
        return;
    }
    
    if (estado.modo === 'jugando') {
        // Aumentar dificultad MÁS RÁPIDO
        estado.velocidad = VELOCIDAD_BASE + Math.floor(estado.puntuacion / 50) * 0.8;
        
        if (estado.tiempo % 10 === 0) {
            estado.puntuacion++;
            actualizarUI();
        }
        
        // Generar obstáculos MÁS FRECUENTES
        estado.spawnTimer++;
        const intervaloSpawn = Math.max(30, 60 - estado.puntuacion / 8); // Más rápido
        if (estado.spawnTimer > intervaloSpawn) {
            generarObstaculo();
            estado.spawnTimer = 0;
        }
        
        estado.jugador.actualizar();
        estado.obstaculos.forEach(o => o.actualizar());
        estado.obstaculos = estado.obstaculos.filter(o => o.x + o.width > -50);
        
        estado.particulas.forEach(p => p.actualizar());
        estado.particulas = estado.particulas.filter(p => p.life > 0);
        
        verificarColisiones();
    }
    
    estado.obstaculos.forEach(o => o.dibujar());
    if (estado.modo === 'jugando') {
        estado.jugador.dibujar();
    }
    estado.particulas.forEach(p => p.dibujar());
    
    if (estado.modo === 'gameover') {
        dibujarGameOver();
    }
    
    requestAnimationFrame(loop);
}

// ============ INICIO ============
actualizarUI();
loop();
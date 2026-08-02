const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ============ ESTADO ============
const estado = {
    modo: 'titulo',
    puntuacion: 0,
    record: parseInt(localStorage.getItem('neonBreakerRecord')) || 0,
    vidas: 3,
    nivel: 1,
    combo: 1,
    tiempoCombo: 0,
    tiempo: 0,
    paleta: null,
    bolas: [],
    bloques: [],
    powerups: [],
    particulas: [],
    paletaAncha: false,
    tiempoPaletaAncha: 0
};

// ============ COLORES NEÓN ============
const coloresNeon = [
    { color: '#ff0066', puntos: 10 },
    { color: '#ff6600', puntos: 15 },
    { color: '#ffff00', puntos: 20 },
    { color: '#00ff66', puntos: 25 },
    { color: '#00ffff', puntos: 30 },
    { color: '#0066ff', puntos: 35 },
    { color: '#ff00ff', puntos: 40 }
];

// ============ CLASE PALETA ============
class Paleta {
    constructor() {
        this.width = 100;
        this.height = 15;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - 40;
        this.velocidad = 8;
        this.trail = [];
    }
    
    actualizar() {
        if (teclas['ArrowLeft'] || teclas['a']) {
            this.x -= this.velocidad;
        }
        if (teclas['ArrowRight'] || teclas['d']) {
            this.x += this.velocidad;
        }
        
        this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
        
        this.trail.push({ x: this.x + this.width/2, y: this.y + this.height/2 });
        if (this.trail.length > 8) this.trail.shift();
    }
    
    dibujar() {
        this.trail.forEach((t, i) => {
            ctx.globalAlpha = i / this.trail.length * 0.3;
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(t.x - this.width/2, t.y - this.height/2, this.width, this.height);
        });
        ctx.globalAlpha = 1;
        
        ctx.fillStyle = '#ff00ff';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff00ff';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(this.x, this.y, this.width, 3);
        
        ctx.shadowBlur = 0;
    }
}

// ============ CLASE BOLA ============
class Bola {
    constructor(x, y) {
        this.x = x || canvas.width / 2;
        this.y = y || canvas.height - 60;
        this.radio = 8;
        this.vx = 0;
        this.vy = 0;
        this.velocidad = 6;
        this.lanzada = false;
        this.color = '#00ffff';
    }
    
    actualizar() {
        if (!this.lanzada) {
            this.x = estado.paleta.x + estado.paleta.width / 2;
            this.y = estado.paleta.y - this.radio - 5;
            return;
        }
        
        this.x += this.vx;
        this.y += this.vy;
        
        // Colisiones con paredes
        if (this.x - this.radio < 0) {
            this.x = this.radio;
            this.vx *= -1;
            crearParticulas(this.x, this.y, this.color, 5);
        }
        if (this.x + this.radio > canvas.width) {
            this.x = canvas.width - this.radio;
            this.vx *= -1;
            crearParticulas(this.x, this.y, this.color, 5);
        }
        if (this.y - this.radio < 0) {
            this.y = this.radio;
            this.vy *= -1;
            crearParticulas(this.x, this.y, this.color, 5);
        }
        
        // Colisión con paleta
        if (this.vy > 0 && 
            this.y + this.radio > estado.paleta.y &&
            this.y - this.radio < estado.paleta.y + estado.paleta.height &&
            this.x > estado.paleta.x &&
            this.x < estado.paleta.x + estado.paleta.width) {
            
            this.y = estado.paleta.y - this.radio;
            this.vy *= -1;
            
            const posicionRelativa = (this.x - estado.paleta.x) / estado.paleta.width;
            this.vx = (posicionRelativa - 0.5) * this.velocidad * 1.5;
            
            const magnitud = Math.hypot(this.vx, this.vy);
            this.vx = (this.vx / magnitud) * this.velocidad;
            this.vy = (this.vy / magnitud) * this.velocidad;
            
            crearParticulas(this.x, this.y, '#ff00ff', 8);
            estado.combo = 1;
            actualizarUI();
        }
        
        // Colisión con bloques
        this.colisionBloques();
    }
    
    colisionBloques() {
        for (let i = estado.bloques.length - 1; i >= 0; i--) {
            const bloque = estado.bloques[i];
            
            if (this.x + this.radio > bloque.x &&
                this.x - this.radio < bloque.x + bloque.width &&
                this.y + this.radio > bloque.y &&
                this.y - this.radio < bloque.y + bloque.height) {
                
                const overlapLeft = (this.x + this.radio) - bloque.x;
                const overlapRight = (bloque.x + bloque.width) - (this.x - this.radio);
                const overlapTop = (this.y + this.radio) - bloque.y;
                const overlapBottom = (bloque.y + bloque.height) - (this.y - this.radio);
                
                const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
                
                if (minOverlap === overlapLeft || minOverlap === overlapRight) {
                    this.vx *= -1;
                } else {
                    this.vy *= -1;
                }
                
                bloque.vida--;
                crearParticulas(this.x, this.y, bloque.color, 10);
                
                if (bloque.vida <= 0) {
                    estado.combo++;
                    estado.tiempoCombo = 120;
                    const puntos = bloque.puntos * estado.combo;
                    estado.puntuacion += puntos;
                    
                    crearExplosion(bloque.x + bloque.width/2, bloque.y + bloque.height/2, bloque.color, 20);
                    
                    if (Math.random() < 0.15) {
                        soltarPowerUp(bloque.x + bloque.width/2, bloque.y + bloque.height/2);
                    }
                    
                    estado.bloques.splice(i, 1);
                    actualizarUI();
                }
                
                break;
            }
        }
    }
    
    dibujar() {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radio, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(this.x - 2, this.y - 2, this.radio/3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
    }
}

// ============ CLASE BLOQUE ============
class Bloque {
    constructor(x, y, width, height, color, puntos, vida = 1) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.puntos = puntos;
        this.vida = vida;
        this.vidaMax = vida;
    }
    
    dibujar() {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(this.x, this.y, this.width, 3);
        
        if (this.vidaMax > 1) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.vida, this.x + this.width/2, this.y + this.height/2);
        }
        
        ctx.shadowBlur = 0;
    }
}

// ============ CLASE POWER-UP ============
class PowerUp {
    constructor(x, y, tipo) {
        this.x = x;
        this.y = y;
        this.tipo = tipo;
        this.width = 25;
        this.height = 25;
        this.velocidad = 2.5;
        this.activa = true;
        this.anim = 0;
    }
    
    actualizar() {
        this.y += this.velocidad;
        this.anim += 0.1;
        
        if (this.y > canvas.height) {
            this.activa = false;
            return;
        }
        
        if (this.y + this.height > estado.paleta.y &&
            this.y < estado.paleta.y + estado.paleta.height &&
            this.x + this.width > estado.paleta.x &&
            this.x < estado.paleta.x + estado.paleta.width) {
            
            this.activa = false;
            aplicarPowerUp(this.tipo);
            crearParticulas(this.x + this.width/2, this.y + this.height/2, '#ffffff', 15);
        }
    }
    
    dibujar() {
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.anim);
        
        let color, simbolo;
        if (this.tipo === 'vida') {
            color = '#00ff00';
            simbolo = '+';
        } else if (this.tipo === 'ancha') {
            color = '#ffff00';
            simbolo = '↔';
        } else if (this.tipo === 'bola') {
            color = '#ff00ff';
            simbolo = '●';
        } else if (this.tipo === 'velocidad') {
            color = '#00ffff';
            simbolo = '⚡';
        }
        
        ctx.fillStyle = color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(simbolo, 0, 0);
        
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

// ============ CLASE PARTÍCULA ============
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
        this.vy += 0.1;
        this.life -= 0.03;
        this.size *= 0.97;
    }
    
    dibujar() {
        if (this.life <= 0) return;
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

// ============ FUNCIONES AUXILIARES ============
function crearParticulas(x, y, color, cantidad) {
    for (let i = 0; i < cantidad; i++) {
        if (estado.particulas.length < 200) {
            estado.particulas.push(new Particula(x, y, color));
        }
    }
}

function crearExplosion(x, y, color, cantidad) {
    for (let i = 0; i < cantidad; i++) {
        if (estado.particulas.length < 200) {
            const p = new Particula(x, y, color);
            p.vx = (Math.random() - 0.5) * 12;
            p.vy = (Math.random() - 0.5) * 12;
            estado.particulas.push(p);
        }
    }
}

function soltarPowerUp(x, y) {
    const tipos = ['vida', 'ancha', 'bola', 'velocidad'];
    const tipo = tipos[Math.floor(Math.random() * tipos.length)];
    estado.powerups.push(new PowerUp(x - 12, y, tipo));
}

function aplicarPowerUp(tipo) {
    if (tipo === 'vida') {
        estado.vidas = Math.min(5, estado.vidas + 1);
    } else if (tipo === 'ancha') {
        estado.paletaAncha = true;
        estado.tiempoPaletaAncha = 600;
        estado.paleta.width = 150;
    } else if (tipo === 'bola') {
        const nuevaBola = new Bola(estado.paleta.x + estado.paleta.width/2, estado.paleta.y - 20);
        nuevaBola.lanzada = true;
        nuevaBola.vx = (Math.random() - 0.5) * 6;
        nuevaBola.vy = -6;
        estado.bolas.push(nuevaBola);
    } else if (tipo === 'velocidad') {
        estado.bolas.forEach(b => {
            b.velocidad = Math.min(10, b.velocidad + 1);
        });
    }
    actualizarUI();
}

function generarNivel(nivel) {
    estado.bloques = [];
    
    const filas = Math.min(4 + nivel, 8);
    const columnas = 10;
    const bloqueWidth = 70;
    const bloqueHeight = 25;
    const padding = 5;
    const offsetX = (canvas.width - (columnas * (bloqueWidth + padding))) / 2;
    const offsetY = 80;
    
    for (let fila = 0; fila < filas; fila++) {
        for (let col = 0; col < columnas; col++) {
            const colorData = coloresNeon[fila % coloresNeon.length];
            const vida = fila < 2 && nivel > 2 ? 2 : 1;
            
            const bloque = new Bloque(
                offsetX + col * (bloqueWidth + padding),
                offsetY + fila * (bloqueHeight + padding),
                bloqueWidth,
                bloqueHeight,
                colorData.color,
                colorData.puntos,
                vida
            );
            
            estado.bloques.push(bloque);
        }
    }
}

function iniciarJuego() {
    estado.modo = 'jugando';
    estado.puntuacion = 0;
    estado.vidas = 3;
    estado.nivel = 1;
    estado.combo = 1;
    estado.paleta = new Paleta();
    estado.bolas = [new Bola()];
    estado.powerups = [];
    estado.particulas = [];
    estado.paletaAncha = false;
    estado.tiempoPaletaAncha = 0;
    generarNivel(1);
    actualizarUI();
}

function siguienteNivel() {
    estado.nivel++;
    estado.bolas = [new Bola()];
    estado.powerups = [];
    estado.paleta.width = 100;
    estado.paletaAncha = false;
    estado.paleta.x = canvas.width / 2 - estado.paleta.width / 2;
    generarNivel(estado.nivel);
    actualizarUI();
}

function perderVida() {
    estado.vidas--;
    actualizarUI();
    
    if (estado.vidas <= 0) {
        estado.modo = 'gameover';
        if (estado.puntuacion > estado.record) {
            estado.record = estado.puntuacion;
            localStorage.setItem('neonBreakerRecord', estado.record);
            actualizarUI();
        }
    } else {
        estado.bolas = [new Bola()];
        estado.paleta.width = 100;
        estado.paletaAncha = false;
        estado.paleta.x = canvas.width / 2 - estado.paleta.width / 2;
    }
}

function actualizarUI() {
    document.getElementById('score').textContent = estado.puntuacion;
    document.getElementById('nivel').textContent = estado.nivel;
    document.getElementById('vidas').textContent = '❤️'.repeat(Math.max(0, estado.vidas));
    document.getElementById('combo').textContent = `x${estado.combo}`;
    document.getElementById('record').textContent = estado.record;
}

// ============ INPUT ============
const teclas = {};
window.addEventListener('keydown', (e) => {
    teclas[e.key] = true;
    
    if (estado.modo === 'titulo' && e.key === ' ') {
        iniciarJuego();
        e.preventDefault();
    }
    
    if ((estado.modo === 'gameover' || estado.modo === 'victoria') && e.key === ' ') {
        estado.modo = 'titulo';
        e.preventDefault();
    }
    
    if (estado.modo === 'jugando') {
        if (e.key === ' ') {
            estado.bolas.forEach(b => {
                if (!b.lanzada) {
                    b.lanzada = true;
                    b.vx = (Math.random() - 0.5) * 4;
                    b.vy = -b.velocidad;
                }
            });
            e.preventDefault();
        }
        if (e.key === 'p' || e.key === 'P') {
            estado.modo = 'pausado';
        }
    }
    
    if (estado.modo === 'pausado' && (e.key === 'p' || e.key === 'P')) {
        estado.modo = 'jugando';
    }
});

window.addEventListener('keyup', (e) => {
    teclas[e.key] = false;
});

// ============ LOOP PRINCIPAL ============
function loop() {
    estado.tiempo++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fondo
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#0a0015');
    grad.addColorStop(1, '#1a0033');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Grid de fondo
    ctx.strokeStyle = 'rgba(255, 0, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
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
    
    if (estado.modo === 'titulo') {
        dibujarTitulo();
        requestAnimationFrame(loop);
        return;
    }
    
    if (estado.modo === 'gameover') {
        dibujarGameOver();
        requestAnimationFrame(loop);
        return;
    }
    
    if (estado.modo === 'victoria') {
        dibujarVictoria();
        requestAnimationFrame(loop);
        return;
    }
    
    if (estado.modo === 'pausado') {
        // Dibujar estado del juego congelado
        estado.bloques.forEach(b => b.dibujar());
        estado.powerups.forEach(p => p.dibujar());
        estado.paleta.dibujar();
        estado.bolas.forEach(b => b.dibujar());
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 50px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSA', canvas.width/2, canvas.height/2);
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText('Presiona P para continuar', canvas.width/2, canvas.height/2 + 40);
        requestAnimationFrame(loop);
        return;
    }
    
    // ============ MODO JUGANDO ============
    estado.paleta.actualizar();
    
    if (estado.paletaAncha) {
        estado.tiempoPaletaAncha--;
        if (estado.tiempoPaletaAncha <= 0) {
            estado.paletaAncha = false;
            estado.paleta.width = 100;
            estado.paleta.x = Math.min(estado.paleta.x, canvas.width - estado.paleta.width);
        }
    }
    
    if (estado.tiempoCombo > 0) {
        estado.tiempoCombo--;
        if (estado.tiempoCombo === 0) {
            estado.combo = 1;
            actualizarUI();
        }
    }
    
    estado.bolas.forEach(b => b.actualizar());
    estado.powerups.forEach(p => p.actualizar());
    estado.particulas.forEach(p => p.actualizar());
    
    // Eliminar bolas perdidas
    estado.bolas = estado.bolas.filter(b => b.y - b.radio <= canvas.height);
    
    if (estado.bolas.length === 0) {
        perderVida();
    }
    
    estado.powerups = estado.powerups.filter(p => p.activa);
    estado.particulas = estado.particulas.filter(p => p.life > 0);
    
    // Verificar victoria
    if (estado.bloques.length === 0 && estado.modo === 'jugando') {
        if (estado.nivel >= 5) {
            estado.modo = 'victoria';
            if (estado.puntuacion > estado.record) {
                estado.record = estado.puntuacion;
                localStorage.setItem('neonBreakerRecord', estado.record);
                actualizarUI();
            }
        } else {
            siguienteNivel();
        }
    }
    
    // Dibujar todo
    estado.bloques.forEach(b => b.dibujar());
    estado.powerups.forEach(p => p.dibujar());
    estado.paleta.dibujar();
    estado.bolas.forEach(b => b.dibujar());
    estado.particulas.forEach(p => p.dibujar());
    
    if (estado.combo > 1) {
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffff00';
        ctx.fillText(`COMBO x${estado.combo}`, canvas.width/2, 50);
        ctx.shadowBlur = 0;
    }
    
    requestAnimationFrame(loop);
}

function dibujarTitulo() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.font = 'bold 70px Arial';
    ctx.fillStyle = '#ff00ff';
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ff00ff';
    ctx.fillText('NEON', cx, cy - 60);
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.fillText('BREAKER', cx, cy + 20);
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText('Rompe todos los bloques', cx, cy + 80);
    
    const alpha = 0.5 + Math.sin(estado.tiempo * 0.05) * 0.5;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffff00';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Presiona ESPACIO para comenzar', cx, cy + 130);
    ctx.globalAlpha = 1;
    
    if (estado.record > 0) {
        ctx.fillStyle = '#ffd700';
        ctx.font = '18px Arial';
        ctx.fillText(`🏆 Récord: ${estado.record}`, cx, cy + 170);
    }
    
    ctx.restore();
}

function dibujarGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.fillStyle = '#ff0066';
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ff0066';
    ctx.font = 'bold 60px Arial';
    ctx.fillText('GAME OVER', cx, cy - 40);
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = '#fff';
    ctx.font = '30px Arial';
    ctx.fillText(`Puntuación: ${estado.puntuacion}`, cx, cy + 20);
    
    ctx.fillStyle = '#00ffff';
    ctx.font = '20px Arial';
    ctx.fillText(`Nivel alcanzado: ${estado.nivel}`, cx, cy + 60);
    
    if (estado.puntuacion >= estado.record && estado.puntuacion > 0) {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('🏆 ¡NUEVO RÉCORD!', cx, cy + 100);
    }
    
    const alpha = 0.5 + Math.sin(estado.tiempo * 0.05) * 0.5;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffff00';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('Presiona ESPACIO para continuar', cx, cy + 150);
    ctx.globalAlpha = 1;
    
    ctx.restore();
}

function dibujarVictoria() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.fillStyle = '#ffd700';
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ffd700';
    ctx.font = 'bold 60px Arial';
    ctx.fillText('¡VICTORIA!', cx, cy - 40);
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText('¡Has completado todos los niveles!', cx, cy + 20);
    
    ctx.fillStyle = '#00ffff';
    ctx.font = '30px Arial';
    ctx.fillText(`Puntuación final: ${estado.puntuacion}`, cx, cy + 60);
    
    const alpha = 0.5 + Math.sin(estado.tiempo * 0.05) * 0.5;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffff00';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('Presiona ESPACIO para jugar de nuevo', cx, cy + 120);
    ctx.globalAlpha = 1;
    
    ctx.restore();
}

// ============ INICIO ============
actualizarUI();
loop();
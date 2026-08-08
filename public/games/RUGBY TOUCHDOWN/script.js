const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const estado = {
    modo: 'titulo',
    yardas: 0,
    touchdowns: 0,
    vidas: 3,
    record: parseInt(localStorage.getItem('rugbyRecord')) || 0,
    tiempo: 0,
    jugador: null,
    rivales: [],
    lineaMeta: 550,
    particulas: [],
    energia: 100,
    shake: 0,
    posicionAnterior: 50 // Para calcular avance real
};

class Jugador {
    constructor() {
        this.x = 50;
        this.y = 200;
        this.width = 30;
        this.height = 40;
        this.vx = 0;
        this.vy = 0;
        this.velocidad = 4;
        this.animacion = 0;
    }
    
    actualizar() {
        this.animacion++;
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.9;
        this.vy *= 0.9;
        
        this.x = Math.max(10, Math.min(canvas.width - this.width - 10, this.x));
        this.y = Math.max(50, Math.min(canvas.height - this.height - 10, this.y));
    }
    
    dibujar() {
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(0, 22, 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Cuerpo
        ctx.fillStyle = '#F44336';
        ctx.fillRect(-12, -10, 24, 25);
        
        // Número
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('7', 0, 2);
        
        // Cabeza
        ctx.fillStyle = '#FFCCBC';
        ctx.beginPath();
        ctx.arc(0, -18, 9, 0, Math.PI * 2);
        ctx.fill();
        
        // Casco
        ctx.fillStyle = '#F44336';
        ctx.beginPath();
        ctx.arc(0, -21, 9, Math.PI, 0);
        ctx.fill();
        
        // Balón
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(15, -5, 8, 5, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(12, -5);
        ctx.lineTo(18, -5);
        ctx.stroke();
        
        // Piernas animadas
        ctx.fillStyle = '#FFF';
        const piernaAnim = Math.sin(this.animacion * 0.3) * 3;
        ctx.fillRect(-8, 15, 6, 10 + piernaAnim);
        ctx.fillRect(2, 15, 6, 10 - piernaAnim);
        
        ctx.restore();
    }
    
    getHitbox() {
        return {
            x: this.x + 5,
            y: this.y + 5,
            width: this.width - 10,
            height: this.height - 10
        };
    }
}

class Rival {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 40;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.activa = true;
        this.animacion = Math.random() * Math.PI * 2;
    }
    
    actualizar() {
        this.animacion += 0.1;
        
        // Perseguir al jugador
        const dx = estado.jugador.x - this.x;
        const dy = estado.jugador.y - this.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist > 0) {
            this.vx += (dx / dist) * 0.1;
            this.vy += (dy / dist) * 0.1;
        }
        
        this.vx *= 0.95;
        this.vy *= 0.95;
        
        this.x += this.vx;
        this.y += this.vy;
    }
    
    dibujar() {
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(0, 22, 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Cuerpo
        ctx.fillStyle = '#2196F3';
        ctx.fillRect(-12, -10, 24, 25);
        
        // Número
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('X', 0, 2);
        
        // Cabeza
        ctx.fillStyle = '#FFCCBC';
        ctx.beginPath();
        ctx.arc(0, -18, 9, 0, Math.PI * 2);
        ctx.fill();
        
        // Casco
        ctx.fillStyle = '#2196F3';
        ctx.beginPath();
        ctx.arc(0, -21, 9, Math.PI, 0);
        ctx.fill();
        
        // Piernas
        ctx.fillStyle = '#FFF';
        const piernaAnim = Math.sin(this.animacion) * 3;
        ctx.fillRect(-8, 15, 6, 10 + piernaAnim);
        ctx.fillRect(2, 15, 6, 10 - piernaAnim);
        
        ctx.restore();
    }
    
    getHitbox() {
        return {
            x: this.x + 5,
            y: this.y + 5,
            width: this.width - 10,
            height: this.height - 10
        };
    }
}

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
        this.vy += 0.2;
        this.life -= 0.03;
    }
    
    dibujar() {
        if (this.life <= 0) return;
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

function crearExplosion(x, y, color, cantidad) {
    for (let i = 0; i < cantidad; i++) {
        estado.particulas.push(new Particula(x, y, color));
    }
}

function generarRivales() {
    if (estado.tiempo % 120 === 0 && estado.rivales.length < 5) {
        const x = Math.random() < 0.5 ? -30 : canvas.width + 30;
        const y = 50 + Math.random() * (canvas.height - 100);
        estado.rivales.push(new Rival(x, y));
    }
}

function verificarColisiones() {
    const jHitbox = estado.jugador.getHitbox();
    
    for (let rival of estado.rivales) {
        if (!rival.activa) continue;
        const rHitbox = rival.getHitbox();
        
        if (jHitbox.x < rHitbox.x + rHitbox.width &&
            jHitbox.x + jHitbox.width > rHitbox.x &&
            jHitbox.y < rHitbox.y + rHitbox.height &&
            jHitbox.y + jHitbox.height > rHitbox.y) {
            
            rival.activa = false;
            estado.vidas--;
            estado.shake = 10;
            crearExplosion(estado.jugador.x, estado.jugador.y, '#F44336', 20);
            
            // Retroceder jugador (NO resetear yardas)
            estado.jugador.x = Math.max(50, estado.jugador.x - 80);
            estado.jugador.y = 200;
            estado.posicionAnterior = estado.jugador.x;
            
            if (estado.vidas <= 0) {
                gameOver();
            }
            actualizarUI();
        }
    }
    
    // Touchdown
    if (estado.jugador.x >= estado.lineaMeta) {
        touchdown();
    }
}

function touchdown() {
    estado.touchdowns++;
    estado.yardas += 50; // Bonus por touchdown
    crearExplosion(estado.lineaMeta, estado.jugador.y, '#FFD700', 40);
    estado.shake = 15;
    
    // Reset posición
    estado.jugador.x = 50;
    estado.jugador.y = 200;
    estado.posicionAnterior = 50;
    estado.rivales = [];
    
    actualizarUI();
}

function gameOver() {
    estado.modo = 'gameover';
    crearExplosion(estado.jugador.x, estado.jugador.y, '#F44336', 40);
    estado.shake = 20;
    
    // Récord solo se actualiza al FINAL del juego
    const yardasFinales = Math.floor(estado.yardas);
    if (yardasFinales > estado.record) {
        estado.record = yardasFinales;
        localStorage.setItem('rugbyRecord', estado.record);
    }
    actualizarUI();
}

function iniciarJuego() {
    estado.modo = 'jugando';
    estado.yardas = 0;
    estado.touchdowns = 0;
    estado.vidas = 3;
    estado.tiempo = 0;
    estado.rivales = [];
    estado.particulas = [];
    estado.jugador = new Jugador();
    estado.posicionAnterior = 50;
    estado.energia = 100;
    actualizarUI();
}

function actualizarUI() {
    document.getElementById('yardas').textContent = Math.floor(estado.yardas);
    document.getElementById('touchdowns').textContent = estado.touchdowns;
    document.getElementById('vidas').textContent = '❤️'.repeat(Math.max(0, estado.vidas));
    document.getElementById('record').textContent = estado.record;
}

const teclas = {};
window.addEventListener('keydown', (e) => {
    teclas[e.key] = true;
    
    if (estado.modo === 'titulo' && e.code === 'Space') {
        iniciarJuego();
        e.preventDefault();
    }
    if (estado.modo === 'gameover' && e.code === 'Space') {
        estado.modo = 'titulo';
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    teclas[e.key] = false;
});

canvas.addEventListener('click', () => {
    if (estado.modo === 'titulo') iniciarJuego();
    else if (estado.modo === 'gameover') estado.modo = 'titulo';
});

function dibujarFondo() {
    // Campo de rugby
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Líneas de yardas
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2;
    for (let x = 50; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // Números de yardas
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    for (let i = 1; i <= 10; i++) {
        ctx.fillText(i * 10, i * 50, 30);
    }
    
    // Línea de meta
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(estado.lineaMeta, 0, 10, canvas.height);
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('META', estado.lineaMeta + 5, canvas.height / 2);
}

function dibujarTitulo() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    
    // Balón decorativo
    ctx.save();
    ctx.translate(cx, cy - 80);
    ctx.rotate(estado.tiempo * 0.02);
    
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.ellipse(0, 0, 25, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.lineTo(15, 0);
    ctx.stroke();
    
    ctx.restore();
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.font = 'bold 50px Arial';
    ctx.fillStyle = '#FFF';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.strokeText('RUGBY', cx, cy + 20);
    ctx.fillText('RUGBY', cx, cy + 20);
    ctx.strokeText('TOUCHDOWN', cx, cy + 70);
    ctx.fillText('TOUCHDOWN', cx, cy + 70);
    
    ctx.font = '14px Arial';
    ctx.fillStyle = '#FFF';
    ctx.fillText('Llega a la meta esquivando rivales', cx, cy + 110);
    
    const alpha = 0.5 + Math.sin(estado.tiempo * 0.08) * 0.5;
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('CLICK o ESPACIO', cx, cy + 145);
    ctx.globalAlpha = 1;
    
    if (estado.record > 0) {
        ctx.font = '14px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`🏆 Récord: ${estado.record} yardas`, cx, cy + 175);
    }
}

function dibujarGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.font = 'bold 45px Arial';
    ctx.fillStyle = '#F44336';
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 4;
    ctx.strokeText('¡TACKLE!', cx, cy - 60);
    ctx.fillText('¡TACKLE!', cx, cy - 60);
    
    ctx.font = 'bold 30px Arial';
    ctx.fillStyle = '#FFF';
    ctx.fillText(`${Math.floor(estado.yardas)} yardas`, cx, cy);
    
    ctx.font = '20px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`Touchdowns: ${estado.touchdowns}`, cx, cy + 35);
    
    if (Math.floor(estado.yardas) >= estado.record && estado.yardas > 0) {
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.fillText('🏆 ¡NUEVO RÉCORD!', cx, cy + 70);
    }
    
    const alpha = 0.5 + Math.sin(estado.tiempo * 0.08) * 0.5;
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#FFF';
    ctx.fillText('CLICK o ESPACIO', cx, cy + 110);
    ctx.globalAlpha = 1;
}

function loop() {
    estado.tiempo++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let shakeX = 0, shakeY = 0;
    if (estado.shake > 0) {
        shakeX = (Math.random() - 0.5) * estado.shake;
        shakeY = (Math.random() - 0.5) * estado.shake;
        estado.shake *= 0.9;
        if (estado.shake < 0.5) estado.shake = 0;
    }
    
    ctx.save();
    ctx.translate(shakeX, shakeY);
    
    dibujarFondo();
    
    if (estado.modo === 'titulo') {
        dibujarTitulo();
        ctx.restore();
        requestAnimationFrame(loop);
        return;
    }
    
    if (estado.modo === 'jugando') {
        // Controles
        if (teclas['ArrowLeft'] || teclas['a']) estado.jugador.vx -= 0.5;
        if (teclas['ArrowRight'] || teclas['d']) estado.jugador.vx += 0.5;
        if (teclas['ArrowUp'] || teclas['w']) estado.jugador.vy -= 0.5;
        if (teclas['ArrowDown'] || teclas['s']) estado.jugador.vy += 0.5;
        
        // Sprint
        if (teclas[' '] && estado.energia > 0) {
            estado.jugador.vx *= 1.5;
            estado.jugador.vy *= 1.5;
            estado.energia -= 1;
        } else {
            estado.energia = Math.min(100, estado.energia + 0.5);
        }
        
        // ✅ YARDAS: Solo aumentan cuando el jugador AVANZA hacia la meta
        const avance = estado.jugador.x - estado.posicionAnterior;
        if (avance > 0) {
            estado.yardas += avance * 0.3;
        }
        estado.posicionAnterior = estado.jugador.x;
        
        estado.jugador.actualizar();
        generarRivales();
        
        estado.rivales.forEach(r => r.actualizar());
        estado.rivales = estado.rivales.filter(r => r.activa);
        
        verificarColisiones();
        actualizarUI();
    }
    
    estado.particulas = estado.particulas.filter(p => p.life > 0);
    estado.particulas.forEach(p => p.actualizar());
    
    estado.rivales.forEach(r => r.dibujar());
    if (estado.jugador) estado.jugador.dibujar();
    estado.particulas.forEach(p => p.dibujar());
    
    if (estado.modo === 'gameover') {
        dibujarGameOver();
    }
    
    ctx.restore();
    requestAnimationFrame(loop);
}

estado.jugador = new Jugador();
loop();
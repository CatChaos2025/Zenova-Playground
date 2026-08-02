const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ============ ESTADO ============
const estado = {
    modo: 'titulo',
    altura: 0,
    record: parseInt(localStorage.getItem('saltoEstelarRecord')) || 0,
    camaraY: 0,
    plataformas: [],
    powerups: [],
    enemigos: [],
    particulas: [],
    estrellas: [],
    tiempo: 0
};

// Generar estrellas de fondo
for (let i = 0; i < 80; i++) {
    estado.estrellas.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 3,
        size: Math.random() * 2 + 0.5,
        brillo: Math.random()
    });
}

// ============ JUGADOR ============
const jugador = {
    x: canvas.width / 2,
    y: canvas.height - 150,
    width: 30,
    height: 35,
    vx: 0,
    vy: 0,
    velocidad: 6,
    salto: -14,
    gravedad: 0.4,
    mirando: 1,
    conCohete: false,
    tiempoCohete: 0,
    conEscudo: false,
    tiempoEscudo: 0
};

// ============ CLASE PLATAFORMA ============
class Plataforma {
    constructor(x, y, tipo = 'normal') {
        this.x = x;
        this.y = y;
        this.width = 70;
        this.height = 12;
        this.tipo = tipo; // normal, movil, rompible, resorte
        this.vx = tipo === 'movil' ? (Math.random() > 0.5 ? 2 : -2) : 0;
        this.rompida = false;
        this.tiempoAnimacion = Math.random() * Math.PI * 2;
    }
    
    actualizar() {
        if (this.tipo === 'movil') {
            this.x += this.vx;
            if (this.x < 0 || this.x + this.width > canvas.width) {
                this.vx *= -1;
            }
        }
        this.tiempoAnimacion += 0.05;
    }
    
    dibujar() {
        if (this.rompida) return;
        
        let color;
        switch (this.tipo) {
            case 'normal': color = '#4a90e2'; break;
            case 'movil': color = '#50c878'; break;
            case 'rompible': color = '#ff8c42'; break;
            case 'resorte': color = '#ffd700'; break;
        }
        
        // Sombra
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(this.x + 2, this.y + 3, this.width, this.height);
        
        // Plataforma
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Brillo superior
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(this.x, this.y, this.width, 3);
        
        // Resorte
        if (this.tipo === 'resorte') {
            const salto = Math.sin(this.tiempoAnimacion * 2) * 2;
            ctx.fillStyle = '#ff6b9d';
            ctx.fillRect(this.x + this.width/2 - 8, this.y - 8 + salto, 16, 8);
        }
    }
}

// ============ CLASE POWER-UP ============
class PowerUp {
    constructor(x, y, tipo) {
        this.x = x;
        this.y = y;
        this.tipo = tipo; // cohete, escudo
        this.size = 20;
        this.activa = true;
        this.anim = 0;
    }
    
    actualizar() {
        this.anim += 0.1;
    }
    
    dibujar() {
        if (!this.activa) return;
        
        const flotar = Math.sin(this.anim) * 3;
        
        ctx.save();
        ctx.translate(this.x, this.y + flotar);
        
        if (this.tipo === 'cohete') {
            // Cohete
            ctx.fillStyle = '#ff6b9d';
            ctx.beginPath();
            ctx.moveTo(0, -this.size);
            ctx.lineTo(this.size/2, this.size/2);
            ctx.lineTo(-this.size/2, this.size/2);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(0, this.size/4, this.size/4, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.tipo === 'escudo') {
            // Escudo
            ctx.fillStyle = '#4a90e2';
            ctx.beginPath();
            ctx.arc(0, 0, this.size/2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, this.size/2 - 3, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

// ============ CLASE ENEMIGO ============
class Enemigo {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 35;
        this.height = 30;
        this.vx = (Math.random() > 0.5 ? 1.5 : -1.5);
        this.vivo = true;
        this.anim = 0;
    }
    
    actualizar() {
        this.x += this.vx;
        this.anim += 0.1;
        if (this.x < 0 || this.x + this.width > canvas.width) {
            this.vx *= -1;
        }
    }
    
    dibujar() {
        if (!this.vivo) return;
        
        const flotar = Math.sin(this.anim) * 2;
        
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2 + flotar);
        
        // Cuerpo
        ctx.fillStyle = '#c06eff';
        ctx.beginPath();
        ctx.arc(0, 0, this.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Ojos
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-7, -3, 5, 0, Math.PI * 2);
        ctx.arc(7, -3, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-6, -3, 2, 0, Math.PI * 2);
        ctx.arc(8, -3, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Cuernos
        ctx.fillStyle = '#c06eff';
        ctx.beginPath();
        ctx.moveTo(-10, -12);
        ctx.lineTo(-5, -5);
        ctx.lineTo(-15, -5);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(10, -12);
        ctx.lineTo(15, -5);
        ctx.lineTo(5, -5);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
}

// ============ CLASE PARTÍCULA ============
class Particula {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = (Math.random() - 0.5) * 6;
        this.color = color;
        this.size = Math.random() * 4 + 2;
        this.life = 1;
    }
    
    actualizar() {
        this.x += this.vx;
        this.y += this.vy;
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

// ============ GENERAR NIVEL ============
function generarPlataformas() {
    estado.plataformas = [];
    
    // Plataforma inicial
    estado.plataformas.push(new Plataforma(canvas.width/2 - 35, canvas.height - 80, 'normal'));
    
    let y = canvas.height - 150;
    
    while (y > -2000) {
        const x = Math.random() * (canvas.width - 80) + 5;
        let tipo = 'normal';
        const rand = Math.random();
        
        if (estado.altura > 500 && rand < 0.15) tipo = 'rompible';
        else if (estado.altura > 300 && rand < 0.3) tipo = 'movil';
        else if (rand < 0.35) tipo = 'resorte';
        
        estado.plataformas.push(new Plataforma(x, y, tipo));
        
        // Power-ups
        if (Math.random() < 0.08) {
            const tipoPower = Math.random() < 0.5 ? 'cohete' : 'escudo';
            estado.powerups.push(new PowerUp(x + 35, y - 40, tipoPower));
        }
        
        // Enemigos
        if (estado.altura > 400 && Math.random() < 0.1) {
            estado.enemigos.push(new Enemigo(Math.random() * (canvas.width - 50), y - 100));
        }
        
        y -= 60 + Math.random() * 40;
    }
}

function generarMasPlataformas() {
    const ultimaPlataforma = estado.plataformas.reduce((min, p) => p.y < min ? p.y : min, Infinity);
    
    let y = ultimaPlataforma - 80;
    
    while (y > estado.camaraY - 800) {
        const x = Math.random() * (canvas.width - 80) + 5;
        let tipo = 'normal';
        const rand = Math.random();
        const dificultad = Math.min(estado.altura / 2000, 0.5);
        
        if (rand < 0.1 + dificultad * 0.3) tipo = 'rompible';
        else if (rand < 0.2 + dificultad * 0.2) tipo = 'movil';
        else if (rand < 0.3) tipo = 'resorte';
        
        estado.plataformas.push(new Plataforma(x, y, tipo));
        
        if (Math.random() < 0.06) {
            const tipoPower = Math.random() < 0.5 ? 'cohete' : 'escudo';
            estado.powerups.push(new PowerUp(x + 35, y - 40, tipoPower));
        }
        
        if (Math.random() < 0.08 + dificultad * 0.1) {
            estado.enemigos.push(new Enemigo(Math.random() * (canvas.width - 50), y - 80));
        }
        
        y -= 60 + Math.random() * 40 + dificultad * 30;
    }
    
    // Limpiar plataformas fuera de pantalla
    estado.plataformas = estado.plataformas.filter(p => p.y < estado.camaraY + canvas.height + 100);
    estado.powerups = estado.powerups.filter(p => p.y < estado.camaraY + canvas.height + 100);
    estado.enemigos = estado.enemigos.filter(e => e.y < estado.camaraY + canvas.height + 100);
}

// ============ ACTUALIZAR JUGADOR ============
function actualizarJugador() {
    // Movimiento horizontal
    if (teclas['ArrowLeft'] || teclas['a']) {
        jugador.vx = -jugador.velocidad;
        jugador.mirando = -1;
    } else if (teclas['ArrowRight'] || teclas['d']) {
        jugador.vx = jugador.velocidad;
        jugador.mirando = 1;
    } else {
        jugador.vx *= 0.8;
    }
    
    jugador.x += jugador.vx;
    
    // Envolver en los bordes
    if (jugador.x < -jugador.width) jugador.x = canvas.width;
    if (jugador.x > canvas.width) jugador.x = -jugador.width;
    
    // Cohete
    if (jugador.conCohete) {
        jugador.vy = -20;
        jugador.tiempoCohete--;
        if (jugador.tiempoCohete <= 0) {
            jugador.conCohete = false;
        }
        // Partículas del cohete
        crearParticulas(jugador.x + jugador.width/2, jugador.y + jugador.height, '#ff6600', 2);
    } else {
        // Gravedad
        jugador.vy += jugador.gravedad;
    }
    
    jugador.y += jugador.vy;
    
    // Escudo
    if (jugador.conEscudo) {
        jugador.tiempoEscudo--;
        if (jugador.tiempoEscudo <= 0) {
            jugador.conEscudo = false;
        }
    }
    
    // Colisión con plataformas (solo al caer)
    if (jugador.vy > 0) {
        estado.plataformas.forEach(plat => {
            if (plat.rompida) return;
            
            if (jugador.x + jugador.width > plat.x &&
                jugador.x < plat.x + plat.width &&
                jugador.y + jugador.height > plat.y &&
                jugador.y + jugador.height < plat.y + plat.height + 15) {
                
                if (plat.tipo === 'rompible') {
                    plat.rompida = true;
                    crearParticulas(plat.x + plat.width/2, plat.y, '#ff8c42', 10);
                    return;
                }
                
                if (plat.tipo === 'resorte') {
                    jugador.vy = jugador.salto * 1.8;
                    crearParticulas(jugador.x + jugador.width/2, jugador.y + jugador.height, '#ffd700', 15);
                } else {
                    jugador.vy = jugador.salto;
                }
                
                jugador.y = plat.y - jugador.height;
                crearParticulas(jugador.x + jugador.width/2, jugador.y + jugador.height, '#4a90e2', 5);
            }
        });
    }
    
    // Colisión con power-ups
    estado.powerups.forEach(power => {
        if (!power.activa) return;
        
        const dist = Math.hypot(
            (jugador.x + jugador.width/2) - power.x,
            (jugador.y + jugador.height/2) - power.y
        );
        
        if (dist < 30) {
            power.activa = false;
            if (power.tipo === 'cohete') {
                jugador.conCohete = true;
                jugador.tiempoCohete = 60;
                crearParticulas(jugador.x + jugador.width/2, jugador.y, '#ff6b9d', 20);
            } else if (power.tipo === 'escudo') {
                jugador.conEscudo = true;
                jugador.tiempoEscudo = 300;
                crearParticulas(jugador.x + jugador.width/2, jugador.y, '#4a90e2', 20);
            }
        }
    });
    
    // Colisión con enemigos
    estado.enemigos.forEach(enemigo => {
        if (!enemigo.vivo) return;
        
        if (jugador.x + jugador.width > enemigo.x &&
            jugador.x < enemigo.x + enemigo.width &&
            jugador.y + jugador.height > enemigo.y &&
            jugador.y < enemigo.y + enemigo.height) {
            
            if (jugador.conEscudo) {
                enemigo.vivo = false;
                crearParticulas(enemigo.x + enemigo.width/2, enemigo.y + enemigo.height/2, '#c06eff', 20);
            } else {
                gameOver();
            }
        }
    });
    
    // Actualizar cámara
    if (jugador.y < canvas.height / 2 + estado.camaraY) {
        estado.camaraY = jugador.y - canvas.height / 2;
    }
    
    // Actualizar altura
    const nuevaAltura = Math.max(0, Math.floor(-estado.camaraY / 10));
    if (nuevaAltura > estado.altura) {
        estado.altura = nuevaAltura;
        document.getElementById('altura').textContent = estado.altura + 'm';
    }
    
    // Generar más plataformas
    generarMasPlataformas();
    
    // Game over si cae
    if (jugador.y > estado.camaraY + canvas.height + 50) {
        gameOver();
    }
}

// ============ PARTÍCULAS ============
function crearParticulas(x, y, color, cantidad) {
    for (let i = 0; i < cantidad; i++) {
        if (estado.particulas.length < 150) {
            estado.particulas.push(new Particula(x, y, color));
        }
    }
}

// ============ GAME OVER ============
function gameOver() {
    estado.modo = 'gameover';
    if (estado.altura > estado.record) {
        estado.record = estado.altura;
        localStorage.setItem('saltoEstelarRecord', estado.record);
    }
    document.getElementById('record').textContent = estado.record + 'm';
}

// ============ INPUT ============
const teclas = {};
window.addEventListener('keydown', (e) => {
    teclas[e.key] = true;
    
    if (estado.modo === 'titulo' && e.key === ' ') {
        iniciarJuego();
        e.preventDefault();
    }
    
    if (estado.modo === 'gameover' && e.key === ' ') {
        estado.modo = 'titulo';
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    teclas[e.key] = false;
});

// Controles táctiles
let touchX = null;
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (estado.modo === 'titulo') { iniciarJuego(); return; }
    if (estado.modo === 'gameover') { estado.modo = 'titulo'; return; }
    touchX = e.touches[0].clientX;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (touchX !== null) {
        const newX = e.touches[0].clientX;
        const diff = newX - touchX;
        if (diff > 10) teclas['ArrowRight'] = true;
        else teclas['ArrowRight'] = false;
        if (diff < -10) teclas['ArrowLeft'] = true;
        else teclas['ArrowLeft'] = false;
        touchX = newX;
    }
});

canvas.addEventListener('touchend', () => {
    touchX = null;
    teclas['ArrowLeft'] = false;
    teclas['ArrowRight'] = false;
});

// ============ INICIO ============
function iniciarJuego() {
    estado.modo = 'jugando';
    estado.altura = 0;
    estado.camaraY = 0;
    estado.powerups = [];
    estado.enemigos = [];
    estado.particulas = [];
    
    jugador.x = canvas.width / 2;
    jugador.y = canvas.height - 150;
    jugador.vx = 0;
    jugador.vy = 0;
    jugador.conCohete = false;
    jugador.conEscudo = false;
    
    generarPlataformas();
    document.getElementById('altura').textContent = '0m';
    document.getElementById('record').textContent = estado.record + 'm';
}

// ============ DIBUJO ============
function dibujarFondo() {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#1a1a3e');
    grad.addColorStop(1, '#2d2d5e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Estrellas
    estado.estrellas.forEach(est => {
        const y = ((est.y - estado.camaraY * 0.3) % (canvas.height * 3) + canvas.height * 3) % (canvas.height * 3) - canvas.height;
        if (y > -10 && y < canvas.height + 10) {
            const brillo = 0.3 + Math.sin(estado.tiempo * 0.02 + est.brillo * 10) * 0.3;
            ctx.globalAlpha = brillo;
            ctx.fillStyle = '#fff';
            ctx.fillRect(est.x, y, est.size, est.size);
        }
    });
    ctx.globalAlpha = 1;
}

function dibujarJugador() {
    ctx.save();
    ctx.translate(jugador.x + jugador.width/2, jugador.y + jugador.height/2);
    
    if (jugador.mirando < 0) ctx.scale(-1, 1);
    
    // Escudo
    if (jugador.conEscudo) {
        ctx.strokeStyle = 'rgba(74, 144, 226, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Cuerpo
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Ojos
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(3, -3, 5, 0, Math.PI * 2);
    ctx.arc(10, -3, 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(4, -3, 2, 0, Math.PI * 2);
    ctx.arc(11, -3, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Sonrisa
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(6, 3, 6, 0.2, Math.PI - 0.2);
    ctx.stroke();
    
    // Patas
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(-12, 10, 8, 8);
    ctx.fillRect(4, 10, 8, 8);
    
    ctx.restore();
    
    // Cohete
    if (jugador.conCohete) {
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(jugador.x + jugador.width/2, jugador.y + jugador.height);
        ctx.lineTo(jugador.x + jugador.width/2 - 8, jugador.y + jugador.height + 15 + Math.random() * 10);
        ctx.lineTo(jugador.x + jugador.width/2 + 8, jugador.y + jugador.height + 15 + Math.random() * 10);
        ctx.closePath();
        ctx.fill();
    }
}

function dibujarTitulo() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Título
    ctx.font = 'bold 55px Arial';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillText('SALTO', cx + 3, cy - 80 + 3);
    ctx.fillText('ESTELAR', cx + 3, cy - 20 + 3);
    
    const grad = ctx.createLinearGradient(cx - 150, 0, cx + 150, 0);
    grad.addColorStop(0, '#ffd700');
    grad.addColorStop(0.5, '#ff6b9d');
    grad.addColorStop(1, '#4a90e2');
    ctx.fillStyle = grad;
    ctx.fillText('SALTO', cx, cy - 80);
    ctx.fillText('ESTELAR', cx, cy - 20);
    
    ctx.fillStyle = '#fff';
    ctx.font = '18px Arial';
    ctx.fillText('¡Salta lo más alto que puedas!', cx, cy + 40);
    
    const alpha = 0.5 + Math.sin(estado.tiempo * 0.05) * 0.5;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 22px Arial';
    ctx.fillText('Presiona ESPACIO para jugar', cx, cy + 100);
    ctx.globalAlpha = 1;
    
    if (estado.record > 0) {
        ctx.fillStyle = '#ffd700';
        ctx.font = '16px Arial';
        ctx.fillText(`🏆 Récord: ${estado.record}m`, cx, cy + 140);
    }
    
    ctx.restore();
}

function dibujarGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.font = 'bold 50px Arial';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillText('¡CAÍSTE!', cx + 3, cy - 50 + 3);
    ctx.fillStyle = '#ff6b9d';
    ctx.fillText('¡CAÍSTE!', cx, cy - 50);
    
    ctx.fillStyle = '#fff';
    ctx.font = '28px Arial';
    ctx.fillText(`Altura: ${estado.altura}m`, cx, cy + 10);
    
    if (estado.altura >= estado.record && estado.altura > 0) {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 22px Arial';
        ctx.fillText('🏆 ¡NUEVO RÉCORD!', cx, cy + 50);
    } else {
        ctx.fillStyle = '#aaa';
        ctx.font = '18px Arial';
        ctx.fillText(`Récord: ${estado.record}m`, cx, cy + 50);
    }
    
    const alpha = 0.5 + Math.sin(estado.tiempo * 0.05) * 0.5;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('Presiona ESPACIO para continuar', cx, cy + 100);
    ctx.globalAlpha = 1;
    
    ctx.restore();
}

// ============ LOOP ============
function loop() {
    estado.tiempo++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    dibujarFondo();
    
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
    
    // Actualizar
    actualizarJugador();
    
    estado.plataformas.forEach(p => {
        p.actualizar();
        p.y -= estado.camaraY * 0; // Las plataformas se mueven con la cámara
    });
    
    estado.powerups.forEach(p => p.actualizar());
    estado.enemigos.forEach(e => e.actualizar());
    estado.particulas = estado.particulas.filter(p => p.life > 0);
    estado.particulas.forEach(p => p.actualizar());
    
    // Dibujar con cámara
    ctx.save();
    ctx.translate(0, -estado.camaraY);
    
    estado.plataformas.forEach(p => {
        if (p.y > estado.camaraY - 50 && p.y < estado.camaraY + canvas.height + 50) {
            p.dibujar();
        }
    });
    
    estado.powerups.forEach(p => {
        if (p.activa && p.y > estado.camaraY - 50 && p.y < estado.camaraY + canvas.height + 50) {
            p.dibujar();
        }
    });
    
    estado.enemigos.forEach(e => {
        if (e.vivo && e.y > estado.camaraY - 50 && e.y < estado.camaraY + canvas.height + 50) {
            e.dibujar();
        }
    });
    
    dibujarJugador();
    
    estado.particulas.forEach(p => p.dibujar());
    
    ctx.restore();
    
    requestAnimationFrame(loop);
}

// ============ INICIO ============
document.getElementById('record').textContent = estado.record + 'm';
loop();
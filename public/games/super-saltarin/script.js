const c = document.getElementById('c');
const ctx = c.getContext('2d');
const W = c.width, H = c.height;

const GRAVEDAD = 0.6;
const SUELO = H - 40;

let jugador, plataformas, monedas, enemigos, camara;
let score = 0, vidas = 3, nivel = 1, gameOver = false;
const teclas = {};

window.addEventListener('keydown', e => {
    teclas[e.key.toLowerCase()] = true;
    if (e.key === ' ') e.preventDefault();
    if (e.key.toLowerCase() === 'r') iniciarJuego();
});
window.addEventListener('keyup', e => teclas[e.key.toLowerCase()] = false);

class Jugador {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.w = 25; this.h = 35;
        this.vx = 0; this.vy = 0;
        this.enSuelo = false;
        this.dir = 1;
        this.animacion = 0;
    }
    
    actualizar() {
        this.animacion++;
        
        if (teclas['arrowleft'] || teclas['a']) { this.vx = -4; this.dir = -1; }
        else if (teclas['arrowright'] || teclas['d']) { this.vx = 4; this.dir = 1; }
        else this.vx *= 0.8;
        
        if ((teclas[' '] || teclas['arrowup'] || teclas['w']) && this.enSuelo) {
            this.vy = -12;
            this.enSuelo = false;
        }
        
        this.vy += GRAVEDAD;
        this.x += this.vx;
        this.y += this.vy;
        
        // Colisión con plataformas
        this.enSuelo = false;
        for (let p of plataformas) {
            if (this.x + this.w > p.x && this.x < p.x + p.w &&
                this.y + this.h > p.y && this.y + this.h < p.y + p.h + 10 &&
                this.vy >= 0) {
                this.y = p.y - this.h;
                this.vy = 0;
                this.enSuelo = true;
            }
        }
        
        // Límites
        if (this.x < 0) this.x = 0;
        if (this.x > W - this.w) this.x = W - this.w;
        
        // Caída al vacío
        if (this.y > H) {
            vidas--;
            if (vidas <= 0) gameOver = true;
            else { this.x = 50; this.y = 200; this.vy = 0; }
        }
    }
    
    dibujar() {
        ctx.save();
        ctx.translate(this.x + this.w/2, this.y + this.h/2);
        if (this.dir === -1) ctx.scale(-1, 1);
        
        // Cuerpo
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(-12, -10, 24, 20);
        
        // Cabeza
        ctx.fillStyle = '#FFCC80';
        ctx.beginPath(); ctx.arc(0, -15, 10, 0, Math.PI*2); ctx.fill();
        
        // Gorra
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(-12, -22, 24, 5);
        ctx.fillRect(-15, -20, 30, 3);
        
        // Ojos
        ctx.fillStyle = '#000';
        ctx.fillRect(3, -17, 3, 3);
        
        // Piernas (animadas)
        ctx.fillStyle = '#0000FF';
        const paso = this.enSuelo && Math.abs(this.vx) > 0.5 ? Math.sin(this.animacion * 0.3) * 5 : 0;
        ctx.fillRect(-8, 10, 6, 10 + paso);
        ctx.fillRect(2, 10, 6, 10 - paso);
        
        ctx.restore();
    }
}

function crearNivel() {
    plataformas = [];
    monedas = [];
    enemigos = [];
    
    // Suelo base
    plataformas.push({x: 0, y: SUELO, w: W, h: 40});
    
    // Plataformas según nivel
    const config = [
        [{x: 100, y: 300, w: 80}, {x: 250, y: 250, w: 80}, {x: 400, y: 200, w: 80}, {x: 500, y: 150, w: 60}],
        [{x: 80, y: 320, w: 60}, {x: 200, y: 270, w: 60}, {x: 320, y: 220, w: 60}, {x: 450, y: 170, w: 80}, {x: 300, y: 120, w: 60}],
        [{x: 50, y: 330, w: 50}, {x: 150, y: 280, w: 50}, {x: 250, y: 230, w: 50}, {x: 350, y: 180, w: 50}, {x: 450, y: 130, w: 50}, {x: 200, y: 80, w: 80}]
    ];
    
    const nivelIdx = Math.min(nivel - 1, config.length - 1);
    config[nivelIdx].forEach(p => {
        plataformas.push({x: p.x, y: p.y, w: p.w, h: 15});
        monedas.push({x: p.x + p.w/2, y: p.y - 20, r: 8, activa: true});
    });
    
    // Enemigos
    if (nivel >= 2) {
        enemigos.push({x: 200, y: SUELO - 25, w: 25, h: 25, vx: 1.5, dir: 1, minX: 150, maxX: 350});
    }
    if (nivel >= 3) {
        enemigos.push({x: 400, y: SUELO - 25, w: 25, h: 25, vx: 2, dir: 1, minX: 350, maxX: 550});
    }
}

function iniciarJuego() {
    jugador = new Jugador(50, 200);
    score = 0; vidas = 3; nivel = 1; gameOver = false;
    crearNivel();
}

function update() {
    if (gameOver) return;
    
    jugador.actualizar();
    
    // Monedas
    monedas.forEach(m => {
        if (!m.activa) return;
        const dist = Math.hypot(jugador.x + jugador.w/2 - m.x, jugador.y + jugador.h/2 - m.y);
        if (dist < m.r + 15) {
            m.activa = false;
            score += 10;
        }
    });
    
    // Enemigos
    enemigos.forEach(e => {
        e.x += e.vx * e.dir;
        if (e.x < e.minX || e.x > e.maxX) e.dir *= -1;
        
        // Colisión con jugador
        if (jugador.x + jugador.w > e.x && jugador.x < e.x + e.w &&
            jugador.y + jugador.h > e.y && jugador.y < e.y + e.h) {
            
            // Si cae encima, lo elimina
            if (jugador.vy > 0 && jugador.y + jugador.h < e.y + e.h/2) {
                e.x = -100; // Eliminar
                jugador.vy = -8;
                score += 20;
            } else {
                vidas--;
                jugador.x = 50; jugador.y = 200; jugador.vy = 0;
                if (vidas <= 0) gameOver = true;
            }
        }
    });
    
    // Verificar si recogió todas las monedas
    if (monedas.every(m => !m.activa)) {
        nivel++;
        if (nivel > 3) {
            // Victoria
            gameOver = true;
        } else {
            crearNivel();
            jugador.x = 50; jugador.y = 200;
        }
    }
}

function draw() {
    // Cielo
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, W, H);
    
    // Nubes
    ctx.fillStyle = '#FFF';
    for (let i = 0; i < 5; i++) {
        const x = (i * 150 + Date.now() * 0.02) % (W + 100) - 50;
        ctx.beginPath();
        ctx.arc(x, 50 + i * 20, 20, 0, Math.PI*2);
        ctx.arc(x + 20, 50 + i * 20, 25, 0, Math.PI*2);
        ctx.arc(x + 40, 50 + i * 20, 20, 0, Math.PI*2);
        ctx.fill();
    }
    
    // Plataformas
    plataformas.forEach(p => {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = '#228B22';
        ctx.fillRect(p.x, p.y, p.w, 5);
    });
    
    // Monedas
    monedas.forEach(m => {
        if (!m.activa) return;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
    
    // Enemigos
    enemigos.forEach(e => {
        if (e.x < 0) return;
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(e.x, e.y, e.w, e.h);
        ctx.fillStyle = '#FFF';
        ctx.fillRect(e.x + 5, e.y + 5, 5, 5);
        ctx.fillRect(e.x + 15, e.y + 5, 5, 5);
    });
    
    // Jugador
    if (!gameOver) jugador.dibujar();
    
    // HUD
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, W, 30);
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`❤️ ${vidas}  💰 ${score}  Nivel ${nivel}`, 10, 22);
    
    if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = vidas > 0 ? '#FFD700' : '#FF0000';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(vidas > 0 ? '🏆 ¡VICTORIA!' : ' GAME OVER', W/2, H/2 - 20);
        ctx.fillStyle = '#FFF';
        ctx.font = '20px Arial';
        ctx.fillText(`Puntuación: ${score}`, W/2, H/2 + 20);
        ctx.fillText('Presiona R para reiniciar', W/2, H/2 + 60);
    }
    
    requestAnimationFrame(loop);
}

function loop() {
    update();
    draw();
}

iniciarJuego();
loop();
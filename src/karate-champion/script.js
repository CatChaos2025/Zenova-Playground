const c = document.getElementById('c');
const ctx = c.getContext('2d');
const W = c.width, H = c.height;
const SUELO = H - 60;

let modo = 'titulo';
let nivel = 1, puntos = 0, tiempo = 0;

const teclas = {};

// Input handling
window.addEventListener('keydown', e => {
    if (!teclas[e.key.toLowerCase()]) {
        teclas[e.key.toLowerCase()] = true;
        
        if (modo === 'titulo' && (e.key === 'Enter' || e.code === 'Space')) {
            iniciarJuego();
        }
        
        if ((modo === 'gameover' || modo === 'victoria') && (e.key === 'Enter' || e.code === 'Space')) {
            modo = 'titulo';
        }
        
        if (modo === 'jugando') {
            if (e.key.toLowerCase() === 'a') jugador.intentarAtaque('puño');
            if (e.key.toLowerCase() === 's') jugador.intentarAtaque('patada');
            if (e.key.toLowerCase() === 'd') jugador.intentarAtaque('bloqueo');
            if (e.key.toLowerCase() === 'f') jugador.intentarAtaque('especial');
        }
    }
});

window.addEventListener('keyup', e => {
    teclas[e.key.toLowerCase()] = false;
});

c.addEventListener('click', () => { 
    if (modo === 'titulo') iniciarJuego(); 
    if (modo === 'gameover' || modo === 'victoria') modo = 'titulo'; 
});

class Luchador {
    constructor(x, color, esJugador) {
        this.x = x; this.y = SUELO; this.color = color;
        this.esJugador = esJugador;
        this.vida = 100; this.vidaMax = 100;
        this.ki = 0; 
        this.vx = 0; 
        this.estado = 'idle';
        this.tiempoEstado = 0;
        this.cooldown = 0;
        this.hitStun = 0;
        this.animacion = 0; 
        this.dir = esJugador ? 1 : -1;
    }
    
    actualizar(oponente) {
        this.animacion++;
        
        if (this.hitStun > 0) {
            this.hitStun--;
            return;
        }
        
        if (this.cooldown > 0) this.cooldown--;
        
        if (this.tiempoEstado > 0) {
            this.tiempoEstado--;
            if (this.tiempoEstado === 0) {
                this.estado = 'idle';
            }
        }
        
        if (this.estado === 'idle') {
            this.x += this.vx;
            this.vx *= 0.85;
            this.x = Math.max(30, Math.min(W - 30, this.x));
            this.dir = oponente.x > this.x ? 1 : -1;
        }
    }
    
    intentarAtaque(tipo) {
        if (this.estado !== 'idle' || this.cooldown > 0) return;
        
        if (tipo === 'especial' && this.ki < 100) return;
        
        this.estado = tipo;
        this.tiempoEstado = tipo === 'especial' ? 30 : 20;
        this.cooldown = tipo === 'especial' ? 50 : 30;
        
        if (tipo === 'especial') this.ki = 0;
    }
    
    recibirDaño(cantidad) {
        if (this.estado === 'bloqueo') {
            cantidad *= 0.2;
            crearParticulas(this.x, this.y - 40, '#2196F3', 5);
        } else {
            this.hitStun = 15;
            this.estado = 'stun';
            this.tiempoEstado = 15;
            crearParticulas(this.x, this.y - 40, '#FF0000', 10);
        }
        this.vida = Math.max(0, this.vida - cantidad);
    }
    
    dibujar() {
        const x = this.x, y = this.y;
        ctx.save();
        ctx.translate(x, y);
        if (this.dir === -1) ctx.scale(-1, 1);
        
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.ellipse(0, 2, 18, 5, 0, 0, Math.PI*2); ctx.fill();
        
        ctx.fillStyle = '#FFF';
        let offsetPierna = 0;
        if (this.estado === 'idle') offsetPierna = Math.sin(this.animacion * 0.2) * 2;
        
        ctx.fillRect(-8, -25 + offsetPierna, 6, 25);
        
        if (this.estado === 'patada') {
            ctx.save();
            ctx.translate(4, -25);
            ctx.rotate(Math.PI / 4);
            ctx.fillRect(-3, 0, 6, 25);
            ctx.restore();
        } else {
            ctx.fillRect(4, -25 - offsetPierna, 6, 25);
        }
        
        ctx.fillStyle = this.color;
        ctx.fillRect(-12, -55, 24, 32);
        
        ctx.fillStyle = this.esJugador ? '#000' : '#F44336';
        ctx.fillRect(-12, -28, 24, 4);
        
        ctx.fillStyle = this.color;
        
        if (this.estado === 'puño') {
            ctx.fillRect(12, -48, 25, 6);
            ctx.fillStyle = '#ffcc80';
            ctx.fillRect(35, -50, 8, 8);
        } else if (this.estado === 'especial') {
            ctx.fillStyle = 'rgba(255, 200, 0, 0.8)';
            ctx.beginPath(); ctx.arc(30, -45, 20 + Math.sin(this.animacion)*5, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = this.color;
            ctx.fillRect(12, -48, 20, 6);
        } else if (this.estado === 'bloqueo') {
            ctx.fillRect(-15, -50, 6, 20);
            ctx.fillRect(9, -50, 6, 20);
        } else {
            ctx.fillRect(12, -48, 6, 15);
            ctx.fillRect(-18, -48, 6, 15);
        }
        
        ctx.fillStyle = '#ffcc80';
        ctx.beginPath(); ctx.arc(0, -63, 10, 0, Math.PI*2); ctx.fill();
        
        ctx.fillStyle = '#333';
        ctx.beginPath(); ctx.arc(0, -67, 10, Math.PI, 0); ctx.fill();
        
        ctx.fillStyle = '#000';
        if (this.hitStun > 0) {
            ctx.fillText('X', -6, -62);
            ctx.fillText('X', 2, -62);
        } else {
            ctx.fillRect(3, -65, 3, 2);
            ctx.fillRect(-5, -65, 3, 2);
        }
        
        ctx.restore();
    }
    
    getHitbox() {
        return { x: this.x - 15, y: this.y - 70, w: 30, h: 70 };
    }
    
    getAttackBox() {
        if (this.estado !== 'puño' && this.estado !== 'patada' && this.estado !== 'especial') return null;
        if (this.tiempoEstado < 10 || this.tiempoEstado > 18) return null;
        
        let alcance = 30;
        if (this.estado === 'patada') alcance = 45;
        if (this.estado === 'especial') alcance = 60;
        
        return {
            x: this.dir === 1 ? this.x + 10 : this.x - 10 - alcance,
            y: this.y - 60,
            w: alcance,
            h: 40
        };
    }
}

let jugador, rival, particulas = [];

function crearParticulas(x, y, color, n) {
    for (let i = 0; i < n; i++) {
        particulas.push({
            x, y, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8,
            color, size: Math.random()*4+2, life: 1
        });
    }
}

function iniciarJuego() {
    modo = 'jugando'; 
    nivel = 1; 
    puntos = 0;
    jugador = new Luchador(150, '#FFF', true);
    rival = new Luchador(450, '#1565C0', false);
    particulas = [];
}

function siguienteNivel() {
    nivel++;
    if (nivel > 5) { modo = 'victoria'; return; }
    jugador.vida = jugador.vidaMax;
    jugador.ki = 0;
    rival = new Luchador(450, '#1565C0', false);
    rival.vidaMax = 100 + nivel * 20;
    rival.vida = rival.vidaMax;
}

function colision(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function update() {
    if (modo !== 'jugando') return;
    tiempo++;
    
    if (jugador.estado === 'idle') {
        if (teclas['arrowleft']) jugador.vx = -4;
        if (teclas['arrowright']) jugador.vx = 4;
    }
    
    const dist = Math.abs(jugador.x - rival.x);
    
    if (rival.estado === 'idle') {
        if (dist > 80) {
            rival.vx = jugador.x < rival.x ? -3 : 3;
        } else if (dist < 50) {
            rival.vx = jugador.x < rival.x ? 2 : -2;
        }
        
        if (dist < 90 && rival.cooldown === 0 && Math.random() < 0.03 + nivel * 0.005) {
            const r = Math.random();
            if (r < 0.4) rival.intentarAtaque('puño');
            else if (r < 0.7) rival.intentarAtaque('patada');
            else rival.intentarAtaque('bloqueo');
        }
    }
    
    jugador.actualizar(rival);
    rival.actualizar(jugador);
    
    const atkJ = jugador.getAttackBox();
    if (atkJ && colision(atkJ, rival.getHitbox())) {
        let daño = 0;
        if (jugador.estado === 'puño') daño = 8;
        else if (jugador.estado === 'patada') daño = 12;
        else if (jugador.estado === 'especial') daño = 25;
        
        if (daño > 0) {
            rival.recibirDaño(daño);
            jugador.ki = Math.min(100, jugador.ki + 15);
            jugador.estado = 'idle';
            jugador.tiempoEstado = 0;
            puntos += daño;
        }
    }
    
    const atkR = rival.getAttackBox();
    if (atkR && colision(atkR, jugador.getHitbox())) {
        let daño = 0;
        if (rival.estado === 'puño') daño = 8;
        else if (rival.estado === 'patada') daño = 12;
        else if (rival.estado === 'especial') daño = 20;
        
        if (daño > 0) {
            jugador.recibirDaño(daño);
            rival.estado = 'idle';
            rival.tiempoEstado = 0;
        }
    }
    
    particulas = particulas.filter(p => p.life > 0);
    particulas.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life -= 0.04; });
    
    if (rival.vida <= 0) siguienteNivel();
    if (jugador.vida <= 0) modo = 'gameover';
}

function draw() {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#3e2723');
    grad.addColorStop(1, '#4e342e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(0, 0, W, SUELO - 50);
    ctx.fillStyle = '#4e342e';
    ctx.fillRect(W/2 - 40, 30, 80, 100);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.strokeRect(W/2 - 40, 30, 80, 100);
    ctx.fillStyle = '#ffd700';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('道', W/2, 90);
    
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(0, SUELO, W, H - SUELO);
    ctx.strokeStyle = '#6d4c41';
    for (let x = 0; x < W; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, SUELO); ctx.lineTo(x, H); ctx.stroke();
    }
    
    if (modo === 'titulo') {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#ff6b35';
        ctx.font = 'bold 50px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🥋 KARATE', W/2, H/2 - 30);
        ctx.fillText('CHAMPION', W/2, H/2 + 30);
        ctx.fillStyle = '#fff';
        ctx.font = '18px Arial';
        ctx.fillText('5 niveles para ser campeón', W/2, H/2 + 70);
        const a = 0.5 + Math.sin(Date.now()*0.005)*0.5;
        ctx.globalAlpha = a;
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('CLICK o ENTER', W/2, H/2 + 110);
        ctx.globalAlpha = 1;
        // NO HACER RETURN AQUÍ - dejar que continúe el loop
    }
    
    if (modo === 'jugando') {
        ctx.fillStyle = '#333'; ctx.fillRect(20, 15, 200, 20);
        ctx.fillStyle = '#4CAF50'; ctx.fillRect(20, 15, jugador.vida/jugador.vidaMax*200, 20);
        ctx.strokeStyle = '#fff'; ctx.strokeRect(20, 15, 200, 20);
        ctx.fillStyle = '#fff'; ctx.font = '12px Arial'; ctx.textAlign = 'left';
        ctx.fillText('TÚ', 25, 30);
        
        ctx.fillStyle = '#333'; ctx.fillRect(20, 38, 200, 8);
        ctx.fillStyle = '#9C27B0'; ctx.fillRect(20, 38, jugador.ki, 8);
        
        ctx.fillStyle = '#333'; ctx.fillRect(W-220, 15, 200, 20);
        ctx.fillStyle = '#F44336'; ctx.fillRect(W-220, 15, rival.vida/rival.vidaMax*200, 20);
        ctx.strokeStyle = '#fff'; ctx.strokeRect(W-220, 15, 200, 20);
        ctx.textAlign = 'right';
        ctx.fillText(`RIVAL Nv.${nivel}`, W-25, 30);
        
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`Nivel ${nivel}/5 | Puntos: ${puntos}`, W/2, 30);
        
        jugador.dibujar();
        rival.dibujar();
        
        particulas.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        ctx.globalAlpha = 1;
    }
    
    if (modo === 'gameover') {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#F44336';
        ctx.font = 'bold 50px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('K.O.', W/2, H/2 - 20);
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText(`Puntos: ${puntos} | Nivel: ${nivel}`, W/2, H/2 + 20);
        ctx.fillStyle = '#ffd700';
        ctx.font = '16px Arial';
        ctx.fillText('CLICK o ENTER', W/2, H/2 + 60);
    }
    
    if (modo === 'victoria') {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 50px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🏆 ¡CAMPEÓN!', W/2, H/2 - 20);
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.fillText(`Puntos totales: ${puntos}`, W/2, H/2 + 25);
        ctx.fillStyle = '#ffd700';
        ctx.font = '16px Arial';
        ctx.fillText('CLICK o ENTER', W/2, H/2 + 65);
    }
    
    // ESTO DEBE ESTAR SIEMPRE AL FINAL
    requestAnimationFrame(loop);
}

function loop() {
    update();
    draw();
}

// INICIAR EL LOOP
loop();
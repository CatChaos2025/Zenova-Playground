const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const estado = {
    modo: 'titulo',
    scoreJugador: 0,
    scoreCPU: 0,
    meta: 5,
    tiempo: 60,
    tiempoInicio: 0,
    mouse: { x: canvas.width/2, y: canvas.height - 100 },
    puck: null,
    jugador: null,
    cpu: null,
    particulas: [],
    tiempoGol: 0,
    ultimoGanador: '',
    shake: 0
};

class Puck {
    constructor() {
        this.reset();
    }
    
    reset(direccion = 0) {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = direccion === 0 ? (Math.random() > 0.5 ? 3 : -3) : direccion * 3;
        this.radio = 12;
        this.friction = 0.99;
        this.rotation = 0;
        this.trail = [];
    }
    
    actualizar() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.rotation += Math.hypot(this.vx, this.vy) * 0.05;
        
        this.trail.push({ x: this.x, y: this.y, alpha: 1 });
        if (this.trail.length > 8) this.trail.shift();
        this.trail.forEach(t => t.alpha -= 0.12);
        
        if (this.x - this.radio < 0) {
            this.x = this.radio;
            this.vx *= -0.9;
            crearChispas(this.x, this.y, '#FFF', 5);
        }
        if (this.x + this.radio > canvas.width) {
            this.x = canvas.width - this.radio;
            this.vx *= -0.9;
            crearChispas(this.x, this.y, '#FFF', 5);
        }
        
        const porterias = {
            arriba: { x: canvas.width/2 - 60, y: 0, width: 120, height: 15 },
            abajo: { x: canvas.width/2 - 60, y: canvas.height - 15, width: 120, height: 15 }
        };
        
        if (this.y - this.radio < porterias.arriba.y + porterias.arriba.height &&
            this.x > porterias.arriba.x &&
            this.x < porterias.arriba.x + porterias.arriba.width) {
            return 'jugador';
        }
        
        if (this.y + this.radio > porterias.abajo.y &&
            this.x > porterias.abajo.x &&
            this.x < porterias.abajo.x + porterias.abajo.width) {
            return 'cpu';
        }
        
        if (this.y - this.radio < 0) {
            this.y = this.radio;
            this.vy *= -0.9;
            crearChispas(this.x, this.y, '#FFF', 5);
        }
        if (this.y + this.radio > canvas.height) {
            this.y = canvas.height - this.radio;
            this.vy *= -0.9;
            crearChispas(this.x, this.y, '#FFF', 5);
        }
        
        return null;
    }
    
    dibujar() {
        this.trail.forEach(t => {
            if (t.alpha <= 0) return;
            ctx.globalAlpha = t.alpha * 0.4;
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(t.x, t.y, this.radio * 0.7, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.arc(2, 2, this.radio, 0, Math.PI * 2);
        ctx.fill();
        
        const grad = ctx.createRadialGradient(-3, -3, 2, 0, 0, this.radio);
        grad.addColorStop(0, '#333');
        grad.addColorStop(1, '#000');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, this.radio, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.radio, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }
}

class Paddle {
    constructor(x, y, color, esCPU = false) {
        this.x = x;
        this.y = y;
        this.radio = 25;
        this.color = color;
        this.esCPU = esCPU;
        this.vx = 0;
        this.vy = 0;
        this.prevX = x;
        this.prevY = y;
    }
    
    actualizar() {
        this.vx = this.x - this.prevX;
        this.vy = this.y - this.prevY;
        this.prevX = this.x;
        this.prevY = this.y;
    }
    
    dibujar() {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.arc(this.x + 3, this.y + 3, this.radio, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radio, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radio * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 5, this.radio * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Particula {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.color = color;
        this.size = Math.random() * 4 + 2;
        this.life = 1;
    }
    
    actualizar() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.95;
        this.vy *= 0.95;
        this.life -= 0.04;
    }
    
    dibujar() {
        if (this.life <= 0) return;
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

function crearChispas(x, y, color, cantidad) {
    for (let i = 0; i < cantidad; i++) {
        estado.particulas.push(new Particula(x, y, color));
    }
}

function crearCelebracion(x, y, color, cantidad) {
    for (let i = 0; i < cantidad; i++) {
        const p = new Particula(x, y, color);
        p.vx = (Math.random() - 0.5) * 15;
        p.vy = (Math.random() - 0.5) * 15;
        p.size = Math.random() * 6 + 3;
        estado.particulas.push(p);
    }
}

function actualizarCPU() {
    const cpu = estado.cpu;
    const puck = estado.puck;
    
    const velocidadIA = 3 + Math.min(3, (estado.scoreJugador + estado.scoreCPU) * 0.5);
    
    if (puck.vy < 0 && puck.y < canvas.height / 2) {
        const tiempo = (cpu.y - puck.y) / Math.abs(puck.vy);
        const predictX = puck.x + puck.vx * tiempo;
        
        const dx = predictX - cpu.x;
        const distancia = Math.abs(dx);
        
        if (distancia > 2) {
            cpu.x += Math.sign(dx) * Math.min(velocidadIA, distancia);
        }
        
        if (Math.abs(puck.y - cpu.y) < 100) {
            const dy = puck.y - cpu.y;
            cpu.y += Math.sign(dy) * Math.min(velocidadIA * 0.7, Math.abs(dy));
        }
    } else {
        const targetX = canvas.width / 2;
        const targetY = 80;
        
        const dx = targetX - cpu.x;
        const dy = targetY - cpu.y;
        
        if (Math.abs(dx) > 2) cpu.x += Math.sign(dx) * Math.min(velocidadIA * 0.5, Math.abs(dx));
        if (Math.abs(dy) > 2) cpu.y += Math.sign(dy) * Math.min(velocidadIA * 0.5, Math.abs(dy));
    }
    
    cpu.x = Math.max(cpu.radio, Math.min(canvas.width - cpu.radio, cpu.x));
    cpu.y = Math.max(cpu.radio, Math.min(canvas.height / 2 - cpu.radio, cpu.y));
}

function verificarColisionPaloPuck(palo) {
    const dx = estado.puck.x - palo.x;
    const dy = estado.puck.y - palo.y;
    const dist = Math.hypot(dx, dy);
    const minDist = estado.puck.radio + palo.radio;
    
    if (dist < minDist) {
        const nx = dx / dist;
        const ny = dy / dist;
        
        const overlap = minDist - dist;
        estado.puck.x += nx * overlap;
        estado.puck.y += ny * overlap;
        
        const relVx = estado.puck.vx - palo.vx;
        const relVy = estado.puck.vy - palo.vy;
        const relVelNormal = relVx * nx + relVy * ny;
        
        if (relVelNormal < 0) {
            const restitution = 1.3;
            const impulse = -(1 + restitution) * relVelNormal;
            
            estado.puck.vx += impulse * nx;
            estado.puck.vy += impulse * ny;
            
            estado.puck.vx += palo.vx * 0.5;
            estado.puck.vy += palo.vy * 0.5;
            
            const maxVel = 15;
            const vel = Math.hypot(estado.puck.vx, estado.puck.vy);
            if (vel > maxVel) {
                estado.puck.vx = (estado.puck.vx / vel) * maxVel;
                estado.puck.vy = (estado.puck.vy / vel) * maxVel;
            }
            
            crearChispas(estado.puck.x, estado.puck.y, palo.color, 10);
            estado.shake = 5;
        }
    }
}

function iniciarJuego() {
    estado.modo = 'jugando';
    estado.scoreJugador = 0;
    estado.scoreCPU = 0;
    estado.tiempo = 60;
    estado.tiempoInicio = Date.now();
    estado.particulas = [];
    estado.puck = new Puck();
    estado.jugador = new Paddle(canvas.width/2, canvas.height - 80, '#2196F3', false);
    estado.cpu = new Paddle(canvas.width/2, 80, '#F44336', true);
    actualizarUI();
}

function gol(ganador) {
    estado.modo = 'gol';
    estado.tiempoGol = 90;
    estado.ultimoGanador = ganador;
    
    if (ganador === 'jugador') {
        estado.scoreJugador++;
        crearCelebracion(estado.puck.x, estado.puck.y, '#2196F3', 40);
    } else {
        estado.scoreCPU++;
        crearCelebracion(estado.puck.x, estado.puck.y, '#F44336', 40);
    }
    
    estado.shake = 15;
    actualizarUI();
    
    if (estado.scoreJugador >= estado.meta || estado.scoreCPU >= estado.meta || estado.tiempo <= 0) {
        setTimeout(() => {
            estado.modo = 'gameover';
        }, 1500);
    }
}

function siguienteRonda() {
    const direccion = estado.ultimoGanador === 'jugador' ? 1 : -1;
    estado.puck.reset(direccion);
    estado.modo = 'jugando';
}

function actualizarUI() {
    document.getElementById('scoreJugador').textContent = estado.scoreJugador;
    document.getElementById('scoreCPU').textContent = estado.scoreCPU;
    document.getElementById('tiempo').textContent = Math.max(0, Math.floor(estado.tiempo));
}

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    estado.mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
    estado.mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
});

canvas.addEventListener('mousedown', () => {
    if (estado.modo === 'titulo' || estado.modo === 'gameover') {
        iniciarJuego();
    }
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (estado.modo === 'titulo' || estado.modo === 'gameover') {
        iniciarJuego();
    }
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    estado.mouse.x = (t.clientX - rect.left) * (canvas.width / rect.width);
    estado.mouse.y = (t.clientY - rect.top) * (canvas.height / rect.height);
});

function dibujarPista() {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#E3F2FD');
    grad.addColorStop(0.5, '#BBDEFB');
    grad.addColorStop(1, '#E3F2FD');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(0, canvas.height/2);
    ctx.lineTo(canvas.width, canvas.height/2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(canvas.width/2, canvas.height/2, 60, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(canvas.width/2, canvas.height/2, 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(33, 150, 243, 0.3)';
    ctx.fillRect(canvas.width/2 - 60, 0, 120, 15);
    ctx.strokeStyle = '#2196F3';
    ctx.lineWidth = 3;
    ctx.strokeRect(canvas.width/2 - 60, 0, 120, 15);
    
    ctx.fillStyle = 'rgba(244, 67, 54, 0.3)';
    ctx.fillRect(canvas.width/2 - 60, canvas.height - 15, 120, 15);
    ctx.strokeStyle = '#F44336';
    ctx.lineWidth = 3;
    ctx.strokeRect(canvas.width/2 - 60, canvas.height - 15, 120, 15);
    
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
}

function dibujarGol() {
    if (estado.modo !== 'gol') return;
    
    const alpha = Math.min(1, estado.tiempoGol / 30);
    const scale = 1 + (1 - alpha) * 0.5;
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.scale(scale, scale);
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 60px Arial';
    
    const color = estado.ultimoGanador === 'jugador' ? '#2196F3' : '#F44336';
    const texto = estado.ultimoGanador === 'jugador' ? '¡GOOOL!' : '¡GOL CPU!';
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 6;
    ctx.strokeText(texto, 0, 0);
    ctx.fillStyle = color;
    ctx.fillText(texto, 0, 0);
    
    ctx.restore();
}

function dibujarTitulo() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const cx = canvas.width/2;
    const cy = canvas.height/2;
    
    ctx.save();
    ctx.translate(cx, cy - 80);
    ctx.rotate(estado.tiempo * 0.03);
    ctx.scale(2.5, 2.5);
    
    const grad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 15);
    grad.addColorStop(0, '#333');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    ctx.restore();
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.font = 'bold 45px Arial';
    ctx.fillStyle = '#FFF';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.strokeText('HOCKEY', cx, cy + 20);
    ctx.fillText('HOCKEY', cx, cy + 20);
    ctx.strokeText('HIELO', cx, cy + 70);
    ctx.fillText('HIELO', cx, cy + 70);
    
    ctx.font = '14px Arial';
    ctx.fillStyle = '#FFF';
    ctx.fillText('Primero en llegar a 5 goles gana', cx, cy + 110);
    
    const alpha = 0.5 + Math.sin(estado.tiempo * 0.08) * 0.5;
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('CLICK para jugar', cx, cy + 145);
    ctx.globalAlpha = 1;
}

function dibujarGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const cx = canvas.width/2;
    const cy = canvas.height/2;
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const ganador = estado.scoreJugador >= estado.meta ? 'jugador' : 'cpu';
    const color = ganador === 'jugador' ? '#2196F3' : '#F44336';
    const texto = ganador === 'jugador' ? '¡GANASTE!' : '¡PERDISTE!';
    
    ctx.font = 'bold 50px Arial';
    ctx.fillStyle = color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 5;
    ctx.strokeText(texto, cx, cy - 60);
    ctx.fillText(texto, cx, cy - 60);
    
    ctx.font = 'bold 30px Arial';
    ctx.fillStyle = '#FFF';
    ctx.fillText(`${estado.scoreJugador} - ${estado.scoreCPU}`, cx, cy);
    
    const emoji = ganador === 'jugador' ? '🏆' : '😢';
    ctx.font = '50px Arial';
    ctx.fillText(emoji, cx, cy + 60);
    
    const alpha = 0.5 + Math.sin(estado.tiempo * 0.08) * 0.5;
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#FFF';
    ctx.fillText('CLICK para jugar de nuevo', cx, cy + 120);
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
    
    dibujarPista();
    
    if (estado.modo === 'titulo') {
        dibujarTitulo();
        ctx.restore();
        requestAnimationFrame(loop);
        return;
    }
    
    if (estado.modo === 'jugando') {
        estado.tiempo = 60 - (Date.now() - estado.tiempoInicio) / 1000;
        
        estado.jugador.x = estado.mouse.x;
        estado.jugador.y = estado.mouse.y;
        
        estado.jugador.x = Math.max(estado.jugador.radio, Math.min(canvas.width - estado.jugador.radio, estado.jugador.x));
        estado.jugador.y = Math.max(canvas.height/2 + estado.jugador.radio, Math.min(canvas.height - estado.jugador.radio, estado.jugador.y));
        
        estado.jugador.actualizar();
        actualizarCPU();
        estado.cpu.actualizar();
        
        const resultadoGol = estado.puck.actualizar();
        if (resultadoGol) {
            gol(resultadoGol);
        }
        
        verificarColisionPaloPuck(estado.jugador);
        verificarColisionPaloPuck(estado.cpu);
        
        actualizarUI();
    }
    
    if (estado.modo === 'gol') {
        estado.tiempoGol--;
        if (estado.tiempoGol <= 0 && estado.modo !== 'gameover') {
            siguienteRonda();
        }
    }
    
    estado.particulas = estado.particulas.filter(p => p.life > 0);
    estado.particulas.forEach(p => p.actualizar());
    
    estado.puck.dibujar();
    estado.cpu.dibujar();
    estado.jugador.dibujar();
    estado.particulas.forEach(p => p.dibujar());
    
    dibujarGol();
    
    if (estado.modo === 'gameover') {
        dibujarGameOver();
    }
    
    ctx.restore();
    requestAnimationFrame(loop);
}

estado.puck = new Puck();
estado.jugador = new Paddle(canvas.width/2, canvas.height - 80, '#2196F3', false);
estado.cpu = new Paddle(canvas.width/2, 80, '#F44336', true);
loop();
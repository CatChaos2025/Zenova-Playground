const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ============ CONSTANTES ============
const ANCHO_BLOQUE_INICIAL = 160;
const ALTO_BLOQUE = 25;
const VELOCIDAD_INICIAL = 3;
const VELOCIDAD_MAXIMA = 10;
const PERFECT_THRESHOLD = 5;

// ============ ESTADO ============
const estado = {
    modo: 'titulo',
    bloques: [],
    bloqueActual: null,
    bloquesCortados: [],
    puntuacion: 0,
    perfectos: 0,
    record: parseInt(localStorage.getItem('torreInfinitaRecord')) || 0,
    velocidad: VELOCIDAD_INICIAL,
    tiempo: 0,
    camaraY: 0,
    targetCamaraY: 0,
    particulas: [],
    mensajePerfecto: 0,
    shake: 0
};

// ============ CLASE BLOQUE ============
class Bloque {
    constructor(x, y, width, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = ALTO_BLOQUE;
        this.color = color;
        this.vx = 0;
        this.vy = 0;
        this.fijo = false;
        this.direccion = 1;
    }

    actualizar() {
        if (this.fijo) return;
        
        this.x += this.vx * this.direccion;
        
        if (this.x + this.width > canvas.width) {
            this.x = canvas.width - this.width;
            this.direccion = -1;
        }
        if (this.x < 0) {
            this.x = 0;
            this.direccion = 1;
        }
    }

    dibujar(camaraY) {
        const screenY = this.y - camaraY;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(this.x + 2, screenY + 2, this.width, this.height);
        
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x, screenY, this.width, this.height);
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(this.x, screenY, this.width, 4);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(this.x, screenY, this.width, this.height);
    }
}

// ============ CLASE BLOQUE CORTADO ============
class BloqueCortado {
    constructor(x, y, width, height, color, direccion) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.vx = direccion * 2;
        this.vy = 0;
        this.gravedad = 0.5;
        this.rotation = 0;
        this.rotVel = direccion * 0.05;
    }

    actualizar() {
        this.vy += this.gravedad;
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotVel;
    }

    dibujar(camaraY) {
        const screenY = this.y - camaraY;
        
        ctx.save();
        ctx.translate(this.x + this.width/2, screenY + this.height/2);
        ctx.rotate(this.rotation);
        
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.7;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        ctx.globalAlpha = 1;
        
        ctx.restore();
    }
}

// ============ PARTÍCULA ============
class Particula {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8 - 2;
        this.color = color;
        this.size = Math.random() * 4 + 2;
        this.life = 1;
    }

    actualizar() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.3;
        this.life -= 0.02;
        this.size *= 0.97;
    }

    dibujar(camaraY) {
        if (this.life <= 0) return;
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y - camaraY, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

// ============ COLORES ============
function obtenerColor(indice) {
    const colores = [
        '#ff6b9d', '#4a90e2', '#50c878', '#ffd93d', 
        '#c06eff', '#ff8c42', '#00ffff', '#ff00ff'
    ];
    return colores[indice % colores.length];
}

// ============ INICIALIZACIÓN ============
function iniciarJuego() {
    estado.modo = 'jugando';
    estado.bloques = [];
    estado.bloquesCortados = [];
    estado.particulas = [];
    estado.puntuacion = 0;
    estado.perfectos = 0;
    estado.velocidad = VELOCIDAD_INICIAL;
    estado.camaraY = 0;
    estado.targetCamaraY = 0;
    estado.mensajePerfecto = 0;
    estado.shake = 0;
    
    const baseX = (canvas.width - ANCHO_BLOQUE_INICIAL) / 2;
    const baseY = canvas.height - 40;
    const base = new Bloque(baseX, baseY, ANCHO_BLOQUE_INICIAL, obtenerColor(0));
    base.fijo = true;
    estado.bloques.push(base);
    
    crearNuevoBloque();
    actualizarUI();
}

function crearNuevoBloque() {
    const ultimo = estado.bloques[estado.bloques.length - 1];
    const nuevoY = ultimo.y - ALTO_BLOQUE;
    const color = obtenerColor(estado.bloques.length);
    
    const nuevo = new Bloque(0, nuevoY, ultimo.width, color);
    nuevo.vx = estado.velocidad;
    nuevo.direccion = estado.bloques.length % 2 === 0 ? 1 : -1;
    
    if (nuevo.direccion === 1) {
        nuevo.x = -nuevo.width;
    } else {
        nuevo.x = canvas.width;
    }
    
    estado.bloqueActual = nuevo;
}

// ============ COLOCAR BLOQUE ============
function colocarBloque() {
    if (estado.modo !== 'jugando' || !estado.bloqueActual) return;
    
    const actual = estado.bloqueActual;
    const anterior = estado.bloques[estado.bloques.length - 1];
    
    const overlapStart = Math.max(actual.x, anterior.x);
    const overlapEnd = Math.min(actual.x + actual.width, anterior.x + anterior.width);
    const overlapWidth = overlapEnd - overlapStart;
    
    if (overlapWidth <= 0) {
        gameOver();
        return;
    }
    
    const diff = Math.abs(actual.x - anterior.x);
    if (diff <= PERFECT_THRESHOLD) {
        actual.x = anterior.x;
        actual.width = anterior.width;
        actual.fijo = true;
        estado.bloques.push(actual);
        estado.perfectos++;
        estado.mensajePerfecto = 60;
        estado.shake = 8;
        
        if (actual.width < ANCHO_BLOQUE_INICIAL) {
            actual.width = Math.min(ANCHO_BLOQUE_INICIAL, actual.width + 4);
            actual.x = anterior.x - (actual.width - anterior.width) / 2;
        }
        
        crearExplosion(actual.x + actual.width/2, actual.y, actual.color, 25);
    } else {
        actual.fijo = true;
        actual.x = overlapStart;
        actual.width = overlapWidth;
        estado.bloques.push(actual);
        
        if (actual.x > anterior.x) {
            const cortado = new BloqueCortado(
                anterior.x, actual.y,
                actual.x - anterior.x, ALTO_BLOQUE,
                anterior.color, -1
            );
            estado.bloquesCortados.push(cortado);
        }
        if (actual.x + actual.width < anterior.x + anterior.width) {
            const cortado = new BloqueCortado(
                actual.x + actual.width, actual.y,
                (anterior.x + anterior.width) - (actual.x + actual.width), ALTO_BLOQUE,
                anterior.color, 1
            );
            estado.bloquesCortados.push(cortado);
        }
        
        estado.shake = 4;
        crearExplosion(actual.x + actual.width/2, actual.y, actual.color, 12);
    }
    
    estado.puntuacion++;
    estado.velocidad = Math.min(VELOCIDAD_MAXIMA, VELOCIDAD_INICIAL + estado.puntuacion * 0.15);
    
    estado.targetCamaraY = Math.max(0, (estado.bloques.length - 12) * ALTO_BLOQUE);
    
    actualizarUI();
    crearNuevoBloque();
}

function gameOver() {
    estado.modo = 'gameover';
    estado.shake = 15;
    
    if (estado.bloqueActual) {
        const caido = new BloqueCortado(
            estado.bloqueActual.x, estado.bloqueActual.y,
            estado.bloqueActual.width, ALTO_BLOQUE,
            estado.bloqueActual.color, estado.bloqueActual.direccion
        );
        estado.bloquesCortados.push(caido);
        estado.bloqueActual = null;
    }
    
    if (estado.puntuacion > estado.record) {
        estado.record = estado.puntuacion;
        localStorage.setItem('torreInfinitaRecord', estado.record);
    }
    actualizarUI();
}

function crearExplosion(x, y, color, cantidad) {
    for (let i = 0; i < cantidad; i++) {
        estado.particulas.push(new Particula(x, y, color));
    }
}

function actualizarUI() {
    document.getElementById('score').textContent = estado.puntuacion;
    document.getElementById('perfectos').textContent = estado.perfectos;
    document.getElementById('record').textContent = estado.record;
}

// ============ DIBUJO ============
function dibujarFondo() {
    const profundidad = Math.min(1, estado.camaraY / 2000);
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, `rgb(${10 + profundidad * 20}, ${10}, ${30 + profundidad * 40})`);
    grad.addColorStop(1, `rgb(${20 + profundidad * 30}, ${10}, ${50 + profundidad * 50})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for (let i = 0; i < 40; i++) {
        const x = (i * 137) % canvas.width;
        const y = ((i * 97 - estado.camaraY * 0.2) % canvas.height + canvas.height) % canvas.height;
        const size = (i % 3) + 1;
        ctx.fillRect(x, y, size, size);
    }
}

function dibujarTitulo() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    
    const colores = ['#ff6b9d', '#4a90e2', '#50c878', '#ffd93d'];
    for (let i = 0; i < 4; i++) {
        const w = 80 - i * 12;
        const h = 20;
        const x = cx - w/2;
        const y = cy - 90 + i * h;
        ctx.fillStyle = colores[i];
        ctx.shadowBlur = 8;
        ctx.shadowColor = colores[i];
        ctx.fillRect(x, y, w, h);
    }
    ctx.shadowBlur = 0;
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.font = 'bold 40px Arial';
    ctx.fillStyle = '#ffd700';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ffd700';
    ctx.fillText('TORRE', cx, cy + 10);
    ctx.fillText('INFINITA', cx, cy + 55);
    ctx.shadowBlur = 0;
    
    const alpha = 0.5 + Math.sin(estado.tiempo * 0.08) * 0.5;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('ESPACIO o CLICK', cx, cy + 110);
    ctx.globalAlpha = 1;
    
    if (estado.record > 0) {
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.fillText(`Récord: ${estado.record}`, cx, cy + 140);
    }
}

function dibujarGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.font = 'bold 40px Arial';
    ctx.fillStyle = '#ff0055';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff0055';
    ctx.fillText('¡CAÍDA!', cx, cy - 40);
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText(`Altura: ${estado.puntuacion}`, cx, cy + 5);
    
    ctx.fillStyle = '#ffd700';
    ctx.font = '18px Arial';
    ctx.fillText(`Perfectos: ${estado.perfectos}`, cx, cy + 35);
    
    if (estado.puntuacion >= estado.record && estado.puntuacion > 0) {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 18px Arial';
        ctx.fillText('¡NUEVO RÉCORD!', cx, cy + 70);
    }
    
    const alpha = 0.5 + Math.sin(estado.tiempo * 0.08) * 0.5;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('ESPACIO o CLICK', cx, cy + 110);
    ctx.globalAlpha = 1;
}

function dibujarMensajePerfecto() {
    if (estado.mensajePerfecto <= 0) return;
    
    const alpha = estado.mensajePerfecto / 60;
    const scale = 1 + (1 - alpha) * 0.3;
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.translate(canvas.width / 2, canvas.height / 2 - 30);
    ctx.scale(scale, scale);
    
    ctx.font = 'bold 40px Arial';
    ctx.fillStyle = '#ffd700';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ffd700';
    ctx.fillText('¡PERFECTO!', 0, 0);
    ctx.shadowBlur = 0;
    
    ctx.restore();
}

// ============ INPUT ============
function manejarInput(e) {
    if (e.type === 'keydown' && e.code !== 'Space') return;
    if (e.type === 'keydown') e.preventDefault();

    if (estado.modo === 'titulo') {
        iniciarJuego();
    } else if (estado.modo === 'jugando') {
        colocarBloque();
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

// ============ LOOP ============
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
    
    estado.camaraY += (estado.targetCamaraY - estado.camaraY) * 0.1;
    
    if (estado.modo === 'titulo') {
        dibujarTitulo();
        ctx.restore();
        requestAnimationFrame(loop);
        return;
    }
    
    if (estado.bloqueActual && estado.modo === 'jugando') {
        estado.bloqueActual.actualizar();
    }
    
    estado.bloquesCortados.forEach(b => b.actualizar());
    estado.bloquesCortados = estado.bloquesCortados.filter(b => b.y - estado.camaraY < canvas.height + 100);
    
    estado.particulas.forEach(p => p.actualizar());
    estado.particulas = estado.particulas.filter(p => p.life > 0);
    
    if (estado.mensajePerfecto > 0) estado.mensajePerfecto--;
    
    estado.bloques.forEach(b => {
        if (b.y - estado.camaraY > -ALTO_BLOQUE && b.y - estado.camaraY < canvas.height + ALTO_BLOQUE) {
            b.dibujar(estado.camaraY);
        }
    });
    
    if (estado.bloqueActual) {
        estado.bloqueActual.dibujar(estado.camaraY);
    }
    
    estado.bloquesCortados.forEach(b => b.dibujar(estado.camaraY));
    estado.particulas.forEach(p => p.dibujar(estado.camaraY));
    
    dibujarMensajePerfecto();
    
    if (estado.modo === 'gameover') {
        dibujarGameOver();
    }
    
    ctx.restore();
    requestAnimationFrame(loop);
}

// ============ INICIO ============
actualizarUI();
loop();
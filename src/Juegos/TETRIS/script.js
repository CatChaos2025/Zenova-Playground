const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const holdCanvas = document.getElementById('holdCanvas');
const holdCtx = holdCanvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');

// ============ CONSTANTES ============
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 25; // Reducido de 30 a 25
const COLORS = [
    null,
    '#00f0f0', // I - Cyan
    '#0000f0', // J - Blue
    '#f0a000', // L - Orange
    '#f0f000', // O - Yellow
    '#00f000', // S - Green
    '#a000f0', // T - Purple
    '#f00000'  // Z - Red
];

// ============ PIEZAS TETROMINOS ============
const PIEZAS = {
    I: [[1,1,1,1]],
    J: [[2,0,0],[2,2,2]],
    L: [[0,0,3],[3,3,3]],
    O: [[4,4],[4,4]],
    S: [[0,5,5],[5,5,0]],
    T: [[0,6,0],[6,6,6]],
    Z: [[7,7,0],[0,7,7]]
};

const NOMBRES_PIEZAS = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

// ============ ESTADO ============
const estado = {
    modo: 'jugando',
    tablero: [],
    piezaActual: null,
    siguiente: null,
    hold: null,
    puedeHold: true,
    puntuacion: 0,
    record: parseInt(localStorage.getItem('tetrisRecord')) || 0,
    nivel: 1,
    lineas: 0,
    tiempo: 0,
    ultimoDrop: 0,
    velocidadDrop: 1000,
    lineasAnimadas: [],
    animacionLinea: 0
};

// ============ INICIALIZACIÓN ============
function crearTablero() {
    const tablero = [];
    for (let i = 0; i < ROWS; i++) {
        tablero.push(new Array(COLS).fill(0));
    }
    return tablero;
}

function crearPieza(tipo) {
    const forma = PIEZAS[tipo].map(fila => [...fila]);
    return {
        tipo,
        forma,
        x: Math.floor(COLS / 2) - Math.floor(forma[0].length / 2),
        y: 0
    };
}

function piezaAleatoria() {
    const tipo = NOMBRES_PIEZAS[Math.floor(Math.random() * NOMBRES_PIEZAS.length)];
    return crearPieza(tipo);
}

function iniciarJuego() {
    estado.tablero = crearTablero();
    estado.puntuacion = 0;
    estado.nivel = 1;
    estado.lineas = 0;
    estado.velocidadDrop = 1000;
    estado.hold = null;
    estado.puedeHold = true;
    estado.siguiente = piezaAleatoria();
    estado.piezaActual = piezaAleatoria();
    estado.siguiente = piezaAleatoria();
    estado.modo = 'jugando';
    estado.lineasAnimadas = [];
    document.getElementById('modalGameOver').classList.add('oculto');
    actualizarUI();
    dibujarHold();
    dibujarNext();
}

// ============ LÓGICA DE PIEZAS ============
function colisiona(pieza, offsetX = 0, offsetY = 0, nuevaForma = null) {
    const forma = nuevaForma || pieza.forma;
    for (let y = 0; y < forma.length; y++) {
        for (let x = 0; x < forma[y].length; x++) {
            if (forma[y][x]) {
                const newX = pieza.x + x + offsetX;
                const newY = pieza.y + y + offsetY;
                
                if (newX < 0 || newX >= COLS || newY >= ROWS) return true;
                if (newY >= 0 && estado.tablero[newY][newX]) return true;
            }
        }
    }
    return false;
}

function fijarPieza() {
    const pieza = estado.piezaActual;
    for (let y = 0; y < pieza.forma.length; y++) {
        for (let x = 0; x < pieza.forma[y].length; x++) {
            if (pieza.forma[y][x]) {
                const boardY = pieza.y + y;
                const boardX = pieza.x + x;
                if (boardY >= 0) {
                    estado.tablero[boardY][boardX] = pieza.forma[y][x];
                }
            }
        }
    }
    
    verificarLineas();
    estado.piezaActual = estado.siguiente;
    estado.siguiente = piezaAleatoria();
    estado.puedeHold = true;
    dibujarNext();
    
    if (colisiona(estado.piezaActual)) {
        gameOver();
    }
}

function rotarPieza() {
    const pieza = estado.piezaActual;
    const nuevaForma = [];
    
    for (let x = 0; x < pieza.forma[0].length; x++) {
        const nuevaFila = [];
        for (let y = pieza.forma.length - 1; y >= 0; y--) {
            nuevaFila.push(pieza.forma[y][x]);
        }
        nuevaForma.push(nuevaFila);
    }
    
    const kicks = [0, -1, 1, -2, 2];
    for (let kick of kicks) {
        if (!colisiona(pieza, kick, 0, nuevaForma)) {
            pieza.forma = nuevaForma;
            pieza.x += kick;
            return;
        }
    }
}

function moverPieza(dirX, dirY) {
    if (!colisiona(estado.piezaActual, dirX, dirY)) {
        estado.piezaActual.x += dirX;
        estado.piezaActual.y += dirY;
        return true;
    }
    return false;
}

function hardDrop() {
    while (moverPieza(0, 1)) {
        estado.puntuacion += 2;
    }
    fijarPieza();
    actualizarUI();
}

function holdPieza() {
    if (!estado.puedeHold) return;
    
    const actual = estado.piezaActual;
    
    if (estado.hold) {
        estado.piezaActual = crearPieza(estado.hold);
        estado.hold = actual.tipo;
    } else {
        estado.hold = actual.tipo;
        estado.piezaActual = estado.siguiente;
        estado.siguiente = piezaAleatoria();
        dibujarNext();
    }
    
    estado.puedeHold = false;
    dibujarHold();
}

// ============ LÍNEAS ============
function verificarLineas() {
    const lineasCompletas = [];
    
    for (let y = ROWS - 1; y >= 0; y--) {
        if (estado.tablero[y].every(celda => celda !== 0)) {
            lineasCompletas.push(y);
        }
    }
    
    if (lineasCompletas.length > 0) {
        estado.lineasAnimadas = lineasCompletas;
        estado.animacionLinea = 30;
        
        setTimeout(() => {
            lineasCompletas.sort((a, b) => b - a);
            for (let linea of lineasCompletas) {
                estado.tablero.splice(linea, 1);
                estado.tablero.unshift(new Array(COLS).fill(0));
            }
            
            const puntos = [0, 100, 300, 500, 800];
            estado.puntuacion += puntos[lineasCompletas.length] * estado.nivel;
            estado.lineas += lineasCompletas.length;
            
            estado.nivel = Math.floor(estado.lineas / 10) + 1;
            estado.velocidadDrop = Math.max(100, 1000 - (estado.nivel - 1) * 80);
            
            estado.lineasAnimadas = [];
            actualizarUI();
        }, 500);
    }
}

// ============ GAME OVER ============
function gameOver() {
    estado.modo = 'gameover';
    if (estado.puntuacion > estado.record) {
        estado.record = estado.puntuacion;
        localStorage.setItem('tetrisRecord', estado.record);
    }
    
    document.getElementById('modalScore').textContent = estado.puntuacion;
    document.getElementById('modalLevel').textContent = estado.nivel;
    document.getElementById('modalLines').textContent = estado.lineas;
    document.getElementById('modalGameOver').classList.remove('oculto');
    actualizarUI();
}

// ============ DIBUJO ============
function dibujarBloque(contexto, x, y, colorIndex, size = BLOCK_SIZE) {
    if (!colorIndex) return;
    
    const color = COLORS[colorIndex];
    const px = x * size;
    const py = y * size;
    
    contexto.fillStyle = color;
    contexto.fillRect(px, py, size, size);
    
    contexto.fillStyle = 'rgba(255, 255, 255, 0.3)';
    contexto.fillRect(px, py, size, size * 0.2);
    
    contexto.fillStyle = 'rgba(0, 0, 0, 0.3)';
    contexto.fillRect(px, py + size * 0.8, size, size * 0.2);
    
    contexto.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    contexto.lineWidth = 1.5;
    contexto.strokeRect(px, py, size, size);
}

function dibujarTablero() {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * BLOCK_SIZE, 0);
        ctx.lineTo(x * BLOCK_SIZE, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * BLOCK_SIZE);
        ctx.lineTo(canvas.width, y * BLOCK_SIZE);
        ctx.stroke();
    }
    
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (estado.tablero[y][x]) {
                if (estado.lineasAnimadas.includes(y)) {
                    ctx.globalAlpha = 0.5 + Math.sin(estado.animacionLinea * 0.5) * 0.5;
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                    ctx.globalAlpha = 1;
                } else {
                    dibujarBloque(ctx, x, y, estado.tablero[y][x]);
                }
            }
        }
    }
    
    if (estado.piezaActual && estado.modo === 'jugando') {
        const ghost = { ...estado.piezaActual };
        while (!colisiona(ghost, 0, 1)) {
            ghost.y++;
        }
        
        ctx.globalAlpha = 0.3;
        for (let y = 0; y < ghost.forma.length; y++) {
            for (let x = 0; x < ghost.forma[y].length; x++) {
                if (ghost.forma[y][x]) {
                    dibujarBloque(ctx, ghost.x + x, ghost.y + y, ghost.forma[y][x]);
                }
            }
        }
        ctx.globalAlpha = 1;
    }
    
    if (estado.piezaActual && estado.modo === 'jugando') {
        for (let y = 0; y < estado.piezaActual.forma.length; y++) {
            for (let x = 0; x < estado.piezaActual.forma[y].length; x++) {
                if (estado.piezaActual.forma[y][x]) {
                    dibujarBloque(ctx, estado.piezaActual.x + x, estado.piezaActual.y + y, estado.piezaActual.forma[y][x]);
                }
            }
        }
    }
    
    if (estado.modo === 'pausado') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSA', canvas.width/2, canvas.height/2);
        ctx.font = '16px Arial';
        ctx.fillText('Presiona P', canvas.width/2, canvas.height/2 + 30);
    }
}

function dibujarPreview(contexto, pieza) {
    contexto.clearRect(0, 0, contexto.canvas.width, contexto.canvas.height);
    contexto.fillStyle = '#f0f0f0';
    contexto.fillRect(0, 0, contexto.canvas.width, contexto.canvas.height);
    
    if (!pieza) return;
    
    const forma = PIEZAS[pieza];
    const size = 16;
    const offsetX = (contexto.canvas.width - forma[0].length * size) / 2;
    const offsetY = (contexto.canvas.height - forma.length * size) / 2;
    
    for (let y = 0; y < forma.length; y++) {
        for (let x = 0; x < forma[y].length; x++) {
            if (forma[y][x]) {
                const px = offsetX + x * size;
                const py = offsetY + y * size;
                const color = COLORS[forma[y][x]];
                
                contexto.fillStyle = color;
                contexto.fillRect(px, py, size, size);
                contexto.strokeStyle = 'rgba(0,0,0,0.3)';
                contexto.lineWidth = 1.5;
                contexto.strokeRect(px, py, size, size);
            }
        }
    }
}

function dibujarHold() {
    dibujarPreview(holdCtx, estado.hold);
}

function dibujarNext() {
    dibujarPreview(nextCtx, estado.siguiente?.tipo);
}

// ============ INPUT ============
window.addEventListener('keydown', (e) => {
    if (estado.modo === 'gameover') return;
    
    if (e.key === 'p' || e.key === 'P') {
        estado.modo = estado.modo === 'pausado' ? 'jugando' : 'pausado';
        return;
    }
    
    if (estado.modo !== 'jugando') return;
    
    switch(e.key) {
        case 'ArrowLeft':
            moverPieza(-1, 0);
            e.preventDefault();
            break;
        case 'ArrowRight':
            moverPieza(1, 0);
            e.preventDefault();
            break;
        case 'ArrowDown':
            if (moverPieza(0, 1)) estado.puntuacion += 1;
            actualizarUI();
            e.preventDefault();
            break;
        case 'ArrowUp':
            rotarPieza();
            e.preventDefault();
            break;
        case ' ':
            hardDrop();
            e.preventDefault();
            break;
        case 'c':
        case 'C':
            holdPieza();
            e.preventDefault();
            break;
    }
});

document.getElementById('btnReintentar').addEventListener('click', iniciarJuego);

// ============ UI ============
function actualizarUI() {
    document.getElementById('score').textContent = estado.puntuacion;
    document.getElementById('level').textContent = estado.nivel;
    document.getElementById('lines').textContent = estado.lineas;
    document.getElementById('record').textContent = estado.record;
}

// ============ LOOP ============
function loop() {
    estado.tiempo++;
    
    if (estado.modo === 'jugando' && estado.lineasAnimadas.length === 0) {
        const ahora = Date.now();
        if (ahora - estado.ultimoDrop > estado.velocidadDrop) {
            if (!moverPieza(0, 1)) {
                fijarPieza();
            }
            estado.ultimoDrop = ahora;
        }
    }
    
    if (estado.animacionLinea > 0) estado.animacionLinea--;
    
    dibujarTablero();
    requestAnimationFrame(loop);
}

// ============ INICIO ============
iniciarJuego();
loop();
// ============ CONSTANTES ============
const TAMANO = 4;
const EMOJIS = ['🐣', '🐥', '🐔', '🦅', '🦉', '🦚', '🦄'];

// ============ ESTADO ============
const estado = {
    tablero: [],
    puntuacion: 0,
    record: parseInt(localStorage.getItem('emoji2048Record')) || 0,
    gameOver: false,
    victoria: false
};

// ============ INICIALIZACIÓN ============
function crearTableroVacio() {
    const tablero = [];
    for (let i = 0; i < TAMANO; i++) {
        tablero.push([]);
        for (let j = 0; j < TAMANO; j++) {
            tablero[i].push(0);
        }
    }
    return tablero;
}

function celdasVacias() {
    const vacias = [];
    for (let i = 0; i < TAMANO; i++) {
        for (let j = 0; j < TAMANO; j++) {
            if (estado.tablero[i][j] === 0) {
                vacias.push({ i, j });
            }
        }
    }
    return vacias;
}

function agregarNuevoEmoji() {
    const vacias = celdasVacias();
    if (vacias.length === 0) return;
    
    const celda = vacias[Math.floor(Math.random() * vacias.length)];
    // 90% probabilidad de nivel 1, 10% de nivel 2
    estado.tablero[celda.i][celda.j] = Math.random() < 0.9 ? 1 : 2;
}

function iniciarJuego() {
    estado.tablero = crearTableroVacio();
    estado.puntuacion = 0;
    estado.gameOver = false;
    estado.victoria = false;
    
    agregarNuevoEmoji();
    agregarNuevoEmoji();
    
    renderizar();
    actualizarUI();
    document.getElementById('modalGameOver').classList.add('oculto');
}

// ============ LÓGICA DE MOVIMIENTO ============
function mover(direccion) {
    if (estado.gameOver) return;
    
    let movido = false;
    const tableroAntes = JSON.stringify(estado.tablero);
    
    // Rotar tablero según dirección para simplificar lógica
    let rotaciones = 0;
    if (direccion === 'arriba') rotaciones = 3;
    else if (direccion === 'derecha') rotaciones = 2;
    else if (direccion === 'abajo') rotaciones = 1;
    else if (direccion === 'izquierda') rotaciones = 0;
    
    for (let r = 0; r < rotaciones; r++) rotarTablero();
    
    // Mover hacia la izquierda (después de rotar)
    for (let i = 0; i < TAMANO; i++) {
        const fila = estado.tablero[i].filter(x => x !== 0);
        
        // Combinar iguales
        for (let j = 0; j < fila.length - 1; j++) {
            if (fila[j] === fila[j + 1]) {
                fila[j]++;
                estado.puntuacion += Math.pow(2, fila[j]);
                fila.splice(j + 1, 1);
                
                // Verificar victoria (nivel 7 = 🦄)
                if (fila[j] >= 7 && !estado.victoria) {
                    estado.victoria = true;
                    setTimeout(() => mostrarModal('¡VICTORIA!', '¡Has llegado al Unicornio! 🦄'), 300);
                }
            }
        }
        
        // Rellenar con ceros
        while (fila.length < TAMANO) fila.push(0);
        estado.tablero[i] = fila;
    }
    
    // Rotar de vuelta
    for (let r = 0; r < (4 - rotaciones) % 4; r++) rotarTablero();
    
    // Verificar si hubo movimiento
    const tableroDespues = JSON.stringify(estado.tablero);
    if (tableroAntes !== tableroDespues) {
        movido = true;
        agregarNuevoEmoji();
        
        // Verificar game over
        if (!hayMovimientosPosibles()) {
            estado.gameOver = true;
            setTimeout(() => mostrarModal('💀 GAME OVER', 'No hay más movimientos posibles'), 300);
        }
    }
    
    renderizar();
    actualizarUI();
}

function rotarTablero() {
    const nuevo = crearTableroVacio();
    for (let i = 0; i < TAMANO; i++) {
        for (let j = 0; j < TAMANO; j++) {
            nuevo[i][j] = estado.tablero[TAMANO - 1 - j][i];
        }
    }
    estado.tablero = nuevo;
}

function hayMovimientosPosibles() {
    // Hay celdas vacías
    if (celdasVacias().length > 0) return true;
    
    // Hay combinaciones posibles
    for (let i = 0; i < TAMANO; i++) {
        for (let j = 0; j < TAMANO; j++) {
            const val = estado.tablero[i][j];
            if (j < TAMANO - 1 && val === estado.tablero[i][j + 1]) return true;
            if (i < TAMANO - 1 && val === estado.tablero[i + 1][j]) return true;
        }
    }
    
    return false;
}

// ============ RENDERIZADO ============
function renderizar() {
    const tableroDiv = document.getElementById('tablero');
    tableroDiv.innerHTML = '';
    
    for (let i = 0; i < TAMANO; i++) {
        for (let j = 0; j < TAMANO; j++) {
            const celda = document.createElement('div');
            celda.className = 'celda';
            
            const valor = estado.tablero[i][j];
            if (valor > 0) {
                const emoji = EMOJIS[Math.min(valor - 1, EMOJIS.length - 1)];
                celda.textContent = emoji;
                celda.classList.add('con-emoji');
                
                // Color de fondo según nivel
                const colores = [
                    'rgba(255, 200, 100, 0.6)',
                    'rgba(255, 180, 80, 0.7)',
                    'rgba(255, 150, 50, 0.8)',
                    'rgba(255, 120, 30, 0.85)',
                    'rgba(255, 100, 100, 0.9)',
                    'rgba(200, 100, 255, 0.9)',
                    'rgba(255, 215, 0, 1)'
                ];
                celda.style.background = colores[Math.min(valor - 1, colores.length - 1)];
            }
            
            tableroDiv.appendChild(celda);
        }
    }
}

function actualizarUI() {
    document.getElementById('score').textContent = estado.puntuacion;
    document.getElementById('record').textContent = estado.record;
    
    if (estado.puntuacion > estado.record) {
        estado.record = estado.puntuacion;
        localStorage.setItem('emoji2048Record', estado.record);
        document.getElementById('record').textContent = estado.record;
    }
}

function mostrarModal(titulo, texto) {
    document.getElementById('modalTitulo').textContent = titulo;
    document.getElementById('modalTexto').textContent = texto;
    document.getElementById('modalScore').textContent = estado.puntuacion;
    document.getElementById('modalGameOver').classList.remove('oculto');
}

// ============ INPUT ============
window.addEventListener('keydown', (e) => {
    if (estado.gameOver) return;
    
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            mover('arriba');
            e.preventDefault();
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            mover('abajo');
            e.preventDefault();
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            mover('izquierda');
            e.preventDefault();
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            mover('derecha');
            e.preventDefault();
            break;
    }
});

// Soporte táctil (swipe)
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', (e) => {
    if (!touchStartX || !touchStartY) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;
    
    const minSwipe = 30;
    
    if (Math.abs(dx) > Math.abs(dy)) {
        // Swipe horizontal
        if (Math.abs(dx) > minSwipe) {
            if (dx > 0) mover('derecha');
            else mover('izquierda');
        }
    } else {
        // Swipe vertical
        if (Math.abs(dy) > minSwipe) {
            if (dy > 0) mover('abajo');
            else mover('arriba');
        }
    }
    
    touchStartX = 0;
    touchStartY = 0;
});

// Botones
document.getElementById('btnNuevo').addEventListener('click', iniciarJuego);
document.getElementById('btnReintentar').addEventListener('click', iniciarJuego);

// ============ INICIO ============
iniciarJuego();
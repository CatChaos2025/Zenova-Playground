const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ============ CONSTANTES ============
const TAMANO_CELDA = 20;
const COLUMNAS = canvas.width / TAMANO_CELDA; // Ahora será 20
const FILAS = canvas.height / TAMANO_CELDA;   // Ahora será 20
const VELOCIDAD_INICIAL = 10; 
const VELOCIDAD_MINIMA = 4;

// ============ ESTADO ============
const estado = {
    modo: 'titulo',
    serpiente: [],
    direccion: { x: 1, y: 0 },
    direccionSiguiente: { x: 1, y: 0 },
    comida: null,
    powerUp: null,
    puntuacion: 0,
    record: parseInt(localStorage.getItem('snakeNeonRecord')) || 0,
    velocidad: VELOCIDAD_INICIAL,
    frameCount: 0,
    tiempo: 0,
    particulas: [],
    efectoComida: 0
};

function iniciarJuego() {
    estado.modo = 'jugando';
    // Posición inicial centrada para el nuevo tamaño
    estado.serpiente = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    estado.direccion = { x: 1, y: 0 };
    estado.direccionSiguiente = { x: 1, y: 0 };
    estado.puntuacion = 0;
    estado.velocidad = VELOCIDAD_INICIAL;
    estado.frameCount = 0;
    estado.particulas = [];
    estado.comida = null;
    estado.powerUp = null;
    estado.efectoComida = 0;
    
    generarComida();
    actualizarUI();
}

function generarComida() {
    let pos;
    do {
        pos = {
            x: Math.floor(Math.random() * COLUMNAS),
            y: Math.floor(Math.random() * FILAS)
        };
    } while (estaEnSerpiente(pos) || (estado.powerUp && pos.x === estado.powerUp.x && pos.y === estado.powerUp.y));
    
    estado.comida = pos;
}

function generarPowerUp() {
    if (estado.powerUp) return;
    
    let pos;
    do {
        pos = {
            x: Math.floor(Math.random() * COLUMNAS),
            y: Math.floor(Math.random() * FILAS)
        };
    } while (estaEnSerpiente(pos) || (estado.comida && pos.x === estado.comida.x && pos.y === estado.comida.y));
    
    estado.powerUp = { ...pos, tiempo: 300 };
}

function estaEnSerpiente(pos) {
    return estado.serpiente.some(seg => seg.x === pos.x && seg.y === pos.y);
}

function actualizar() {
    if (estado.modo !== 'jugando') return;
    
    estado.tiempo++;
    estado.frameCount++;
    
    if (estado.frameCount >= estado.velocidad) {
        estado.frameCount = 0;
        
        estado.direccion = { ...estado.direccionSiguiente };
        
        const cabeza = estado.serpiente[0];
        const nuevaCabeza = {
            x: cabeza.x + estado.direccion.x,
            y: cabeza.y + estado.direccion.y
        };
        
        if (nuevaCabeza.x < 0 || nuevaCabeza.x >= COLUMNAS ||
            nuevaCabeza.y < 0 || nuevaCabeza.y >= FILAS) {
            gameOver();
            return;
        }
        
        if (estaEnSerpiente(nuevaCabeza)) {
            gameOver();
            return;
        }
        
        estado.serpiente.unshift(nuevaCabeza);
        
        if (estado.comida && nuevaCabeza.x === estado.comida.x && nuevaCabeza.y === estado.comida.y) {
            estado.puntuacion += 10;
            estado.efectoComida = 20;
            crearExplosion(estado.comida.x * TAMANO_CELDA + TAMANO_CELDA/2, 
                          estado.comida.y * TAMANO_CELDA + TAMANO_CELDA/2, '#ff0000', 15);
            generarComida();
            
            estado.velocidad = Math.max(VELOCIDAD_MINIMA, estado.velocidad - 0.5);
            
            if (Math.random() < 0.3) generarPowerUp();
        } 
        else if (estado.powerUp && nuevaCabeza.x === estado.powerUp.x && nuevaCabeza.y === estado.powerUp.y) {
            estado.puntuacion += 50;
            estado.efectoComida = 30;
            crearExplosion(estado.powerUp.x * TAMANO_CELDA + TAMANO_CELDA/2, 
                          estado.powerUp.y * TAMANO_CELDA + TAMANO_CELDA/2, '#ffff00', 25);
            estado.powerUp = null;
            
            for (let i = 0; i < 3; i++) {
                estado.serpiente.push({ ...estado.serpiente[estado.serpiente.length - 1] });
            }
        }
        else {
            estado.serpiente.pop();
        }
        
        if (estado.powerUp) {
            estado.powerUp.tiempo--;
            if (estado.powerUp.tiempo <= 0) estado.powerUp = null;
        }
        
        if (estado.efectoComida > 0) estado.efectoComida--;
        actualizarUI();
    }
    
    estado.particulas = estado.particulas.filter(p => p.life > 0);
    estado.particulas.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.03;
        p.size *= 0.97;
    });
}

function gameOver() {
    estado.modo = 'gameover';
    crearExplosion(estado.serpiente[0].x * TAMANO_CELDA + TAMANO_CELDA/2, 
                  estado.serpiente[0].y * TAMANO_CELDA + TAMANO_CELDA/2, '#ff0000', 40);
    
    if (estado.puntuacion > estado.record) {
        estado.record = estado.puntuacion;
        localStorage.setItem('snakeNeonRecord', estado.record);
    }
    actualizarUI();
}

function crearExplosion(x, y, color, cantidad) {
    for (let i = 0; i < cantidad; i++) {
        estado.particulas.push({
            x, y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            color,
            size: Math.random() * 4 + 2,
            life: 1
        });
    }
}

function dibujar() {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += TAMANO_CELDA) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += TAMANO_CELDA) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
    
    if (estado.modo === 'titulo') {
        dibujarTitulo();
        return;
    }
    
    if (estado.comida) {
        const x = estado.comida.x * TAMANO_CELDA;
        const y = estado.comida.y * TAMANO_CELDA;
        const pulso = Math.sin(estado.tiempo * 0.1) * 2;
        
        ctx.fillStyle = '#ff0000';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff0000';
        ctx.beginPath();
        ctx.arc(x + TAMANO_CELDA/2, y + TAMANO_CELDA/2, TAMANO_CELDA/2 - 2 + pulso, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(x + TAMANO_CELDA/2 - 3, y + TAMANO_CELDA/2 - 3, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    if (estado.powerUp) {
        const x = estado.powerUp.x * TAMANO_CELDA;
        const y = estado.powerUp.y * TAMANO_CELDA;
        const pulso = Math.sin(estado.tiempo * 0.15) * 3;
        const alpha = estado.powerUp.tiempo < 100 ? (estado.powerUp.tiempo / 100) : 1;
        
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ffff00';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ffff00';
        ctx.beginPath();
        ctx.arc(x + TAMANO_CELDA/2, y + TAMANO_CELDA/2, TAMANO_CELDA/2 - 1 + pulso, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', x + TAMANO_CELDA/2, y + TAMANO_CELDA/2);
        ctx.globalAlpha = 1;
    }
    
    estado.serpiente.forEach((seg, i) => {
        const x = seg.x * TAMANO_CELDA;
        const y = seg.y * TAMANO_CELDA;
        
        const hue = (i * 10 + estado.tiempo) % 360;
        const color = `hsl(${hue}, 100%, 50%)`;
        
        ctx.fillStyle = color;
        ctx.shadowBlur = i === 0 ? 20 : 10;
        ctx.shadowColor = color;
        
        if (estado.efectoComida > 0 && i < 5) ctx.shadowBlur = 30;
        
        ctx.fillRect(x + 1, y + 1, TAMANO_CELDA - 2, TAMANO_CELDA - 2);
        ctx.shadowBlur = 0;
        
        if (i === 0) {
            ctx.fillStyle = '#fff';
            const eyeSize = 3;
            const eyeOffset = 5;
            
            if (estado.direccion.x === 1) {
                ctx.fillRect(x + TAMANO_CELDA - eyeOffset, y + 5, eyeSize, eyeSize);
                ctx.fillRect(x + TAMANO_CELDA - eyeOffset, y + TAMANO_CELDA - 8, eyeSize, eyeSize);
            } else if (estado.direccion.x === -1) {
                ctx.fillRect(x + eyeOffset - 3, y + 5, eyeSize, eyeSize);
                ctx.fillRect(x + eyeOffset - 3, y + TAMANO_CELDA - 8, eyeSize, eyeSize);
            } else if (estado.direccion.y === -1) {
                ctx.fillRect(x + 5, y + eyeOffset - 3, eyeSize, eyeSize);
                ctx.fillRect(x + TAMANO_CELDA - 8, y + eyeOffset - 3, eyeSize, eyeSize);
            } else {
                ctx.fillRect(x + 5, y + TAMANO_CELDA - eyeOffset, eyeSize, eyeSize);
                ctx.fillRect(x + TAMANO_CELDA - 8, y + TAMANO_CELDA - eyeOffset, eyeSize, eyeSize);
            }
        }
    });
    
    estado.particulas.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1;
    
    if (estado.modo === 'pausado') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 50px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSA', canvas.width/2, canvas.height/2);
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText('Presiona ESPACIO', canvas.width/2, canvas.height/2 + 40);
    }
    
    if (estado.modo === 'gameover') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 50px Arial';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff0000';
        ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 30);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.fillText(`Puntos: ${estado.puntuacion}`, canvas.width/2, canvas.height/2 + 20);
        ctx.font = '18px Arial';
        ctx.fillText('ENTER para reintentar', canvas.width/2, canvas.height/2 + 60);
    }
}

function dibujarTitulo() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00ff00';
    ctx.beginPath();
    for (let i = 0; i < 20; i++) {
        const x = cx - 100 + i * 10;
        const y = cy - 80 + Math.sin(estado.tiempo * 0.05 + i * 0.5) * 20;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.font = 'bold 60px Arial';
    ctx.fillStyle = '#00ff00';
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#00ff00';
    ctx.fillText('SNAKE', cx, cy - 20);
    ctx.fillText('NEÓN', cx, cy + 40);
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = '#888';
    ctx.font = '18px Arial';
    ctx.fillText('El clásico reinventado', cx, cy + 90);
    
    const alpha = 0.5 + Math.sin(estado.tiempo * 0.05) * 0.5;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 22px Arial';
    ctx.fillText('Presiona ENTER', cx, cy + 140);
    ctx.globalAlpha = 1;
    
    if (estado.record > 0) {
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.fillText(`Récord: ${estado.record}`, cx, cy + 180);
    }
}

window.addEventListener('keydown', (e) => {
    if (estado.modo === 'titulo') {
        if (e.key === 'Enter') {
            iniciarJuego();
            e.preventDefault();
        }
        return;
    }
    
    if (estado.modo === 'gameover') {
        if (e.key === 'Enter') {
            estado.modo = 'titulo';
            e.preventDefault();
        }
        return;
    }
    
    if (estado.modo === 'pausado') {
        if (e.key === ' ') {
            estado.modo = 'jugando';
            e.preventDefault();
        }
        return;
    }
    
    if (estado.modo === 'jugando') {
        switch (e.key) {
            case 'ArrowUp': case 'w': case 'W':
                if (estado.direccion.y !== 1) estado.direccionSiguiente = { x: 0, y: -1 };
                e.preventDefault(); break;
            case 'ArrowDown': case 's': case 'S':
                if (estado.direccion.y !== -1) estado.direccionSiguiente = { x: 0, y: 1 };
                e.preventDefault(); break;
            case 'ArrowLeft': case 'a': case 'A':
                if (estado.direccion.x !== 1) estado.direccionSiguiente = { x: -1, y: 0 };
                e.preventDefault(); break;
            case 'ArrowRight': case 'd': case 'D':
                if (estado.direccion.x !== -1) estado.direccionSiguiente = { x: 1, y: 0 };
                e.preventDefault(); break;
            case ' ':
                estado.modo = 'pausado';
                e.preventDefault(); break;
        }
    }
});

function actualizarUI() {
    document.getElementById('score').textContent = estado.puntuacion;
    document.getElementById('record').textContent = estado.record;
    document.getElementById('largo').textContent = estado.serpiente.length;
}

function loop() {
    estado.tiempo++;
    actualizar();
    dibujar();
    requestAnimationFrame(loop);
}

actualizarUI();
loop();
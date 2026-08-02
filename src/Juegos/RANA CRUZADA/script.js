const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ============ CONSTANTES ============
const TAMANO = 40;
const COLUMNAS = canvas.width / TAMANO; // 12
const FILAS = canvas.height / TAMANO;   // 12

// ============ ESTADO ============
const estado = {
    modo: 'titulo',
    puntuacion: 0,
    record: parseInt(localStorage.getItem('ranaCruzadaRecord')) || 0,
    vidas: 3,
    tiempo: 0,
    rana: null,
    carriles: [],
    casas: [],
    particulas: [],
    mensaje: '',
    mensajeTiempo: 0
};

// ============ DEFINIR CARRILES ============
// Filas 0: casas (meta)
// Filas 1-5: río (troncos)
// Filas 6: zona segura (medio)
// Filas 7-11: carretera (coches)

function crearCarriles() {
    estado.carriles = [];
    
    // Carretera (filas 7-11)
    const velocidadesCoches = [3, -2.5, 2, -3.5, 2.5];
    const tiposCoches = ['coche', 'camion', 'coche', 'deportivo', 'camion'];
    
    for (let i = 0; i < 5; i++) {
        const carril = {
            tipo: 'carretera',
            fila: 11 - i,
            velocidad: velocidadesCoches[i],
            objetos: []
        };
        
        // Crear vehículos
        const numVehiculos = 2 + Math.floor(Math.random() * 2);
        const espaciado = canvas.width / numVehiculos;
        
        for (let j = 0; j < numVehiculos; j++) {
            const tipo = tiposCoches[i];
            const ancho = tipo === 'camion' ? TAMANO * 2 : TAMANO;
            carril.objetos.push({
                tipo,
                x: j * espaciado,
                y: carril.fila * TAMANO,
                width: ancho,
                height: TAMANO,
                color: obtenerColorVehiculo()
            });
        }
        
        estado.carriles.push(carril);
    }
    
    // Río (filas 1-5)
    const velocidadesTroncos = [-2, 2.5, -1.5, 2, -2.5];
    
    for (let i = 0; i < 5; i++) {
        const carril = {
            tipo: 'rio',
            fila: 5 - i,
            velocidad: velocidadesTroncos[i],
            objetos: []
        };
        
        const numTroncos = 2 + Math.floor(Math.random() * 2);
        const espaciado = canvas.width / numTroncos;
        
        for (let j = 0; j < numTroncos; j++) {
            const largo = Math.random() < 0.5 ? 3 : 2;
            carril.objetos.push({
                tipo: 'tronco',
                x: j * espaciado,
                y: carril.fila * TAMANO,
                width: TAMANO * largo,
                height: TAMANO
            });
        }
        
        estado.carriles.push(carril);
    }
    
    // Casas (meta)
    estado.casas = [];
    const posicionesCasas = [1, 4, 7, 10]; // columnas
    posicionesCasas.forEach(col => {
        estado.casas.push({
            x: col * TAMANO,
            y: 0,
            width: TAMANO,
            height: TAMANO,
            ocupada: false
        });
    });
}

function obtenerColorVehiculo() {
    const colores = ['#E74C3C', '#F39C12', '#9B59B6', '#1ABC9C', '#34495E', '#E67E22'];
    return colores[Math.floor(Math.random() * colores.length)];
}

// ============ RANA ============
function crearRana() {
    estado.rana = {
        x: Math.floor(COLUMNAS / 2) * TAMANO,
        y: (FILAS - 1) * TAMANO,
        targetX: Math.floor(COLUMNAS / 2) * TAMANO,
        targetY: (FILAS - 1) * TAMANO,
        size: TAMANO,
        direccion: 'arriba',
        saltando: false,
        tiempoSalto: 0,
        sobreTronco: null
    };
}

// ============ PARTÍCULAS ============
class Particula {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.color = color;
        this.size = Math.random() * 5 + 2;
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
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function crearExplosion(x, y, color, cantidad) {
    for (let i = 0; i < cantidad; i++) {
        estado.particulas.push(new Particula(x, y, color));
    }
}

// ============ INICIALIZACIÓN ============
function iniciarJuego() {
    estado.modo = 'jugando';
    estado.puntuacion = 0;
    estado.vidas = 3;
    estado.particulas = [];
    estado.mensaje = '';
    estado.mensajeTiempo = 0;
    
    crearCarriles();
    crearRana();
    actualizarUI();
}

function perderVida(motivo) {
    estado.vidas--;
    crearExplosion(estado.rana.x + TAMANO/2, estado.rana.y + TAMANO/2, 
                   motivo === 'agua' ? '#4A90E2' : '#FF0000', 20);
    
    if (estado.vidas <= 0) {
        gameOver();
    } else {
        crearRana();
        mostrarMensaje('¡Cuidado!', 60);
    }
    actualizarUI();
}

function llegarACasa() {
    // Encontrar casa libre más cercana
    let casaMasCercana = null;
    let distMinima = Infinity;
    
    estado.casas.forEach(casa => {
        if (!casa.ocupada) {
            const dist = Math.abs(casa.x - estado.rana.x);
            if (dist < distMinima) {
                distMinima = dist;
                casaMasCercana = casa;
            }
        }
    });
    
    if (casaMasCercana && distMinima < TAMANO) {
        casaMasCercana.ocupada = true;
        estado.puntuacion += 100;
        crearExplosion(casaMasCercana.x + TAMANO/2, casaMasCercana.y + TAMANO/2, '#FFD700', 25);
        mostrarMensaje('¡+100!', 40);
        
        // Verificar si todas las casas están llenas
        if (estado.casas.every(c => c.ocupada)) {
            estado.puntuacion += 500;
            mostrarMensaje('¡BONUS +500!', 80);
            estado.casas.forEach(c => c.ocupada = false);
        }
        
        crearRana();
        actualizarUI();
    } else {
        perderVida('agua');
    }
}

function gameOver() {
    estado.modo = 'gameover';
    if (estado.puntuacion > estado.record) {
        estado.record = estado.puntuacion;
        localStorage.setItem('ranaCruzadaRecord', estado.record);
    }
    actualizarUI();
}

function mostrarMensaje(texto, tiempo) {
    estado.mensaje = texto;
    estado.mensajeTiempo = tiempo;
}

function actualizarUI() {
    document.getElementById('score').textContent = estado.puntuacion;
    document.getElementById('record').textContent = estado.record;
    document.getElementById('vidas').textContent = '🐸'.repeat(Math.max(0, estado.vidas));
}

// ============ INPUT ============
const teclas = {};
window.addEventListener('keydown', (e) => {
    if (estado.modo === 'titulo' && e.key === 'Enter') {
        iniciarJuego();
        return;
    }
    if (estado.modo === 'gameover' && e.key === 'Enter') {
        estado.modo = 'titulo';
        return;
    }
    if (estado.modo !== 'jugando') return;
    
    if (!estado.rana.saltando) {
        let movido = false;
        if (e.key === 'ArrowUp') {
            estado.rana.targetY -= TAMANO;
            estado.rana.direccion = 'arriba';
            movido = true;
        } else if (e.key === 'ArrowDown') {
            estado.rana.targetY += TAMANO;
            estado.rana.direccion = 'abajo';
            movido = true;
        } else if (e.key === 'ArrowLeft') {
            estado.rana.targetX -= TAMANO;
            estado.rana.direccion = 'izquierda';
            movido = true;
        } else if (e.key === 'ArrowRight') {
            estado.rana.targetX += TAMANO;
            estado.rana.direccion = 'derecha';
            movido = true;
        }
        
        if (movido) {
            estado.rana.saltando = true;
            estado.rana.tiempoSalto = 10;
            e.preventDefault();
        }
    }
});

// ============ ACTUALIZACIÓN ============
function actualizar() {
    if (estado.modo !== 'jugando') return;
    
    estado.tiempo++;
    
    // Actualizar carriles
    estado.carriles.forEach(carril => {
        carril.objetos.forEach(obj => {
            obj.x += carril.velocidad;
            
            // Wrap around
            if (carril.velocidad > 0 && obj.x > canvas.width) {
                obj.x = -obj.width;
            } else if (carril.velocidad < 0 && obj.x + obj.width < 0) {
                obj.x = canvas.width;
            }
        });
    });
    
    // Actualizar rana
    const rana = estado.rana;
    
    if (rana.saltando) {
        // Mover suavemente hacia el target
        const dx = rana.targetX - rana.x;
        const dy = rana.targetY - rana.y;
        
        if (Math.abs(dx) > 1) rana.x += dx * 0.3;
        else rana.x = rana.targetX;
        
        if (Math.abs(dy) > 1) rana.y += dy * 0.3;
        else rana.y = rana.targetY;
        
        rana.tiempoSalto--;
        if (rana.tiempoSalto <= 0) {
            rana.saltando = false;
            rana.x = rana.targetX;
            rana.y = rana.targetY;
        }
    }
    
    // Límites
    rana.x = Math.max(0, Math.min(canvas.width - TAMANO, rana.x));
    rana.y = Math.max(0, Math.min(canvas.height - TAMANO, rana.y));
    rana.targetX = rana.x;
    rana.targetY = rana.y;
    
    // Determinar en qué fila está
    const filaActual = Math.floor(rana.y / TAMANO);
    
    // Colisiones con coches (filas 7-11)
    if (filaActual >= 7 && filaActual <= 11) {
        const carril = estado.carriles.find(c => c.fila === filaActual);
        if (carril) {
            for (let obj of carril.objetos) {
                if (rana.x + TAMANO > obj.x + 5 &&
                    rana.x < obj.x + obj.width - 5 &&
                    rana.y + TAMANO > obj.y + 5 &&
                    rana.y < obj.y + obj.height - 5) {
                    perderVida('coche');
                    return;
                }
            }
        }
    }
    
    // Colisiones con río (filas 1-5)
    if (filaActual >= 1 && filaActual <= 5) {
        const carril = estado.carriles.find(c => c.fila === filaActual);
        let sobreTronco = false;
        let troncoActual = null;
        
        if (carril) {
            for (let obj of carril.objetos) {
                if (rana.x + TAMANO > obj.x + 5 &&
                    rana.x < obj.x + obj.width - 5 &&
                    rana.y + TAMANO > obj.y + 5 &&
                    rana.y < obj.y + obj.height - 5) {
                    sobreTronco = true;
                    troncoActual = obj;
                    break;
                }
            }
        }
        
        if (!sobreTronco) {
            perderVida('agua');
            return;
        } else {
            // Moverse con el tronco
            rana.x += carril.velocidad;
            rana.targetX = rana.x;
            
            // Si sale de la pantalla, pierde
            if (rana.x < -TAMANO/2 || rana.x > canvas.width - TAMANO/2) {
                perderVida('agua');
                return;
            }
        }
    }
    
    // Llegó a la meta (fila 0)
    if (filaActual === 0) {
        llegarACasa();
        return;
    }
    
    // Partículas
    estado.particulas = estado.particulas.filter(p => p.life > 0);
    estado.particulas.forEach(p => p.actualizar());
    
    if (estado.mensajeTiempo > 0) estado.mensajeTiempo--;
}

// ============ DIBUJO ============
function dibujar() {
    // Cielo/fondo base
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar zonas
    // Casas (fila 0)
    ctx.fillStyle = '#2D5016';
    ctx.fillRect(0, 0, canvas.width, TAMANO);
    
    // Río (filas 1-5)
    ctx.fillStyle = '#4A90E2';
    ctx.fillRect(0, TAMANO, canvas.width, TAMANO * 5);
    
    // Ondas en el río
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
        const y = TAMANO + i * TAMANO + TAMANO/2;
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += 20) {
            const offset = Math.sin((x + estado.tiempo * 2) * 0.1) * 3;
            if (x === 0) ctx.moveTo(x, y + offset);
            else ctx.lineTo(x, y + offset);
        }
        ctx.stroke();
    }
    
    // Zona segura (fila 6)
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(0, TAMANO * 6, canvas.width, TAMANO);
    
    // Carretera (filas 7-11)
    ctx.fillStyle = '#444';
    ctx.fillRect(0, TAMANO * 7, canvas.width, TAMANO * 5);
    
    // Líneas de carretera
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2;
    ctx.setLineDash([15, 15]);
    for (let i = 7; i <= 11; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * TAMANO);
        ctx.lineTo(canvas.width, i * TAMANO);
        ctx.stroke();
    }
    ctx.setLineDash([]);
    
    // Inicio (fila 11, parte inferior)
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(0, TAMANO * 11, canvas.width, TAMANO);
    
    // Dibujar casas
    estado.casas.forEach(casa => {
        if (casa.ocupada) {
            // Casa con rana dentro
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(casa.x, casa.y, casa.width, casa.height);
            ctx.fillStyle = '#FFD700';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🐸', casa.x + TAMANO/2, casa.y + TAMANO/2);
        } else {
            // Casa vacía (meta)
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(casa.x + 5, casa.y + 5, casa.width - 10, casa.height - 10);
            // Techo
            ctx.fillStyle = '#A0522D';
            ctx.beginPath();
            ctx.moveTo(casa.x + 5, casa.y + 15);
            ctx.lineTo(casa.x + TAMANO/2, casa.y + 5);
            ctx.lineTo(casa.x + casa.width - 5, casa.y + 15);
            ctx.closePath();
            ctx.fill();
            // Puerta
            ctx.fillStyle = '#654321';
            ctx.fillRect(casa.x + TAMANO/2 - 5, casa.y + 20, 10, 15);
        }
    });
    
    // Dibujar objetos de carriles
    estado.carriles.forEach(carril => {
        carril.objetos.forEach(obj => {
            if (carril.tipo === 'carretera') {
                dibujarVehiculo(obj);
            } else if (carril.tipo === 'rio') {
                dibujarTronco(obj);
            }
        });
    });
    
    // Dibujar rana
    if (estado.modo === 'jugando') {
        dibujarRana();
    }
    
    // Partículas
    estado.particulas.forEach(p => p.dibujar());
    
    // Mensaje
    if (estado.mensajeTiempo > 0) {
        const alpha = Math.min(1, estado.mensajeTiempo / 30);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#FFF';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeText(estado.mensaje, canvas.width/2, canvas.height/2);
        ctx.fillText(estado.mensaje, canvas.width/2, canvas.height/2);
        ctx.globalAlpha = 1;
    }
    
    // Título
    if (estado.modo === 'titulo') {
        dibujarTitulo();
    }
    
    // Game Over
    if (estado.modo === 'gameover') {
        dibujarGameOver();
    }
}

function dibujarVehiculo(obj) {
    ctx.fillStyle = obj.color;
    ctx.fillRect(obj.x, obj.y + 5, obj.width, obj.height - 10);
    
    // Ventanas
    ctx.fillStyle = 'rgba(135, 206, 235, 0.8)';
    if (obj.tipo === 'coche') {
        ctx.fillRect(obj.x + 8, obj.y + 10, obj.width - 16, 10);
    } else if (obj.tipo === 'camion') {
        ctx.fillRect(obj.x + 10, obj.y + 10, 20, 10);
        ctx.fillRect(obj.x + 40, obj.y + 10, 20, 10);
    } else if (obj.tipo === 'deportivo') {
        ctx.fillRect(obj.x + 5, obj.y + 10, obj.width - 10, 8);
    }
    
    // Ruedas
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(obj.x + 8, obj.y + obj.height - 5, 4, 0, Math.PI * 2);
    ctx.arc(obj.x + obj.width - 8, obj.y + obj.height - 5, 4, 0, Math.PI * 2);
    ctx.fill();
}

function dibujarTronco(obj) {
    // Cuerpo del tronco
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(obj.x, obj.y + 5, obj.width, obj.height - 10);
    
    // Detalles (anillos)
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    for (let i = 0; i < obj.width; i += 15) {
        ctx.beginPath();
        ctx.arc(obj.x + i + 7, obj.y + TAMANO/2, 6, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Extremos redondeados
    ctx.fillStyle = '#654321';
    ctx.beginPath();
    ctx.arc(obj.x + 5, obj.y + TAMANO/2, 12, 0, Math.PI * 2);
    ctx.arc(obj.x + obj.width - 5, obj.y + TAMANO/2, 12, 0, Math.PI * 2);
    ctx.fill();
}

function dibujarRana() {
    const rana = estado.rana;
    const cx = rana.x + TAMANO/2;
    const cy = rana.y + TAMANO/2;
    
    ctx.save();
    ctx.translate(cx, cy);
    
    // Rotar según dirección
    if (rana.direccion === 'izquierda') ctx.rotate(-Math.PI/2);
    else if (rana.direccion === 'derecha') ctx.rotate(Math.PI/2);
    else if (rana.direccion === 'abajo') ctx.rotate(Math.PI);
    
    // Efecto de salto
    const salto = rana.saltando ? Math.sin(rana.tiempoSalto * 0.3) * 3 : 0;
    
    // Cuerpo
    ctx.fillStyle = '#2D5016';
    ctx.beginPath();
    ctx.ellipse(0, -salto, 14, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Patas traseras
    ctx.fillStyle = '#3D6020';
    ctx.beginPath();
    ctx.ellipse(-10, 10 - salto, 6, 8, -0.3, 0, Math.PI * 2);
    ctx.ellipse(10, 10 - salto, 6, 8, 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Patas delanteras
    ctx.beginPath();
    ctx.ellipse(-8, -10 - salto, 4, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(8, -10 - salto, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Ojos
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(-5, -12 - salto, 4, 0, Math.PI * 2);
    ctx.arc(5, -12 - salto, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupilas
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-5, -12 - salto, 2, 0, Math.PI * 2);
    ctx.arc(5, -12 - salto, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function dibujarTitulo() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    
    // Rana grande decorativa
    ctx.save();
    ctx.translate(cx, cy - 80);
    ctx.scale(2.5, 2.5);
    
    ctx.fillStyle = '#2D5016';
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(-5, -10, 4, 0, Math.PI * 2);
    ctx.arc(5, -10, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-5, -10, 2, 0, Math.PI * 2);
    ctx.arc(5, -10, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.font = 'bold 40px Comic Sans MS';
    ctx.fillStyle = '#2D5016';
    ctx.fillText('RANA', cx, cy + 20);
    ctx.fillText('CRUZADA', cx, cy + 60);
    
    ctx.font = '16px Comic Sans MS';
    ctx.fillStyle = '#FFF';
    ctx.fillText('Cruza la carretera y el río', cx, cy + 100);
    
    const alpha = 0.5 + Math.sin(estado.tiempo * 0.08) * 0.5;
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 20px Comic Sans MS';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('Presiona ENTER', cx, cy + 140);
    ctx.globalAlpha = 1;
}

function dibujarGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.font = 'bold 45px Comic Sans MS';
    ctx.fillStyle = '#FF6B6B';
    ctx.fillText('¡GAME OVER!', cx, cy - 40);
    
    ctx.font = '24px Comic Sans MS';
    ctx.fillStyle = '#FFF';
    ctx.fillText(`Puntos: ${estado.puntuacion}`, cx, cy + 10);
    
    if (estado.puntuacion >= estado.record && estado.puntuacion > 0) {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px Comic Sans MS';
        ctx.fillText('¡NUEVO RÉCORD!', cx, cy + 50);
    }
    
    const alpha = 0.5 + Math.sin(estado.tiempo * 0.08) * 0.5;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 18px Comic Sans MS';
    ctx.fillText('Presiona ENTER', cx, cy + 100);
    ctx.globalAlpha = 1;
}

// ============ LOOP ============
function loop() {
    estado.tiempo++;
    actualizar();
    dibujar();
    requestAnimationFrame(loop);
}

// ============ INICIO ============
actualizarUI();
loop();
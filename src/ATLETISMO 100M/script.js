const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ============ ESTADO ============
const estado = {
    modo: 'titulo', // titulo, countdown, corriendo, resultado
    tiempo: 0,
    distancia: 0,
    distanciaTotal: 100,
    tiempoCarrera: 0,
    energia: 100,
    energiaMax: 100,
    record: parseFloat(localStorage.getItem('atletismoRecord')) || null,
    ultimaTecla: null,
    scroll: 0,
    countdown: 3,
    countdownTiempo: 0,
    corredores: [],
    jugador: null,
    mensaje: '',
    tiempoMensaje: 0,
    shake: 0,
    posicionCamara: 0
};

// ============ CORREDOR ============
class Corredor {
    constructor(carril, color, esJugador = false, velocidad = 1) {
        this.carril = carril;
        this.color = color;
        this.esJugador = esJugador;
        this.x = 50;
        this.y = 180 + carril * 45;
        this.width = 30;
        this.height = 40;
        this.velocidad = velocidad;
        this.distancia = 0;
        this.animacion = 0;
        this.piernaAnim = 0;
        this.termino = false;
        this.tiempoFinal = 0;
        this.posicionFinal = 0;
        this.colorPiel = '#FFCCBC';
    }
    
    actualizar(dt) {
        if (this.termino) return;
        
        this.animacion += this.velocidad * 0.3;
        this.piernaAnim = Math.sin(this.animacion) * 8;
        
        if (this.esJugador) {
            // Velocidad basada en energía
            const factorEnergia = Math.max(0.3, estado.energia / 100);
            this.velocidad = 15 * factorEnergia;
            this.distancia += this.velocidad * dt;
        } else {
            // IA con variación
            const variacion = 1 + Math.sin(this.animacion * 0.1) * 0.1;
            this.distancia += this.velocidad * variacion * dt;
        }
        
        // Meta
        if (this.distancia >= estado.distanciaTotal && !this.termino) {
            this.termino = true;
            this.tiempoFinal = estado.tiempoCarrera;
        }
    }
    
    dibujar(offsetX) {
        const screenX = this.x + (this.distancia * 5) - offsetX;
        const cx = screenX;
        const cy = this.y;
        
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 22, 12, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Piernas (animadas)
        ctx.fillStyle = this.colorPiel;
        ctx.save();
        ctx.translate(cx, cy);
        
        // Pierna izquierda
        ctx.fillRect(-8, 8, 5, 12 + Math.max(0, this.piernaAnim));
        // Pierna derecha
        ctx.fillRect(3, 8, 5, 12 + Math.max(0, -this.piernaAnim));
        
        // Zapatos
        ctx.fillStyle = '#000';
        ctx.fillRect(-9, 18 + Math.max(0, this.piernaAnim), 7, 3);
        ctx.fillRect(2, 18 + Math.max(0, -this.piernaAnim), 7, 3);
        
        // Shorts
        ctx.fillStyle = '#FFF';
        ctx.fillRect(-10, 2, 20, 8);
        
        // Cuerpo (camiseta)
        ctx.fillStyle = this.color;
        ctx.fillRect(-10, -12, 20, 16);
        
        // Número en la camiseta
        if (this.esJugador) {
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('1', 0, -4);
        } else {
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.carril + 1, 0, -4);
        }
        
        // Brazos (animados, opuestos a las piernas)
        ctx.fillStyle = this.colorPiel;
        ctx.fillRect(-14, -10 + Math.max(0, -this.piernaAnim) * 0.5, 4, 10);
        ctx.fillRect(10, -10 + Math.max(0, this.piernaAnim) * 0.5, 4, 10);
        
        // Cabeza
        ctx.fillStyle = this.colorPiel;
        ctx.beginPath();
        ctx.arc(0, -18, 7, 0, Math.PI * 2);
        ctx.fill();
        
        // Pelo
        ctx.fillStyle = '#3E2723';
        ctx.beginPath();
        ctx.arc(0, -20, 7, Math.PI, 0);
        ctx.fill();
        
        // Cinta en la cabeza (si es jugador)
        if (this.esJugador) {
            ctx.fillStyle = '#F44336';
            ctx.fillRect(-7, -20, 14, 2);
        }
        
        ctx.restore();
        
        // Indicador de jugador
        if (this.esJugador) {
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('▼ TÚ', cx, cy - 35);
        }
    }
}

// ============ INICIALIZACIÓN ============
function iniciarJuego() {
    estado.modo = 'countdown';
    estado.distancia = 0;
    estado.tiempoCarrera = 0;
    estado.energia = 100;
    estado.ultimaTecla = null;
    estado.scroll = 0;
    estado.countdown = 3;
    estado.countdownTiempo = 0;
    estado.posicionCamara = 0;
    estado.mensaje = '';
    estado.tiempoMensaje = 0;
    
    // Crear corredores
    estado.corredores = [];
    
    // Jugador (carril 2)
    estado.jugador = new Corredor(2, '#2196F3', true, 15);
    estado.corredores.push(estado.jugador);
    
    // Rivales CPU
    const velocidades = [11.5, 12, 12.5, 11.8];
    const colores = ['#F44336', '#4CAF50', '#FF9800', '#9C27B0'];
    for (let i = 0; i < 4; i++) {
        const carril = i < 2 ? i : i + 1;
        estado.corredores.push(new Corredor(carril, colores[i], false, velocidades[i]));
    }
    
    actualizarUI();
}

function actualizarUI() {
    document.getElementById('distancia').textContent = Math.floor(estado.distancia) + 'm';
    document.getElementById('energia').style.width = estado.energia + '%';
    document.getElementById('tiempo').textContent = estado.tiempoCarrera.toFixed(2) + 's';
    document.getElementById('record').textContent = estado.record ? estado.record.toFixed(2) + 's' : '--';
}

// ============ INPUT ============
window.addEventListener('keydown', (e) => {
    const tecla = e.key.toLowerCase();
    
    if (estado.modo === 'titulo' && (tecla === 'enter' || tecla === ' ')) {
        iniciarJuego();
        e.preventDefault();
        return;
    }
    
    if (estado.modo === 'resultado' && (tecla === 'enter' || tecla === ' ')) {
        estado.modo = 'titulo';
        e.preventDefault();
        return;
    }
    
    if (estado.modo !== 'corriendo') return;
    
    // Solo A y D cuentan
    if (tecla === 'a' || tecla === 'd') {
        // Verificar si es alternada
        if (estado.ultimaTecla === tecla) {
            // Misma tecla: penalización de energía
            estado.energia = Math.max(0, estado.energia - 8);
            estado.mensaje = '¡ALTERNA!';
            estado.tiempoMensaje = 30;
            estado.shake = 3;
        } else {
            // Tecla alternada: impulso
            estado.energia = Math.max(0, estado.energia - 2);
            estado.jugador.velocidad = 18; // Boost temporal
            estado.jugador.distancia += 0.5;
        }
        estado.ultimaTecla = tecla;
        e.preventDefault();
    }
});

// ============ ACTUALIZAR ============
function actualizar(dt) {
    estado.tiempo += dt;
    
    if (estado.modo === 'countdown') {
        estado.countdownTiempo += dt;
        if (estado.countdownTiempo >= 1) {
            estado.countdownTiempo = 0;
            estado.countdown--;
            if (estado.countdown < 0) {
                estado.modo = 'corriendo';
                estado.mensaje = '¡GO!';
                estado.tiempoMensaje = 40;
            }
        }
    }
    
    if (estado.modo === 'corriendo') {
        estado.tiempoCarrera += dt;
        
        // Recuperación de energía
        estado.energia = Math.min(estado.energiaMax, estado.energia + dt * 8);
        
        // Actualizar corredores
        estado.corredores.forEach(c => c.actualizar(dt));
        
        // Distancia del jugador
        estado.distancia = estado.jugador.distancia;
        
        // Cámara sigue al jugador
        estado.posicionCamara = estado.jugador.distancia * 5 - 100;
        
        // Verificar fin de carrera
        if (estado.jugador.termino) {
            estado.modo = 'resultado';
            
            // Calcular posición final
            const terminados = estado.corredores.filter(c => c.termino);
            terminados.sort((a, b) => a.tiempoFinal - b.tiempoFinal);
            estado.jugador.posicionFinal = terminados.findIndex(c => c.esJugador) + 1;
            
            // Actualizar récord
            if (!estado.record || estado.jugador.tiempoFinal < estado.record) {
                estado.record = estado.jugador.tiempoFinal;
                localStorage.setItem('atletismoRecord', estado.record);
            }
            
            actualizarUI();
        }
    }
    
    if (estado.tiempoMensaje > 0) estado.tiempoMensaje--;
    if (estado.shake > 0) estado.shake *= 0.9;
}

// ============ DIBUJO ============
function dibujarPista(offsetX) {
    // Cielo
    const grad = ctx.createLinearGradient(0, 0, 0, 200);
    grad.addColorStop(0, '#87CEEB');
    grad.addColorStop(1, '#B3E5FC');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, 200);
    
    // Público (gradas)
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(0, 100, canvas.width, 80);
    
    // Personas en gradas
    const colores = ['#E74C3C', '#3498DB', '#F39C12', '#9B59B6', '#1ABC9C'];
    for (let i = 0; i < 60; i++) {
        const x = (i * 20 - offsetX * 0.2) % canvas.width;
        const realX = x < 0 ? x + canvas.width : x;
        const y = 110 + (i % 3) * 20;
        ctx.fillStyle = colores[i % colores.length];
        ctx.beginPath();
        ctx.arc(realX, y, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Pista de atletismo
    ctx.fillStyle = '#D84315';
    ctx.fillRect(0, 180, canvas.width, 220);
    
    // Líneas de carriles
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
        const y = 180 + i * 45;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Marcas de distancia cada 10m
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    for (let m = 0; m <= 100; m += 10) {
        const screenX = 50 + m * 5 - offsetX;
        if (screenX > -50 && screenX < canvas.width + 50) {
            ctx.fillText(m + 'm', screenX, 175);
            
            // Línea vertical
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(screenX, 180);
            ctx.lineTo(screenX, 400);
            ctx.stroke();
        }
    }
    
    // Línea de meta
    const metaX = 50 + 100 * 5 - offsetX;
    if (metaX > -50 && metaX < canvas.width + 50) {
        // Patrón de cuadros
        const cuadroSize = 10;
        for (let i = 0; i < 22; i++) {
            for (let j = 0; j < 2; j++) {
                ctx.fillStyle = (i + j) % 2 === 0 ? '#FFF' : '#000';
                ctx.fillRect(metaX - cuadroSize + j * cuadroSize, 180 + i * cuadroSize, cuadroSize, cuadroSize);
            }
        }
        
        // Texto META
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 18px Arial';
        ctx.fillText('META', metaX, 170);
    }
    
    // Línea de salida
    const salidaX = 50 - offsetX;
    if (salidaX > -50 && salidaX < canvas.width + 50) {
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(salidaX, 180);
        ctx.lineTo(salidaX, 400);
        ctx.stroke();
        
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('SALIDA', salidaX, 170);
    }
}

function dibujarMensaje() {
    if (estado.tiempoMensaje <= 0) return;
    
    const alpha = Math.min(1, estado.tiempoMensaje / 20);
    const scale = 1 + (1 - alpha) * 0.5;
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(canvas.width/2, canvas.height/2 - 30);
    ctx.scale(scale, scale);
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 70px Arial';
    
    let color = '#FFD700';
    if (estado.mensaje === '¡ALTERNA!') color = '#F44336';
    else if (estado.mensaje === '¡GO!') color = '#4CAF50';
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 6;
    ctx.strokeText(estado.mensaje, 0, 0);
    ctx.fillStyle = color;
    ctx.fillText(estado.mensaje, 0, 0);
    
    ctx.restore();
}

function dibujarCountdown() {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const texto = estado.countdown > 0 ? estado.countdown.toString() : '¡LISTOS!';
    const scale = 1 + Math.sin(estado.countdownTiempo * Math.PI) * 0.2;
    
    ctx.save();
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.scale(scale, scale);
    
    ctx.font = 'bold 120px Arial';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 8;
    ctx.strokeText(texto, 0, 0);
    ctx.fillStyle = estado.countdown > 0 ? '#FFD700' : '#4CAF50';
    ctx.fillText(texto, 0, 0);
    
    ctx.restore();
}

function dibujarTitulo() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const cx = canvas.width/2;
    const cy = canvas.height/2;
    
    // Corredor decorativo
    ctx.save();
    ctx.translate(cx, cy - 80);
    ctx.scale(2, 2);
    
    // Cuerpo
    ctx.fillStyle = '#2196F3';
    ctx.fillRect(-10, -12, 20, 16);
    ctx.fillStyle = '#FFF';
    ctx.fillRect(-10, 2, 20, 8);
    ctx.fillStyle = '#FFCCBC';
    ctx.fillRect(-8, 8, 5, 12);
    ctx.fillRect(3, 8, 5, 12);
    ctx.beginPath();
    ctx.arc(0, -18, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#F44336';
    ctx.fillRect(-7, -20, 14, 2);
    
    ctx.restore();
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.font = 'bold 50px Arial';
    ctx.fillStyle = '#FFF';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.strokeText('ATLETISMO', cx, cy + 20);
    ctx.fillText('ATLETISMO', cx, cy + 20);
    ctx.strokeText('100M', cx, cy + 70);
    ctx.fillText('100M', cx, cy + 70);
    
    ctx.font = '14px Arial';
    ctx.fillStyle = '#FFF';
    ctx.fillText('Presiona A y D alternadamente para correr', cx, cy + 110);
    ctx.fillText('¡No repitas la misma tecla!', cx, cy + 130);
    
    const alpha = 0.5 + Math.sin(estado.tiempo * 0.08) * 0.5;
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('CLICK o ENTER', cx, cy + 170);
    ctx.globalAlpha = 1;
    
    if (estado.record) {
        ctx.font = '16px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`🏆 Récord: ${estado.record.toFixed(2)}s`, cx, cy + 200);
    }
}

function dibujarResultado() {
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const cx = canvas.width/2;
    const cy = canvas.height/2;
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Título según posición
    let titulo, color;
    if (estado.jugador.posicionFinal === 1) {
        titulo = '🥇 ¡ORO!';
        color = '#FFD700';
    } else if (estado.jugador.posicionFinal === 2) {
        titulo = '🥈 PLATA';
        color = '#C0C0C0';
    } else if (estado.jugador.posicionFinal === 3) {
        titulo = '🥉 BRONCE';
        color = '#CD7F32';
    } else {
        titulo = `POSICIÓN ${estado.jugador.posicionFinal}°`;
        color = '#FFF';
    }
    
    ctx.font = 'bold 50px Arial';
    ctx.fillStyle = color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 5;
    ctx.strokeText(titulo, cx, cy - 80);
    ctx.fillText(titulo, cx, cy - 80);
    
    // Tiempo
    ctx.font = 'bold 40px Arial';
    ctx.fillStyle = '#FFF';
    ctx.fillText(estado.jugador.tiempoFinal.toFixed(2) + 's', cx, cy - 20);
    
    // Tabla de resultados
    const terminados = estado.corredores.filter(c => c.termino);
    terminados.sort((a, b) => a.tiempoFinal - b.tiempoFinal);
    
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    const startX = cx - 120;
    let y = cy + 30;
    
    terminados.forEach((c, i) => {
        const esJugador = c.esJugador;
        ctx.fillStyle = esJugador ? '#FFD700' : '#FFF';
        const medalla = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
        ctx.fillText(`${medalla} ${i+1}°. ${c.esJugador ? 'TÚ' : 'CPU ' + c.carril} - ${c.tiempoFinal.toFixed(2)}s`, startX, y);
        y += 22;
    });
    
    // Récord
    if (estado.jugador.tiempoFinal <= estado.record) {
        ctx.textAlign = 'center';
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.fillText('🏆 ¡NUEVO RÉCORD!', cx, y + 20);
        y += 30;
    }
    
    // Instrucción
    const alpha = 0.5 + Math.sin(estado.tiempo * 0.08) * 0.5;
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#FFF';
    ctx.fillText('ENTER para volver', cx, y + 40);
    ctx.globalAlpha = 1;
}

// ============ LOOP ============
let ultimoTiempo = 0;
function loop(timestamp) {
    const dt = Math.min(0.05, (timestamp - ultimoTiempo) / 1000);
    ultimoTiempo = timestamp;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let shakeX = 0, shakeY = 0;
    if (estado.shake > 0.5) {
        shakeX = (Math.random() - 0.5) * estado.shake;
        shakeY = (Math.random() - 0.5) * estado.shake;
    }
    
    ctx.save();
    ctx.translate(shakeX, shakeY);
    
    actualizar(dt);
    
    // Dibujar pista
    dibujarPista(estado.posicionCamara);
    
    if (estado.modo === 'titulo') {
        dibujarTitulo();
        ctx.restore();
        requestAnimationFrame(loop);
        return;
    }
    
    // Dibujar corredores (ordenados por carril para profundidad)
    const ordenados = [...estado.corredores].sort((a, b) => a.carril - b.carril);
    ordenados.forEach(c => c.dibujar(estado.posicionCamara));
    
    // Mensaje
    dibujarMensaje();
    
    // Countdown
    if (estado.modo === 'countdown') {
        dibujarCountdown();
    }
    
    // Resultado
    if (estado.modo === 'resultado') {
        dibujarResultado();
    }
    
    ctx.restore();
    
    actualizarUI();
    requestAnimationFrame(loop);
}

// ============ INICIO ============
canvas.addEventListener('click', () => {
    if (estado.modo === 'titulo') iniciarJuego();
    else if (estado.modo === 'resultado') estado.modo = 'titulo';
});

requestAnimationFrame(loop);
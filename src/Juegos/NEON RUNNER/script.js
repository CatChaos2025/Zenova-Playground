const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ============ ESTADO ============
const estado = {
    modo: 'titulo', // titulo, jugando, gameover
    puntuacion: 0,
    record: parseInt(localStorage.getItem('neonRunnerRecord')) || 0,
    monedas: 0,
    velocidad: 6,
    velocidadBase: 6,
    tiempo: 0,
    suelo: canvas.height - 60,
    colorNeon: 0
};

// ============ JUGADOR ============
const jugador = {
    x: 120,
    y: 0,
    width: 35,
    height: 50,
    vy: 0,
    grounded: false,
    saltando: false,
    dobleSalto: false,
    deslizando: false,
    tiempoDeslizar: 0,
    trail: [],
    color: '#00ffff',
    animacion: 0
};

// ============ ENTIDADES ============
let obstaculos = [];
let monedasLista = [];
let particulas = [];
let estrellas = [];
let lineasSuelo = [];
let edificios = [];

// Generar estrellas
for (let i = 0; i < 80; i++) {
    estrellas.push({
        x: Math.random() * canvas.width,
        y: Math.random() * (canvas.height - 100),
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 1 + 0.5,
        brillo: Math.random()
    });
}

// Generar edificios de fondo
for (let i = 0; i < 15; i++) {
    edificios.push({
        x: i * 80 + Math.random() * 40,
        width: 30 + Math.random() * 50,
        height: 60 + Math.random() * 120,
        color: `hsl(${280 + Math.random() * 40}, 80%, ${10 + Math.random() * 15}%)`,
        ventanas: Math.floor(Math.random() * 5) + 2
    });
}

// Generar líneas del suelo
for (let i = 0; i < 30; i++) {
    lineasSuelo.push({ x: i * 40 });
}

// ============ COLORES NEÓN ============
const coloresNeon = ['#ff00ff', '#00ffff', '#ff0066', '#00ff66', '#ffff00', '#ff6600'];

function getColorNeon() {
    return coloresNeon[Math.floor(estado.tiempo / 300) % coloresNeon.length];
}

// ============ INICIALIZACIÓN ============
function reiniciar() {
    jugador.y = estado.suelo - jugador.height;
    jugador.vy = 0;
    jugador.grounded = true;
    jugador.saltando = false;
    jugador.dobleSalto = false;
    jugador.deslizando = false;
    jugador.tiempoDeslizar = 0;
    jugador.trail = [];
    
    obstaculos = [];
    monedasLista = [];
    particulas = [];
    
    estado.puntuacion = 0;
    estado.monedas = 0;
    estado.velocidad = estado.velocidadBase;
    estado.tiempo = 0;
    estado.modo = 'jugando';
    
    document.getElementById('record').textContent = estado.record;
}

// ============ INPUT ============
const teclas = {};
window.addEventListener('keydown', (e) => {
    teclas[e.code] = true;
    
    if (estado.modo === 'titulo' && (e.code === 'Enter' || e.code === 'Space')) {
        reiniciar();
        e.preventDefault();
        return;
    }
    
    if (estado.modo === 'gameover' && e.code === 'Enter') {
        reiniciar();
        return;
    }
    
    if (estado.modo === 'jugando') {
        if (e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyW') {
            saltar();
            e.preventDefault();
        }
        if (e.code === 'ArrowDown' || e.code === 'KeyS') {
            deslizar();
            e.preventDefault();
        }
    }
});

window.addEventListener('keyup', (e) => {
    teclas[e.code] = false;
});

// Touch support
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (estado.modo === 'titulo') { reiniciar(); return; }
    if (estado.modo === 'gameover') { reiniciar(); return; }
    saltar();
});

function saltar() {
    if (jugador.grounded) {
        jugador.vy = -14;
        jugador.grounded = false;
        jugador.saltando = true;
        jugador.dobleSalto = false;
        crearParticulas(jugador.x, jugador.y + jugador.height, '#00ffff', 10);
    } else if (!jugador.dobleSalto) {
        jugador.vy = -12;
        jugador.dobleSalto = true;
        crearParticulas(jugador.x + jugador.width/2, jugador.y + jugador.height, '#ff00ff', 15);
    }
}

function deslizar() {
    if (jugador.grounded && !jugador.deslizando) {
        jugador.deslizando = true;
        jugador.tiempoDeslizar = 40;
        jugador.height = 25;
        jugador.y = estado.suelo - jugador.height;
    }
}

// ============ GENERAR OBSTÁCULOS ============
function generarObstaculos() {
    if (Math.random() < 0.02 + (estado.velocidad * 0.003)) {
        const tipo = Math.random();
        
        if (tipo < 0.4) {
            // Obstáculo bajo (saltar)
            obstaculos.push({
                x: canvas.width + 50,
                y: estado.suelo - 40,
                width: 25,
                height: 40,
                tipo: 'bajo',
                color: '#ff0066'
            });
        } else if (tipo < 0.7) {
            // Obstáculo alto (deslizar)
            obstaculos.push({
                x: canvas.width + 50,
                y: estado.suelo - 80,
                width: 60,
                height: 30,
                tipo: 'alto',
                color: '#ff6600'
            });
        } else if (tipo < 0.85) {
            // Obstáculo doble
            obstaculos.push({
                x: canvas.width + 50,
                y: estado.suelo - 50,
                width: 20,
                height: 50,
                tipo: 'bajo',
                color: '#ff0066'
            });
            obstaculos.push({
                x: canvas.width + 130,
                y: estado.suelo - 35,
                width: 20,
                height: 35,
                tipo: 'bajo',
                color: '#ff0066'
            });
        } else {
            // Obstáculo volador
            obstaculos.push({
                x: canvas.width + 50,
                y: estado.suelo - 90,
                width: 35,
                height: 25,
                tipo: 'volador',
                color: '#ffff00',
                animY: 0
            });
        }
    }
    
    // Generar monedas
    if (Math.random() < 0.03) {
        const altura = Math.random() < 0.5 ? estado.suelo - 60 : estado.suelo - 110;
        monedasLista.push({
            x: canvas.width + 50,
            y: altura,
            size: 12,
            recogido: false,
            anim: Math.random() * Math.PI * 2
        });
    }
}

// ============ ACTUALIZACIÓN ============
function actualizar() {
    if (estado.modo !== 'jugando') return;
    
    estado.tiempo++;
    estado.puntuacion = Math.floor(estado.tiempo / 3);
    
    // Aumentar velocidad
    estado.velocidad = estado.velocidadBase + (estado.tiempo * 0.002);
    
    // Jugador
    jugador.vy += 0.7; // Gravedad
    jugador.y += jugador.vy;
    jugador.animacion++;
    
    // Suelo
    if (jugador.y + jugador.height >= estado.suelo) {
        jugador.y = estado.suelo - jugador.height;
        jugador.vy = 0;
        jugador.grounded = true;
        jugador.saltando = false;
        jugador.dobleSalto = false;
    }
    
    // Deslizar
    if (jugador.deslizando) {
        jugador.tiempoDeslizar--;
        if (jugador.tiempoDeslizar <= 0) {
            jugador.deslizando = false;
            jugador.height = 50;
            jugador.y = estado.suelo - jugador.height;
        }
    }
    
    // Trail del jugador
    jugador.trail.push({
        x: jugador.x + jugador.width/2,
        y: jugador.y + jugador.height/2,
        life: 1
    });
    if (jugador.trail.length > 15) jugador.trail.shift();
    jugador.trail.forEach(t => t.life -= 0.07);
    jugador.trail = jugador.trail.filter(t => t.life > 0);
    
    // Obstáculos
    obstaculos.forEach(obs => {
        obs.x -= estado.velocidad;
        if (obs.tipo === 'volador') {
            obs.animY = Math.sin(estado.tiempo * 0.05) * 15;
        }
    });
    obstaculos = obstaculos.filter(obs => obs.x + obs.width > -50);
    
    // Monedas
    monedasLista.forEach(mon => {
        mon.x -= estado.velocidad;
        mon.anim += 0.1;
    });
    monedasLista = monedasLista.filter(mon => mon.x > -50 && !mon.recogido);
    
    // Colisiones con obstáculos
    const jx = jugador.x + 5;
    const jy = jugador.y + 5;
    const jw = jugador.width - 10;
    const jh = jugador.height - 10;
    
    for (let obs of obstaculos) {
        const oy = obs.y + (obs.animY || 0);
        if (jx < obs.x + obs.width && jx + jw > obs.x &&
            jy < oy + obs.height && jy + jh > oy) {
            gameOver();
            return;
        }
    }
    
    // Colisiones con monedas
    monedasLista.forEach(mon => {
        if (mon.recogido) return;
        const dist = Math.hypot(
            (jugador.x + jugador.width/2) - mon.x,
            (jugador.y + jugador.height/2) - mon.y
        );
        if (dist < 30) {
            mon.recogido = true;
            estado.monedas++;
            crearParticulas(mon.x, mon.y, '#ffd700', 12);
        }
    });
    
    // Estrellas
    estrellas.forEach(est => {
        est.x -= est.speed * (estado.velocidad / estado.velocidadBase);
        if (est.x < 0) {
            est.x = canvas.width;
            est.y = Math.random() * (canvas.height - 100);
        }
    });
    
    // Edificios
    edificios.forEach(ed => {
        ed.x -= estado.velocidad * 0.3;
        if (ed.x + ed.width < 0) {
            ed.x = canvas.width + Math.random() * 100;
            ed.height = 60 + Math.random() * 120;
            ed.width = 30 + Math.random() * 50;
        }
    });
    
    // Líneas del suelo
    lineasSuelo.forEach(linea => {
        linea.x -= estado.velocidad;
        if (linea.x < -40) linea.x += 30 * 40;
    });
    
    // Partículas
    particulas = particulas.filter(p => p.life > 0);
    particulas.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.life -= 0.03;
    });
    
    generarObstaculos();
    actualizarUI();
}

function gameOver() {
    estado.modo = 'gameover';
    crearParticulas(jugador.x + jugador.width/2, jugador.y + jugador.height/2, '#ff0066', 40);
    crearParticulas(jugador.x + jugador.width/2, jugador.y + jugador.height/2, '#ffff00', 30);
    
    if (estado.puntuacion > estado.record) {
        estado.record = estado.puntuacion;
        localStorage.setItem('neonRunnerRecord', estado.record);
    }
}

// ============ PARTÍCULAS ============
function crearParticulas(x, y, color, cantidad) {
    for (let i = 0; i < cantidad; i++) {
        particulas.push({
            x, y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10 - 3,
            color,
            life: 1,
            size: Math.random() * 5 + 2
        });
    }
}

// ============ DIBUJO ============
function dibujar() {
    const neon = getColorNeon();
    
    // Fondo degradado
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#0a0015');
    grad.addColorStop(0.6, '#150030');
    grad.addColorStop(1, '#1a0040');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Estrellas
    estrellas.forEach(est => {
        const brillo = 0.3 + Math.sin(estado.tiempo * 0.02 + est.brillo * 10) * 0.3;
        ctx.globalAlpha = brillo;
        ctx.fillStyle = '#fff';
        ctx.fillRect(est.x, est.y, est.size, est.size);
    });
    ctx.globalAlpha = 1;
    
    // Edificios de fondo
    edificios.forEach(ed => {
        ctx.fillStyle = ed.color;
        ctx.fillRect(ed.x, estado.suelo - ed.height, ed.width, ed.height);
        
        // Ventanas
        ctx.fillStyle = `rgba(255, 0, 255, ${0.2 + Math.sin(estado.tiempo * 0.01 + ed.x) * 0.1})`;
        for (let wy = 0; wy < ed.ventanas; wy++) {
            for (let wx = 0; wx < 2; wx++) {
                if (Math.random() > 0.3) {
                    ctx.fillRect(
                        ed.x + 5 + wx * (ed.width/2 - 2),
                        estado.suelo - ed.height + 10 + wy * 20,
                        6, 8
                    );
                }
            }
        }
    });
    
    // Suelo
    ctx.fillStyle = '#1a0040';
    ctx.fillRect(0, estado.suelo, canvas.width, canvas.height - estado.suelo);
    
    // Línea de neón del suelo
    ctx.strokeStyle = neon;
    ctx.shadowBlur = 15;
    ctx.shadowColor = neon;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, estado.suelo);
    ctx.lineTo(canvas.width, estado.suelo);
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Grid del suelo (perspectiva)
    ctx.strokeStyle = `rgba(255, 0, 255, 0.15)`;
    ctx.lineWidth = 1;
    lineasSuelo.forEach(linea => {
        ctx.beginPath();
        ctx.moveTo(linea.x, estado.suelo);
        ctx.lineTo(linea.x, canvas.height);
        ctx.stroke();
    });
    for (let y = estado.suelo + 15; y < canvas.height; y += 15) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    if (estado.modo === 'titulo') {
        dibujarTitulo();
        return;
    }
    
    // Monedas
    monedasLista.forEach(mon => {
        if (mon.recogido) return;
        const scale = Math.abs(Math.cos(mon.anim));
        ctx.save();
        ctx.translate(mon.x, mon.y);
        ctx.scale(scale, 1);
        
        ctx.fillStyle = '#ffd700';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffd700';
        ctx.beginPath();
        ctx.arc(0, 0, mon.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#ffaa00';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💎', 0, 0);
        
        ctx.restore();
    });
    
    // Obstáculos
    obstaculos.forEach(obs => {
        const oy = obs.y + (obs.animY || 0);
        
        ctx.fillStyle = obs.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = obs.color;
        
        if (obs.tipo === 'volador') {
            // Triángulo volador
            ctx.beginPath();
            ctx.moveTo(obs.x + obs.width/2, oy);
            ctx.lineTo(obs.x + obs.width, oy + obs.height);
            ctx.lineTo(obs.x, oy + obs.height);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillRect(obs.x, oy, obs.width, obs.height);
            
            // Detalles
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(obs.x + 3, oy + 3, obs.width - 6, 3);
        }
        ctx.shadowBlur = 0;
    });
    
    // Trail del jugador
    jugador.trail.forEach(t => {
        ctx.globalAlpha = t.life * 0.5;
        ctx.fillStyle = jugador.color;
        const size = t.life * jugador.width * 0.6;
        ctx.fillRect(t.x - size/2, t.y - size/2, size, size);
    });
    ctx.globalAlpha = 1;
    
    // Jugador
    dibujarJugador();
    
    // Partículas
    particulas.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    
    // Game Over
    if (estado.modo === 'gameover') {
        dibujarGameOver();
    }
}

function dibujarJugador() {
    const jx = jugador.x;
    const jy = jugador.y;
    const jw = jugador.width;
    const jh = jugador.height;
    
    // Glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = jugador.color;
    
    if (jugador.deslizando) {
        // Deslizando: forma baja
        ctx.fillStyle = jugador.color;
        ctx.fillRect(jx, jy, jw + 10, jh);
        
        // Visor
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(jx + jw - 5, jy + 5, 12, 8);
    } else {
        // Cuerpo
        ctx.fillStyle = jugador.color;
        ctx.fillRect(jx, jy, jw, jh);
        
        // Cabeza
        ctx.fillStyle = '#fff';
        ctx.fillRect(jx + 5, jy + 5, jw - 10, 15);
        
        // Visor
        ctx.fillStyle = '#ff00ff';
        ctx.shadowColor = '#ff00ff';
        ctx.fillRect(jx + 8, jy + 8, jw - 12, 8);
        
        // Piernas animadas
        ctx.fillStyle = jugador.color;
        const piernaAnim = Math.sin(jugador.animacion * 0.3) * 5;
        if (jugador.grounded) {
            ctx.fillRect(jx + 5, jy + jh, 8, 5 + piernaAnim);
            ctx.fillRect(jx + jw - 13, jy + jh, 8, 5 - piernaAnim);
        }
    }
    
    ctx.shadowBlur = 0;
}

function dibujarTitulo() {
    // Overlay oscuro
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    
    // Título
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Sombra del título
    ctx.fillStyle = '#ff00ff';
    ctx.shadowBlur = 40;
    ctx.shadowColor = '#ff00ff';
    ctx.font = 'bold 72px Arial';
    ctx.fillText('NEON RUNNER', cx + 3, cy - 50 + 3);
    
    // Título principal
    const titleGrad = ctx.createLinearGradient(cx - 200, 0, cx + 200, 0);
    titleGrad.addColorStop(0, '#00ffff');
    titleGrad.addColorStop(0.5, '#ff00ff');
    titleGrad.addColorStop(1, '#ffff00');
    ctx.fillStyle = titleGrad;
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#00ffff';
    ctx.fillText('NEON RUNNER', cx, cy - 50);
    ctx.shadowBlur = 0;
    
    // Subtítulo
    ctx.fillStyle = '#888';
    ctx.font = '18px Arial';
    ctx.fillText('Corre. Salta. Sobrevive.', cx, cy + 10);
    
    // Texto parpadeante
    const alpha = 0.5 + Math.sin(estado.tiempo * 0.05) * 0.5;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 22px Arial';
    ctx.fillText('Presiona ENTER o ESPACIO para comenzar', cx, cy + 70);
    ctx.globalAlpha = 1;
    
    // Récord
    if (estado.record > 0) {
        ctx.fillStyle = '#ffd700';
        ctx.font = '16px Arial';
        ctx.fillText(`🏆 Récord: ${estado.record}`, cx, cy + 110);
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
    
    ctx.fillStyle = '#ff0066';
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ff0066';
    ctx.font = 'bold 60px Arial';
    ctx.fillText('GAME OVER', cx, cy - 50);
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText(`Puntuación: ${estado.puntuacion}`, cx, cy + 10);
    
    ctx.fillStyle = '#ffd700';
    ctx.font = '20px Arial';
    ctx.fillText(`💎 Monedas: ${estado.monedas}`, cx, cy + 45);
    
    if (estado.puntuacion >= estado.record && estado.puntuacion > 0) {
        ctx.fillStyle = '#00ff66';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('🏆 ¡NUEVO RÉCORD!', cx, cy + 80);
    } else {
        ctx.fillStyle = '#888';
        ctx.font = '16px Arial';
        ctx.fillText(`Récord: ${estado.record}`, cx, cy + 80);
    }
    
    const alpha = 0.5 + Math.sin(estado.tiempo * 0.05) * 0.5;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('Presiona ENTER para reintentar', cx, cy + 120);
    ctx.globalAlpha = 1;
    
    ctx.restore();
}

// ============ UI ============
function actualizarUI() {
    document.getElementById('score').textContent = estado.puntuacion;
    document.getElementById('record').textContent = estado.record;
    document.getElementById('monedas').textContent = `💎 ${estado.monedas}`;
}

// ============ LOOP ============
function loop() {
    estado.tiempo++;
    actualizar();
    dibujar();
    requestAnimationFrame(loop);
}

// ============ INICIO ============
jugador.y = estado.suelo - jugador.height;
document.getElementById('record').textContent = estado.record;
loop();
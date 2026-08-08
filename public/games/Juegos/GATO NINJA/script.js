const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ============ ESTADO ============
const estado = {
    modo: 'titulo', // titulo, jugando, gameover
    peces: 0,
    vidas: 3,
    record: parseInt(localStorage.getItem('gatoNinjaRecord')) || 0,
    tiempo: 0,
    gravedad: 0.5,
    sueloY: canvas.height - 60,
    objetos: [],
    particulas: [],
    nubes: []
};

// Generar nubes de fondo
for (let i = 0; i < 5; i++) {
    estado.nubes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * 150 + 20,
        speed: Math.random() * 0.5 + 0.2,
        size: Math.random() * 30 + 30
    });
}

// ============ JUGADOR (GATO) ============
const gato = {
    x: canvas.width / 2,
    y: 0,
    width: 50,
    height: 50,
    vx: 0,
    vy: 0,
    velocidad: 7,
    saltando: false,
    direccion: 1, // 1 derecha, -1 izquierda
    animacion: 0,
    
    actualizar() {
        // Movimiento horizontal
        if (teclas['ArrowLeft']) {
            this.vx = -this.velocidad;
            this.direccion = -1;
        } else if (teclas['ArrowRight']) {
            this.vx = this.velocidad;
            this.direccion = 1;
        } else {
            this.vx *= 0.8; // Fricción
        }
        
        this.x += this.vx;
        
        // Límites
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;
        
        // Gravedad
        this.vy += estado.gravedad;
        this.y += this.vy;
        
        // Suelo
        if (this.y + this.height >= estado.sueloY) {
            this.y = estado.sueloY - this.height;
            this.vy = 0;
            this.saltando = false;
        }
        
        this.animacion++;
    },
    
    saltar() {
        if (!this.saltando) {
            this.vy = -12;
            this.saltando = true;
            crearParticulas(this.x + this.width/2, this.y + this.height, '#FFF', 5);
        }
    },
    
    dibujar() {
        const cx = this.x + this.width/2;
        const cy = this.y + this.height/2;
        
        ctx.save();
        ctx.translate(cx, cy);
        if (this.direccion === -1) ctx.scale(-1, 1);
        
        // Cuerpo (naranja)
        ctx.fillStyle = '#FF9F43';
        ctx.beginPath();
        ctx.ellipse(0, 10, 20, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Cabeza
        ctx.fillStyle = '#FF9F43';
        ctx.beginPath();
        ctx.arc(0, -10, 18, 0, Math.PI * 2);
        ctx.fill();
        
        // Orejas
        ctx.beginPath();
        ctx.moveTo(-12, -20);
        ctx.lineTo(-18, -35);
        ctx.lineTo(-5, -25);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(12, -20);
        ctx.lineTo(18, -35);
        ctx.lineTo(5, -25);
        ctx.fill();
        
        // Ojos
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(-6, -12, 5, 0, Math.PI * 2);
        ctx.arc(6, -12, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-6 + this.vx/2, -12, 2, 0, Math.PI * 2);
        ctx.arc(6 + this.vx/2, -12, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Bigotes
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(10, -8);
        ctx.lineTo(25, -10);
        ctx.moveTo(10, -5);
        ctx.lineTo(25, -5);
        ctx.stroke();
        
        // Cola (animada)
        ctx.strokeStyle = '#FF9F43';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        const tailWag = Math.sin(this.animacion * 0.2) * 10;
        ctx.moveTo(-15, 15);
        ctx.quadraticCurveTo(-30, 10 + tailWag, -35, 0 + tailWag);
        ctx.stroke();
        
        ctx.restore();
    }
};

// ============ OBJETOS QUE CAEN ============
class Objeto {
    constructor() {
        this.x = Math.random() * (canvas.width - 40) + 20;
        this.y = -50;
        this.size = 30;
        this.vy = Math.random() * 3 + 2 + (estado.peces / 10); // Más rápido con el tiempo
        this.tipo = Math.random() < 0.7 ? 'pez' : 'bomba'; // 70% peces, 30% bombas
        this.rotacion = 0;
        this.rotVel = (Math.random() - 0.5) * 0.1;
    }
    
    actualizar() {
        this.y += this.vy;
        this.rotacion += this.rotVel;
    }
    
    dibujar() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotacion);
        
        if (this.tipo === 'pez') {
            // Cuerpo del pez
            ctx.fillStyle = '#4A90E2';
            ctx.beginPath();
            ctx.ellipse(0, 0, 15, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Cola
            ctx.beginPath();
            ctx.moveTo(-12, 0);
            ctx.lineTo(-20, -8);
            ctx.lineTo(-20, 8);
            ctx.closePath();
            ctx.fill();
            
            // Ojo
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.arc(8, -3, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(9, -3, 1, 0, Math.PI * 2);
            ctx.fill();
            
        } else {
            // Bomba
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(0, 5, 12, 0, Math.PI * 2);
            ctx.fill();
            
            // Brillo
            ctx.fillStyle = '#555';
            ctx.beginPath();
            ctx.arc(-4, 2, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Mecha
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -7);
            ctx.lineTo(5, -15);
            ctx.stroke();
            
            // Chispa
            if (Math.floor(Date.now() / 100) % 2 === 0) {
                ctx.fillStyle = '#FF0';
                ctx.beginPath();
                ctx.arc(5, -15, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
    }
}

// ============ PARTÍCULAS ============
class Particula {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = (Math.random() - 0.5) * 6;
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

function crearParticulas(x, y, color, cantidad) {
    for (let i = 0; i < cantidad; i++) {
        estado.particulas.push(new Particula(x, y, color));
    }
}

// ============ INPUT ============
const teclas = {};
window.addEventListener('keydown', (e) => {
    teclas[e.key] = true;
});
window.addEventListener('keyup', (e) => {
    teclas[e.key] = false;
});

// Click/Touch para saltar
function manejarSalto(e) {
    if (e.type === 'touchstart') e.preventDefault();
    
    if (estado.modo === 'titulo') {
        iniciarJuego();
    } else if (estado.modo === 'jugando') {
        gato.saltar();
    } else if (estado.modo === 'gameover') {
        estado.modo = 'titulo';
    }
}

canvas.addEventListener('mousedown', manejarSalto);
canvas.addEventListener('touchstart', manejarSalto);

// ============ LÓGICA DEL JUEGO ============
function iniciarJuego() {
    estado.modo = 'jugando';
    estado.peces = 0;
    estado.vidas = 3;
    estado.tiempo = 0;
    estado.objetos = [];
    estado.particulas = [];
    
    gato.x = canvas.width / 2 - gato.width / 2;
    gato.y = estado.sueloY - gato.height;
    gato.vx = 0;
    gato.vy = 0;
    
    actualizarUI();
}

function gameOver() {
    estado.modo = 'gameover';
    if (estado.peces > estado.record) {
        estado.record = estado.peces;
        localStorage.setItem('gatoNinjaRecord', estado.record);
    }
    actualizarUI();
}

function actualizarUI() {
    document.getElementById('peces').textContent = estado.peces;
    document.getElementById('vidas').textContent = '❤️'.repeat(Math.max(0, estado.vidas));
    document.getElementById('record').textContent = estado.record;
}

// ============ DIBUJO DE FONDO ============
function dibujarFondo() {
    // Cielo ya está en CSS, dibujamos nubes
    
    estado.nubes.forEach(nube => {
        nube.x += nube.speed;
        if (nube.x - nube.size > canvas.width) {
            nube.x = -nube.size;
            nube.y = Math.random() * 150 + 20;
        }
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(nube.x, nube.y, nube.size, 0, Math.PI * 2);
        ctx.arc(nube.x + nube.size * 0.8, nube.y - nube.size * 0.2, nube.size * 0.7, 0, Math.PI * 2);
        ctx.arc(nube.x - nube.size * 0.8, nube.y - nube.size * 0.2, nube.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Suelo (hierba)
    ctx.fillStyle = '#50C878';
    ctx.fillRect(0, estado.sueloY, canvas.width, canvas.height - estado.sueloY);
    
    // Detalle hierba
    ctx.strokeStyle = '#3DA362';
    ctx.lineWidth = 2;
    for (let x = 0; x < canvas.width; x += 15) {
        ctx.beginPath();
        ctx.moveTo(x, estado.sueloY);
        ctx.lineTo(x + 5, estado.sueloY - 10);
        ctx.stroke();
    }
}

function dibujarTitulo() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    
    // Gato grande decorativo
    ctx.save();
    ctx.translate(cx, cy - 50);
    ctx.scale(2, 2);
    
    ctx.fillStyle = '#FF9F43';
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Orejas
    ctx.beginPath();
    ctx.moveTo(-15, -15);
    ctx.lineTo(-20, -30);
    ctx.lineTo(-5, -20);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(15, -15);
    ctx.lineTo(20, -30);
    ctx.lineTo(5, -20);
    ctx.fill();
    
    // Ojos
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(-7, -2, 5, 0, Math.PI * 2);
    ctx.arc(7, -2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-7, -2, 2, 0, Math.PI * 2);
    ctx.arc(7, -2, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    
    ctx.textAlign = 'center';
    ctx.font = 'bold 40px Comic Sans MS';
    ctx.fillStyle = '#FF6B35';
    ctx.fillText('¡GATO NINJA!', cx, cy + 60);
    
    ctx.font = '20px Comic Sans MS';
    ctx.fillStyle = '#555';
    ctx.fillText('Haz CLICK o presiona una tecla', cx, cy + 100);
}

function dibujarGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    
    ctx.textAlign = 'center';
    ctx.font = 'bold 50px Comic Sans MS';
    ctx.fillStyle = '#FF6B6B';
    ctx.fillText('¡GAME OVER!', cx, cy - 30);
    
    ctx.font = '30px Comic Sans MS';
    ctx.fillStyle = '#FFF';
    ctx.fillText(`Peces: ${estado.peces}`, cx, cy + 20);
    
    if (estado.peces >= estado.record && estado.peces > 0) {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 25px Comic Sans MS';
        ctx.fillText('🏆 ¡NUEVO RÉCORD!', cx, cy + 60);
    }
    
    ctx.fillStyle = '#FFF';
    ctx.font = '20px Comic Sans MS';
    ctx.fillText('Click para volver', cx, cy + 100);
}

// ============ LOOP PRINCIPAL ============
function loop() {
    estado.tiempo++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    dibujarFondo();
    
    if (estado.modo === 'titulo') {
        dibujarTitulo();
        requestAnimationFrame(loop);
        return;
    }
    
    if (estado.modo === 'jugando') {
        // Generar objetos
        if (estado.tiempo % 60 === 0) { // Cada segundo aprox
            estado.objetos.push(new Objeto());
        }
        
        // Actualizar gato
        gato.actualizar();
        
        // Actualizar objetos
        estado.objetos.forEach(obj => obj.actualizar());
        
        // Colisiones
        for (let i = estado.objetos.length - 1; i >= 0; i--) {
            const obj = estado.objetos[i];
            
            // Si sale de pantalla
            if (obj.y > canvas.height) {
                estado.objetos.splice(i, 1);
                continue;
            }
            
            // Colisión con gato
            const dx = (gato.x + gato.width/2) - obj.x;
            const dy = (gato.y + gato.height/2) - obj.y;
            const dist = Math.hypot(dx, dy);
            
            if (dist < 35) { // Radio de colisión
                if (obj.tipo === 'pez') {
                    estado.peces++;
                    crearParticulas(obj.x, obj.y, '#4A90E2', 10);
                    estado.objetos.splice(i, 1);
                } else {
                    estado.vidas--;
                    crearParticulas(obj.x, obj.y, '#FF0000', 15);
                    estado.objetos.splice(i, 1);
                    
                    // Shake screen
                    canvas.style.transform = `translate(${Math.random()*10-5}px, ${Math.random()*10-5}px)`;
                    setTimeout(() => canvas.style.transform = 'none', 200);
                    
                    if (estado.vidas <= 0) {
                        gameOver();
                    }
                }
                actualizarUI();
            }
        }
        
        // Partículas
        estado.particulas.forEach(p => p.actualizar());
        estado.particulas = estado.particulas.filter(p => p.life > 0);
    }
    
    // Dibujar objetos
    estado.objetos.forEach(obj => obj.dibujar());
    
    // Dibujar gato
    if (estado.modo === 'jugando') {
        gato.dibujar();
    }
    
    // Dibujar partículas
    estado.particulas.forEach(p => p.dibujar());
    
    if (estado.modo === 'gameover') {
        dibujarGameOver();
    }
    
    requestAnimationFrame(loop);
}

// ============ INICIO ============
actualizarUI();
loop();
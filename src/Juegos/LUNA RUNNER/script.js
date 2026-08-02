const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ============ ESTADO ============
const estado = {
    modo: 'titulo', // titulo, jugando, gameover
    puntuacion: 0,
    record: parseInt(localStorage.getItem('lunaRunnerRecord')) || 0,
    velocidad: 6,
    velocidadBase: 6,
    tiempo: 0,
    suelo: canvas.height - 50,
    gravedad: 0.6,
    obstaculos: [],
    estrellas: [],
    montanas: [],
    crateres: [],
    particulas: [],
    spawnTimer: 0,
    spawnInterval: 80
};

// ============ ASTRONAUTA ============
const astronauta = {
    x: 80,
    y: 0,
    width: 35,
    height: 50,
    vy: 0,
    grounded: true,
    saltando: false,
    agachado: false,
    animacion: 0,
    color: '#ffffff',
    
    get hitbox() {
        if (this.agachado) {
            return {
                x: this.x + 5,
                y: this.y + 25,
                width: this.width - 10,
                height: 25
            };
        }
        return {
            x: this.x + 5,
            y: this.y + 5,
            width: this.width - 10,
            height: this.height - 10
        };
    },
    
    actualizar() {
        this.animacion++;
        
        // Gravedad
        if (!this.grounded) {
            this.vy += estado.gravedad;
            this.y += this.vy;
        }
        
        // Suelo
        if (this.y + this.height >= estado.suelo) {
            this.y = estado.suelo - this.height;
            this.vy = 0;
            this.grounded = true;
            this.saltando = false;
        }
    },
    
    saltar() {
        if (this.grounded && !this.agachado) {
            this.vy = -13;
            this.grounded = false;
            this.saltando = true;
            crearParticulas(this.x + this.width/2, this.y + this.height, '#aaa', 8);
        }
    },
    
    agacharse(activo) {
        if (this.grounded) {
            this.agachado = activo;
            if (activo) {
                this.height = 30;
                this.y = estado.suelo - 30;
            } else {
                this.height = 50;
                this.y = estado.suelo - 50;
            }
        }
    },
    
    dibujar() {
        const x = this.x;
        const y = this.y;
        
        if (this.agachado) {
            // Astronauta agachado
            // Casco
            ctx.fillStyle = '#ddd';
            ctx.beginPath();
            ctx.arc(x + 17, y + 10, 12, 0, Math.PI * 2);
            ctx.fill();
            
            // Visor
            ctx.fillStyle = '#4a90e2';
            ctx.beginPath();
            ctx.arc(x + 20, y + 10, 7, 0, Math.PI * 2);
            ctx.fill();
            
            // Brillo visor
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.beginPath();
            ctx.arc(x + 22, y + 8, 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Cuerpo agachado
            ctx.fillStyle = '#fff';
            ctx.fillRect(x + 5, y + 15, 25, 15);
            
            // Mochila
            ctx.fillStyle = '#888';
            ctx.fillRect(x, y + 18, 5, 10);
        } else {
            // Astronauta normal
            // Casco
            ctx.fillStyle = '#ddd';
            ctx.beginPath();
            ctx.arc(x + 17, y + 12, 13, 0, Math.PI * 2);
            ctx.fill();
            
            // Visor
            ctx.fillStyle = '#4a90e2';
            ctx.beginPath();
            ctx.arc(x + 20, y + 12, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // Brillo visor
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.beginPath();
            ctx.arc(x + 22, y + 10, 2.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Cuerpo
            ctx.fillStyle = '#fff';
            ctx.fillRect(x + 5, y + 22, 25, 18);
            
            // Mochila
            ctx.fillStyle = '#888';
            ctx.fillRect(x, y + 22, 5, 15);
            
            // Piernas animadas
            ctx.fillStyle = '#fff';
            const piernaAnim = Math.sin(this.animacion * 0.3) * 4;
            if (this.grounded) {
                ctx.fillRect(x + 8, y + 40, 7, 10 + piernaAnim);
                ctx.fillRect(x + 20, y + 40, 7, 10 - piernaAnim);
            } else {
                // Piernas estiradas al saltar
                ctx.fillRect(x + 8, y + 40, 7, 8);
                ctx.fillRect(x + 20, y + 40, 7, 8);
            }
            
            // Botas
            ctx.fillStyle = '#666';
            if (this.grounded) {
                ctx.fillRect(x + 7, y + 48 + piernaAnim, 9, 3);
                ctx.fillRect(x + 19, y + 48 - piernaAnim, 9, 3);
            }
            
            // Brazos
            ctx.fillStyle = '#fff';
            const brazoAnim = Math.sin(this.animacion * 0.3) * 3;
            ctx.fillRect(x + 28, y + 24, 6, 12 + brazoAnim);
        }
    }
};

// ============ CLASES DE OBSTÁCULOS ============
class Crater {
    constructor(x) {
        this.x = x;
        this.y = estado.suelo - 25;
        this.width = 25 + Math.random() * 20;
        this.height = 25;
        this.tipo = 'crater';
    }
    
    actualizar() {
        this.x -= estado.velocidad;
    }
    
    dibujar() {
        // Cráter (agujero en el suelo)
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/2, this.y + this.height/2, this.width/2, this.height/2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Borde del cráter
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/2, this.y + this.height/2, this.width/2, this.height/2, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Rocas alrededor
        ctx.fillStyle = '#777';
        ctx.beginPath();
        ctx.arc(this.x + 5, this.y + 5, 3, 0, Math.PI * 2);
        ctx.arc(this.x + this.width - 5, this.y + 8, 2, 0, Math.PI * 2);
        ctx.arc(this.x + this.width/2, this.y + 2, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    get hitbox() {
        return {
            x: this.x + 3,
            y: this.y + 5,
            width: this.width - 6,
            height: this.height - 5
        };
    }
}

class Roca {
    constructor(x) {
        this.x = x;
        this.y = estado.suelo - 35;
        this.width = 30;
        this.height = 35;
        this.tipo = 'roca';
    }
    
    actualizar() {
        this.x -= estado.velocidad;
    }
    
    dibujar() {
        // Roca lunar
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.moveTo(this.x + 5, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height - 10);
        ctx.lineTo(this.x + 5, this.y + 5);
        ctx.lineTo(this.x + 15, this.y);
        ctx.lineTo(this.x + 25, this.y + 3);
        ctx.lineTo(this.x + this.width, this.y + 15);
        ctx.lineTo(this.x + this.width - 3, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        
        // Detalles
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 15, 3, 0, Math.PI * 2);
        ctx.arc(this.x + 20, this.y + 22, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Brillo
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.moveTo(this.x + 8, this.y + 5);
        ctx.lineTo(this.x + 15, this.y + 3);
        ctx.lineTo(this.x + 12, this.y + 10);
        ctx.closePath();
        ctx.fill();
    }
    
    get hitbox() {
        return {
            x: this.x + 3,
            y: this.y + 3,
            width: this.width - 6,
            height: this.height - 3
        };
    }
}

class Meteorito {
    constructor(x) {
        this.x = x;
        this.y = estado.suelo - 70;
        this.width = 40;
        this.height = 25;
        this.tipo = 'meteorito';
        this.animacion = 0;
    }
    
    actualizar() {
        this.x -= estado.velocidad + 1;
        this.animacion += 0.2;
    }
    
    dibujar() {
        const y = this.y + Math.sin(this.animacion) * 3;
        
        // Estela
        ctx.fillStyle = 'rgba(255, 100, 0, 0.3)';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width, y + this.height/2);
        ctx.lineTo(this.x + this.width + 25, y + this.height/2 - 5);
        ctx.lineTo(this.x + this.width + 25, y + this.height/2 + 5);
        ctx.closePath();
        ctx.fill();
        
        // Cuerpo del meteorito
        ctx.fillStyle = '#8b4513';
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, y + this.height/2, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Alas del meteorito (como pájaro)
        ctx.fillStyle = '#654321';
        const alaAnim = Math.sin(this.animacion * 2) * 5;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width/2 - 5, y + this.height/2);
        ctx.lineTo(this.x, y + this.height/2 - 8 + alaAnim);
        ctx.lineTo(this.x + 5, y + this.height/2);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(this.x + this.width/2 + 5, y + this.height/2);
        ctx.lineTo(this.x + this.width, y + this.height/2 - 8 - alaAnim);
        ctx.lineTo(this.x + this.width - 5, y + this.height/2);
        ctx.closePath();
        ctx.fill();
        
        // Ojos brillantes
        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.arc(this.x + this.width/2 - 3, y + this.height/2 - 2, 2, 0, Math.PI * 2);
        ctx.arc(this.x + this.width/2 + 3, y + this.height/2 - 2, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    get hitbox() {
        return {
            x: this.x + 5,
            y: this.y + 5,
            width: this.width - 10,
            height: this.height - 10
        };
    }
}

// ============ PARTÍCULAS ============
class Particula {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4 - 1;
        this.color = color;
        this.size = Math.random() * 3 + 1;
        this.life = 1;
    }
    
    actualizar() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2;
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

function crearParticulas(x, y, color, cantidad) {
    for (let i = 0; i < cantidad; i++) {
        if (estado.particulas.length < 100) {
            estado.particulas.push(new Particula(x, y, color));
        }
    }
}

// ============ FONDO ============
function generarFondo() {
    // Estrellas
    for (let i = 0; i < 60; i++) {
        estado.estrellas.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (canvas.height - 100),
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 0.5 + 0.1,
            brillo: Math.random()
        });
    }
    
    // Montañas lejanas
    for (let i = 0; i < 8; i++) {
        estado.montanas.push({
            x: i * 150,
            height: 40 + Math.random() * 60,
            width: 100 + Math.random() * 80
        });
    }
    
    // Cráteres decorativos del suelo
    for (let i = 0; i < 10; i++) {
        estado.crateres.push({
            x: i * 100 + Math.random() * 50,
            size: 5 + Math.random() * 10
        });
    }
}

// ============ GENERAR OBSTÁCULOS ============
function generarObstaculos() {
    estado.spawnTimer++;
    
    if (estado.spawnTimer >= estado.spawnInterval) {
        estado.spawnTimer = 0;
        estado.spawnInterval = 50 + Math.random() * 60 - Math.min(30, estado.tiempo / 200);
        
        const tipo = Math.random();
        let obstaculo;
        
        if (tipo < 0.35) {
            obstaculo = new Crater(canvas.width + 50);
        } else if (tipo < 0.7) {
            obstaculo = new Roca(canvas.width + 50);
        } else {
            obstaculo = new Meteorito(canvas.width + 50);
        }
        
        estado.obstaculos.push(obstaculo);
    }
}

// ============ COLISIONES ============
function verificarColisiones() {
    const jugador = astronauta.hitbox;
    
    for (let obs of estado.obstaculos) {
        const o = obs.hitbox;
        
        if (jugador.x < o.x + o.width &&
            jugador.x + jugador.width > o.x &&
            jugador.y < o.y + o.height &&
            jugador.y + jugador.height > o.y) {
            gameOver();
            return;
        }
    }
}

// ============ INPUT ============
const teclas = {};
window.addEventListener('keydown', (e) => {
    teclas[e.code] = true;
    
    if (estado.modo === 'titulo') {
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'Enter') {
            iniciarJuego();
            e.preventDefault();
        }
        return;
    }
    
    if (estado.modo === 'gameover') {
        if (e.code === 'Space' || e.code === 'Enter') {
            estado.modo = 'titulo';
        }
        return;
    }
    
    if (estado.modo === 'jugando') {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            astronauta.saltar();
            e.preventDefault();
        }
        if (e.code === 'ArrowDown') {
            astronauta.agacharse(true);
            e.preventDefault();
        }
    }
});

window.addEventListener('keyup', (e) => {
    teclas[e.code] = false;
    
    if (e.code === 'ArrowDown') {
        astronauta.agacharse(false);
    }
});

canvas.addEventListener('click', () => {
    if (estado.modo === 'titulo') iniciarJuego();
    else if (estado.modo === 'gameover') estado.modo = 'titulo';
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (estado.modo === 'titulo') {
        iniciarJuego();
    } else if (estado.modo === 'gameover') {
        estado.modo = 'titulo';
    } else if (estado.modo === 'jugando') {
        astronauta.saltar();
    }
});

// ============ INICIO ============
function iniciarJuego() {
    estado.modo = 'jugando';
    estado.puntuacion = 0;
    estado.velocidad = estado.velocidadBase;
    estado.tiempo = 0;
    estado.obstaculos = [];
    estado.particulas = [];
    estado.spawnTimer = 0;
    estado.spawnInterval = 80;
    
    astronauta.x = 80;
    astronauta.y = estado.suelo - astronauta.height;
    astronauta.vy = 0;
    astronauta.grounded = true;
    astronauta.saltando = false;
    astronauta.agachado = false;
    astronauta.height = 50;
}

function gameOver() {
    estado.modo = 'gameover';
    crearParticulas(astronauta.x + astronauta.width/2, astronauta.y + astronauta.height/2, '#fff', 30);
    crearParticulas(astronauta.x + astronauta.width/2, astronauta.y + astronauta.height/2, '#ff6600', 20);
    
    if (estado.puntuacion > estado.record) {
        estado.record = estado.puntuacion;
        localStorage.setItem('lunaRunnerRecord', estado.record);
    }
    actualizarUI();
}

function actualizarUI() {
    document.getElementById('score').textContent = String(estado.puntuacion).padStart(5, '0');
    document.getElementById('record').textContent = String(estado.record).padStart(5, '0');
}

// ============ DIBUJO ============
function dibujarFondo() {
    // Cielo espacial
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#000010');
    grad.addColorStop(0.7, '#0a0a2e');
    grad.addColorStop(1, '#1a1a3e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Estrellas
    estado.estrellas.forEach(est => {
        est.x -= est.speed * (estado.velocidad / estado.velocidadBase) * 0.3;
        if (est.x < 0) {
            est.x = canvas.width;
            est.y = Math.random() * (canvas.height - 100);
        }
        const brillo = 0.4 + Math.sin(estado.tiempo * 0.02 + est.brillo * 10) * 0.3;
        ctx.globalAlpha = brillo;
        ctx.fillStyle = '#fff';
        ctx.fillRect(est.x, est.y, est.size, est.size);
    });
    ctx.globalAlpha = 1;
    
    // Planeta de fondo
    ctx.fillStyle = 'rgba(100, 50, 150, 0.3)';
    ctx.beginPath();
    ctx.arc(canvas.width - 100, 80, 50, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(150, 80, 200, 0.4)';
    ctx.beginPath();
    ctx.arc(canvas.width - 100, 80, 45, 0, Math.PI * 2);
    ctx.fill();
    
    // Montañas lejanas
    ctx.fillStyle = '#1a1a3e';
    estado.montanas.forEach(m => {
        m.x -= estado.velocidad * 0.2;
        if (m.x + m.width < 0) {
            m.x = canvas.width + Math.random() * 100;
            m.height = 40 + Math.random() * 60;
        }
        ctx.beginPath();
        ctx.moveTo(m.x, estado.suelo);
        ctx.lineTo(m.x + m.width/2, estado.suelo - m.height);
        ctx.lineTo(m.x + m.width, estado.suelo);
        ctx.closePath();
        ctx.fill();
    });
    
    // Suelo lunar
    ctx.fillStyle = '#3a3a4a';
    ctx.fillRect(0, estado.suelo, canvas.width, canvas.height - estado.suelo);
    
    // Línea del suelo
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, estado.suelo);
    ctx.lineTo(canvas.width, estado.suelo);
    ctx.stroke();
    
    // Cráteres decorativos del suelo
    estado.crateres.forEach(c => {
        c.x -= estado.velocidad;
        if (c.x + c.size < 0) {
            c.x = canvas.width + Math.random() * 50;
            c.size = 5 + Math.random() * 10;
        }
        ctx.fillStyle = '#2a2a3a';
        ctx.beginPath();
        ctx.ellipse(c.x, estado.suelo + 20, c.size, c.size/2, 0, 0, Math.PI * 2);
        ctx.fill();
    });
}

function dibujarTitulo() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Luna decorativa
    ctx.fillStyle = '#ffd700';
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ffd700';
    ctx.beginPath();
    ctx.arc(cx, cy - 80, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Cráteres de la luna
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.arc(cx - 10, cy - 85, 5, 0, Math.PI * 2);
    ctx.arc(cx + 12, cy - 75, 4, 0, Math.PI * 2);
    ctx.arc(cx - 5, cy - 70, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Título
    ctx.font = 'bold 50px Courier New';
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#fff';
    ctx.fillText('LUNA RUNNER', cx, cy + 10);
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = '#888';
    ctx.font = '16px Courier New';
    ctx.fillText('Sobrevive en la superficie lunar', cx, cy + 50);
    
    const alpha = 0.5 + Math.sin(estado.tiempo * 0.05) * 0.5;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 20px Courier New';
    ctx.fillText('Presiona ESPACIO o CLICK', cx, cy + 90);
    ctx.globalAlpha = 1;
    
    if (estado.record > 0) {
        ctx.fillStyle = '#fff';
        ctx.font = '14px Courier New';
        ctx.fillText(`RÉCORD: ${estado.record}`, cx, cy + 120);
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
    
    ctx.font = 'bold 45px Courier New';
    ctx.fillStyle = '#ff3333';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff3333';
    ctx.fillText('GAME OVER', cx, cy - 30);
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = '#fff';
    ctx.font = '24px Courier New';
    ctx.fillText(`Puntos: ${estado.puntuacion}`, cx, cy + 15);
    
    if (estado.puntuacion >= estado.record && estado.puntuacion > 0) {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 18px Courier New';
        ctx.fillText('¡NUEVO RÉCORD!', cx, cy + 45);
    }
    
    const alpha = 0.5 + Math.sin(estado.tiempo * 0.05) * 0.5;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#fff';
    ctx.font = '16px Courier New';
    ctx.fillText('Presiona ESPACIO para volver', cx, cy + 80);
    ctx.globalAlpha = 1;
    
    ctx.restore();
}

// ============ LOOP ============
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
        // Aumentar velocidad progresivamente
        estado.velocidad = estado.velocidadBase + Math.min(8, estado.tiempo / 500);
        
        // Puntuación
        if (estado.tiempo % 5 === 0) {
            estado.puntuacion++;
            actualizarUI();
        }
        
        // Generar obstáculos
        generarObstaculos();
        
        // Actualizar
        astronauta.actualizar();
        estado.obstaculos.forEach(o => o.actualizar());
        estado.obstaculos = estado.obstaculos.filter(o => o.x + o.width > -50);
        
        estado.particulas = estado.particulas.filter(p => p.life > 0);
        estado.particulas.forEach(p => p.actualizar());
        
        // Colisiones
        verificarColisiones();
    }
    
    // Dibujar obstáculos
    estado.obstaculos.forEach(o => o.dibujar());
    
    // Dibujar astronauta
    astronauta.dibujar();
    
    // Dibujar partículas
    estado.particulas.forEach(p => p.dibujar());
    
    if (estado.modo === 'gameover') {
        dibujarGameOver();
    }
    
    requestAnimationFrame(loop);
}

// ============ INICIO ============
generarFondo();
actualizarUI();
loop();
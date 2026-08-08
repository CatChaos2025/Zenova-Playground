const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const estado = {
    modo: 'titulo',
    puntos: 0,
    combo: 1,
    estrellas: 0,
    record: parseInt(localStorage.getItem('surfRecord')) || 0,
    tiempo: 0,
    velocidad: 4,
    surfista: null,
    estrellasLista: [],
    tiburones: [],
    particulas: [],
    spawnTimer: 0,
    mensaje: '',
    tiempoMensaje: 0,
    shake: 0,
    nubes: []
};

class Surfista {
    constructor() {
        this.x = 100;
        this.y = 250;
        this.width = 35;
        this.height = 45;
        this.vx = 0;
        this.vy = 0;
        this.gravedad = 0.8;
        this.sueloY = 280;
        this.enAgua = true;
        this.saltando = false;
        this.truco = null;
        this.tiempoTruco = 0;
        this.rotation = 0;
        this.animacion = 0;
        this.tablaRotation = 0;
        this.velocidadMovimiento = 6;
    }
    
    actualizar() {
        this.animacion++;
        
        // MOVIMIENTO HORIZONTAL (siempre activo)
        if (teclas['ArrowLeft'] || teclas['a']) {
            this.vx = -this.velocidadMovimiento;
        } else if (teclas['ArrowRight'] || teclas['d']) {
            this.vx = this.velocidadMovimiento;
        } else {
            this.vx *= 0.8;
        }
        
        this.x += this.vx;
        
        // MOVIMIENTO VERTICAL
        if (this.saltando) {
            // Si está saltando, usa física (gravedad)
            this.vy += this.gravedad;
            this.y += this.vy;
            
            // Aterrizar en el agua
            if (this.y + this.height >= this.sueloY) {
                this.y = this.sueloY - this.height;
                this.vy = 0;
                this.saltando = false;
                this.enAgua = true;
                this.rotation = 0;
                this.tablaRotation = 0;
                crearSalpicadura(this.x + this.width/2, this.y + this.height);
            }
        } else {
            // Si NO está saltando, control manual total
            this.enAgua = true;
            this.vy = 0;
            
            if (teclas['ArrowUp'] || teclas['w']) {
                this.y -= this.velocidadMovimiento;
            }
            if (teclas['ArrowDown'] || teclas['s']) {
                this.y += this.velocidadMovimiento;
            }
        }
        
        // Límites de pantalla
        this.x = Math.max(10, Math.min(canvas.width - this.width - 10, this.x));
        this.y = Math.max(50, Math.min(canvas.height - this.height - 10, this.y));
        
        // Trucos en el aire
        if (this.truco) {
            this.tiempoTruco--;
            if (this.truco === 'flip') this.rotation += 0.3;
            else if (this.truco === 'spin') this.tablaRotation += 0.4;
            if (this.tiempoTruco <= 0) this.truco = null;
        }
    }
    
    saltar() {
        if (this.enAgua && !this.saltando) {
            this.vy = -15;
            this.saltando = true;
            this.enAgua = false;
            crearSalpicadura(this.x + this.width/2, this.y + this.height);
        }
    }
    
    hacerTruco(tipo) {
        if (!this.saltando || this.truco) return false;
        
        this.truco = tipo;
        this.tiempoTruco = 30;
        
        let puntosTruco = 0;
        if (tipo === 'flip') puntosTruco = 60;
        else if (tipo === 'spin') puntosTruco = 80;
        
        estado.puntos += puntosTruco * estado.combo;
        estado.combo++;
        estado.mensaje = `${tipo.toUpperCase()}! +${puntosTruco * estado.combo}`;
        estado.tiempoMensaje = 60;
        
        crearChispas(this.x + this.width/2, this.y + this.height/2, '#FFD700', 15);
        return true;
    }
    
    dibujar() {
        const cx = this.x + this.width/2;
        const cy = this.y + this.height/2;
        
        ctx.save();
        ctx.translate(cx, cy);
        
        if (this.truco === 'flip') ctx.rotate(this.rotation);
        
        // Tabla de surf
        ctx.save();
        ctx.translate(0, this.height/2 - 5);
        if (this.truco === 'spin') ctx.rotate(this.tablaRotation);
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(0, 0, 25, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FF6B35';
        ctx.fillRect(-20, -1, 40, 2);
        
        ctx.fillStyle = '#FF6B35';
        ctx.beginPath();
        ctx.moveTo(15, 3);
        ctx.lineTo(20, 8);
        ctx.lineTo(10, 8);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
        
        // Piernas
        ctx.fillStyle = '#1E88E5';
        ctx.fillRect(-8, 5, 5, 12);
        ctx.fillRect(3, 5, 5, 12);
        
        // Cuerpo
        ctx.fillStyle = '#FF6B35';
        ctx.fillRect(-10, -12, 20, 18);
        
        // Brazos
        ctx.fillStyle = '#FFCCBC';
        if (this.saltando) {
            ctx.fillRect(-15, -15, 5, 12);
            ctx.fillRect(10, -15, 5, 12);
        } else {
            ctx.fillRect(-15, -8, 5, 12);
            ctx.fillRect(10, -8, 5, 12);
        }
        
        // Cabeza
        ctx.fillStyle = '#FFCCBC';
        ctx.beginPath();
        ctx.arc(0, -20, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Pelo
        ctx.fillStyle = '#FFC107';
        ctx.beginPath();
        ctx.arc(0, -23, 8, Math.PI, 0);
        ctx.fill();
        
        // Gafas
        ctx.fillStyle = '#000';
        ctx.fillRect(-6, -21, 4, 3);
        ctx.fillRect(2, -21, 4, 3);
        ctx.fillRect(-2, -20, 4, 1);
        
        ctx.restore();
    }
    
    getHitbox() {
        return {
            x: this.x + 5,
            y: this.y + 5,
            width: this.width - 10,
            height: this.height - 10
        };
    }
}

class Tiburon {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 30;
        this.activa = true;
        this.animacion = Math.random() * Math.PI * 2;
    }
    
    actualizar() {
        this.x -= estado.velocidad * 1.2;
        this.animacion += 0.1;
        this.y += Math.sin(this.animacion) * 0.5;
        if (this.x + this.width < 0) this.activa = false;
    }
    
    dibujar() {
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        
        ctx.fillStyle = '#607D8B';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width/2, this.height/2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#455A64';
        ctx.beginPath();
        ctx.moveTo(0, -this.height/2);
        ctx.lineTo(-5, -this.height/2 - 10);
        ctx.lineTo(5, -this.height/2);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(-this.width/2, 0);
        ctx.lineTo(-this.width/2 - 10, -8);
        ctx.lineTo(-this.width/2 - 10, 8);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(this.width/4, -3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.width/4 + 1, -3, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFF';
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(this.width/3 + i * 3, 3);
            ctx.lineTo(this.width/3 + i * 3 + 1.5, 7);
            ctx.lineTo(this.width/3 + i * 3 + 3, 3);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    getHitbox() {
        return {
            x: this.x + 5,
            y: this.y + 5,
            width: this.width - 10,
            height: this.height - 10
        };
    }
}

class Estrella {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radio = 12;
        this.activa = true;
        this.animacion = Math.random() * Math.PI * 2;
    }
    
    actualizar() {
        this.x -= estado.velocidad;
        this.animacion += 0.1;
        if (this.x + this.radio < 0) this.activa = false;
    }
    
    dibujar() {
        const scale = 1 + Math.sin(this.animacion) * 0.2;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(scale, scale);
        ctx.rotate(this.animacion * 0.5);
        
        ctx.fillStyle = '#FFD700';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#FFD700';
        dibujarEstrella(ctx, 0, 0, 5, this.radio, this.radio/2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = '#FF8F00';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
    }
}

function dibujarEstrella(ctx, cx, cy, spikes, outerR, innerR) {
    let rot = Math.PI / 2 * 3;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerR);
    for (let i = 0; i < spikes; i++) {
        ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
        rot += step;
        ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerR);
    ctx.closePath();
}

class Particula {
    constructor(x, y, color, tipo = 'normal') {
        this.x = x;
        this.y = y;
        this.tipo = tipo;
        if (tipo === 'splash') {
            this.vx = (Math.random() - 0.5) * 10;
            this.vy = -Math.random() * 8 - 2;
            this.size = Math.random() * 5 + 3;
        } else {
            this.vx = (Math.random() - 0.5) * 8;
            this.vy = (Math.random() - 0.5) * 8;
            this.size = Math.random() * 4 + 2;
        }
        this.color = color;
        this.life = 1;
    }
    
    actualizar() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.3;
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

function crearChispas(x, y, color, cantidad) {
    for (let i = 0; i < cantidad; i++) {
        estado.particulas.push(new Particula(x, y, color));
    }
}

function crearSalpicadura(x, y) {
    for (let i = 0; i < 15; i++) {
        estado.particulas.push(new Particula(x, y, '#FFF', 'splash'));
    }
}

function crearCelebracion(x, y, cantidad) {
    const colores = ['#FFD700', '#FF6B6B', '#4A90E2', '#50C878', '#FF00FF'];
    for (let i = 0; i < cantidad; i++) {
        const p = new Particula(x, y, colores[Math.floor(Math.random() * colores.length)]);
        p.vx = (Math.random() - 0.5) * 15;
        p.vy = (Math.random() - 0.5) * 15;
        p.size = Math.random() * 6 + 3;
        estado.particulas.push(p);
    }
}

function generarFondo() {
    estado.nubes = [];
    for (let i = 0; i < 5; i++) {
        estado.nubes.push({
            x: Math.random() * canvas.width,
            y: 20 + Math.random() * 60,
            size: 20 + Math.random() * 20,
            speed: Math.random() * 0.3 + 0.1
        });
    }
}

function generarObstaculos() {
    estado.spawnTimer++;
    const intervaloSpawn = Math.max(50, 100 - estado.puntos / 20);
    
    if (estado.spawnTimer >= intervaloSpawn) {
        estado.spawnTimer = 0;
        const tipo = Math.random();
        
        if (tipo < 0.5) {
            const y = 150 + Math.random() * 200;
            estado.tiburones.push(new Tiburon(canvas.width + 50, y));
        } else {
            const y = 80 + Math.random() * 200;
            estado.estrellasLista.push(new Estrella(canvas.width + 50, y));
        }
    }
}

function verificarColisiones() {
    const surfista = estado.surfista;
    const hitbox = surfista.getHitbox();
    
    for (let tiburon of estado.tiburones) {
        if (!tiburon.activa) continue;
        const tHitbox = tiburon.getHitbox();
        
        if (hitbox.x < tHitbox.x + tHitbox.width &&
            hitbox.x + hitbox.width > tHitbox.x &&
            hitbox.y < tHitbox.y + tHitbox.height &&
            hitbox.y + hitbox.height > tHitbox.y) {
            
            estado.modo = 'gameover';
            crearCelebracion(surfista.x + surfista.width/2, surfista.y + surfista.height/2, 40);
            estado.shake = 15;
            
            if (estado.puntos > estado.record) {
                estado.record = estado.puntos;
                localStorage.setItem('surfRecord', estado.record);
            }
            actualizarUI();
            return;
        }
    }
    
    for (let estrella of estado.estrellasLista) {
        if (!estrella.activa) continue;
        
        const dist = Math.hypot(
            (surfista.x + surfista.width/2) - estrella.x,
            (surfista.y + surfista.height/2) - estrella.y
        );
        
        if (dist < estrella.radio + 20) {
            estrella.activa = false;
            estado.estrellas++;
            estado.puntos += 30 * estado.combo;
            crearChispas(estrella.x, estrella.y, '#FFD700', 12);
            estado.mensaje = `¡ESTRELLA! +${30 * estado.combo}`;
            estado.tiempoMensaje = 50;
        }
    }
}

function iniciarJuego() {
    estado.modo = 'jugando';
    estado.puntos = 0;
    estado.combo = 1;
    estado.estrellas = 0;
    estado.velocidad = 4;
    estado.tiempo = 0;
    estado.spawnTimer = 0;
    estado.tiburones = [];
    estado.estrellasLista = [];
    estado.particulas = [];
    estado.surfista = new Surfista();
    generarFondo();
    actualizarUI();
}

function actualizarUI() {
    document.getElementById('puntos').textContent = estado.puntos;
    document.getElementById('combo').textContent = `x${estado.combo}`;
    document.getElementById('estrellas').textContent = estado.estrellas;
    document.getElementById('record').textContent = estado.record;
}

const teclas = {};
window.addEventListener('keydown', (e) => {
    teclas[e.key] = true;
    
    if (estado.modo === 'titulo' && e.code === 'Space') {
        iniciarJuego();
        e.preventDefault();
        return;
    }
    
    if (estado.modo === 'gameover' && e.code === 'Space') {
        estado.modo = 'titulo';
        e.preventDefault();
        return;
    }
    
    if (estado.modo !== 'jugando') return;
    
    switch(e.key.toLowerCase()) {
        case ' ':
            estado.surfista.saltar();
            e.preventDefault();
            break;
        case 'a':
            estado.surfista.hacerTruco('flip');
            break;
        case 's':
            estado.surfista.hacerTruco('spin');
            break;
    }
    
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    teclas[e.key] = false;
});

canvas.addEventListener('click', () => {
    if (estado.modo === 'titulo') iniciarJuego();
    else if (estado.modo === 'gameover') estado.modo = 'titulo';
    else if (estado.modo === 'jugando') estado.surfista.saltar();
});

function dibujarFondo() {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#87CEEB');
    grad.addColorStop(0.4, '#FFD89B');
    grad.addColorStop(0.6, '#FF9A8B');
    grad.addColorStop(1, '#0083B0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'rgba(255, 220, 100, 0.9)';
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#FFD700';
    ctx.beginPath();
    ctx.arc(canvas.width - 100, 80, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    estado.nubes.forEach(nube => {
        nube.x -= nube.speed;
        if (nube.x + nube.size < 0) {
            nube.x = canvas.width + nube.size;
            nube.y = 20 + Math.random() * 60;
        }
        ctx.beginPath();
        ctx.arc(nube.x, nube.y, nube.size, 0, Math.PI * 2);
        ctx.arc(nube.x + nube.size * 0.8, nube.y + 5, nube.size * 0.7, 0, Math.PI * 2);
        ctx.arc(nube.x - nube.size * 0.8, nube.y + 5, nube.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
    });
    
    ctx.fillStyle = '#0083B0';
    ctx.fillRect(0, 280, canvas.width, 120);
    
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
        const y = 290 + i * 20;
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += 10) {
            const offset = Math.sin((x + estado.tiempo * 2) * 0.05 + i) * 3;
            if (x === 0) ctx.moveTo(x, y + offset);
            else ctx.lineTo(x, y + offset);
        }
        ctx.stroke();
    }
}

function dibujarMensaje() {
    if (estado.tiempoMensaje <= 0) return;
    
    const alpha = Math.min(1, estado.tiempoMensaje / 30);
    const scale = 1 + (1 - alpha) * 0.3;
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(canvas.width/2, 100);
    ctx.scale(scale, scale);
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 30px Arial';
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.strokeText(estado.mensaje, 0, 0);
    ctx.fillStyle = '#FFD700';
    ctx.fillText(estado.mensaje, 0, 0);
    
    ctx.restore();
}

function dibujarTitulo() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const cx = canvas.width/2;
    const cy = canvas.height/2;
    
    ctx.save();
    ctx.translate(cx, cy - 80);
    ctx.rotate(estado.tiempo * 0.02);
    
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.ellipse(0, 0, 30, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FF6B35';
    ctx.fillRect(-25, -1, 50, 2);
    
    ctx.restore();
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.font = 'bold 50px Arial';
    ctx.fillStyle = '#FFF';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.strokeText('SURF', cx, cy + 20);
    ctx.fillText('SURF', cx, cy + 20);
    ctx.strokeText('RIDER', cx, cy + 70);
    ctx.fillText('RIDER', cx, cy + 70);
    
    ctx.font = '14px Arial';
    ctx.fillStyle = '#FFF';
    ctx.fillText('Surfea, haz trucos y evita tiburones', cx, cy + 110);
    
    const alpha = 0.5 + Math.sin(estado.tiempo * 0.08) * 0.5;
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('CLICK o ESPACIO', cx, cy + 145);
    ctx.globalAlpha = 1;
    
    if (estado.record > 0) {
        ctx.font = '14px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`🏆 Récord: ${estado.record}`, cx, cy + 175);
    }
}

function dibujarGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const cx = canvas.width/2;
    const cy = canvas.height/2;
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.font = 'bold 50px Arial';
    ctx.fillStyle = '#F44336';
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 5;
    ctx.strokeText('¡TIBURÓN!', cx, cy - 60);
    ctx.fillText('¡TIBURÓN!', cx, cy - 60);
    
    ctx.font = 'bold 30px Arial';
    ctx.fillStyle = '#FFF';
    ctx.fillText(`${estado.puntos} PTS`, cx, cy);
    
    ctx.font = '20px Arial';
    ctx.fillStyle = '#FFC107';
    ctx.fillText(`Estrellas: ${estado.estrellas}`, cx, cy + 35);
    
    if (estado.puntos >= estado.record && estado.puntos > 0) {
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.fillText('🏆 ¡NUEVO RÉCORD!', cx, cy + 70);
    }
    
    const alpha = 0.5 + Math.sin(estado.tiempo * 0.08) * 0.5;
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#FFF';
    ctx.fillText('CLICK o ESPACIO', cx, cy + 110);
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
    
    dibujarFondo();
    
    if (estado.modo === 'titulo') {
        dibujarTitulo();
        ctx.restore();
        requestAnimationFrame(loop);
        return;
    }
    
    if (estado.modo === 'jugando') {
        estado.surfista.actualizar();
        generarObstaculos();
        
        estado.tiburones.forEach(t => t.actualizar());
        estado.tiburones = estado.tiburones.filter(t => t.activa);
        
        estado.estrellasLista.forEach(e => e.actualizar());
        estado.estrellasLista = estado.estrellasLista.filter(e => e.activa);
        
        verificarColisiones();
        actualizarUI();
    }
    
    if (estado.tiempoMensaje > 0) estado.tiempoMensaje--;
    
    estado.particulas = estado.particulas.filter(p => p.life > 0);
    estado.particulas.forEach(p => p.actualizar());
    
    estado.tiburones.forEach(t => t.dibujar());
    estado.estrellasLista.forEach(e => e.dibujar());
    estado.surfista.dibujar();
    estado.particulas.forEach(p => p.dibujar());
    
    dibujarMensaje();
    
    if (estado.modo === 'gameover') {
        dibujarGameOver();
    }
    
    ctx.restore();
    requestAnimationFrame(loop);
}

estado.surfista = new Surfista();
generarFondo();
loop();
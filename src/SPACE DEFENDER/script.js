const c = document.getElementById('c');
const ctx = c.getContext('2d');
const W = c.width, H = c.height;

let nave, balas, enemigos, particulas, estrellas;
let score = 0, vidas = 3, oleada = 1, pausa = false, gameOver = false;
const teclas = {};

window.addEventListener('keydown', e => {
    teclas[e.key.toLowerCase()] = true;
    if (e.key === ' ') e.preventDefault();
    if (e.key.toLowerCase() === 'p') pausa = !pausa;
});
window.addEventListener('keyup', e => teclas[e.key.toLowerCase()] = false);

class Nave {
    constructor() {
        this.x = W/2; this.y = H - 60;
        this.w = 30; this.h = 30;
        this.vx = 0;
        this.cooldown = 0;
    }
    
    actualizar() {
        if (teclas['arrowleft'] || teclas['a']) this.vx = -5;
        else if (teclas['arrowright'] || teclas['d']) this.vx = 5;
        else this.vx *= 0.8;
        
        this.x += this.vx;
        this.x = Math.max(15, Math.min(W - 15, this.x));
        
        if (this.cooldown > 0) this.cooldown--;
        
        if (teclas[' '] && this.cooldown === 0) {
            balas.push({x: this.x, y: this.y - 15, vy: -8, w: 4, h: 10});
            this.cooldown = 15;
        }
    }
    
    dibujar() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Nave
        ctx.fillStyle = '#00FFFF';
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(-15, 15);
        ctx.lineTo(0, 10);
        ctx.lineTo(15, 15);
        ctx.closePath();
        ctx.fill();
        
        // Cabina
        ctx.fillStyle = '#FF00FF';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI*2);
        ctx.fill();
        
        // Propulsores
        ctx.fillStyle = '#FFA500';
        ctx.fillRect(-10, 12, 5, 5 + Math.random() * 5);
        ctx.fillRect(5, 12, 5, 5 + Math.random() * 5);
        
        ctx.restore();
    }
}

function crearEstrellas() {
    estrellas = [];
    for (let i = 0; i < 100; i++) {
        estrellas.push({
            x: Math.random() * W,
            y: Math.random() * H,
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 2 + 0.5
        });
    }
}

function crearOleada() {
    enemigos = [];
    const filas = Math.min(3 + Math.floor(oleada / 2), 6);
    const cols = Math.min(6 + Math.floor(oleada / 3), 10);
    
    for (let f = 0; f < filas; f++) {
        for (let col = 0; col < cols; col++) {
            enemigos.push({
                x: 50 + col * 50,
                y: 30 + f * 40,
                w: 25, h: 25,
                vx: 1 + oleada * 0.2,
                vy: 0,
                tipo: f === 0 ? 'jefe' : 'normal',
                vida: f === 0 ? 3 : 1
            });
        }
    }
}

function crearParticulas(x, y, color, n) {
    for (let i = 0; i < n; i++) {
        particulas.push({
            x, y,
            vx: (Math.random()-0.5)*6,
            vy: (Math.random()-0.5)*6,
            color, size: Math.random()*3+1, life: 1
        });
    }
}

function iniciarJuego() {
    nave = new Nave();
    balas = []; enemigos = []; particulas = [];
    score = 0; vidas = 3; oleada = 1; gameOver = false;
    crearEstrellas();
    crearOleada();
}

function update() {
    if (pausa || gameOver) return;
    
    nave.actualizar();
    
    // Estrellas
    estrellas.forEach(e => {
        e.y += e.speed;
        if (e.y > H) { e.y = 0; e.x = Math.random() * W; }
    });
    
    // Balas
    balas = balas.filter(b => b.y > 0);
    balas.forEach(b => b.y += b.vy);
    
    // Enemigos
    let bajar = false;
    enemigos.forEach(e => {
        e.x += e.vx;
        if (e.x < 20 || e.x > W - 20) bajar = true;
    });
    
    if (bajar) {
        enemigos.forEach(e => {
            e.vx *= -1;
            e.y += 15;
        });
    }
    
    // Colisiones balas-enemigos
    balas.forEach((b, bi) => {
        enemigos.forEach((e, ei) => {
            if (b.x > e.x - e.w/2 && b.x < e.x + e.w/2 &&
                b.y > e.y - e.h/2 && b.y < e.y + e.h/2) {
                e.vida--;
                balas.splice(bi, 1);
                
                if (e.vida <= 0) {
                    crearParticulas(e.x, e.y, e.tipo === 'jefe' ? '#FF0000' : '#00FF00', 10);
                    enemigos.splice(ei, 1);
                    score += e.tipo === 'jefe' ? 50 : 10;
                }
            }
        });
    });
    
    // Enemigos llegan abajo
    enemigos.forEach(e => {
        if (e.y > H - 50) {
            vidas--;
            e.y = 30;
            if (vidas <= 0) gameOver = true;
        }
    });
    
    // Siguiente oleada
    if (enemigos.length === 0) {
        oleada++;
        crearOleada();
    }
    
    // Partículas
    particulas = particulas.filter(p => p.life > 0);
    particulas.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.1; p.life -= 0.03;
    });
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    
    // Estrellas
    estrellas.forEach(e => {
        ctx.fillStyle = '#FFF';
        ctx.fillRect(e.x, e.y, e.size, e.size);
    });
    
    // Enemigos
    enemigos.forEach(e => {
        ctx.fillStyle = e.tipo === 'jefe' ? '#FF0000' : '#00FF00';
        ctx.fillRect(e.x - e.w/2, e.y - e.h/2, e.w, e.h);
        ctx.fillStyle = '#FFF';
        ctx.fillRect(e.x - 5, e.y - 5, 3, 3);
        ctx.fillRect(e.x + 2, e.y - 5, 3, 3);
    });
    
    // Balas
    ctx.fillStyle = '#FFFF00';
    balas.forEach(b => ctx.fillRect(b.x - b.w/2, b.y, b.w, b.h));
    
    // Nave
    if (!gameOver) nave.dibujar();
    
    // Partículas
    particulas.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1;
    
    // HUD
    ctx.fillStyle = '#00FFFF';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`❤️ ${vidas}  💰 ${score}  Oleada ${oleada}`, 10, 25);
    
    if (pausa) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#FFFF00';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⏸️ PAUSA', W/2, H/2);
        ctx.font = '20px Arial';
        ctx.fillText('Presiona P para continuar', W/2, H/2 + 40);
    }
    
    if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#FF0000';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('💀 GAME OVER', W/2, H/2 - 20);
        ctx.fillStyle = '#FFF';
        ctx.font = '20px Arial';
        ctx.fillText(`Puntuación: ${score} | Oleada: ${oleada}`, W/2, H/2 + 20);
        ctx.fillText('Presiona R para reiniciar', W/2, H/2 + 60);
    }
    
    requestAnimationFrame(loop);
}

function loop() {
    update();
    draw();
}

window.addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 'r' && gameOver) iniciarJuego();
});

iniciarJuego();
loop();
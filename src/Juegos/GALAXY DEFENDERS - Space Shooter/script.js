const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const estado = {
    modo: 'titulo',
    puntuacion: 0,
    record: parseInt(localStorage.getItem('galaxyDefendersRecord')) || 0,
    vidas: 100,
    tiempo: 0,
    jugador: null,
    enemigos: [],
    proyectiles: [],
    proyectilesEnemigos: [],
    powerups: [],
    particulas: [],
    estrellas: [],
    nivel: 1,
    bomba: 3,
    invulnerable: 0,
    poderDisparo: 1
};

// Estrellas de fondo
for (let i = 0; i < 100; i++) {
    estado.estrellas.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: Math.random() * 2 + 0.5,
        size: Math.random() * 2 + 1
    });
}

class Jugador {
    constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height - 80;
        this.width = 40;
        this.height = 50;
        this.velocidad = 6;
        this.tiempoDisparo = 0;
        this.intervaloDisparo = 15;
    }
    
    actualizar() {
        if (teclas['ArrowLeft'] || teclas['a']) this.x -= this.velocidad;
        if (teclas['ArrowRight'] || teclas['d']) this.x += this.velocidad;
        if (teclas['ArrowUp'] || teclas['w']) this.y -= this.velocidad;
        if (teclas['ArrowDown'] || teclas['s']) this.y += this.velocidad;
        
        this.x = Math.max(this.width/2, Math.min(canvas.width - this.width/2, this.x));
        this.y = Math.max(this.height/2, Math.min(canvas.height - this.height/2, this.y));
        
        this.tiempoDisparo++;
        if (teclas[' '] && this.tiempoDisparo >= this.intervaloDisparo) {
            this.disparar();
            this.tiempoDisparo = 0;
        }
    }
    
    disparar() {
        const color = estado.poderDisparo === 1 ? '#00ffff' : 
                      estado.poderDisparo === 2 ? '#ffff00' : '#ff00ff';
        
        if (estado.poderDisparo === 1) {
            estado.proyectiles.push(new Proyectil(this.x, this.y - 20, 0, -10, color, 10));
        } else if (estado.poderDisparo === 2) {
            estado.proyectiles.push(new Proyectil(this.x - 10, this.y - 20, 0, -10, color, 10));
            estado.proyectiles.push(new Proyectil(this.x + 10, this.y - 20, 0, -10, color, 10));
        } else {
            estado.proyectiles.push(new Proyectil(this.x, this.y - 20, 0, -10, color, 10));
            estado.proyectiles.push(new Proyectil(this.x - 15, this.y - 15, -2, -10, color, 10));
            estado.proyectiles.push(new Proyectil(this.x + 15, this.y - 15, 2, -10, color, 10));
        }
    }
    
    dibujar() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Nave
        ctx.fillStyle = '#00ffff';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00ffff';
        
        // Cuerpo principal
        ctx.beginPath();
        ctx.moveTo(0, -this.height/2);
        ctx.lineTo(-this.width/2, this.height/2);
        ctx.lineTo(0, this.height/3);
        ctx.lineTo(this.width/2, this.height/2);
        ctx.closePath();
        ctx.fill();
        
        // Cabina
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, -5, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Propulsores
        ctx.fillStyle = '#ff6600';
        ctx.shadowColor = '#ff6600';
        const propSize = 5 + Math.sin(estado.tiempo * 0.5) * 3;
        ctx.fillRect(-8, this.height/2, 6, propSize);
        ctx.fillRect(2, this.height/2, 6, propSize);
        
        ctx.shadowBlur = 0;
        ctx.restore();
        
        // Efecto invulnerable
        if (estado.invulnerable > 0) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${Math.sin(estado.tiempo * 0.3) * 0.5 + 0.5})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 30, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

class Proyectil {
    constructor(x, y, vx, vy, color, daño) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.daño = daño;
        this.radio = 5;
        this.activa = true;
    }
    
    actualizar() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.y < -20 || this.y > canvas.height + 20 || 
            this.x < -20 || this.x > canvas.width + 20) {
            this.activa = false;
        }
    }
    
    dibujar() {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radio, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

class Enemigo {
    constructor(tipo) {
        this.tipo = tipo;
        this.x = Math.random() * (canvas.width - 60) + 30;
        this.y = -50;
        this.activa = true;
        
        if (tipo === 'basico') {
            this.width = 35;
            this.height = 35;
            this.vida = 20;
            this.velocidad = 2;
            this.color = '#ff0066';
            this.puntos = 10;
            this.tiempoDisparo = Math.random() * 100;
        } else if (tipo === 'rapido') {
            this.width = 30;
            this.height = 30;
            this.vida = 15;
            this.velocidad = 4;
            this.color = '#ffff00';
            this.puntos = 15;
            this.tiempoDisparo = Math.random() * 80;
        } else if (tipo === 'tanque') {
            this.width = 45;
            this.height = 45;
            this.vida = 50;
            this.velocidad = 1.5;
            this.color = '#ff6600';
            this.puntos = 25;
            this.tiempoDisparo = Math.random() * 120;
        }
        
        this.vidaMax = this.vida;
    }
    
    actualizar() {
        this.y += this.velocidad;
        this.tiempoDisparo++;
        
        if (this.y > canvas.height + 50) {
            this.activa = false;
        }
        
        // Disparar
        if (this.tiempoDisparo > 100 && Math.random() < 0.02) {
            estado.proyectilesEnemigos.push(
                new Proyectil(this.x, this.y + this.height/2, 0, 5, '#ff0000', 10)
            );
            this.tiempoDisparo = 0;
        }
    }
    
    dibujar() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        
        if (this.tipo === 'basico') {
            ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
            ctx.fillStyle = '#fff';
            ctx.fillRect(-8, -5, 5, 5);
            ctx.fillRect(3, -5, 5, 5);
        } else if (this.tipo === 'rapido') {
            ctx.beginPath();
            ctx.moveTo(0, -this.height/2);
            ctx.lineTo(-this.width/2, this.height/2);
            ctx.lineTo(this.width/2, this.height/2);
            ctx.closePath();
            ctx.fill();
        } else if (this.tipo === 'tanque') {
            ctx.beginPath();
            ctx.arc(0, 0, this.width/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(0, 0, this.width/3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.shadowBlur = 0;
        ctx.restore();
        
        // Barra de vida
        if (this.vida < this.vidaMax) {
            const anchoBarra = this.width;
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x - anchoBarra/2, this.y - this.height/2 - 8, anchoBarra, 3);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(this.x - anchoBarra/2, this.y - this.height/2 - 8, 
                        anchoBarra * (this.vida / this.vidaMax), 3);
        }
    }
}

class PowerUp {
    constructor(x, y, tipo) {
        this.x = x;
        this.y = y;
        this.tipo = tipo;
        this.velocidad = 2;
        this.radio = 15;
        this.activa = true;
        this.anim = 0;
    }
    
    actualizar() {
        this.y += this.velocidad;
        this.anim += 0.1;
        if (this.y > canvas.height + 50) this.activa = false;
    }
    
    dibujar() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.anim);
        
        const color = this.tipo === 'vida' ? '#00ff00' : 
                      this.tipo === 'poder' ? '#ffff00' : '#ff00ff';
        
        ctx.fillStyle = color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
        ctx.fillRect(-this.radio, -this.radio, this.radio * 2, this.radio * 2);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const simbolo = this.tipo === 'vida' ? '+' : this.tipo === 'poder' ? '↑' : '💣';
        ctx.fillText(simbolo, 0, 0);
        
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

class Particula {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.color = color;
        this.size = Math.random() * 4 + 2;
        this.life = 1;
    }
    
    actualizar() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.03;
        this.size *= 0.98;
    }
    
    dibujar() {
        if (this.life <= 0) return;
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

const teclas = {};
window.addEventListener('keydown', (e) => {
    teclas[e.key] = true;
    
    if (estado.modo === 'titulo' && e.key === ' ') {
        iniciarJuego();
        e.preventDefault();
    }
    if (estado.modo === 'gameover' && e.key === ' ') {
        estado.modo = 'titulo';
        e.preventDefault();
    }
    if (e.key === 'x' && estado.modo === 'jugando' && estado.bomba > 0) {
        usarBomba();
    }
});

window.addEventListener('keyup', (e) => {
    teclas[e.key] = false;
});

function iniciarJuego() {
    estado.modo = 'jugando';
    estado.puntuacion = 0;
    estado.vidas = 100;
    estado.tiempo = 0;
    estado.nivel = 1;
    estado.bomba = 3;
    estado.invulnerable = 0;
    estado.poderDisparo = 1;
    estado.jugador = new Jugador();
    estado.enemigos = [];
    estado.proyectiles = [];
    estado.proyectilesEnemigos = [];
    estado.powerups = [];
    estado.particulas = [];
    actualizarUI();
}

function usarBomba() {
    estado.bomba--;
    
    // Destruir todos los enemigos en pantalla
    estado.enemigos.forEach(enemigo => {
        crearExplosion(enemigo.x, enemigo.y, enemigo.color, 20);
        estado.puntuacion += enemigo.puntos;
    });
    estado.enemigos = [];
    
    // Destruir proyectiles enemigos
    estado.proyectilesEnemigos = [];
    
    // Efecto visual
    for (let i = 0; i < 100; i++) {
        estado.particulas.push(new Particula(
            estado.jugador.x, estado.jugador.y, '#ffffff'
        ));
    }
    
    actualizarUI();
}

function crearExplosion(x, y, color, cantidad) {
    for (let i = 0; i < cantidad; i++) {
        if (estado.particulas.length < 200) {
            estado.particulas.push(new Particula(x, y, color));
        }
    }
}

function generarEnemigos() {
    const dificultad = Math.min(estado.nivel, 10);
    
    if (estado.tiempo % 60 === 0 && Math.random() < 0.3 + dificultad * 0.05) {
        const tipo = Math.random();
        let enemigo;
        
        if (tipo < 0.6) {
            enemigo = new Enemigo('basico');
        } else if (tipo < 0.85) {
            enemigo = new Enemigo('rapido');
        } else {
            enemigo = new Enemigo('tanque');
        }
        
        estado.enemigos.push(enemigo);
    }
    
    // Power-ups
    if (estado.tiempo % 300 === 0 && Math.random() < 0.5) {
        const tipos = ['vida', 'poder', 'bomba'];
        const tipo = tipos[Math.floor(Math.random() * tipos.length)];
        estado.powerups.push(new PowerUp(
            Math.random() * (canvas.width - 60) + 30,
            -30,
            tipo
        ));
    }
}

function detectarColisiones() {
    // Proyectiles del jugador vs enemigos
    estado.proyectiles.forEach(proyectil => {
        if (!proyectil.activa) return;
        
        estado.enemigos.forEach(enemigo => {
            if (!enemigo.activa) return;
            
            const dist = Math.hypot(proyectil.x - enemigo.x, proyectil.y - enemigo.y);
            if (dist < proyectil.radio + enemigo.width/2) {
                enemigo.vida -= proyectil.daño;
                proyectil.activa = false;
                crearExplosion(proyectil.x, proyectil.y, proyectil.color, 5);
                
                if (enemigo.vida <= 0) {
                    enemigo.activa = false;
                    estado.puntuacion += enemigo.puntos;
                    crearExplosion(enemigo.x, enemigo.y, enemigo.color, 15);
                    
                    // Soltar power-up
                    if (Math.random() < 0.1) {
                        const tipos = ['vida', 'poder', 'bomba'];
                        const tipo = tipos[Math.floor(Math.random() * tipos.length)];
                        estado.powerups.push(new PowerUp(enemigo.x, enemigo.y, tipo));
                    }
                }
            }
        });
    });
    
    // Proyectiles enemigos vs jugador
    if (estado.invulnerable <= 0) {
        estado.proyectilesEnemigos.forEach(proyectil => {
            if (!proyectil.activa) return;
            
            const dist = Math.hypot(proyectil.x - estado.jugador.x, 
                                   proyectil.y - estado.jugador.y);
            if (dist < proyectil.radio + 20) {
                estado.vidas -= proyectil.daño;
                proyectil.activa = false;
                estado.invulnerable = 60;
                crearExplosion(estado.jugador.x, estado.jugador.y, '#ffffff', 10);
                
                if (estado.vidas <= 0) {
                    estado.vidas = 0;
                    gameOver();
                }
                actualizarUI();
            }
        });
        
        // Enemigos vs jugador
        estado.enemigos.forEach(enemigo => {
            if (!enemigo.activa) return;
            
            const dist = Math.hypot(enemigo.x - estado.jugador.x, 
                                   enemigo.y - estado.jugador.y);
            if (dist < enemigo.width/2 + 20) {
                estado.vidas -= 20;
                enemigo.activa = false;
                estado.invulnerable = 60;
                crearExplosion(estado.jugador.x, estado.jugador.y, '#ffffff', 15);
                
                if (estado.vidas <= 0) {
                    estado.vidas = 0;
                    gameOver();
                }
                actualizarUI();
            }
        });
    }
    
    // Power-ups vs jugador
    estado.powerups.forEach(powerup => {
        if (!powerup.activa) return;
        
        const dist = Math.hypot(powerup.x - estado.jugador.x, 
                               powerup.y - estado.jugador.y);
        if (dist < powerup.radio + 20) {
            powerup.activa = false;
            
            if (powerup.tipo === 'vida') {
                estado.vidas = Math.min(100, estado.vidas + 20);
            } else if (powerup.tipo === 'poder') {
                estado.poderDisparo = Math.min(3, estado.poderDisparo + 1);
            } else if (powerup.tipo === 'bomba') {
                estado.bomba++;
            }
            
            crearExplosion(powerup.x, powerup.y, '#ffffff', 10);
            actualizarUI();
        }
    });
}

function gameOver() {
    estado.modo = 'gameover';
    if (estado.puntuacion > estado.record) {
        estado.record = estado.puntuacion;
        localStorage.setItem('galaxyDefendersRecord', estado.record);
    }
}

function actualizarUI() {
    document.getElementById('score').textContent = estado.puntuacion;
    document.getElementById('record').textContent = estado.record;
    document.getElementById('barraVida').style.width = `${estado.vidas}%`;
}

function loop() {
    estado.tiempo++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fondo
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Estrellas
    estado.estrellas.forEach(est => {
        est.y += est.speed;
        if (est.y > canvas.height) {
            est.y = 0;
            est.x = Math.random() * canvas.width;
        }
        ctx.fillStyle = `rgba(255, 255, 255, ${est.speed / 2})`;
        ctx.fillRect(est.x, est.y, est.size, est.size);
    });
    
    if (estado.modo === 'titulo') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 50px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GALAXY', canvas.width/2, canvas.height/2 - 40);
        ctx.fillText('DEFENDERS', canvas.width/2, canvas.height/2 + 20);
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText('Presiona ESPACIO para comenzar', canvas.width/2, canvas.height/2 + 80);
        requestAnimationFrame(loop);
        return;
    }
    
    if (estado.modo === 'gameover') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ff0066';
        ctx.font = 'bold 50px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 20);
        ctx.fillStyle = '#fff';
        ctx.font = '30px Arial';
        ctx.fillText(`Puntos: ${estado.puntuacion}`, canvas.width/2, canvas.height/2 + 30);
        ctx.font = '20px Arial';
        ctx.fillText('Presiona ESPACIO para reiniciar', canvas.width/2, canvas.height/2 + 70);
        requestAnimationFrame(loop);
        return;
    }
    
    // Actualizar nivel
    estado.nivel = Math.floor(estado.puntuacion / 500) + 1;
    
    // Actualizar jugador
    estado.jugador.actualizar();
    
    // Generar enemigos
    generarEnemigos();
    
    // Actualizar entidades
    estado.proyectiles.forEach(p => p.actualizar());
    estado.proyectilesEnemigos.forEach(p => p.actualizar());
    estado.enemigos.forEach(e => e.actualizar());
    estado.powerups.forEach(p => p.actualizar());
    estado.particulas.forEach(p => p.actualizar());
    
    // Detectar colisiones
    detectarColisiones();
    
    // Limpiar entidades inactivas
    estado.proyectiles = estado.proyectiles.filter(p => p.activa);
    estado.proyectilesEnemigos = estado.proyectilesEnemigos.filter(p => p.activa);
    estado.enemigos = estado.enemigos.filter(e => e.activa);
    estado.powerups = estado.powerups.filter(p => p.activa);
    estado.particulas = estado.particulas.filter(p => p.life > 0);
    
    // Invulnerabilidad
    if (estado.invulnerable > 0) estado.invulnerable--;
    
    // Dibujar todo
    estado.powerups.forEach(p => p.dibujar());
    estado.enemigos.forEach(e => e.dibujar());
    estado.proyectiles.forEach(p => p.dibujar());
    estado.proyectilesEnemigos.forEach(p => p.dibujar());
    estado.jugador.dibujar();
    estado.particulas.forEach(p => p.dibujar());
    
    // HUD de bombas
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`💣 x${estado.bomba}`, 20, canvas.height - 20);
    
    requestAnimationFrame(loop);
}

document.getElementById('record').textContent = estado.record;
loop();
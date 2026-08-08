const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ============ ESTADO DEL JUEGO ============
const estado = {
    nivel: 1,
    exp: 0,
    expNecesaria: 100,
    vida: 100,
    vidaMax: 100,
    kills: 0,
    tiempo: 0,
    pausado: false,
    gameOver: false,
    habilidadEspecial: false,
    tiempoHabilidad: 0,
    mejoras: {
        velocidad: 1,
        daño: 1,
        velocidadAtaque: 1,
        rango: 1,
        vidaMax: 100,
        regeneracion: 0
    }
};

// ============ JUGADOR ============
const jugador = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radio: 20,
    velocidad: 4,
    tiempoAtaque: 0,
    intervaloAtaque: 30,
    angulo: 0
};

// ============ ENTIDADES ============
let enemigos = [];
let proyectiles = [];
let particulas = [];
let gemasExp = [];
let estrellasFondo = [];

// Generar estrellas de fondo
for (let i = 0; i < 100; i++) {
    estrellasFondo.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 0.5 + 0.1
    });
}

// ============ MEJORAS DISPONIBLES ============
const mejorasDisponibles = [
    {
        id: 'velocidad',
        titulo: '⚡ Velocidad+',
        descripcion: 'Aumenta tu velocidad de movimiento',
        aplicar: () => estado.mejoras.velocidad += 0.3
    },
    {
        id: 'daño',
        titulo: '💥 Daño+',
        descripcion: 'Tus proyectiles hacen más daño',
        aplicar: () => estado.mejoras.daño += 0.5
    },
    {
        id: 'velocidadAtaque',
        titulo: '🔥 Velocidad de Ataque+',
        descripcion: 'Atacas más rápido',
        aplicar: () => estado.mejoras.velocidadAtaque += 0.2
    },
    {
        id: 'rango',
        titulo: '🎯 Rango+',
        descripcion: 'Tus proyectiles viajan más lejos',
        aplicar: () => estado.mejoras.rango += 0.3
    },
    {
        id: 'vidaMax',
        titulo: '❤️ Vida Máxima+',
        descripcion: 'Aumenta tu vida máxima en 20',
        aplicar: () => {
            estado.mejoras.vidaMax += 20;
            estado.vidaMax += 20;
            estado.vida += 20;
        }
    },
    {
        id: 'regeneracion',
        titulo: '💚 Regeneración+',
        descripcion: 'Recuperas vida con el tiempo',
        aplicar: () => estado.mejoras.regeneracion += 0.1
    }
];

// ============ INPUT ============
const teclas = {};
window.addEventListener('keydown', (e) => {
    teclas[e.key.toLowerCase()] = true;
    
    if (e.key.toLowerCase() === 'p') {
        estado.pausado = !estado.pausado;
    }
    
    if (e.key === ' ' && !estado.habilidadEspecial && estado.tiempoHabilidad <= 0) {
        activarHabilidadEspecial();
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    teclas[e.key.toLowerCase()] = false;
});

// ============ MOVIMIENTO ============
function moverJugador() {
    if (estado.pausado || estado.gameOver) return;
    
    let dx = 0, dy = 0;
    
    if (teclas['w'] || teclas['arrowup']) dy -= 1;
    if (teclas['s'] || teclas['arrowdown']) dy += 1;
    if (teclas['a'] || teclas['arrowleft']) dx -= 1;
    if (teclas['d'] || teclas['arrowright']) dx += 1;
    
    // Normalizar diagonal
    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }
    
    jugador.x += dx * jugador.velocidad * estado.mejoras.velocidad;
    jugador.y += dy * jugador.velocidad * estado.mejoras.velocidad;
    
    // Límites
    jugador.x = Math.max(jugador.radio, Math.min(canvas.width - jugador.radio, jugador.x));
    jugador.y = Math.max(jugador.radio, Math.min(canvas.height - jugador.radio, jugador.y));
    
    // Actualizar ángulo
    if (dx !== 0 || dy !== 0) {
        jugador.angulo = Math.atan2(dy, dx);
    }
}

// ============ ATAQUE AUTOMÁTICO ============
function atacarAutomaticamente() {
    if (estado.pausado || estado.gameOver) return;
    
    jugador.tiempoAtaque++;
    const intervalo = jugador.intervaloAtaque / estado.mejoras.velocidadAtaque;
    
    if (jugador.tiempoAtaque >= intervalo) {
        jugador.tiempoAtaque = 0;
        
        // Encontrar enemigo más cercano
        let enemigoCercano = null;
        let distanciaMinima = Infinity;
        
        enemigos.forEach(enemigo => {
            const dist = Math.hypot(jugador.x - enemigo.x, jugador.y - enemigo.y);
            if (dist < distanciaMinima) {
                distanciaMinima = dist;
                enemigoCercano = enemigo;
            }
        });
        
        if (enemigoCercano) {
            const angulo = Math.atan2(enemigoCercano.y - jugador.y, enemigoCercano.x - jugador.x);
            dispararProyectil(angulo);
        }
    }
}

function dispararProyectil(angulo) {
    const velocidad = 8;
    proyectiles.push({
        x: jugador.x,
        y: jugador.y,
        vx: Math.cos(angulo) * velocidad,
        vy: Math.sin(angulo) * velocidad,
        radio: 6,
        daño: 10 * estado.mejoras.daño,
        distancia: 0,
        distanciaMax: 300 * estado.mejoras.rango
    });
}

function activarHabilidadEspecial() {
    estado.habilidadEspecial = true;
    estado.tiempoHabilidad = 180; // 3 segundos a 60fps
    
    // Disparar en todas direcciones
    for (let i = 0; i < 16; i++) {
        const angulo = (i / 16) * Math.PI * 2;
        dispararProyectil(angulo);
    }
    
    crearExplosion(jugador.x, jugador.y, '#ffff00', 30);
}

// ============ ENEMIGOS ============
function generarEnemigos() {
    if (estado.pausado || estado.gameOver) return;
    
    // Aumentar dificultad con el tiempo
    const dificultad = Math.floor(estado.tiempo / 600) + 1; // Cada 10 segundos
    
    if (Math.random() < 0.02 * dificultad && enemigos.length < 50) {
        const lado = Math.floor(Math.random() * 4);
        let x, y;
        
        switch (lado) {
            case 0: x = Math.random() * canvas.width; y = -30; break;
            case 1: x = canvas.width + 30; y = Math.random() * canvas.height; break;
            case 2: x = Math.random() * canvas.width; y = canvas.height + 30; break;
            case 3: x = -30; y = Math.random() * canvas.height; break;
        }
        
        const tipo = Math.random();
        let enemigo;
        
        if (tipo < 0.6) {
            // Enemigo básico
            enemigo = {
                x, y,
                radio: 15,
                velocidad: 1.5 + Math.random() * 0.5,
                vida: 20,
                vidaMax: 20,
                daño: 5,
                color: '#ff0066',
                exp: 10
            };
        } else if (tipo < 0.9) {
            // Enemigo rápido
            enemigo = {
                x, y,
                radio: 12,
                velocidad: 2.5 + Math.random() * 0.5,
                vida: 15,
                vidaMax: 15,
                daño: 3,
                color: '#00ff66',
                exp: 15
            };
        } else {
            // Enemigo tanque
            enemigo = {
                x, y,
                radio: 25,
                velocidad: 1,
                vida: 50,
                vidaMax: 50,
                daño: 10,
                color: '#ff6600',
                exp: 25
            };
        }
        
        enemigos.push(enemigo);
    }
}

function moverEnemigos() {
    if (estado.pausado || estado.gameOver) return;
    
    enemigos.forEach(enemigo => {
        const angulo = Math.atan2(jugador.y - enemigo.y, jugador.x - enemigo.x);
        enemigo.x += Math.cos(angulo) * enemigo.velocidad;
        enemigo.y += Math.sin(angulo) * enemigo.velocidad;
        
        // Colisión con jugador
        const dist = Math.hypot(jugador.x - enemigo.x, jugador.y - enemigo.y);
        if (dist < jugador.radio + enemigo.radio) {
            estado.vida -= enemigo.daño * 0.05;
            
            if (estado.vida <= 0) {
                estado.vida = 0;
                estado.gameOver = true;
                mostrarGameOver();
            }
        }
    });
}

// ============ PROYECTILES ============
function moverProyectiles() {
    if (estado.pausado || estado.gameOver) return;
    
    proyectiles = proyectiles.filter(proyectil => {
        proyectil.x += proyectil.vx;
        proyectil.y += proyectil.vy;
        proyectil.distancia += Math.hypot(proyectil.vx, proyectil.vy);
        
        // Eliminar si sale del rango
        if (proyectil.distancia > proyectil.distanciaMax) return false;
        
        // Colisión con enemigos
        for (let i = enemigos.length - 1; i >= 0; i--) {
            const enemigo = enemigos[i];
            const dist = Math.hypot(proyectil.x - enemigo.x, proyectil.y - enemigo.y);
            
            if (dist < proyectil.radio + enemigo.radio) {
                enemigo.vida -= proyectil.daño;
                crearExplosion(proyectil.x, proyectil.y, '#00ffff', 5);
                
                if (enemigo.vida <= 0) {
                    // Enemigo muerto
                    estado.kills++;
                    crearExplosion(enemigo.x, enemigo.y, enemigo.color, 15);
                    
                    // Soltar gema de experiencia
                    gemasExp.push({
                        x: enemigo.x,
                        y: enemigo.y,
                        exp: enemigo.exp,
                        radio: 8,
                        tiempo: 0
                    });
                    
                    enemigos.splice(i, 1);
                }
                
                return false;
            }
        }
        
        return true;
    });
}

// ============ GEMAS DE EXPERIENCIA ============
function moverGemas() {
    if (estado.pausado || estado.gameOver) return;
    
    gemasExp = gemasExp.filter(gema => {
        gema.tiempo++;
        
        // Atraer hacia el jugador si está cerca
        const dist = Math.hypot(jugador.x - gema.x, jugador.y - gema.y);
        
        if (dist < 100) {
            const angulo = Math.atan2(jugador.y - gema.y, jugador.x - gema.x);
            gema.x += Math.cos(angulo) * 5;
            gema.y += Math.sin(angulo) * 5;
        }
        
        // Recoger
        if (dist < jugador.radio + gema.radio) {
            estado.exp += gema.exp;
            
            // Subir de nivel
            while (estado.exp >= estado.expNecesaria) {
                estado.exp -= estado.expNecesaria;
                estado.nivel++;
                estado.expNecesaria = Math.floor(estado.expNecesaria * 1.5);
                mostrarModalSubida();
            }
            
            return false;
        }
        
        return true;
    });
}

// ============ PARTÍCULAS ============
function crearExplosion(x, y, color, cantidad) {
    for (let i = 0; i < cantidad; i++) {
        particulas.push({
            x, y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            color,
            life: 1,
            size: Math.random() * 4 + 2
        });
    }
}

function actualizarParticulas() {
    particulas = particulas.filter(p => p.life > 0);
    particulas.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.life -= 0.03;
    });
}

// ============ REGENERACIÓN ============
function regenerarVida() {
    if (estado.pausado || estado.gameOver) return;
    
    if (estado.mejoras.regeneracion > 0 && estado.vida < estado.vidaMax) {
        estado.vida = Math.min(estado.vidaMax, estado.vida + estado.mejoras.regeneracion * 0.016);
    }
}

// ============ DIBUJO ============
function dibujar() {
    // Fondo
    ctx.fillStyle = '#000020';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Estrellas
    estrellasFondo.forEach(estrella => {
        estrella.y += estrella.speed;
        if (estrella.y > canvas.height) {
            estrella.y = 0;
            estrella.x = Math.random() * canvas.width;
        }
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(estado.tiempo * 0.01 + estrella.x) * 0.2})`;
        ctx.fillRect(estrella.x, estrella.y, estrella.size, estrella.size);
    });
    
    // Gemas de experiencia
    gemasExp.forEach(gema => {
        const brillo = Math.sin(gema.tiempo * 0.1) * 3;
        ctx.fillStyle = '#00ff00';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ff00';
        ctx.beginPath();
        ctx.arc(gema.x, gema.y, gema.radio + brillo, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });
    
    // Enemigos
    enemigos.forEach(enemigo => {
        ctx.fillStyle = enemigo.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = enemigo.color;
        ctx.beginPath();
        ctx.arc(enemigo.x, enemigo.y, enemigo.radio, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Barra de vida
        const anchoBarra = enemigo.radio * 2;
        const vidaRatio = enemigo.vida / enemigo.vidaMax;
        ctx.fillStyle = '#333';
        ctx.fillRect(enemigo.x - anchoBarra/2, enemigo.y - enemigo.radio - 10, anchoBarra, 3);
        ctx.fillStyle = vidaRatio > 0.5 ? '#00ff00' : vidaRatio > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(enemigo.x - anchoBarra/2, enemigo.y - enemigo.radio - 10, anchoBarra * vidaRatio, 3);
    });
    
    // Proyectiles
    proyectiles.forEach(proyectil => {
        ctx.fillStyle = '#00ffff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffff';
        ctx.beginPath();
        ctx.arc(proyectil.x, proyectil.y, proyectil.radio, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });
    
    // Jugador
    dibujarJugador();
    
    // Partículas
    particulas.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1;
    
    // Indicador de habilidad especial
    if (estado.tiempoHabilidad > 0) {
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('¡HABILIDAD ACTIVA!', canvas.width / 2, 50);
    } else {
        ctx.fillStyle = '#888';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ESPACIO: Habilidad especial', canvas.width / 2, 50);
    }
    
    // Pausa
    if (estado.pausado) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 50px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSA', canvas.width / 2, canvas.height / 2);
    }
}

function dibujarJugador() {
    // Efecto de habilidad especial
    if (estado.habilidadEspecial) {
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(jugador.x, jugador.y, jugador.radio + 10, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Cuerpo
    ctx.fillStyle = '#00ffff';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00ffff';
    ctx.beginPath();
    ctx.arc(jugador.x, jugador.y, jugador.radio, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Dirección
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(jugador.x, jugador.y);
    ctx.lineTo(
        jugador.x + Math.cos(jugador.angulo) * jugador.radio,
        jugador.y + Math.sin(jugador.angulo) * jugador.radio
    );
    ctx.stroke();
}

// ============ UI ============
function actualizarUI() {
    document.getElementById('nivel').textContent = estado.nivel;
    
    const minutos = Math.floor(estado.tiempo / 3600);
    const segundos = Math.floor((estado.tiempo % 3600) / 60);
    document.getElementById('tiempo').textContent = `${minutos}:${segundos.toString().padStart(2, '0')}`;
    
    document.getElementById('barraExp').style.width = `${(estado.exp / estado.expNecesaria) * 100}%`;
    document.getElementById('expTexto').textContent = `${Math.floor(estado.exp)}/${estado.expNecesaria}`;
    
    document.getElementById('barraVida').style.width = `${(estado.vida / estado.vidaMax) * 100}%`;
    document.getElementById('vidaTexto').textContent = `${Math.floor(estado.vida)}/${estado.vidaMax}`;
    
    document.getElementById('kills').textContent = estado.kills;
}

// ============ MODALES ============
function mostrarModalSubida() {
    estado.pausado = true;
    document.getElementById('modalSubida').classList.remove('oculto');
    
    const opcionesDiv = document.getElementById('opcionesMejora');
    opcionesDiv.innerHTML = '';
    
    // Seleccionar 3 mejoras aleatorias
    const disponibles = [...mejorasDisponibles].sort(() => Math.random() - 0.5).slice(0, 3);
    
    disponibles.forEach(mejora => {
        const div = document.createElement('div');
        div.className = 'opcion-mejora';
        div.innerHTML = `
            <div class="opcion-titulo">${mejora.titulo}</div>
            <div class="opcion-descripcion">${mejora.descripcion}</div>
        `;
        div.onclick = () => {
            mejora.aplicar();
            document.getElementById('modalSubida').classList.add('oculto');
            estado.pausado = false;
        };
        opcionesDiv.appendChild(div);
    });
}

function mostrarGameOver() {
    document.getElementById('modalGameOver').classList.remove('oculto');
    
    const minutos = Math.floor(estado.tiempo / 3600);
    const segundos = Math.floor((estado.tiempo % 3600) / 60);
    
    document.getElementById('estadisticas').innerHTML = `
        <p>⏱️ Tiempo: ${minutos}:${segundos.toString().padStart(2, '0')}</p>
        <p>💀 Enemigos eliminados: ${estado.kills}</p>
        <p>⬆️ Nivel alcanzado: ${estado.nivel}</p>
    `;
}

document.getElementById('btnReiniciar').onclick = () => {
    location.reload();
};

// ============ LOOP PRINCIPAL ============
function loop() {
    if (!estado.pausado && !estado.gameOver) {
        estado.tiempo++;
        
        moverJugador();
        atacarAutomaticamente();
        generarEnemigos();
        moverEnemigos();
        moverProyectiles();
        moverGemas();
        actualizarParticulas();
        regenerarVida();
        
        if (estado.habilidadEspecial) {
            estado.tiempoHabilidad--;
            if (estado.tiempoHabilidad <= 0) {
                estado.habilidadEspecial = false;
            }
        }
    }
    
    dibujar();
    actualizarUI();
    
    requestAnimationFrame(loop);
}

// ============ INICIO ============
loop();
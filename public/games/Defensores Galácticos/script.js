const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ============ ESTADO DEL JUEGO ============
const estado = {
    oleada: 1,
    creditos: 200,
    vidaBase: 20,
    vidaBaseMax: 20,
    enemigosRestantes: 0,
    oleadaActiva: false,
    gameOver: false,
    victoria: false,
    torreSeleccionada: null,
    torres: [],
    enemigos: [],
    proyectiles: [],
    particulas: [],
    tiempo: 0
};

// ============ MAPA Y CAMINO ============
const TAM_CELDA = 40;
const COLUMNAS = 20;
const FILAS = 15;

// Camino definido (coordenadas de celdas)
const camino = [
    {x: 0, y: 7}, {x: 1, y: 7}, {x: 2, y: 7}, {x: 3, y: 7}, {x: 4, y: 7},
    {x: 4, y: 6}, {x: 4, y: 5}, {x: 4, y: 4}, {x: 4, y: 3},
    {x: 5, y: 3}, {x: 6, y: 3}, {x: 7, y: 3}, {x: 8, y: 3},
    {x: 8, y: 4}, {x: 8, y: 5}, {x: 8, y: 6}, {x: 8, y: 7}, {x: 8, y: 8}, {x: 8, y: 9}, {x: 8, y: 10},
    {x: 9, y: 10}, {x: 10, y: 10}, {x: 11, y: 10}, {x: 12, y: 10},
    {x: 12, y: 9}, {x: 12, y: 8}, {x: 12, y: 7}, {x: 12, y: 6}, {x: 12, y: 5},
    {x: 13, y: 5}, {x: 14, y: 5}, {x: 15, y: 5}, {x: 16, y: 5},
    {x: 16, y: 6}, {x: 16, y: 7}, {x: 16, y: 8}, {x: 16, y: 9}, {x: 16, y: 10}, {x: 16, y: 11},
    {x: 17, y: 11}, {x: 18, y: 11}, {x: 19, y: 11}
];

// ============ TIPOS DE TORRES ============
const tiposTorre = {
    basica: {
        nombre: 'Láser Básico',
        coste: 50,
        daño: 10,
        alcance: 120,
        velocidadAtaque: 30,
        color: '#00ffff',
        emoji: '🔫'
    },
    cañon: {
        nombre: 'Cañón',
        coste: 100,
        daño: 30,
        alcance: 100,
        velocidadAtaque: 60,
        color: '#ff6600',
        emoji: '💣',
        area: 50
    },
    hielo: {
        nombre: 'Criogénica',
        coste: 75,
        daño: 5,
        alcance: 100,
        velocidadAtaque: 40,
        color: '#88ffff',
        emoji: '❄️',
        ralentizar: 0.5
    },
    electrico: {
        nombre: 'Tesla',
        coste: 150,
        daño: 15,
        alcance: 130,
        velocidadAtaque: 45,
        color: '#ffff00',
        emoji: '⚡',
        cadena: 3
    }
};

// ============ CLASE TORRE ============
class Torre {
    constructor(x, y, tipo) {
        this.x = x;
        this.y = y;
        this.tipo = tipo;
        this.nivel = 1;
        this.tiempoAtaque = 0;
        
        const datos = tiposTorre[tipo];
        this.daño = datos.daño;
        this.alcance = datos.alcance;
        this.velocidadAtaque = datos.velocidadAtaque;
        this.color = datos.color;
        this.emoji = datos.emoji;
        this.area = datos.area || 0;
        this.ralentizar = datos.ralentizar || 0;
        this.cadena = datos.cadena || 0;
    }
    
    actualizar() {
        this.tiempoAtaque++;
        
        if (this.tiempoAtaque >= this.velocidadAtaque) {
            const enemigo = this.buscarEnemigo();
            if (enemigo) {
                this.atacar(enemigo);
                this.tiempoAtaque = 0;
            }
        }
    }
    
    buscarEnemigo() {
        let enemigoCercano = null;
        let distanciaMinima = this.alcance;
        
        estado.enemigos.forEach(enemigo => {
            const dist = Math.hypot(this.x - enemigo.x, this.y - enemigo.y);
            if (dist < distanciaMinima) {
                distanciaMinima = dist;
                enemigoCercano = enemigo;
            }
        });
        
        return enemigoCercano;
    }
    
    atacar(enemigo) {
        // Crear proyectil
        estado.proyectiles.push({
            x: this.x,
            y: this.y,
            objetivo: enemigo,
            daño: this.daño,
            velocidad: 8,
            color: this.color,
            area: this.area,
            ralentizar: this.ralentizar,
            cadena: this.cadena,
            torres: [this]
        });
    }
    
    dibujar() {
        // Base
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - 15, this.y - 15, 30, 30);
        
        // Torre
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Emoji
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, this.x, this.y);
        
        // Nivel
        if (this.nivel > 1) {
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 10px Arial';
            ctx.fillText(`Nv${this.nivel}`, this.x, this.y - 20);
        }
    }
    
    mejorar() {
        const coste = 50 * this.nivel;
        if (estado.creditos >= coste) {
            estado.creditos -= coste;
            this.nivel++;
            this.daño *= 1.5;
            this.alcance *= 1.1;
            this.velocidadAtaque *= 0.9;
            return true;
        }
        return false;
    }
}

// ============ CLASE ENEMIGO ============
class Enemigo {
    constructor(tipo, oleada) {
        this.tipo = tipo;
        this.indiceCamino = 0;
        this.x = camino[0].x * TAM_CELDA + TAM_CELDA / 2;
        this.y = camino[0].y * TAM_CELDA + TAM_CELDA / 2;
        
        const multiplicador = 1 + (oleada - 1) * 0.3;
        
        if (tipo === 'basico') {
            this.vida = 30 * multiplicador;
            this.vidaMax = this.vida;
            this.velocidad = 1.5;
            this.recompensa = 10;
            this.color = '#ff0066';
            this.radio = 12;
        } else if (tipo === 'rapido') {
            this.vida = 20 * multiplicador;
            this.vidaMax = this.vida;
            this.velocidad = 2.5;
            this.recompensa = 15;
            this.color = '#00ff66';
            this.radio = 10;
        } else if (tipo === 'tanque') {
            this.vida = 80 * multiplicador;
            this.vidaMax = this.vida;
            this.velocidad = 1;
            this.recompensa = 25;
            this.color = '#ff6600';
            this.radio = 18;
        }
        
        this.velocidadBase = this.velocidad;
        this.tiempoRalentizado = 0;
    }
    
    actualizar() {
        if (this.tiempoRalentizado > 0) {
            this.tiempoRalentizado--;
            this.velocidad = this.velocidadBase * 0.5;
        } else {
            this.velocidad = this.velocidadBase;
        }
        
        if (this.indiceCamino < camino.length - 1) {
            const objetivo = camino[this.indiceCamino + 1];
            const objetivoX = objetivo.x * TAM_CELDA + TAM_CELDA / 2;
            const objetivoY = objetivo.y * TAM_CELDA + TAM_CELDA / 2;
            
            const angulo = Math.atan2(objetivoY - this.y, objetivoX - this.x);
            this.x += Math.cos(angulo) * this.velocidad;
            this.y += Math.sin(angulo) * this.velocidad;
            
            const dist = Math.hypot(objetivoX - this.x, objetivoY - this.y);
            if (dist < 5) {
                this.indiceCamino++;
            }
        } else {
            // Llegó a la base
            estado.vidaBase -= 1;
            this.eliminar();
            
            if (estado.vidaBase <= 0) {
                estado.gameOver = true;
                mostrarGameOver();
            }
        }
    }
    
    eliminar() {
        const index = estado.enemigos.indexOf(this);
        if (index > -1) {
            estado.enemigos.splice(index, 1);
        }
    }
    
    dibujar() {
        // Cuerpo
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radio, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Ojos
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x - 4, this.y - 2, 3, 0, Math.PI * 2);
        ctx.arc(this.x + 4, this.y - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Barra de vida
        const anchoBarra = this.radio * 2;
        const vidaRatio = this.vida / this.vidaMax;
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - anchoBarra/2, this.y - this.radio - 8, anchoBarra, 3);
        ctx.fillStyle = vidaRatio > 0.5 ? '#00ff00' : vidaRatio > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(this.x - anchoBarra/2, this.y - this.radio - 8, anchoBarra * vidaRatio, 3);
    }
}

// ============ PROYECTILES ============
function actualizarProyectiles() {
    estado.proyectiles = estado.proyectiles.filter(proyectil => {
        if (!proyectil.objetivo || !estado.enemigos.includes(proyectil.objetivo)) {
            return false;
        }
        
        const angulo = Math.atan2(proyectil.objetivo.y - proyectil.y, proyectil.objetivo.x - proyectil.x);
        proyectil.x += Math.cos(angulo) * proyectil.velocidad;
        proyectil.y += Math.sin(angulo) * proyectil.velocidad;
        
        const dist = Math.hypot(proyectil.objetivo.x - proyectil.x, proyectil.objetivo.y - proyectil.y);
        
        if (dist < 10) {
            // Impacto
            if (proyectil.area > 0) {
                // Daño en área
                estado.enemigos.forEach(enemigo => {
                    const distArea = Math.hypot(proyectil.x - enemigo.x, proyectil.y - enemigo.y);
                    if (distArea < proyectil.area) {
                        enemigo.vida -= proyectil.daño;
                    }
                });
                crearExplosion(proyectil.x, proyectil.y, proyectil.color, 20);
            } else {
                proyectil.objetivo.vida -= proyectil.daño;
            }
            
            if (proyectil.ralentizar > 0) {
                proyectil.objetivo.tiempoRalentizado = 60;
            }
            
            if (proyectil.cadena > 0) {
                // Daño en cadena
                let enemigosCercanos = estado.enemigos
                    .filter(e => e !== proyectil.objetivo)
                    .map(e => ({
                        enemigo: e,
                        dist: Math.hypot(proyectil.x - e.x, proyectil.y - e.y)
                    }))
                    .filter(e => e.dist < 100)
                    .sort((a, b) => a.dist - b.dist)
                    .slice(0, proyectil.cadena);
                
                enemigosCercanos.forEach(ec => {
                    ec.enemigo.vida -= proyectil.daño * 0.7;
                    crearExplosion(ec.enemigo.x, ec.enemigo.y, proyectil.color, 5);
                });
            }
            
            crearExplosion(proyectil.x, proyectil.y, proyectil.color, 5);
            return false;
        }
        
        return true;
    });
}

// ============ PARTÍCULAS ============
function crearExplosion(x, y, color, cantidad) {
    for (let i = 0; i < cantidad; i++) {
        estado.particulas.push({
            x, y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            color,
            life: 1,
            size: Math.random() * 4 + 2
        });
    }
}

function actualizarParticulas() {
    estado.particulas = estado.particulas.filter(p => p.life > 0);
    estado.particulas.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.life -= 0.03;
    });
}

// ============ OLEADAS ============
function iniciarOleada() {
    if (estado.oleadaActiva) return;
    
    estado.oleadaActiva = true;
    document.getElementById('btnOleada').disabled = true;
    
    const numEnemigos = 5 + estado.oleada * 3;
    estado.enemigosRestantes = numEnemigos;
    
    let enemigosCreados = 0;
    const intervalo = setInterval(() => {
        if (enemigosCreados >= numEnemigos || estado.gameOver) {
            clearInterval(intervalo);
            return;
        }
        
        const tipo = Math.random();
        let enemigo;
        
        if (tipo < 0.6) {
            enemigo = new Enemigo('basico', estado.oleada);
        } else if (tipo < 0.85) {
            enemigo = new Enemigo('rapido', estado.oleada);
        } else {
            enemigo = new Enemigo('tanque', estado.oleada);
        }
        
        estado.enemigos.push(enemigo);
        enemigosCreados++;
    }, 1000);
}

function verificarFinOleada() {
    if (estado.oleadaActiva && estado.enemigos.length === 0 && estado.enemigosRestantes === 0) {
        estado.oleadaActiva = false;
        estado.oleada++;
        estado.creditos += 50; // Bonus por oleada
        
        if (estado.oleada > 10) {
            estado.victoria = true;
            mostrarVictoria();
        } else {
            document.getElementById('btnOleada').disabled = false;
        }
    }
}

// ============ DIBUJO ============
function dibujar() {
    // Fondo
    ctx.fillStyle = '#1a1a3e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += TAM_CELDA) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += TAM_CELDA) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Camino
    ctx.fillStyle = '#2a2a4e';
    camino.forEach(celda => {
        ctx.fillRect(celda.x * TAM_CELDA, celda.y * TAM_CELDA, TAM_CELDA, TAM_CELDA);
    });
    
    // Base (final del camino)
    const base = camino[camino.length - 1];
    ctx.fillStyle = '#ff0066';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff0066';
    ctx.fillRect(base.x * TAM_CELDA, base.y * TAM_CELDA, TAM_CELDA, TAM_CELDA);
    ctx.shadowBlur = 0;
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏠', base.x * TAM_CELDA + TAM_CELDA/2, base.y * TAM_CELDA + TAM_CELDA/2);
    
    // Torres
    estado.torres.forEach(torre => torre.dibujar());
    
    // Enemigos
    estado.enemigos.forEach(enemigo => enemigo.dibujar());
    
    // Proyectiles
    estado.proyectiles.forEach(proyectil => {
        ctx.fillStyle = proyectil.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = proyectil.color;
        ctx.beginPath();
        ctx.arc(proyectil.x, proyectil.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });
    
    // Partículas
    estado.particulas.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1;
    
    // Preview de torre
    if (estado.torreSeleccionada && estado.mouseX !== undefined) {
        const celdaX = Math.floor(estado.mouseX / TAM_CELDA);
        const celdaY = Math.floor(estado.mouseY / TAM_CELDA);
        const centroX = celdaX * TAM_CELDA + TAM_CELDA / 2;
        const centroY = celdaY * TAM_CELDA + TAM_CELDA / 2;
        
        const puedeColocar = puedeColocarTorre(celdaX, celdaY);
        
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = puedeColocar ? '#00ff00' : '#ff0000';
        ctx.fillRect(celdaX * TAM_CELDA, celdaY * TAM_CELDA, TAM_CELDA, TAM_CELDA);
        
        if (puedeColocar) {
            const datos = tiposTorre[estado.torreSeleccionada];
            ctx.strokeStyle = datos.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centroX, centroY, datos.alcance, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }
}

function puedeColocarTorre(celdaX, celdaY) {
    // Verificar que no esté en el camino
    const enCamino = camino.some(c => c.x === celdaX && c.y === celdaY);
    if (enCamino) return false;
    
    // Verificar que no haya otra torre
    const centroX = celdaX * TAM_CELDA + TAM_CELDA / 2;
    const centroY = celdaY * TAM_CELDA + TAM_CELDA / 2;
    const torreExistente = estado.torres.some(t => 
        Math.abs(t.x - centroX) < TAM_CELDA && Math.abs(t.y - centroY) < TAM_CELDA
    );
    if (torreExistente) return false;
    
    return true;
}

// ============ INPUT ============
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    estado.mouseX = e.clientX - rect.left;
    estado.mouseY = e.clientY - rect.top;
});

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const celdaX = Math.floor(x / TAM_CELDA);
    const celdaY = Math.floor(y / TAM_CELDA);
    const centroX = celdaX * TAM_CELDA + TAM_CELDA / 2;
    const centroY = celdaY * TAM_CELDA + TAM_CELDA / 2;
    
    // Verificar si hay una torre existente
    const torreExistente = estado.torres.find(t => 
        Math.abs(t.x - centroX) < TAM_CELDA && Math.abs(t.y - centroY) < TAM_CELDA
    );
    
    if (torreExistente) {
        // Mejorar torre
        if (torreExistente.mejorar()) {
            crearExplosion(torreExistente.x, torreExistente.y, '#ffd700', 15);
            actualizarUI();
        }
        return;
    }
    
    // Colocar nueva torre
    if (estado.torreSeleccionada && puedeColocarTorre(celdaX, celdaY)) {
        const datos = tiposTorre[estado.torreSeleccionada];
        if (estado.creditos >= datos.coste) {
            estado.creditos -= datos.coste;
            const torre = new Torre(centroX, centroY, estado.torreSeleccionada);
            estado.torres.push(torre);
            crearExplosion(centroX, centroY, datos.color, 10);
            actualizarUI();
        }
    }
});

// Selección de torres
document.querySelectorAll('.torre-card').forEach(card => {
    card.addEventListener('click', () => {
        const tipo = card.dataset.torre;
        const datos = tiposTorre[tipo];
        
        if (estado.creditos >= datos.coste) {
            document.querySelectorAll('.torre-card').forEach(c => c.classList.remove('seleccionada'));
            card.classList.add('seleccionada');
            estado.torreSeleccionada = tipo;
        }
    });
});

// Botón de oleada
document.getElementById('btnOleada').addEventListener('click', iniciarOleada);

// Teclas
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        estado.torreSeleccionada = null;
        document.querySelectorAll('.torre-card').forEach(c => c.classList.remove('seleccionada'));
    }
    if (e.key === ' ' && !estado.oleadaActiva) {
        iniciarOleada();
        e.preventDefault();
    }
});

// ============ UI ============
function actualizarUI() {
    document.getElementById('oleada').textContent = estado.oleada;
    document.getElementById('creditos').textContent = estado.creditos;
    document.getElementById('barraVida').style.width = `${(estado.vidaBase / estado.vidaBaseMax) * 100}%`;
    document.getElementById('vidaTexto').textContent = `${estado.vidaBase}/${estado.vidaBaseMax}`;
    document.getElementById('enemigosRestantes').textContent = estado.enemigos.length;
    
    // Actualizar disponibilidad de torres
    document.querySelectorAll('.torre-card').forEach(card => {
        const tipo = card.dataset.torre;
        const datos = tiposTorre[tipo];
        if (estado.creditos < datos.coste) {
            card.classList.add('deshabilitada');
        } else {
            card.classList.remove('deshabilitada');
        }
    });
}

// ============ MODALES ============
function mostrarGameOver() {
    document.getElementById('modalGameOver').classList.remove('oculto');
    document.getElementById('estadisticas').innerHTML = `
        <p>🌊 Oleadas completadas: ${estado.oleada - 1}</p>
        <p>🏗️ Torres construidas: ${estado.torres.length}</p>
    `;
}

function mostrarVictoria() {
    document.getElementById('modalVictoria').classList.remove('oculto');
    document.getElementById('estadisticasVictoria').innerHTML = `
        <p>🌊 Oleadas completadas: ${estado.oleada - 1}</p>
        <p>🏗️ Torres construidas: ${estado.torres.length}</p>
        <p>💰 Créditos restantes: ${estado.creditos}</p>
    `;
}

document.getElementById('btnReiniciar').onclick = () => location.reload();
document.getElementById('btnReiniciarVictoria').onclick = () => location.reload();

// ============ LOOP PRINCIPAL ============
function loop() {
    if (!estado.gameOver && !estado.victoria) {
        estado.tiempo++;
        
        estado.torres.forEach(torre => torre.actualizar());
        estado.enemigos.forEach(enemigo => enemigo.actualizar());
        actualizarProyectiles();
        actualizarParticulas();
        
        // Eliminar enemigos muertos
        estado.enemigos = estado.enemigos.filter(enemigo => {
            if (enemigo.vida <= 0) {
                estado.creditos += enemigo.recompensa;
                crearExplosion(enemigo.x, enemigo.y, enemigo.color, 15);
                estado.enemigosRestantes--;
                return false;
            }
            return true;
        });
        
        verificarFinOleada();
    }
    
    dibujar();
    actualizarUI();
    
    requestAnimationFrame(loop);
}

// ============ INICIO ============
loop();
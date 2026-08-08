const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ============ ESTADO DEL JUEGO ============
const estado = {
    vida: 100,
    vidaMax: 100,
    oro: 0,
    cristales: 0,
    totalCristales: 3,
    inventario: [],
    misiones: [],
    zonaActual: 'claro',
    zonasVisitadas: ['claro'],
    dialogoActivo: false,
    inventarioAbierto: false,
    mapaAbierto: false,
    gameOver: false,
    victoria: false
};

// ============ ZONAS DEL BOSQUE ============
const zonas = {
    claro: {
        nombre: 'Claro Inicial',
        icono: '🌳',
        color: '#2d5a2d',
        conexiones: { norte: 'bosque', este: 'rio' },
        objetos: [],
        npcs: ['anciano'],
        enemigos: [],
        mensaje: 'Un claro tranquilo en el corazón del bosque. La luz del sol se filtra entre los árboles.'
    },
    bosque: {
        nombre: 'Bosque Oscuro',
        icono: '🌲',
        color: '#1a3a1a',
        conexiones: { sur: 'claro', este: 'cueva' },
        objetos: ['pocion'],
        npcs: [],
        enemigos: ['lobo', 'lobo'],
        mensaje: 'Árboles retorcidos bloquean la luz. Escuchas aullidos en la distancia.'
    },
    rio: {
        nombre: 'Río Cristalino',
        icono: '🌊',
        color: '#2d4a6a',
        conexiones: { oeste: 'claro', norte: 'ruinas' },
        objetos: ['llave'],
        npcs: ['hada'],
        enemigos: ['slime'],
        mensaje: 'Un río de aguas claras serpentea entre las rocas. Algo brilla bajo el agua.'
    },
    cueva: {
        nombre: 'Cueva del Goblin',
        icono: '🕳️',
        color: '#3a2a1a',
        conexiones: { oeste: 'bosque' },
        objetos: [],
        npcs: [],
        enemigos: ['goblin', 'goblin', 'jefe_goblin'],
        cristal: true,
        requiereLlave: true,
        mensaje: 'Una cueva oscura y húmeda. Huele a goblin.'
    },
    ruinas: {
        nombre: 'Ruinas Antiguas',
        icono: '🏛️',
        color: '#4a3a4a',
        conexiones: { sur: 'rio' },
        objetos: [],
        npcs: ['espiritu'],
        enemigos: ['esqueleto', 'esqueleto'],
        cristal: true,
        mensaje: 'Restos de una civilización olvidada. Energías místicas flotan en el aire.'
    },
    torre: {
        nombre: 'Torre del Mago',
        icono: '🗼',
        color: '#2a2a4a',
        conexiones: {},
        objetos: [],
        npcs: ['mago'],
        enemigos: ['dragon'],
        cristal: true,
        bloqueada: true,
        mensaje: 'La torre del mago oscuro. Aquí reside el cristal final.'
    }
};

// ============ NPCs ============
const npcsData = {
    anciano: {
        nombre: 'Anciano Sabio',
        emoji: '👴',
        color: '#d4a574',
        x: 400, y: 250,
        dialogos: {
            inicial: {
                texto: '¡Aventurero! El bosque está en peligro. Tres cristales mágicos han sido robados por criaturas oscuras. Sin ellos, el bosque morirá.',
                opciones: [
                    { texto: '¿Dónde están los cristales?', accion: 'info_cristales' },
                    { texto: 'Yo los recuperaré.', accion: 'aceptar_mision' },
                    { texto: 'Adiós.', accion: 'cerrar' }
                ]
            },
            info_cristales: {
                texto: 'Uno está en la Cueva del Goblin al este del bosque oscuro. Otro en las Ruinas Antiguas al norte del río. El último... en la Torre del Mago, pero necesitas los otros dos primero.',
                opciones: [
                    { texto: 'Entendido.', accion: 'volver_inicial' },
                    { texto: 'Adiós.', accion: 'cerrar' }
                ]
            },
            aceptado: {
                texto: 'Ve con cuidado, joven héroe. El bosque es peligroso. Habla con el Hada del Río para obtener ayuda.',
                opciones: [
                    { texto: 'Gracias, anciano.', accion: 'cerrar' }
                ]
            }
        }
    },
    hada: {
        nombre: 'Hada del Río',
        emoji: '🧚',
        color: '#87ceeb',
        x: 400, y: 250,
        dialogos: {
            inicial: {
                texto: '¡Oh, un humano! Soy Lira, el hada de este río. Puedo sentir la pureza en tu corazón.',
                opciones: [
                    { texto: 'Necesito ayuda.', accion: 'ayuda' },
                    { texto: '¿Has visto un cristal?', accion: 'cristal' },
                    { texto: 'Adiós.', accion: 'cerrar' }
                ]
            },
            ayuda: {
                texto: 'Te daré esta poción mágica. Te curará cuando estés herido. Úsala sabiamente.',
                opciones: [
                    { texto: '¡Gracias!', accion: 'dar_pocion' }
                ]
            },
            cristal: {
                texto: 'Sí... lo siento en las profundidades del río, pero está protegido por un espíritu. Debes demostrar tu valor.',
                opciones: [
                    { texto: 'Entendido.', accion: 'volver_inicial' }
                ]
            }
        }
    },
    espiritu: {
        nombre: 'Espíritu Ancestral',
        emoji: '👻',
        color: '#b0b0ff',
        x: 400, y: 250,
        dialogos: {
            inicial: {
                texto: 'Mortal... has llegado a las ruinas de mi antiguo hogar. El cristal que buscas está aquí, pero primero debes derrotar a mis guardianes esqueletos.',
                opciones: [
                    { texto: 'Los derrotaré.', accion: 'activar_guardianes' },
                    { texto: 'No estoy listo.', accion: 'cerrar' }
                ]
            },
            completado: {
                texto: 'Has demostrado tu valor. Toma el cristal de las ruinas. Que te guíe en tu camino.',
                opciones: [
                    { texto: '¡Gracias, espíritu!', accion: 'dar_cristal_ruinas' }
                ]
            }
        }
    },
    mago: {
        nombre: 'Mago Oscuro',
        emoji: '🧙',
        color: '#4a2a6a',
        x: 400, y: 250,
        dialogos: {
            inicial: {
                texto: '¡Insolente! ¿Cómo te atreves a entrar en mi torre? ¡El cristal final es mío! ¡Prepárate para enfrentarte a mi dragón!',
                opciones: [
                    { texto: '¡No me asustas!', accion: 'luchar_dragon' },
                    { texto: 'Esperaré.', accion: 'cerrar' }
                ]
            }
        }
    }
};

// ============ ENEMIGOS ============
const enemigosData = {
    lobo: { nombre: 'Lobo', emoji: '🐺', vida: 30, ataque: 8, oro: 10, color: '#666' },
    slime: { nombre: 'Slime', emoji: '🟢', vida: 20, ataque: 5, oro: 5, color: '#4a8' },
    goblin: { nombre: 'Goblin', emoji: '👺', vida: 40, ataque: 10, oro: 15, color: '#5a5' },
    jefe_goblin: { nombre: 'Jefe Goblin', emoji: '👹', vida: 80, ataque: 15, oro: 50, color: '#a55', esJefe: true },
    esqueleto: { nombre: 'Esqueleto', emoji: '💀', vida: 50, ataque: 12, oro: 20, color: '#ddd' },
    dragon: { nombre: 'Dragón', emoji: '🐉', vida: 150, ataque: 25, oro: 100, color: '#a22', esJefe: true }
};

// ============ JUGADOR ============
const jugador = {
    x: 400,
    y: 400,
    width: 30,
    height: 40,
    velocidad: 4,
    direccion: 'abajo',
    atacando: false,
    tiempoAtaque: 0,
    invulnerable: 0,
    animFrame: 0
};

// ============ ENTIDADES ACTUALES ============
let enemigosActuales = [];
let objetosActuales = [];
let npcsActuales = [];
let particulas = [];
let dialogoActual = null;
let npcActualDialogo = null;

// ============ INICIALIZACIÓN ============
function cargarZona(nombreZona) {
    estado.zonaActual = nombreZona;
    if (!estado.zonasVisitadas.includes(nombreZona)) {
        estado.zonasVisitadas.push(nombreZona);
    }
    
    const zona = zonas[nombreZona];
    document.getElementById('zona').textContent = zona.nombre;
    
    // Cargar NPCs
    npcsActuales = zona.npcs.map(id => {
        const data = npcsData[id];
        return {
            id,
            ...data,
            interactuado: false
        };
    });
    
    // Cargar enemigos
    enemigosActuales = zona.enemigos.map((id, i) => {
        const data = enemigosData[id];
        return {
            id,
            ...data,
            x: 200 + (i * 150),
            y: 150 + (i * 80),
            vidaActual: data.vida,
            vivo: true,
            dir: 1,
            startX: 200 + (i * 150)
        };
    });
    
    // Cargar objetos
    objetosActuales = zona.objetos.map((tipo, i) => ({
        tipo,
        x: 150 + (i * 200),
        y: 350,
        recogido: false,
        emoji: tipo === 'pocion' ? '🧪' : tipo === 'llave' ? '🗝️' : '✨'
    }));
    
    // Posicionar jugador
    jugador.x = 400;
    jugador.y = 400;
    
    actualizarUI();
    mostrarMensaje(zona.mensaje);
}

// ============ MOVIMIENTO ============
const teclas = {};
window.addEventListener('keydown', (e) => {
    teclas[e.key.toLowerCase()] = true;
    
    if (estado.dialogoActivo) {
        if (e.key.toLowerCase() === 'e') {
            avanzarDialogo();
        }
        return;
    }
    
    if (estado.inventarioAbierto) {
        if (e.key.toLowerCase() === 'i' || e.key === 'Escape') {
            toggleInventario();
        }
        return;
    }
    
    if (estado.mapaAbierto) {
        if (e.key.toLowerCase() === 'm' || e.key === 'Escape') {
            toggleMapa();
        }
        return;
    }
    
    if (e.key.toLowerCase() === 'e') {
        interactuar();
    }
    if (e.key.toLowerCase() === 'i') {
        toggleInventario();
    }
    if (e.key.toLowerCase() === 'm') {
        toggleMapa();
    }
    if (e.key === ' ') {
        atacar();
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    teclas[e.key.toLowerCase()] = false;
});

function moverJugador() {
    if (estado.dialogoActivo || estado.inventarioAbierto || estado.mapaAbierto) return;
    
    let movido = false;
    if (teclas['arrowleft'] || teclas['a']) {
        jugador.x -= jugador.velocidad;
        jugador.direccion = 'izquierda';
        movido = true;
    }
    if (teclas['arrowright'] || teclas['d']) {
        jugador.x += jugador.velocidad;
        jugador.direccion = 'derecha';
        movido = true;
    }
    if (teclas['arrowup'] || teclas['w']) {
        jugador.y -= jugador.velocidad;
        jugador.direccion = 'arriba';
        movido = true;
    }
    if (teclas['arrowdown'] || teclas['s']) {
        jugador.y += jugador.velocidad;
        jugador.direccion = 'abajo';
        movido = true;
    }
    
    if (movido) jugador.animFrame = (jugador.animFrame + 1) % 60;
    
    // Límites
    jugador.x = Math.max(20, Math.min(canvas.width - 20, jugador.x));
    jugador.y = Math.max(60, Math.min(canvas.height - 20, jugador.y));
    
    // Transiciones de zona
    const zona = zonas[estado.zonaActual];
    if (jugador.y <= 60 && zona.conexiones.norte) {
        cambiarZona(zona.conexiones.norte);
    }
    if (jugador.y >= canvas.height - 20 && zona.conexiones.sur) {
        cambiarZona(zona.conexiones.sur);
    }
    if (jugador.x >= canvas.width - 20 && zona.conexiones.este) {
        cambiarZona(zona.conexiones.este);
    }
    if (jugador.x <= 20 && zona.conexiones.oeste) {
        cambiarZona(zona.conexiones.oeste);
    }
}

function cambiarZona(nuevaZona) {
    const zonaDestino = zonas[nuevaZona];
    
    if (zonaDestino.bloqueada && estado.cristales < 2) {
        mostrarMensaje('La torre está protegida por una barrera mágica. Necesitas 2 cristales para entrar.');
        jugador.y = canvas.height - 50;
        return;
    }
    
    if (zonaDestino.requiereLlave && !tieneItem('llave')) {
        mostrarMensaje('La cueva está cerrada. Necesitas una llave.');
        jugador.x = 50;
        return;
    }
    
    cargarZona(nuevaZona);
}

// ============ INTERACCIÓN ============
function interactuar() {
    // Verificar NPCs cercanos
    for (let npc of npcsActuales) {
        const dist = Math.hypot(jugador.x - npc.x, jugador.y - npc.y);
        if (dist < 50) {
            iniciarDialogo(npc);
            return;
        }
    }
    
    // Verificar objetos cercanos
    for (let obj of objetosActuales) {
        if (obj.recogido) continue;
        const dist = Math.hypot(jugador.x - obj.x, jugador.y - obj.y);
        if (dist < 40) {
            recogerObjeto(obj);
            return;
        }
    }
    
    // Verificar cristales
    const zona = zonas[estado.zonaActual];
    if (zona.cristal && !zona.cristalRecogido) {
        if (estado.zonaActual === 'cueva' && enemigosActuales.some(e => e.vivo)) {
            mostrarMensaje('Derrota a todos los enemigos primero.');
            return;
        }
        if (estado.zonaActual === 'ruinas' && enemigosActuales.some(e => e.vivo)) {
            mostrarMensaje('Derrota a los guardianes primero.');
            return;
        }
        if (estado.zonaActual === 'torre' && enemigosActuales.some(e => e.vivo)) {
            mostrarMensaje('Derrota al dragón primero.');
            return;
        }
        recogerCristal();
    }
}

function recogerObjeto(obj) {
    obj.recogido = true;
    agregarItem(obj.tipo);
    crearParticulas(obj.x, obj.y, '#ffd700', 15);
    mostrarMensaje(`¡Recogiste ${nombreItem(obj.tipo)}!`);
}

function recogerCristal() {
    const zona = zonas[estado.zonaActual];
    zona.cristalRecogido = true;
    estado.cristales++;
    crearParticulas(jugador.x, jugador.y, '#00ffff', 30);
    mostrarMensaje(`💎 ¡Cristal recuperado! (${estado.cristales}/${estado.totalCristales})`);
    
    if (estado.cristales >= estado.totalCristales) {
        setTimeout(() => {
            estado.victoria = true;
            mostrarMensaje('🏆 ¡Has recuperado los tres cristales! ¡El bosque está a salvo!');
        }, 1000);
    }
    
    actualizarUI();
}

function agregarItem(tipo) {
    const existente = estado.inventario.find(i => i.tipo === tipo);
    if (existente) {
        existente.cantidad++;
    } else {
        estado.inventario.push({ tipo, cantidad: 1 });
    }
    actualizarInventarioUI();
}

function tieneItem(tipo) {
    return estado.inventario.some(i => i.tipo === tipo && i.cantidad > 0);
}

function nombreItem(tipo) {
    const nombres = {
        pocion: '🧪 Poción de Vida',
        llave: '🗝️ Llave Antigua',
        cristal: '💎 Cristal Mágico'
    };
    return nombres[tipo] || tipo;
}

// ============ COMBATE ============
function atacar() {
    if (jugador.atacando) return;
    jugador.atacando = true;
    jugador.tiempoAtaque = 15;
    
    // Verificar enemigos en rango
    const rango = 50;
    let dx = 0, dy = 0;
    if (jugador.direccion === 'derecha') dx = rango;
    else if (jugador.direccion === 'izquierda') dx = -rango;
    else if (jugador.direccion === 'arriba') dy = -rango;
    else if (jugador.direccion === 'abajo') dy = rango;
    
    const ataqueX = jugador.x + dx;
    const ataqueY = jugador.y + dy;
    
    for (let enemigo of enemigosActuales) {
        if (!enemigo.vivo) continue;
        const dist = Math.hypot(ataqueX - enemigo.x, ataqueY - enemigo.y);
        if (dist < 50) {
            const danio = 15 + Math.floor(Math.random() * 10);
            enemigo.vidaActual -= danio;
            crearParticulas(enemigo.x, enemigo.y, '#ff0000', 10);
            
            if (enemigo.vidaActual <= 0) {
                enemigo.vivo = false;
                estado.oro += enemigo.oro;
                crearParticulas(enemigo.x, enemigo.y, '#ffd700', 20);
                mostrarMensaje(`¡Derrotaste al ${enemigo.nombre}! +${enemigo.oro} oro`);
                actualizarUI();
                
                // Verificar si era el dragón
                if (enemigo.id === 'dragon') {
                    setTimeout(() => {
                        mostrarMensaje('¡El dragón ha caído! El cristal de la torre es tuyo.');
                    }, 500);
                }
            }
        }
    }
}

function actualizarEnemigos() {
    for (let enemigo of enemigosActuales) {
        if (!enemigo.vivo) continue;
        
        // Movimiento de patrulla
        enemigo.x += enemigo.dir * 1;
        if (Math.abs(enemigo.x - enemigo.startX) > 80) {
            enemigo.dir *= -1;
        }
        
        // Atacar al jugador si está cerca
        const dist = Math.hypot(jugador.x - enemigo.x, jugador.y - enemigo.y);
        if (dist < 40 && jugador.invulnerable <= 0) {
            estado.vida -= enemigo.ataque;
            jugador.invulnerable = 30;
            crearParticulas(jugador.x, jugador.y, '#ff0000', 10);
            
            if (estado.vida <= 0) {
                estado.vida = 0;
                estado.gameOver = true;
                mostrarMensaje('💀 Has caído en batalla...');
            }
            actualizarUI();
        }
    }
}

// ============ DIÁLOGOS ============
function iniciarDialogo(npc) {
    npcActualDialogo = npc;
    estado.dialogoActivo = true;
    
    let dialogoId = 'inicial';
    if (npc.id === 'anciano' && estado.misiones.includes('recuperar_cristales')) {
        dialogoId = 'aceptado';
    }
    if (npc.id === 'espiritu' && !enemigosActuales.some(e => e.vivo)) {
        dialogoId = 'completado';
    }
    
    mostrarDialogo(npc.dialogos[dialogoId]);
}

function mostrarDialogo(dialogo) {
    dialogoActual = dialogo;
    document.getElementById('dialogoNombre').textContent = npcActualDialogo.nombre;
    document.getElementById('dialogoTexto').textContent = dialogo.texto;
    
    const opcionesDiv = document.getElementById('dialogoOpciones');
    opcionesDiv.innerHTML = '';
    
    if (dialogo.opciones) {
        dialogo.opciones.forEach((opcion, i) => {
            const btn = document.createElement('button');
            btn.className = 'opcion-btn';
            btn.textContent = `${i + 1}. ${opcion.texto}`;
            btn.onclick = () => ejecutarOpcion(opcion.accion);
            opcionesDiv.appendChild(btn);
        });
    }
    
    document.getElementById('dialogo').classList.remove('oculto');
}

function ejecutarOpcion(accion) {
    switch (accion) {
        case 'info_cristales':
        case 'cristal':
        case 'ayuda':
            mostrarDialogo(npcActualDialogo.dialogos[accion]);
            break;
        case 'aceptar_mision':
            estado.misiones.push('recuperar_cristales');
            actualizarMisionesUI();
            mostrarDialogo(npcActualDialogo.dialogos['aceptado']);
            break;
        case 'dar_pocion':
            agregarItem('pocion');
            mostrarMensaje('¡Recibiste una Poción de Vida!');
            cerrarDialogo();
            break;
        case 'dar_cristal_ruinas':
            recogerCristal();
            cerrarDialogo();
            break;
        case 'activar_guardianes':
            cerrarDialogo();
            break;
        case 'luchar_dragon':
            cerrarDialogo();
            break;
        case 'volver_inicial':
            mostrarDialogo(npcActualDialogo.dialogos['inicial']);
            break;
        case 'cerrar':
            cerrarDialogo();
            break;
    }
}

function avanzarDialogo() {
    cerrarDialogo();
}

function cerrarDialogo() {
    estado.dialogoActivo = false;
    dialogoActual = null;
    npcActualDialogo = null;
    document.getElementById('dialogo').classList.add('oculto');
}

// ============ INVENTARIO Y MAPA ============
function toggleInventario() {
    estado.inventarioAbierto = !estado.inventarioAbierto;
    const modal = document.getElementById('inventarioModal');
    
    if (estado.inventarioAbierto) {
        modal.classList.remove('oculto');
        renderInventario();
    } else {
        modal.classList.add('oculto');
    }
}

function renderInventario() {
    const grid = document.getElementById('itemsInventario');
    grid.innerHTML = '';
    
    // 10 slots
    for (let i = 0; i < 10; i++) {
        const slot = document.createElement('div');
        slot.className = 'item-slot';
        
        if (estado.inventario[i]) {
            const item = estado.inventario[i];
            const emoji = item.tipo === 'pocion' ? '🧪' : item.tipo === 'llave' ? '🗝️' : '✨';
            slot.innerHTML = `
                <div>${emoji}</div>
                <div class="item-nombre">${item.tipo}</div>
                ${item.cantidad > 1 ? `<div class="item-cantidad">x${item.cantidad}</div>` : ''}
            `;
            slot.onclick = () => usarItem(item);
        } else {
            slot.classList.add('vacio');
            slot.textContent = '·';
        }
        
        grid.appendChild(slot);
    }
}

function usarItem(item) {
    if (item.tipo === 'pocion') {
        if (estado.vida < estado.vidaMax) {
            estado.vida = Math.min(estado.vidaMax, estado.vida + 50);
            item.cantidad--;
            if (item.cantidad <= 0) {
                estado.inventario = estado.inventario.filter(i => i.tipo !== 'pocion');
            }
            crearParticulas(jugador.x, jugador.y, '#00ff00', 20);
            mostrarMensaje('¡Usaste una poción! +50 vida');
            actualizarUI();
            renderInventario();
        } else {
            mostrarMensaje('Ya tienes la vida al máximo.');
        }
    }
}

function toggleMapa() {
    estado.mapaAbierto = !estado.mapaAbierto;
    const modal = document.getElementById('mapaModal');
    
    if (estado.mapaAbierto) {
        modal.classList.remove('oculto');
        renderMapa();
    } else {
        modal.classList.add('oculto');
    }
}

function renderMapa() {
    const mapa = document.getElementById('mapaVisual');
    mapa.innerHTML = '';
    
    // Layout del mapa (3x2)
    const layout = [
        ['ruinas', 'torre', null],
        ['bosque', 'cueva', null],
        ['rio', 'claro', null]
    ];
    
    layout.forEach(fila => {
        fila.forEach(zonaId => {
            const div = document.createElement('div');
            
            if (zonaId === null) {
                div.style.visibility = 'hidden';
                mapa.appendChild(div);
                return;
            }
            
            const zona = zonas[zonaId];
            div.className = 'mapa-zona';
            
            if (zonaId === estado.zonaActual) div.classList.add('actual');
            else if (estado.zonasVisitadas.includes(zonaId)) div.classList.add('visitada');
            if (zona.bloqueada && estado.cristales < 2) div.classList.add('bloqueada');
            
            div.innerHTML = `
                <div class="mapa-zona-icono">${zona.icono}</div>
                <div class="mapa-zona-nombre">${zona.nombre}</div>
            `;
            
            mapa.appendChild(div);
        });
    });
}

// ============ UI ============
function actualizarUI() {
    document.getElementById('barraVida').style.width = `${(estado.vida / estado.vidaMax) * 100}%`;
    document.getElementById('vidaTexto').textContent = `${estado.vida}/${estado.vidaMax}`;
    document.getElementById('oro').textContent = `💰 ${estado.oro}`;
    document.getElementById('cristales').textContent = `💎 ${estado.cristales}/${estado.totalCristales}`;
    actualizarInventarioUI();
}

function actualizarInventarioUI() {
    const lista = document.getElementById('listaInventario');
    lista.innerHTML = '';
    
    if (estado.inventario.length === 0) {
        lista.innerHTML = '<li>Vacío</li>';
    } else {
        estado.inventario.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${nombreItem(item.tipo)} x${item.cantidad}`;
            lista.appendChild(li);
        });
    }
}

function actualizarMisionesUI() {
    const lista = document.getElementById('listaMisiones');
    lista.innerHTML = '';
    
    if (estado.misiones.length === 0) {
        lista.innerHTML = '<li>Habla con el Anciano</li>';
    } else {
        estado.misiones.forEach(m => {
            const li = document.createElement('li');
            if (m === 'recuperar_cristales') {
                li.textContent = `💎 Recuperar cristales (${estado.cristales}/3)`;
            }
            lista.appendChild(li);
        });
    }
}

let mensajeTimer = null;
function mostrarMensaje(texto) {
    // Usar diálogo temporal
    const dialogo = document.getElementById('dialogo');
    const textoDiv = document.getElementById('dialogoTexto');
    const nombreDiv = document.getElementById('dialogoNombre');
    const opcionesDiv = document.getElementById('dialogoOpciones');
    const continuarDiv = dialogo.querySelector('.dialogo-continuar');
    
    nombreDiv.textContent = '📢 Sistema';
    textoDiv.textContent = texto;
    opcionesDiv.innerHTML = '';
    continuarDiv.style.display = 'block';
    
    dialogo.classList.remove('oculto');
    estado.dialogoActivo = true;
    
    clearTimeout(mensajeTimer);
    mensajeTimer = setTimeout(() => {
        dialogo.classList.add('oculto');
        estado.dialogoActivo = false;
    }, 3000);
}

// ============ PARTÍCULAS ============
function crearParticulas(x, y, color, cantidad) {
    for (let i = 0; i < cantidad; i++) {
        particulas.push({
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
    particulas = particulas.filter(p => p.life > 0);
    particulas.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.life -= 0.03;
    });
}

// ============ DIBUJO ============
function dibujar() {
    const zona = zonas[estado.zonaActual];
    
    // Fondo
    ctx.fillStyle = zona.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Decoración del fondo (árboles, hierba)
    dibujarDecoracion();
    
    // Indicadores de salida
    dibujarSalidas();
    
    // Objetos
    objetosActuales.forEach(obj => {
        if (obj.recogido) return;
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(obj.emoji, obj.x, obj.y);
    });
    
    // Cristal de la zona
    if (zona.cristal && !zona.cristalRecogido) {
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        const brillo = Math.sin(Date.now() / 200) * 3;
        ctx.fillText('💎', 400, 200 + brillo);
    }
    
    // NPCs
    npcsActuales.forEach(npc => {
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(npc.emoji, npc.x, npc.y);
        
        // Indicador de interacción
        const dist = Math.hypot(jugador.x - npc.x, jugador.y - npc.y);
        if (dist < 50) {
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 14px Arial';
            ctx.fillText('[E]', npc.x, npc.y - 30);
        }
    });
    
    // Enemigos
    enemigosActuales.forEach(enemigo => {
        if (!enemigo.vivo) return;
        ctx.font = '28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(enemigo.emoji, enemigo.x, enemigo.y);
        
        // Barra de vida
        const anchoBarra = 30;
        const vidaRatio = enemigo.vidaActual / enemigo.vida;
        ctx.fillStyle = '#333';
        ctx.fillRect(enemigo.x - anchoBarra/2, enemigo.y - 25, anchoBarra, 4);
        ctx.fillStyle = vidaRatio > 0.5 ? '#4a8' : vidaRatio > 0.25 ? '#fa0' : '#f44';
        ctx.fillRect(enemigo.x - anchoBarra/2, enemigo.y - 25, anchoBarra * vidaRatio, 4);
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
    
    // Game Over / Victoria
    if (estado.gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ff3860';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2);
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText('Presiona R para reiniciar', canvas.width/2, canvas.height/2 + 40);
    }
    
    if (estado.victoria) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 50px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('¡VICTORIA!', canvas.width/2, canvas.height/2 - 20);
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText('Has salvado el bosque', canvas.width/2, canvas.height/2 + 20);
        ctx.fillText('Presiona R para jugar de nuevo', canvas.width/2, canvas.height/2 + 50);
    }
}

function dibujarDecoracion() {
    // Árboles de fondo
    ctx.fillStyle = 'rgba(0, 50, 0, 0.3)';
    for (let i = 0; i < 8; i++) {
        const x = (i * 137) % canvas.width;
        const y = 50 + (i * 73) % 100;
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Hierba
    ctx.fillStyle = 'rgba(100, 150, 50, 0.4)';
    for (let i = 0; i < 30; i++) {
        const x = (i * 97) % canvas.width;
        const y = 300 + (i * 43) % 180;
        ctx.fillRect(x, y, 3, 8);
    }
}

function dibujarSalidas() {
    const zona = zonas[estado.zonaActual];
    ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    
    if (zona.conexiones.norte) {
        ctx.fillRect(canvas.width/2 - 30, 0, 60, 15);
        ctx.fillStyle = '#ffd700';
        ctx.fillText('↑ ' + zonas[zona.conexiones.norte].nombre, canvas.width/2, 12);
    }
    if (zona.conexiones.sur) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.fillRect(canvas.width/2 - 30, canvas.height - 15, 60, 15);
        ctx.fillStyle = '#ffd700';
        ctx.fillText('↓ ' + zonas[zona.conexiones.sur].nombre, canvas.width/2, canvas.height - 4);
    }
    if (zona.conexiones.este) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.fillRect(canvas.width - 15, canvas.height/2 - 30, 15, 60);
        ctx.fillStyle = '#ffd700';
        ctx.save();
        ctx.translate(canvas.width - 5, canvas.height/2);
        ctx.rotate(-Math.PI/2);
        ctx.fillText('→ ' + zonas[zona.conexiones.este].nombre, 0, 0);
        ctx.restore();
    }
    if (zona.conexiones.oeste) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.fillRect(0, canvas.height/2 - 30, 15, 60);
        ctx.fillStyle = '#ffd700';
        ctx.save();
        ctx.translate(10, canvas.height/2);
        ctx.rotate(Math.PI/2);
        ctx.fillText('← ' + zonas[zona.conexiones.oeste].nombre, 0, 0);
        ctx.restore();
    }
}

function dibujarJugador() {
    // Sombra
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(jugador.x, jugador.y + 20, 15, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Efecto de ataque
    if (jugador.atacando) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        let dx = 0, dy = 0;
        if (jugador.direccion === 'derecha') dx = 30;
        else if (jugador.direccion === 'izquierda') dx = -30;
        else if (jugador.direccion === 'arriba') dy = -30;
        else if (jugador.direccion === 'abajo') dy = 30;
        
        ctx.beginPath();
        ctx.arc(jugador.x + dx, jugador.y + dy, 20, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Invulnerabilidad (parpadeo)
    if (jugador.invulnerable > 0 && Math.floor(jugador.invulnerable / 3) % 2 === 0) {
        return;
    }
    
    // Cuerpo
    ctx.fillStyle = '#4a90e2';
    ctx.fillRect(jugador.x - 12, jugador.y - 15, 24, 30);
    
    // Cabeza
    ctx.fillStyle = '#f4c2a1';
    ctx.beginPath();
    ctx.arc(jugador.x, jugador.y - 20, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // Ojos
    ctx.fillStyle = '#000';
    const eyeOffset = jugador.direccion === 'izquierda' ? -3 : jugador.direccion === 'derecha' ? 3 : 0;
    ctx.fillRect(jugador.x - 3 + eyeOffset, jugador.y - 22, 2, 2);
    ctx.fillRect(jugador.x + 2 + eyeOffset, jugador.y - 22, 2, 2);
    
    // Piernas (animación)
    ctx.fillStyle = '#2a5a9a';
    const anim = Math.sin(jugador.animFrame / 5) * 3;
    ctx.fillRect(jugador.x - 8, jugador.y + 15, 6, 8 + anim);
    ctx.fillRect(jugador.x + 2, jugador.y + 15, 6, 8 - anim);
}

// ============ LOOP PRINCIPAL ============
function loop() {
    if (!estado.gameOver && !estado.victoria) {
        moverJugador();
        actualizarEnemigos();
        actualizarParticulas();
        
        if (jugador.atacando) {
            jugador.tiempoAtaque--;
            if (jugador.tiempoAtaque <= 0) jugador.atacando = false;
        }
        
        if (jugador.invulnerable > 0) jugador.invulnerable--;
    }
    
    dibujar();
    requestAnimationFrame(loop);
}

// ============ REINICIO ============
window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'r' && (estado.gameOver || estado.victoria)) {
        location.reload();
    }
});

// ============ INICIO ============
cargarZona('claro');
actualizarMisionesUI();
loop();
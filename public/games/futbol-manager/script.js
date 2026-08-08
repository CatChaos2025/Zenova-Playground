// Estado del juego
const estado = {
    dinero: parseInt(localStorage.getItem('fm_dinero')) || 1000,
    liga: parseInt(localStorage.getItem('fm_liga')) || 1,
    poder: parseInt(localStorage.getItem('fm_poder')) || 50,
    plantilla: JSON.parse(localStorage.getItem('fm_plantilla')) || [
        { nombre: 'Carlos', posicion: 'DEL', habilidad: 65, valor: 200 },
        { nombre: 'Miguel', posicion: 'MED', habilidad: 60, valor: 150 },
        { nombre: 'Juan', posicion: 'DEF', habilidad: 70, valor: 180 },
        { nombre: 'Pedro', posicion: 'POR', habilidad: 75, valor: 250 }
    ],
    mercado: [],
    rival: null,
    partidoActivo: false
};

// Generar mercado aleatorio
function generarMercado() {
    const posiciones = ['POR', 'DEF', 'MED', 'DEL'];
    const nombres = ['Luis', 'Andrés', 'Roberto', 'Fernando', 'Diego', 'Pablo', 'Sergio', 'Raúl'];
    estado.mercado = [];
    
    for (let i = 0; i < 5; i++) {
        const habilidad = 50 + Math.floor(Math.random() * 40);
        const valor = habilidad * 3 + Math.floor(Math.random() * 100);
        estado.mercado.push({
            nombre: nombres[Math.floor(Math.random() * nombres.length)],
            posicion: posiciones[Math.floor(Math.random() * posiciones.length)],
            habilidad: habilidad,
            valor: valor
        });
    }
}

// Actualizar UI
function actualizarUI() {
    document.getElementById('dinero').textContent = estado.dinero;
    document.getElementById('liga').textContent = estado.liga;
    document.getElementById('poder').textContent = estado.poder;
    guardarDatos();
}

// Guardar en localStorage
function guardarDatos() {
    localStorage.setItem('fm_dinero', estado.dinero);
    localStorage.setItem('fm_liga', estado.liga);
    localStorage.setItem('fm_poder', estado.poder);
    localStorage.setItem('fm_plantilla', JSON.stringify(estado.plantilla));
}

// Mostrar pantalla
function mostrarPantalla(pantalla) {
    document.querySelectorAll('.pantalla, .menu-principal').forEach(el => el.classList.add('oculto'));
    
    if (pantalla === 'menu') {
        document.getElementById('menuPrincipal').classList.remove('oculto');
    } else if (pantalla === 'plantilla') {
        document.getElementById('pantallaPlantilla').classList.remove('oculto');
        mostrarPlantilla();
    } else if (pantalla === 'mercado') {
        document.getElementById('pantallaMercado').classList.remove('oculto');
        mostrarMercado();
    } else if (pantalla === 'entrenamiento') {
        document.getElementById('pantallaEntrenamiento').classList.remove('oculto');
    }
}

// Mostrar plantilla
function mostrarPlantilla() {
    const lista = document.getElementById('listaJugadores');
    lista.innerHTML = '';
    
    estado.plantilla.forEach((jugador, index) => {
        const card = document.createElement('div');
        card.className = 'jugador-card';
        card.innerHTML = `
            <div class="jugador-info">
                <div class="jugador-nombre">${jugador.nombre}</div>
                <div class="jugador-stats">${jugador.posicion} | Habilidad: ${jugador.habilidad}</div>
            </div>
            <button onclick="venderJugador(${index})">Vender (${jugador.valor}💰)</button>
        `;
        lista.appendChild(card);
    });
}

// Mostrar mercado
function mostrarMercado() {
    if (estado.mercado.length === 0) generarMercado();
    
    const lista = document.getElementById('listaMercado');
    lista.innerHTML = '';
    
    estado.mercado.forEach((jugador, index) => {
        const card = document.createElement('div');
        card.className = 'jugador-card';
        card.innerHTML = `
            <div class="jugador-info">
                <div class="jugador-nombre">${jugador.nombre}</div>
                <div class="jugador-stats">${jugador.posicion} | Habilidad: ${jugador.habilidad}</div>
            </div>
            <button onclick="comprarJugador(${index})">Comprar (${jugador.valor}💰)</button>
        `;
        lista.appendChild(card);
    });
}

// Comprar jugador
function comprarJugador(index) {
    const jugador = estado.mercado[index];
    
    if (estado.dinero >= jugador.valor) {
        estado.dinero -= jugador.valor;
        estado.plantilla.push(jugador);
        estado.mercado.splice(index, 1);
        actualizarUI();
        mostrarMercado();
        alert(`¡${jugador.nombre} fichado!`);
    } else {
        alert('No tienes suficiente dinero');
    }
}

// Vender jugador
function venderJugador(index) {
    const jugador = estado.plantilla[index];
    
    if (estado.plantilla.length > 4) {
        estado.dinero += jugador.valor;
        estado.plantilla.splice(index, 1);
        actualizarUI();
        mostrarPlantilla();
        alert(`¡${jugador.nombre} vendido!`);
    } else {
        alert('Necesitas al menos 4 jugadores');
    }
}

// Entrenar
function entrenar() {
    if (estado.dinero >= 100) {
        estado.dinero -= 100;
        estado.poder += 5;
        estado.plantilla.forEach(j => j.habilidad += 2);
        actualizarUI();
        alert('¡Entrenamiento completado!');
    } else {
        alert('No tienes suficiente dinero');
    }
}

// Jugar partido
function jugarPartido() {
    if (estado.plantilla.length < 4) {
        alert('Necesitas al menos 4 jugadores');
        return;
    }
    
    // Generar rival
    const poderRival = estado.poder + Math.floor(Math.random() * 20) - 10;
    estado.rival = {
        nombre: 'Equipo ' + ['Rojo', 'Azul', 'Verde', 'Amarillo'][Math.floor(Math.random() * 4)],
        poder: poderRival
    };
    
    document.getElementById('nombreRival').textContent = estado.rival.nombre;
    document.getElementById('tituloPartido').textContent = `Liga ${estado.liga} - Partido`;
    document.getElementById('golesTu').textContent = '0';
    document.getElementById('golesRival').textContent = '0';
    document.getElementById('logPartido').innerHTML = '';
    document.getElementById('btnSiguiente').classList.add('oculto');
    
    mostrarPantalla('partido');
    document.getElementById('pantallaPartido').classList.remove('oculto');
    
    simularPartido();
}

// Simular partido
function simularPartido() {
    let golesTu = 0;
    let golesRival = 0;
    let minuto = 0;
    
    const log = document.getElementById('logPartido');
    
    const intervalo = setInterval(() => {
        minuto += 5;
        
        // Calcular probabilidad de gol
        const probTu = (estado.poder / 100) * 0.3;
        const probRival = (estado.rival.poder / 100) * 0.3;
        
        if (Math.random() < probTu) {
            golesTu++;
            document.getElementById('golesTu').textContent = golesTu;
            const jugador = estado.plantilla[Math.floor(Math.random() * estado.plantilla.length)];
            log.innerHTML = `<div class="log-entry">⚽ Min ${minuto}' - ¡GOL de ${jugador.nombre}!</div>` + log.innerHTML;
        }
        
        if (Math.random() < probRival) {
            golesRival++;
            document.getElementById('golesRival').textContent = golesRival;
            log.innerHTML = `<div class="log-entry">⚽ Min ${minuto}' - Gol de ${estado.rival.nombre}</div>` + log.innerHTML;
        }
        
        if (minuto >= 90) {
            clearInterval(intervalo);
            
            // Resultado
            let resultado;
            if (golesTu > golesRival) {
                resultado = '¡VICTORIA!';
                estado.dinero += 500;
                estado.liga++;
            } else if (golesTu < golesRival) {
                resultado = 'DERROTA';
                estado.dinero += 100;
            } else {
                resultado = 'EMPATE';
                estado.dinero += 250;
            }
            
            log.innerHTML = `<div class="log-entry" style="font-size: 1.5em; text-align: center; border-left: 3px solid #FFD700;">${resultado}</div>` + log.innerHTML;
            
            actualizarUI();
            document.getElementById('btnSiguiente').classList.remove('oculto');
        }
    }, 500);
}

// Finalizar partido
function finalizarPartido() {
    generarMercado();
    mostrarPantalla('menu');
}

// Canvas decorativo
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function dibujarCampo() {
    ctx.fillStyle = '#2d5016';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.strokeRect(50, 50, 500, 300);
    ctx.beginPath();
    ctx.moveTo(300, 50);
    ctx.lineTo(300, 350);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(300, 200, 50, 0, Math.PI * 2);
    ctx.stroke();
}

dibujarCampo();

// Inicializar
actualizarUI();
generarMercado();
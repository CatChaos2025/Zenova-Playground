const $ = id => document.getElementById(id);
let vidaJ = 100, vidaR = 100, kiJ = 0;
let rondasJ = 0, rondasR = 0, ronda = 1;
let jugando = false, esperando = false;

function iniciarJuego() {
    vidaJ = 100; vidaR = 100; kiJ = 0;
    rondasJ = 0; rondasR = 0; ronda = 1;
    jugando = true; esperando = false;
    $('overlayInicio').classList.add('oculto');
    $('overlayFin').classList.add('oculto');
    actualizarUI();
    $('info').textContent = '¡Elige tu acción!';
}

function accion(tipo) {
    if (!jugando || esperando) return;
    if (tipo === 'estocada' && kiJ < 100) return;
    
    esperando = true;
    const rival = iaDecide();
    
    const fj = $('fencerJ');
    const fr = $('fencerR');
    fj.className = 'fencer jugador ' + (tipo === 'defensa' ? 'defensa' : 'ataque-' + tipo);
    fr.className = 'fencer rival ' + (rival === 'defensa' ? 'defensa' : 'ataque-' + rival);
    
    setTimeout(() => {
        let resultado = resolver(tipo, rival);
        
        if (tipo === 'estocada') {
            fj.classList.add('estocada');
            kiJ = 0;
            vidaR -= 35;
            resultado = '💥 ¡ESTOCADA! -35 al rival';
            mostrarEfecto('💥', 350, 120);
        } else if (resultado === 'ganas') {
            fj.classList.add('estocada');
            let daño = tipo === 'alto' ? 15 : 20;
            vidaR -= daño;
            kiJ = Math.min(100, kiJ + 25);
            resultado = `⚔️ ¡Acertaste! -${daño} al rival`;
            mostrarEfecto('💥', 450, 120);
        } else if (resultado === 'pierdes') {
            fr.classList.add('estocada');
            let daño = rival === 'alto' ? 15 : 20;
            vidaJ -= daño;
            kiJ = Math.min(100, kiJ + 10);
            resultado = `🩸 ¡Te dieron! -${daño} a ti`;
            mostrarEfecto('💢', 150, 120);
        } else {
            resultado = '🤝 ¡Empate! Ambos bloquean';
            kiJ = Math.min(100, kiJ + 5);
        }
        
        vidaJ = Math.max(0, vidaJ);
        vidaR = Math.max(0, vidaR);
        actualizarUI();
        $('info').textContent = resultado;
        
        setTimeout(() => {
            fj.className = 'fencer jugador';
            fr.className = 'fencer rival';
            
            if (vidaJ <= 0) {
                rondasR++;
                siguienteRonda('rival');
            } else if (vidaR <= 0) {
                rondasJ++;
                siguienteRonda('jugador');
            } else {
                esperando = false;
            }
            actualizarUI();
        }, 800);
    }, 400);
}

function iaDecide() {
    const r = Math.random();
    if (r < 0.35) return 'alto';
    if (r < 0.7) return 'bajo';
    return 'defensa';
}

function resolver(jugador, rival) {
    if (jugador === rival) return 'empate';
    if (jugador === 'alto' && rival === 'bajo') return 'ganas';
    if (jugador === 'bajo' && rival === 'defensa') return 'ganas';
    if (jugador === 'defensa' && rival === 'alto') return 'ganas';
    return 'pierdes';
}

function siguienteRonda(ganador) {
    if (rondasJ >= 3 || rondasR >= 3) {
        jugando = false;
        const texto = rondasJ >= 3 ? '🏆 ¡VICTORIA!' : '😢 DERROTA';
        $('resultadoFinal').textContent = texto;
        $('overlayFin').classList.remove('oculto');
        return;
    }
    
    ronda++;
    vidaJ = 100; vidaR = 100; kiJ = 0;
    $('info').textContent = ganador === 'jugador' ? '🎉 ¡Ganaste la ronda!' : '😤 El rival ganó la ronda';
    
    setTimeout(() => {
        esperando = false;
        actualizarUI();
        $('info').textContent = '¡Nueva ronda! Elige tu acción';
    }, 1500);
}

function mostrarEfecto(texto, x, y) {
    const el = document.createElement('div');
    el.className = 'hit-effect';
    el.textContent = texto;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    $('arena').appendChild(el);
    setTimeout(() => el.remove(), 800);
}

function actualizarUI() {
    $('vidaJ').style.width = vidaJ + '%';
    $('vidaR').style.width = vidaR + '%';
    $('kiJ').style.width = kiJ + '%';
    $('rondasJ').textContent = rondasJ;
    $('rondasR').textContent = rondasR;
    $('rondaInfo').textContent = `Ronda ${ronda} | ${rondasJ}-${rondasR}`;
    $('btnEstocada').disabled = kiJ < 100;
}

window.addEventListener('keydown', e => {
    if (e.key === '1') accion('alto');
    if (e.key === '2') accion('bajo');
    if (e.key === '3') accion('defensa');
    if (e.key === '4') accion('estocada');
});
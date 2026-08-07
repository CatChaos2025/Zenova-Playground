// --- Obtener elementos del DOM ---
const container = document.getElementById('game-container');
const player = document.getElementById('player');
const enemiesContainer = document.getElementById('enemies-container');
const scoreElement = document.getElementById('score-board');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreElement = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// --- Variables de estado del juego ---
let isPlaying = false;
let score = 0;
let enemies = [];
let speedMultiplier = 1;
let spawnIntervalId = null;
let animationFrameId = null;
let lastTime = 0;

// --- Configuración ---
const CONTAINER_WIDTH = 400;
const PLAYER_SIZE = 40;
const ENEMY_SIZE = 40;

// --- Eventos de los Botones ---
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// --- Eventos de Movimiento (Mouse y Pantalla Táctil) ---
container.addEventListener('mousemove', (e) => {
    if (isPlaying) movePlayer(e.clientX);
});

container.addEventListener('touchmove', (e) => {
    if (isPlaying) {
        e.preventDefault(); // Evita que la página haga scroll en el celular
        movePlayer(e.touches[0].clientX);
    }
}, { passive: false });

// --- Funciones del Juego ---

// Función para mover al jugador horizontalmente
function movePlayer(clientX) {
    const rect = container.getBoundingClientRect();
    let x = clientX - rect.left - (PLAYER_SIZE / 2);

    // Evitar que el jugador se salga del área de juego
    if (x < 0) x = 0;
    if (x > CONTAINER_WIDTH - PLAYER_SIZE) x = CONTAINER_WIDTH - PLAYER_SIZE;

    player.style.left = x + 'px';
    player.style.transform = 'none'; // Anulamos el centrado inicial del CSS
}

// Iniciar o reiniciar el juego
function startGame() {
    // Resetear variables
    isPlaying = true;
    score = 0;
    speedMultiplier = 1;
    enemies = [];
    
    // Limpiar enemigos anteriores de la pantalla
    enemiesContainer.innerHTML = '';
    
    // Actualizar interfaz
    scoreElement.innerText = 'Puntos: 0';
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    // Resetear posición del jugador
    player.style.left = '50%';
    player.style.transform = 'translateX(-50%)';

    // Limpiar intervalos anteriores por si había alguno activo
    if (spawnIntervalId) clearInterval(spawnIntervalId);
    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    // Crear un enemigo cada 900 milisegundos
    spawnIntervalId = setInterval(spawnEnemy, 900);

    // Iniciar el bucle del juego
    lastTime = performance.now();
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Crear un nuevo enemigo en una posición aleatoria
function spawnEnemy() {
    if (!isPlaying) return;

    const enemyElement = document.createElement('div');
    enemyElement.classList.add('enemy');
    
    // Posición horizontal aleatoria
    const randomX = Math.random() * (CONTAINER_WIDTH - ENEMY_SIZE);
    enemyElement.style.left = randomX + 'px';
    
    enemiesContainer.appendChild(enemyElement);

    // Guardar información del enemigo para el bucle del juego
    enemies.push({
        element: enemyElement,
        y: -50, // Empieza arriba de la pantalla
        speed: (Math.random() * 2 + 3) * speedMultiplier // Velocidad variable
    });

    // Aumentar la dificultad gradualmente
    speedMultiplier += 0.03;
}

// Bucle principal del juego
function gameLoop(timestamp) {
    if (!isPlaying) return;

    lastTime = timestamp;

    // Recorrer la lista de enemigos
    for (let i = 0; i < enemies.length; i++) {
        let enemyObj = enemies[i];
        
        // Mover el enemigo hacia abajo
        enemyObj.y += enemyObj.speed;
        enemyObj.element.style.top = enemyObj.y + 'px';

        // Detectar si el enemigo chocó con el jugador
        if (checkCollision(player, enemyObj.element)) {
            endGame();
            return; // Detener el bucle
        }

        // Si el enemigo sale de la pantalla por abajo
        if (enemyObj.y > 600) {
            enemyObj.element.remove(); // Borrarlo del HTML
            enemies.splice(i, 1);      // Borrarlo de la lista
            i--;                       // Corregir el índice
            
            // Sumar punto
            score++;
            scoreElement.innerText = 'Puntos: ' + score;
        }
    }

    // Repetir el bucle en el siguiente cuadro
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Detectar si dos elementos se tocan (Colisión AABB)
function checkCollision(el1, el2) {
    const rect1 = el1.getBoundingClientRect();
    const rect2 = el2.getBoundingClientRect();

    return !(
        rect1.top > rect2.bottom ||
        rect1.right < rect2.left ||
        rect1.bottom < rect2.top ||
        rect1.left > rect2.right
    );
}

// Finalizar el juego
function endGame() {
    isPlaying = false;
    cancelAnimationFrame(animationFrameId);
    clearInterval(spawnIntervalId);
    
    // Mostrar pantalla de fin
    finalScoreElement.innerText = score;
    gameOverScreen.classList.remove('hidden');
}
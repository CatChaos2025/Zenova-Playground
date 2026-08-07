// ===== Emojis para las cartas =====
const EMOJIS = ['🐶', '🐱', '🦊', '🐼', '🦁', '🐸', '🐵', '🦄', '🐙', '🦋', '🐢', '🐬', '🦜', '🐝', '🦖', '🐠', '🦔', '🐳'];

// ===== Configuración =====
let difficulty = 'easy'; // 'easy' o 'hard'
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let totalPairs = 8;
let moves = 0;
let timerInterval = null;
let seconds = 0;
let isLocked = false;

// ===== Elementos del DOM =====
const gameBoard = document.getElementById('game-board');
const movesDisplay = document.getElementById('moves');
const timerDisplay = document.getElementById('timer');
const pairsDisplay = document.getElementById('pairs');
const winScreen = document.getElementById('win-screen');
const btnEasy = document.getElementById('btn-easy');
const btnHard = document.getElementById('btn-hard');
const restartBtn = document.getElementById('restart-btn');

// ===== Eventos de dificultad =====
btnEasy.addEventListener('click', () => setDifficulty('easy'));
btnHard.addEventListener('click', () => setDifficulty('hard'));
restartBtn.addEventListener('click', startGame);

function setDifficulty(diff) {
    difficulty = diff;
    btnEasy.classList.toggle('active', diff === 'easy');
    btnHard.classList.toggle('active', diff === 'hard');
    startGame();
}

// ===== Iniciar juego =====
function startGame() {
    // Resetear estado
    matchedPairs = 0;
    moves = 0;
    seconds = 0;
    flippedCards = [];
    isLocked = false;

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);

    // Configurar según dificultad
    if (difficulty === 'easy') {
        totalPairs = 8;
        gameBoard.className = 'board easy';
    } else {
        totalPairs = 18;
        gameBoard.className = 'board hard';
    }

    updateDisplay();
    winScreen.classList.add('hidden');

    // Crear cartas
    createCards();
}

function createCards() {
    // Seleccionar emojis aleatorios y duplicarlos
    const selectedEmojis = shuffle([...EMOJIS]).slice(0, totalPairs);
    cards = shuffle([...selectedEmojis, ...selectedEmojis]);

    // Limpiar tablero
    gameBoard.innerHTML = '';

    // Crear elementos de carta
    cards.forEach((emoji, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.emoji = emoji;
        card.dataset.index = index;

        card.innerHTML = `
            <div class="card-inner">
                <div class="card-back">❓</div>
                <div class="card-front">${emoji}</div>
            </div>
        `;

        card.addEventListener('click', () => flipCard(card));
        gameBoard.appendChild(card);
    });
}

// ===== Voltear carta =====
function flipCard(card) {
    // Ignorar si está bloqueado, ya está volteada o ya está emparejada
    if (isLocked) return;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;

    card.classList.add('flipped');
    flippedCards.push(card);

    if (flippedCards.length === 2) {
        moves++;
        updateDisplay();
        checkMatch();
    }
}

// ===== Verificar coincidencia =====
function checkMatch() {
    const [card1, card2] = flippedCards;
    const match = card1.dataset.emoji === card2.dataset.emoji;

    if (match) {
        // ¡Coincidencia!
        setTimeout(() => {
            card1.classList.add('matched');
            card2.classList.add('matched');
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            flippedCards = [];
            matchedPairs++;
            updateDisplay();

            // Verificar victoria
            if (matchedPairs === totalPairs) {
                setTimeout(showWin, 600);
            }
        }, 500);
    } else {
        // No coinciden, voltear de nuevo
        isLocked = true;
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            flippedCards = [];
            isLocked = false;
        }, 900);
    }
}

// ===== Mostrar victoria =====
function showWin() {
    clearInterval(timerInterval);

    const timeString = formatTime(seconds);
    document.getElementById('final-moves').innerText = moves;
    document.getElementById('final-time').innerText = timeString;

    // Verificar récord
    const key = `memory_${difficulty}`;
    const record = JSON.parse(localStorage.getItem(key)) || { moves: Infinity, time: Infinity };

    if (moves < record.moves || (moves === record.moves && seconds < record.time)) {
        localStorage.setItem(key, JSON.stringify({ moves, time: seconds }));
        document.getElementById('new-record').classList.remove('hidden');
    } else {
        document.getElementById('new-record').classList.add('hidden');
    }

    winScreen.classList.remove('hidden');
}

// ===== Utilidades =====
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function updateTimer() {
    seconds++;
    timerDisplay.innerText = formatTime(seconds);
}

function formatTime(secs) {
    const minutes = Math.floor(secs / 60);
    const remainingSeconds = secs % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function updateDisplay() {
    movesDisplay.innerText = moves;
    pairsDisplay.innerText = `${matchedPairs}/${totalPairs}`;
}

// ===== Iniciar al cargar =====
startGame();
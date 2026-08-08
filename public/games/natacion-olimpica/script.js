const c = document.getElementById('c');
const ctx = c.getContext('2d');
const W = c.width, H = c.height;

let gameRunning = false, gameOver = false;
let lastKey = '', tiempo = 0;
let turbo = false, turboTimer = 0;

const nadadores = [
    { nombre: 'TÚ', color: '#00bcd4', x: 50, velocidad: 0, energia: 100, brazada: 0, ritmo: 0, finished: false, tiempo: 0 },
    { nombre: 'USA', color: '#f44336', x: 50, velocidad: 0, energia: 100, brazada: 0, ritmo: 0.03, finished: false, tiempo: 0 },
    { nombre: 'AUS', color: '#4caf50', x: 50, velocidad: 0, energia: 100, brazada: 0, ritmo: 0.028, finished: false, tiempo: 0 },
    { nombre: 'CHN', color: '#ff9800', x: 50, velocidad: 0, energia: 100, brazada: 0, ritmo: 0.032, finished: false, tiempo: 0 }
];

function startGame() {
    document.getElementById('overlay').style.display = 'none';
    gameRunning = true; gameOver = false;
    tiempo = 0; lastKey = '';
    nadadores.forEach(n => {
        n.x = 50; n.velocidad = 0; n.energia = 100; n.brazada = 0; n.finished = false; n.tiempo = 0;
    });
}

window.addEventListener('keydown', e => {
    if (!gameRunning || gameOver) return;
    const key = e.key.toLowerCase();
    
    if ((key === 'a' || key === 'd') && key !== lastKey) {
        nadadores[0].velocidad += 1.8;
        nadadores[0].brazada++;
        nadadores[0].ritmo = Math.min(0.05, nadadores[0].ritmo + 0.005);
        lastKey = key;
        nadadores[0].energia = Math.max(0, nadadores[0].energia - 0.3);
    }
    
    if (e.code === 'Space' && nadadores[0].energia > 20 && !turbo) {
        turbo = true;
        turboTimer = 60;
        nadadores[0].energia -= 20;
        e.preventDefault();
    }
});

function update() {
    if (!gameRunning || gameOver) return;
    tiempo++;
    
    nadadores.forEach((n, i) => {
        if (n.finished) return;
        
        if (i > 0) {
            n.velocidad += n.ritmo * (1 + Math.sin(tiempo * 0.01 + i) * 0.3);
            n.brazada += 0.1;
        }
        
        if (i === 0 && turbo) {
            n.velocidad += 0.5;
            turboTimer--;
            if (turboTimer <= 0) turbo = false;
        }
        
        n.velocidad *= 0.96;
        n.x += n.velocidad;
        
        if (i === 0) n.ritmo = Math.max(0, n.ritmo - 0.001);
        if (i === 0) n.energia = Math.min(100, n.energia + 0.05);
        
        if (n.x >= W - 60) {
            n.finished = true;
            n.tiempo = (tiempo / 60).toFixed(2);
            n.x = W - 60;
        }
    });
    
    if (nadadores[0].finished && !gameOver) {
        gameOver = true;
        setTimeout(() => {
            const pos = nadadores.filter(n => n.tiempo > 0 && parseFloat(n.tiempo) <= parseFloat(nadadores[0].tiempo)).length;
            const overlay = document.getElementById('overlay');
            overlay.querySelector('h2').textContent = pos === 1 ? '🥇 ¡ORO!' : pos === 2 ? '🥈 ¡PLATA!' : pos === 3 ? '🥉 ¡BRONCE!' : '4° Lugar';
            overlay.querySelector('p').textContent = `Tu tiempo: ${nadadores[0].tiempo}s`;
            overlay.querySelector('button').textContent = 'Otra carrera';
            overlay.style.display = 'flex';
        }, 1000);
    }
}

function draw() {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0277bd');
    grad.addColorStop(1, '#01579b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    
    const laneH = H / 5;
    for (let i = 1; i < 5; i++) {
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(0, i * laneH);
        ctx.lineTo(W, i * laneH);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    for (let i = 1; i < 5; i++) {
        for (let x = 20; x < W; x += 30) {
            ctx.fillStyle = i % 2 === 0 ? '#f44336' : '#fff';
            ctx.beginPath();
            ctx.arc(x, i * laneH, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(W - 60, 0, 60, H);
    for (let y = 0; y < H; y += 15) {
        for (let x = W - 60; x < W; x += 15) {
            if ((Math.floor(x/15) + Math.floor(y/15)) % 2 === 0) {
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.fillRect(x, y, 15, 15);
            }
        }
    }
    
    nadadores.forEach((n, i) => {
        const y = (i + 0.5) * laneH;
        const brazo = Math.sin(n.brazada * 0.3) * 10;
        
        if (n.velocidad > 0.5) {
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.beginPath();
            ctx.moveTo(n.x - 15, y);
            ctx.lineTo(n.x - 30 - n.velocidad * 3, y - 5);
            ctx.lineTo(n.x - 30 - n.velocidad * 3, y + 5);
            ctx.fill();
        }
        
        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.ellipse(n.x, y, 15, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = n.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(n.x - 5, y - 5 + brazo);
        ctx.lineTo(n.x + 10, y - 12 + brazo);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(n.x - 5, y + 5 - brazo);
        ctx.lineTo(n.x + 10, y + 12 - brazo);
        ctx.stroke();
        
        ctx.fillStyle = '#ffcc80';
        ctx.beginPath();
        ctx.arc(n.x + 12, y, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.arc(n.x + 12, y - 1, 5, Math.PI, 0);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(n.nombre, n.x - 10, y - 15);
    });
    
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, 30);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Tiempo: ${(tiempo/60).toFixed(1)}s`, 10, 20);
    
    ctx.fillStyle = '#333';
    ctx.fillRect(W - 160, 8, 150, 14);
    ctx.fillStyle = nadadores[0].energia > 30 ? '#4caf50' : '#f44336';
    ctx.fillRect(W - 160, 8, nadadores[0].energia * 1.5, 14);
    ctx.fillStyle = '#fff';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ENERGÍA', W - 85, 19);
    
    if (turbo) {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ TURBO ⚡', W/2, H/2);
    }
    
    requestAnimationFrame(loop);
}

function loop() {
    update();
    draw();
}
loop();
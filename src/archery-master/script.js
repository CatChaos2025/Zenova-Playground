const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let arrow = { x: 50, y: 300, vx: 0, vy: 0, active: false, angle: 0 };
let target = { x: 500, y: 200, r: 30 };
let score = 0;
let power = 0;
let charging = false;
let gravity = 0.2;

canvas.addEventListener('mousedown', () => charging = true);
canvas.addEventListener('mouseup', () => {
    if (!arrow.active && charging) {
        arrow.vx = power * 0.8;
        arrow.vy = -power * 0.4; // Ángulo hacia arriba
        arrow.active = true;
        power = 0;
        charging = false;
    }
});

function update() {
    if (charging) power = Math.min(power + 0.5, 20);
    
    if (arrow.active) {
        arrow.x += arrow.vx;
        arrow.y += arrow.vy;
        arrow.vy += gravity;
        arrow.angle = Math.atan2(arrow.vy, arrow.vx);
        
        // Colisión con blanco
        let dist = Math.hypot(arrow.x - target.x, arrow.y - target.y);
        if (dist < target.r && arrow.vx > 0) {
            score += 10;
            resetArrow();
            moveTarget();
        }
        
        // Fuera de pantalla
        if (arrow.x > canvas.width || arrow.y > canvas.height) resetArrow();
    }
}

function resetArrow() {
    arrow.active = false;
    arrow.x = 50;
    arrow.y = 300;
    arrow.vx = 0;
    arrow.vy = 0;
}

function moveTarget() {
    target.y = 100 + Math.random() * 200;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Blanco
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(target.x, target.y, target.r, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'red';
    ctx.beginPath(); ctx.arc(target.x, target.y, target.r/2, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'yellow';
    ctx.beginPath(); ctx.arc(target.x, target.y, target.r/4, 0, Math.PI*2); ctx.fill();
    
    // Arco (jugador)
    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(50, 300, 30, -Math.PI/2, Math.PI/2); ctx.stroke();
    
    // Flecha
    ctx.save();
    ctx.translate(arrow.x, arrow.y);
    ctx.rotate(arrow.angle);
    ctx.fillStyle = 'black';
    ctx.fillRect(-15, -1, 30, 2);
    ctx.fillStyle = 'gray';
    ctx.beginPath(); ctx.moveTo(15, -3); ctx.lineTo(20, 0); ctx.lineTo(15, 3); ctx.fill();
    ctx.restore();
    
    // Barra de fuerza
    if (charging) {
        ctx.fillStyle = 'red';
        ctx.fillRect(50, 350, power * 2, 10);
        ctx.strokeStyle = 'black';
        ctx.strokeRect(50, 350, 40, 10);
    }
    
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText('Puntos: ' + score, 10, 30);
    
    requestAnimationFrame(loop);
}

function loop() {
    update();
    draw();
}
loop();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let player = { x: 175, y: 480, w: 50, h: 10 };
let cpu = { x: 175, y: 10, w: 50, h: 10 };
let ball = { x: 200, y: 250, vx: 3, vy: 3, r: 8 };
let pScore = 0, cScore = 0;

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    player.x = e.clientX - rect.left - player.w/2;
});

function update() {
    // Movimiento bola
    ball.x += ball.vx;
    ball.y += ball.vy;
    
    // Rebotes paredes
    if (ball.x < 0 || ball.x > canvas.width) ball.vx *= -1;
    
    // Rebote Paleta Jugador
    if (ball.y > player.y && ball.x > player.x && ball.x < player.x + player.w) {
        ball.vy *= -1.1; // Acelera
        ball.y = player.y - 10;
    }
    
    // Rebote Paleta CPU
    if (ball.y < cpu.y + cpu.h && ball.x > cpu.x && ball.x < cpu.x + cpu.w) {
        ball.vy *= -1.1;
        ball.y = cpu.y + cpu.h + 10;
    }
    
    // Puntos
    if (ball.y > canvas.height) { cScore++; resetBall(); }
    if (ball.y < 0) { pScore++; resetBall(); }
    
    // IA CPU simple
    if (cpu.x + cpu.w/2 < ball.x) cpu.x += 4;
    else cpu.x -= 4;
}

function resetBall() {
    ball.x = 200; ball.y = 250; ball.vx = 3 * (Math.random() > 0.5 ? 1 : -1); ball.vy = 3;
}

function draw() {
    // Cancha
    ctx.fillStyle = '#1565c0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = 'white';
    ctx.beginPath(); ctx.moveTo(0, 250); ctx.lineTo(400, 250); ctx.stroke();
    
    // Paletas
    ctx.fillStyle = 'white';
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.fillRect(cpu.x, cpu.y, cpu.w, cpu.h);
    
    // Bola
    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2); ctx.fill();
    
    // Marcador
    ctx.font = '30px Arial';
    ctx.fillText(cScore, 180, 40);
    ctx.fillText(pScore, 180, 470);
    
    requestAnimationFrame(loop);
}

function loop() {
    update();
    draw();
}
loop();
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const levelEl = document.getElementById('level');
const artworksEl = document.getElementById('artworks');
const alertBar = document.getElementById('alert-bar');
const overlay = document.getElementById('overlay');
const titleEl = document.getElementById('overlay-title');
const subEl = document.getElementById('overlay-subtitle');
const startBtn = document.getElementById('start-btn');

let W, H;
function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

let gameActive = false;
let currentLevel = 1;
let alert = 0;
let artworksCollected = 0;
let totalArtworks = 3;
let keys = {};
let frame = 0;

const player = {
    x: 100, y: 100,
    size: 12,
    speed: 3
};

let guards = [];
let lights = [];
let artworks = [];
let walls = [];
let particles = [];

const levels = [
    {
        name: "LA GALERÍA",
        guards: [
            {x: 400, y: 300, angle: 0, speed: 0, viewDist: 140, viewAngle: Math.PI/3, type: 'static'}
        ],
        lights: [
            {x: 300, y: 200, radius: 100, on: true},
            {x: 500, y: 400, radius: 100, on: true}
        ],
        artworks: [
            {x: 600, y: 200, collected: false},
            {x: 200, y: 400, collected: false},
            {x: 700, y: 500, collected: false}
        ],
        walls: [
            {x: 350, y: 250, w: 100, h: 20}
        ]
    },
    {
        name: "DOBLE VIGILANCIA",
        guards: [
            {x: 300, y: 200, angle: 0, speed: 0.02, viewDist: 130, viewAngle: Math.PI/3, type: 'patrol'},
            {x: 600, y: 400, angle: Math.PI, speed: -0.015, viewDist: 130, viewAngle: Math.PI/3, type: 'patrol'}
        ],
        lights: [
            {x: 200, y: 150, radius: 90, on: true},
            {x: 400, y: 300, radius: 90, on: true},
            {x: 600, y: 200, radius: 90, on: true}
        ],
        artworks: [
            {x: 150, y: 500, collected: false},
            {x: 700, y: 150, collected: false},
            {x: 400, y: 450, collected: false}
        ],
        walls: [
            {x: 250, y: 200, w: 150, h: 20},
            {x: 500, y: 300, w: 20, h: 150}
        ]
    },
    {
        name: "EL LABERINTO",
        guards: [
            {x: 200, y: 150, angle: 0, speed: 0.025, viewDist: 120, viewAngle: Math.PI/2.5, type: 'patrol'},
            {x: 600, y: 300, angle: Math.PI/2, speed: 0.02, viewDist: 120, viewAngle: Math.PI/2.5, type: 'patrol'},
            {x: 400, y: 500, angle: Math.PI, speed: -0.02, viewDist: 120, viewAngle: Math.PI/2.5, type: 'patrol'}
        ],
        lights: [
            {x: 150, y: 100, radius: 80, on: true},
            {x: 350, y: 200, radius: 80, on: true},
            {x: 550, y: 150, radius: 80, on: true},
            {x: 250, y: 400, radius: 80, on: true},
            {x: 650, y: 450, radius: 80, on: true}
        ],
        artworks: [
            {x: 100, y: 550, collected: false},
            {x: 700, y: 100, collected: false},
            {x: 400, y: 300, collected: false},
            {x: 200, y: 250, collected: false}
        ],
        walls: [
            {x: 150, y: 150, w: 200, h: 20},
            {x: 400, y: 150, w: 20, h: 150},
            {x: 200, y: 300, w: 150, h: 20},
            {x: 500, y: 250, w: 20, h: 200},
            {x: 300, y: 450, w: 200, h: 20}
        ]
    },
    {
        name: "LUCES DINÁMICAS",
        guards: [
            {x: 400, y: 300, angle: 0, speed: 0.03, viewDist: 150, viewAngle: Math.PI/3, type: 'patrol'},
            {x: 200, y: 500, angle: Math.PI/2, speed: -0.025, viewDist: 140, viewAngle: Math.PI/3, type: 'patrol'}
        ],
        lights: [
            {x: 200, y: 200, radius: 100, on: true, moving: true, moveRange: 100, moveSpeed: 0.02, axis: 'x'},
            {x: 600, y: 200, radius: 100, on: true, moving: true, moveRange: 80, moveSpeed: 0.015, axis: 'y'},
            {x: 400, y: 400, radius: 120, on: true, moving: false},
            {x: 700, y: 500, radius: 90, on: true, moving: true, moveRange: 120, moveSpeed: 0.025, axis: 'x'}
        ],
        artworks: [
            {x: 100, y: 100, collected: false},
            {x: 700, y: 100, collected: false},
            {x: 100, y: 550, collected: false},
            {x: 700, y: 550, collected: false},
            {x: 400, y: 300, collected: false}
        ],
        walls: [
            {x: 300, y: 200, w: 20, h: 200},
            {x: 500, y: 200, w: 20, h: 200}
        ]
    },
    {
        name: "ALTA SEGURIDAD",
        guards: [
            {x: 150, y: 150, angle: 0, speed: 0.02, viewDist: 130, viewAngle: Math.PI/3, type: 'patrol'},
            {x: 400, y: 150, angle: Math.PI/2, speed: 0.025, viewDist: 130, viewAngle: Math.PI/3, type: 'patrol'},
            {x: 650, y: 150, angle: Math.PI, speed: -0.02, viewDist: 130, viewAngle: Math.PI/3, type: 'patrol'},
            {x: 150, y: 450, angle: Math.PI/2, speed: 0.02, viewDist: 130, viewAngle: Math.PI/3, type: 'patrol'},
            {x: 400, y: 450, angle: Math.PI, speed: -0.025, viewDist: 130, viewAngle: Math.PI/3, type: 'patrol'},
            {x: 650, y: 450, angle: 0, speed: 0.02, viewDist: 130, viewAngle: Math.PI/3, type: 'patrol'}
        ],
        lights: [
            {x: 100, y: 100, radius: 70, on: true},
            {x: 300, y: 100, radius: 70, on: true},
            {x: 500, y: 100, radius: 70, on: true},
            {x: 700, y: 100, radius: 70, on: true},
            {x: 200, y: 300, radius: 70, on: true},
            {x: 400, y: 300, radius: 70, on: true},
            {x: 600, y: 300, radius: 70, on: true},
            {x: 100, y: 500, radius: 70, on: true},
            {x: 300, y: 500, radius: 70, on: true},
            {x: 500, y: 500, radius: 70, on: true},
            {x: 700, y: 500, radius: 70, on: true}
        ],
        artworks: [
            {x: 50, y: 50, collected: false},
            {x: 750, y: 50, collected: false},
            {x: 50, y: 550, collected: false},
            {x: 750, y: 550, collected: false}
        ],
        walls: [
            {x: 200, y: 200, w: 100, h: 20},
            {x: 400, y: 200, w: 100, h: 20},
            {x: 600, y: 200, w: 100, h: 20},
            {x: 200, y: 400, w: 100, h: 20},
            {x: 400, y: 400, w: 100, h: 20},
            {x: 600, y: 400, w: 100, h: 20}
        ]
    },
    {
        name: "EL GRAN ROBO",
        guards: [
            {x: 200, y: 100, angle: 0, speed: 0.03, viewDist: 140, viewAngle: Math.PI/2.5, type: 'patrol'},
            {x: 600, y: 100, angle: Math.PI, speed: -0.03, viewDist: 140, viewAngle: Math.PI/2.5, type: 'patrol'},
            {x: 400, y: 300, angle: Math.PI/2, speed: 0.025, viewDist: 160, viewAngle: Math.PI/2, type: 'patrol'},
            {x: 200, y: 500, angle: 0, speed: 0.02, viewDist: 140, viewAngle: Math.PI/2.5, type: 'patrol'},
            {x: 600, y: 500, angle: Math.PI, speed: -0.02, viewDist: 140, viewAngle: Math.PI/2.5, type: 'patrol'}
        ],
        lights: [
            {x: 100, y: 80, radius: 80, on: true, moving: true, moveRange: 100, moveSpeed: 0.02, axis: 'x'},
            {x: 400, y: 80, radius: 90, on: true},
            {x: 700, y: 80, radius: 80, on: true, moving: true, moveRange: 100, moveSpeed: 0.02, axis: 'x'},
            {x: 250, y: 250, radius: 70, on: true, moving: true, moveRange: 80, moveSpeed: 0.025, axis: 'y'},
            {x: 550, y: 250, radius: 70, on: true, moving: true, moveRange: 80, moveSpeed: 0.025, axis: 'y'},
            {x: 100, y: 400, radius: 80, on: true},
            {x: 400, y: 400, radius: 100, on: true},
            {x: 700, y: 400, radius: 80, on: true},
            {x: 250, y: 550, radius: 70, on: true, moving: true, moveRange: 90, moveSpeed: 0.02, axis: 'x'},
            {x: 550, y: 550, radius: 70, on: true, moving: true, moveRange: 90, moveSpeed: 0.02, axis: 'x'}
        ],
        artworks: [
            {x: 50, y: 50, collected: false},
            {x: 750, y: 50, collected: false},
            {x: 50, y: 550, collected: false},
            {x: 750, y: 550, collected: false},
            {x: 400, y: 300, collected: false},
            {x: 400, y: 50, collected: false}
        ],
        walls: [
            {x: 150, y: 150, w: 100, h: 20},
            {x: 350, y: 150, w: 100, h: 20},
            {x: 550, y: 150, w: 100, h: 20},
            {x: 200, y: 350, w: 20, h: 100},
            {x: 400, y: 350, w: 20, h: 100},
            {x: 600, y: 350, w: 20, h: 100},
            {x: 150, y: 450, w: 100, h: 20},
            {x: 350, y: 450, w: 100, h: 20},
            {x: 550, y: 450, w: 100, h: 20}
        ]
    }
];

window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if(e.code === 'Space' && gameActive) toggleLight();
    if(e.code === 'KeyR' && gameActive) loadLevel(currentLevel);
});
window.addEventListener('keyup', e => keys[e.code] = false);

startBtn.addEventListener('click', () => {
    if(!gameActive) startGame();
});

function startGame() {
    currentLevel = 1;
    overlay.classList.remove('active');
    loadLevel(currentLevel);
    gameActive = true;
    loop();
}

function loadLevel(lvl) {
    const data = levels[(lvl - 1) % levels.length];
    
    player.x = 50;
    player.y = 50;
    alert = 0;
    artworksCollected = 0;
    frame = 0;
    
    guards = data.guards.map(g => ({...g, originalX: g.x, originalY: g.y}));
    lights = data.lights.map(l => ({...l, originalX: l.x, originalY: l.y}));
    artworks = data.artworks.map(a => ({...a}));
    walls = data.walls.map(w => ({...w}));
    totalArtworks = artworks.length;
    
    levelEl.innerText = `${lvl} - ${data.name}`;
    updateUI();
}

function toggleLight() {
    let closest = null;
    let minDist = 120;
    
    lights.forEach(l => {
        if(l.on) {
            const dist = Math.hypot(l.x - player.x, l.y - player.y);
            if(dist < minDist) {
                minDist = dist;
                closest = l;
            }
        }
    });
    
    if(closest) {
        closest.on = false;
        alert = Math.min(100, alert + 15);
        createParticles(closest.x, closest.y, 12, '#ff0');
        updateUI();
    }
}

function createParticles(x, y, count, color) {
    for(let i=0; i<count; i++) {
        particles.push({
            x, y,
            vx: (Math.random()-0.5)*5,
            vy: (Math.random()-0.5)*5,
            life: 35,
            color,
            size: Math.random()*3+2
        });
    }
}

function isInLight(x, y) {
    for(let guard of guards) {
        const dx = x - guard.x;
        const dy = y - guard.y;
        const dist = Math.hypot(dx, dy);
        
        if(dist < guard.viewDist) {
            const angle = Math.atan2(dy, dx);
            let angleDiff = angle - guard.angle;
            while(angleDiff > Math.PI) angleDiff -= Math.PI*2;
            while(angleDiff < -Math.PI) angleDiff += Math.PI*2;
            
            if(Math.abs(angleDiff) < guard.viewAngle/2) {
                return true;
            }
        }
    }
    return false;
}

function update() {
    if(!gameActive) return;
    frame++;
    
    let dx = 0, dy = 0;
    if(keys['KeyW'] || keys['ArrowUp']) dy -= 1;
    if(keys['KeyS'] || keys['ArrowDown']) dy += 1;
    if(keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
    if(keys['KeyD'] || keys['ArrowRight']) dx += 1;
    
    if(dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy);
        dx /= len;
        dy /= len;
        
        const newX = player.x + dx * player.speed;
        const newY = player.y + dy * player.speed;
        
        if(!isInLight(newX, newY)) {
            player.x = newX;
            player.y = newY;
        } else {
            alert = Math.min(100, alert + 1.5);
        }
    }
    
    player.x = Math.max(player.size, Math.min(W - player.size, player.x));
    player.y = Math.max(player.size, Math.min(H - player.size, player.y));
    
    guards.forEach(g => {
        if(g.type === 'patrol') {
            g.angle += g.speed;
        }
    });
    
    lights.forEach(l => {
        if(l.moving && l.on) {
            if(l.axis === 'x') {
                l.x = l.originalX + Math.sin(frame * l.moveSpeed) * l.moveRange;
            } else if(l.axis === 'y') {
                l.y = l.originalY + Math.sin(frame * l.moveSpeed) * l.moveRange;
            }
        }
    });
    
    artworks.forEach(a => {
        if(!a.collected) {
            const dist = Math.hypot(a.x - player.x, a.y - player.y);
            if(dist < 30) {
                a.collected = true;
                artworksCollected++;
                createParticles(a.x, a.y, 25, '#0ff');
                updateUI();
                
                if(artworksCollected >= totalArtworks) {
                    winLevel();
                }
            }
        }
    });
    
    if(alert >= 100) {
        gameOver();
    }
    
    alert = Math.max(0, alert - 0.08);
    updateUI();
    
    particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.95; p.vy *= 0.95;
        p.life--;
    });
    particles = particles.filter(p => p.life > 0);
}

function winLevel() {
    gameActive = false;
    if(currentLevel >= levels.length) {
        titleEl.innerText = "¡MAESTRO LADRÓN!";
        subEl.innerText = "Completaste todos los niveles. Eres invisible.";
        startBtn.innerText = "VOLVER AL INICIO";
        startBtn.onclick = () => {
            currentLevel = 1;
            overlay.classList.remove('active');
            loadLevel(currentLevel);
            gameActive = true;
            loop();
        };
    } else {
        titleEl.innerText = "¡NIVEL COMPLETADO!";
        subEl.innerText = `${levels[currentLevel-1].name} superado`;
        startBtn.innerText = "SIGUIENTE NIVEL";
        startBtn.onclick = () => {
            currentLevel++;
            overlay.classList.remove('active');
            loadLevel(currentLevel);
            gameActive = true;
            loop();
        };
    }
    overlay.classList.add('active');
}

function gameOver() {
    gameActive = false;
    titleEl.innerText = "¡TE DETECTARON!";
    subEl.innerText = `Nivel ${currentLevel}: ${levels[currentLevel-1].name}`;
    startBtn.innerText = "REINTENTAR";
    overlay.classList.add('active');
    
    startBtn.onclick = () => {
        overlay.classList.remove('active');
        loadLevel(currentLevel);
        gameActive = true;
        loop();
    };
}

function updateUI() {
    artworksEl.innerText = `${artworksCollected}/${totalArtworks}`;
    alertBar.style.width = alert + '%';
}

function draw() {
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, W, H);
    
    ctx.fillStyle = '#1a1a2e';
    walls.forEach(w => {
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.strokeStyle = '#2a2a4e';
        ctx.lineWidth = 2;
        ctx.strokeRect(w.x, w.y, w.w, w.h);
    });
    
    lights.forEach(l => {
        if(l.on) {
            const gradient = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.radius);
            gradient.addColorStop(0, 'rgba(255,255,200,0.25)');
            gradient.addColorStop(1, 'rgba(255,255,200,0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(l.x, l.y, l.radius, 0, Math.PI*2);
            ctx.fill();
            
            ctx.fillStyle = '#ff0';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ff0';
            ctx.beginPath();
            ctx.arc(l.x, l.y, 8, 0, Math.PI*2);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            if(l.moving) {
                ctx.strokeStyle = 'rgba(255,255,0,0.3)';
                ctx.setLineDash([5,5]);
                ctx.beginPath();
                ctx.arc(l.originalX, l.originalY, l.moveRange, 0, Math.PI*2);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
    });
    
    guards.forEach(g => {
        ctx.fillStyle = 'rgba(255,50,50,0.12)';
        ctx.beginPath();
        ctx.moveTo(g.x, g.y);
        ctx.arc(g.x, g.y, g.viewDist, g.angle - g.viewAngle/2, g.angle + g.viewAngle/2);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#f00';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#f00';
        ctx.beginPath();
        ctx.arc(g.x, g.y, 10, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });
    
    artworks.forEach(a => {
        if(!a.collected) {
            ctx.fillStyle = '#0ff';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#0ff';
            ctx.fillRect(a.x - 15, a.y - 20, 30, 40);
            ctx.shadowBlur = 0;
            
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.strokeRect(a.x - 15, a.y - 20, 30, 40);
        }
    });
    
    const inLight = isInLight(player.x, player.y);
    ctx.fillStyle = inLight ? '#f00' : '#0f0';
    ctx.shadowBlur = 15;
    ctx.shadowColor = ctx.fillStyle;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    particles.forEach(p => {
        ctx.globalAlpha = p.life / 35;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

function loop() {
    update();
    draw();
    if(gameActive) requestAnimationFrame(loop);
}

draw();
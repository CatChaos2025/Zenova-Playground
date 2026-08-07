// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    
    // UI Elements
    const moneyEl = document.getElementById('moneyVal');
    const waveEl = document.getElementById('waveVal');
    const livesEl = document.getElementById('livesVal');
    const startScreen = document.getElementById('startScreen');
    const gameOverScreen = document.getElementById('gameOverScreen');
    const finalWaveEl = document.getElementById('finalWave');
    const startBtn = document.getElementById('startBtn');
    const restartBtn = document.getElementById('restartBtn');
    const towerBtns = document.querySelectorAll('.tower-btn');
    
    // Game State
    let gameState = 'MENU';
    let money = 100;
    let lives = 20;
    let wave = 1;
    let enemies = [];
    let towers = [];
    let projectiles = [];
    let particles = [];
    let selectedTowerType = 'basic';
    let spawnTimer = 0;
    let enemiesToSpawn = 0;
    let spawnInterval = 60;
    let mouseX = 0, mouseY = 0;
    
    // Path definition
    const PATH = [
        {x: 0, y: 100}, {x: 200, y: 100}, {x: 200, y: 300}, 
        {x: 400, y: 300}, {x: 400, y: 100}, {x: 600, y: 100}, 
        {x: 600, y: 400}, {x: 800, y: 400}
    ];
    
    // Tower definitions
    const TOWER_TYPES = {
        basic: { cost: 50, range: 120, damage: 10, fireRate: 30, color: '#0ff', projectileSpeed: 8 },
        sniper: { cost: 100, range: 250, damage: 50, fireRate: 90, color: '#f0f', projectileSpeed: 15 },
        rapid: { cost: 150, range: 100, damage: 5, fireRate: 10, color: '#ff0', projectileSpeed: 10 },
        aoe: { cost: 200, range: 130, damage: 20, fireRate: 60, color: '#f80', projectileSpeed: 6, aoeRadius: 60 }
    };
    
    // Input handling
    canvas.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        mouseX = (e.clientX - rect.left) * (W / rect.width);
        mouseY = (e.clientY - rect.top) * (H / rect.height);
    });
    
    canvas.addEventListener('click', placeTower);
    
    canvas.addEventListener('touchstart', e => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        mouseX = (e.touches[0].clientX - rect.left) * (W / rect.width);
        mouseY = (e.touches[0].clientY - rect.top) * (H / rect.height);
        placeTower();
    }, {passive: false});
    
    // Tower selection
    towerBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            selectedTowerType = type;
            towerBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });
    
    // Classes
    class Enemy {
        constructor(waveNum) {
            this.pathIndex = 0;
            this.x = PATH[0].x;
            this.y = PATH[0].y;
            this.hp = 20 + (waveNum * 10);
            this.maxHp = this.hp;
            this.speed = 1 + (waveNum * 0.1);
            this.radius = 12;
            this.color = `hsl(${(waveNum * 30) % 360}, 70%, 50%)`;
            this.reward = 5 + Math.floor(waveNum / 2);
        }
        
        update() {
            if (this.pathIndex >= PATH.length - 1) return false;
            
            const target = PATH[this.pathIndex + 1];
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const dist = Math.hypot(dx, dy);
            
            if (dist < this.speed) {
                this.x = target.x;
                this.y = target.y;
                this.pathIndex++;
            } else {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
            }
            return true;
        }
        
        draw() {
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // Health bar
            const hpPercent = Math.max(0, this.hp / this.maxHp);
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x - 15, this.y - 20, 30, 4);
            ctx.fillStyle = hpPercent > 0.5 ? '#0f0' : hpPercent > 0.25 ? '#ff0' : '#f00';
            ctx.fillRect(this.x - 15, this.y - 20, 30 * hpPercent, 4);
        }
        
        takeDamage(amount) {
            this.hp -= amount;
            if (this.hp <= 0) {
                createParticles(this.x, this.y, this.color, 10);
                money += this.reward;
                updateHUD();
                return true;
            }
            return false;
        }
    }
    
    class Tower {
        constructor(x, y, type) {
            this.x = x;
            this.y = y;
            this.type = type;
            const stats = TOWER_TYPES[type];
            this.range = stats.range;
            this.damage = stats.damage;
            this.fireRate = stats.fireRate;
            this.color = stats.color;
            this.projectileSpeed = stats.projectileSpeed;
            this.aoeRadius = stats.aoeRadius || 0;
            this.cooldown = 0;
            this.angle = 0;
        }
        
        update() {
            if (this.cooldown > 0) this.cooldown--;
            
            let target = null;
            let minDist = Infinity;
            
            for (let enemy of enemies) {
                const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                if (dist <= this.range && dist < minDist) {
                    minDist = dist;
                    target = enemy;
                }
            }
            
            if (target) {
                this.angle = Math.atan2(target.y - this.y, target.x - this.x);
                
                if (this.cooldown <= 0) {
                    this.shoot(target);
                    this.cooldown = this.fireRate;
                }
            }
        }
        
        shoot(target) {
            projectiles.push(new Projectile(
                this.x, this.y, target, 
                this.damage, this.projectileSpeed, 
                this.color, this.aoeRadius
            ));
        }
        
        draw() {
            const distToMouse = Math.hypot(mouseX - this.x, mouseY - this.y);
            if (distToMouse < 30) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x - 15, this.y - 15, 30, 30);
            
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, -3, 20, 6);
            ctx.restore();
            ctx.shadowBlur = 0;
        }
    }
    
    class Projectile {
        constructor(x, y, target, damage, speed, color, aoeRadius) {
            this.x = x;
            this.y = y;
            this.target = target;
            this.damage = damage;
            this.speed = speed;
            this.color = color;
            this.aoeRadius = aoeRadius;
            this.active = true;
        }
        
        update() {
            if (!this.target || !enemies.includes(this.target)) {
                this.active = false;
                return;
            }
            
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const dist = Math.hypot(dx, dy);
            
            if (dist < this.speed) {
                if (this.aoeRadius > 0) {
                    enemies.forEach(enemy => {
                        if (Math.hypot(enemy.x - this.x, enemy.y - this.y) <= this.aoeRadius) {
                            if (enemy.takeDamage(this.damage)) {
                                const idx = enemies.indexOf(enemy);
                                if (idx > -1) enemies.splice(idx, 1);
                            }
                        }
                    });
                    createParticles(this.x, this.y, this.color, 20);
                } else {
                    if (this.target.takeDamage(this.damage)) {
                        const idx = enemies.indexOf(this.target);
                        if (idx > -1) enemies.splice(idx, 1);
                    }
                }
                this.active = false;
            } else {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
            }
        }
        
        draw() {
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
    
    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.color = color;
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            this.dx = Math.cos(angle) * speed;
            this.dy = Math.sin(angle) * speed;
            this.life = 1;
            this.decay = Math.random() * 0.05 + 0.03;
            this.size = Math.random() * 4 + 2;
        }
        
        update() {
            this.x += this.dx;
            this.y += this.dy;
            this.life -= this.decay;
        }
        
        draw() {
            ctx.globalAlpha = Math.max(0, this.life);
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.size, this.size);
            ctx.globalAlpha = 1;
        }
    }
    
    // Functions
    function createParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            particles.push(new Particle(x, y, color));
        }
    }
    
    function placeTower() {
        if (gameState !== 'PLAYING') return;
        
        const towerData = TOWER_TYPES[selectedTowerType];
        if (money < towerData.cost) return;
        
        // Check if on path
        let onPath = false;
        for (let i = 0; i < PATH.length - 1; i++) {
            const p1 = PATH[i], p2 = PATH[i+1];
            const A = mouseX - p1.x, B = mouseY - p1.y;
            const C = p2.x - p1.x, D = p2.y - p1.y;
            const dot = A * C + B * D;
            const lenSq = C * C + D * D;
            let param = lenSq !== 0 ? dot / lenSq : -1;
            let xx, yy;
            if (param < 0) { xx = p1.x; yy = p1.y; }
            else if (param > 1) { xx = p2.x; yy = p2.y; }
            else { xx = p1.x + param * C; yy = p1.y + param * D; }
            const dist = Math.hypot(mouseX - xx, mouseY - yy);
            if (dist < 30) { onPath = true; break; }
        }
        
        // Check distance to other towers
        let tooClose = false;
        for (let tower of towers) {
            if (Math.hypot(mouseX - tower.x, mouseY - tower.y) < 40) {
                tooClose = true; break;
            }
        }
        
        if (!onPath && !tooClose) {
            towers.push(new Tower(mouseX, mouseY, selectedTowerType));
            money -= towerData.cost;
            updateHUD();
            createParticles(mouseX, mouseY, '#fff', 15);
        }
    }
    
    function startWave() {
        enemiesToSpawn = 5 + (wave * 2);
        spawnInterval = Math.max(20, 60 - wave * 2);
        spawnTimer = 0;
    }
    
    function updateHUD() {
        moneyEl.textContent = money;
        waveEl.textContent = wave;
        livesEl.textContent = lives;
    }
    
    function startGame() {
        money = 100;
        lives = 20;
        wave = 1;
        enemies = [];
        towers = [];
        projectiles = [];
        particles = [];
        gameState = 'PLAYING';
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        updateHUD();
        startWave();
    }
    
    function update() {
        if (gameState !== 'PLAYING') return;
        
        // Spawn enemies
        if (enemiesToSpawn > 0) {
            spawnTimer++;
            if (spawnTimer >= spawnInterval) {
                enemies.push(new Enemy(wave));
                enemiesToSpawn--;
                spawnTimer = 0;
            }
        } else if (enemies.length === 0) {
            wave++;
            money += 20 + (wave * 5);
            updateHUD();
            startWave();
        }
        
        // Update enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
            if (!enemies[i].update()) {
                // Enemy reached base
                lives--;
                enemies.splice(i, 1);
                updateHUD();
                if (lives <= 0) {
                    gameState = 'GAMEOVER';
                    finalWaveEl.textContent = wave;
                    gameOverScreen.classList.remove('hidden');
                }
            }
        }
        
        towers.forEach(t => t.update());
        
        projectiles = projectiles.filter(p => {
            p.update();
            return p.active;
        });
        
        particles = particles.filter(p => {
            p.update();
            return p.life > 0;
        });
    }
    
    function draw() {
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, W, H);
        
        // Draw path
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.3)';
        ctx.lineWidth = 40;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(PATH[0].x, PATH[0].y);
        for (let i = 1; i < PATH.length; i++) {
            ctx.lineTo(PATH[i].x, PATH[i].y);
        }
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(PATH[0].x, PATH[0].y);
        for (let i = 1; i < PATH.length; i++) {
            ctx.lineTo(PATH[i].x, PATH[i].y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw base
        const base = PATH[PATH.length - 1];
        ctx.fillStyle = '#0f0';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#0f0';
        ctx.fillRect(base.x - 20, base.y - 20, 40, 40);
        ctx.shadowBlur = 0;
        
        // Draw entities
        towers.forEach(t => t.draw());
        enemies.forEach(e => e.draw());
        projectiles.forEach(p => p.draw());
        particles.forEach(p => p.draw());
        
        // Draw placement preview
        if (gameState === 'PLAYING') {
            const towerData = TOWER_TYPES[selectedTowerType];
            const canPlace = money >= towerData.cost;
            
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = canPlace ? towerData.color : '#f00';
            ctx.fillRect(mouseX - 15, mouseY - 15, 30, 30);
            
            ctx.strokeStyle = canPlace ? 'rgba(255,255,255,0.3)' : 'rgba(255,0,0,0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(mouseX, mouseY, towerData.range, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }
    
    function loop() {
        update();
        draw();
        requestAnimationFrame(loop);
    }
    
    // Event listeners for buttons
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);
    
    // Start the game loop
    loop();
    
});
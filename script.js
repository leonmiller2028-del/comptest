// Game Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Game State
let gameState = 'start'; // 'start', 'playing', 'gameover'
let score = 0;
let lives = 3;
let wave = 1;
let keys = {};
let enemies = [];
let bullets = [];
let enemyBullets = [];
let particles = [];
let lastEnemySpawn = 0;
let lastEnemyShot = 0;

// Player
const player = {
    x: canvas.width / 2,
    y: canvas.height - 80,
    width: 30,
    height: 30,
    speed: 5,
    lastShot: 0,
    shootCooldown: 250
};

// Input Handling
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    keys[e.code] = true;
    
    if (e.code === 'Space' && gameState === 'playing') {
        e.preventDefault();
        shootBullet();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    keys[e.code] = false;
});

// Start Game
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);

function startGame() {
    gameState = 'playing';
    score = 0;
    lives = 3;
    wave = 1;
    enemies = [];
    bullets = [];
    enemyBullets = [];
    particles = [];
    player.x = canvas.width / 2;
    player.y = canvas.height - 80;
    
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOver').classList.add('hidden');
    
    updateHUD();
    gameLoop();
}

// Update HUD
function updateHUD() {
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    document.getElementById('wave').textContent = wave;
}

// Player Movement
function updatePlayer() {
    if (keys['ArrowLeft'] || keys['a']) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight'] || keys['d']) {
        player.x += player.speed;
    }
    if (keys['ArrowUp'] || keys['w']) {
        player.y -= player.speed;
    }
    if (keys['ArrowDown'] || keys['s']) {
        player.y += player.speed;
    }
    
    // Keep player in bounds
    player.x = Math.max(player.width, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(player.height, Math.min(canvas.height - player.height, player.y));
}

// Draw Player (Spaceship)
function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    
    // Ship body
    ctx.fillStyle = '#0ff';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#0ff';
    
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(-12, 15);
    ctx.lineTo(0, 10);
    ctx.lineTo(12, 15);
    ctx.closePath();
    ctx.fill();
    
    // Cockpit
    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Engine glow
    ctx.fillStyle = '#f80';
    ctx.shadowColor = '#f80';
    ctx.beginPath();
    ctx.arc(-8, 12, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(8, 12, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// Shooting
function shootBullet() {
    const now = Date.now();
    if (now - player.lastShot > player.shootCooldown) {
        bullets.push({
            x: player.x,
            y: player.y - 20,
            width: 4,
            height: 12,
            speed: 8,
            damage: 1
        });
        player.lastShot = now;
    }
}

// Update Bullets
function updateBullets() {
    bullets = bullets.filter(bullet => {
        bullet.y -= bullet.speed;
        return bullet.y > -bullet.height;
    });
    
    enemyBullets = enemyBullets.filter(bullet => {
        bullet.y += bullet.speed;
        return bullet.y < canvas.height + bullet.height;
    });
}

// Draw Bullets
function drawBullets() {
    ctx.shadowBlur = 15;
    
    // Player bullets
    ctx.fillStyle = '#0ff';
    ctx.shadowColor = '#0ff';
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height);
    });
    
    // Enemy bullets
    ctx.fillStyle = '#f00';
    ctx.shadowColor = '#f00';
    enemyBullets.forEach(bullet => {
        ctx.fillRect(bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height);
    });
}

// Enemy Management
function spawnEnemy() {
    const now = Date.now();
    const spawnRate = Math.max(1000 - wave * 50, 300);
    
    if (now - lastEnemySpawn > spawnRate && enemies.length < 10 + wave) {
        const type = Math.random() < 0.7 ? 'basic' : 'fast';
        enemies.push({
            x: Math.random() * (canvas.width - 40) + 20,
            y: -30,
            width: 25,
            height: 25,
            speed: type === 'fast' ? 2 + wave * 0.2 : 1 + wave * 0.1,
            health: type === 'fast' ? 1 : 2,
            type: type,
            movePattern: Math.random() < 0.5 ? 'straight' : 'zigzag',
            offset: Math.random() * Math.PI * 2
        });
        lastEnemySpawn = now;
    }
}

// Update Enemies
function updateEnemies() {
    enemies.forEach(enemy => {
        if (enemy.movePattern === 'zigzag') {
            enemy.x += Math.sin(enemy.offset) * 2;
            enemy.offset += 0.1;
        }
        enemy.y += enemy.speed;
        
        // Keep in bounds
        enemy.x = Math.max(enemy.width, Math.min(canvas.width - enemy.width, enemy.x));
    });
    
    // Enemy shooting
    const now = Date.now();
    if (now - lastEnemyShot > 2000 - wave * 100) {
        enemies.forEach(enemy => {
            if (Math.random() < 0.1 && enemy.y > 50) {
                enemyBullets.push({
                    x: enemy.x,
                    y: enemy.y + 15,
                    width: 4,
                    height: 10,
                    speed: 4
                });
            }
        });
        lastEnemyShot = now;
    }
    
    // Remove off-screen enemies
    enemies = enemies.filter(enemy => {
        if (enemy.y > canvas.height + 50) {
            lives--;
            updateHUD();
            if (lives <= 0) {
                gameOver();
            }
            return false;
        }
        return true;
    });
}

// Draw Enemies
function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        
        if (enemy.type === 'fast') {
            // Fast enemy (red)
            ctx.fillStyle = '#f00';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#f00';
            
            ctx.beginPath();
            ctx.moveTo(0, 15);
            ctx.lineTo(-12, -15);
            ctx.lineTo(0, -10);
            ctx.lineTo(12, -15);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = '#ff0';
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Basic enemy (green)
            ctx.fillStyle = '#0f0';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#0f0';
            
            ctx.beginPath();
            ctx.moveTo(0, 15);
            ctx.lineTo(-10, -15);
            ctx.lineTo(0, -10);
            ctx.lineTo(10, -15);
            ctx.closePath();
            ctx.fill();
            
            // Wings
            ctx.fillRect(-15, 0, 10, 3);
            ctx.fillRect(5, 0, 10, 3);
        }
        
        ctx.restore();
    });
}

// Collision Detection
function checkCollisions() {
    // Bullet hits enemy
    bullets.forEach((bullet, bIndex) => {
        enemies.forEach((enemy, eIndex) => {
            if (bullet.x > enemy.x - enemy.width / 2 &&
                bullet.x < enemy.x + enemy.width / 2 &&
                bullet.y > enemy.y - enemy.height / 2 &&
                bullet.y < enemy.y + enemy.height / 2) {
                
                enemy.health--;
                bullets.splice(bIndex, 1);
                
                if (enemy.health <= 0) {
                    score += enemy.type === 'fast' ? 20 : 10;
                    createExplosion(enemy.x, enemy.y, enemy.type === 'fast' ? '#f00' : '#0f0');
                    enemies.splice(eIndex, 1);
                    updateHUD();
                    
                    // Check wave completion
                    if (enemies.length === 0 && score > 0 && score % 100 === 0) {
                        wave++;
                        updateHUD();
                    }
                }
            }
        });
    });
    
    // Enemy bullet hits player
    enemyBullets.forEach((bullet, index) => {
        if (bullet.x > player.x - player.width / 2 &&
            bullet.x < player.x + player.width / 2 &&
            bullet.y > player.y - player.height / 2 &&
            bullet.y < player.y + player.height / 2) {
            
            lives--;
            enemyBullets.splice(index, 1);
            createExplosion(player.x, player.y, '#0ff');
            updateHUD();
            
            if (lives <= 0) {
                gameOver();
            }
        }
    });
    
    // Enemy hits player
    enemies.forEach((enemy, index) => {
        if (Math.abs(enemy.x - player.x) < (enemy.width + player.width) / 2 &&
            Math.abs(enemy.y - player.y) < (enemy.height + player.height) / 2) {
            
            lives--;
            createExplosion(enemy.x, enemy.y, enemy.type === 'fast' ? '#f00' : '#0f0');
            enemies.splice(index, 1);
            updateHUD();
            
            if (lives <= 0) {
                gameOver();
            }
        }
    });
}

// Particle Effects
function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 1,
            decay: 0.02,
            color: color,
            size: Math.random() * 4 + 2
        });
    }
}

function updateParticles() {
    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        return p.life > 0;
    });
}

function drawParticles() {
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.restore();
    });
}

// Stars Background
const stars = [];
for (let i = 0; i < 100; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: Math.random() * 2 + 0.5,
        size: Math.random() * 2 + 1
    });
}

function drawStars() {
    ctx.fillStyle = '#fff';
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });
}

// Game Over
function gameOver() {
    gameState = 'gameover';
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').classList.remove('hidden');
}

// Game Loop
function gameLoop() {
    if (gameState !== 'playing') return;
    
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw stars
    drawStars();
    
    // Update
    updatePlayer();
    spawnEnemy();
    updateEnemies();
    updateBullets();
    checkCollisions();
    updateParticles();
    
    // Draw
    drawParticles();
    drawEnemies();
    drawBullets();
    drawPlayer();
    
    requestAnimationFrame(gameLoop);
}

// Handle window resize
window.addEventListener('resize', () => {
    resizeCanvas();
    player.x = Math.min(player.x, canvas.width);
    player.y = Math.min(player.y, canvas.height);
});

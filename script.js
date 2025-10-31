// Game canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Game state
let gameState = 'start'; // 'start', 'playing', 'gameover'
let score = 0;
let lives = 3;
let gameFrame = 0;

// Player
const player = {
    x: canvas.width / 2 - 15,
    y: canvas.height - 60,
    width: 30,
    height: 30,
    speed: 5,
    color: '#00ffff'
};

// Bullets
const bullets = [];
const bulletSpeed = 8;

// Enemies
const enemies = [];
let enemySpawnRate = 60;
let enemySpeed = 2;

// Particles
const particles = [];

// Input handling
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') e.preventDefault();
    
    if (gameState === 'start' && e.key === ' ') {
        gameState = 'playing';
        document.getElementById('startScreen').classList.add('hidden');
    }
    
    if (gameState === 'gameover' && e.key === ' ') {
        resetGame();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Reset game
function resetGame() {
    gameState = 'playing';
    score = 0;
    lives = 3;
    gameFrame = 0;
    bullets.length = 0;
    enemies.length = 0;
    particles.length = 0;
    player.x = canvas.width / 2 - 15;
    player.y = canvas.height - 60;
    enemySpawnRate = 60;
    enemySpeed = 2;
    document.getElementById('gameOver').classList.add('hidden');
    document.getElementById('startScreen').classList.add('hidden');
    updateUI();
}

// Update UI
function updateUI() {
    document.getElementById('scoreValue').textContent = score;
    document.getElementById('livesValue').textContent = lives;
}

// Create particle
function createParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 30,
            color: color
        });
    }
}

// Player shooting
function shoot() {
    bullets.push({
        x: player.x + player.width / 2,
        y: player.y,
        width: 4,
        height: 10
    });
}

// Spawn enemy
function spawnEnemy() {
    enemies.push({
        x: Math.random() * (canvas.width - 30),
        y: -30,
        width: 30,
        height: 30,
        speed: enemySpeed + Math.random() * 1,
        color: '#ff00ff'
    });
}

// Collision detection
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Update game
function update() {
    if (gameState !== 'playing') return;
    
    gameFrame++;
    
    // Player movement
    if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
    if (keys['ArrowUp'] && player.y > 0) {
        player.y -= player.speed;
    }
    if (keys['ArrowDown'] && player.y < canvas.height - player.height) {
        player.y += player.speed;
    }
    
    // Shooting
    if (keys[' '] && gameFrame % 10 === 0) {
        shoot();
    }
    
    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bulletSpeed;
        
        // Remove bullets that are off screen
        if (bullets[i].y < 0) {
            bullets.splice(i, 1);
            continue;
        }
        
        // Check bullet-enemy collisions
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (checkCollision(bullets[i], enemies[j])) {
                createParticles(enemies[j].x + enemies[j].width / 2, 
                               enemies[j].y + enemies[j].height / 2, '#ffff00');
                enemies.splice(j, 1);
                bullets.splice(i, 1);
                score += 10;
                updateUI();
                break;
            }
        }
    }
    
    // Spawn enemies
    if (gameFrame % enemySpawnRate === 0) {
        spawnEnemy();
    }
    
    // Increase difficulty
    if (gameFrame % 600 === 0) {
        enemySpawnRate = Math.max(30, enemySpawnRate - 5);
        enemySpeed += 0.3;
    }
    
    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].y += enemies[i].speed;
        
        // Check enemy-player collision
        if (checkCollision(enemies[i], player)) {
            createParticles(player.x + player.width / 2, 
                           player.y + player.height / 2, '#00ffff');
            enemies.splice(i, 1);
            lives--;
            updateUI();
            
            if (lives <= 0) {
                gameState = 'gameover';
                document.getElementById('finalScore').textContent = score;
                document.getElementById('gameOver').classList.remove('hidden');
            }
            break;
        }
        
        // Remove enemies that are off screen
        if (enemies[i].y > canvas.height) {
            enemies.splice(i, 1);
        }
    }
    
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].x += particles[i].vx;
        particles[i].y += particles[i].vy;
        particles[i].life--;
        
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// Draw functions
function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Draw glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.shadowBlur = 0;
}

function drawBullets() {
    ctx.fillStyle = '#00ff00';
    for (let bullet of bullets) {
        ctx.fillRect(bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height);
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ff00';
        ctx.fillRect(bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height);
        ctx.shadowBlur = 0;
    }
}

function drawEnemies() {
    for (let enemy of enemies) {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        ctx.shadowBlur = 15;
        ctx.shadowColor = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        ctx.shadowBlur = 0;
    }
}

function drawParticles() {
    for (let particle of particles) {
        const alpha = particle.life / 30;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
        ctx.globalAlpha = 1;
    }
}

function drawBackground() {
    // Starfield effect
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
        const x = (i * 37) % canvas.width;
        const y = (i * 53 + gameFrame * 0.5) % canvas.height;
        ctx.globalAlpha = Math.sin(gameFrame * 0.1 + i) * 0.5 + 0.5;
        ctx.fillRect(x, y, 2, 2);
    }
    ctx.globalAlpha = 1;
}

// Render
function render() {
    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    drawBackground();
    
    if (gameState === 'playing') {
        drawPlayer();
        drawBullets();
        drawEnemies();
        drawParticles();
    }
}

// Game loop
function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// Start game loop
gameLoop();
updateUI();

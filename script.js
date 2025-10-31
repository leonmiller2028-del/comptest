const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const HUD = {
    score: document.getElementById('score'),
    wave: document.getElementById('wave'),
    shield: document.getElementById('shield'),
    multiplier: document.getElementById('multiplier'),
    multiplierStat: document.querySelector('[data-indicator="multiplier"]')
};

const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const pauseButton = document.getElementById('pauseButton');
const muteButton = document.getElementById('muteButton');
const menuOverlay = document.getElementById('menuOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const finalScore = document.getElementById('finalScore');
const finalWave = document.getElementById('finalWave');

const WORLD = { width: canvas.width, height: canvas.height };

const input = {
    up: false,
    down: false,
    left: false,
    right: false,
    fire: false,
    dashRequested: false,
    overdriveRequested: false,
    pointerFiring: false
};

let animationId = null;

const player = {
    x: WORLD.width / 2,
    y: WORLD.height - 90,
    radius: 18,
    speed: 260,
    dashSpeed: 620,
    dashTimer: 0,
    dashCooldownTimer: 0,
    invulnerableTimer: 0,
    fireTimer: 0,
    baseFireDelay: 0.18,
    shield: 100,
    maxShield: 120,
    powerCoreTimer: 0,
    heat: 0
};

const state = {
    running: false,
    paused: false,
    lastTime: 0,
    score: 0,
    wave: 1,
    enemiesToSpawn: 0,
    spawnTimer: 1.2,
    spawnInterval: 1.2,
    multiplier: 1,
    multiplierTimer: 0,
    overdriveCharge: 0,
    overdriveReady: false,
    soundEnabled: true,
    banner: null
};

const stars = [];
const playerLasers = [];
const enemyLasers = [];
const enemies = [];
const particles = [];
const powerups = [];

const randomBetween = (min, max) => Math.random() * (max - min) + min;

for (let i = 0; i < 120; i += 1) {
    stars.push(createStar(randomBetween(0, WORLD.height)));
}

function createStar(y = -10) {
    return {
        x: Math.random() * WORLD.width,
        y,
        size: randomBetween(0.8, 2.8),
        speed: randomBetween(35, 120),
        hue: randomBetween(170, 220)
    };
}

const audioEngine = {
    context: null,
    master: null
};

function ensureAudioContext() {
    if (!audioEngine.context) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) {
            state.soundEnabled = false;
            muteButton?.setAttribute('aria-pressed', 'true');
            return;
        }
        audioEngine.context = new AudioCtx();
        audioEngine.master = audioEngine.context.createGain();
        audioEngine.master.gain.value = 0.18;
        audioEngine.master.connect(audioEngine.context.destination);
    }
}

function playSFX({ frequency = 440, type = 'square', duration = 0.12, volume = 0.4, sweep = 0 }) {
    if (!state.soundEnabled) return;
    ensureAudioContext();
    if (!audioEngine.context) return;

    const ctxAudio = audioEngine.context;
    const osc = ctxAudio.createOscillator();
    const gain = ctxAudio.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    osc.frequency.setValueAtTime(frequency, ctxAudio.currentTime);
    if (sweep !== 0) {
        osc.frequency.linearRampToValueAtTime(frequency + sweep, ctxAudio.currentTime + duration);
    }
    gain.gain.value = volume;
    gain.gain.setValueAtTime(volume, ctxAudio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctxAudio.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioEngine.master);
    osc.start();
    osc.stop(ctxAudio.currentTime + duration);
}

function resetGameState() {
    player.x = WORLD.width / 2;
    player.y = WORLD.height - 90;
    player.dashTimer = 0;
    player.dashCooldownTimer = 0;
    player.invulnerableTimer = 1.2;
    player.fireTimer = 0;
    player.powerCoreTimer = 0;
    player.shield = 100;

    state.score = 0;
    state.wave = 1;
    state.enemiesToSpawn = 8;
    state.spawnInterval = 1.1;
    state.spawnTimer = 1.5;
    state.multiplier = 1;
    state.multiplierTimer = 0;
    state.overdriveCharge = 0;
    state.overdriveReady = false;
    state.banner = createBanner('Wave 1', 2.2);

    stars.splice(0, stars.length);
    for (let i = 0; i < 120; i += 1) {
        stars.push(createStar(randomBetween(0, WORLD.height)));
    }

    playerLasers.length = 0;
    enemyLasers.length = 0;
    enemies.length = 0;
    particles.length = 0;
    powerups.length = 0;

    updateHUD();
}

function createBanner(text, duration = 2) {
    return {
        text,
        timer: duration,
        opacity: 1
    };
}

function startGame() {
    ensureAudioContext();
    if (audioEngine.context && audioEngine.context.state === 'suspended') {
        audioEngine.context.resume();
    }

    menuOverlay.classList.remove('visible');
    gameOverOverlay.classList.remove('visible');
    gameOverOverlay.setAttribute('hidden', 'true');
    pauseButton.setAttribute('aria-pressed', 'false');

    input.up = false;
    input.down = false;
    input.left = false;
    input.right = false;
    input.fire = false;
    input.pointerFiring = false;
    input.dashRequested = false;
    input.overdriveRequested = false;

    state.running = true;
    state.paused = false;
    state.lastTime = performance.now();

    resetGameState();

    cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(gameLoop);
}

function endGame() {
    state.running = false;
    cancelAnimationFrame(animationId);
    finalScore.textContent = state.score.toLocaleString();
    finalWave.textContent = state.wave.toString();
    gameOverOverlay.removeAttribute('hidden');
    gameOverOverlay.classList.add('visible');
    playSFX({ frequency: 160, duration: 0.5, type: 'sawtooth', volume: 0.3, sweep: -120 });
}

function togglePause(forceState) {
    if (!state.running) return;
    const newState = typeof forceState === 'boolean' ? forceState : !state.paused;
    state.paused = newState;
    pauseButton.setAttribute('aria-pressed', newState ? 'true' : 'false');
    if (!newState && audioEngine.context && audioEngine.context.state === 'suspended' && state.soundEnabled) {
        audioEngine.context.resume();
    }
    if (!newState) {
        state.lastTime = performance.now();
    }
}

function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    muteButton.setAttribute('aria-pressed', state.soundEnabled ? 'false' : 'true');
    if (!state.soundEnabled && audioEngine.context) {
        audioEngine.context.suspend();
    } else if (state.soundEnabled && audioEngine.context) {
        audioEngine.context.resume();
    }
}

function gameLoop(timestamp) {
    if (!state.running) return;

    const delta = Math.min((timestamp - state.lastTime) / 1000, 0.035);
    state.lastTime = timestamp;

    if (!state.paused) {
        update(delta);
    }
    render();

    animationId = requestAnimationFrame(gameLoop);
}

function update(delta) {
    updateStars(delta);
    updatePlayer(delta);
    updateEnemies(delta);
    updatePlayerLasers(delta);
    updateEnemyLasers(delta);
    updatePowerups(delta);
    updateParticles(delta);
    handleCollisions();
    updateWaveLogic(delta);
    updateMultipliers(delta);
    updateHUD();
    cleanArrays();
}

function updateStars(delta) {
    for (const star of stars) {
        star.y += star.speed * delta;
        if (star.y > WORLD.height + 6) {
            star.y = -6;
            star.x = Math.random() * WORLD.width;
            star.speed = randomBetween(35, 120);
            star.size = randomBetween(0.8, 2.8);
        }
    }
}

function updatePlayer(delta) {
    const dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);

    let speed = player.speed;
    if (player.dashTimer > 0) {
        player.dashTimer -= delta;
        speed = player.dashSpeed;
    }
    if (player.dashCooldownTimer > 0) {
        player.dashCooldownTimer -= delta;
    }
    if (player.invulnerableTimer > 0) {
        player.invulnerableTimer -= delta;
    }
    if (player.powerCoreTimer > 0) {
        player.powerCoreTimer -= delta;
    }

    const magnitude = Math.hypot(dx, dy) || 1;
    player.x += (dx / magnitude) * speed * delta;
    player.y += (dy / magnitude) * speed * delta;

    player.x = Math.min(Math.max(player.radius + 4, player.x), WORLD.width - player.radius - 4);
    player.y = Math.min(Math.max(player.radius + 4, player.y), WORLD.height - player.radius - 6);

    if (input.dashRequested && player.dashCooldownTimer <= 0) {
        player.dashTimer = 0.28;
        player.invulnerableTimer = 0.36;
        player.dashCooldownTimer = 2.1;
        input.dashRequested = false;
        spawnDashParticles();
        playSFX({ frequency: 520, type: 'sawtooth', duration: 0.18, sweep: 180, volume: 0.28 });
    }

    if (player.fireTimer > 0) {
        player.fireTimer -= delta;
    }

    const firing = input.fire || input.pointerFiring;
    if (firing && player.fireTimer <= 0) {
        firePlayerWeapon();
    }
}

function updateEnemies(delta) {
    for (const enemy of enemies) {
        enemy.age += delta;
        enemy.y += enemy.speed * delta;
        enemy.x += Math.sin(enemy.age * enemy.wobbleFrequency) * enemy.wobbleMagnitude * delta;

        if (enemy.pattern === 'zigzag') {
            enemy.x += Math.sin((enemy.age + enemy.seed) * 6) * 90 * delta;
        } else if (enemy.pattern === 'slinger') {
            enemy.x += Math.cos((enemy.age + enemy.seed) * 3) * 70 * delta;
        }

        if (enemy.shoots) {
            enemy.fireTimer -= delta;
            if (enemy.fireTimer <= 0 && enemy.y > 40) {
                enemy.fireTimer = randomBetween(enemy.fireRate * 0.7, enemy.fireRate * 1.2);
                fireEnemyLaser(enemy);
            }
        }

        if (enemy.y - enemy.radius > WORLD.height + 30) {
            enemy.dead = true;
            damagePlayer(12);
        }
    }
}

function updatePlayerLasers(delta) {
    for (const laser of playerLasers) {
        laser.y += laser.vy * delta;
        laser.x += laser.vx * delta;
        laser.life -= delta;
        if (laser.y < -20 || laser.life <= 0) {
            laser.dead = true;
        }
    }
}

function updateEnemyLasers(delta) {
    for (const bolt of enemyLasers) {
        bolt.x += bolt.vx * delta;
        bolt.y += bolt.vy * delta;
        bolt.life -= delta;
        if (bolt.y > WORLD.height + 20 || bolt.life <= 0) {
            bolt.dead = true;
        }
    }
}

function updatePowerups(delta) {
    for (const core of powerups) {
        core.y += core.speed * delta;
        core.rotation += core.spin * delta;
        if (core.y > WORLD.height + 40) {
            core.dead = true;
        }
    }
}

function updateParticles(delta) {
    for (const particle of particles) {
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        particle.life -= delta;
        particle.vx *= 0.98;
        particle.vy *= 0.98;
        if (particle.life <= 0) {
            particle.dead = true;
        }
    }
}

function handleCollisions() {
    for (const laser of playerLasers) {
        if (laser.dead) continue;
        for (const enemy of enemies) {
            if (enemy.dead) continue;
            const dx = laser.x - enemy.x;
            const dy = laser.y - enemy.y;
            const distance = Math.hypot(dx, dy);
            if (distance < enemy.radius + laser.hitRadius) {
                enemy.hp -= laser.damage;
                laser.dead = true;
                spawnHitParticles(enemy.x, enemy.y, enemy.palette.primary);
                if (enemy.hp <= 0) {
                    destroyEnemy(enemy);
                }
                break;
            }
        }
    }

    for (const bolt of enemyLasers) {
        if (bolt.dead) continue;
        const dx = bolt.x - player.x;
        const dy = bolt.y - player.y;
        const distance = Math.hypot(dx, dy);
        if (distance < player.radius + bolt.radius) {
            bolt.dead = true;
            if (player.invulnerableTimer <= 0) {
                damagePlayer(bolt.damage);
            }
        }
    }

    for (const enemy of enemies) {
        if (enemy.dead) continue;
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const distance = Math.hypot(dx, dy);
        if (distance < enemy.radius + player.radius - 6) {
            enemy.dead = true;
            destroyEnemy(enemy, { silentScore: true });
            if (player.invulnerableTimer <= 0) {
                damagePlayer(24);
            }
        }
    }

    for (const core of powerups) {
        if (core.dead) continue;
        const dx = core.x - player.x;
        const dy = core.y - player.y;
        const distance = Math.hypot(dx, dy);
        if (distance < player.radius + 16) {
            core.dead = true;
            applyPowerup(core);
        }
    }
}

function damagePlayer(amount) {
    state.multiplier = 1;
    state.multiplierTimer = 0;
    player.shield -= amount;
    HUD.multiplierStat?.setAttribute('data-ready', 'false');
    spawnHitParticles(player.x, player.y, '#ff4f9f', 24);
    playSFX({ frequency: 220, type: 'sawtooth', duration: 0.28, sweep: -180, volume: 0.32 });
    if (player.shield <= 0) {
        player.shield = 0;
        endGame();
    }
}

function firePlayerWeapon() {
    player.fireTimer = player.powerCoreTimer > 0 ? player.baseFireDelay * 0.65 : player.baseFireDelay;
    const spread = player.powerCoreTimer > 0 ? 12 : 6;
    const bolts = player.powerCoreTimer > 0 ? 4 : 2;
    const damage = player.powerCoreTimer > 0 ? 24 : 14;
    const speed = player.powerCoreTimer > 0 ? -720 : -620;
    const colors = player.powerCoreTimer > 0 ? ['#ffe066', '#6cf7f1'] : ['#6cf7f1'];

    for (let i = 0; i < bolts; i += 1) {
        const offset = (i - (bolts - 1) / 2) * spread;
        playerLasers.push({
            x: player.x + offset,
            y: player.y - player.radius,
            vx: 0,
            vy: speed,
            hitRadius: 8,
            damage,
            color: colors[i % colors.length],
            life: 1.1,
            dead: false
        });
    }

    spawnMuzzleFlash();
    playSFX({ frequency: 760, type: 'triangle', duration: 0.12, sweep: 120, volume: 0.22 });
}

function fireEnemyLaser(enemy) {
    const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
    const speed = 260 + state.wave * 6;
    enemyLasers.push({
        x: enemy.x,
        y: enemy.y + enemy.radius * 0.4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 7,
        damage: 16,
        color: enemy.palette.secondary,
        life: 4,
        dead: false
    });
    playSFX({ frequency: 320, type: 'square', duration: 0.16, sweep: -80, volume: 0.18 });
}

function destroyEnemy(enemy, options = {}) {
    enemy.dead = true;
    spawnExplosion(enemy.x, enemy.y, enemy.palette.primary, enemy.palette.secondary);

    if (!options.silentScore) {
        const baseScore = Math.round(90 + enemy.maxHp * 3 + state.wave * 12);
        state.score += Math.floor(baseScore * Math.max(state.multiplier, 1));
        state.multiplier = Math.min(state.multiplier + 1, 15);
        state.multiplierTimer = 4;
        if (!options.skipCharge) {
            state.overdriveCharge = Math.min(state.overdriveCharge + (enemy.elite ? 3 : 1), 12);
            if (state.overdriveCharge >= 12) {
                state.overdriveReady = true;
                state.banner = state.banner ?? createBanner('Overdrive Ready', 2.2);
                HUD.multiplierStat?.setAttribute('data-ready', 'true');
                playSFX({ frequency: 640, type: 'triangle', duration: 0.3, sweep: 80, volume: 0.35 });
            }
        }
    }

    if (enemy.elite && Math.random() < 0.6) {
        powerups.push({
            x: enemy.x,
            y: enemy.y,
            speed: 90,
            rotation: 0,
            spin: randomBetween(2, 4),
            dead: false,
            type: Math.random() > 0.5 ? 'shield' : 'core'
        });
    }
}

function spawnDashParticles() {
    for (let i = 0; i < 18; i += 1) {
        particles.push({
            x: player.x,
            y: player.y,
            vx: randomBetween(-220, 220),
            vy: randomBetween(-220, 220),
            life: randomBetween(0.25, 0.4),
            color: '#6cf7f1',
            dead: false
        });
    }
}

function spawnMuzzleFlash() {
    particles.push({
        x: player.x,
        y: player.y - player.radius,
        vx: 0,
        vy: -90,
        life: 0.18,
        color: '#ffe066',
        dead: false
    });
}

function spawnHitParticles(x, y, color, amount = 12) {
    for (let i = 0; i < amount; i += 1) {
        particles.push({
            x,
            y,
            vx: randomBetween(-180, 180),
            vy: randomBetween(-180, 180),
            life: randomBetween(0.2, 0.45),
            color,
            dead: false
        });
    }
}

function spawnExplosion(x, y, primary, secondary) {
    for (let i = 0; i < 24; i += 1) {
        particles.push({
            x,
            y,
            vx: randomBetween(-260, 260),
            vy: randomBetween(-260, 260),
            life: randomBetween(0.35, 0.6),
            color: i % 2 === 0 ? primary : secondary,
            dead: false
        });
    }
    playSFX({ frequency: 280, type: 'triangle', duration: 0.24, sweep: -200, volume: 0.32 });
}

function applyPowerup(core) {
    if (core.type === 'shield') {
        player.shield = Math.min(player.maxShield, player.shield + 25);
        state.banner = createBanner('Shield Boost', 1.6);
        playSFX({ frequency: 520, type: 'sine', duration: 0.4, sweep: 160, volume: 0.28 });
    } else {
        player.powerCoreTimer = 8;
        state.banner = createBanner('Core Loaded', 1.6);
        playSFX({ frequency: 880, type: 'sawtooth', duration: 0.3, sweep: -80, volume: 0.24 });
    }
}

function updateWaveLogic(delta) {
    if (state.enemiesToSpawn > 0) {
        state.spawnTimer -= delta;
        if (state.spawnTimer <= 0) {
            state.spawnTimer = Math.max(state.spawnInterval - state.wave * 0.05, 0.45);
            spawnEnemy();
            state.enemiesToSpawn -= 1;
        }
    } else if (enemies.length === 0 && state.spawnTimer <= 0) {
        state.wave += 1;
        state.enemiesToSpawn = Math.round(8 + state.wave * 2.8);
        state.spawnTimer = 2.4;
        state.spawnInterval = Math.max(0.7, state.spawnInterval * 0.95);
        state.banner = createBanner(`Wave ${state.wave}`, 2.2);
        playSFX({ frequency: 700, duration: 0.4, type: 'triangle', sweep: 120, volume: 0.3 });
    } else {
        state.spawnTimer -= delta;
    }
}

function spawnEnemy() {
    const typeRoll = Math.random();
    let enemy;
    if (typeRoll < 0.55) {
        enemy = createEnemy('scout');
    } else if (typeRoll < 0.82) {
        enemy = createEnemy('slinger');
    } else {
        enemy = createEnemy('brute');
    }
    enemies.push(enemy);
}

function createEnemy(type) {
    const baseX = randomBetween(40, WORLD.width - 40);
    const waveFactor = 1 + state.wave * 0.12;

    if (type === 'scout') {
        return {
            type,
            x: baseX,
            y: -30,
            radius: 18,
            hp: 40 * waveFactor,
            maxHp: 40 * waveFactor,
            speed: 120 + state.wave * 8,
            wobbleMagnitude: 90,
            wobbleFrequency: 2.4,
            seed: Math.random() * Math.PI,
            pattern: 'zigzag',
            shoots: state.wave > 3 && Math.random() > 0.7,
            fireTimer: randomBetween(1, 2.4),
            fireRate: 2.2,
            age: 0,
            palette: { primary: '#6cf7f1', secondary: '#ffe066' },
            elite: false,
            dead: false
        };
    }

    if (type === 'slinger') {
        return {
            type,
            x: baseX,
            y: -40,
            radius: 24,
            hp: 65 * waveFactor,
            maxHp: 65 * waveFactor,
            speed: 90 + state.wave * 6,
            wobbleMagnitude: 40,
            wobbleFrequency: 1.6,
            seed: Math.random() * Math.PI,
            pattern: 'slinger',
            shoots: true,
            fireTimer: randomBetween(0.8, 1.6),
            fireRate: 1.6,
            age: 0,
            palette: { primary: '#ff4f9f', secondary: '#6cf7f1' },
            elite: state.wave > 4 && Math.random() > 0.6,
            dead: false
        };
    }

    return {
        type,
        x: baseX,
        y: -60,
        radius: 34,
        hp: 160 * waveFactor,
        maxHp: 160 * waveFactor,
        speed: 60 + state.wave * 4,
        wobbleMagnitude: 28,
        wobbleFrequency: 1.1,
        seed: Math.random() * Math.PI,
        pattern: 'drift',
        shoots: true,
        fireTimer: randomBetween(0.6, 1.3),
        fireRate: 1.1,
        age: 0,
        palette: { primary: '#ffe066', secondary: '#ff4f9f' },
        elite: true,
        dead: false
    };
}

function updateMultipliers(delta) {
    if (state.multiplier > 1) {
        state.multiplierTimer -= delta;
        if (state.multiplierTimer <= 0) {
            state.multiplier = Math.max(1, state.multiplier - 1);
            state.multiplierTimer = state.multiplier > 1 ? 2 : 0;
        }
    }

    if (state.overdriveReady && input.overdriveRequested) {
        triggerOverdrive();
        input.overdriveRequested = false;
    }
}

function triggerOverdrive() {
    state.overdriveCharge = 0;
    state.overdriveReady = false;
    HUD.multiplierStat?.setAttribute('data-ready', 'false');
    state.banner = createBanner('Overdrive Surge', 2.4);
    for (const enemy of enemies) {
        destroyEnemy(enemy, { silentScore: false, skipCharge: true });
    }
    enemies.length = 0;
    playSFX({ frequency: 880, type: 'sawtooth', duration: 0.45, sweep: 420, volume: 0.36 });
}

function updateHUD() {
    if (HUD.score) {
        HUD.score.textContent = state.score.toLocaleString();
    }
    if (HUD.wave) {
        HUD.wave.textContent = state.wave.toString();
    }
    if (HUD.shield) {
        HUD.shield.textContent = Math.max(0, Math.round(player.shield)).toString();
    }
    if (HUD.multiplier) {
        const value = Number.isInteger(state.multiplier)
            ? state.multiplier.toFixed(0)
            : state.multiplier.toFixed(1);
        HUD.multiplier.textContent = `${value}x`;
    }
    if (HUD.multiplierStat) {
        HUD.multiplierStat.setAttribute('data-ready', state.overdriveReady ? 'true' : 'false');
    }
}

function render() {
    ctx.save();
    ctx.fillStyle = '#05060f';
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);

    renderStars();
    renderParticles();
    renderPlayerLasers();
    renderEnemyLasers();
    renderEnemies();
    renderPowerups();
    renderPlayer();

    if (state.banner) {
        state.banner.timer -= 1 / 60;
        if (state.banner.timer <= 0) {
            state.banner = null;
        } else {
            ctx.save();
            const alpha = Math.min(1, state.banner.timer);
            ctx.globalAlpha = alpha;
            ctx.font = '700 32px Rajdhani, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(108, 247, 241, 0.9)';
            ctx.fillText(state.banner.text, WORLD.width / 2, WORLD.height * 0.24);
            ctx.restore();
        }
    }

    if (state.paused) {
        ctx.save();
        ctx.fillStyle = 'rgba(5, 6, 15, 0.65)';
        ctx.fillRect(0, 0, WORLD.width, WORLD.height);
        ctx.font = '700 40px Rajdhani, sans-serif';
        ctx.fillStyle = 'rgba(255, 224, 102, 0.9)';
        ctx.textAlign = 'center';
        ctx.fillText('Paused', WORLD.width / 2, WORLD.height / 2);
        ctx.restore();
    }

    ctx.restore();
}

function renderStars() {
    ctx.save();
    for (const star of stars) {
        ctx.fillStyle = `hsla(${star.hue}, 100%, 85%, 0.85)`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function renderPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    const glowAlpha = player.invulnerableTimer > 0 ? 0.6 : 0.25;
    const gradient = ctx.createRadialGradient(0, 0, 6, 0, 0, player.radius * 1.8);
    gradient.addColorStop(0, `rgba(108, 247, 241, ${glowAlpha})`);
    gradient.addColorStop(1, 'rgba(108, 247, 241, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, player.radius * 1.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, -player.radius);
    ctx.lineTo(player.radius * 0.7, player.radius);
    ctx.lineTo(-player.radius * 0.7, player.radius);
    ctx.closePath();
    ctx.fillStyle = '#0ef7ff';
    ctx.fill();

    ctx.lineWidth = player.invulnerableTimer > 0 ? 3 : 2;
    ctx.strokeStyle = player.invulnerableTimer > 0 ? '#ffe066' : '#ff4f9f';
    ctx.stroke();

    ctx.restore();
}

function renderEnemies() {
    for (const enemy of enemies) {
        if (enemy.dead) continue;
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        const baseScale = enemy.radius / 22;
        ctx.scale(baseScale, baseScale);
        ctx.rotate(Math.sin((enemy.age + enemy.seed) * 2) * 0.25);

        ctx.fillStyle = `${enemy.palette.secondary}cc`;
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 28, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = enemy.palette.primary;
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(18, 16);
        ctx.lineTo(-18, 16);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#05060f';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }
}

function renderPlayerLasers() {
    ctx.save();
    for (const laser of playerLasers) {
        if (laser.dead) continue;
        ctx.fillStyle = laser.color;
        ctx.beginPath();
        ctx.moveTo(laser.x - 2, laser.y - 12);
        ctx.lineTo(laser.x + 2, laser.y - 12);
        ctx.lineTo(laser.x + 2, laser.y + 6);
        ctx.lineTo(laser.x - 2, laser.y + 6);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
}

function renderEnemyLasers() {
    ctx.save();
    for (const bolt of enemyLasers) {
        if (bolt.dead) continue;
        ctx.fillStyle = bolt.color;
        ctx.beginPath();
        ctx.arc(bolt.x, bolt.y, bolt.radius, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function renderPowerups() {
    for (const core of powerups) {
        if (core.dead) continue;
        ctx.save();
        ctx.translate(core.x, core.y);
        ctx.rotate(core.rotation);
        ctx.strokeStyle = core.type === 'shield' ? '#6cf7f1' : '#ffe066';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-10, -10);
        ctx.lineTo(10, -10);
        ctx.lineTo(10, 10);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

function renderParticles() {
    ctx.save();
    for (const particle of particles) {
        if (particle.dead) continue;
        const alpha = Math.max(0, particle.life * 2);
        ctx.fillStyle = applyAlpha(particle.color, alpha);
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function applyAlpha(color, alpha) {
    if (color.startsWith('#')) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
}

function cleanArrays() {
    const clean = (arr) => {
        for (let i = arr.length - 1; i >= 0; i -= 1) {
            if (arr[i].dead) arr.splice(i, 1);
        }
    };
    clean(playerLasers);
    clean(enemyLasers);
    clean(enemies);
    clean(particles);
    clean(powerups);
}

function handleKeyDown(event) {
    if (event.repeat) {
        if (event.code === 'Space') event.preventDefault();
        return;
    }
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            input.up = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            input.down = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            input.left = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            input.right = true;
            break;
        case 'Space':
            input.fire = true;
            event.preventDefault();
            break;
        case 'ShiftLeft':
        case 'ShiftRight':
            input.dashRequested = true;
            break;
        case 'KeyE':
            input.overdriveRequested = true;
            break;
        case 'Escape':
            togglePause();
            break;
        default:
            break;
    }
}

function handleKeyUp(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            input.up = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            input.down = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            input.left = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            input.right = false;
            break;
        case 'Space':
            input.fire = false;
            break;
        case 'KeyE':
            input.overdriveRequested = false;
            break;
        default:
            break;
    }
}

function handlePointerDown(event) {
    if (event.pointerType === 'mouse' || event.pointerType === 'pen' || event.pointerType === 'touch') {
        input.pointerFiring = true;
        ensureAudioContext();
        if (audioEngine.context && audioEngine.context.state === 'suspended' && state.soundEnabled) {
            audioEngine.context.resume();
        }
    }
}

function handlePointerUp() {
    input.pointerFiring = false;
}

function bindEvents() {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);

    startButton?.addEventListener('click', startGame);
    restartButton?.addEventListener('click', () => {
        startGame();
    });
    pauseButton?.addEventListener('click', () => togglePause());
    muteButton?.addEventListener('click', toggleSound);

    menuOverlay?.classList.add('visible');
}

bindEvents();

function init() {
    render();
}

init();

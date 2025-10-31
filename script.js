/* Retro Blaster - 2D Shooter */
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const hudScore = document.getElementById('score');
  const hudLives = document.getElementById('lives');
  const overlay = document.getElementById('overlay');
  const startBtn = document.getElementById('startBtn');

  // Fixed internal resolution; CSS scales it responsively
  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  // Input
  const keys = new Set();
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
    keys.add(e.key.toLowerCase());
  });
  window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

  // Audio (WebAudio beeps)
  let audioCtx;
  function playBeep(freq = 440, dur = 0.08, type = 'square', gain = 0.04) {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.value = gain; o.connect(g); g.connect(audioCtx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
      o.stop(audioCtx.currentTime + dur);
    } catch {}
  }

  // Utilities
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const chance = (p) => Math.random() < p;

  // Entities
  class Player {
    constructor() {
      this.x = WIDTH * 0.15; this.y = HEIGHT * 0.5;
      this.speed = 260; this.cooldown = 0; this.lives = 3;
      this.radius = 12;
    }
    update(dt) {
      let dx = 0, dy = 0;
      if (keys.has('arrowup') || keys.has('w')) dy -= 1;
      if (keys.has('arrowdown') || keys.has('s')) dy += 1;
      if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
      if (keys.has('arrowright') || keys.has('d')) dx += 1;
      const len = Math.hypot(dx, dy) || 1;
      this.x = clamp(this.x + (dx/len) * this.speed * dt, 16, WIDTH - 16);
      this.y = clamp(this.y + (dy/len) * this.speed * dt, 16, HEIGHT - 16);
      this.cooldown = Math.max(0, this.cooldown - dt);
      if ((keys.has(' ') || keys.has('space')) && this.cooldown <= 0) {
        bullets.push(new Bullet(this.x + 16, this.y, 520));
        this.cooldown = 0.12;
        playBeep(820, 0.05, 'square', 0.03);
      }
    }
    draw() {
      // Ship: triangle + glow
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.fillStyle = '#66ffcc';
      ctx.shadowColor = '#66ffcc';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(-12, -10);
      ctx.lineTo(-12, 10);
      ctx.closePath();
      ctx.fill();
      // cockpit
      ctx.shadowBlur = 0; ctx.fillStyle = '#1aff8c';
      ctx.fillRect(-2, -3, 6, 6);
      ctx.restore();
    }
  }

  class Bullet {
    constructor(x, y, vx) { this.x = x; this.y = y; this.vx = vx; this.radius = 3; this.alive = true; }
    update(dt) { this.x += this.vx * dt; if (this.x > WIDTH + 20) this.alive = false; }
    draw() {
      ctx.save(); ctx.fillStyle = '#ffff66'; ctx.shadowColor = '#ffff66'; ctx.shadowBlur = 8;
      ctx.fillRect(this.x - 2, this.y - 2, 6, 4); ctx.restore();
    }
  }

  class Enemy {
    constructor(y, speed, hp, color) {
      this.x = WIDTH + 20; this.y = y; this.vx = -speed; this.hp = hp; this.color = color; this.radius = 12;
      this.time = 0; this.alive = true;
    }
    update(dt) {
      this.time += dt; this.x += this.vx * dt; this.y += Math.sin(this.time * 3) * 20 * dt;
      if (this.x < -40) this.alive = false;
      // occasional shooting
      if (chance(0.005)) enemyBullets.push(new EnemyBullet(this.x - 12, this.y + rand(-6,6), -280));
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.fillStyle = this.color; ctx.shadowColor = this.color; ctx.shadowBlur = 10;
      ctx.fillRect(-12, -10, 20, 20);
      ctx.fillStyle = '#000'; ctx.fillRect(0, -4, 6, 8);
      ctx.restore();
    }
  }

  class EnemyBullet {
    constructor(x, y, vx) { this.x = x; this.y = y; this.vx = vx; this.radius = 3; this.alive = true; }
    update(dt) { this.x += this.vx * dt; if (this.x < -20) this.alive = false; }
    draw() {
      ctx.save(); ctx.fillStyle = '#ff6688'; ctx.shadowColor = '#ff6688'; ctx.shadowBlur = 8;
      ctx.fillRect(this.x - 2, this.y - 2, 4, 4); ctx.restore();
    }
  }

  class Particle {
    constructor(x, y, color) {
      this.x = x; this.y = y; this.vx = rand(-120,120); this.yv = rand(-120,120); this.life = rand(0.2, 0.5); this.color = color;
    }
    update(dt) { this.x += this.vx * dt; this.y += this.yv * dt; this.life -= dt; }
    draw() { ctx.globalAlpha = Math.max(0, this.life * 2); ctx.fillStyle = this.color; ctx.fillRect(this.x, this.y, 2, 2); ctx.globalAlpha = 1; }
  }

  // Game state
  let player, bullets, enemies, enemyBullets, particles, score, wave, paused, gameOver;

  function resetGame() {
    player = new Player();
    bullets = []; enemies = []; enemyBullets = []; particles = [];
    score = 0; wave = 1; paused = false; gameOver = false;
    updateHUD();
    spawnWave();
  }

  function updateHUD() {
    hudScore.textContent = String(score).padStart(6, '0');
    hudLives.textContent = String(player.lives);
  }

  function spawnWave() {
    const count = 4 + wave;
    for (let i = 0; i < count; i++) {
      const y = rand(40, HEIGHT - 40);
      const speed = rand(120, 160) + wave * 6;
      const hp = 1 + Math.floor(wave/3);
      const color = ['#ff6699', '#ffcc66', '#66aaff'][i % 3];
      setTimeout(() => enemies.push(new Enemy(y, speed, hp, color)), i * 220);
    }
  }

  function aabbCircleHit(ax, ay, aw, ah, cx, cy, r) {
    const nx = clamp(cx, ax, ax + aw); const ny = clamp(cy, ay, ay + ah);
    const dx = cx - nx, dy = cy - ny; return dx*dx + dy*dy <= r*r;
  }

  function circleHit(x1,y1,r1,x2,y2,r2) {
    const dx = x1 - x2, dy = y1 - y2; return dx*dx + dy*dy <= (r1 + r2)*(r1 + r2);
  }

  // Game Loop
  let last = 0; function loop(ts) {
    const dt = Math.min(0.033, (ts - last) / 1000 || 0); last = ts;
    if (!paused && !gameOver) update(dt);
    render();
    requestAnimationFrame(loop);
  }

  function update(dt) {
    player.update(dt);

    bullets.forEach(b => b.update(dt));
    enemies.forEach(e => e.update(dt));
    enemyBullets.forEach(b => b.update(dt));
    particles.forEach(p => p.update(dt));

    // Bullet vs enemy
    for (const b of bullets) {
      if (!b.alive) continue;
      for (const e of enemies) {
        if (!e.alive) continue;
        if (circleHit(b.x, b.y, b.radius, e.x, e.y, e.radius + 4)) {
          b.alive = false; e.hp -= 1; score += 10; updateHUD();
          particles.push(...Array.from({length: 12}, () => new Particle(e.x, e.y, e.color)));
          playBeep(240, 0.07, 'sawtooth', 0.03);
          if (e.hp <= 0) { e.alive = false; score += 40; updateHUD(); playBeep(120, 0.1, 'triangle', 0.04); }
          break;
        }
      }
    }

    // Enemy bullet vs player
    for (const eb of enemyBullets) {
      if (!eb.alive) continue;
      if (circleHit(eb.x, eb.y, eb.radius + 2, player.x, player.y, player.radius)) {
        eb.alive = false; onPlayerHit();
      }
    }

    // Enemy vs player
    for (const e of enemies) {
      if (!e.alive) continue;
      if (circleHit(e.x, e.y, e.radius, player.x, player.y, player.radius)) {
        e.alive = false; onPlayerHit();
      }
    }

    bullets = bullets.filter(b => b.alive);
    enemies = enemies.filter(e => e.alive);
    enemyBullets = enemyBullets.filter(b => b.alive);
    particles = particles.filter(p => p.life > 0);

    if (enemies.length === 0) { wave += 1; spawnWave(); }
  }

  function onPlayerHit() {
    particles.push(...Array.from({length: 20}, () => new Particle(player.x, player.y, '#66ffcc')));
    playBeep(90, 0.12, 'square', 0.05);
    player.lives -= 1; updateHUD();
    if (player.lives <= 0) {
      gameOver = true; showOverlay('GAME OVER', 'Press START to try again');
    }
  }

  function render() {
    // Starfield background
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.save();
    ctx.globalAlpha = 0.6; ctx.fillStyle = '#0b1f1b';
    for (let i = 0; i < 80; i++) ctx.fillRect(((i*37 + last*0.06) % WIDTH), (i*59)%HEIGHT, 2, 2);
    ctx.globalAlpha = 1; ctx.restore();

    // Midline scan glow
    const g = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    g.addColorStop(0.45, 'rgba(0,255,136,0)');
    g.addColorStop(0.5, 'rgba(0,255,136,0.08)');
    g.addColorStop(0.55, 'rgba(0,255,136,0)');
    ctx.fillStyle = g; ctx.fillRect(0,0,WIDTH,HEIGHT);

    player.draw();
    bullets.forEach(b => b.draw());
    enemies.forEach(e => e.draw());
    enemyBullets.forEach(b => b.draw());
    particles.forEach(p => p.draw());

    if (paused && !gameOver) drawPause();
  }

  function drawPause() {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#caffca';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '24px "Press Start 2P"';
    ctx.fillText('PAUSED', WIDTH/2, HEIGHT/2);
    ctx.restore();
  }

  function showOverlay(title, subtitle) {
    const panel = overlay.querySelector('.panel');
    panel.querySelector('.game-title').textContent = title;
    const mini = panel.querySelector('.mini-text');
    mini.textContent = subtitle || 'WASD/ARROWS MOVE ? SPACE SHOOT ? P PAUSE';
    overlay.classList.add('show');
  }

  // Pause toggle
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'p' && !gameOver) {
      paused = !paused;
      if (paused) showOverlay('PAUSED', 'Press START or P to resume');
      else overlay.classList.remove('show');
    }
  });

  // Start button
  startBtn.addEventListener('click', () => {
    overlay.classList.remove('show');
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    if (gameOver) resetGame();
    if (!player) resetGame();
    paused = false; gameOver = false;
  });

  // Start loop
  resetGame();
  requestAnimationFrame(loop);
})();

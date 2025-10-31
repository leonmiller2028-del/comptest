/* Retro interactions: starfield, glitch nudge, cursor trail, theme toggle */
(function() {
  const d = document;

  // Starfield
  const stars = d.getElementById('stars');
  if (stars) {
    const starCanvas = d.createElement('canvas');
    const ctx = starCanvas.getContext('2d');
    let w, h, starsArr;

    function resize() {
      w = starCanvas.width = window.innerWidth;
      h = starCanvas.height = window.innerHeight;
      starsArr = Array.from({ length: Math.floor((w * h) / 8000) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random() * 0.8 + 0.2,
      }));
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0,0,w,h);
      for (const s of starsArr) {
        const size = s.z * 1.6;
        ctx.fillStyle = `rgba(180,255,255,${0.6 * s.z})`;
        ctx.fillRect(s.x, s.y, size, size);
        s.x += (0.3 * s.z);
        if (s.x > w) s.x = 0;
      }
      requestAnimationFrame(draw);
    }

    stars.appendChild(starCanvas);
    window.addEventListener('resize', resize);
    resize();
    draw();
  }

  // Cursor trail
  const trailRoot = d.getElementById('cursorTrail');
  if (trailRoot) {
    window.addEventListener('pointermove', (e) => {
      const dot = d.createElement('div');
      dot.className = 'trail-dot';
      dot.style.left = `${e.clientX - 4}px`;
      dot.style.top = `${e.clientY - 4}px`;
      trailRoot.appendChild(dot);
      setTimeout(() => dot.remove(), 600);
    }, { passive: true });
  }

  // Theme toggle: toggles CRT class (scanline intensity bump)
  const toggle = d.getElementById('themeToggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const on = d.body.classList.toggle('crt');
      toggle.textContent = on ? 'CRT+' : 'CRT';
      d.body.style.textShadow = on ? '0 0 1px rgba(255,255,255,0.2)' : '';
      d.body.style.filter = on ? 'contrast(1.05) saturate(1.05)' : '';
    });
  }

  // Glitch nudge on hover for logo
  const logo = d.querySelector('.logo-glitch');
  if (logo) {
    logo.addEventListener('mouseenter', () => {
      logo.style.animation = 'none';
      logo.offsetHeight; // reflow
      logo.style.animation = '';
      logo.style.textShadow = '2px 0 var(--neon-cyan), -2px 0 var(--neon-pink), 0 0 14px var(--neon-cyan)';
      setTimeout(() => { logo.style.textShadow = ''; }, 250);
    });
  }

  // Keyboard easter egg: press VCR (V) for violet pulse
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'v') {
      d.documentElement.style.setProperty('--bg', '#0b001b');
      d.documentElement.style.setProperty('--bg-2', '#18003a');
      const body = d.body;
      body.animate([
        { filter: 'brightness(1) saturate(1)' },
        { filter: 'brightness(1.25) saturate(1.4)' },
        { filter: 'brightness(1) saturate(1)' },
      ], { duration: 500, easing: 'cubic-bezier(.2,.9,.2,1)' });
    }
  });
})();

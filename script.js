(() => {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  function $(selector, scope = document) {
    return scope.querySelector(selector);
  }

  function $all(selector, scope = document) {
    return scope.querySelectorAll(selector);
  }

  const body = document.body;
  const uptimeEl = $("#uptime");
  const terminalDisplay = $("#terminalDisplay");
  const powerToggle = $("#powerToggle");
  const pixelboardInput = $("#pixelboard");
  const pixelboardButton = $("#pixelboardButton");
  const pixelboardFeed = $("#pixelboardFeed");
  const statusRefresh = $("#statusRefresh");
  const statusReport = $("#statusReport");

  const startTime = Date.now();

  function updateUptime() {
    if (!uptimeEl) return;
    const diff = Date.now() - startTime;
    const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, "0");
    const minutes = String(
      Math.floor((diff / (1000 * 60)) % 60)
    ).padStart(2, "0");
    const seconds = String(Math.floor((diff / 1000) % 60)).padStart(2, "0");
    uptimeEl.textContent = `${hours}:${minutes}:${seconds}`;
  }

  setInterval(updateUptime, 1000);
  updateUptime();

  // Terminal typing effect
  const terminalLines = [
    'LOAD "RETROBYTE",8,1',
    "RUN",
    "CONNECTING TO NEON GRID ?",
    "AUTH OK // ACCESS LEVEL: L33T",
    "INIT STARFIELD_ENGINE.EXE",
    "PLAYLIST: SYNTHWAVE_NIGHTDRIVE.MX",
    "READY> _",
  ];

  function typeLine(lineIndex = 0, charIndex = 0) {
    if (!terminalDisplay) return;
    if (lineIndex >= terminalLines.length) {
      setTimeout(() => typeLine(0, 0), 4000);
      return;
    }

    if (charIndex === 0) {
      if (lineIndex === 0) {
        terminalDisplay.textContent = "";
      }
      terminalDisplay.textContent += `\n${terminalLines[lineIndex]} `;
    }

    const line = terminalLines[lineIndex];
    const current = terminalDisplay.textContent.split("\n");
    const prefix = current.slice(0, -1).join("\n");
    const typed = line.slice(0, charIndex + 1);
    terminalDisplay.textContent = [
      prefix,
      `${typed}${charIndex % 2 === 0 ? "_" : ""}`,
    ]
      .filter(Boolean)
      .join("\n");

    if (charIndex < line.length - 1) {
      setTimeout(() => typeLine(lineIndex, charIndex + 1), 90 + Math.random() * 80);
    } else {
      setTimeout(() => typeLine(lineIndex + 1, 0), 450);
    }
  }

  typeLine();

  // Power toggle effect
  if (powerToggle) {
    powerToggle.addEventListener("click", () => {
      body.classList.toggle("power-save");
      powerToggle.textContent = body.classList.contains("power-save")
        ? "Power Up"
        : "Power Down";
    });
  }

  // Pixelboard broadcast log
  if (pixelboardButton && pixelboardInput && pixelboardFeed) {
    const maxItems = 6;
    pixelboardButton.addEventListener("click", () => {
      const message = pixelboardInput.value.trim();
      if (!message) return;

      const item = document.createElement("li");
      const now = new Date();
      const timestamp = now
        .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        .replace(":", ".");
      item.innerHTML = `<strong>[${timestamp}]</strong> ${message}`;
      pixelboardFeed.prepend(item);

      while (pixelboardFeed.children.length > maxItems) {
        pixelboardFeed.removeChild(pixelboardFeed.lastElementChild);
      }

      pixelboardInput.value = "";
      pixelboardInput.focus();
    });
  }

  if (statusRefresh && statusReport) {
    const diagnostics = [
      "SCANNING VHS HEADS ? OK",
      "RECALIBRATING LASER GRID ? SPARKS DETECTED",
      "SYNCING MIXTAPE CACHE ? 64 NEW TRACKS",
      "DEPLOYING ANSI ART ? COMPLETE",
      "SPINNING FLOPPY DRIVES ? 88% HUM",
      "TUNING SHORTWAVE ANTENNA ? SIGNAL LOCKED",
    ];

    statusRefresh.addEventListener("click", () => {
      const message = diagnostics[Math.floor(Math.random() * diagnostics.length)];
      statusReport.textContent = message;
      statusReport.classList.remove("flash");
      void statusReport.offsetWidth; // restart animation
      statusReport.classList.add("flash");
    });
  }

  // Starfield animation
  const canvas = $("#starfield");
  if (canvas && !prefersReducedMotion) {
    const ctx = canvas.getContext("2d");
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    const stars = [];
    const starCount = Math.floor((width * height) / 4000);

    class Star {
      constructor() {
        this.reset(true);
      }

      reset(initial = false) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.z = Math.random() * width;
        this.prevX = this.x;
        this.prevY = this.y;
        if (!initial) {
          this.prevX = width / 2;
          this.prevY = height / 2;
        }
      }

      update() {
        this.prevX = this.x;
        this.prevY = this.y;

        this.z -= 2.5;
        if (this.z <= 0) {
          this.reset();
          return;
        }

        const scale = 120 / this.z;
        this.x = (this.x - width / 2) * scale + width / 2;
        this.y = (this.y - height / 2) * scale + height / 2;

        if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
          this.reset();
        }
      }

      draw() {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(0, 246, 255, ${Math.min(this.z / width, 0.9)})`;
        ctx.lineWidth = Math.max(0.7, 1.5 - this.z / width);
        ctx.moveTo(this.prevX, this.prevY);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();
      }
    }

    for (let i = 0; i < starCount; i += 1) {
      stars.push(new Star());
    }

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    window.addEventListener("resize", resize);

    function animate() {
      ctx.fillStyle = "rgba(5, 0, 13, 0.3)";
      ctx.fillRect(0, 0, width, height);

      for (const star of stars) {
        star.update();
        star.draw();
      }

      requestAnimationFrame(animate);
    }

    animate();
  }

  // Accessibility: enable keyboard focus outlines when tabbing
  function handleFirstTab(e) {
    if (e.key === "Tab") {
      body.classList.add("user-tabbing");
      window.removeEventListener("keydown", handleFirstTab);
    }
  }

  window.addEventListener("keydown", handleFirstTab);
})();

(function () {
  const root = document.documentElement;
  const body = document.body;

  const clearPending = function () {
    root.classList.remove("fm-intro-pending");
  };

  if (!body) {
    clearPending();
    return;
  }

  const reducedMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reducedMotion) {
    clearPending();
    return;
  }

  const logo = document.querySelector(".logo-img");
  const metaImage = document.querySelector('meta[property="og:image"]');
  let logoSrc = "";
  const aboutHref = new URL("hakkinda.html?v=20260327-opening-2", window.location.href).href;

  try {
    if (logo && logo.getAttribute("src")) {
      logoSrc = new URL(logo.getAttribute("src"), window.location.href).href;
    } else if (metaImage && metaImage.getAttribute("content")) {
      logoSrc = metaImage.getAttribute("content");
    }
  } catch (error) {
    logoSrc = "";
  }

  const intro = document.createElement("div");
  intro.id = "fm-intro";
  intro.innerHTML = [
    '<div class="fm-intro-bg"></div>',
    '<canvas class="fm-intro-canvas" aria-hidden="true"></canvas>',
    '<div class="fm-intro-light" aria-hidden="true"></div>',
    '<div class="fm-enter-shell">',
    logoSrc ? '  <img class="fm-enter-logo" src="' + logoSrc + '" alt="FiveMods logo">' : '  <div class="fm-enter-logo"></div>',
    '  <h1 class="fm-enter-title">FiveMods</h1>',
    '  <p class="fm-enter-copy">Mod merkezi acilmaya hazir. Guncel paketlere tek tikla ulas.</p>',
    '  <div class="fm-enter-buttons">',
    '    <button class="fm-enter-btn is-primary" type="button" data-fm-enter>ENTER</button>',
    '    <a class="fm-enter-btn" href="https://discord.com/channels/1480897873682895064" target="_blank" rel="noopener noreferrer">DISCORD</a>',
    '    <a class="fm-enter-btn" href="' + aboutHref + '" data-fm-about>HAKKINDA</a>',
    "  </div>",
    "</div>",
    '<div class="fm-enter-loading" aria-live="polite">',
    "  <span>YUKLENIYOR...</span>",
    '  <div class="fm-enter-track"><div class="fm-enter-fill"></div></div>',
    "</div>"
  ].join("");

  let closed = false;
  let leaving = false;
  let rafId = 0;
  let finishTimer = 0;

  const canvas = intro.querySelector(".fm-intro-canvas");
  const light = intro.querySelector(".fm-intro-light");
  const enterButton = intro.querySelector("[data-fm-enter]");
  const aboutButton = intro.querySelector("[data-fm-about]");

  const listeners = [];
  const addListener = function (target, eventName, handler, options) {
    target.addEventListener(eventName, handler, options);
    listeners.push(function () {
      target.removeEventListener(eventName, handler, options);
    });
  };

  const release = function () {
    while (listeners.length) {
      const remove = listeners.pop();
      remove();
    }
  };

  const cleanup = function () {
    release();
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
    if (finishTimer) {
      window.clearTimeout(finishTimer);
      finishTimer = 0;
    }
  };

  const finish = function () {
    if (closed) {
      return;
    }

    closed = true;
    cleanup();
    intro.classList.add("is-leaving");
    clearPending();
    body.classList.remove("fm-intro-active", "fm-intro-lock");
    root.classList.remove("fm-intro-lock");

    window.setTimeout(function () {
      if (intro.parentNode) {
        intro.parentNode.removeChild(intro);
      }
    }, 580);
  };

  const startLoading = function () {
    if (leaving || closed) {
      return;
    }

    leaving = true;
    intro.classList.add("is-exit");
    window.setTimeout(function () {
      intro.classList.add("is-loading");
    }, 280);
    finishTimer = window.setTimeout(finish, 1380);
  };

  body.classList.add("fm-intro-active", "fm-intro-lock");
  root.classList.add("fm-intro-lock");
  body.appendChild(intro);
  clearPending();

  window.requestAnimationFrame(function () {
    intro.classList.add("is-visible");
  });

  if (enterButton) {
    addListener(enterButton, "click", startLoading);
  }

  if (aboutButton) {
    addListener(aboutButton, "click", function (event) {
      event.preventDefault();
      event.stopPropagation();

      if (closed) {
        window.location.assign(aboutHref);
        return;
      }

      leaving = true;
      intro.classList.add("is-exit");
      cleanup();
      window.setTimeout(function () {
        window.location.assign(aboutHref);
      }, 320);
    });
  }

  const updateLight = function (x, y) {
    if (!light) {
      return;
    }
    light.style.left = String(x) + "px";
    light.style.top = String(y) + "px";
  };

  addListener(window, "mousemove", function (event) {
    updateLight(event.clientX, event.clientY);
  }, { passive: true });

  addListener(window, "touchmove", function (event) {
    if (!event.touches || !event.touches.length) {
      return;
    }
    updateLight(event.touches[0].clientX, event.touches[0].clientY);
  }, { passive: true });

  updateLight(window.innerWidth / 2, window.innerHeight / 2);

  const context = canvas && canvas.getContext ? canvas.getContext("2d") : null;
  let particles = [];

  const resetParticles = function () {
    if (!canvas || !context) {
      return;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const density = Math.floor(Math.max(canvas.width, canvas.height) / 10);
    const total = Math.min(140, Math.max(70, density));

    particles = new Array(total).fill(null).map(function () {
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.4,
        velocity: Math.random() * 1 + 0.3
      };
    });
  };

  const drawParticles = function () {
    if (!canvas || !context || closed) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "rgba(88, 213, 255, 0.85)";

    particles.forEach(function (particle) {
      particle.y += particle.velocity;
      if (particle.y > canvas.height + 4) {
        particle.y = -4;
        particle.x = Math.random() * canvas.width;
      }
      context.fillRect(particle.x, particle.y, particle.size, particle.size);
    });

    rafId = window.requestAnimationFrame(drawParticles);
  };

  addListener(window, "resize", resetParticles, { passive: true });
  resetParticles();
  drawParticles();

})();

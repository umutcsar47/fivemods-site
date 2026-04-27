(function () {
  const root = document.documentElement;
  const body = document.body;
  const usernameKey = "turkfivem-user-name-v1";
  const introSeenKey = "turkfivem-intro-seen-v1";

  const clearPending = function () {
    root.classList.remove("fm-intro-pending");
  };

  if (!body) {
    clearPending();
    return;
  }

  const reducedMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reducedMotion) {
    clearPending();
    return;
  }

  const sanitizeUsername = function (value) {
    const normalized = String(value || "").replace(/\s+/g, " ").trim();
    if (normalized.length < 3 || normalized.length > 24) {
      return "";
    }

    if (!/^[\p{L}\p{N}_. -]+$/u.test(normalized)) {
      return "";
    }

    return normalized;
  };

  const getStoredUsername = function () {
    try {
      return sanitizeUsername(window.localStorage.getItem(usernameKey) || "");
    } catch (error) {
      return "";
    }
  };

  const setStoredUsername = function (value) {
    const username = sanitizeUsername(value);
    if (!username) {
      return "";
    }

    try {
      window.localStorage.setItem(usernameKey, username);
      window.dispatchEvent(
        new CustomEvent("fm-user-updated", {
          detail: { username: username }
        })
      );
    } catch (error) {
    }

    return username;
  };

  const consumeBootstrapUserFromUrl = function () {
    try {
      const current = new URL(window.location.href);
      const bootstrapUser = sanitizeUsername(current.searchParams.get("fmUser"));
      if (!bootstrapUser) {
        return "";
      }

      setStoredUsername(bootstrapUser);
      current.searchParams.delete("fmUser");
      window.history.replaceState({}, "", current.toString());
      return bootstrapUser;
    } catch (error) {
      return "";
    }
  };

  const hasSeenIntro = function () {
    try {
      return window.localStorage.getItem(introSeenKey) === "1";
    } catch (error) {
      return false;
    }
  };

  const markIntroSeen = function () {
    try {
      window.localStorage.setItem(introSeenKey, "1");
    } catch (error) {
    }
  };

  consumeBootstrapUserFromUrl();
  const storedUsername = getStoredUsername();

  if (storedUsername && !hasSeenIntro()) {
    markIntroSeen();
  }

  const currentPath = (window.location.pathname || "").toLowerCase();
  const isHomePage =
    !currentPath.includes("/mods/") &&
    (currentPath === "" || currentPath.endsWith("/") || currentPath.endsWith("/index.html"));

  if (!isHomePage || hasSeenIntro()) {
    clearPending();
    return;
  }

  markIntroSeen();

  const logo = document.querySelector(".logo-img");
  const metaImage = document.querySelector('meta[property="og:image"]');
  const aboutHref = new URL("hakkinda.html?v=20260330-opening-1", window.location.href).href;
  let logoSrc = "";

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
    logoSrc
      ? '  <img class="fm-enter-logo" src="' + logoSrc + '" alt="Türk FiveM Modları logosu">'
      : '  <div class="fm-enter-logo"></div>',
    '  <h1 class="fm-enter-title">Türk FiveM Modları</h1>',
    '  <p class="fm-enter-copy">Guncel mod paketlerine girmeden once kullanici adini ayarla.</p>',
    '  <div class="fm-enter-user">',
    '    <label class="fm-enter-label" for="fm-enter-username">Kullanici adi</label>',
    '    <input id="fm-enter-username" class="fm-enter-input" type="text" maxlength="24" placeholder="Ornek: umut47" autocomplete="off">',
    '    <div class="fm-enter-status" data-fm-user-status aria-live="polite"></div>',
    "  </div>",
    '  <div class="fm-enter-buttons">',
    '    <button class="fm-enter-btn is-primary" type="button" data-fm-enter>GIRIS</button>',
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
  const usernameInput = intro.querySelector("#fm-enter-username");
  const statusBox = intro.querySelector("[data-fm-user-status]");

  const setStatus = function (message, isError) {
    if (!statusBox) {
      return;
    }
    statusBox.textContent = message || "";
    statusBox.classList.toggle("is-error", Boolean(isError));
    statusBox.classList.toggle("is-success", Boolean(message) && !isError);
  };

  if (usernameInput) {
    usernameInput.value = storedUsername;
  }

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

  const requireAndSaveUsername = function () {
    const raw = usernameInput ? usernameInput.value : "";
    const username = setStoredUsername(raw);

    if (!username) {
      setStatus("Kullanici adi 3-24 karakter olmali ve gecerli olmalidir.", true);
      if (usernameInput) {
        usernameInput.focus();
      }
      return "";
    }

    setStatus("Hazir: " + username, false);
    return username;
  };

  body.classList.add("fm-intro-active", "fm-intro-lock");
  root.classList.add("fm-intro-lock");
  body.appendChild(intro);
  clearPending();

  window.requestAnimationFrame(function () {
    intro.classList.add("is-visible");
  });

  if (enterButton) {
    addListener(enterButton, "click", function () {
      const username = requireAndSaveUsername();
      if (username) {
        startLoading();
      }
    });
  }

  if (usernameInput) {
    addListener(usernameInput, "keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        if (enterButton) {
          enterButton.click();
        }
      }
    });

    addListener(usernameInput, "input", function () {
      setStatus("", false);
    });
  }

  const updateLight = function (x, y) {
    if (!light) {
      return;
    }
    light.style.left = String(x) + "px";
    light.style.top = String(y) + "px";
  };

  addListener(
    window,
    "mousemove",
    function (event) {
      updateLight(event.clientX, event.clientY);
    },
    { passive: true }
  );

  addListener(
    window,
    "touchmove",
    function (event) {
      if (!event.touches || !event.touches.length) {
        return;
      }
      updateLight(event.touches[0].clientX, event.touches[0].clientY);
    },
    { passive: true }
  );

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

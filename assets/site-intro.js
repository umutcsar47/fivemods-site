(function () {
  const body = document.body;
  if (!body) {
    return;
  }

  const reducedMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reducedMotion) {
    return;
  }

  const sessionKey = "fivemods-intro-v1";
  let shouldShow = true;

  try {
    shouldShow = !window.sessionStorage.getItem(sessionKey);
  } catch (error) {
    shouldShow = true;
  }

  if (!shouldShow) {
    return;
  }

  const logo = document.querySelector(".logo-img");
  const logoSrc = logo ? new URL(logo.getAttribute("src"), window.location.href).href : "";

  const intro = document.createElement("div");
  intro.id = "fm-intro";
  intro.innerHTML = [
    '<div class="fm-intro-shell">',
    '  <div class="fm-intro-mark-wrap">',
    logoSrc ? '    <img class="fm-intro-mark" src="' + logoSrc + '" alt="FiveMods logo">' : '    <div class="fm-intro-mark"></div>',
    "  </div>",
    '  <h1 class="fm-intro-title">FiveMods</h1>',
    '  <p class="fm-intro-copy">Mod arsiviniz aciliyor. Guncel surumler ve temiz kurulumlu paketler hazirlaniyor.</p>',
    '  <div class="fm-intro-track"><div class="fm-intro-bar"></div></div>',
    '  <div class="fm-intro-meta">Blue Wave Interface</div>',
    "</div>"
  ].join("");

  let closed = false;
  let started = Date.now();

  const finish = function () {
    if (closed) {
      return;
    }

    closed = true;
    intro.classList.add("is-hidden");
    body.classList.remove("fm-intro-active", "fm-intro-lock");
    document.documentElement.classList.remove("fm-intro-lock");

    try {
      window.sessionStorage.setItem(sessionKey, "1");
    } catch (error) {
    }

    window.setTimeout(function () {
      if (intro.parentNode) {
        intro.parentNode.removeChild(intro);
      }
    }, 720);
  };

  body.classList.add("fm-intro-active", "fm-intro-lock");
  document.documentElement.classList.add("fm-intro-lock");
  body.appendChild(intro);

  window.requestAnimationFrame(function () {
    intro.classList.add("is-visible");
  });

  const finishWhenReady = function () {
    const elapsed = Date.now() - started;
    const remaining = Math.max(1200 - elapsed, 0);
    window.setTimeout(finish, remaining);
  };

  if (document.readyState === "complete") {
    finishWhenReady();
  } else {
    window.addEventListener("load", finishWhenReady, { once: true });
  }

  window.setTimeout(finish, 2400);
})();

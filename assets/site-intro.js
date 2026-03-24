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

  const sessionKey = "fivemods-intro-v3";
  let shouldShow = true;

  try {
    shouldShow = !window.sessionStorage.getItem(sessionKey);
  } catch (error) {
    shouldShow = true;
  }

  if (!shouldShow) {
    clearPending();
    return;
  }

  try {
    window.sessionStorage.setItem(sessionKey, "1");
  } catch (error) {
  }

  const logo = document.querySelector(".logo-img");
  const metaImage = document.querySelector('meta[property="og:image"]');
  const logoSrc = logo
    ? new URL(logo.getAttribute("src"), window.location.href).href
    : metaImage
      ? metaImage.getAttribute("content")
      : "";

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
    clearPending();
    body.classList.remove("fm-intro-active", "fm-intro-lock");
    document.documentElement.classList.remove("fm-intro-lock");

    window.setTimeout(function () {
      if (intro.parentNode) {
        intro.parentNode.removeChild(intro);
      }
    }, 720);
  };

  body.classList.add("fm-intro-active", "fm-intro-lock");
  document.documentElement.classList.add("fm-intro-lock");
  body.appendChild(intro);
  clearPending();

  window.requestAnimationFrame(function () {
    intro.classList.add("is-visible");
  });

  const finishWhenReady = function () {
    const elapsed = Date.now() - started;
    const remaining = Math.max(820 - elapsed, 0);
    window.setTimeout(finish, remaining);
  };

  if (document.readyState === "complete" || document.readyState === "interactive") {
    finishWhenReady();
  } else {
    document.addEventListener("DOMContentLoaded", finishWhenReady, { once: true });
  }

  window.setTimeout(finish, 1450);
})();

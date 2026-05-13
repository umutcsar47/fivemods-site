(function () {
  const root = document.documentElement;
  const body = document.body;
  const usernameKey = "turkfivem-user-name-v1";
  const introSeenKey = "turkfivem-intro-seen-v1";

  function clearPending() {
    if (root) {
      root.classList.remove("fm-intro-pending");
    }
  }

  if (!root || !body) {
    return;
  }

  function sanitizeUsername(value) {
    const normalized = String(value || "").replace(/\s+/g, " ").trim();
    if (normalized.length < 3 || normalized.length > 24) {
      return "";
    }

    if (!/^[\p{L}\p{N}_. -]+$/u.test(normalized)) {
      return "";
    }

    return normalized;
  }

  function getStoredUsername() {
    try {
      return sanitizeUsername(window.localStorage.getItem(usernameKey) || "");
    } catch (error) {
      return "";
    }
  }

  function setStoredUsername(value) {
    const username = sanitizeUsername(value);
    if (!username) {
      return "";
    }

    try {
      window.localStorage.setItem(usernameKey, username);
      window.dispatchEvent(new CustomEvent("fm-user-updated", { detail: { username: username } }));
    } catch (error) {
    }

    return username;
  }

  function hasSeenIntro() {
    try {
      return window.localStorage.getItem(introSeenKey) === "1";
    } catch (error) {
      return false;
    }
  }

  function markIntroSeen() {
    try {
      window.localStorage.setItem(introSeenKey, "1");
    } catch (error) {
    }
  }

  function consumeSkipIntro() {
    try {
      const current = new URL(window.location.href);
      const shouldSkip = current.searchParams.get("fmSkipIntro") === "1";
      if (!shouldSkip) {
        return false;
      }

      markIntroSeen();
      current.searchParams.delete("fmSkipIntro");
      window.history.replaceState({}, "", current.toString());
      return true;
    } catch (error) {
      return false;
    }
  }

  const currentPath = (window.location.pathname || "").toLowerCase();
  const isHomePage =
    !currentPath.includes("/mods/") &&
    (currentPath === "" || currentPath.endsWith("/") || currentPath.endsWith("/index.html"));

  consumeSkipIntro();

  const storedUsername = getStoredUsername();
  if (storedUsername && !hasSeenIntro()) {
    markIntroSeen();
  }

  if (!isHomePage || hasSeenIntro()) {
    clearPending();
    return;
  }

  const overlay = document.createElement("div");
  overlay.className = "fm-intro";
  overlay.id = "fm-intro";
  overlay.innerHTML = [
    '<div class="fm-intro-backdrop"></div>',
    '<div class="fm-intro-shell">',
    '  <div class="fm-intro-frame">',
    '    <span class="fm-intro-badge">VIP ENTRY</span>',
    '    <div class="fm-intro-brand">',
    '      <img class="fm-intro-logo" src="assets/logo.png?v=20260323-3" alt="Türk FiveM Modları logosu">',
    '      <div>',
    '        <strong>Türk FiveM Modları</strong>',
    '        <span>kısa giriş • temiz görünüm</span>',
    '      </div>',
    '    </div>',
    '    <div class="fm-intro-form">',
    '      <label class="fm-intro-label" for="fm-intro-username">Kullanıcı Adı</label>',
    '      <input id="fm-intro-username" class="fm-intro-input" type="text" maxlength="24" autocomplete="off" placeholder="ör. umut47">',
    '      <div class="fm-intro-status" data-fm-intro-status aria-live="polite"></div>',
    '      <button class="fm-intro-submit" type="button" data-fm-intro-submit>Siteye Gir</button>',
    '    </div>',
    '    <div class="fm-intro-note">İlk girişten sonra tekrar görünmez.</div>',
    '  </div>',
    '  <div class="fm-intro-ring" aria-hidden="true"></div>',
    '</div>'
  ].join("");

  const input = overlay.querySelector("#fm-intro-username");
  const status = overlay.querySelector("[data-fm-intro-status]");
  const submit = overlay.querySelector("[data-fm-intro-submit]");

  function setStatus(message, isError) {
    if (!status) {
      return;
    }
    status.textContent = message || "";
    status.classList.toggle("is-error", Boolean(isError));
  }

  function unlockAndRemove() {
    body.classList.remove("fm-site-locked");
    root.classList.remove("fm-site-locked");
    clearPending();
    window.setTimeout(function () {
      overlay.remove();
    }, 1040);
  }

  function completeIntro() {
    const username = setStoredUsername(input ? input.value : "");
    if (!username) {
      setStatus("3-24 karakterlik bir kullanıcı adı gir.", true);
      if (input) {
        input.focus();
      }
      return;
    }

    markIntroSeen();
    setStatus("Giriş hazırlanıyor…", false);
    overlay.classList.add("is-entering");
    unlockAndRemove();
  }

  body.classList.add("fm-site-locked");
  root.classList.add("fm-site-locked");
  body.appendChild(overlay);

  if (input) {
    input.value = storedUsername;
    window.setTimeout(function () {
      input.focus();
      input.select();
    }, 140);
    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        completeIntro();
      }
    });
    input.addEventListener("input", function () {
      setStatus("", false);
    });
  }

  if (submit) {
    submit.addEventListener("click", completeIntro);
  }

  window.requestAnimationFrame(function () {
    overlay.classList.add("is-visible");
    clearPending();
  });
})();


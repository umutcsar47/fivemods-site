(function () {
  const root = document.documentElement;
  const panelId = "fm-theme-nav-panel";
  const triggerId = "fm-theme-nav-trigger";
  const wrapId = "fm-theme-nav-wrap";
  const storageKey = "turkfivem-site-theme-v1";
  const usernameKey = "turkfivem-user-name-v1";

  if (!root || !document.body) {
    return;
  }

  const themes = {
    dark: { label: "Karanlik", color: "#081322" },
    light: { label: "Aydinlik", color: "#f4f8ff" }
  };

  function getStoredTheme() {
    try {
      const value = window.localStorage.getItem(storageKey);
      if (value && themes[value]) {
        return value;
      }
    } catch (error) {
    }
    return "dark";
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

  function updateUserChips() {
    const username = getStoredUsername();
    const chips = document.querySelectorAll("[data-user-chip]");

    chips.forEach(function (chip) {
      const label = username ? username : "Kullanici";
      chip.textContent = label;
      chip.classList.toggle("is-empty", !username);
      chip.setAttribute(
        "title",
        username
          ? "Aktif kullanici: " + username
          : "Kullanici adi girilmedi"
      );
    });
  }

  function storeTheme(value) {
    try {
      window.localStorage.setItem(storageKey, value);
    } catch (error) {
    }
  }

  function setTheme(value) {
    const theme = themes[value] ? value : "dark";
    root.setAttribute("data-site-theme", theme);
    storeTheme(theme);

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute("content", themes[theme].color);
    }

    const panel = document.getElementById(panelId);
    const trigger = document.getElementById(triggerId);
    if (panel) {
      panel.querySelectorAll("[data-theme]").forEach(function (button) {
        const active = button.getAttribute("data-theme") === theme;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });
    }

    if (trigger) {
      trigger.setAttribute("data-theme-current", theme);
      trigger.querySelector(".fm-theme-current-label").textContent = themes[theme].label;
    }

    updateUserChips();
  }

  function closePanel() {
    const panel = document.getElementById(panelId);
    const trigger = document.getElementById(triggerId);
    const wrap = document.getElementById(wrapId);
    if (!panel || !trigger) {
      return;
    }

    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    trigger.setAttribute("aria-expanded", "false");
    if (wrap) {
      wrap.classList.remove("is-open");
    }
  }

  function togglePanel() {
    const panel = document.getElementById(panelId);
    const trigger = document.getElementById(triggerId);
    const wrap = document.getElementById(wrapId);
    if (!panel || !trigger) {
      return;
    }

    const open = !panel.classList.contains("is-open");
    panel.classList.toggle("is-open", open);
    panel.setAttribute("aria-hidden", open ? "false" : "true");
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
    if (wrap) {
      wrap.classList.toggle("is-open", open);
    }
  }

  function bindOutsideClose() {
    if (document.body.dataset.fmThemeOutsideBound === "1") {
      return;
    }
    document.body.dataset.fmThemeOutsideBound = "1";

    document.addEventListener("click", function (event) {
      const target = event.target;
      if (!target) {
        return;
      }

      if (target.closest("#" + wrapId)) {
        return;
      }
      closePanel();
    });

    window.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closePanel();
      }
    });
  }

  function ensureMenuControl() {
    if (root.classList.contains("fm-desktop-app")) {
      return;
    }

    if (/electron/i.test(String(window.navigator && window.navigator.userAgent || ""))) {
      return;
    }

    const nav = document.querySelector(".nav");
    if (!nav) {
      return;
    }

    if (document.getElementById(wrapId)) {
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.id = wrapId;
    wrapper.className = "nav-theme";
    wrapper.innerHTML = [
      '<button id="' + triggerId + '" class="nav-theme-btn" type="button" aria-expanded="false" aria-controls="' + panelId + '">',
      '<span class="fm-theme-btn-text">Tema Modu</span>',
      '<span class="fm-theme-current-label">Karanlik</span>',
      "</button>",
      '<div id="' + panelId + '" class="nav-theme-menu" aria-hidden="true">',
      '<button type="button" data-theme="dark">Karanlik</button>',
      '<button type="button" data-theme="light">Aydinlik</button>',
      "</div>"
    ].join("");

    const userChip = nav.querySelector("[data-user-chip]");
    if (userChip && userChip.parentNode === nav) {
      nav.insertBefore(wrapper, userChip);
    } else {
      nav.appendChild(wrapper);
    }

    const trigger = document.getElementById(triggerId);
    const panel = document.getElementById(panelId);
    if (!trigger || !panel) {
      return;
    }

    trigger.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      togglePanel();
    });

    panel.querySelectorAll("[data-theme]").forEach(function (button) {
      button.addEventListener("click", function () {
        setTheme(button.getAttribute("data-theme"));
        closePanel();
      });
    });

    bindOutsideClose();
    setTheme(getStoredTheme());
  }

  setTheme(getStoredTheme());
  ensureMenuControl();
  updateUserChips();
  window.addEventListener("storage", updateUserChips);
  window.addEventListener("fm-user-updated", updateUserChips);
  window.setTimeout(updateUserChips, 600);
})();

(function () {
  const root = document.documentElement;
  const fabId = "fm-theme-fab";
  const panelId = "fm-theme-panel";
  const storageKey = "fivemods-site-theme-v1";

  if (!root || !document.body) {
    return;
  }

  if (navigator.userAgent && navigator.userAgent.indexOf("Electron") !== -1) {
    return;
  }

  const themes = {
    neon: { label: "Neon", color: "#061325" },
    dark: { label: "Karanlik", color: "#0d1117" },
    light: { label: "Aydinlik", color: "#eef5ff" },
    mono: { label: "Siyah-Beyaz", color: "#f5f5f5" }
  };

  function getStoredTheme() {
    try {
      const value = window.localStorage.getItem(storageKey);
      if (value && themes[value]) {
        return value;
      }
    } catch (error) {
    }
    return "neon";
  }

  function storeTheme(value) {
    try {
      window.localStorage.setItem(storageKey, value);
    } catch (error) {
    }
  }

  function setTheme(value) {
    const theme = themes[value] ? value : "neon";
    root.setAttribute("data-site-theme", theme);
    storeTheme(theme);

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute("content", themes[theme].color);
    }

    const panel = document.getElementById(panelId);
    if (panel) {
      panel.querySelectorAll("[data-theme]").forEach(function (button) {
        button.classList.toggle("is-active", button.getAttribute("data-theme") === theme);
      });
    }
  }

  function closePanel() {
    const panel = document.getElementById(panelId);
    if (!panel) {
      return;
    }
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
  }

  function togglePanel() {
    const panel = document.getElementById(panelId);
    if (!panel) {
      return;
    }
    const open = !panel.classList.contains("is-open");
    panel.classList.toggle("is-open", open);
    panel.setAttribute("aria-hidden", open ? "false" : "true");
  }

  function ensureControls() {
    if (document.getElementById(fabId) || document.getElementById(panelId)) {
      return;
    }

    const fab = document.createElement("button");
    fab.id = fabId;
    fab.className = "fm-theme-fab";
    fab.type = "button";
    fab.setAttribute("aria-label", "Tema ayarlari");
    fab.textContent = "Tema";

    const panel = document.createElement("div");
    panel.id = panelId;
    panel.className = "fm-theme-panel";
    panel.setAttribute("aria-hidden", "true");
    panel.innerHTML = [
      '<div class="fm-theme-title">Tema Secimi</div>',
      '<button type="button" data-theme="neon">Neon</button>',
      '<button type="button" data-theme="dark">Karanlik</button>',
      '<button type="button" data-theme="light">Aydinlik</button>',
      '<button type="button" data-theme="mono">Siyah-Beyaz</button>'
    ].join("");

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    fab.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      togglePanel();
    });

    panel.querySelectorAll("[data-theme]").forEach(function (button) {
      button.addEventListener("click", function () {
        const theme = button.getAttribute("data-theme");
        setTheme(theme);
        closePanel();
      });
    });

    document.addEventListener("click", function (event) {
      const target = event.target;
      if (!target) {
        return;
      }
      if (target.closest("#" + panelId) || target.closest("#" + fabId)) {
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

  setTheme(getStoredTheme());
  ensureControls();
})();

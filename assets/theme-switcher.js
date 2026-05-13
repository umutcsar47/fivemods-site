(function () {
  const usernameKey = "turkfivem-user-name-v1";

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
    const label = username || "Misafir";

    document.querySelectorAll("[data-user-chip]").forEach(function (chip) {
      chip.textContent = label;
      chip.classList.toggle("is-empty", !username);
      chip.setAttribute("title", username ? "Aktif kullanıcı: " + username : "Kullanıcı adı girilmedi");
    });
  }

  updateUserChips();
  window.addEventListener("storage", updateUserChips);
  window.addEventListener("fm-user-updated", updateUserChips);
})();


(function () {
  var usernameKey = "fivemods-user-name-v1";

  function normalizeBaseUrl(value) {
    if (!value || typeof value !== "string") {
      return "";
    }

    return value.trim().replace(/\/+$/, "");
  }

  function sanitizeUsername(value) {
    var normalized = String(value || "").replace(/\s+/g, " ").trim();

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

  function buildTrackedDownloadUrl(slug) {
    if (!slug || !workerBaseUrl) {
      return "";
    }

    var target = workerBaseUrl + "/download/" + encodeURIComponent(slug);
    var username = getStoredUsername();

    if (!username) {
      return target;
    }

    var url = new URL(target, window.location.href);
    url.searchParams.set("user", username);
    return url.toString();
  }

  var config = window.FiveModsCounterConfig || {};
  var workerBaseUrl = normalizeBaseUrl(config.workerBaseUrl);
  var downloadLinks = document.querySelectorAll("[data-download-slug]");

  window.FiveModsBuildTrackedDownloadUrl = function (slug, fallbackHref) {
    var tracked = buildTrackedDownloadUrl(slug);
    return tracked || fallbackHref || "";
  };

  if (!downloadLinks.length || !workerBaseUrl) {
    return;
  }

  downloadLinks.forEach(function (link) {
    var slug = link.getAttribute("data-download-slug");

    if (!slug) {
      return;
    }

    var trackedHref = buildTrackedDownloadUrl(slug);
    if (!trackedHref) {
      return;
    }

    link.setAttribute("href", trackedHref);
    link.removeAttribute("download");
    link.setAttribute("data-counter-active", "true");

    link.addEventListener("click", function () {
      var latest = buildTrackedDownloadUrl(slug);
      if (latest) {
        link.setAttribute("href", latest);
      }
    });
  });
})();

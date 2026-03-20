(function () {
  function normalizeBaseUrl(value) {
    if (!value || typeof value !== "string") {
      return "";
    }

    return value.trim().replace(/\/+$/, "");
  }

  var config = window.FiveModsCounterConfig || {};
  var workerBaseUrl = normalizeBaseUrl(config.workerBaseUrl);
  var downloadLinks = document.querySelectorAll("[data-download-slug]");

  if (!downloadLinks.length || !workerBaseUrl) {
    return;
  }

  downloadLinks.forEach(function (link) {
    var slug = link.getAttribute("data-download-slug");

    if (!slug) {
      return;
    }

    link.setAttribute("href", workerBaseUrl + "/download/" + encodeURIComponent(slug));
    link.removeAttribute("download");
    link.setAttribute("data-counter-active", "true");
  });
})();

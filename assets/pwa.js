(function () {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  var match = window.location.pathname.match(/^(.*?\/fivemods-site\/)/i);
  var basePath = match ? match[1] : "/";

  window.addEventListener("load", function () {
    navigator.serviceWorker
      .register(basePath + "service-worker.js", { scope: basePath })
      .catch(function () {
      });
  });

  var standalone = false;
  try {
    standalone =
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      window.navigator.standalone === true;
  } catch (error) {
    standalone = false;
  }

  if (standalone || !document.body) {
    return;
  }

  var installButton = document.createElement("button");
  installButton.type = "button";
  installButton.className = "pwa-install";
  installButton.textContent = "Uygulamayi Yukle";
  installButton.hidden = true;
  document.body.appendChild(installButton);

  var toast = document.createElement("div");
  toast.className = "pwa-toast";
  document.body.appendChild(toast);

  var hideToastTimer = null;
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(hideToastTimer);
    hideToastTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 3200);
  }

  var deferredPrompt = null;

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    deferredPrompt = event;
    installButton.hidden = false;
  });

  installButton.addEventListener("click", function () {
    if (!deferredPrompt) {
      showToast("Tarayiciniz bu sayfada kurulum penceresi gostermiyor.");
      return;
    }

    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function () {
      deferredPrompt = null;
      installButton.hidden = true;
    });
  });

  window.addEventListener("appinstalled", function () {
    installButton.hidden = true;
    showToast("FiveMods uygulama olarak yuklendi.");
  });

  var isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent || "");
  var isSafari = /^((?!chrome|android).)*safari/i.test(window.navigator.userAgent || "");
  if (isIOS && isSafari) {
    var tipKey = "fivemods-ios-install-tip";
    try {
      if (!window.localStorage.getItem(tipKey)) {
        showToast("iPhone icin Paylas menusu uzerinden Ana Ekrana Ekle kullanabilirsiniz.");
        window.localStorage.setItem(tipKey, "1");
      }
    } catch (error) {
      showToast("iPhone icin Paylas menusu uzerinden Ana Ekrana Ekle kullanabilirsiniz.");
    }
  }
})();

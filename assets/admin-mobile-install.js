(function () {
  var installButton = document.getElementById("install-admin-app");
  var installHint = document.getElementById("install-admin-hint");
  var deferredPrompt = null;

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("admin-app-sw.js").catch(function () {});
  }

  function setHint(message) {
    if (installHint) {
      installHint.textContent = message;
    }
  }

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    deferredPrompt = event;
    if (installButton) {
      installButton.hidden = false;
    }
    setHint("Kurulum hazir. Uygulamayi yuklemek icin butona bas.");
  });

  if (installButton) {
    installButton.addEventListener("click", async function () {
      if (!deferredPrompt) {
        setHint("Tarayicida Paylas > Ana Ekrana Ekle adimini kullan.");
        return;
      }

      deferredPrompt.prompt();
      try {
        await deferredPrompt.userChoice;
      } catch (error) {
      }
      deferredPrompt = null;
      installButton.hidden = true;
      setHint("Kurulum istegi gonderildi.");
    });
  }
})();

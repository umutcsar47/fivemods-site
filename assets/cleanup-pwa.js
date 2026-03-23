(function () {
  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function (registrations) {
        registrations.forEach(function (registration) {
          registration.unregister();
        });
      }).catch(function () {});
    }

    if (window.caches && caches.keys) {
      caches.keys().then(function (keys) {
        keys.forEach(function (key) {
          if (/fivemods|workbox|precache|runtime/i.test(key)) {
            caches.delete(key);
          }
        });
      }).catch(function () {});
    }

    document.documentElement.classList.remove('pwa-installed');
    if (document.body) {
      document.body.classList.remove('pwa-installed');
    }
  } catch (error) {
  }
})();

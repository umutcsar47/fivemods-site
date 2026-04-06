const CACHE_NAME = "fivemods-admin-mobile-v2";
const ASSETS = [
  "./admin-sayac-merkez.html",
  "./admin-indirme-sayaci.html",
  "./admin-indirme-sayaci-telefon.html",
  "./admin-indirme-sayaci-mobile-1.html",
  "./admin-indirme-sayaci-mobile-2.html",
  "./assets/admin-counter.js?v=20260406-1",
  "./assets/admin-mobile-install.js?v=20260404-1",
  "./assets/fivemods-counter-config.js?v=20260404-1",
  "./assets/favicon.png?v=20260323-3"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return null;
        })
      );
    })
  );
});

self.addEventListener("fetch", function (event) {
  const req = event.request;
  if (req.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) {
        return cached;
      }
      return fetch(req).catch(function () {
        return caches.match("./admin-indirme-sayaci-telefon.html");
      });
    })
  );
});

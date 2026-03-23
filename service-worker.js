const CACHE_NAME = "fivemods-pwa-v1";

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./mods.html",
  "./kategoriler.html",
  "./kategori-radio.html",
  "./hakkinda.html",
  "./manifest.webmanifest",
  "./assets/site-visuals.css",
  "./assets/site-intro.js",
  "./assets/mod-search.js",
  "./assets/pwa.js",
  "./assets/logo.png",
  "./assets/favicon.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) {
      return cached;
    }
    return caches.match("./index.html", { ignoreSearch: true });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await caches.match(request, { ignoreSearch: true });
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  return cached || networkPromise;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (/\.(zip|mp4)$/i.test(url.pathname)) {
    return;
  }

  const acceptsHtml = (request.headers.get("accept") || "").includes("text/html");

  if (request.mode === "navigate" || acceptsHtml) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (/\.(css|js|png|jpg|jpeg|svg|webmanifest)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

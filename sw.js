/**
 * Met le jeu en mémoire sur le téléphone pour qu'il s'ouvre sans internet
 * après la première visite.
 */
const CACHE = "ovalis-step1-v1";

const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/style.css",
  "./js/main.js",
  "./js/ui.js",
  "./js/core/audio.js",
  "./js/core/encounters.js",
  "./js/core/formulas.js",
  "./js/core/input.js",
  "./js/core/save.js",
  "./js/core/state.js",
  "./js/core/util.js",
  "./js/data/creatures.js",
  "./js/data/items.js",
  "./js/data/maps.js",
  "./js/data/moves.js",
  "./js/data/types.js",
  "./js/render/actors.js",
  "./js/render/creature.js",
  "./js/render/world.js",
  "./js/scenes/battle.js",
  "./js/scenes/menus.js",
  "./js/scenes/world.js",
  "./fonts/AtkinsonHyperlegible-Regular.woff2",
  "./fonts/AtkinsonHyperlegible-Bold.woff2",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(networkFirst(request));
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  try {
    const fresh = await Promise.race([
      fetch(request),
      new Promise((_, reject) => setTimeout(() => reject(new Error("lent")), 4000)),
    ]);
    if (fresh && fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  } catch {
    if (cached) return cached;
    if (request.mode === "navigate") {
      const home = await cache.match("./index.html");
      if (home) return home;
    }
    return new Response("Hors ligne", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}

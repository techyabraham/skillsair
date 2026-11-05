/*
 * SkillsAir service worker (registered by src/components/pwa/PwaRegister.tsx, production only).
 *
 * Kept on the phone: the app's built files (/_next/static, which never change once deployed),
 * fonts, icons and the offline screen, so the installed app opens instantly.
 * Always from the network: pages and everything under /api, so progress, payments and lessons are
 * never stale and nothing personal is stored. Lesson videos stream as before (never cached).
 * No connection: a page that can't load shows /offline.
 *
 * A new deploy ships a new VERSION; the page offers "Refresh" and only then does it take over.
 */
const VERSION = "2026-11-05.1";
const SHELL = `sa-shell-${VERSION}`;
const STATIC = "sa-static-v1";
const OFFLINE_URL = "/offline";
const SHELL_FILES = [OFFLINE_URL, "/icons/icon-192.png", "/icons/maskable-192.png", "/favicon.ico"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(SHELL_FILES)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("sa-shell-") && key !== SHELL).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

const isStatic = (url) =>
  url.pathname.startsWith("/_next/static/") ||
  url.pathname.startsWith("/icons/") ||
  url.pathname.startsWith("/fonts/") ||
  /\.(?:woff2?|ttf)$/.test(url.pathname);

/** Built files are named by their content, so a saved copy is always right; old builds age out at 300 entries. */
async function cacheFirst(request) {
  const cache = await caches.open(STATIC);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok && response.type === "basic") {
    cache.put(request, response.clone()).then(() => trim(cache, 300)).catch(() => undefined);
  }
  return response;
}

async function trim(cache, max) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // API calls, video streams (Range requests) and page data always go to the network untouched.
  if (url.pathname.startsWith("/api/") || request.headers.has("range")) return;

  if (isStatic(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => (await caches.match(OFFLINE_URL)) || new Response("You're offline.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } })),
    );
  }
});

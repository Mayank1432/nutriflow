// NutriFlow React service worker.
// The two placeholders below are replaced during `npm run build`
// by scripts/inject-sw-precache.mjs.
const CACHE_PREFIX = 'nutriflow-'
const CACHE_NAME = 'nutriflow-react-__BUILD_HASH__'
const PRECACHE_URLS = __PRECACHE_URLS__

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(
        names
          .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      ))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  // The archived Vanilla app at /classic/ is never handled by this worker.
  if (url.pathname.includes('/classic/')) return
  event.respondWith(
    caches
      .match(request, { ignoreSearch: request.mode === 'navigate' })
      .then((cached) => cached || fetch(request)),
  )
})
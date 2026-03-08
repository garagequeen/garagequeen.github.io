const CACHE = “garage-cache-v4”

self.addEventListener(“install”, e => {
self.skipWaiting()
})

self.addEventListener(“activate”, e => {
e.waitUntil(
caches.keys().then(keys =>
Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
)
)
self.clients.claim()
})

// network-first: всегда берём свежий файл, кеш только как fallback
self.addEventListener(“fetch”, e => {
e.respondWith(
fetch(e.request)
.then(res => {
const clone = res.clone()
caches.open(CACHE).then(cache => cache.put(e.request, clone))
return res
})
.catch(() => caches.match(e.request))
)
})

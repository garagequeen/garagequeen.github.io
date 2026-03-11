const CACHE = “garage-cache-v9”
const PRECACHE = [”/”, “/index.html”]

self.addEventListener(“install”, e => {
self.skipWaiting()
e.waitUntil(
caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
)
})

self.addEventListener(“activate”, e => {
e.waitUntil(
caches.keys().then(keys =>
Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
)
)
self.clients.claim()
})

// network-first: always fetch fresh, cache as fallback only
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

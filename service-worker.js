// service-worker.js
const CACHE_VERSION = 'v6.0.0';
const CACHE_NAME = `video-recorder-${CACHE_VERSION}`;


// Pomocná funkce pro snadné vytváření URL relativně k scope SW
const url = (path) => new URL(path, self.registration.scope).toString();


const ASSETS = [
url('./'),
url('./index.html'),
url('./manifest.webmanifest'),
url('./assets/icons/icon-192.png'),
url('./assets/icons/icon-512.png')
];


self.addEventListener('install', (event) => {
self.skipWaiting();
event.waitUntil(
caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(()=>{})
);
});


self.addEventListener('activate', (event) => {
event.waitUntil((async () => {
const keys = await caches.keys();
await Promise.all(keys.filter(k => k.startsWith('video-recorder-') && k !== CACHE_NAME).map(k => caches.delete(k)));
await self.clients.claim();
})());
});


self.addEventListener('fetch', (event) => {
const req = event.request;
const urlObj = new URL(req.url);
// Jen GET a jen stejný původ
if (req.method !== 'GET' || urlObj.origin !== self.location.origin) return;


event.respondWith(
caches.match(req).then(cached => {
if (cached) return cached; // cache-first
return fetch(req).then(resp => {
const respClone = resp.clone();
// Uložíme jen úspěšné odpovědi (200) a/nebo základní typy
if (resp.status === 200 && (req.destination === 'document' || req.destination === 'image' || req.destination === 'script' || req.destination === 'style')) {
caches.open(CACHE_NAME).then(cache => cache.put(req, respClone));
}
return resp;
}).catch(() => {
// Offline fallback: vrať hlavní HTML pro navigace
if (req.mode === 'navigate') return caches.match(url('./index.html'));
});
})
);
});

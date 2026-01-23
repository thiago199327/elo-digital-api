const CACHE_NAME = 'elo-digital-v1';
const assets = ['./index.html', './biblioteca.html', './explorar.html', './perfil.html', './chat.html', './configuracoes.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(assets)));
});

self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request).then((res) => res || fetch(event.request)));
});
// Service Worker - cache offline da plataforma
const CACHE_NAME = 'patrimonio-v1';
const ARQUIVOS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Instalar: armazenar arquivos em cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ARQUIVOS))
      .then(() => self.skipWaiting())
  );
});

// Ativar: limpar caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(nomes => {
      return Promise.all(
        nomes.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: tentar rede primeiro, fallback para cache
self.addEventListener('fetch', event => {
  // Não cacheia chamadas para BRAPI (cotações)
  if (event.request.url.includes('brapi.dev')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Só cacheia GETs com sucesso
        if (event.request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

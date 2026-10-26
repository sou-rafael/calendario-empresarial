// Service Worker nativo para FiscalZap PWA
const CACHE_NAME = 'fiscalzap-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Apenas repassa a requisição à rede de forma transparente
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});

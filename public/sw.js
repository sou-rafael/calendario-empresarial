// Service Worker nativo para KdConta PWA com suporte a Notificações
const CACHE_NAME = 'kdconta-v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listener de Web Push do Navegador
self.addEventListener('push', (event) => {
  let data = {
    title: '🔔 KdConta Alerta',
    body: 'Você tem contas empresariais vencendo hoje!',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    url: '/mobile'
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [200, 100, 200],
    data: { url: data.url || '/mobile' },
    actions: [
      { action: 'open', title: 'Ver Contas' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Ao clicar na notificação, abre ou foca no app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/mobile';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/mobile') && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

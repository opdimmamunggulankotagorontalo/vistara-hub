self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : '' };
  }

  const targetPath = typeof payload.url === 'string' &&
    payload.url.startsWith('/') &&
    !payload.url.startsWith('//')
      ? payload.url
      : '/beranda';

  const options = {
    body: payload.body || 'Ada informasi terbaru dari OPDIM VISTARA.',
    icon: payload.icon || '/tara-notif-icon.png',
    badge: payload.badge || '/pwa-192x192.png',
    tag: payload.tag || 'tara-notification',
    data: { url: targetPath },
    renotify: false,
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Notifikasi TARA', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const rawPath = event.notification?.data?.url;
  const path = typeof rawPath === 'string' &&
    rawPath.startsWith('/') &&
    !rawPath.startsWith('//')
      ? rawPath
      : '/beranda';
  const targetUrl = new URL(path, self.location.origin).href;

  event.waitUntil((async () => {
    const clientList = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });

    const sameOriginClient = clientList.find((client) => {
      try {
        return new URL(client.url).origin === self.location.origin;
      } catch {
        return false;
      }
    });

    if (sameOriginClient) {
      if ('navigate' in sameOriginClient && sameOriginClient.url !== targetUrl) {
        await sameOriginClient.navigate(targetUrl);
      }
      await sameOriginClient.focus();
      return;
    }

    if (self.clients.openWindow) {
      await self.clients.openWindow(targetUrl);
    }
  })());
});

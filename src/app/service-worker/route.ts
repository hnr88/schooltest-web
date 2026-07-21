const SERVICE_WORKER_SOURCE = `
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    return;
  }
  if (!payload || typeof payload.title !== 'string' || !payload.title) return;
  const options = {};
  if (typeof payload.body === 'string') options.body = payload.body;
  if (typeof payload.url === 'string') options.data = { url: payload.url };
  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url;
  if (typeof url !== 'string') return;
  let destination;
  try {
    destination = new URL(url, self.location.origin);
  } catch {
    return;
  }
  if (destination.origin !== self.location.origin) return;
  event.waitUntil(clients.openWindow(destination.href));
});
`;

export function GET(): Response {
  return new Response(SERVICE_WORKER_SOURCE, {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/javascript; charset=utf-8',
      'Service-Worker-Allowed': '/',
    },
  });
}

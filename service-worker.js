const CACHE_NAME = 'verdant-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

// Handle notification click — open the app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes(self.location.origin)) {
          return client.focus();
        }
      }
      return clients.openWindow('/');
    })
  );
});

// Listen for messages from the main app to schedule checks
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'CHECK_PLANTS') {
    checkAndNotify(e.data.plants, e.data.today);
  }
});

function checkAndNotify(plants, today) {
  const overdue = [];
  const dueToday = [];

  plants.forEach(p => {
    if (!p.waterDays) return;
    const wDays = p.lastWater ? Math.round((today - p.lastWater) / 86400000) : null;
    if (wDays !== null) {
      const rem = p.waterDays - wDays;
      if (rem <= 0) overdue.push(p.name);
      else if (rem === 1) dueToday.push(p.name);
    }
  });

  if (overdue.length === 0 && dueToday.length === 0) return;

  let title = '🌿 Verdant Plant Reminder';
  let body = '';

  if (overdue.length > 0) {
    body += `💧 Overdue: ${overdue.join(', ')}. `;
  }
  if (dueToday.length > 0) {
    body += `⏰ Due tomorrow: ${dueToday.join(', ')}.`;
  }

  self.registration.showNotification(title, {
    body: body.trim(),
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'verdant-daily',
    renotify: true,
    requireInteraction: false,
  });
}

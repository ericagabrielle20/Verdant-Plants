const CACHE = 'verdant-v2';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes(self.location.origin)) return c.focus();
      }
      return clients.openWindow('/');
    })
  );
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'VERDANT_CHECK') {
    const { plants, now } = e.data;
    const overdue = [], dueSoon = [];
    plants.forEach(p => {
      if (!p.lastWater || !p.waterDays) return;
      const daysSince = Math.round((now - p.lastWater) / 86400000);
      const rem = p.waterDays - daysSince;
      if (rem <= 0) overdue.push(p.name);
      else if (rem === 1) dueSoon.push(p.name);
    });
    if (!overdue.length && !dueSoon.length) return;
    let body = '';
    if (overdue.length) body += 'Overdue: ' + overdue.join(', ') + '. ';
    if (dueSoon.length) body += 'Due tomorrow: ' + dueSoon.join(', ');
    self.registration.showNotification('Verdant — Plant Reminder', {
      body: body.trim(),
      tag: 'verdant-daily',
      renotify: true
    });
  }
});

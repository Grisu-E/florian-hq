// Hühnerhotel – Service Worker (Push + Offline-Hülle)
const CACHE = 'huehnerhotel-v16';
const SHELL = ['./', './index.html', './icon.svg', './icon-192.png', './manifest.webmanifest'];

self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });

// Netzwerk zuerst, nur die App-Hülle offline aus dem Cache
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  // immer frisch vom Server holen (am HTTP-Zwischenspeicher vorbei), nur offline aus dem Cache
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then((r) => { const c = r.clone(); caches.open(CACHE).then((x) => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request).then((r) => r || caches.match('./'))));
});

self.addEventListener('push', (e) => {
  let d = {}; try { d = e.data.json(); } catch { d = { title: 'Hühnerhotel', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Hühnerhotel', {
    body: d.body || '', icon: 'icon-192.png', badge: 'icon-192.png', image: d.image || undefined, data: { url: d.url || './' },
    tag: d.title && d.title.includes('Klappe') ? 'klappe' : undefined, renotify: true,
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || './', self.registration.scope).href;
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ws) => {
    for (const w of ws) if (w.url.startsWith(self.registration.scope)) { w.navigate(url); return w.focus(); }
    return clients.openWindow(url);
  }));
});

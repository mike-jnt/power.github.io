importScripts('https://cdn.jsdelivr.net/npm/idb@7/build/umd.js');

const CACHE_NAME = 'agenda-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './main.min.css'
];

// Instalar y caché inicial
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// Activar y limpiar caché vieja
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
});

// Fetch con fallback
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});

// Background Sync
self.addEventListener('sync', event => {
  if (event.tag === 'sync-events') {
    event.waitUntil(syncEvents());
  }
});

async function syncEvents() {
  const db = await idb.openDB("agenda-db", 1);
  const tx = db.transaction("pending", "readwrite");
  const store = tx.objectStore("pending");
  const allEvents = await store.getAll();

  for (const ev of allEvents) {
    try {
      await fetch('https://firestore.googleapis.com/v1/projects/agenda-6cd10/databases/(default)/documents/eventos', {
        method: 'POST',
        body: JSON.stringify({
          fields: {
            id: { stringValue: ev.id },
            title: { stringValue: ev.title },
            start: { stringValue: ev.start },
            date: { stringValue: ev.date },
            time: { stringValue: ev.time },
            type: { stringValue: ev.type },
            note: { stringValue: ev.note }
          }
        }),
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      console.error('⛔ Error al sincronizar evento:', err);
    }
  }

  // Borra eventos ya sincronizados
  await store.clear();
  console.log('✅ Eventos sincronizados');
}

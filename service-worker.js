self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('agenda-cache').then(cache => {
      return cache.addAll([
        './',
        './index.html',
        './manifest.json',
        './icons/icon-192.png',
        './icons/icon-512.png'
        // Agrega aquí tus otros archivos CSS y JS si los tienes localmente
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

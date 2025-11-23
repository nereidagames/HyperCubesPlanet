const CACHE_NAME = 'hypercubesplanet-dev-v4'; // ZMIANA WERSJI NA V4

// Lista plików, które mają być dostępne offline.
const urlsToCache = [
  './',
  './index.html',
  './main.js',
  './manifest.json',
  
  // Główne skrypty JS
  './ui.js',
  './scene.js',
  './controls.js',
  './character.js',
  './multiplayer.js',
  './CoinManager.js',
  './BlockManager.js',
  
  // Menedżery budowania
  './BuildManager.js',
  './SkinBuilderManager.js',
  './PrefabBuilderManager.js',
  './HyperCubePartBuilderManager.js',
  './BuildCameraController.js',

  // Skrypty przechowujące dane (Storage)
  './WorldStorage.js',
  './SkinStorage.js',
  './PrefabStorage.js',
  './HyperCubePartStorage.js',

  // Ikony UI i aplikacji
  'icons/favicon.png',
  'icons/icon-play.png',
  'icons/icon-build.png',
  'icons/icon-shop.png',
  'icons/icon-discover.png',
  'icons/icon-more.png',
  'icons/icon-coin.png',
  'icons/icon-friends.png',
  'icons/icon-jump.png',
  'icons/icon-back.png',
  'icons/logo-poczta.png',
  'icons/icon-newhypercube.png',
  'icons/icon-newhypercubepart.png',
  'icons/icon-newworld.png',
  'icons/icon-newprefab.png',
  'icons/icon-smallworld.png',
  'icons/icon-mediumworld.png',
  'icons/icon-bigworld.png',
  'icons/icon-download.png',

  // Tekstury bloków
  'textures/ziemia.png',
  'textures/trawa.png',
  'textures/drewno.png',
  'textures/piasek.png',
  'textures/beton.png'
];

// Instalacja Service Workera
self.addEventListener('install', event => {
  console.log('Service Worker v4: Instalacja...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker v4: Cache otwarty');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Aktywacja i czyszczenie starych cache
self.addEventListener('activate', event => {
  console.log('Service Worker v4: Aktywacja...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Usuwanie starego cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Strategia Network First dla kodu
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (url.pathname.endsWith('.html') || 
      url.pathname.endsWith('.js') || 
      url.pathname.endsWith('.json') ||
      url.pathname.endsWith('/')) {
      
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          const clonedResponse = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clonedResponse));
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
  }
});
const CACHE_NAME = 'hypercubesplanet-dev-v3';

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
  console.log('Service Worker: Instalacja...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cache otwarty, cachowanie plików...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Wymuś natychmiastową aktywację
        self.skipWaiting();
      })
  );
});

// Aktywacja i czyszczenie starych cache
self.addEventListener('activate', event => {
  console.log('Service Worker: Aktywacja...');
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
    }).then(() => {
        // Przejmij kontrolę nad kartami od razu
        return self.clients.claim();
    })
  );
});

// Strategia pobierania (Network First dla kodu, Cache First dla zasobów)
self.addEventListener('fetch', event => {
  // Ignoruj żądania inne niż GET
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // Sprawdź, czy żądanie dotyczy plików kodu (HTML, JS, JSON)
  // Dla tych plików używamy strategii "Network First" - zawsze próbuj pobrać świeże z sieci.
  if (url.pathname.endsWith('.html') || 
      url.pathname.endsWith('.js') || 
      url.pathname.endsWith('.json') ||
      url.pathname.endsWith('/')) { // Główny URL (index)
      
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          // Jeśli udało się pobrać z sieci, zaktualizuj cache i zwróć odpowiedź
          const clonedResponse = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clonedResponse));
          return networkResponse;
        })
        .catch(() => {
          // Jeśli brak sieci, spróbuj wziąć z cache
          return caches.match(event.request);
        })
    );
  } else {
    // Dla obrazków, tekstur i ikon używamy strategii "Cache First" - bierz z cache dla szybkości.
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Jeśli nie ma w cache, pobierz z sieci
          return fetch(event.request).then(networkResponse => {
             const clonedResponse = networkResponse.clone();
             caches.open(CACHE_NAME).then(cache => cache.put(event.request, clonedResponse));
             return networkResponse;
          });
        })
    );
  }
});
// --- POPRAWKA: Zmiana nazwy cache na v2, aby wymusić aktualizację ---
const CACHE_NAME = 'hypercubesplanet-cache-v2';

// Lista wszystkich plików, które muszą być dostępne offline, aby gra działała.
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',

  // Główne skrypty JS
  './main.js',
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

  // Tekstury bloków
  'textures/ziemia.png',
  'textures/trawa.png',
  'textures/drewno.png',
  'textures/piasek.png',
  'textures/beton.png'
];

// Instalacja Service Workera i zapisanie zasobów w pamięci podręcznej
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting(); // Wymuś aktywację nowego Service Workera
});

// --- POPRAWKA: Dodanie obsługi zdarzenia 'activate' do czyszczenia starych cache ---
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Przejmij kontrolę nad wszystkimi otwartymi kartami
});


// Przechwytywanie żądań sieciowych
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Jeśli zasób jest w pamięci podręcznej, zwróć go.
        if (response) {
          return response;
        }
        // W przeciwnym razie, pobierz go z sieci.
        return fetch(event.request);
      })
  );
});

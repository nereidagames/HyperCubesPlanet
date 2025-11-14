// POPRAWKA: Zmiana nazwy cache na v2.
// Zawsze zmieniaj tę nazwę (np. na v3, v4), gdy aktualizujesz pliki w urlsToCache.
// To zmusi przeglądarkę do pobrania nowych wersji plików.
const CACHE_NAME = 'hypercubesplanet-cache-v2';

// Lista wszystkich plików, które muszą być dostępne offline, aby gra działała.
// Upewnij się, że wszystkie kluczowe zasoby są tutaj wymienione.
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
  'icons/icon-download.png', // Dodano brakującą ikonę

  // Tekstury bloków
  'textures/ziemia.png',
  'textures/trawa.png',
  'textures/drewno.png',
  'textures/piasek.png',
  'textures/beton.png'
];

// Instalacja Service Workera i zapisanie zasobów w pamięci podręcznej
self.addEventListener('install', event => {
  console.log('Service Worker: Instalacja...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cache otwarty, cachowanie plików...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // POPRAWKA: Wymuś aktywację nowego Service Workera od razu.
        // Dzięki temu użytkownik nie musi zamykać i otwierać karty, aby dostać aktualizację.
        self.skipWaiting();
      })
  );
});

// POPRAWKA: Dodano obsługę zdarzenia 'activate' do czyszczenia starych cache.
// Jest to kluczowe dla prawidłowego zarządzania wersjami.
self.addEventListener('activate', event => {
  console.log('Service Worker: Aktywacja...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Jeśli nazwa cache nie pasuje do aktualnej, usuwamy ją.
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Usuwanie starego cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        // POPRAWKA: Przejmij kontrolę nad wszystkimi otwartymi kartami.
        // To zapewnia, że wszystkie karty będą używać nowego Service Workera.
        return self.clients.claim();
    })
  );
});

// Przechwytywanie żądań sieciowych (strategia: Cache First, Falling Back to Network)
self.addEventListener('fetch', event => {
  // Ignoruj żądania, które nie są typu GET (np. POST do serwera WebSocket)
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Jeśli zasób jest w pamięci podręcznej, zwróć go. To działa offline.
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Jeśli zasobu nie ma w cache, pobierz go z sieci.
        return fetch(event.request).then(networkResponse => {
          // Opcjonalnie: można tutaj dodać logikę dynamicznego cachowania,
          // ale dla zasobów gry lepiej trzymać się listy w 'urlsToCache'.
          return networkResponse;
        });
      })
      .catch(error => {
        // Ta część może być użyta do zwrócenia strony "offline", jeśli zawiedzie zarówno cache, jak i sieć.
        console.error('Service Worker: Błąd podczas pobierania zasobu:', error);
        // Można zwrócić zapasowy obrazek lub stronę HTML.
      })
  );
});

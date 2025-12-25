/* PLIK: sw.js */
const CACHE_NAME = 'hypercubesplanet-dev-v6'; // Podbita wersja cache

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
  './IntroManager.js', // Dodano IntroManager
  './StarterSkins.js', // Dodano StarterSkins
  
  // Menedżery
  './BuildManager.js',
  './SkinBuilderManager.js',
  './PrefabBuilderManager.js',
  './HyperCubePartBuilderManager.js',
  './BuildCameraController.js',
  './FriendsManager.js',
  './MailManager.js',
  './NewsManager.js',
  './HighScoresManager.js',
  './WallManager.js',

  // Storage
  './WorldStorage.js',
  './SkinStorage.js',
  './PrefabStorage.js',
  './HyperCubePartStorage.js',

  // Config & Templates
  './Config.js',
  './UITemplates.js',
  './GameCore.js',
  './GameStateManager.js',
  './AssetLoader.js',

  // Ikony UI
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
  'icons/icon-like.png',
  'icons/icon-chat.png',
  'icons/icon-share.png',
  'icons/icon-level.png',
  'icons/icon-check.png',
  'icons/icon-home.png',
  'icons/icon-restart.png',
  'icons/icon-next.png',
  'icons/logo-poczta.png',
  'icons/icon-newhypercube.png',
  'icons/icon-newhypercubepart.png',
  'icons/icon-newworld.png',
  'icons/icon-newprefab.png',
  'icons/icon-smallworld.png',
  'icons/icon-mediumworld.png',
  'icons/icon-bigworld.png',
  'icons/icon-download.png',
  'icons/icon-bar.png',
  'icons/alert.png',
  'icons/usmiech.png',
  'icons/gamepad.png',
  'icons/NavigationButton.png',
  'icons/sciana.png',
  'icons/arrow-left.png',
  'icons/arrow-right.png',
  'icons/vip.png',
  'icons/vip_badge.png',
  'icons/szukaj.png',
  'icons/wtymswiecie.png',
  'icons/grazinnymi.png',
  'icons/misje.png',
  'icons/nagrody.png',
  'icons/highscores.png',
  'icons/tworzenie.png',
  'icons/bezpieczenstwo.png',
  'icons/opcje.png',
  'icons/wyloguj.png',

  // Tekstury bloków (STARE)
  'textures/ziemia.png',
  'textures/trawa.png',
  'textures/drewno.png',
  'textures/piasek.png',
  'textures/beton.png',

  // Tekstury bloków (NOWE)
  'textures/dzins.png',
  'textures/karton.png',
  'textures/cegla.png',
  'textures/drewnianapodloga.png',
  'textures/metalowasiatka.png',
  'textures/bruk.png',
  'textures/kamien.png',
  'textures/otoczak.png',
  'textures/metalowaplyta.png',
  'textures/granit.png',
  'textures/cukierek.png',
  'textures/gladki.png'
];

// Instalacja Service Workera
self.addEventListener('install', event => {
  console.log('Service Worker v6: Instalacja...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Aktywacja i czyszczenie starych cache
self.addEventListener('activate', event => {
  console.log('Service Worker v6: Aktywacja...');
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

/**
 * Service Worker for Festival Budaya Nyepi
 * Enables offline caching and faster reloads
 */

const CACHE_NAME = 'nyepi-festival-v1';

// Assets to cache on install
const PRECACHE_ASSETS = [
  './',
  './index.html'
];

// Cache patterns for runtime caching
const CACHE_PATTERNS = {
  // GLB models - cache for 30 days (large, rarely change)
  models: {
    pattern: /\.(glb|gltf)$/,
    strategy: 'cache-first',
    maxAge: 30 * 24 * 60 * 60 * 1000
  },
  // Audio files - cache for 30 days
  audio: {
    pattern: /\.(mp3|m4a|ogg|wav)$/,
    strategy: 'cache-first',
    maxAge: 30 * 24 * 60 * 60 * 1000
  },
  // Images and textures
  images: {
    pattern: /\.(png|jpg|jpeg|gif|webp|svg)$/,
    strategy: 'cache-first',
    maxAge: 7 * 24 * 60 * 60 * 1000
  },
  // JS/CSS - network first with cache fallback (for updates)
  scripts: {
    pattern: /\.(js|css)$/,
    strategy: 'network-first',
    maxAge: 24 * 60 * 60 * 1000
  }
};

// Install event - precache essential assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching assets');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => {
      // Skip waiting to activate immediately
      return self.skipWaiting();
    })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip cross-origin requests (like Draco decoder from CDN)
  if (url.origin !== location.origin) return;
  
  // Determine caching strategy based on file type
  let strategy = 'network-first';
  
  for (const [type, config] of Object.entries(CACHE_PATTERNS)) {
    if (config.pattern.test(url.pathname)) {
      strategy = config.strategy;
      break;
    }
  }
  
  if (strategy === 'cache-first') {
    // Cache-first: Try cache, fallback to network
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          console.log('[SW] Cache hit:', url.pathname);
          return response;
        }
        
        console.log('[SW] Cache miss, fetching:', url.pathname);
        return fetch(event.request).then((networkResponse) => {
          // Clone response before caching
          const responseToCache = networkResponse.clone();
          
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
          return networkResponse;
        });
      })
    );
  } else {
    // Network-first: Try network, fallback to cache
    event.respondWith(
      fetch(event.request).then((networkResponse) => {
        // Cache the fresh response
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        console.log('[SW] Network failed, trying cache:', url.pathname);
        return caches.match(event.request);
      })
    );
  }
});

// Message handler for cache management
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data === 'clearCache') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[SW] Cache cleared');
    });
  }
});

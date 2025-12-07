// SmokeSpot Service Worker v2
const CACHE_VERSION = 'v2'
const CACHE_NAME = `smokespot-${CACHE_VERSION}`
const STATIC_CACHE = `smokespot-static-${CACHE_VERSION}`
const DATA_CACHE = `smokespot-data-${CACHE_VERSION}`
const TILE_CACHE = `smokespot-tiles-${CACHE_VERSION}`

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/smoking-icon.svg'
]

// Maximum cache sizes
const MAX_TILE_CACHE = 500 // Max number of map tiles to cache
const MAX_DATA_CACHE_AGE = 24 * 60 * 60 * 1000 // 24 hours

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('Caching static assets')
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, DATA_CACHE, TILE_CACHE]
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName.startsWith('smokespot-') && !currentCaches.includes(cacheName)
          })
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          })
      )
    }).then(() => {
      console.log('[SW] Service worker activated')
      return self.clients.claim()
    })
  )
})

// Limit cache size utility
async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  if (keys.length > maxSize) {
    const deleteCount = keys.length - maxSize
    console.log(`[SW] Trimming ${deleteCount} entries from ${cacheName}`)
    for (let i = 0; i < deleteCount; i++) {
      await cache.delete(keys[i])
    }
  }
}

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) return

  // Handle API requests (spots data)
  if (url.pathname.includes('/data/')) {
    event.respondWith(
      caches.open(DATA_CACHE).then((cache) => {
        return fetch(request)
          .then((response) => {
            if (response.ok) {
              cache.put(request, response.clone())
            }
            return response
          })
          .catch(() => cache.match(request))
      })
    )
    return
  }

  // Handle map tiles - stale while revalidate strategy
  if (url.hostname.includes('basemaps.cartocdn.com') ||
      url.hostname.includes('tile.') ||
      url.hostname.includes('tiles.')) {
    event.respondWith(
      caches.open(TILE_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse.ok) {
                cache.put(request, networkResponse.clone())
                // Limit tile cache size
                limitCacheSize(TILE_CACHE, MAX_TILE_CACHE)
              }
              return networkResponse
            })
            .catch(() => {
              // Network failed, return cached or error
              return cachedResponse || new Response('', { status: 503 })
            })
          return cachedResponse || fetchPromise
        })
      })
    )
    return
  }

  // Handle static assets - cache first
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }
      return fetch(request).then((response) => {
        if (response.ok && url.origin === self.location.origin) {
          const responseClone = response.clone()
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, responseClone)
          })
        }
        return response
      })
    })
  )
})

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data || {}

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break

    case 'CLEAR_CACHE':
      event.waitUntil(
        caches.keys().then((cacheNames) => {
          return Promise.all(
            cacheNames
              .filter(name => name.startsWith('smokespot-'))
              .map(name => caches.delete(name))
          )
        }).then(() => {
          // Notify all clients
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({ type: 'CACHE_CLEARED' })
            })
          })
        })
      )
      break

    case 'GET_CACHE_STATUS':
      event.waitUntil(
        getCacheStatus().then(status => {
          event.source.postMessage({ type: 'CACHE_STATUS', data: status })
        })
      )
      break
  }
})

// Get cache status
async function getCacheStatus() {
  const staticCache = await caches.open(STATIC_CACHE)
  const dataCache = await caches.open(DATA_CACHE)
  const tileCache = await caches.open(TILE_CACHE)

  const staticKeys = await staticCache.keys()
  const dataKeys = await dataCache.keys()
  const tileKeys = await tileCache.keys()

  return {
    staticAssets: staticKeys.length,
    dataEntries: dataKeys.length,
    tiles: tileKeys.length,
    version: CACHE_VERSION
  }
}

// Background sync for offline spot submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-spots') {
    event.waitUntil(syncSpots())
  }
})

async function syncSpots() {
  console.log('[SW] Syncing offline spots...')
  // Get pending spots from IndexedDB and sync
  // This would be implemented when backend API is available
}

// Push notifications (future feature)
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {}
  const title = data.title || 'SmokeSpot'
  const options = {
    body: data.body || '새로운 알림이 있습니다',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.id
    }
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow('/')
  )
})

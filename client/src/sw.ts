import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare const self: ServiceWorkerGlobalScope

// Precache all static assets
precacheAndRoute(self.__WB_MANIFEST)

// Clean up old caches
cleanupOutdatedCaches()

// Cache API responses
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/gutenberg/'),
  new NetworkFirst({
    cacheName: 'gutenberg-api',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      }),
    ],
  })
)

// Cache book texts aggressively
registerRoute(
  ({ url }) => url.origin === 'https://www.gutenberg.org',
  new CacheFirst({
    cacheName: 'gutenberg-texts',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      }),
    ],
  })
)

// Cache analysis API with stale-while-revalidate
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/analyze/'),
  new StaleWhileRevalidate({
    cacheName: 'analysis-api',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60, // 1 hour
      }),
    ],
  })
)

// Handle offline fallback
self.addEventListener('fetch', (event) => {
  // Only handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Return the cached index.html for offline support
        return caches.match('/index.html') || new Response('Offline', { 
          status: 503,
          statusText: 'Service Unavailable'
        })
      })
    )
  }
})

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle any background sync tasks
      handleBackgroundSync()
    )
  }
})

async function handleBackgroundSync() {
  // Implement background sync logic for failed API calls
  console.log('Background sync triggered')
}

// Notification handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  // Handle notification clicks
  event.waitUntil(
    self.clients.openWindow('/')
  )
})

// Skip waiting and immediately activate
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Notify clients of updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: '1.0.0' })
  }
})

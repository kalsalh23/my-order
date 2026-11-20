// Mandoub Taiba Service Worker
// Version: 1.0.0

const CACHE_NAME = 'mandoub-taiba-v1'
const STATIC_CACHE = 'mandoub-taiba-static-v1'
const DYNAMIC_CACHE = 'mandoub-taiba-dynamic-v1'
const IMAGE_CACHE = 'mandoub-taiba-images-v1'
const API_CACHE = 'mandoub-taiba-api-v1'

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

const CACHE_STRATEGIES = {
  static: 'cache-first',
  dynamic: 'network-first',
  images: 'cache-first',
  api: 'network-first',
}

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== IMAGE_CACHE && name !== API_CACHE)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return
  }

  // Determine cache strategy based on request
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
  } else if (isImageRequest(request)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE))
  } else if (isApiRequest(request)) {
    event.respondWith(networkFirst(request, API_CACHE))
  } else if (isNavigationRequest(request)) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE))
  } else {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE))
  }
})

// Push event
self.addEventListener('push', (event) => {
  if (!event.data) return

  try {
    const data = event.data.json()

    const options = {
      body: data.body,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/badge-72x72.png',
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: data.actions || [
        { action: 'view', title: 'عرض' },
        { action: 'dismiss', title: 'تجاهل' },
      ],
      dir: 'rtl',
      lang: 'ar',
      tag: data.tag || 'mandoub-taiba-notification',
      renotify: true,
      requireInteraction: true,
    }

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  } catch (error) {
    console.error('Push notification error:', error)
  }
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const action = event.action
  const data = event.notification.data

  if (action === 'dismiss') {
    return
  }

  const url = data.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus existing window
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus()
        }
      }
      // Open new window
      return clients.openWindow(url)
    })
  )
})

// Notification close event
self.addEventListener('notificationclose', (event) => {
  // Track notification dismissal if needed
  console.log('Notification closed:', event.notification.tag)
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncPendingOrders())
  }
})

// Helper functions
function isStaticAsset(request) {
  const url = new URL(request.url)
  return (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    STATIC_ASSETS.includes(url.pathname)
  )
}

function isImageRequest(request) {
  const url = new URL(request.url)
  return (
    url.pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|svg|ico)$/i) ||
    url.hostname.includes('supabase.co') && url.pathname.includes('/storage/v1/object/public/')
  )
}

function isApiRequest(request) {
  const url = new URL(request.url)
  return (
    url.hostname.includes('supabase.co') &&
    (url.pathname.includes('/rest/v1/') || url.pathname.includes('/functions/v1/'))
  )
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' ||
    (request.headers.get('Accept') || '').includes('text/html')
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  if (cached) {
    // Return cached version and update in background
    fetchAndCache(request, cacheName)
    return cached
  }

  return fetchAndCache(request, cacheName)
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName)

  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    const cached = await cache.match(request)
    if (cached) {
      return cached
    }
    // Return offline page for navigation requests
    if (isNavigationRequest(request)) {
      return caches.match('/offline.html')
    }
    throw error
  }
}

async function fetchAndCache(request, cacheName) {
  const cache = await caches.open(cacheName)
  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    // Return offline page for navigation requests
    if (isNavigationRequest(request)) {
      return caches.match('/offline.html')
    }
    throw error
  }
}

async function syncPendingOrders() {
  // Implement order synchronization logic
  // This would sync orders created while offline
  console.log('Syncing pending orders...')
}
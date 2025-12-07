// Service Worker utility functions

export interface CacheStatus {
  staticAssets: number
  dataEntries: number
  tiles: number
  version: string
}

export interface ServiceWorkerState {
  isSupported: boolean
  isRegistered: boolean
  isOnline: boolean
  registration: ServiceWorkerRegistration | null
}

// Register service worker
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Service workers are not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    })

    console.log('[SW] Service worker registered:', registration.scope)

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New update available
            console.log('[SW] New content available, please refresh')
            // Optionally dispatch a custom event
            window.dispatchEvent(new CustomEvent('sw-update-available'))
          }
        })
      }
    })

    return registration
  } catch (error) {
    console.error('[SW] Registration failed:', error)
    return null
  }
}

// Unregister service worker
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false
  }

  const registration = await navigator.serviceWorker.ready
  return registration.unregister()
}

// Skip waiting and activate new service worker
export function skipWaiting(): void {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' })
  }
}

// Clear all caches
export function clearCache(): void {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' })
  }
}

// Get cache status
export async function getCacheStatus(): Promise<CacheStatus | null> {
  const controller = navigator.serviceWorker.controller
  if (!controller) {
    return null
  }

  return new Promise((resolve) => {
    const messageHandler = (event: MessageEvent) => {
      if (event.data?.type === 'CACHE_STATUS') {
        navigator.serviceWorker.removeEventListener('message', messageHandler)
        resolve(event.data.data)
      }
    }

    navigator.serviceWorker.addEventListener('message', messageHandler)
    controller.postMessage({ type: 'GET_CACHE_STATUS' })

    // Timeout after 5 seconds
    setTimeout(() => {
      navigator.serviceWorker.removeEventListener('message', messageHandler)
      resolve(null)
    }, 5000)
  })
}

// Listen for service worker messages
export function onServiceWorkerMessage(
  callback: (message: { type: string; data?: unknown }) => void
): () => void {
  const handler = (event: MessageEvent) => {
    callback(event.data)
  }

  navigator.serviceWorker.addEventListener('message', handler)
  return () => navigator.serviceWorker.removeEventListener('message', handler)
}

// Check if service worker is supported and active
export function getServiceWorkerState(): ServiceWorkerState {
  return {
    isSupported: 'serviceWorker' in navigator,
    isRegistered: !!navigator.serviceWorker?.controller,
    isOnline: navigator.onLine,
    registration: null // Would need async to get this
  }
}

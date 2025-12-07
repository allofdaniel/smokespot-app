// Location Search Service using Nominatim API (OpenStreetMap)

export interface SearchResult {
  id: string
  name: string
  displayName: string
  lat: number
  lng: number
  type: string
  importance: number
}

// Rate limiting: Nominatim requires max 1 request per second
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1000

async function waitForRateLimit(): Promise<void> {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    )
  }
  lastRequestTime = Date.now()
}

/**
 * Search for locations using Nominatim API
 */
export async function searchLocation(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) {
    return []
  }

  await waitForRateLimit()

  try {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: '8',
      'accept-language': 'ko,en,ja'
    })

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          'User-Agent': 'SmokeSpot/1.0 (smoking-area-map-app)'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`)
    }

    const data = await response.json()

    return data.map((item: any) => ({
      id: item.place_id?.toString() || item.osm_id?.toString(),
      name: item.name || item.display_name?.split(',')[0] || query,
      displayName: item.display_name || '',
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type || 'place',
      importance: item.importance || 0
    }))
  } catch (error) {
    console.error('Location search error:', error)
    return []
  }
}

/**
 * Reverse geocode: Get address from coordinates
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  await waitForRateLimit()

  try {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lng.toString(),
      format: 'json',
      'accept-language': 'ko,en,ja'
    })

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params}`,
      {
        headers: {
          'User-Agent': 'SmokeSpot/1.0 (smoking-area-map-app)'
        }
      }
    )

    if (!response.ok) {
      return ''
    }

    const data = await response.json()
    return data.display_name || ''
  } catch (error) {
    console.error('Reverse geocode error:', error)
    return ''
  }
}

/**
 * Get user's approximate location from IP (fallback when GPS unavailable)
 */
export async function getApproximateLocation(): Promise<{ lat: number; lng: number } | null> {
  try {
    // Using free IP geolocation service
    const response = await fetch('https://ipapi.co/json/')

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    if (data.latitude && data.longitude) {
      return {
        lat: data.latitude,
        lng: data.longitude
      }
    }

    return null
  } catch (error) {
    console.error('IP geolocation error:', error)
    return null
  }
}

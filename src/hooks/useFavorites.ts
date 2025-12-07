import { useState, useEffect, useCallback } from 'react'
import type { SmokingSpot } from '../types'

const STORAGE_KEY = 'smokespot_favorites'

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch {
      return new Set()
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...favoriteIds]))
  }, [favoriteIds])

  const toggleFavorite = useCallback((spotId: string) => {
    setFavoriteIds(prev => {
      const next = new Set(prev)
      if (next.has(spotId)) {
        next.delete(spotId)
      } else {
        next.add(spotId)
      }
      return next
    })
  }, [])

  const isFavorite = useCallback((spotId: string) => {
    return favoriteIds.has(spotId)
  }, [favoriteIds])

  const getFavoriteSpots = useCallback((allSpots: SmokingSpot[]) => {
    return allSpots.filter(spot => favoriteIds.has(spot.id))
  }, [favoriteIds])

  return {
    favoriteIds,
    favoriteCount: favoriteIds.size,
    toggleFavorite,
    isFavorite,
    getFavoriteSpots
  }
}

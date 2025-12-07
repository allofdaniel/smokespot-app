import { useState, useEffect, useCallback, useRef } from 'react'
import type { SmokingSpot } from '../types'
import { loadAllData, getSpotStatistics } from '../data/dataLoader'

// 캐시 키
const CACHE_KEY = 'smokespot_cache'
const CACHE_TIMESTAMP_KEY = 'smokespot_cache_timestamp'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24시간

export interface LoadingState {
  isLoading: boolean
  progress: number
  message: string
  error: string | null
}

export interface DataLoaderResult {
  spots: SmokingSpot[]
  loadingState: LoadingState
  statistics: {
    byCountry: Record<string, number>
    byRegion: Record<string, number>
    byType: Record<string, number>
    total: number
  } | null
  refresh: () => Promise<void>
  lastUpdated: Date | null
}

// 로컬 스토리지에서 캐시 불러오기
function loadFromCache(): SmokingSpot[] | null {
  try {
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
    if (!timestamp) return null

    const cacheTime = parseInt(timestamp, 10)
    if (Date.now() - cacheTime > CACHE_DURATION) {
      // 캐시 만료
      localStorage.removeItem(CACHE_KEY)
      localStorage.removeItem(CACHE_TIMESTAMP_KEY)
      return null
    }

    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null

    return JSON.parse(cached)
  } catch (error) {
    console.error('캐시 로드 오류:', error)
    return null
  }
}

// 캐시에 저장
function saveToCache(spots: SmokingSpot[]): void {
  try {
    // 큰 데이터는 압축하지 않고 저장 (용량 초과 시 처리)
    if (spots.length > 10000) {
      // 너무 많은 데이터는 일부만 캐시
      const toCache = spots.slice(0, 10000)
      localStorage.setItem(CACHE_KEY, JSON.stringify(toCache))
    } else {
      localStorage.setItem(CACHE_KEY, JSON.stringify(spots))
    }
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
  } catch (error) {
    // localStorage 용량 초과 등의 오류
    console.warn('캐시 저장 실패:', error)
    // 기존 캐시 삭제 후 재시도
    try {
      localStorage.removeItem(CACHE_KEY)
      localStorage.removeItem(CACHE_TIMESTAMP_KEY)
    } catch {
      // 무시
    }
  }
}

export function useDataLoader(apiKey?: string): DataLoaderResult {
  const [spots, setSpots] = useState<SmokingSpot[]>([])
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    progress: 0,
    message: '데이터를 불러오는 중...',
    error: null
  })
  const [statistics, setStatistics] = useState<DataLoaderResult['statistics']>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const isLoadingRef = useRef(false)

  const loadData = useCallback(async (forceRefresh = false) => {
    if (isLoadingRef.current) return
    isLoadingRef.current = true

    setLoadingState({
      isLoading: true,
      progress: 0,
      message: '캐시 확인 중...',
      error: null
    })

    try {
      // 강제 새로고침이 아니면 캐시 확인
      if (!forceRefresh) {
        const cached = loadFromCache()
        if (cached && cached.length > 0) {
          setSpots(cached)
          setStatistics(getSpotStatistics(cached))
          setLoadingState({
            isLoading: false,
            progress: 100,
            message: '캐시에서 로드됨',
            error: null
          })
          const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
          if (timestamp) {
            setLastUpdated(new Date(parseInt(timestamp, 10)))
          }
          isLoadingRef.current = false

          // 백그라운드에서 새 데이터 로드
          loadAllData(apiKey).then(newSpots => {
            if (newSpots.length > cached.length) {
              setSpots(newSpots)
              setStatistics(getSpotStatistics(newSpots))
              saveToCache(newSpots)
              setLastUpdated(new Date())
            }
          }).catch(console.error)

          return
        }
      }

      setLoadingState({
        isLoading: true,
        progress: 10,
        message: '로컬 데이터 로드 중...',
        error: null
      })

      // 전체 데이터 로드
      const data = await loadAllData(apiKey)

      setLoadingState({
        isLoading: true,
        progress: 90,
        message: '데이터 처리 중...',
        error: null
      })

      setSpots(data)
      setStatistics(getSpotStatistics(data))
      saveToCache(data)
      setLastUpdated(new Date())

      setLoadingState({
        isLoading: false,
        progress: 100,
        message: `${data.length.toLocaleString()}개 지점 로드 완료`,
        error: null
      })
    } catch (error) {
      console.error('데이터 로드 오류:', error)
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'

      // 오류 발생 시 캐시 확인
      const cached = loadFromCache()
      if (cached && cached.length > 0) {
        setSpots(cached)
        setStatistics(getSpotStatistics(cached))
        setLoadingState({
          isLoading: false,
          progress: 100,
          message: '오프라인 모드 (캐시 데이터 사용)',
          error: `새 데이터를 불러오지 못했습니다: ${errorMessage}`
        })
      } else {
        setLoadingState({
          isLoading: false,
          progress: 0,
          message: '데이터 로드 실패',
          error: errorMessage
        })
      }
    } finally {
      isLoadingRef.current = false
    }
  }, [apiKey])

  const refresh = useCallback(async () => {
    await loadData(true)
  }, [loadData])

  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    spots,
    loadingState,
    statistics,
    refresh,
    lastUpdated
  }
}

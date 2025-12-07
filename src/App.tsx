import { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react'
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, Plus, Navigation, Cigarette, Heart, WifiOff, RefreshCw, User, LogOut } from 'lucide-react'
import L from 'leaflet'
import type { SmokingSpot, FilterState } from './types'
import SpotMarker from './components/SpotMarker'
import SearchBar from './components/SearchBar'
import { ToastContainer, type ToastType } from './components/Toast'
import { useDataLoader } from './hooks/useDataLoader'
import { useFavorites } from './hooks/useFavorites'
import { useAuth } from './contexts/AuthContext'

// Lazy load heavy components
const SpotPopup = lazy(() => import('./components/SpotPopup'))
const FilterPanel = lazy(() => import('./components/FilterPanel'))
const AddSpotModal = lazy(() => import('./components/AddSpotModal'))
const FavoritesPanel = lazy(() => import('./components/FavoritesPanel'))
const ErrorDisplay = lazy(() => import('./components/ErrorDisplay'))
const LoginModal = lazy(() => import('./components/LoginModal'))
const AdBanner = lazy(() => import('./components/AdBanner'))

// Loading fallback component
const LoadingFallback = () => (
  <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="glass-card p-6">
      <div className="w-8 h-8 border-2 border-aurora-mint/30 border-t-aurora-mint rounded-full animate-spin" />
    </div>
  </div>
)

// Toast hook
interface ToastItem {
  id: string
  message: string
  type: ToastType
}

function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toasts, addToast, removeToast }
}

// Aurora Background Component
const AuroraBackground = () => (
  <div className="aurora-bg">
    <div className="aurora-blob aurora-blob-1" />
    <div className="aurora-blob aurora-blob-2" />
    <div className="aurora-blob aurora-blob-3" />
  </div>
)

// Map Event Handler with viewport tracking
function MapEventHandler({
  onMapClick,
  onBoundsChange,
  mapRef
}: {
  onMapClick: (lat: number, lng: number) => void
  onBoundsChange: (bounds: L.LatLngBounds) => void
  mapRef: React.MutableRefObject<L.Map | null>
}) {
  const map = useMap()

  useEffect(() => {
    mapRef.current = map
  }, [map, mapRef])

  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
    moveend: () => {
      onBoundsChange(map.getBounds())
    },
    zoomend: () => {
      onBoundsChange(map.getBounds())
    }
  })

  // Initial bounds
  useEffect(() => {
    onBoundsChange(map.getBounds())
  }, [map, onBoundsChange])

  return null
}

// Location Control
function LocationControl({ onLocationError }: { onLocationError?: (message: string) => void }) {
  const map = useMap()
  const [isLoading, setIsLoading] = useState(false)

  const goToCurrentLocation = async () => {
    if (isLoading) return
    setIsLoading(true)

    // Try HTML5 Geolocation first
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          map.flyTo([position.coords.latitude, position.coords.longitude], 16)
          setIsLoading(false)
        },
        async (error) => {
          console.error('Geolocation error:', error)

          // Fallback to IP-based location
          try {
            const { getApproximateLocation } = await import('./services/locationSearch')
            const location = await getApproximateLocation()

            if (location) {
              map.flyTo([location.lat, location.lng], 13)
              onLocationError?.('GPS를 사용할 수 없어 대략적인 위치로 이동했습니다.')
            } else {
              onLocationError?.('현재 위치를 가져올 수 없습니다. 위치 권한을 확인해주세요.')
            }
          } catch {
            onLocationError?.('현재 위치를 가져올 수 없습니다.')
          }

          setIsLoading(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      )
    } else {
      // No geolocation support, try IP-based
      try {
        const { getApproximateLocation } = await import('./services/locationSearch')
        const location = await getApproximateLocation()

        if (location) {
          map.flyTo([location.lat, location.lng], 13)
          onLocationError?.('브라우저에서 위치 서비스를 지원하지 않습니다. 대략적인 위치로 이동했습니다.')
        } else {
          onLocationError?.('위치 서비스를 사용할 수 없습니다.')
        }
      } catch {
        onLocationError?.('위치 서비스를 사용할 수 없습니다.')
      }
      setIsLoading(false)
    }
  }

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5 }}
      onClick={goToCurrentLocation}
      disabled={isLoading}
      className="absolute bottom-24 right-4 z-[1000] glass-button p-4 rounded-full disabled:opacity-50"
      title="현재 위치"
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <Navigation className="w-5 h-5" />
      )}
    </motion.button>
  )
}

// Loading Overlay with Progress
function LoadingOverlay({
  count,
  progress,
  message
}: {
  count: number
  progress: number
  message: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[2000] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm"
    >
      <div className="glass-card p-8 text-center min-w-[300px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 mx-auto mb-4"
        >
          <div className="w-full h-full rounded-full border-4 border-aurora-mint/30 border-t-aurora-mint" />
        </motion.div>
        <h2 className="text-xl font-display font-bold text-gradient mb-2">데이터 로딩 중...</h2>
        <p className="text-white/50 text-sm mb-4">
          {message}
        </p>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            className="h-full bg-gradient-to-r from-aurora-mint to-aurora-purple"
          />
        </div>
        <p className="text-white/40 text-xs mt-2">
          {count > 0 ? `${count.toLocaleString()}개 위치 로드됨` : `${progress}%`}
        </p>
      </div>
    </motion.div>
  )
}

export default function App() {
  const apiKey = import.meta.env.VITE_PUBLIC_DATA_API_KEY
  const { isAuthenticated, user, logout } = useAuth()
  const {
    spots: loadedSpots,
    loadingState,
    refresh,
    lastUpdated
  } = useDataLoader(apiKey)

  const [userSpots, setUserSpots] = useState<SmokingSpot[]>([])
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null)
  const [selectedSpot, setSelectedSpot] = useState<SmokingSpot | null>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [clickedPosition, setClickedPosition] = useState<[number, number] | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [filters, setFilters] = useState<FilterState>({
    showAllowed: true,
    showForbidden: true,
    showUserSpots: true,
    showWithPhotos: false,
    countryFilter: 'all'
  })
  const mapRef = useRef<L.Map | null>(null)
  const { favoriteCount, toggleFavorite, isFavorite, getFavoriteSpots } = useFavorites()
  const { toasts, addToast, removeToast } = useToasts()

  // Combine loaded spots with user-added spots
  const spots = useMemo(() => [...loadedSpots, ...userSpots], [loadedSpots, userSpots])

  // Show toast when there's a background error but data is available
  useEffect(() => {
    if (loadingState.error && spots.length > 0 && !loadingState.isLoading) {
      addToast(loadingState.error, 'warning')
    }
  }, [loadingState.error, loadingState.isLoading, spots.length, addToast])

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Handle bounds change
  const handleBoundsChange = useCallback((bounds: L.LatLngBounds) => {
    setMapBounds(bounds)
  }, [])

  // Filter and limit spots based on viewport (max 500 markers for performance)
  const visibleSpots = useMemo(() => {
    // First filter out any spots without valid coordinates
    let filtered = spots.filter(spot =>
      spot &&
      typeof spot.lat === 'number' &&
      typeof spot.lng === 'number' &&
      !isNaN(spot.lat) &&
      !isNaN(spot.lng) &&
      spot.lat !== 0 &&
      spot.lng !== 0
    )

    // Apply type filters
    filtered = filtered.filter(spot => {
      if (spot.type === 'allowed' && !filters.showAllowed) return false
      if (spot.type === 'forbidden' && !filters.showForbidden) return false
      if (spot.type === 'user' && !filters.showUserSpots) return false
      if (filters.showWithPhotos && (!spot.photos || spot.photos.length === 0)) return false
      // 국가 필터
      if (filters.countryFilter !== 'all' && spot.country !== filters.countryFilter) return false
      return true
    })

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(spot =>
        spot.name?.toLowerCase().includes(query) ||
        spot.address?.toLowerCase().includes(query) ||
        spot.memo?.toLowerCase().includes(query)
      )
    }

    // Apply viewport filter
    if (mapBounds && !searchQuery) {
      filtered = filtered.filter(spot => {
        try {
          return mapBounds.contains([spot.lat, spot.lng])
        } catch {
          return false
        }
      })
    }

    // Limit to 500 markers for performance
    return filtered.slice(0, 500)
  }, [spots, filters, searchQuery, mapBounds])

  // Handle map click for adding new spot
  const handleMapClick = useCallback((lat: number, lng: number) => {
    setClickedPosition([lat, lng])
    setIsAddModalOpen(true)
  }, [])

  // Handle adding new spot
  const handleAddSpot = (newSpot: Omit<SmokingSpot, 'id'>) => {
    const spot: SmokingSpot = {
      ...newSpot,
      id: `user_${Date.now()}`,
      source: 'user',
      createdAt: new Date().toISOString()
    }
    setUserSpots(prev => [...prev, spot])
    setIsAddModalOpen(false)
    setClickedPosition(null)
  }

  // Stats
  const stats = {
    total: spots.length,
    allowed: spots.filter(s => s.type === 'allowed').length,
    forbidden: spots.filter(s => s.type === 'forbidden').length,
    visible: visibleSpots.length
  }

  return (
    <div className="h-full w-full relative overflow-hidden">
      <AuroraBackground />

      {/* Loading Overlay */}
      <AnimatePresence>
        {loadingState.isLoading && (
          <LoadingOverlay
            count={spots.length}
            progress={loadingState.progress}
            message={loadingState.message}
          />
        )}
      </AnimatePresence>

      {/* Error Display */}
      <Suspense fallback={<LoadingFallback />}>
        <AnimatePresence>
          {!loadingState.isLoading && loadingState.error && spots.length === 0 && (
            <ErrorDisplay
              error={loadingState.error}
              isOffline={!isOnline}
              onRetry={refresh}
            />
          )}
        </AnimatePresence>
      </Suspense>

      {/* Offline Indicator */}
      <AnimatePresence>
        {!isOnline && spots.length > 0 && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="absolute top-24 left-1/2 -translate-x-1/2 z-[1002] glass-card px-4 py-2 flex items-center gap-2"
          >
            <WifiOff className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-amber-400">오프라인 모드</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map */}
      <MapContainer
        center={[37.5665, 126.978]}
        zoom={13}
        className="h-full w-full z-10"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <MapEventHandler
          onMapClick={handleMapClick}
          onBoundsChange={handleBoundsChange}
          mapRef={mapRef}
        />
        <LocationControl onLocationError={(msg) => addToast(msg, 'warning')} />

        {visibleSpots.map(spot => (
          <SpotMarker
            key={spot.id}
            spot={spot}
            onClick={() => setSelectedSpot(spot)}
          />
        ))}
      </MapContainer>

      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="absolute top-0 left-0 right-0 z-[1001] p-4"
      >
        <div className="glass-card p-4 flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aurora-mint to-aurora-purple flex items-center justify-center">
              <Cigarette className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-display font-bold text-lg text-gradient">SmokeSpot</h1>
              <p className="text-xs text-white/50">흡연구역 지도</p>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onLocationSelect={(lat, lng, _name) => {
                if (mapRef.current) {
                  mapRef.current.flyTo([lat, lng], 16)
                }
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => refresh()}
              disabled={loadingState.isLoading}
              className="glass-button p-3 rounded-xl disabled:opacity-50"
              title={lastUpdated ? `마지막 업데이트: ${lastUpdated.toLocaleString('ko-KR')}` : '새로고침'}
            >
              <RefreshCw className={`w-5 h-5 ${loadingState.isLoading ? 'animate-spin' : ''}`} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsFavoritesOpen(true)}
              className="glass-button p-3 rounded-xl relative"
            >
              <Heart className="w-5 h-5" />
              {favoriteCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center px-1">
                  {favoriteCount}
                </span>
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsFilterOpen(true)}
              className="glass-button p-3 rounded-xl relative"
            >
              <Filter className="w-5 h-5" />
              {(filters.showWithPhotos || !filters.showAllowed || !filters.showForbidden || !filters.showUserSpots) && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-aurora-mint rounded-full" />
              )}
            </motion.button>

            {/* Login/User Button */}
            {isAuthenticated ? (
              <div className="relative group">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="glass-button p-3 rounded-xl flex items-center gap-2"
                >
                  {user?.picture ? (
                    <img src={user.picture} alt="" className="w-5 h-5 rounded-full" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </motion.button>
                <div className="absolute right-0 top-full mt-2 hidden group-hover:block">
                  <div className="glass-card p-2 min-w-[150px]">
                    <div className="px-3 py-2 text-sm text-white/70 border-b border-white/10">
                      {user?.name || user?.email}
                    </div>
                    <button
                      onClick={logout}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 rounded flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      로그아웃
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsLoginModalOpen(true)}
                className="glass-button px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">로그인</span>
              </motion.button>
            )}
          </div>
        </div>
      </motion.header>

      {/* Stats Bar */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="absolute top-28 left-4 z-[1000] hidden sm:block"
      >
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full bg-smoke-allowed" />
            <span className="text-white/70">흡연구역</span>
            <span className="ml-auto font-semibold text-aurora-mint">{stats.allowed.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full bg-smoke-forbidden" />
            <span className="text-white/70">금연구역</span>
            <span className="ml-auto font-semibold text-red-400">{stats.forbidden.toLocaleString()}</span>
          </div>
          <div className="pt-2 border-t border-white/10 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-white/40">전체</span>
              <span className="text-white/60">{stats.total.toLocaleString()}개</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">화면 표시</span>
              <span className="text-aurora-mint">{stats.visible}개</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Add Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsAddModalOpen(true)}
        className="absolute bottom-6 right-4 z-[1000] glass-button-primary p-5 rounded-full shadow-glow"
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      {/* Legend */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="absolute bottom-6 left-4 z-[1000]"
      >
        <div className="glass-card p-3 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-smoke-allowed" />
            <span className="text-white/70">흡연</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-smoke-forbidden" />
            <span className="text-white/70">금연</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-smoke-user" />
            <span className="text-white/70">사용자</span>
          </div>
        </div>
      </motion.div>

      {/* Filter Panel */}
      <Suspense fallback={<LoadingFallback />}>
        <AnimatePresence>
          {isFilterOpen && (
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              onClose={() => setIsFilterOpen(false)}
            />
          )}
        </AnimatePresence>
      </Suspense>

      {/* Add Spot Modal */}
      <Suspense fallback={<LoadingFallback />}>
        <AnimatePresence>
          {isAddModalOpen && (
            <AddSpotModal
              position={clickedPosition}
              onClose={() => {
                setIsAddModalOpen(false)
                setClickedPosition(null)
              }}
              onSubmit={handleAddSpot}
              onSuccess={(message) => addToast(message, 'success')}
              onError={(message) => addToast(message, 'error')}
            />
          )}
        </AnimatePresence>
      </Suspense>

      {/* Selected Spot Popup */}
      <Suspense fallback={<LoadingFallback />}>
        <AnimatePresence>
          {selectedSpot && (
            <SpotPopup
              spot={selectedSpot}
              onClose={() => setSelectedSpot(null)}
              isFavorite={isFavorite(selectedSpot.id)}
              onToggleFavorite={() => toggleFavorite(selectedSpot.id)}
            />
          )}
        </AnimatePresence>
      </Suspense>

      {/* Favorites Panel */}
      <Suspense fallback={<LoadingFallback />}>
        <AnimatePresence>
          {isFavoritesOpen && (
            <FavoritesPanel
              favorites={getFavoriteSpots(spots)}
              onClose={() => setIsFavoritesOpen(false)}
              onSelectSpot={(spot) => {
                setSelectedSpot(spot)
                setIsFavoritesOpen(false)
              }}
              onRemoveFavorite={toggleFavorite}
              onNavigateToSpot={(lat, lng) => {
                if (mapRef.current) {
                  mapRef.current.flyTo([lat, lng], 16)
                }
                setIsFavoritesOpen(false)
              }}
            />
          )}
        </AnimatePresence>
      </Suspense>

      {/* Toast Notifications */}
      <AnimatePresence>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </AnimatePresence>

      {/* Login Modal */}
      <Suspense fallback={<LoadingFallback />}>
        <AnimatePresence>
          {isLoginModalOpen && (
            <LoginModal onClose={() => setIsLoginModalOpen(false)} />
          )}
        </AnimatePresence>
      </Suspense>

      {/* Ad Banner */}
      <Suspense fallback={null}>
        <AdBanner position="bottom" />
      </Suspense>
    </div>
  )
}

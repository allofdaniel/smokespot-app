import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, MapPin, Clock, Loader2, Navigation } from 'lucide-react'
import { searchLocation, type SearchResult } from '../services/locationSearch'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onLocationSelect?: (lat: number, lng: number, name: string) => void
}

export default function SearchBar({ value, onChange, onLocationSelect }: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [recentSearches, setRecentSearches] = useState<Array<{ name: string; lat: number; lng: number }>>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('smokespot_recent_searches')
      if (saved) {
        setRecentSearches(JSON.parse(saved))
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  // Save recent search
  const saveRecentSearch = useCallback((name: string, lat: number, lng: number) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.name !== name)
      const updated = [{ name, lat, lng }, ...filtered].slice(0, 5)
      try {
        localStorage.setItem('smokespot_recent_searches', JSON.stringify(updated))
      } catch {
        // Ignore localStorage errors
      }
      return updated
    })
  }, [])

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (!value || value.trim().length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)

    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchLocation(value)
      setSearchResults(results)
      setIsSearching(false)
    }, 500)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [value])

  const handleClear = () => {
    onChange('')
    setSearchResults([])
    inputRef.current?.focus()
  }

  const handleResultSelect = (result: SearchResult) => {
    onChange(result.name)
    saveRecentSearch(result.name, result.lat, result.lng)
    setSearchResults([])
    setIsFocused(false)
    onLocationSelect?.(result.lat, result.lng, result.name)
  }

  const handleRecentSelect = (recent: { name: string; lat: number; lng: number }) => {
    onChange(recent.name)
    setIsFocused(false)
    onLocationSelect?.(recent.lat, recent.lng, recent.name)
  }

  const showDropdown = isFocused && (searchResults.length > 0 || (!value && recentSearches.length > 0) || isSearching)

  return (
    <div className="relative">
      <div className={`relative flex items-center transition-all duration-300 ${
        isFocused ? 'ring-2 ring-aurora-mint/30' : ''
      }`}>
        <div className="absolute left-4 pointer-events-none">
          {isSearching ? (
            <Loader2 className="w-5 h-5 text-aurora-mint animate-spin" />
          ) : (
            <Search className={`w-5 h-5 transition-colors ${
              isFocused ? 'text-aurora-mint' : 'text-white/40'
            }`} />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder="장소 검색..."
          className="w-full glass-input pl-12 pr-10"
        />
        <AnimatePresence>
          {value && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={handleClear}
              className="absolute right-3 p-1.5 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-white/50" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 glass-card p-3 z-50 max-h-[300px] overflow-y-auto"
          >
            {/* Search Results */}
            {searchResults.length > 0 && (
              <>
                <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-white/40 mb-2">
                  <Navigation className="w-3.5 h-3.5" />
                  검색 결과
                </div>
                {searchResults.map((result, index) => (
                  <motion.button
                    key={result.id || index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleResultSelect(result)}
                    className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors text-left"
                  >
                    <MapPin className="w-4 h-4 text-aurora-mint mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-white/90 block truncate">{result.name}</span>
                      <span className="text-xs text-white/40 block truncate">{result.displayName}</span>
                    </div>
                  </motion.button>
                ))}
              </>
            )}

            {/* Loading State */}
            {isSearching && searchResults.length === 0 && (
              <div className="flex items-center justify-center py-6 text-white/40">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span className="text-sm">검색 중...</span>
              </div>
            )}

            {/* No Results */}
            {!isSearching && value && searchResults.length === 0 && (
              <div className="text-center py-6 text-white/40 text-sm">
                검색 결과가 없습니다
              </div>
            )}

            {/* Recent Searches */}
            {!value && recentSearches.length > 0 && (
              <>
                <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-white/40 mb-2">
                  <Clock className="w-3.5 h-3.5" />
                  최근 검색
                </div>
                {recentSearches.map((recent, index) => (
                  <motion.button
                    key={recent.name + index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleRecentSelect(recent)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors text-left"
                  >
                    <MapPin className="w-4 h-4 text-white/40" />
                    <span className="text-sm text-white/80">{recent.name}</span>
                  </motion.button>
                ))}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

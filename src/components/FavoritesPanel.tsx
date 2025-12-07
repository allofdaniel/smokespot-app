import { motion } from 'framer-motion'
import { X, Heart, MapPin, Navigation, Trash2 } from 'lucide-react'
import type { SmokingSpot } from '../types'

interface FavoritesPanelProps {
  favorites: SmokingSpot[]
  onClose: () => void
  onSelectSpot: (spot: SmokingSpot) => void
  onRemoveFavorite: (spotId: string) => void
  onNavigateToSpot: (lat: number, lng: number) => void
}

export default function FavoritesPanel({
  favorites,
  onClose,
  onSelectSpot,
  onRemoveFavorite,
  onNavigateToSpot
}: FavoritesPanelProps) {
  const typeColors = {
    allowed: 'bg-smoke-allowed',
    forbidden: 'bg-smoke-forbidden',
    user: 'bg-smoke-user'
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[80vh] glass-card flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-400/20 to-pink-500/20">
                <Heart className="w-5 h-5 text-red-400" fill="currentColor" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-gradient">즐겨찾기</h2>
                <p className="text-xs text-white/50">{favorites.length}개 저장됨</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 glass-button rounded-full hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {favorites.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="p-4 rounded-full bg-white/5 mb-4">
                <Heart className="w-8 h-8 text-white/30" />
              </div>
              <p className="text-white/50 mb-2">즐겨찾기가 비어있습니다</p>
              <p className="text-xs text-white/30">
                장소 상세에서 하트를 눌러 추가하세요
              </p>
            </motion.div>
          ) : (
            favorites.map((spot, index) => (
              <motion.div
                key={spot.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="glass p-4 rounded-xl group hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Type indicator */}
                  <div className={`w-3 h-3 rounded-full ${typeColors[spot.type]} mt-1.5 flex-shrink-0`} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => onSelectSpot(spot)}
                      className="text-left w-full"
                    >
                      <h3 className="font-medium text-white truncate hover:text-aurora-mint transition-colors">
                        {spot.name}
                      </h3>
                      {spot.address && (
                        <p className="text-xs text-white/50 truncate mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {spot.address}
                        </p>
                      )}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onNavigateToSpot(spot.lat, spot.lng)}
                      className="p-2 rounded-lg hover:bg-aurora-mint/20 transition-colors"
                      title="지도에서 보기"
                    >
                      <Navigation className="w-4 h-4 text-aurora-mint" />
                    </button>
                    <button
                      onClick={() => onRemoveFavorite(spot.id)}
                      className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                      title="즐겨찾기 해제"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Footer */}
        {favorites.length > 0 && (
          <div className="p-4 border-t border-white/10">
            <p className="text-xs text-center text-white/30">
              즐겨찾기는 이 기기에 저장됩니다
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

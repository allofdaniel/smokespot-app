import { motion } from 'framer-motion'
import { X, Cigarette, Ban, User, Camera, Globe, MapPin } from 'lucide-react'
import type { FilterState } from '../types'

interface FilterPanelProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  onClose: () => void
}

export default function FilterPanel({ filters, onFiltersChange, onClose }: FilterPanelProps) {
  const toggleFilter = (key: keyof FilterState) => {
    if (key === 'countryFilter') return // 국가 필터는 별도 처리
    onFiltersChange({ ...filters, [key]: !filters[key] })
  }

  const setCountryFilter = (country: 'JP' | 'KR' | 'all') => {
    onFiltersChange({ ...filters, countryFilter: country })
  }

  const filterOptions = [
    {
      key: 'showAllowed' as const,
      label: '흡연구역',
      description: '흡연이 허용된 장소',
      icon: Cigarette,
      color: 'text-smoke-allowed',
      bgColor: 'bg-smoke-allowed/20'
    },
    {
      key: 'showForbidden' as const,
      label: '금연구역',
      description: '흡연이 금지된 장소',
      icon: Ban,
      color: 'text-smoke-forbidden',
      bgColor: 'bg-smoke-forbidden/20'
    },
    {
      key: 'showUserSpots' as const,
      label: '사용자 등록',
      description: '사용자가 등록한 장소',
      icon: User,
      color: 'text-smoke-user',
      bgColor: 'bg-smoke-user/20'
    },
    {
      key: 'showWithPhotos' as const,
      label: '사진 있는 곳만',
      description: '사진이 등록된 장소만 표시',
      icon: Camera,
      color: 'text-aurora-mint',
      bgColor: 'bg-aurora-mint/20'
    }
  ]

  const countryOptions = [
    { key: 'all' as const, label: '전체', flag: '🌏' },
    { key: 'KR' as const, label: '대한민국', flag: '🇰🇷' },
    { key: 'JP' as const, label: '일본', flag: '🇯🇵' }
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm glass-card p-6 max-h-[85vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-bold text-gradient">필터</h2>
          <button
            onClick={onClose}
            className="p-2 glass-button rounded-full hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Country Filter */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-aurora-purple" />
            <span className="text-sm font-medium text-white/70">국가/지역</span>
          </div>
          <div className="flex gap-2">
            {countryOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => setCountryFilter(option.key)}
                className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                  filters.countryFilter === option.key
                    ? 'bg-aurora-purple/30 border border-aurora-purple/50 text-white'
                    : 'bg-white/5 border border-transparent text-white/60 hover:bg-white/10'
                }`}
              >
                <span className="mr-1.5">{option.flag}</span>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 mb-4" />

        {/* Type Filters */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-aurora-mint" />
            <span className="text-sm font-medium text-white/70">장소 유형</span>
          </div>
        </div>

        <div className="space-y-3">
          {filterOptions.map((option, index) => (
            <motion.button
              key={option.key}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => toggleFilter(option.key)}
              className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all duration-200 ${
                filters[option.key]
                  ? `${option.bgColor} border border-white/20`
                  : 'bg-white/5 border border-transparent hover:bg-white/10'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${filters[option.key] ? option.bgColor : 'bg-white/10'}`}>
                <option.icon className={`w-5 h-5 ${filters[option.key] ? option.color : 'text-white/50'}`} />
              </div>
              <div className="flex-1 text-left">
                <div className={`font-medium ${filters[option.key] ? 'text-white' : 'text-white/70'}`}>
                  {option.label}
                </div>
                <div className="text-xs text-white/40">{option.description}</div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                filters[option.key]
                  ? 'border-aurora-mint bg-aurora-mint'
                  : 'border-white/30'
              }`}>
                {filters[option.key] && (
                  <motion.svg
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-3 h-3 text-black"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </motion.svg>
                )}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Reset Button */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={() => onFiltersChange({
            showAllowed: true,
            showForbidden: true,
            showUserSpots: true,
            showWithPhotos: false,
            countryFilter: 'all'
          })}
          className="w-full mt-6 py-3 glass-button rounded-xl text-white/70 hover:text-white"
        >
          필터 초기화
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

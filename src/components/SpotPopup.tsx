import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  X, MapPin, Clock, Umbrella, Armchair, Building2,
  Camera, Navigation, Share2, ExternalLink, Heart, Languages
} from 'lucide-react'
import type { SmokingSpot, LocalizedText } from '../types'

interface SpotPopupProps {
  spot: SmokingSpot
  onClose: () => void
  isFavorite?: boolean
  onToggleFavorite?: () => void
}

// 다국어 텍스트에서 표시할 언어 선택
function getLocalizedName(
  localized: LocalizedText | undefined,
  fallback: string,
  lang: 'original' | 'ko' | 'en'
): string {
  if (!localized) return fallback

  if (lang === 'ko' && localized.ko) return localized.ko
  if (lang === 'en' && localized.en) return localized.en
  return localized.original || fallback
}

// 국가 플래그
function getCountryFlag(country?: string): string {
  switch (country) {
    case 'JP': return '🇯🇵'
    case 'KR': return '🇰🇷'
    case 'US': return '🇺🇸'
    case 'CN': return '🇨🇳'
    default: return '🌏'
  }
}

// 국가명
function getCountryName(country?: string): string {
  switch (country) {
    case 'JP': return '일본'
    case 'KR': return '대한민국'
    case 'US': return '미국'
    case 'CN': return '중국'
    default: return '기타'
  }
}

export default function SpotPopup({ spot, onClose, isFavorite = false, onToggleFavorite }: SpotPopupProps) {
  const [displayLang, setDisplayLang] = useState<'original' | 'ko' | 'en'>('ko')

  const typeLabels = {
    allowed: { text: '흡연구역', color: 'bg-smoke-allowed', icon: '🚬' },
    forbidden: { text: '금연구역', color: 'bg-smoke-forbidden', icon: '🚭' },
    user: { text: '사용자 등록', color: 'bg-smoke-user', icon: '📍' }
  }

  const typeInfo = typeLabels[spot.type]

  const displayName = getLocalizedName(spot.nameLocalized, spot.name, displayLang)
  const displayAddress = getLocalizedName(spot.addressLocalized, spot.address || '', displayLang)
  const displayMemo = getLocalizedName(spot.memoLocalized, spot.memo || '', displayLang)

  // 일본어 원본이 있는지 확인
  const hasJapaneseOriginal = spot.nameLocalized?.originalLang === 'ja'

  const handleNavigate = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`
    window.open(url, '_blank')
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: displayName,
          text: `${displayName} - ${typeInfo.text}`,
          url: `https://smokemap.app/spot/${spot.id}`
        })
      } catch (err) {
        console.log('Share cancelled')
      }
    } else {
      navigator.clipboard.writeText(`${displayName}\n${displayAddress}\n위치: ${spot.lat}, ${spot.lng}`)
      alert('클립보드에 복사되었습니다!')
    }
  }

  const cycleLang = () => {
    if (displayLang === 'ko') setDisplayLang('en')
    else if (displayLang === 'en') setDisplayLang('original')
    else setDisplayLang('ko')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 100, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md glass-card overflow-hidden max-h-[85vh] overflow-y-auto"
      >
        {/* Photo Gallery */}
        {spot.photos && spot.photos.length > 0 && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={spot.photos[0]}
              alt={displayName}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            {spot.photos.length > 1 && (
              <div className="absolute bottom-3 right-3 glass px-2 py-1 rounded-lg text-xs flex items-center gap-1">
                <Camera className="w-3 h-3" />
                {spot.photos.length}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${typeInfo.color} text-white`}>
                  {typeInfo.icon} {typeInfo.text}
                </span>
                {spot.is24Hours && (
                  <span className="px-2 py-1 rounded-lg text-xs font-medium bg-aurora-mint/20 text-aurora-mint">
                    24시간
                  </span>
                )}
                {/* 국가 배지 */}
                <span className="px-2 py-1 rounded-lg text-xs font-medium bg-white/10 text-white/70">
                  {getCountryFlag(spot.country)} {getCountryName(spot.country)}
                </span>
              </div>

              {/* 이름 */}
              <h2 className="text-xl font-display font-bold text-white mb-1">{displayName}</h2>

              {/* 원본이 다른 언어인 경우 원본도 표시 */}
              {hasJapaneseOriginal && displayLang !== 'original' && spot.nameLocalized?.original && (
                <p className="text-xs text-white/40">{spot.nameLocalized.original}</p>
              )}

              {/* 지역 정보 */}
              {(spot.region || spot.district) && (
                <p className="text-xs text-white/50 mt-1">
                  {spot.region}{spot.district ? ` ${spot.district}` : ''}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* 언어 전환 버튼 (일본어 데이터일 때만) */}
              {hasJapaneseOriginal && (
                <button
                  onClick={cycleLang}
                  className="p-2 glass-button rounded-full hover:bg-white/20"
                  title={`언어: ${displayLang === 'ko' ? '한국어' : displayLang === 'en' ? 'English' : '原文'}`}
                >
                  <Languages className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 glass-button rounded-full hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Address */}
          {displayAddress && (
            <div className="flex items-start gap-3 mb-4 text-white/70">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{displayAddress}</span>
            </div>
          )}

          {/* Memo */}
          {displayMemo && (
            <p className="text-sm text-white/60 mb-4 bg-white/5 rounded-xl p-3">
              {displayMemo}
            </p>
          )}

          {/* Features */}
          <div className="flex flex-wrap gap-2 mb-5">
            {spot.hasRoof && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 glass rounded-full text-xs">
                <Umbrella className="w-3.5 h-3.5 text-aurora-mint" />
                지붕 있음
              </span>
            )}
            {spot.hasChair && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 glass rounded-full text-xs">
                <Armchair className="w-3.5 h-3.5 text-aurora-mint" />
                의자 있음
              </span>
            )}
            {spot.isEnclosed && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 glass rounded-full text-xs">
                <Building2 className="w-3.5 h-3.5 text-aurora-mint" />
                실내
              </span>
            )}
          </div>

          {/* Business Hours */}
          {spot.businessHour && (
            <div className="flex items-center gap-3 mb-4 text-sm text-white/70">
              <Clock className="w-4 h-4" />
              <span>{spot.businessHour}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              onClick={handleNavigate}
              className="flex-1 glass-button-primary py-3 rounded-xl flex items-center justify-center gap-2 font-medium"
            >
              <Navigation className="w-4 h-4" />
              길찾기
            </button>
            {onToggleFavorite && (
              <button
                onClick={onToggleFavorite}
                className={`glass-button py-3 px-4 rounded-xl transition-colors ${
                  isFavorite ? 'bg-red-500/20 border-red-500/30' : ''
                }`}
                title={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
              >
                <Heart
                  className={`w-4 h-4 transition-colors ${isFavorite ? 'text-red-400' : ''}`}
                  fill={isFavorite ? 'currentColor' : 'none'}
                />
              </button>
            )}
            <button
              onClick={handleShare}
              className="glass-button py-3 px-4 rounded-xl"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {spot.webPage && (
              <a
                href={spot.webPage}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-button py-3 px-4 rounded-xl"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>

          {/* Source */}
          <div className="mt-4 text-center">
            <span className="text-xs text-white/30">
              출처: {spot.source === 'kitsuenjo' ? '喫煙所マップ' : spot.source === 'public_api' ? '공공데이터' : '사용자'}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

import { memo, useMemo } from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { SmokingSpot } from '../types'

interface SpotMarkerProps {
  spot: SmokingSpot
  onClick: () => void
}

// Icon cache to prevent recreation
const iconCache = new Map<string, L.DivIcon>()
const photoIconCache = new Map<string, L.DivIcon>()

// Create custom marker icons with caching (no photo)
const createMarkerIcon = (type: SmokingSpot['type']): L.DivIcon => {
  const cacheKey = `${type}-no-photo`

  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey)!
  }

  const colors = {
    allowed: { bg: '#22D3EE', border: '#06B6D4' },
    forbidden: { bg: '#F87171', border: '#EF4444' },
    user: { bg: '#A78BFA', border: '#8B5CF6' }
  }

  const color = colors[type]
  const size = 28

  const icon = L.divIcon({
    className: 'spot-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html: `
      <div class="marker-icon marker-${type}" style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: linear-gradient(135deg, ${color.bg}, ${color.border});
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
          ${type === 'forbidden'
            ? '<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>'
            : '<path d="M8 19V9a4 4 0 0 1 8 0v10"/><path d="M8 9v2a4 4 0 0 0 4 4"/><circle cx="12" cy="5" r="1"/>'}
        </svg>
      </div>
    `
  })

  iconCache.set(cacheKey, icon)
  return icon
}

// Create photo marker icon with thumbnail preview
const createPhotoMarkerIcon = (type: SmokingSpot['type'], photoUrl: string): L.DivIcon => {
  const cacheKey = `${type}-photo-${photoUrl.substring(0, 50)}`

  if (photoIconCache.has(cacheKey)) {
    return photoIconCache.get(cacheKey)!
  }

  const colors = {
    allowed: { border: '#06B6D4' },
    forbidden: { border: '#EF4444' },
    user: { border: '#8B5CF6' }
  }

  const color = colors[type]
  const size = 40 // Larger size for photo markers

  const icon = L.divIcon({
    className: 'spot-marker spot-marker-photo',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html: `
      <div class="marker-photo-wrapper" style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid ${color.border};
        box-shadow: 0 3px 12px rgba(0, 0, 0, 0.4);
        overflow: hidden;
        background: #1a1a2e;
        position: relative;
      ">
        <img
          src="${photoUrl}"
          alt=""
          style="
            width: 100%;
            height: 100%;
            object-fit: cover;
          "
          onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\\'display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:linear-gradient(135deg, ${color.border}, ${color.border}88);\\'><svg width=\\'16\\' height=\\'16\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'white\\' stroke-width=\\'2\\'><rect x=\\'3\\' y=\\'3\\' width=\\'18\\' height=\\'18\\' rx=\\'2\\'/><circle cx=\\'8.5\\' cy=\\'8.5\\' r=\\'1.5\\'/><path d=\\'M21 15l-5-5L5 21\\'/></svg></div>';"
        />
        <div style="
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: ${color.border};
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </div>
      </div>
    `
  })

  // Limit photo cache size
  if (photoIconCache.size > 100) {
    const firstKey = photoIconCache.keys().next().value
    if (firstKey) photoIconCache.delete(firstKey)
  }

  photoIconCache.set(cacheKey, icon)
  return icon
}

const SpotMarker = memo(function SpotMarker({ spot, onClick }: SpotMarkerProps) {
  const hasPhoto = !!(spot.photos && spot.photos.length > 0 && spot.photos[0])
  const photoUrl = hasPhoto ? spot.photos![0] : ''

  const icon = useMemo(() => {
    if (hasPhoto && photoUrl) {
      return createPhotoMarkerIcon(spot.type, photoUrl)
    }
    return createMarkerIcon(spot.type)
  }, [spot.type, hasPhoto, photoUrl])

  const typeLabels = {
    allowed: '흡연구역',
    forbidden: '금연구역',
    user: '사용자 등록'
  }

  return (
    <Marker
      position={[spot.lat, spot.lng]}
      icon={icon}
      eventHandlers={{
        click: onClick
      }}
    >
      <Popup className="spot-preview-popup" closeButton={false}>
        <div className="spot-preview" onClick={onClick}>
          {hasPhoto && spot.photos && spot.photos[0] && (
            <div className="spot-preview-image">
              <img
                src={spot.photos[0]}
                alt={spot.name}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
          )}
          <div className="spot-preview-content">
            <span className={`spot-preview-badge ${spot.type}`}>
              {typeLabels[spot.type]}
            </span>
            <h4 className="spot-preview-name">{spot.name}</h4>
            {spot.address && (
              <p className="spot-preview-address">{spot.address.slice(0, 30)}...</p>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  )
}, (prevProps, nextProps) => {
  const prevPhoto = prevProps.spot.photos?.[0] || ''
  const nextPhoto = nextProps.spot.photos?.[0] || ''
  return prevProps.spot.id === nextProps.spot.id &&
         prevProps.spot.type === nextProps.spot.type &&
         prevPhoto === nextPhoto
})

export default SpotMarker

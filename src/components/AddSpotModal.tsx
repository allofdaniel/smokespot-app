import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  X, MapPin, Umbrella, Armchair, Building2, Clock,
  Cigarette, Ban, Plus, Trash2, AlertCircle, Camera, Image as ImageIcon
} from 'lucide-react'
import type { SmokingSpot, SpotType } from '../types'
import {
  validateSpotData,
  sanitizeInput,
  isValidCoordinates,
  isValidPhotoUrl
} from '../utils/validation'
import {
  isNativeCamera,
  takePhotoNative,
  takePhotoWeb,
  requestCameraPermission
} from '../services/camera'
import { reverseGeocode } from '../services/locationSearch'
import { submitSpot as apiSubmitSpot } from '../services/api'

interface AddSpotModalProps {
  position: [number, number] | null
  onClose: () => void
  onSubmit: (spot: Omit<SmokingSpot, 'id'>) => void
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
}

export default function AddSpotModal({ position, onClose, onSubmit, onSuccess, onError: _onError }: AddSpotModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    memo: '',
    type: 'allowed' as SpotType,
    hasRoof: false,
    hasChair: false,
    isEnclosed: false,
    is24Hours: false,
    lat: position?.[0] || 0,
    lng: position?.[1] || 0
  })
  const [photos, setPhotos] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(false)
  const [showPhotoOptions, setShowPhotoOptions] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (position) {
      setFormData(prev => ({ ...prev, lat: position[0], lng: position[1] }))
      // Reverse geocode to get address
      reverseGeocode(position[0], position[1]).then(address => {
        if (address) {
          setFormData(prev => ({ ...prev, address }))
        }
      })
    }
  }, [position])

  // Handle camera photo (native app)
  const handleCameraPhoto = async () => {
    if (photos.length >= 5) {
      setErrors(prev => ({ ...prev, photos: '사진은 최대 5장까지 추가할 수 있습니다' }))
      return
    }

    setShowPhotoOptions(false)
    setIsLoadingPhoto(true)
    setErrors(prev => ({ ...prev, photos: '' }))

    try {
      // Request permission first
      const hasPermission = await requestCameraPermission()
      if (!hasPermission) {
        setErrors(prev => ({ ...prev, photos: '카메라 권한이 필요합니다' }))
        setIsLoadingPhoto(false)
        return
      }

      const result = await takePhotoNative('camera')
      if (result) {
        setPhotos(prev => [...prev, result.dataUrl])
      }
    } catch (error: any) {
      console.error('Camera error:', error)
      setErrors(prev => ({ ...prev, photos: '사진 촬영에 실패했습니다' }))
    }

    setIsLoadingPhoto(false)
  }

  // Handle gallery photo (native app)
  const handleGalleryPhoto = async () => {
    if (photos.length >= 5) {
      setErrors(prev => ({ ...prev, photos: '사진은 최대 5장까지 추가할 수 있습니다' }))
      return
    }

    setShowPhotoOptions(false)

    if (isNativeCamera()) {
      setIsLoadingPhoto(true)
      try {
        const result = await takePhotoNative('gallery')
        if (result) {
          setPhotos(prev => [...prev, result.dataUrl])
        }
      } catch (error) {
        console.error('Gallery error:', error)
        setErrors(prev => ({ ...prev, photos: '사진 선택에 실패했습니다' }))
      }
      setIsLoadingPhoto(false)
    } else {
      // Web fallback - trigger file input
      fileInputRef.current?.click()
    }
  }

  // Handle web file input
  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (photos.length + files.length > 5) {
      setErrors(prev => ({ ...prev, photos: '사진은 최대 5장까지 추가할 수 있습니다' }))
      return
    }

    setIsLoadingPhoto(true)
    setErrors(prev => ({ ...prev, photos: '' }))

    try {
      for (const file of Array.from(files)) {
        const result = await takePhotoWeb(file)
        if (result) {
          setPhotos(prev => [...prev, result.dataUrl])
        }
      }
    } catch (error: any) {
      console.error('File processing error:', error)
      setErrors(prev => ({ ...prev, photos: error.message || '사진 처리에 실패했습니다' }))
    }

    setIsLoadingPhoto(false)
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
    setErrors(prev => ({ ...prev, photos: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) return
    setIsSubmitting(true)
    setErrors({})

    // Validate photos (REQUIRED - minimum 1)
    if (photos.length === 0) {
      setErrors({ photos: '최소 1장의 사진이 필요합니다. 장소 확인을 위해 현장 사진을 촬영해주세요.' })
      setIsSubmitting(false)
      return
    }

    // Validate coordinates
    if (!isValidCoordinates(formData.lat, formData.lng)) {
      setErrors({ general: '유효하지 않은 위치입니다. 지도에서 위치를 선택해주세요.' })
      setIsSubmitting(false)
      return
    }

    // Validate photos format
    const invalidPhotos = photos.filter(photo => !isValidPhotoUrl(photo))
    if (invalidPhotos.length > 0) {
      setErrors({ photos: '유효하지 않은 사진이 포함되어 있습니다' })
      setIsSubmitting(false)
      return
    }

    // Validate spot data
    const validation = validateSpotData({
      name: formData.name,
      lat: formData.lat,
      lng: formData.lng,
      type: formData.type,
      address: formData.address,
      memo: formData.memo
    })

    if (!validation.valid) {
      setErrors(validation.errors)
      setIsSubmitting(false)
      return
    }

    // Sanitize inputs before submitting
    const sanitizedData = {
      ...formData,
      name: sanitizeInput(formData.name),
      address: sanitizeInput(formData.address),
      memo: sanitizeInput(formData.memo),
      photos: photos,
      source: 'user' as const
    }

    try {
      // Submit to API (if configured)
      const apiResult = await apiSubmitSpot(sanitizedData)

      if (apiResult.success) {
        // Also save locally
        onSubmit(sanitizedData)
        onSuccess?.('장소 등록 신청이 완료되었습니다. 검토 후 승인됩니다.')
        onClose()
      } else {
        // API failed but save locally as fallback
        onSubmit(sanitizedData)
        onSuccess?.('장소가 로컬에 저장되었습니다. 네트워크 연결 시 서버에 동기화됩니다.')
        onClose()
      }
    } catch (error) {
      // Network error - save locally
      console.error('Submit error:', error)
      onSubmit(sanitizedData)
      onSuccess?.('장소가 로컬에 저장되었습니다.')
      onClose()
    }

    setIsSubmitting(false)
  }

  const typeOptions = [
    { value: 'allowed', label: '흡연구역', icon: Cigarette, color: 'bg-smoke-allowed' },
    { value: 'forbidden', label: '금연구역', icon: Ban, color: 'bg-smoke-forbidden' }
  ]

  const featureOptions = [
    { key: 'hasRoof', label: '지붕', icon: Umbrella },
    { key: 'hasChair', label: '의자', icon: Armchair },
    { key: 'isEnclosed', label: '실내', icon: Building2 },
    { key: 'is24Hours', label: '24시간', icon: Clock }
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[90vh] glass-card overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-bold text-gradient">새 장소 등록</h2>
            <button
              onClick={onClose}
              className="p-2 glass-button rounded-full hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {position && (
            <div className="mt-2 flex items-center gap-2 text-sm text-white/50">
              <MapPin className="w-4 h-4" />
              <span>{position[0].toFixed(6)}, {position[1].toFixed(6)}</span>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* General Error */}
          {errors.general && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center gap-2 text-sm text-red-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {errors.general}
            </div>
          )}

          {/* Photos (REQUIRED) */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              사진 <span className="text-red-400">*</span>
              <span className="text-white/40 text-xs ml-2">(최소 1장, 최대 5장)</span>
            </label>

            <div className="flex flex-wrap gap-2">
              {photos.map((photo, index) => (
                <div key={index} className="relative w-20 h-20 rounded-xl overflow-hidden group">
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </button>
                </div>
              ))}

              {photos.length < 5 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowPhotoOptions(!showPhotoOptions)}
                    disabled={isLoadingPhoto}
                    className={`w-20 h-20 rounded-xl glass border-2 border-dashed flex flex-col items-center justify-center transition-colors ${
                      errors.photos
                        ? 'border-red-500/50 hover:border-red-500'
                        : 'border-white/20 hover:border-aurora-mint/50'
                    }`}
                  >
                    {isLoadingPhoto ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-5 h-5 text-white/40" />
                        <span className="text-[10px] text-white/40 mt-1">사진 추가</span>
                      </>
                    )}
                  </button>

                  {/* Photo Options Dropdown */}
                  {showPhotoOptions && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute top-full left-0 mt-2 w-40 glass-card p-2 z-10"
                    >
                      <button
                        type="button"
                        onClick={handleCameraPhoto}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-left"
                      >
                        <Camera className="w-4 h-4 text-aurora-mint" />
                        <span className="text-sm">카메라 촬영</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleGalleryPhoto}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-left"
                      >
                        <ImageIcon className="w-4 h-4 text-aurora-purple" />
                        <span className="text-sm">갤러리 선택</span>
                      </button>
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            {errors.photos && (
              <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.photos}
              </p>
            )}

            {/* Hidden file input for web */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileInput}
              className="hidden"
            />
          </div>

          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">유형</label>
            <div className="flex gap-3">
              {typeOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: option.value as SpotType }))}
                  className={`flex-1 p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
                    formData.type === option.value
                      ? `${option.color}/30 border border-white/30`
                      : 'bg-white/5 border border-transparent hover:bg-white/10'
                  }`}
                >
                  <option.icon className={`w-6 h-6 ${formData.type === option.value ? 'text-white' : 'text-white/50'}`} />
                  <span className={`text-sm ${formData.type === option.value ? 'text-white' : 'text-white/50'}`}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">장소 이름 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, name: e.target.value }))
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }))
              }}
              placeholder="예: 강남역 2번 출구 앞"
              className={`glass-input ${errors.name ? 'border-red-500/50' : ''}`}
              maxLength={100}
              required
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-400">{errors.name}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">주소</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, address: e.target.value }))
                if (errors.address) setErrors(prev => ({ ...prev, address: '' }))
              }}
              placeholder="주소를 입력하세요"
              className={`glass-input ${errors.address ? 'border-red-500/50' : ''}`}
              maxLength={200}
            />
            {errors.address && (
              <p className="mt-1 text-xs text-red-400">{errors.address}</p>
            )}
          </div>

          {/* Memo */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">메모</label>
            <textarea
              value={formData.memo}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, memo: e.target.value }))
                if (errors.memo) setErrors(prev => ({ ...prev, memo: '' }))
              }}
              placeholder="추가 정보를 입력하세요 (운영 시간, 특이사항 등)"
              className={`glass-input min-h-[80px] resize-none ${errors.memo ? 'border-red-500/50' : ''}`}
              rows={3}
              maxLength={500}
            />
            {errors.memo && (
              <p className="mt-1 text-xs text-red-400">{errors.memo}</p>
            )}
          </div>

          {/* Features */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">시설</label>
            <div className="grid grid-cols-2 gap-2">
              {featureOptions.map(option => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    [option.key]: !prev[option.key as keyof typeof prev]
                  }))}
                  className={`p-3 rounded-xl flex items-center gap-2 transition-all ${
                    formData[option.key as keyof typeof formData]
                      ? 'bg-aurora-mint/20 border border-aurora-mint/30'
                      : 'bg-white/5 border border-transparent hover:bg-white/10'
                  }`}
                >
                  <option.icon className={`w-4 h-4 ${
                    formData[option.key as keyof typeof formData] ? 'text-aurora-mint' : 'text-white/50'
                  }`} />
                  <span className={`text-sm ${
                    formData[option.key as keyof typeof formData] ? 'text-white' : 'text-white/50'
                  }`}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Submit */}
        <div className="p-5 border-t border-white/10">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || photos.length === 0}
            className="w-full glass-button-primary py-4 rounded-xl font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '등록 신청 중...' : '장소 등록 신청하기'}
          </button>
          <p className="mt-2 text-center text-xs text-white/40">
            등록 신청 후 관리자 검토를 거쳐 지도에 반영됩니다
          </p>
        </div>
      </motion.div>

      {/* Click outside to close photo options */}
      {showPhotoOptions && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setShowPhotoOptions(false)}
        />
      )}
    </motion.div>
  )
}

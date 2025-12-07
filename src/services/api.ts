/**
 * API Service for SmokeSpot Backend
 * Handles all communication with AWS Lambda/API Gateway
 */

import { SmokingSpot } from '../types'

// API Configuration - Update these after deployment
const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || 'https://api.smokespot.app',
  // Fallback to local data if API is not configured
  useLocalFallback: !import.meta.env.VITE_API_URL
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

interface GetSpotsParams {
  lat?: number
  lng?: number
  radius?: number
  type?: 'allowed' | 'forbidden'
  limit?: number
}

interface UploadUrlResponse {
  uploadUrl: string
  key: string
  publicUrl: string
  expiresIn: number
}

interface SubmitSpotResponse {
  success: boolean
  message: string
  spotId: string
}

// Auth token management
let authToken: string | null = null

export function setAuthToken(token: string | null) {
  authToken = token
}

export function getAuthToken(): string | null {
  return authToken
}

// Helper function for API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    }

    // Add auth token if available
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`
    }

    const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
      ...options,
      headers
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'API request failed',
        message: data.message
      }
    }

    return {
      success: true,
      data
    }
  } catch (error: any) {
    console.error('API Error:', error)
    return {
      success: false,
      error: 'Network error',
      message: error.message
    }
  }
}

/**
 * Get smoking spots from API
 */
export async function getSpots(params: GetSpotsParams = {}): Promise<SmokingSpot[]> {
  // If no API configured, return empty (will use local data)
  if (API_CONFIG.useLocalFallback) {
    console.log('API not configured, using local data')
    return []
  }

  const queryParams = new URLSearchParams()
  if (params.lat !== undefined) queryParams.set('lat', params.lat.toString())
  if (params.lng !== undefined) queryParams.set('lng', params.lng.toString())
  if (params.radius !== undefined) queryParams.set('radius', params.radius.toString())
  if (params.type) queryParams.set('type', params.type)
  if (params.limit !== undefined) queryParams.set('limit', params.limit.toString())

  const response = await apiRequest<{ spots: SmokingSpot[] }>(
    `/spots?${queryParams.toString()}`
  )

  if (response.success && response.data) {
    return response.data.spots
  }

  return []
}

/**
 * Get presigned URL for photo upload
 */
export async function getUploadUrl(
  contentType: string,
  fileName: string
): Promise<UploadUrlResponse | null> {
  const response = await apiRequest<UploadUrlResponse>('/upload-url', {
    method: 'POST',
    body: JSON.stringify({ contentType, fileName })
  })

  if (response.success && response.data) {
    return response.data
  }

  console.error('Failed to get upload URL:', response.error)
  return null
}

/**
 * Upload photo to S3 using presigned URL
 */
export async function uploadPhoto(file: Blob, fileName: string): Promise<string | null> {
  try {
    // Get presigned URL
    const uploadInfo = await getUploadUrl(file.type, fileName)
    if (!uploadInfo) {
      throw new Error('Failed to get upload URL')
    }

    // Upload to S3
    const uploadResponse = await fetch(uploadInfo.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    })

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload photo')
    }

    return uploadInfo.publicUrl
  } catch (error: any) {
    console.error('Photo upload error:', error)
    return null
  }
}

/**
 * Convert data URL to Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

/**
 * Upload photo from data URL
 */
export async function uploadPhotoFromDataUrl(dataUrl: string): Promise<string | null> {
  const blob = dataUrlToBlob(dataUrl)
  const fileName = `photo_${Date.now()}.jpg`
  return uploadPhoto(blob, fileName)
}

/**
 * Submit new smoking spot
 */
export async function submitSpot(
  spotData: Omit<SmokingSpot, 'id'> & { photos: string[] }
): Promise<SubmitSpotResponse> {
  // If photos are data URLs, upload them first
  const uploadedPhotos: string[] = []

  for (const photo of spotData.photos) {
    if (photo.startsWith('data:')) {
      // Upload data URL to S3
      const url = await uploadPhotoFromDataUrl(photo)
      if (url) {
        uploadedPhotos.push(url)
      } else {
        console.error('Failed to upload photo')
      }
    } else {
      // Already a URL
      uploadedPhotos.push(photo)
    }
  }

  if (uploadedPhotos.length === 0) {
    return {
      success: false,
      message: '사진 업로드에 실패했습니다',
      spotId: ''
    }
  }

  const response = await apiRequest<SubmitSpotResponse>('/spots', {
    method: 'POST',
    body: JSON.stringify({
      ...spotData,
      photos: uploadedPhotos
    })
  })

  if (response.success && response.data) {
    return response.data
  }

  return {
    success: false,
    message: response.message || '장소 등록에 실패했습니다',
    spotId: ''
  }
}

/**
 * Check if API is available
 */
export async function checkApiHealth(): Promise<boolean> {
  if (API_CONFIG.useLocalFallback) {
    return false
  }

  try {
    const response = await fetch(`${API_CONFIG.baseUrl}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    return response.ok
  } catch {
    return false
  }
}

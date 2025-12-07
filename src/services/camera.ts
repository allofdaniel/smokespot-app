// Camera service with Capacitor Camera plugin and web fallback

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'

export interface PhotoResult {
  dataUrl: string
  format: string
}

/**
 * Check if Capacitor Camera is available (native app)
 */
export function isNativeCamera(): boolean {
  return typeof (window as any).Capacitor !== 'undefined'
}

/**
 * Compress image to reduce file size
 */
async function compressImage(dataUrl: string, maxWidth = 1200, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let { width, height } = img

      // Scale down if too large
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = dataUrl
  })
}

/**
 * Remove EXIF metadata from image for privacy
 */
function removeExifData(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(dataUrl) // Return original if can't process
        return
      }

      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/jpeg', 0.92))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

/**
 * Take photo using Capacitor Camera (for native app)
 */
export async function takePhotoNative(source: 'camera' | 'gallery' = 'camera'): Promise<PhotoResult | null> {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
      width: 1200,
      height: 1200,
      correctOrientation: true
    })

    if (!image.dataUrl) {
      return null
    }

    // Compress and remove EXIF
    const compressed = await compressImage(image.dataUrl)
    const cleaned = await removeExifData(compressed)

    return {
      dataUrl: cleaned,
      format: image.format || 'jpeg'
    }
  } catch (error: any) {
    console.error('Native camera error:', error)

    // Handle user cancellation gracefully
    if (error.message?.includes('cancelled') || error.message?.includes('canceled')) {
      return null
    }

    throw error
  }
}

/**
 * Take photo using web file input (for browser)
 */
export async function takePhotoWeb(file: File): Promise<PhotoResult | null> {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      reject(new Error('Invalid file type. Please select an image.'))
      return
    }

    // Validate file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error('Image too large. Please select an image under 10MB.'))
      return
    }

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const dataUrl = e.target?.result as string
        if (!dataUrl) {
          resolve(null)
          return
        }

        // Compress and remove EXIF
        const compressed = await compressImage(dataUrl)
        const cleaned = await removeExifData(compressed)

        resolve({
          dataUrl: cleaned,
          format: 'jpeg'
        })
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Check camera permissions (for native app)
 */
export async function checkCameraPermission(): Promise<boolean> {
  try {
    const permission = await Camera.checkPermissions()
    return permission.camera === 'granted' || permission.camera === 'limited'
  } catch {
    return true // Assume granted for web
  }
}

/**
 * Request camera permissions (for native app)
 */
export async function requestCameraPermission(): Promise<boolean> {
  try {
    const permission = await Camera.requestPermissions()
    return permission.camera === 'granted' || permission.camera === 'limited'
  } catch {
    return true // Assume granted for web
  }
}

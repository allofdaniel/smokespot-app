// Input validation and sanitization utilities

// HTML entity escaping to prevent XSS
export function escapeHtml(str: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  }
  return str.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char])
}

// Sanitize user input (removes potentially dangerous content)
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return ''

  return input
    // Remove script tags and content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handlers
    .replace(/on\w+\s*=\s*(['"])[^'"]*\1/gi, '')
    // Remove javascript: URLs
    .replace(/javascript:/gi, '')
    // Remove data: URLs (potential XSS vector)
    .replace(/data:/gi, '')
    // Trim whitespace
    .trim()
}

// Validate latitude
export function isValidLatitude(lat: number): boolean {
  return typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90
}

// Validate longitude
export function isValidLongitude(lng: number): boolean {
  return typeof lng === 'number' && !isNaN(lng) && lng >= -180 && lng <= 180
}

// Validate coordinates
export function isValidCoordinates(lat: number, lng: number): boolean {
  return isValidLatitude(lat) && isValidLongitude(lng)
}

// Validate spot name (1-100 characters)
export function isValidSpotName(name: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: '이름을 입력해주세요' }
  }

  const sanitized = sanitizeInput(name)
  if (sanitized.length === 0) {
    return { valid: false, error: '유효한 이름을 입력해주세요' }
  }

  if (sanitized.length > 100) {
    return { valid: false, error: '이름은 100자를 초과할 수 없습니다' }
  }

  return { valid: true }
}

// Validate address (0-200 characters)
export function isValidAddress(address: string): { valid: boolean; error?: string } {
  if (!address || typeof address !== 'string') {
    return { valid: true } // Address is optional
  }

  const sanitized = sanitizeInput(address)
  if (sanitized.length > 200) {
    return { valid: false, error: '주소는 200자를 초과할 수 없습니다' }
  }

  return { valid: true }
}

// Validate memo (0-500 characters)
export function isValidMemo(memo: string): { valid: boolean; error?: string } {
  if (!memo || typeof memo !== 'string') {
    return { valid: true } // Memo is optional
  }

  const sanitized = sanitizeInput(memo)
  if (sanitized.length > 500) {
    return { valid: false, error: '메모는 500자를 초과할 수 없습니다' }
  }

  return { valid: true }
}

// Validate URL format
export function isValidUrl(url: string): boolean {
  if (!url) return true // URL is optional

  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

// Validate photo URL (must be HTTPS or data URL for images)
export function isValidPhotoUrl(url: string): boolean {
  if (!url) return false

  // Check for valid image data URL
  if (url.startsWith('data:image/')) {
    return /^data:image\/(jpeg|jpg|png|gif|webp);base64,/.test(url)
  }

  // Check for HTTPS URL
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:'
  } catch {
    return false
  }
}

// Validate spot type
export function isValidSpotType(type: string): type is 'allowed' | 'forbidden' | 'user' {
  return ['allowed', 'forbidden', 'user'].includes(type)
}

// Validate entire spot data
export interface SpotValidationResult {
  valid: boolean
  errors: Record<string, string>
}

export function validateSpotData(data: {
  name: string
  lat: number
  lng: number
  type: string
  address?: string
  memo?: string
}): SpotValidationResult {
  const errors: Record<string, string> = {}

  // Validate name
  const nameResult = isValidSpotName(data.name)
  if (!nameResult.valid) {
    errors.name = nameResult.error || '유효하지 않은 이름입니다'
  }

  // Validate coordinates
  if (!isValidLatitude(data.lat)) {
    errors.lat = '유효하지 않은 위도입니다'
  }
  if (!isValidLongitude(data.lng)) {
    errors.lng = '유효하지 않은 경도입니다'
  }

  // Validate type
  if (!isValidSpotType(data.type)) {
    errors.type = '유효하지 않은 장소 유형입니다'
  }

  // Validate address
  if (data.address) {
    const addressResult = isValidAddress(data.address)
    if (!addressResult.valid) {
      errors.address = addressResult.error || '유효하지 않은 주소입니다'
    }
  }

  // Validate memo
  if (data.memo) {
    const memoResult = isValidMemo(data.memo)
    if (!memoResult.valid) {
      errors.memo = memoResult.error || '유효하지 않은 메모입니다'
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

// Rate limiting helper (simple client-side throttle)
export function createRateLimiter(maxCalls: number, periodMs: number) {
  const calls: number[] = []

  return function isAllowed(): boolean {
    const now = Date.now()

    // Remove expired calls
    while (calls.length > 0 && calls[0] < now - periodMs) {
      calls.shift()
    }

    if (calls.length >= maxCalls) {
      return false
    }

    calls.push(now)
    return true
  }
}

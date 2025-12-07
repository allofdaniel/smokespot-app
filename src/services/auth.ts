/**
 * Authentication Service for SmokeSpot
 * Supports Google, Kakao, and Naver social login via AWS Cognito
 */

import { setAuthToken } from './api'

// Auth Configuration - Update these after AWS deployment
const AUTH_CONFIG = {
  region: import.meta.env.VITE_AWS_REGION || 'ap-northeast-2',
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
  userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
  domain: import.meta.env.VITE_COGNITO_DOMAIN || '',
  redirectUri: import.meta.env.VITE_REDIRECT_URI || window.location.origin + '/callback',

  // Social login client IDs
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  kakaoClientId: import.meta.env.VITE_KAKAO_CLIENT_ID || '',
  naverClientId: import.meta.env.VITE_NAVER_CLIENT_ID || ''
}

export type AuthProvider = 'google' | 'kakao' | 'naver' | 'cognito'

export interface User {
  id: string
  email: string
  name?: string
  picture?: string
  provider: AuthProvider
}

export interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  user: User | null
  error: string | null
}

// Storage keys
const STORAGE_KEYS = {
  accessToken: 'smokespot_access_token',
  refreshToken: 'smokespot_refresh_token',
  idToken: 'smokespot_id_token',
  user: 'smokespot_user'
}

/**
 * Initialize auth state from storage
 */
export function initializeAuth(): AuthState {
  try {
    const accessToken = localStorage.getItem(STORAGE_KEYS.accessToken)
    const userJson = localStorage.getItem(STORAGE_KEYS.user)

    if (accessToken && userJson) {
      const user = JSON.parse(userJson) as User
      setAuthToken(accessToken)
      return {
        isAuthenticated: true,
        isLoading: false,
        user,
        error: null
      }
    }
  } catch (error) {
    console.error('Failed to initialize auth:', error)
  }

  return {
    isAuthenticated: false,
    isLoading: false,
    user: null,
    error: null
  }
}

/**
 * Generate Cognito OAuth URL for social login
 */
export function getOAuthUrl(provider: AuthProvider): string {
  const baseUrl = `https://${AUTH_CONFIG.domain}/oauth2/authorize`

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: AUTH_CONFIG.userPoolClientId,
    redirect_uri: AUTH_CONFIG.redirectUri,
    scope: 'email openid profile',
    identity_provider: getIdentityProvider(provider)
  })

  return `${baseUrl}?${params.toString()}`
}

function getIdentityProvider(provider: AuthProvider): string {
  switch (provider) {
    case 'google':
      return 'Google'
    case 'kakao':
      return 'Kakao'
    case 'naver':
      return 'Naver'
    default:
      return 'COGNITO'
  }
}

/**
 * Login with social provider
 */
export function loginWithProvider(provider: AuthProvider): void {
  // For Capacitor app, use in-app browser or system browser
  const url = getOAuthUrl(provider)

  // Check if running in Capacitor
  if ((window as any).Capacitor?.isNativePlatform()) {
    // Use Capacitor Browser plugin - dynamic import with fallback
    import('@capacitor/browser')
      .then(({ Browser }) => {
        Browser.open({ url })
      })
      .catch(() => {
        // Fallback to window.open if Browser plugin not available
        window.open(url, '_blank')
      })
  } else {
    // Web: redirect to OAuth URL
    window.location.href = url
  }
}

/**
 * Handle OAuth callback
 */
export async function handleOAuthCallback(code: string): Promise<AuthState> {
  try {
    // Exchange code for tokens
    const tokenEndpoint = `https://${AUTH_CONFIG.domain}/oauth2/token`

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: AUTH_CONFIG.userPoolClientId,
        code,
        redirect_uri: AUTH_CONFIG.redirectUri
      })
    })

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens')
    }

    const tokens = await response.json()
    const { access_token, id_token, refresh_token } = tokens

    // Decode ID token to get user info
    const user = decodeIdToken(id_token)

    // Store tokens
    localStorage.setItem(STORAGE_KEYS.accessToken, access_token)
    localStorage.setItem(STORAGE_KEYS.idToken, id_token)
    if (refresh_token) {
      localStorage.setItem(STORAGE_KEYS.refreshToken, refresh_token)
    }
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user))

    // Set auth token for API
    setAuthToken(access_token)

    return {
      isAuthenticated: true,
      isLoading: false,
      user,
      error: null
    }
  } catch (error: any) {
    console.error('OAuth callback error:', error)
    return {
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: error.message
    }
  }
}

/**
 * Decode JWT ID token
 */
function decodeIdToken(idToken: string): User {
  try {
    const payload = idToken.split('.')[1]
    const decoded = JSON.parse(atob(payload))

    return {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name || decoded.email?.split('@')[0],
      picture: decoded.picture,
      provider: getProviderFromIssuer(decoded.iss, decoded.identities)
    }
  } catch {
    throw new Error('Invalid ID token')
  }
}

function getProviderFromIssuer(_iss: string, identities?: any[]): AuthProvider {
  if (identities && identities.length > 0) {
    const providerName = identities[0].providerName?.toLowerCase()
    if (providerName === 'google') return 'google'
    if (providerName === 'kakao') return 'kakao'
    if (providerName === 'naver') return 'naver'
  }
  return 'cognito'
}

/**
 * Logout
 */
export function logout(): void {
  // Clear stored tokens
  localStorage.removeItem(STORAGE_KEYS.accessToken)
  localStorage.removeItem(STORAGE_KEYS.refreshToken)
  localStorage.removeItem(STORAGE_KEYS.idToken)
  localStorage.removeItem(STORAGE_KEYS.user)

  // Clear API auth token
  setAuthToken(null)

  // For Cognito hosted UI logout
  if (AUTH_CONFIG.domain) {
    const logoutUrl = `https://${AUTH_CONFIG.domain}/logout`
    const params = new URLSearchParams({
      client_id: AUTH_CONFIG.userPoolClientId,
      logout_uri: window.location.origin
    })
    window.location.href = `${logoutUrl}?${params.toString()}`
  }
}

/**
 * Refresh access token
 */
export async function refreshToken(): Promise<boolean> {
  try {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken)
    if (!refreshToken) return false

    const tokenEndpoint = `https://${AUTH_CONFIG.domain}/oauth2/token`

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: AUTH_CONFIG.userPoolClientId,
        refresh_token: refreshToken
      })
    })

    if (!response.ok) {
      logout()
      return false
    }

    const tokens = await response.json()
    localStorage.setItem(STORAGE_KEYS.accessToken, tokens.access_token)
    if (tokens.id_token) {
      localStorage.setItem(STORAGE_KEYS.idToken, tokens.id_token)
    }
    setAuthToken(tokens.access_token)

    return true
  } catch (error) {
    console.error('Token refresh failed:', error)
    logout()
    return false
  }
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
  try {
    const userJson = localStorage.getItem(STORAGE_KEYS.user)
    return userJson ? JSON.parse(userJson) : null
  } catch {
    return null
  }
}

/**
 * Check if authenticated
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem(STORAGE_KEYS.accessToken)
}

// =============== Kakao SDK Integration ===============
declare global {
  interface Window {
    Kakao: any
  }
}

let kakaoInitialized = false

export async function initKakaoSDK(): Promise<void> {
  if (kakaoInitialized || !AUTH_CONFIG.kakaoClientId) return

  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.6.0/kakao.min.js'
    script.onload = () => {
      if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init(AUTH_CONFIG.kakaoClientId)
        kakaoInitialized = true
      }
      resolve()
    }
    document.head.appendChild(script)
  })
}

export async function loginWithKakao(): Promise<void> {
  await initKakaoSDK()

  if (window.Kakao?.Auth) {
    window.Kakao.Auth.authorize({
      redirectUri: AUTH_CONFIG.redirectUri,
      scope: 'profile_nickname,profile_image,account_email'
    })
  } else {
    // Fallback to Cognito OAuth
    loginWithProvider('kakao')
  }
}

// =============== Naver SDK Integration ===============
export function loginWithNaver(): void {
  if (!AUTH_CONFIG.naverClientId) {
    loginWithProvider('naver')
    return
  }

  const naverLoginUrl = 'https://nid.naver.com/oauth2.0/authorize'
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: AUTH_CONFIG.naverClientId,
    redirect_uri: AUTH_CONFIG.redirectUri,
    state: generateRandomState()
  })

  window.location.href = `${naverLoginUrl}?${params.toString()}`
}

function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15)
}

// =============== Google Sign-In ===============
export function loginWithGoogle(): void {
  // Use Cognito OAuth for Google
  loginWithProvider('google')
}

/**
 * Auth Context for managing authentication state across the app
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { AuthState, AuthProvider as AuthProviderType } from '../services/auth'
import {
  initializeAuth,
  loginWithGoogle,
  loginWithKakao,
  loginWithNaver,
  handleOAuthCallback,
  logout as authLogout,
  refreshToken,
  getCurrentUser
} from '../services/auth'

interface AuthContextType extends AuthState {
  login: (provider: AuthProviderType) => void
  logout: () => void
  refreshSession: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    error: null
  })

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      // Check for OAuth callback
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')

      if (code) {
        // Handle OAuth callback
        setAuthState(prev => ({ ...prev, isLoading: true }))
        const result = await handleOAuthCallback(code)
        setAuthState(result)

        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname)
      } else {
        // Initialize from stored tokens
        const initialState = initializeAuth()
        setAuthState({ ...initialState, isLoading: false })
      }
    }

    initAuth()
  }, [])

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!authState.isAuthenticated) return

    // Refresh token every 50 minutes (tokens typically expire in 1 hour)
    const refreshInterval = setInterval(async () => {
      const success = await refreshToken()
      if (!success) {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          error: 'Session expired'
        })
      }
    }, 50 * 60 * 1000)

    return () => clearInterval(refreshInterval)
  }, [authState.isAuthenticated])

  const login = (provider: AuthProviderType) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }))

    switch (provider) {
      case 'google':
        loginWithGoogle()
        break
      case 'kakao':
        loginWithKakao()
        break
      case 'naver':
        loginWithNaver()
        break
      default:
        loginWithGoogle()
    }
  }

  const logout = () => {
    authLogout()
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null
    })
  }

  const refreshSession = async (): Promise<boolean> => {
    const success = await refreshToken()
    if (success) {
      const user = getCurrentUser()
      setAuthState(prev => ({ ...prev, user }))
    }
    return success
  }

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        refreshSession
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

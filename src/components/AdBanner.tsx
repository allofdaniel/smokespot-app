/**
 * AdMob Banner Component
 * Shows banner ads at the bottom of the screen
 * Uses Capacitor AdMob plugin for native apps, placeholder for web
 */

import { useEffect, useState } from 'react'

// AdMob Configuration
const ADMOB_CONFIG = {
  // Test ad unit IDs (replace with real ones for production)
  android: {
    banner: import.meta.env.VITE_ADMOB_BANNER_ANDROID || 'ca-app-pub-3940256099942544/6300978111' // Test ID
  },
  ios: {
    banner: import.meta.env.VITE_ADMOB_BANNER_IOS || 'ca-app-pub-3940256099942544/2934735716' // Test ID
  }
}

interface AdBannerProps {
  position?: 'top' | 'bottom'
}

export default function AdBanner({ position = 'bottom' }: AdBannerProps) {
  const [isNative, setIsNative] = useState(false)
  const [adLoaded, setAdLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initAd = async () => {
      // Check if running in Capacitor native app
      const isCapacitor = !!(window as any).Capacitor?.isNativePlatform?.()
      setIsNative(isCapacitor)

      if (isCapacitor) {
        try {
          // Dynamic import of AdMob plugin
          const { AdMob, BannerAdSize, BannerAdPosition } = await import('@capacitor-community/admob')

          // Initialize AdMob
          await AdMob.initialize({
            requestTrackingAuthorization: true,
            initializeForTesting: import.meta.env.DEV
          })

          // Determine platform
          const platform = (window as any).Capacitor.getPlatform()
          const adId = platform === 'ios'
            ? ADMOB_CONFIG.ios.banner
            : ADMOB_CONFIG.android.banner

          // Show banner ad
          await AdMob.showBanner({
            adId,
            adSize: BannerAdSize.ADAPTIVE_BANNER,
            position: position === 'top'
              ? BannerAdPosition.TOP_CENTER
              : BannerAdPosition.BOTTOM_CENTER,
            margin: 0,
            isTesting: import.meta.env.DEV
          })

          setAdLoaded(true)

          // Listen for ad events
          AdMob.addListener('bannerAdLoaded', () => {
            console.log('Banner ad loaded')
            setAdLoaded(true)
          })

          AdMob.addListener('bannerAdFailedToLoad', (info: any) => {
            console.error('Banner ad failed to load:', info)
            setError('Ad failed to load')
          })

        } catch (err: any) {
          console.error('AdMob initialization error:', err)
          setError(err.message)
        }
      }
    }

    initAd()

    // Cleanup
    return () => {
      if (isNative) {
        import('@capacitor-community/admob').then(({ AdMob }) => {
          AdMob.hideBanner().catch(() => {})
          AdMob.removeAllListeners()
        }).catch(() => {})
      }
    }
  }, [position])

  // For native apps, the banner is rendered natively - just add padding
  if (isNative) {
    return (
      <div
        className={`w-full ${position === 'bottom' ? 'pb-[50px]' : 'pt-[50px]'}`}
        style={{
          // Reserve space for native ad banner
          minHeight: adLoaded ? 50 : 0
        }}
      />
    )
  }

  // For web, show a placeholder or nothing in production
  if (import.meta.env.PROD) {
    return null
  }

  // Development placeholder
  return (
    <div
      className={`
        fixed left-0 right-0 z-[1000]
        ${position === 'bottom' ? 'bottom-0' : 'top-0'}
      `}
    >
      <div className="bg-gray-800/90 backdrop-blur-sm border-t border-white/10 py-2 px-4">
        <div className="max-w-screen-lg mx-auto flex items-center justify-center gap-2">
          <span className="text-xs text-white/40">
            [DEV] AdMob Banner Placeholder
          </span>
          {error && (
            <span className="text-xs text-red-400">
              ({error})
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Hook to manage ad banner padding
 */
export function useAdBannerPadding(position: 'top' | 'bottom' = 'bottom'): string {
  const [isNative, setIsNative] = useState(false)

  useEffect(() => {
    setIsNative(!!(window as any).Capacitor?.isNativePlatform?.())
  }, [])

  if (!isNative) return ''

  return position === 'bottom' ? 'pb-[60px]' : 'pt-[60px]'
}

/**
 * Type declarations for Capacitor plugins that might not be installed
 * These allow the code to compile without errors while using dynamic imports
 */

declare module '@capacitor-community/admob' {
  export const AdMob: {
    initialize(options: {
      requestTrackingAuthorization?: boolean
      initializeForTesting?: boolean
    }): Promise<void>
    showBanner(options: {
      adId: string
      adSize: any
      position: any
      margin?: number
      isTesting?: boolean
    }): Promise<void>
    hideBanner(): Promise<void>
    addListener(event: string, callback: (info?: any) => void): void
    removeAllListeners(): void
  }
  export const BannerAdSize: {
    ADAPTIVE_BANNER: any
    BANNER: any
    FULL_BANNER: any
    LARGE_BANNER: any
    LEADERBOARD: any
    MEDIUM_RECTANGLE: any
  }
  export const BannerAdPosition: {
    TOP_CENTER: any
    BOTTOM_CENTER: any
  }
}

declare module '@capacitor/browser' {
  export const Browser: {
    open(options: { url: string }): Promise<void>
    close(): Promise<void>
  }
}

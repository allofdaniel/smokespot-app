import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.smokespot.app',
  appName: 'SmokeSpot',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Geolocation: {
      requestPermissionsOnFirstCall: true
    },
    Camera: {
      presentationStyle: 'fullscreen'
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0f172a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#0f172a',
    buildOptions: {
      keystorePath: 'release-key.keystore',
      keystoreAlias: 'smokespot'
    }
  },
  ios: {
    backgroundColor: '#0f172a',
    contentInset: 'automatic',
    scheme: 'SmokeSpot'
  }
}

export default config

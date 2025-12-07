import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  build: {
    rollupOptions: {
      // Externalize Capacitor plugins - they're only available in native apps
      external: [
        '@capacitor/browser',
        '@capacitor-community/admob'
      ]
    }
  },
  // Suppress warnings for optional Capacitor imports
  optimizeDeps: {
    exclude: ['@capacitor/browser', '@capacitor-community/admob']
  }
})

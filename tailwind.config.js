/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'sans-serif'],
        korean: ['Pretendard', 'sans-serif'],
      },
      colors: {
        glass: {
          white: 'rgba(255, 255, 255, 0.15)',
          dark: 'rgba(0, 0, 0, 0.25)',
        },
        aurora: {
          mint: '#5EEAD4',
          purple: '#C084FC',
          blue: '#60A5FA',
          pink: '#F472B6',
        },
        smoke: {
          allowed: '#22D3EE',
          forbidden: '#F87171',
          user: '#A78BFA',
        }
      },
      backdropBlur: {
        glass: '20px',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.12)',
        glow: '0 0 40px rgba(94, 234, 212, 0.3)',
        'glow-purple': '0 0 40px rgba(192, 132, 252, 0.3)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.7, transform: 'scale(1.05)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        }
      }
    },
  },
  plugins: [],
}

/**
 * Login Modal Component
 * Social login with Google, Kakao, Naver
 */

import { motion } from 'framer-motion'
import { X, LogIn } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import type { AuthProvider } from '../services/auth'

// Social login button icons (SVG)
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

const KakaoIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path fill="#000000" d="M12 3C6.48 3 2 6.48 2 10.8c0 2.76 1.84 5.18 4.6 6.54-.2.76-.74 2.74-.84 3.16-.14.54.2.54.42.4.16-.1 2.62-1.78 3.68-2.5.7.1 1.42.16 2.14.16 5.52 0 10-3.48 10-7.76S17.52 3 12 3z"/>
  </svg>
)

const NaverIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path fill="#03C75A" d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z"/>
  </svg>
)

interface LoginModalProps {
  onClose: () => void
}

export default function LoginModal({ onClose }: LoginModalProps) {
  const { login, isLoading } = useAuth()

  const handleLogin = (provider: AuthProvider) => {
    login(provider)
  }

  const socialButtons = [
    {
      provider: 'google' as AuthProvider,
      name: 'Google',
      icon: <GoogleIcon />,
      bgColor: 'bg-white hover:bg-gray-50',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-300'
    },
    {
      provider: 'kakao' as AuthProvider,
      name: '카카오',
      icon: <KakaoIcon />,
      bgColor: 'bg-[#FEE500] hover:bg-[#FDD835]',
      textColor: 'text-[#191919]',
      borderColor: 'border-[#FEE500]'
    },
    {
      provider: 'naver' as AuthProvider,
      name: '네이버',
      icon: <NaverIcon />,
      bgColor: 'bg-[#03C75A] hover:bg-[#02B350]',
      textColor: 'text-white',
      borderColor: 'border-[#03C75A]'
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm glass-card p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <LogIn className="w-5 h-5 text-smoke-allowed" />
            <h2 className="text-xl font-display font-bold">로그인</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 glass-button rounded-full hover:bg-white/20"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-white/60 mb-6 text-center">
          로그인하면 새로운 흡연구역을 등록하고<br />
          내가 등록한 장소를 관리할 수 있어요
        </p>

        {/* Social Login Buttons */}
        <div className="space-y-3">
          {socialButtons.map((btn) => (
            <motion.button
              key={btn.provider}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleLogin(btn.provider)}
              disabled={isLoading}
              className={`
                w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl
                font-medium transition-all border
                ${btn.bgColor} ${btn.textColor} ${btn.borderColor}
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {btn.icon}
              <span>{btn.name}로 계속하기</span>
            </motion.button>
          ))}
        </div>

        {/* Terms */}
        <p className="text-xs text-white/40 text-center mt-6">
          로그인 시{' '}
          <a href="/terms" className="underline hover:text-white/60">이용약관</a>
          {' '}및{' '}
          <a href="/privacy" className="underline hover:text-white/60">개인정보처리방침</a>
          에 동의하게 됩니다
        </p>

        {/* Guest Mode */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full text-sm text-white/60 hover:text-white/80 transition-colors"
          >
            로그인 없이 둘러보기
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

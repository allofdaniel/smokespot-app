import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw, WifiOff, Database } from 'lucide-react'

interface ErrorDisplayProps {
  error: string
  isOffline?: boolean
  hasCachedData?: boolean
  onRetry?: () => void
  onUseCached?: () => void
}

export default function ErrorDisplay({
  error,
  isOffline = false,
  hasCachedData = false,
  onRetry,
  onUseCached
}: ErrorDisplayProps) {
  const Icon = isOffline ? WifiOff : AlertTriangle

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="absolute inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm"
    >
      <div className="glass-card p-8 max-w-md text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center"
        >
          <Icon className="w-10 h-10 text-red-400" />
        </motion.div>

        <h2 className="text-xl font-display font-bold text-white mb-3">
          {isOffline ? '네트워크 연결 없음' : '오류가 발생했습니다'}
        </h2>

        <p className="text-white/60 text-sm mb-6 leading-relaxed">
          {error}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onRetry && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onRetry}
              className="glass-button-primary py-3 px-6 rounded-xl flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              다시 시도
            </motion.button>
          )}

          {hasCachedData && onUseCached && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onUseCached}
              className="glass-button py-3 px-6 rounded-xl flex items-center justify-center gap-2"
            >
              <Database className="w-4 h-4" />
              캐시 데이터 사용
            </motion.button>
          )}
        </div>

        {isOffline && (
          <p className="mt-6 text-xs text-white/40">
            인터넷 연결을 확인한 후 다시 시도해주세요.
          </p>
        )}
      </div>
    </motion.div>
  )
}

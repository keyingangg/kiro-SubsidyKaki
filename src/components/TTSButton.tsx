import { Volume2, VolumeX, Loader } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../lib/utils'
import { useLang, T } from '../hooks/i18n'

interface TTSButtonProps {
  text: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'pill' | 'icon'
  speaking: boolean
  onToggle: (text: string) => void
}

export default function TTSButton({ text, className, size = 'md', variant = 'pill', speaking, onToggle }: TTSButtonProps) {
  const { language } = useLang()
  const label = speaking ? T[language].stop : T[language].listen

  if (variant === 'icon') {
    return (
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => onToggle(text)}
        className={cn(
          'rounded-full flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-400/40',
          size === 'sm' && 'w-8 h-8',
          size === 'md' && 'w-10 h-10',
          size === 'lg' && 'w-12 h-12',
          speaking ? 'bg-orange-500 text-white' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200',
          className
        )}
        aria-label={speaking ? 'Stop reading' : 'Read aloud'}
      >
        {speaking
          ? <VolumeX className={size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} />
          : <Volume2 className={size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} />
        }
      </motion.button>
    )
  }

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={() => onToggle(text)}
      className={cn(
        'inline-flex items-center gap-2 font-semibold rounded-full border transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-400/40',
        size === 'sm' && 'text-xs px-3 py-1.5 min-h-[34px]',
        size === 'md' && 'text-sm px-4 py-2.5 min-h-[44px]',
        size === 'lg' && 'text-base px-5 py-3 min-h-[52px]',
        speaking
          ? 'bg-orange-500 text-white border-orange-500 shadow-btn-orange'
          : 'bg-white text-navy-500 border-neutral-300 hover:border-orange-400 hover:text-orange-500',
        className
      )}
      aria-label={speaking ? 'Stop reading' : 'Read aloud'}
    >
      {speaking
        ? <><VolumeX className="w-4 h-4 flex-shrink-0" />{T[language].stop}</>
        : <><Volume2 className="w-4 h-4 flex-shrink-0" />{label}</>
      }
      {speaking && (
        <motion.span
          className="flex gap-0.5 items-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              className="w-0.5 rounded-full bg-white"
              animate={{ height: ['4px', '10px', '4px'] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </motion.span>
      )}
    </motion.button>
  )
}

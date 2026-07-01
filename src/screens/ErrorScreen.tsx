import { motion } from 'framer-motion'
import { Upload, WifiOff, FileX, AlertTriangle, RefreshCw, Phone, CheckCircle2 } from 'lucide-react'
import { Button } from '../components/ui'
import type { Screen, ErrorType } from '../types'

interface Props { onNavigate: (s: Screen) => void; errorType?: ErrorType; errorMessage?: string | null }

const ERRORS: Record<ErrorType, {
  icon: React.ElementType; iconBg: string; iconColor: string
  title: string; body: string
  primary: { label: string; icon: React.ElementType; to: Screen }
  secondary: { label: string; to: Screen }
  retryCount?: number
}> = {
  upload: {
    icon: FileX, iconBg: 'bg-danger-50', iconColor: 'text-danger-500',
    title: "Couldn't read this document",
    body: "The image may be too blurry, too dark, or the document is at an angle. Try again with better lighting and a steadier hand.",
    primary: { label: 'Take another photo', icon: Upload, to: 'camera' },
    secondary: { label: 'See photo tips', to: 'help' },
  },
  processing: {
    icon: AlertTriangle, iconBg: 'bg-orange-50', iconColor: 'text-orange-500',
    title: 'Processing failed',
    body: "We weren't able to analyse your document this time. This sometimes happens with unusual document formats. Please try again.",
    primary: { label: 'Try again', icon: RefreshCw, to: 'confirm' },
    secondary: { label: 'Get help', to: 'help' },
    retryCount: 2,
  },
  no_subsidies: {
    icon: CheckCircle2, iconBg: 'bg-neutral-100', iconColor: 'text-neutral-400',
    title: 'No subsidies found',
    body: "Based on your document, we couldn't detect any active subsidy schemes. This may be because the document doesn't include the required information, or you may not be currently enrolled in a scheme.",
    primary: { label: 'Scan a different document', icon: Upload, to: 'camera' },
    secondary: { label: 'Contact MOH SilverLine', to: 'help' },
  },
  offline: {
    icon: WifiOff, iconBg: 'bg-neutral-100', iconColor: 'text-neutral-500',
    title: 'No internet connection',
    body: "HealthKaki needs an internet connection to process your document. Check your WiFi or mobile data and try again. Your document has been saved.",
    primary: { label: 'Try again', icon: RefreshCw, to: 'confirm' },
    secondary: { label: 'View past results', to: 'history' },
  },
  validation: {
    icon: AlertTriangle, iconBg: 'bg-orange-50', iconColor: 'text-orange-500',
    title: 'Please check your input',
    body: "Some required information is missing or incorrect. Please review the highlighted fields and try again.",
    primary: { label: 'Go back and fix', icon: RefreshCw, to: 'confirm' },
    secondary: { label: 'Get help', to: 'help' },
  },
}

export default function ErrorScreen({ onNavigate, errorType = 'upload', errorMessage }: Props) {
  const e = ERRORS[errorType]
  const IconComponent = e.icon

  return (
    <div className="min-h-full bg-neutral-50 flex flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex flex-col items-center w-full max-w-sm"
      >
        {/* Icon */}
        <motion.div
          className={`w-24 h-24 rounded-3xl ${e.iconBg} flex items-center justify-center mb-7`}
          initial={{ rotate: -6 }} animate={{ rotate: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <IconComponent className={`w-10 h-10 ${e.iconColor}`} />
        </motion.div>

        {/* Retry count badge */}
        {e.retryCount !== undefined && (
          <div className="bg-orange-50 border border-orange-200 rounded-full px-3 py-1 mb-4">
            <p className="text-sm text-orange-600 font-semibold">Attempt {e.retryCount} of 3</p>
          </div>
        )}

        <h1 className="text-2xl font-bold text-neutral-900 mb-3 leading-snug">{e.title}</h1>
        <p className="text-base text-neutral-500 leading-relaxed mb-4">{errorMessage || e.body}</p>
        {errorMessage && errorMessage !== e.body && (
          <p className="text-sm text-neutral-400 leading-relaxed mb-9">{e.body}</p>
        )}
        {!errorMessage && <div className="mb-5" />}

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full">
          <Button variant="primary" size="lg" fullWidth onClick={() => onNavigate(e.primary.to)} className="gap-2">
            <e.primary.icon className="w-5 h-5" />
            {e.primary.label}
          </Button>
          <Button variant="secondary" size="md" fullWidth onClick={() => onNavigate(e.secondary.to)}>
            {e.secondary.label}
          </Button>
        </div>

        {/* Helpline */}
        <div className="mt-8 pt-6 border-t border-neutral-200 w-full">
          <p className="text-sm text-neutral-400 mb-2">Still having trouble?</p>
          <a href="tel:18006506060" className="inline-flex items-center gap-2 text-base font-semibold text-navy-500 hover:text-navy-600 transition-colors">
            <Phone className="w-4 h-4" />
            MOH SilverLine: 1800-650-6060
          </a>
          <p className="text-xs text-neutral-400 mt-1">Mon–Fri, 8am–8pm · Free call</p>
        </div>
      </motion.div>
    </div>
  )
}

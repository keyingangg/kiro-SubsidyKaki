import { motion } from 'framer-motion'
import { ScanLine, ImageUp, HelpCircle, ShieldCheck, ArrowRight, Settings } from 'lucide-react'
const healthkakiLogo = '/healthkaki_logo.png'
import { Button } from '../components/ui'
import type { Screen } from '../types'

interface Props { onNavigate: (s: Screen) => void }

// Document types from the spec image, grouped by timing
const BEFORE_VISIT = [
  {
    icon: '📋',
    title: 'Referral letters',
    example: '"You\'ve been referred to SGH for diabetes management"',
    benefit: 'Know which subsidies apply before you even book the appointment',
    color: 'bg-orange-50 border-orange-200',
    labelColor: 'text-orange-600',
  },
  {
    icon: '🩺',
    title: 'Diagnosis / chronic disease letters',
    example: 'GP tells you that you have hypertension',
    benefit: 'Find out if CHAS CDMP covers your future visits',
    color: 'bg-teal-50 border-teal-200',
    labelColor: 'text-teal-600',
  },
  {
    icon: '💊',
    title: 'Prescription letters',
    example: 'New medication prescribed',
    benefit: 'Know if MediSave can be used',
    color: 'bg-navy-50 border-navy-100',
    labelColor: 'text-navy-500',
  },
]

const DURING_CARE = [
  {
    icon: '📄',
    title: 'Follow-up appointment letters',
    benefit: 'Confirms institution and condition → verify subsidies still apply',
    color: 'bg-neutral-100 border-neutral-200',
    labelColor: 'text-neutral-600',
  },
  {
    icon: '📝',
    title: 'Specialist memos',
    benefit: 'Rich with diagnostic info after a specialist consult',
    color: 'bg-neutral-100 border-neutral-200',
    labelColor: 'text-neutral-600',
  },
]

export default function Home({ onNavigate }: Props) {
  return (
    <div className="min-h-full bg-neutral-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-5 pt-3 pb-4 flex items-center justify-between">
        <div className="flex items-center">
          <img src={healthkakiLogo} alt="HealthKaki" className="h-8 w-auto" />
        </div>
        <button
          onClick={() => onNavigate('settings')}
          className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-[18px] h-[18px]" strokeWidth={2} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {/* Hero */}
        <motion.div
          className="text-center pt-7 pb-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mx-auto mb-4 shadow-btn-orange">
            <span className="text-4xl">🏥</span>
          </div>
          <h1 className="text-2xl font-bold text-navy-500 mb-2 leading-snug">
            Know Your Subsidies<br />in Seconds
          </h1>
          <p className="text-base text-neutral-600 max-w-xs mx-auto leading-relaxed">
            Snap any medical document — before or after your visit — and instantly see what you're entitled to.
          </p>
        </motion.div>

        {/* Primary CTAs */}
        <motion.div
          className="flex flex-col gap-3 mb-7"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Button variant="primary" size="lg" fullWidth onClick={() => onNavigate('camera')} className="gap-2.5">
            <ScanLine className="w-5 h-5" />
            Scan Medical Document
          </Button>
          <Button variant="teal" size="lg" fullWidth onClick={() => onNavigate('confirm')} className="gap-2.5">
            <ImageUp className="w-5 h-5" />
            Upload from Gallery
          </Button>
        </motion.div>

        {/* Document guide: Before visit */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <p className="text-sm font-bold text-neutral-800">Before your visit (highest value)</p>
          </div>

          <div className="flex flex-col gap-2 mb-5">
            {BEFORE_VISIT.map((doc, i) => (
              <motion.button
                key={doc.title}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                onClick={() => onNavigate('camera')}
                className={`w-full flex items-start gap-3 ${doc.color} border rounded-xl p-3.5 text-left hover:opacity-90 active:scale-[0.98] transition-all`}
              >
                <span className="text-2xl flex-shrink-0 mt-0.5">{doc.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${doc.labelColor} mb-0.5`}>{doc.title}</p>
                  <p className="text-xs text-neutral-500 italic mb-1 leading-snug">e.g. {doc.example}</p>
                  <div className="flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                    <p className="text-xs text-neutral-600 leading-snug">{doc.benefit}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* During ongoing care */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-neutral-400" />
            <p className="text-sm font-bold text-neutral-800">During ongoing care (also valuable)</p>
          </div>

          <div className="flex flex-col gap-2 mb-6">
            {DURING_CARE.map((doc, i) => (
              <motion.button
                key={doc.title}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.65 + i * 0.07 }}
                onClick={() => onNavigate('camera')}
                className={`w-full flex items-start gap-3 ${doc.color} border rounded-xl p-3.5 text-left hover:opacity-90 active:scale-[0.98] transition-all`}
              >
                <span className="text-2xl flex-shrink-0 mt-0.5">{doc.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${doc.labelColor} mb-1`}>{doc.title}</p>
                  <div className="flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                    <p className="text-xs text-neutral-600 leading-snug">{doc.benefit}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Privacy note */}
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-3.5 flex gap-2.5 mb-5">
            <ShieldCheck className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-teal-700 leading-relaxed">
              Your NRIC and personal details are automatically removed before processing. We never store your documents.
            </p>
          </div>

          {/* Help link */}
          <div className="text-center">
            <button
              onClick={() => onNavigate('help')}
              className="inline-flex items-center gap-1.5 text-base text-navy-500 font-semibold hover:text-navy-600 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              Need Help?
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

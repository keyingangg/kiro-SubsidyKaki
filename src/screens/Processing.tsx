import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import type { ProcessDocumentResponse } from '../types'

interface Props {
  file: File | null
  onComplete: (data: ProcessDocumentResponse) => void
  onError: (message: string) => void
}

const STAGES = [
  { label: 'Scanning document…',       sub: 'Reading text and medical codes',          pct: 25 },
  { label: 'Redacting identifiers…',    sub: 'Removing NRIC-like identifiers from results', pct: 50 },
  { label: 'Checking your subsidies…', sub: 'Matching against MOH subsidy frameworks', pct: 75 },
  { label: 'Preparing results…',       sub: 'Formatting the returned subsidy matches', pct: 100 },
]

const MESSAGES = [
  'Your data is processed securely',
  'Uploaded files are not saved by this app',
  'NRIC-like identifiers are redacted from results',
  'Checking Pioneer, CHAS & Merdeka eligibility',
]

function isProcessDocumentResponse(value: unknown): value is ProcessDocumentResponse {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<ProcessDocumentResponse>
  return Boolean(
    candidate.extracted &&
    Array.isArray(candidate.extracted.medicalCodes) &&
    Array.isArray(candidate.extracted.diagnoses) &&
    Array.isArray(candidate.extracted.prescriptions) &&
    (candidate.extracted.bill === null || typeof candidate.extracted.bill === 'object') &&
    typeof candidate.extracted.rawText === 'string' &&
    Array.isArray(candidate.subsidies) &&
    typeof candidate.needsManualInput === 'boolean'
  )
}

export default function Processing({ file, onComplete, onError }: Props) {
  const [stageIdx, setStageIdx] = useState(0)
  const [msgIdx, setMsgIdx]     = useState(0)
  const [done, setDone]         = useState(false)

  useEffect(() => {
    if (!file) {
      onError('No file selected. Please go back and select a document.')
      return
    }

    const controller = new AbortController()
    let completionTimer: ReturnType<typeof setTimeout> | undefined

    const callApi = async () => {
      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/process-document', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        })

        if (!response.ok) {
          let errorMessage = `Processing failed (status ${response.status})`
          try {
            const errorData = await response.json()
            if (errorData.error) {
              errorMessage = errorData.error
            }
          } catch {
            // If JSON parsing fails, use the default status-based message
          }
          onError(errorMessage)
          return
        }

        const data: unknown = await response.json()
        if (!isProcessDocumentResponse(data)) {
          onError('The processing service returned an invalid response. Please try again.')
          return
        }
        setStageIdx(STAGES.length - 1)
        setDone(true)
        completionTimer = setTimeout(() => onComplete(data), 500)
      } catch (err) {
        if (controller.signal.aborted) return
        if (err instanceof TypeError && err.message.includes('fetch')) {
          onError('No internet connection. Please check your network and try again.')
        } else {
          const msg = err instanceof Error ? err.message : 'An unexpected error occurred'
          onError(`Processing failed: ${msg}. Please try again.`)
        }
      }
    }

    callApi()
    return () => {
      controller.abort()
      if (completionTimer) clearTimeout(completionTimer)
    }
  }, [file, onComplete, onError])

  useEffect(() => {
    const stageTimer = setInterval(() => setStageIdx(previous => Math.min(previous + 1, STAGES.length - 2)), 1800)
    const msgTimer = setInterval(() => setMsgIdx(p => (p + 1) % MESSAGES.length), 2000)
    return () => {
      clearInterval(stageTimer)
      clearInterval(msgTimer)
    }
  }, [])

  const pct = done ? 100 : STAGES[stageIdx].pct
  const r   = 88
  const circ = 2 * Math.PI * r

  return (
    <div className="min-h-full bg-white flex flex-col items-center justify-center px-6">
      {/* Progress ring */}
      <div className="relative w-52 h-52 mb-8 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 208 208">
          <circle cx="104" cy="104" r={r} fill="none" stroke="#F1F3F4" strokeWidth="10" />
          <motion.circle
            cx="104" cy="104" r={r}
            fill="none"
            stroke={done ? '#06A77D' : '#F77F00'}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circ}
            animate={{ strokeDashoffset: circ - (pct / 100) * circ }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </svg>

        {/* Pulsing rings */}
        {!done && (
          <>
            <motion.div className="absolute inset-6 rounded-full border-2 border-orange-200"
              animate={{ scale: [1, 1.06, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }} />
            <motion.div className="absolute inset-10 rounded-full border-2 border-orange-300"
              animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.4 }} />
          </>
        )}

        {/* Centre */}
        <div className="relative w-24 h-24 rounded-full bg-neutral-50 border border-neutral-200 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div key="done" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 280, damping: 18 }}>
                <ShieldCheck className="w-10 h-10 text-success-500" />
              </motion.div>
            ) : (
              <motion.span key={pct} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="text-2xl font-bold text-orange-500"
              >
                {pct}%
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Stage label */}
      <AnimatePresence mode="wait">
        <motion.div key={stageIdx + (done ? 'd' : '')}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="text-center mb-8"
        >
          <h2 className="text-xl font-bold text-neutral-900 mb-2">
            {done ? 'Analysis complete!' : STAGES[stageIdx].label}
          </h2>
          <p className="text-base text-neutral-500">
            {done ? 'Your subsidy breakdown is ready.' : STAGES[stageIdx].sub}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Stage dots */}
      <div className="flex gap-2 mb-8">
        {STAGES.map((_, i) => (
          <motion.div key={i} className="h-2 rounded-full"
            animate={{ width: i === stageIdx && !done ? 24 : 8, backgroundColor: done || i <= stageIdx ? '#F77F00' : '#D0D0D0' }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>

      {/* Rotating reassurance messages */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-full px-5 py-2.5 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-teal-500 flex-shrink-0" />
        <AnimatePresence mode="wait">
          <motion.p key={msgIdx}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="text-sm text-neutral-600"
          >
            {MESSAGES[msgIdx]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}

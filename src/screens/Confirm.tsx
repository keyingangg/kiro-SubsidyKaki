import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, ShieldCheck, RefreshCw, ChevronRight, CheckSquare, Square, Tag, Check } from 'lucide-react'
import { Button, Card, TopBar } from '../components/ui'
import { useLang, T } from '../hooks/i18n'
import type { Screen } from '../types'

interface Props { onNavigate: (s: Screen) => void; file: File | null; onFileReady: (file: File) => void }

const DOC_TYPE_DEFS = [
  { id: 'invoice',      icon: '🧾', badge: 'orange' as const, timingKey: 'timing_after',   timingColor: 'text-orange-500', labelKey: 'dt_invoice' },
  { id: 'referral',     icon: '📋', badge: 'teal' as const,   timingKey: 'timing_before',  timingColor: 'text-teal-600',   labelKey: 'dt_referral' },
  { id: 'diagnosis',    icon: '🩺', badge: 'teal' as const,   timingKey: 'timing_before',  timingColor: 'text-teal-600',   labelKey: 'dt_diagnosis' },
  { id: 'prescription', icon: '💊', badge: 'navy' as const,   timingKey: 'timing_both',    timingColor: 'text-navy-500',   labelKey: 'dt_prescription' },
  { id: 'followup',     icon: '📄', badge: 'gray' as const,   timingKey: 'timing_during',  timingColor: 'text-neutral-500',labelKey: 'dt_followup' },
  { id: 'specialist',   icon: '📝', badge: 'gray' as const,   timingKey: 'timing_during',  timingColor: 'text-neutral-500',labelKey: 'dt_specialist' },
]

function ConsentCheckbox({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) {
  return (
    <button className="flex items-start gap-3 text-left w-full py-1" onClick={onToggle} aria-pressed={checked}>
      <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${checked ? 'text-teal-700' : 'text-neutral-400'}`}>
        {checked ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
      </div>
      <span className="text-base text-neutral-700 leading-snug">{label}</span>
    </button>
  )
}

export default function Confirm({ onNavigate, file, onFileReady }: Props) {
  const { language } = useLang()
  const t = T[language]
  const [checked1, setChecked1]   = useState(false)
  const [checked2, setChecked2]   = useState(false)
  const [docType, setDocType]     = useState(DOC_TYPE_DEFS[0])
  const [showPicker, setShowPicker] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(() => file && file.type !== 'application/pdf' ? URL.createObjectURL(file) : null)
  const fileInput                 = useRef<HTMLInputElement>(null)
  const bothChecked               = checked1 && checked2

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }
  }, [previewUrl])

  return (
    <div className="min-h-full bg-neutral-50 flex flex-col">
      <TopBar title={t.confirm_title} subtitle={t.confirm_sub} onBack={() => onNavigate('home')} />

      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">

        {/* Document preview */}
        <Card className="overflow-hidden">
          <div className="relative bg-neutral-100 rounded-xl overflow-hidden" style={{ aspectRatio: '3/4', maxHeight: 260 }}>
            {previewUrl ? (
              <Image src={previewUrl} alt="Document preview" fill sizes="(max-width: 672px) 100vw, 672px" unoptimized className="object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-neutral-200 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-neutral-400" />
                </div>
                <p className="text-sm text-neutral-500">{t.confirm_title}</p>
              </div>
            )}
          </div>
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-base font-semibold text-neutral-900">{file?.name ?? 'medical_document.jpg'}</p>
              <p className="text-sm text-success-500 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" /> {t.doc_detected}
              </p>
            </div>
            <button
              onClick={() => fileInput.current?.click()}
              className="flex items-center gap-1.5 text-sm font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-full px-3 py-1.5 hover:bg-teal-100 active:scale-95 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> {t.retake}
            </button>
          </div>
        </Card>

        {/* User-selected document category */}
        <div>
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">{t.doc_category}</p>
          <button
            onClick={() => setShowPicker(v => !v)}
            className="w-full bg-white border border-neutral-200 rounded-xl p-4 flex items-center gap-3 shadow-card hover:bg-neutral-50 active:scale-[0.98] transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0 text-2xl">
              {docType.icon}
            </div>
            <div className="flex-1 text-left">
              <p className="text-base font-bold text-neutral-900">{t[docType.labelKey as keyof typeof t]}</p>
              <p className={`text-sm font-semibold ${docType.timingColor} mt-0.5`}>{t[docType.timingKey as keyof typeof t]}</p>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-neutral-600 bg-neutral-100 border border-neutral-200 rounded-full px-3 py-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>{t.change}</span>
            </div>
          </button>

          {/* Document type picker */}
          <AnimatePresence>
            {showPicker && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28 }}
                className="overflow-hidden"
              >
                <div className="mt-2 bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-card">
                  {DOC_TYPE_DEFS.map((dt, i) => (
                    <button
                      key={dt.id}
                      onClick={() => { setDocType(dt); setShowPicker(false) }}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-neutral-50 transition-colors ${i < DOC_TYPE_DEFS.length - 1 ? 'border-b border-neutral-100' : ''} ${docType.id === dt.id ? 'bg-teal-50' : ''}`}
                    >
                      <span className="text-xl flex-shrink-0">{dt.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-neutral-900">{t[dt.labelKey as keyof typeof t]}</p>
                        <p className={`text-xs font-medium ${dt.timingColor} mt-0.5`}>{t[dt.timingKey as keyof typeof t]}</p>
                      </div>
                      {docType.id === dt.id && (
                        <div className="w-5 h-5 rounded-full bg-teal-700 flex items-center justify-center flex-shrink-0">
                          <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Before-visit callout when relevant */}
        {(docType.id === 'referral' || docType.id === 'diagnosis' || docType.id === 'prescription') && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex gap-3"
          >
            <span className="text-xl flex-shrink-0">💡</span>
            <div>
              <p className="text-sm font-bold text-teal-700 mb-1">{t.early_scan_title}</p>
              <p className="text-sm text-teal-600 leading-relaxed">
                {docType.id === 'referral'
                  ? t.early_scan_referral
                  : docType.id === 'diagnosis'
                  ? t.early_scan_diagnosis
                  : t.early_scan_prescription}
              </p>
            </div>
          </motion.div>
        )}

        {/* Privacy notice */}
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex gap-3">
          <ShieldCheck className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-teal-700 mb-1">{t.privacy_protected}</p>
            <p className="text-sm text-teal-600 leading-relaxed">{t.privacy_body}</p>
          </div>
        </div>

        {/* Required checkboxes */}
        <Card className="p-4 flex flex-col gap-4">
          <p className="text-sm font-bold text-neutral-900">{t.please_confirm}</p>
          <ConsentCheckbox checked={checked1} onToggle={() => setChecked1(v => !v)} label={t.consent_1} />
          <div className="h-px bg-neutral-100" />
          <ConsentCheckbox checked={checked2} onToggle={() => setChecked2(v => !v)} label={t.consent_2} />
        </Card>

        <AnimatePresence>
          <motion.div animate={{ opacity: bothChecked ? 1 : 0.5 }} transition={{ duration: 0.2 }}>
            <Button variant="primary" size="lg" fullWidth disabled={!bothChecked}
              onClick={() => onNavigate('processing')} className="gap-2">
              {t.process_btn}
              <ChevronRight className="w-5 h-5" />
            </Button>
          </motion.div>
        </AnimatePresence>

        {!bothChecked && (
          <p className="text-sm text-neutral-400 text-center -mt-1">{t.tick_both}</p>
        )}
      </div>

      <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/heic,application/pdf" className="hidden"
        onChange={e => {
          const nextFile = e.target.files?.[0]
          if (nextFile) {
            onFileReady(nextFile)
            setPreviewUrl(nextFile.type === 'application/pdf' ? null : URL.createObjectURL(nextFile))
            setChecked1(false)
            setChecked2(false)
          }
          e.target.value = ''
        }} />
    </div>
  )
}

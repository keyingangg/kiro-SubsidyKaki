import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, ShieldCheck, RefreshCw, ChevronRight, CheckSquare, Square, Tag, Check } from 'lucide-react'
import { Button, Card, TopBar } from '../components/ui'
import type { Screen } from '../types'

interface Props { onNavigate: (s: Screen) => void; file: File | null; onFileReady: (file: File) => void }

// User-selectable document categories for context in the review step.
const DOC_TYPES = [
  { id: 'invoice',     label: 'Polyclinic Invoice',    icon: '🧾', badge: 'orange' as const,  timing: 'After visit', timingColor: 'text-orange-500' },
  { id: 'referral',    label: 'Referral Letter',       icon: '📋', badge: 'teal' as const,    timing: 'Before visit ★', timingColor: 'text-teal-600' },
  { id: 'diagnosis',   label: 'Diagnosis Letter',      icon: '🩺', badge: 'teal' as const,    timing: 'Before visit ★', timingColor: 'text-teal-600' },
  { id: 'prescription',label: 'Prescription Slip',     icon: '💊', badge: 'navy' as const,    timing: 'Before/After',   timingColor: 'text-navy-500' },
  { id: 'followup',    label: 'Follow-up Letter',      icon: '📄', badge: 'gray' as const,    timing: 'During care',    timingColor: 'text-neutral-500' },
  { id: 'specialist',  label: 'Specialist Memo',       icon: '📝', badge: 'gray' as const,    timing: 'During care',    timingColor: 'text-neutral-500' },
]

function ConsentCheckbox({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) {
  return (
    <button className="flex items-start gap-3 text-left w-full py-1" onClick={onToggle} aria-pressed={checked}>
      <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${checked ? 'text-orange-500' : 'text-neutral-400'}`}>
        {checked ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
      </div>
      <span className="text-base text-neutral-700 leading-snug">{label}</span>
    </button>
  )
}

export default function Confirm({ onNavigate, file, onFileReady }: Props) {
  const [checked1, setChecked1]   = useState(false)
  const [checked2, setChecked2]   = useState(false)
  const [docType, setDocType]     = useState(DOC_TYPES[0])
  const [showPicker, setShowPicker] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(() => file && file.type !== 'application/pdf' ? URL.createObjectURL(file) : null)
  const fileInput                 = useRef<HTMLInputElement>(null)
  const bothChecked               = checked1 && checked2

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }
  }, [previewUrl])

  return (
    <div className="min-h-full bg-neutral-50 flex flex-col">
      <TopBar title="Review Document" subtitle="Confirm before processing" onBack={() => onNavigate('home')} />

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
                <p className="text-sm text-neutral-500">Document preview</p>
              </div>
            )}
          </div>
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-base font-semibold text-neutral-900">{file?.name ?? 'medical_document.jpg'}</p>
              <p className="text-sm text-success-500 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Document detected
              </p>
            </div>
            <button
              onClick={() => fileInput.current?.click()}
              className="flex items-center gap-1.5 text-sm text-navy-500 font-semibold hover:text-navy-600"
            >
              <RefreshCw className="w-4 h-4" /> Retake
            </button>
          </div>
        </Card>

        {/* User-selected document category */}
        <div>
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Document category</p>
          <button
            onClick={() => setShowPicker(v => !v)}
            className="w-full bg-white border border-neutral-200 rounded-xl p-4 flex items-center gap-3 shadow-card hover:bg-neutral-50 active:scale-[0.98] transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 text-2xl">
              {docType.icon}
            </div>
            <div className="flex-1 text-left">
              <p className="text-base font-bold text-neutral-900">{docType.label}</p>
              <p className={`text-sm font-semibold ${docType.timingColor} mt-0.5`}>{docType.timing}</p>
            </div>
            <div className="flex items-center gap-1 text-sm text-neutral-400">
              <Tag className="w-4 h-4" />
              <span>Change</span>
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
                  {DOC_TYPES.map((dt, i) => (
                    <button
                      key={dt.id}
                      onClick={() => { setDocType(dt); setShowPicker(false) }}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-neutral-50 transition-colors ${i < DOC_TYPES.length - 1 ? 'border-b border-neutral-100' : ''} ${docType.id === dt.id ? 'bg-orange-50' : ''}`}
                    >
                      <span className="text-xl flex-shrink-0">{dt.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-neutral-900">{dt.label}</p>
                        <p className={`text-xs font-medium ${dt.timingColor} mt-0.5`}>{dt.timing}</p>
                      </div>
                      {docType.id === dt.id && (
                        <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
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
              <p className="text-sm font-bold text-teal-700 mb-1">Great choice to scan early!</p>
              <p className="text-sm text-teal-600 leading-relaxed">
                {docType.id === 'referral'
                  ? 'Scanning before your appointment lets you know exactly which subsidies apply at the specialist clinic — before you even book.'
                  : docType.id === 'diagnosis'
                  ? 'A diagnosis letter helps us check if CHAS CDMP covers your future visits for this condition.'
                  : 'We can check if MediSave can cover your new medications under CDMP.'}
              </p>
            </div>
          </motion.div>
        )}

        {/* Privacy notice */}
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex gap-3">
          <ShieldCheck className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-teal-700 mb-1">Your privacy is protected</p>
            <p className="text-sm text-teal-600 leading-relaxed">NRIC-like identifiers are redacted from extracted results. This app does not save your uploaded file.</p>
          </div>
        </div>

        {/* Required checkboxes */}
        <Card className="p-4 flex flex-col gap-4">
          <p className="text-sm font-bold text-neutral-900">Please confirm before continuing:</p>
          <ConsentCheckbox checked={checked1} onToggle={() => setChecked1(v => !v)}
            label="I consent to this document being processed to check my subsidy eligibility." />
          <div className="h-px bg-neutral-100" />
          <ConsentCheckbox checked={checked2} onToggle={() => setChecked2(v => !v)}
            label="I understand the file is sent for processing and is not saved by this app." />
        </Card>

        <AnimatePresence>
          <motion.div animate={{ opacity: bothChecked ? 1 : 0.5 }} transition={{ duration: 0.2 }}>
            <Button variant="primary" size="lg" fullWidth disabled={!bothChecked}
              onClick={() => onNavigate('processing')} className="gap-2">
              Process & Check Subsidies
              <ChevronRight className="w-5 h-5" />
            </Button>
          </motion.div>
        </AnimatePresence>

        {!bothChecked && (
          <p className="text-sm text-neutral-400 text-center -mt-1">Please tick both boxes to continue</p>
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

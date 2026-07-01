import { useRef } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ScanLine, ImageUp, HelpCircle, Settings } from 'lucide-react'
const healthkakiLogo = '/healthkaki_logo.png'
import { useLargeText } from '../App'
import { useLang, T } from '../hooks/i18n'
import type { Screen } from '../types'

interface Props { onNavigate: (s: Screen) => void; onFileReady?: (f: File) => void }

const CHIP_KEYS = [
  { icon: '📋', key: 'chip_referral' },
  { icon: '🩺', key: 'chip_diagnosis' },
  { icon: '💊', key: 'chip_prescription' },
  { icon: '📄', key: 'chip_followup' },
  { icon: '🧾', key: 'chip_bill' },
  { icon: '📝', key: 'chip_specialist' },
] as const

export default function Home({ onNavigate, onFileReady }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { largeText } = useLargeText()
  const { language } = useLang()
  const t = T[language]

  const handleGalleryUpload = () => fileInputRef.current?.click()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileReady?.(file)
      onNavigate('confirm')
    }
    e.target.value = ''
  }

  return (
    <div className="min-h-full bg-neutral-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-5 pt-3 pb-4 flex items-center justify-between">
        <Image src={healthkakiLogo} alt="HealthKaki" width={144} height={32} className="h-8 w-auto" priority />
        <button
          onClick={() => onNavigate('settings')}
          className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-[18px] h-[18px]" strokeWidth={2} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {/* Zone 1 — Hero */}
        <motion.div
          className="text-center pt-7"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
           <Image src={healthkakiLogo} alt="HealthKaki" width={112} height={112} className="mx-auto mb-4 h-14 w-auto" priority />
          <h1 className="font-bold leading-snug mb-6" style={{ fontSize: largeText ? 28 : 24, color: '#1A7070' }}>
            {t.home_headline_1}<br />{t.home_headline_2}
          </h1>
        </motion.div>

        {/* Zone 2 — Primary Actions */}
        <motion.div
          className="flex flex-col mb-7"
          style={{ gap: 12 }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <button
            onClick={() => onNavigate('camera')}
            className="w-full flex items-center justify-center gap-3 rounded-2xl font-bold text-white transition-all active:scale-[0.98]"
            style={{ height: largeText ? 68 : 60, fontSize: largeText ? 20 : 18, backgroundColor: '#1A7070' }}
          >
            <ScanLine className="w-5 h-5 flex-shrink-0" />
            {t.scan_btn}
          </button>
          <button
            onClick={handleGalleryUpload}
            className="w-full flex items-center justify-center gap-3 rounded-2xl font-bold text-white transition-all active:scale-[0.98]"
            style={{ height: largeText ? 68 : 60, fontSize: largeText ? 20 : 18, backgroundColor: '#2A9A90' }}
          >
            <ImageUp className="w-5 h-5 flex-shrink-0" />
            {t.upload_btn}
          </button>
        </motion.div>

        {/* Zone 3 — What can I scan? */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          <p
            className="font-bold tracking-widest mb-3"
            style={{ fontSize: 13, letterSpacing: '1.5px', color: '#9AA0A6', marginTop: 28 }}
          >
            {t.what_can_i_scan}
          </p>

          {/* 2×3 chip grid */}
          <div
            className="grid grid-cols-2"
            style={{ gap: 10 }}
          >
            {CHIP_KEYS.map((chip, i) => (
              <motion.button
                key={chip.key}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.06 }}
                onClick={() => onNavigate('camera')}
                className="relative bg-white border border-neutral-200 rounded-[14px] flex items-center text-left active:scale-[0.97] transition-all"
                style={{ height: 72, padding: '0 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}
              >
<span style={{ fontSize: 28, marginRight: 10, lineHeight: 1 }}>{chip.icon}</span>
                <span className="font-bold text-neutral-900 leading-tight" style={{ fontSize: largeText ? 15 : 13 }}>
                  {t[chip.key]}
                </span>
              </motion.button>
            ))}
          </div>

          

          {/* Help link */}
          <div className="text-center mt-10">
            <button
              onClick={() => onNavigate('help')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-neutral-100 text-neutral-700 font-semibold hover:bg-neutral-200 transition-colors"
              style={{ fontSize: 15 }}
            >
              <HelpCircle className="w-5 h-5" />
              {t.need_help}
            </button>
          </div>
        </motion.div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}

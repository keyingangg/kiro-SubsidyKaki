import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Bell, Clock, AlertCircle } from 'lucide-react'
import { Card, TopBar } from '../components/ui'
import TTSButton from '../components/TTSButton'
import { MOCK_RESULT } from '../lib/utils'
import { useTTS, buildMedSummary } from '../hooks/useTTS'
import { useLang, T } from '../hooks/i18n'
import type { Medication, Screen } from '../types'

interface Props { onNavigate: (s: Screen) => void }

const TIMING_ICONS: Record<string, string> = {
  morning: '🌅', evening: '🌙', night: '🌃', meal: '🍽️', daily: '📅',
}

function MedCard({ med, isOpen, onToggle }: { med: Medication; isOpen: boolean; onToggle: () => void }) {
  const { language } = useLang()
  const { toggle, speaking, speak } = useTTS(language)

  const t = language === 'en'
    ? { purpose: med.purpose, frequency: med.frequency, timing: med.timing, notes: med.specialNotes }
    : { purpose: med.translations[language]?.purpose ?? med.purpose, frequency: med.translations[language]?.frequency ?? med.frequency, timing: med.translations[language]?.timing ?? med.timing, notes: med.translations[language]?.specialNotes ?? med.specialNotes }

  const speakText = buildMedSummary(language, med.name, t.purpose, t.frequency, t.timing)

  const timingKey = med.timing.toLowerCase().includes('morning') ? 'morning'
    : med.timing.toLowerCase().includes('evening') ? 'evening'
    : med.timing.toLowerCase().includes('night') ? 'night'
    : med.timing.toLowerCase().includes('meal') ? 'meal' : 'daily'

  return (
    <Card className="overflow-hidden">
      {/* Card header — always visible */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-3xl flex-shrink-0">{med.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-neutral-900">{med.name}</p>
            <p className="text-sm text-neutral-400">{med.genericName}</p>

            {/* Purpose pill */}
            <div className="mt-2 bg-teal-50 border border-teal-200 rounded-xl px-3 py-2">
              <p className="text-sm font-semibold text-teal-700 leading-snug">{t.purpose}</p>
            </div>
          </div>

          {/* TTS icon */}
          <TTSButton text={speakText} speaking={speaking} onToggle={toggle} size="sm" variant="icon" />
        </div>

        {/* Quick dosage badges */}
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-600 text-xs font-semibold px-2.5 py-1 rounded-full">
            <span>💊</span> {med.dosage}
          </span>
          <span className="inline-flex items-center gap-1.5 bg-navy-50 border border-navy-100 text-navy-500 text-xs font-semibold px-2.5 py-1 rounded-full">
            <Clock className="w-3 h-3" /> {t.frequency}
          </span>
          <span className="inline-flex items-center gap-1.5 bg-neutral-100 border border-neutral-200 text-neutral-600 text-xs font-semibold px-2.5 py-1 rounded-full">
            {TIMING_ICONS[timingKey]} {t.timing.split(',')[0]}
          </span>
        </div>

        {/* Expand toggle */}
        <button
          onClick={onToggle}
          className="mt-3 w-full flex items-center justify-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-600 transition-colors py-1"
          aria-expanded={isOpen}
        >
          <span>
            {isOpen
              ? (language === 'zh' ? '收起' : language === 'ms' ? 'Tutup' : language === 'ta' ? 'மூடு' : 'Less detail')
              : (language === 'zh' ? '查看详情' : language === 'ms' ? 'Lihat butiran' : language === 'ta' ? 'விவரங்கள்' : 'More detail')}
          </span>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </button>
      </div>

      {/* Expandable detail */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-neutral-100 px-4 pb-4 pt-3 flex flex-col gap-3">

              {/* When to take */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-0.5">
                    {language === 'zh' ? '何时服用' : language === 'ms' ? 'Bila ambil' : language === 'ta' ? 'எப்போது எடுக்க வேண்டும்' : 'When to take'}
                  </p>
                  <p className="text-sm text-neutral-700 leading-relaxed">{t.timing}</p>
                </div>
              </div>

              {/* Special notes */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-0.5">
                    {language === 'zh' ? '重要提示' : language === 'ms' ? 'Nota penting' : language === 'ta' ? 'முக்கிய குறிப்பு' : 'Important notes'}
                  </p>
                  <p className="text-sm text-neutral-700 leading-relaxed">{t.notes}</p>
                </div>
              </div>

              {/* Reminder button */}
              <button
                onClick={() => alert(`Set reminder for ${med.name}: ${t.frequency}`)}
                className="flex items-center gap-2 text-sm text-navy-500 font-semibold hover:text-navy-600 transition-colors mt-1 bg-navy-50 border border-navy-100 rounded-xl px-3 py-2.5"
              >
                <Bell className="w-4 h-4" />
                {language === 'zh' ? `设置${med.name}提醒` : language === 'ms' ? `Tetapkan peringatan untuk ${med.name}` : language === 'ta' ? `${med.name} நினைவூட்டல் அமைக்கவும்` : `Set reminder for ${med.name}`}
              </button>

              {/* Read full details */}
              <button
                onClick={() => speak(speakText)}
                className="flex items-center gap-2 text-sm text-orange-500 font-semibold hover:text-orange-600 transition-colors"
              >
                🔊 {language === 'zh' ? '朗读完整说明' : language === 'ms' ? 'Baca arahan penuh' : language === 'ta' ? 'முழு வழிமுறைகளை கேளுங்கள்' : 'Read full instructions aloud'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

export default function MedicationsScreen({ onNavigate }: Props) {
  const { language } = useTTS as unknown as { language: never }
  const { language: lang } = useLang()
  const { toggle, speaking } = useTTS(lang)
  const meds = MOCK_RESULT.medications ?? []
  const [openId, setOpenId] = useState<string | null>(meds[0]?.id ?? null)

  const allMedsText = meds.map(m => {
    const t = lang === 'en'
      ? { purpose: m.purpose, frequency: m.frequency, timing: m.timing }
      : { purpose: m.translations[lang]?.purpose ?? m.purpose, frequency: m.translations[lang]?.frequency ?? m.frequency, timing: m.translations[lang]?.timing ?? m.timing }
    return buildMedSummary(lang, m.name, t.purpose, t.frequency, t.timing)
  }).join(' ')

  return (
    <div className="min-h-full bg-neutral-50 flex flex-col">
      <TopBar
        title={T[lang].meds_title}
        subtitle={lang === 'zh' ? `共${meds.length}种药物` : lang === 'ms' ? `${meds.length} ubat-ubatan` : lang === 'ta' ? `${meds.length} மருந்துகள்` : `${meds.length} medications`}
        onBack={() => onNavigate('results')}
        right={
          <TTSButton text={allMedsText} speaking={speaking} onToggle={toggle} size="sm" variant="icon" />
        }
      />

      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">

        {/* Listen to all */}
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🔊</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-orange-700">
              {lang === 'zh' ? '听取所有药物说明' : lang === 'ms' ? 'Dengar semua arahan ubat' : lang === 'ta' ? 'அனைத்து மருந்து வழிமுறைகளை கேளுங்கள்' : 'Listen to all medication instructions'}
            </p>
            <p className="text-xs text-orange-500 mt-0.5">
              {lang === 'zh' ? '清晰缓慢地朗读，适合老年人' : lang === 'ms' ? 'Dibaca dengan jelas dan perlahan' : lang === 'ta' ? 'தெளிவாகவும் மெதுவாகவும் படிக்கப்படுகிறது' : 'Read clearly and slowly, optimised for seniors'}
            </p>
          </div>
          <TTSButton text={allMedsText} speaking={speaking} onToggle={toggle} size="md" />
        </div>

        {/* Daily schedule visual */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-card">
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">
            {lang === 'zh' ? '每日服药时间表' : lang === 'ms' ? 'Jadual Harian' : lang === 'ta' ? 'தினசரி அட்டவணை' : 'Daily schedule'}
          </p>
          <div className="flex flex-col gap-2">
            {[
              {
                time: lang === 'zh' ? '早晨（随餐）' : lang === 'ms' ? 'Pagi (semasa makan)' : lang === 'ta' ? 'காலை (உணவுடன்)' : 'Morning (with meal)',
                emoji: '🌅',
                meds: ['Metformin 500mg', 'Amlodipine 5mg'],
              },
              {
                time: lang === 'zh' ? '晚上（随餐）' : lang === 'ms' ? 'Malam (semasa makan)' : lang === 'ta' ? 'மாலை (உணவுடன்)' : 'Evening (with meal)',
                emoji: '🌙',
                meds: ['Metformin 500mg'],
              },
              {
                time: lang === 'zh' ? '睡前' : lang === 'ms' ? 'Sebelum tidur' : lang === 'ta' ? 'தூக்கத்திற்கு முன்' : 'Before bed',
                emoji: '🌃',
                meds: ['Simvastatin 20mg'],
              },
            ].map(slot => (
              <div key={slot.time} className="flex items-start gap-3 bg-neutral-50 rounded-xl p-3">
                <span className="text-xl flex-shrink-0">{slot.emoji}</span>
                <div>
                  <p className="text-xs font-bold text-neutral-500 mb-1">{slot.time}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {slot.meds.map(m => (
                      <span key={m} className="text-xs bg-white border border-neutral-200 text-neutral-700 font-semibold px-2 py-1 rounded-full">{m}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Medication cards */}
        <div>
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">
            {lang === 'zh' ? '药物详情' : lang === 'ms' ? 'Butiran Ubat' : lang === 'ta' ? 'மருந்து விவரங்கள்' : 'Medication details'}
          </p>
          <div className="flex flex-col gap-3">
            {meds.map(med => (
              <MedCard
                key={med.id}
                med={med}
                isOpen={openId === med.id}
                onToggle={() => setOpenId(prev => prev === med.id ? null : med.id)}
              />
            ))}
          </div>
        </div>

        {/* Safety note */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 leading-relaxed">
            {lang === 'zh'
              ? '如有疑问请咨询医生或药剂师。不要自行停药。'
              : lang === 'ms'
              ? 'Hubungi doktor atau farmasi jika ada soalan. Jangan berhenti minum ubat tanpa nasihat doktor.'
              : lang === 'ta'
              ? 'கேள்விகள் இருந்தால் மருத்துவர் அல்லது மருந்தாளரை தொடர்பு கொள்ளுங்கள். மருத்துவர் ஆலோசனை இல்லாமல் மருந்தை நிறுத்தாதீர்கள்.'
              : 'Always consult your doctor or pharmacist if you have questions. Do not stop taking medications without medical advice.'}
          </p>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Bell, Globe, Info, Shield, Type, Volume2 } from 'lucide-react'
import { Card, Toggle, TopBar } from '../components/ui'
import { useLang, T } from '../hooks/i18n'
import { useTTS } from '../hooks/useTTS'
import TTSButton from '../components/TTSButton'
import { useTextSize, useHighContrast } from '../App'
import type { Language, Screen } from '../types'

interface Props { onNavigate: (s: Screen) => void }

const LANGUAGES: { code: Language; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'zh', label: 'Chinese', native: '中文' },
  { code: 'ms', label: 'Malay', native: 'Melayu' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
]

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return <section><div className="flex items-center gap-2 mb-3"><Icon className="w-4 h-4 text-teal-700" /><h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{title}</h2></div><Card className="p-4">{children}</Card></section>
}

export default function Settings({}: Props) {
  const { language, setLanguage } = useLang()
  const t = T[language]
  const { toggle, speaking, rate, setRate, supported } = useTTS(language)
  const preview = language === 'zh' ? '您好，这是语音朗读测试。' : language === 'ms' ? 'Helo, ini adalah ujian bacaan suara.' : language === 'ta' ? 'வணக்கம், இது குரல் வாசிப்பு சோதனை.' : 'Hello, this is a text-to-speech test.'
  const { step: textStep, setStep: setTextStep } = useTextSize()
  const { highContrast, setHighContrast } = useHighContrast()

  const TEXT_LABELS = [t.size_xs, t.size_sm, t.size_default, t.size_lg, t.size_xl]
  const [healthReminders, setHealthReminders] = useState(false)

  return (
    <div className="min-h-full bg-neutral-50 flex flex-col">
      <TopBar title={t.settings_title} subtitle={t.settings_sub} />
      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
        <Section icon={Globe} title={t.lang_section}>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map(item => <button key={item.code} onClick={() => setLanguage(item.code)} aria-pressed={language === item.code} className={`py-3 px-4 rounded-xl text-left border ${language === item.code ? 'bg-teal-700 text-white border-teal-700' : 'bg-white text-neutral-700 border-neutral-200'}`}><span className="block font-semibold">{item.native}</span><span className={`text-xs ${language === item.code ? 'text-teal-100' : 'text-neutral-400'}`}>{item.label}</span></button>)}
          </div>
        </Section>

        <Section icon={Volume2} title={t.tts_section}>
          {supported ? <><div className="flex justify-between text-sm text-neutral-500 mb-2"><span>{t.reading_speed}</span><span className="font-semibold text-teal-700">{rate.toFixed(2)}×</span></div><input type="range" min="0.5" max="1.5" step="0.05" value={rate} onChange={event => setRate(Number(event.target.value))} className="w-full accent-teal-700 mb-4" aria-label={t.reading_speed} /><TTSButton text={preview} speaking={speaking} onToggle={toggle} size="md" className="w-full justify-center" /></> : <p className="text-sm text-neutral-500">{t.tts_unsupported}</p>}
        </Section>

        <Section icon={Type} title={t.accessibility}>
          {/* Text size slider */}
          <div className="pb-5 mb-4 border-b border-neutral-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-base font-medium text-neutral-900">{t.text_size}</p>
              <span className="text-sm font-semibold text-teal-700">{TEXT_LABELS[textStep]}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-neutral-400 select-none w-4 text-center flex-shrink-0">A</span>
              <div className="relative flex-1 flex flex-col justify-center">
                <input
                  type="range"
                  min={0}
                  max={4}
                  step={1}
                  value={textStep}
                  onChange={e => setTextStep(Number(e.target.value))}
                  className="w-full accent-teal-700 h-1"
                  aria-label={t.text_size}
                />
                <div className="flex justify-between mt-2 px-0.5">
                  {[0,1,2,3,4].map(i => (
                    <button
                      key={i}
                      onClick={() => setTextStep(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${i === textStep ? 'bg-teal-700' : 'bg-neutral-300'}`}
                      aria-label={TEXT_LABELS[i]}
                    />
                  ))}
                </div>
              </div>
              <span className="text-xl font-bold text-neutral-600 select-none w-6 text-center flex-shrink-0">A</span>
            </div>
          </div>
          <Toggle id="high-contrast" label={t.high_contrast} sublabel={t.high_contrast_sub} checked={highContrast} onChange={setHighContrast} />
        </Section>


        <Section icon={Shield} title={t.privacy_section}>
          <p className="text-sm text-neutral-600 leading-relaxed">{t.privacy_full}</p>
        </Section>

        <Section icon={Info} title={t.about_section}>
          <div className="flex justify-between text-sm"><span className="text-neutral-600">{t.version_label}</span><span className="font-semibold text-neutral-900">0.1.0</span></div>
        </Section>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Bell, Globe, Info, Shield, Type, User, Volume2 } from 'lucide-react'
import { Card, Toggle, TopBar } from '../components/ui'
import { useLang } from '../hooks/i18n'
import { useTTS } from '../hooks/useTTS'
import TTSButton from '../components/TTSButton'
import type { Language, Screen } from '../types'

interface Props { onNavigate: (s: Screen) => void }

const LANGUAGES: { code: Language; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'zh', label: 'Chinese', native: '中文' },
  { code: 'ms', label: 'Malay', native: 'Melayu' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
]

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return <section><div className="flex items-center gap-2 mb-3"><Icon className="w-4 h-4 text-orange-500" /><h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{title}</h2></div><Card className="p-4">{children}</Card></section>
}

export default function Settings({}: Props) {
  const { language, setLanguage } = useLang()
  const { toggle, speaking, rate, setRate, supported } = useTTS(language)
  const preview = language === 'zh' ? '您好，这是语音朗读测试。' : language === 'ms' ? 'Helo, ini adalah ujian bacaan suara.' : language === 'ta' ? 'வணக்கம், இது குரல் வாசிப்பு சோதனை.' : 'Hello, this is a text-to-speech test.'
  const [largeText, setLargeText] = useState(false)
  const [highContrast, setHighContrast] = useState(false)
  const [healthReminders, setHealthReminders] = useState(false)

  return (
    <div className="min-h-full bg-neutral-50 flex flex-col">
      <TopBar title={language === 'zh' ? '设置' : language === 'ms' ? 'Tetapan' : language === 'ta' ? 'அமைப்புகள்' : 'Settings'} subtitle="Language and accessibility" />
      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
        <Section icon={User} title="Profile">
          <div className="flex items-center gap-4"><div className="w-14 h-14 rounded-full bg-orange-100 grid place-items-center"><User className="w-6 h-6 text-orange-500" /></div><div><p className="text-base font-bold text-neutral-900">No profile connected</p><p className="text-sm text-neutral-400">No subsidy cards saved</p></div></div>
        </Section>
        <Section icon={Globe} title="Language">
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map(item => <button key={item.code} onClick={() => setLanguage(item.code)} aria-pressed={language === item.code} className={`py-3 px-4 rounded-xl text-left border ${language === item.code ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-neutral-700 border-neutral-200'}`}><span className="block font-semibold">{item.native}</span><span className={`text-xs ${language === item.code ? 'text-orange-100' : 'text-neutral-400'}`}>{item.label}</span></button>)}
          </div>
        </Section>

        <Section icon={Volume2} title="Text-to-speech">
          {supported ? <><div className="flex justify-between text-sm text-neutral-500 mb-2"><span>Reading speed</span><span className="font-semibold text-orange-500">{rate.toFixed(2)}×</span></div><input type="range" min="0.5" max="1.5" step="0.05" value={rate} onChange={event => setRate(Number(event.target.value))} className="w-full accent-orange-500 mb-4" aria-label="Text-to-speech reading speed" /><TTSButton text={preview} speaking={speaking} onToggle={toggle} size="md" className="w-full justify-center" /></> : <p className="text-sm text-neutral-500">Text-to-speech is not supported by this browser.</p>}
        </Section>

        <Section icon={Type} title="Accessibility">
          <div className="pb-4 mb-4 border-b border-neutral-100"><Toggle id="large-text" label="Large text" sublabel="Increase text size for easier reading" checked={largeText} onChange={setLargeText} /></div>
          <Toggle id="high-contrast" label="High contrast mode" sublabel="Increase colour contrast" checked={highContrast} onChange={setHighContrast} />
        </Section>

        <Section icon={Bell} title="Notifications">
          <Toggle id="health-reminders" label="Health reminders" sublabel="Preference is kept for this session only" checked={healthReminders} onChange={setHealthReminders} />
        </Section>

        <Section icon={Shield} title="Privacy">
          <p className="text-sm text-neutral-600 leading-relaxed">Uploaded files are processed for the current request and are not saved by this app. NRIC-like identifiers are redacted from extracted results before they are returned.</p>
        </Section>

        <Section icon={Info} title="About">
          <div className="flex justify-between text-sm"><span className="text-neutral-600">Version</span><span className="font-semibold text-neutral-900">0.1.0</span></div>
        </Section>
      </div>
    </div>
  )
}

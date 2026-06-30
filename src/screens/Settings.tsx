import { useState } from 'react'
import { User, Type, Globe, Bell, Shield, Info, ChevronRight, Volume2 } from 'lucide-react'
import { Card, Toggle, TopBar } from '../components/ui'
import { useLang, T } from '../hooks/i18n'
import { useTTS } from '../hooks/useTTS'
import TTSButton from '../components/TTSButton'
import type { Screen, Language } from '../types'

interface Props { onNavigate: (s: Screen) => void }

const FONT_SIZES = ['Normal', 'Large', 'XL']

export default function Settings({ onNavigate }: Props) {
  const { language, setLanguage } = useLang()
  const { toggle, speaking, rate, setRate } = useTTS(language)
  const t = T[language]

  const [fontSize,          setFontSize]        = useState('Large')
  const [highContrast,      setHighContrast]     = useState(false)
  const [tts,               setTts]              = useState(true)
  const [simpleTouch,       setSimpleTouch]      = useState(false)
  const [healthReminders,   setHealthReminders]  = useState(true)
  const [appUpdates,        setAppUpdates]       = useState(false)
  const [shareData,         setShareData]        = useState(false)

  const langs: { code: Language; label: string; native: string }[] = [
    { code: 'en', label: 'English',   native: 'English' },
    { code: 'zh', label: 'Chinese',   native: '中文' },
    { code: 'ms', label: 'Malay',     native: 'Melayu' },
    { code: 'ta', label: 'Tamil',     native: 'தமிழ்' },
  ]

  const Section = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-orange-500" />
        <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{title}</p>
      </div>
      <Card>{children}</Card>
    </div>
  )

  const NavRow = ({ label, sub, onPress }: { label: string; sub?: string; onPress: () => void }) => (
    <button onClick={onPress} className="w-full flex items-center justify-between px-4 py-4 border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors text-left">
      <div>
        <p className="text-base font-medium text-neutral-900">{label}</p>
        {sub && <p className="text-sm text-neutral-400 mt-0.5">{sub}</p>}
      </div>
      <ChevronRight className="w-5 h-5 text-neutral-300" />
    </button>
  )

  return (
    <div className="min-h-full bg-neutral-50 flex flex-col">
      <TopBar title={language === 'zh' ? '设置' : language === 'ms' ? 'Tetapan' : language === 'ta' ? 'அமைப்புகள்' : 'Settings'} subtitle={language === 'zh' ? '无障碍和偏好设置' : language === 'ms' ? 'Kebolehcapaian & keutamaan' : language === 'ta' ? 'அணுகல்தன்மை & விருப்பங்கள்' : 'Accessibility & preferences'} />

      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">

        {/* Profile */}
        <Section icon={User} title={language === 'zh' ? '个人资料' : language === 'ms' ? 'Profil' : language === 'ta' ? 'சுயவிவரம்' : 'Profile'}>
          <div className="px-4 py-4 flex items-center gap-4 border-b border-neutral-100">
            <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-orange-500">T</span>
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-neutral-900">Tan Ah Kow</p>
              <p className="text-sm text-neutral-400">Pioneer Generation · CHAS Orange</p>
            </div>
            <button className="text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors">
              {language === 'zh' ? '编辑' : language === 'ms' ? 'Edit' : language === 'ta' ? 'திருத்து' : 'Edit'}
            </button>
          </div>
          <NavRow
            label={language === 'zh' ? '查看我的津贴卡' : language === 'ms' ? 'Lihat kad subsidi saya' : language === 'ta' ? 'என் அட்டைகளைப் பாருங்கள்' : 'View my subsidy cards'}
            sub="Pioneer, CHAS Orange"
            onPress={() => alert('Opens card details')}
          />
        </Section>

        {/* Language — now wired to context */}
        <Section icon={Globe} title={language === 'zh' ? '语言' : language === 'ms' ? 'Bahasa' : language === 'ta' ? 'மொழி' : 'Language'}>
          <div className="px-4 py-4">
            <p className="text-sm font-semibold text-neutral-700 mb-3">
              {language === 'zh' ? '显示语言（影响所有界面和朗读）' : language === 'ms' ? 'Bahasa paparan (mempengaruhi semua skrin dan bacaan)' : language === 'ta' ? 'காட்சி மொழி (அனைத்து திரைகளையும் பாதிக்கிறது)' : 'Display language (affects all screens and text-to-speech)'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {langs.map(l => (
                <button key={l.code} onClick={() => setLanguage(l.code)}
                  className={`py-3 px-4 rounded-xl text-base font-semibold border transition-all text-left ${
                    language === l.code
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <span className="block">{l.native}</span>
                  <span className={`text-xs font-normal ${language === l.code ? 'text-orange-100' : 'text-neutral-400'}`}>{l.label}</span>
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Text-to-speech */}
        <Section icon={Volume2} title={language === 'zh' ? '文字转语音' : language === 'ms' ? 'Teks ke Suara' : language === 'ta' ? 'உரை-மொழி' : 'Text-to-Speech'}>
          <div className="px-4 py-4 border-b border-neutral-100">
            <Toggle id="tts-toggle" label={language === 'zh' ? '启用语音朗读' : language === 'ms' ? 'Dayakan bacaan suara' : language === 'ta' ? 'குரல் வாசிப்பை இயக்கு' : 'Enable voice reading'} sublabel={language === 'zh' ? '点击任何🔊按钮即可收听' : language === 'ms' ? 'Ketik mana-mana butang 🔊 untuk mendengar' : language === 'ta' ? 'எந்த 🔊 பொத்தானையும் கிளிக் செய்து கேளுங்கள்' : 'Tap any 🔊 button to hear content read aloud'} checked={tts} onChange={setTts} />
          </div>
          <div className="px-4 py-4 border-b border-neutral-100">
            <p className="text-sm font-semibold text-neutral-700 mb-3">
              {language === 'zh' ? '朗读速度' : language === 'ms' ? 'Kelajuan bacaan' : language === 'ta' ? 'வாசிப்பு வேகம்' : 'Reading speed'}
            </p>
            <div className="flex items-center justify-between text-sm text-neutral-400 mb-2">
              <span>{language === 'zh' ? '慢' : language === 'ms' ? 'Perlahan' : language === 'ta' ? 'மெதுவாக' : 'Slower'}</span>
              <span className="text-orange-500 font-semibold">{rate.toFixed(2)}×</span>
              <span>{language === 'zh' ? '快' : language === 'ms' ? 'Cepat' : language === 'ta' ? 'வேகமாக' : 'Faster'}</span>
            </div>
            <input type="range" min="0.5" max="1.5" step="0.05" value={rate}
              onChange={e => setRate(parseFloat(e.target.value))}
              className="w-full accent-orange-500" aria-label="TTS reading speed" />
          </div>
          <div className="px-4 py-4">
            <p className="text-sm font-semibold text-neutral-700 mb-3">
              {language === 'zh' ? '试听' : language === 'ms' ? 'Pratonton' : language === 'ta' ? 'மாதிரி' : 'Preview'}
            </p>
            <TTSButton
              text={language === 'zh' ? '您好，这是语音朗读测试。' : language === 'ms' ? 'Helo, ini adalah ujian bacaan suara.' : language === 'ta' ? 'வணக்கம், இது குரல் வாசிப்பு சோதனை.' : 'Hello, this is a text-to-speech test. Your medications are ready to review.'}
              speaking={speaking}
              onToggle={toggle}
              size="md"
              className="w-full justify-center"
            />
          </div>
        </Section>

        {/* Accessibility */}
        <Section icon={Type} title={language === 'zh' ? '无障碍' : language === 'ms' ? 'Kebolehcapaian' : language === 'ta' ? 'அணுகல்தன்மை' : 'Accessibility'}>
          <div className="px-4 py-4 border-b border-neutral-100">
            <p className="text-sm font-semibold text-neutral-700 mb-3">{language === 'zh' ? '文字大小' : language === 'ms' ? 'Saiz teks' : language === 'ta' ? 'உரை அளவு' : 'Text size'}</p>
            <div className="flex gap-2">
              {FONT_SIZES.map(s => (
                <button key={s} onClick={() => setFontSize(s)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${fontSize === s ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'}`}
                >{s}</button>
              ))}
            </div>
          </div>
          <div className="px-4 py-4 border-b border-neutral-100">
            <Toggle id="high-contrast" label={language === 'zh' ? '高对比度模式' : language === 'ms' ? 'Mod kontras tinggi' : language === 'ta' ? 'அதிக கான்ட்ராஸ்ட் பயன்முறை' : 'High contrast mode'} sublabel={language === 'zh' ? '增加颜色对比度' : language === 'ms' ? 'Meningkatkan kontras warna' : language === 'ta' ? 'வண்ண மாறுபாட்டை அதிகரிக்கிறது' : 'Increases colour contrast for better visibility'} checked={highContrast} onChange={setHighContrast} />
          </div>
          <div className="px-4 py-4">
            <Toggle id="simple-touch" label={language === 'zh' ? '简化触控' : language === 'ms' ? 'Mudahkan sentuhan' : language === 'ta' ? 'தொடுதலை எளிதாக்கு' : 'Simplify touch'} sublabel={language === 'zh' ? '禁用滑动手势，仅使用按钮' : language === 'ms' ? 'Lumpuhkan swipe, guna butang sahaja' : language === 'ta' ? 'ஸ்வைப் முடக்கு, பொத்தான்கள் மட்டும்' : 'Disables swipe gestures, use buttons only'} checked={simpleTouch} onChange={setSimpleTouch} />
          </div>
        </Section>

        {/* Notifications */}
        <Section icon={Bell} title={language === 'zh' ? '通知' : language === 'ms' ? 'Pemberitahuan' : language === 'ta' ? 'அறிவிப்புகள்' : 'Notifications'}>
          <div className="px-4 py-4 border-b border-neutral-100">
            <Toggle id="health-reminders" label={language === 'zh' ? '健康提醒' : language === 'ms' ? 'Peringatan kesihatan' : language === 'ta' ? 'சுகாதார நினைவூட்டல்கள்' : 'Health reminders'} sublabel={language === 'zh' ? '就诊后提醒检查津贴' : language === 'ms' ? 'Ingatkan saya selepas lawatan klinik' : language === 'ta' ? 'கிளினிக் கிளிப்பிற்கு பிறகு நினைவூட்டல்' : 'Remind me to check subsidies after clinic visits'} checked={healthReminders} onChange={setHealthReminders} />
          </div>
          <div className="px-4 py-4">
            <Toggle id="app-updates" label={language === 'zh' ? '津贴更新通知' : language === 'ms' ? 'Kemas kini skim' : language === 'ta' ? 'திட்ட புதுப்பிப்புகள்' : 'Scheme updates'} sublabel={language === 'zh' ? '津贴规则更改时通知' : language === 'ms' ? 'Beritahu apabila peraturan subsidi berubah' : language === 'ta' ? 'மானிய விதிகள் மாறும்போது அறிவிக்கவும்' : 'Notify when subsidy rules change'} checked={appUpdates} onChange={setAppUpdates} />
          </div>
        </Section>

        {/* Privacy */}
        <Section icon={Shield} title={language === 'zh' ? '数据与隐私' : language === 'ms' ? 'Data & Privasi' : language === 'ta' ? 'தரவு & தனியுரிமை' : 'Data & Privacy'}>
          <div className="px-4 py-4 border-b border-neutral-100">
            <Toggle id="share-data" label={language === 'zh' ? '与卫生部共享匿名数据' : language === 'ms' ? 'Kongsi data tanpa nama dengan MOH' : language === 'ta' ? 'MOH உடன் அனாமத்தான தரவை பகிரவும்' : 'Share anonymised data with MOH'} sublabel={language === 'zh' ? '改善津贴教育，不包含个人信息' : language === 'ms' ? 'Membantu MOH meningkatkan pendidikan subsidi' : language === 'ta' ? 'MOH மானிய கல்வியை மேம்படுத்த உதவுகிறது' : 'Helps MOH improve subsidy education. No personal data.'} checked={shareData} onChange={setShareData} />
          </div>
          <NavRow label={language === 'zh' ? '管理已保存的扫描' : language === 'ms' ? 'Urus imbasan tersimpan' : language === 'ta' ? 'சேமித்த ஸ்கேன்களை நிர்வகி' : 'Manage stored scans'} sub={language === 'zh' ? '4个扫描已保存' : language === 'ms' ? '4 imbasan disimpan' : language === 'ta' ? '4 ஸ்கேன்கள் சேமிக்கப்பட்டுள்ளன' : '4 scans saved'} onPress={() => onNavigate('history')} />
          <NavRow label={language === 'zh' ? '隐私政策' : language === 'ms' ? 'Dasar Privasi' : language === 'ta' ? 'தனியுரிமை கொள்கை' : 'Privacy Policy'} onPress={() => alert('Opens privacy policy')} />
          <button onClick={() => confirm('Delete all data?') && alert('Deleted.')} className="w-full px-4 py-4 text-left text-base font-semibold text-danger-500 hover:bg-danger-50 transition-colors">
            {language === 'zh' ? '删除所有数据' : language === 'ms' ? 'Padam semua data' : language === 'ta' ? 'அனைத்து தரவையும் நீக்கு' : 'Delete all my data'}
          </button>
        </Section>

        {/* About */}
        <Section icon={Info} title={language === 'zh' ? '关于' : language === 'ms' ? 'Tentang' : language === 'ta' ? 'பற்றி' : 'About'}>
          <NavRow label={language === 'zh' ? '版本' : language === 'ms' ? 'Versi' : language === 'ta' ? 'பதிப்பு' : 'Version'} sub="v2.0.0 · Jan 2025" onPress={() => {}} />
          <NavRow label={language === 'zh' ? '津贴数据来源' : language === 'ms' ? 'Sumber data subsidi' : language === 'ta' ? 'மானிய தரவு மூலம்' : 'Subsidy data source'} sub="MOH Singapore · Jan 2025" onPress={() => window.open('https://www.moh.gov.sg')} />
        </Section>

      </div>
    </div>
  )
}

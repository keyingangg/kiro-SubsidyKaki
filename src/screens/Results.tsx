import { motion } from 'framer-motion'
import { Share2, Printer, MessageCircle, ChevronRight, BadgeCheck, FileText, Pill } from 'lucide-react'
import { Button, Card, Badge, TopBar, Divider } from '../components/ui'
import TTSButton from '../components/TTSButton'
import { MOCK_RESULT } from '../lib/utils'
import { useTTS, buildResultsSummary } from '../hooks/useTTS'
import { useLang, T } from '../hooks/i18n'
import type { Screen, SubsidyCard } from '../types'

interface Props {
  onNavigate: (s: Screen) => void
  onSelectSubsidy: (s: SubsidyCard) => void
}

const badgeVariant = (c: SubsidyCard['badgeColor']) =>
  c === 'orange' ? 'orange' as const : c === 'teal' ? 'teal' as const : c === 'navy' ? 'navy' as const : 'gray' as const

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }
const fadeUp  = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

export default function Results({ onNavigate, onSelectSubsidy }: Props) {
  const r = MOCK_RESULT
  const { language } = useLang()
  const { toggle, speaking } = useTTS(language)

  const summary = buildResultsSummary(
    language,
    r.outOfPocket,
    r.finalCost,
    r.totalSaved,
    r.clinicName,
    r.subsidies.filter(s => s.eligible).map(s => s.name)
  )

  return (
    <div className="min-h-full bg-neutral-50 flex flex-col">
      <TopBar
        title={T[language].results_title}
        subtitle={`${r.clinicName} · ${r.date}`}
        onBack={() => onNavigate('confirm')}
        right={
          <Badge variant="success" className="gap-1.5">
            <BadgeCheck className="w-3.5 h-3.5" />
            {r.confidence}% match
          </Badge>
        }
      />

      <motion.div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4"
        variants={stagger} initial="hidden" animate="show">

        {/* Hero cost card with TTS */}
        <motion.div variants={fadeUp}>
          <Card className="p-5 text-center bg-gradient-to-b from-navy-50 to-white border-navy-100">
            {/* TTS button top right of card */}
            <div className="flex justify-end mb-2">
              <TTSButton text={summary} speaking={speaking} onToggle={toggle} size="sm" />
            </div>

            <p className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              {T[language].you_pay}
            </p>
            <motion.p
              className="text-[52px] font-bold text-orange-500 leading-none mb-1"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 180, damping: 16 }}
            >
              ${r.finalCost}
            </motion.p>
            <p className="text-base text-neutral-500 mb-4">
              {language === 'zh' ? '使用保健储蓄后' : language === 'ms' ? 'Selepas MediSave' : language === 'ta' ? 'மெடிசேவ் பிறகு' : 'After MediSave'}
              {' '}(
              {language === 'zh' ? `余额: $${r.mediSaveBalance.toLocaleString()}` : `balance: $${r.mediSaveBalance.toLocaleString()}`}
              )
            </p>
            <Divider className="mb-4" />
            <div className="grid grid-cols-3 gap-1 text-center">
              {[
                { label: T[language].original_bill, val: `$${r.totalBill}`,  color: 'text-neutral-700' },
                { label: T[language].total_saved,   val: `$${r.totalSaved}`, color: 'text-success-500' },
                { label: language === 'zh' ? '使用保健储蓄前' : language === 'ms' ? 'Sebelum MediSave' : language === 'ta' ? 'மெடிசேவ் முன்' : 'Before MediSave',
                  val: `$${r.outOfPocket}`, color: 'text-orange-500' },
              ].map(d => (
                <div key={d.label}>
                  <p className={`text-xl font-bold ${d.color}`}>{d.val}</p>
                  <p className="text-xs text-neutral-400 mt-0.5 leading-tight">{d.label}</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Quick-access cards: Bill Explained + Medications */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onNavigate('bill')}
            className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-left hover:bg-orange-100 active:scale-[0.97] transition-all shadow-card"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center mb-3">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-bold text-orange-700">
              {T[language].bill_title}
            </p>
            <p className="text-xs text-orange-500 mt-0.5">
              {language === 'zh' ? '每项费用说明' : language === 'ms' ? 'Setiap item dijelaskan' : language === 'ta' ? 'ஒவ்வொரு கட்டணமும் விளக்கம்' : 'Every charge explained'}
            </p>
          </button>

          <button
            onClick={() => onNavigate('medications')}
            className="bg-teal-50 border border-teal-200 rounded-2xl p-4 text-left hover:bg-teal-100 active:scale-[0.97] transition-all shadow-card"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center mb-3">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-bold text-teal-700">
              {T[language].meds_title}
            </p>
            <p className="text-xs text-teal-500 mt-0.5">
              {language === 'zh' ? '服药说明和时间表' : language === 'ms' ? 'Arahan & jadual ubat' : language === 'ta' ? 'மருந்து வழிமுறைகள்' : 'Instructions & schedule'}
            </p>
          </button>
        </motion.div>

        {/* Subsidy cards */}
        <motion.div variants={fadeUp}>
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">
            {language === 'zh' ? '适用津贴' : language === 'ms' ? 'Subsidi yang layak' : language === 'ta' ? 'பொருந்தும் மானியங்கள்' : 'Applied subsidies'}
          </p>
          <div className="flex flex-col gap-3">
            {r.subsidies.map((s) => (
              <Card
                key={s.id}
                className={`p-4 ${!s.eligible ? 'opacity-60' : ''}`}
                onClick={() => { if (s.eligible) { onSelectSubsidy(s); onNavigate('details') } }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0 mt-0.5">{s.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-neutral-900 leading-snug">{s.name}</p>
                    <p className="text-sm text-neutral-400 mb-2">{s.chineseName}</p>
                    {s.eligible
                      ? <div className="flex items-center gap-2"><Badge variant={badgeVariant(s.badgeColor)}>✓ {language === 'zh' ? '符合资格' : language === 'ms' ? 'Layak' : language === 'ta' ? 'தகுதியுடையவர்' : 'Eligible'}</Badge><span className="text-sm font-semibold text-success-500">-${s.saves}</span></div>
                      : <Badge variant="gray">✗ {language === 'zh' ? '不适用' : language === 'ms' ? 'Tidak layak' : language === 'ta' ? 'பொருந்தாது' : 'Not applicable'}</Badge>
                    }
                  </div>
                  {s.eligible && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-bold text-orange-500">${s.outOfPocket}</p>
                      <p className="text-xs text-neutral-400">{T[language].you_pay}</p>
                      <ChevronRight className="w-4 h-4 text-neutral-300 ml-auto mt-1" />
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* MediSave callout */}
        {r.canUseMediSave && (
          <motion.div variants={fadeUp} className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex gap-3">
            <span className="text-2xl">💳</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-teal-700">
                {language === 'zh' ? '保健储蓄支付余额' : language === 'ms' ? 'MediSave menutup baki' : language === 'ta' ? 'மெடிசேவ் மீதியை செலுத்துகிறது' : 'MediSave covers the rest'}
              </p>
              <p className="text-sm text-teal-600 mt-0.5">
                {language === 'zh'
                  ? `您的剩余$${r.outOfPocket}可从保健储蓄余额$${r.mediSaveBalance.toLocaleString()}中支付。实际自付金额：$0。`
                  : language === 'ms'
                  ? `Baki $${r.outOfPocket} anda boleh dibayar dari MediSave $${r.mediSaveBalance.toLocaleString()}. Kos sebenar: $0.`
                  : language === 'ta'
                  ? `உங்கள் மீதி $${r.outOfPocket} மெடிசேவ் $${r.mediSaveBalance.toLocaleString()} இலிருந்து செலுத்தலாம். இறுதி செலவு: $0.`
                  : `Your remaining $${r.outOfPocket} can be paid from MediSave balance of $${r.mediSaveBalance.toLocaleString()}. Final out-of-pocket: $0.`}
              </p>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div variants={fadeUp} className="flex flex-col gap-3 pt-1">
          <Button variant="secondary" size="md" fullWidth onClick={() => alert('Opens print dialog')} className="gap-2">
            <Printer className="w-5 h-5 text-neutral-500" />
            {language === 'zh' ? '打印结果' : language === 'ms' ? 'Cetak Keputusan' : language === 'ta' ? 'முடிவுகளை அச்சிடுங்கள்' : 'Print Results'}
          </Button>
          <Button variant="secondary" size="md" fullWidth onClick={() => alert('Opens share sheet')} className="gap-2">
            <Share2 className="w-5 h-5 text-neutral-500" />
            {language === 'zh' ? '与医生分享' : language === 'ms' ? 'Kongsi dengan Doktor' : language === 'ta' ? 'மருத்துவருடன் பகிரவும்' : 'Share with Doctor'}
          </Button>
          <Button variant="ghost" size="md" fullWidth onClick={() => onNavigate('help')} className="gap-2">
            <MessageCircle className="w-5 h-5" />
            {language === 'zh' ? '提问' : language === 'ms' ? 'Tanya Soalan' : language === 'ta' ? 'கேள்விகள் கேளுங்கள்' : 'Ask Questions'}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}

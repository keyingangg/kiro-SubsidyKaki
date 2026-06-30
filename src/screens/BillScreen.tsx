import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Download } from 'lucide-react'
import { Card, TopBar, Divider, Button } from '../components/ui'
import TTSButton from '../components/TTSButton'
import { MOCK_RESULT } from '../lib/utils'
import { useTTS } from '../hooks/useTTS'
import { useLang, T } from '../hooks/i18n'
import type { Screen } from '../types'

interface Props { onNavigate: (s: Screen) => void }

const BILL_TRANSLATIONS: Record<string, Record<string, string>> = {
  'Consultation fee':              { zh: '门诊费', ms: 'Yuran Konsultasi', ta: 'ஆலோசனை கட்டணம்' },
  'Metformin 500mg × 60 tablets': { zh: '二甲双胍 500mg × 60片', ms: 'Metformin 500mg × 60 tablet', ta: 'மெட்ஃபோர்மின் 500mg × 60 மாத்திரை' },
  'Amlodipine 5mg × 30 tablets':  { zh: '氨氯地平 5mg × 30片', ms: 'Amlodipine 5mg × 30 tablet', ta: 'அம்லோடிபின் 5mg × 30 மாத்திரை' },
  'Simvastatin 20mg × 30 tablets':{ zh: '辛伐他汀 20mg × 30片', ms: 'Simvastatin 20mg × 30 tablet', ta: 'சிம்வாஸ்டாட்டின் 20mg × 30 மாத்திரை' },
  'HbA1c blood test':              { zh: '糖化血红蛋白血液检测', ms: 'Ujian darah HbA1c', ta: 'HbA1c இரத்த பரிசோதனை' },
  'Blood pressure monitoring':     { zh: '血压监测', ms: 'Pemantauan tekanan darah', ta: 'இரத்த அழுத்த கண்காணிப்பு' },
  'Syringe / consumables':         { zh: '注射器/耗材', ms: 'Picagari / bahan habis pakai', ta: 'சிரிஞ்ச் / பயன்பாட்டு பொருட்கள்' },
}

function buildBillSummary(language: string, totalBill: number, totalSaved: number, outOfPocket: number) {
  switch (language) {
    case 'zh': return `您的账单共有${totalBill}新元。其中${totalSaved}新元由津贴支付。您只需支付${outOfPocket}新元，使用保健储蓄后实际自付为零。`
    case 'ms': return `Bil anda berjumlah $${totalBill}. Sebanyak $${totalSaved} dilindungi oleh subsidi. Anda hanya perlu membayar $${outOfPocket}, dan selepas MediSave, kos sebenar adalah sifar.`
    case 'ta': return `உங்கள் பில் மொத்தம் $${totalBill}. $${totalSaved} மானியங்களால் செலுத்தப்படுகிறது. நீங்கள் $${outOfPocket} மட்டும் செலுத்தினால் போதும். மெடிசேவ் பிறகு இறுதி செலவு பூஜ்யம்.`
    default:   return `Your total bill is $${totalBill}. $${totalSaved} is covered by subsidies. You only need to pay $${outOfPocket}. After MediSave, your actual cost is zero.`
  }
}

export default function BillScreen({ onNavigate }: Props) {
  const r = MOCK_RESULT
  const { language } = useLang()
  const { toggle, speaking, speak } = useTTS(language)

  const fullSummary = buildBillSummary(language, r.totalBill, r.totalSaved, r.outOfPocket)

  const getItemName = (item: string) => {
    if (language === 'en') return item
    return BILL_TRANSLATIONS[item]?.[language] ?? item
  }

  const getSubsidyLabel = (coveredBy?: string) => {
    if (!coveredBy) return ''
    if (language === 'zh') {
      return coveredBy.replace('Pioneer Generation', '建国一代').replace('CDMP MediSave', 'CDMP保健储蓄').replace('CHAS', '综合健保')
    }
    return coveredBy
  }

  return (
    <div className="min-h-full bg-neutral-50 flex flex-col">
      <TopBar
        title={T[language].bill_title}
        subtitle={`${r.clinicName} · ${r.date}`}
        onBack={() => onNavigate('results')}
        right={
          <TTSButton text={fullSummary} speaking={speaking} onToggle={toggle} size="sm" variant="icon" />
        }
      />

      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">

        {/* Summary hero */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-bold text-neutral-500 uppercase tracking-wider">
              {language === 'zh' ? '账单摘要' : language === 'ms' ? 'Ringkasan Bil' : language === 'ta' ? 'பில் சுருக்கம்' : 'Bill Summary'}
            </p>
            <TTSButton text={fullSummary} speaking={speaking} onToggle={toggle} size="sm" />
          </div>

          <div className="flex flex-col gap-2 mt-3">
            {[
              { label: language === 'zh' ? '原始账单' : language === 'ms' ? 'Bil asal' : language === 'ta' ? 'அசல் பில்' : 'Original bill', val: `$${r.totalBill}`, color: 'text-neutral-700' },
              { label: language === 'zh' ? '津贴减免' : language === 'ms' ? 'Potongan subsidi' : language === 'ta' ? 'மானிய கழிவு' : 'Subsidy deductions', val: `-$${r.totalSaved}`, color: 'text-success-500' },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center">
                <span className="text-base text-neutral-600">{row.label}</span>
                <span className={`text-base font-bold ${row.color}`}>{row.val}</span>
              </div>
            ))}
            <Divider className="my-1" />
            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-neutral-900">
                {language === 'zh' ? '您支付（使用保健储蓄前）' : language === 'ms' ? 'Anda bayar (sebelum MediSave)' : language === 'ta' ? 'நீங்கள் செலுத்துவது (மெடிசேவ் முன்)' : 'You pay (before MediSave)'}
              </span>
              <span className="text-xl font-bold text-orange-500">${r.outOfPocket}</span>
            </div>
            <div className="flex justify-between items-center bg-success-50 rounded-xl px-3 py-2.5 border border-success-400/20">
              <span className="text-base font-bold text-success-600">
                {language === 'zh' ? '保健储蓄后实付' : language === 'ms' ? 'Selepas MediSave' : language === 'ta' ? 'மெடிசேவ் பிறகு' : 'After MediSave'}
              </span>
              <span className="text-xl font-bold text-success-500">$0</span>
            </div>
          </div>
        </Card>

        {/* Line-by-line breakdown */}
        <div>
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">
            {language === 'zh' ? '逐项明细' : language === 'ms' ? 'Pecahan Item' : language === 'ta' ? 'வரிசை வரிசையாக' : 'Line-by-line breakdown'}
          </p>

          <div className="flex flex-col gap-2">
            {r.billLines?.map((line, i) => {
              const itemName = getItemName(line.item)
              const lineText = line.subsidised
                ? (language === 'zh' ? `${itemName}，${line.amount}新元，由${getSubsidyLabel(line.coveredBy)}支付。`
                  : language === 'ms' ? `${itemName}, $${line.amount}, dilindungi oleh ${getSubsidyLabel(line.coveredBy)}.`
                  : language === 'ta' ? `${itemName}, $${line.amount}, ${getSubsidyLabel(line.coveredBy)} மூலம் செலுத்தப்படுகிறது.`
                  : `${itemName}, $${line.amount}, covered by ${line.coveredBy}.`)
                : (language === 'zh' ? `${itemName}，${line.amount}新元，不在津贴范围内。`
                  : language === 'ms' ? `${itemName}, $${line.amount}, tidak dilindungi subsidi.`
                  : language === 'ta' ? `${itemName}, $${line.amount}, மானியத்தால் மறைக்கப்படவில்லை.`
                  : `${itemName}, $${line.amount}, not covered by subsidy.`)

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Card className="px-4 py-3.5">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {line.subsidised
                          ? <CheckCircle2 className="w-5 h-5 text-success-500" />
                          : <XCircle className="w-5 h-5 text-neutral-300" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-neutral-900 leading-snug">{itemName}</p>
                        {line.subsidised && line.coveredBy && (
                          <p className="text-xs text-success-500 font-semibold mt-0.5">
                            {language === 'zh' ? '由' : language === 'ms' ? 'Dilindungi oleh' : language === 'ta' ? 'மூலம்' : 'Covered by'}{' '}
                            {getSubsidyLabel(line.coveredBy)}
                          </p>
                        )}
                        {!line.subsidised && (
                          <p className="text-xs text-neutral-400 mt-0.5">
                            {language === 'zh' ? '不在津贴范围内' : language === 'ms' ? 'Tidak dilindungi subsidi' : language === 'ta' ? 'மானியம் இல்லை' : 'Not covered by subsidy'}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-base font-bold ${line.subsidised ? 'text-success-500' : 'text-neutral-700'}`}>
                          ${line.amount}
                        </span>
                        <TTSButton text={lineText} speaking={false} onToggle={() => speak(lineText)} size="sm" variant="icon" />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <Card className="p-4">
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">
            {language === 'zh' ? '图例' : language === 'ms' ? 'Petunjuk' : language === 'ta' ? 'குறியீடு' : 'Legend'}
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success-500 flex-shrink-0" />
              <p className="text-sm text-neutral-600">
                {language === 'zh' ? '此费用由津贴支付' : language === 'ms' ? 'Item ini dilindungi subsidi' : language === 'ta' ? 'இந்த கட்டணம் மானியத்தால் மறைக்கப்படுகிறது' : 'This charge is covered by a subsidy'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-neutral-300 flex-shrink-0" />
              <p className="text-sm text-neutral-600">
                {language === 'zh' ? '您需要自付此费用' : language === 'ms' ? 'Anda perlu membayar item ini' : language === 'ta' ? 'இந்த கட்டணம் நீங்கள் செலுத்த வேண்டும்' : 'You need to pay this charge yourself'}
              </p>
            </div>
          </div>
        </Card>

        <Button variant="secondary" size="md" fullWidth onClick={() => alert('Downloads PDF')} className="gap-2">
          <Download className="w-5 h-5 text-neutral-500" />
          {language === 'zh' ? '下载PDF说明' : language === 'ms' ? 'Muat Turun PDF' : language === 'ta' ? 'PDF பதிவிறக்கம்' : 'Download PDF Explanation'}
        </Button>

        <Button variant="ghost" size="md" fullWidth onClick={() => onNavigate('results')}>
          {language === 'zh' ? '返回结果' : language === 'ms' ? 'Kembali ke keputusan' : language === 'ta' ? 'முடிவுகளுக்கு திரும்பு' : 'Back to results'}
        </Button>
      </div>
    </div>
  )
}

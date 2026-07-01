import { motion } from 'framer-motion'
import { CheckCircle2, FileText } from 'lucide-react'
import { Button, Card, Divider, TopBar } from '../components/ui'
import { useLang, T } from '../hooks/i18n'
import type { ExtractedBill, Screen } from '../types'

interface Props { onNavigate: (screen: Screen) => void; bill: ExtractedBill | null; institution: string | null; visitDate: string | null }

const money = (currency: string, amount: number | null) => amount === null ? '—' : new Intl.NumberFormat('en-SG', { style: 'currency', currency: currency === 'SGD' ? 'SGD' : currency, maximumFractionDigits: 2 }).format(amount)

export default function BillScreen({ onNavigate, bill, institution, visitDate }: Props) {
  const { language } = useLang()
  const t = T[language]

  return <div className="min-h-full bg-neutral-50 flex flex-col">
    <TopBar title={t.bill_title} subtitle={[institution, visitDate].filter(Boolean).join(' · ') || 'Processed document'} onBack={() => onNavigate('results')} />
    <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3"><p className="text-sm font-bold text-neutral-500 uppercase tracking-wider">{t.bill_summary}</p><div className="w-9 h-9 rounded-xl bg-teal-50 grid place-items-center"><FileText className="w-4 h-4 text-teal-700" /></div></div>
        <Divider className="mb-4" />
        <div className="flex justify-between items-center"><span className="text-base font-bold text-neutral-900">{t.printed_total}</span><span className="text-2xl font-bold text-teal-700">{bill ? money(bill.currency, bill.totalAmount) : '—'}</span></div>
        <p className="text-xs text-neutral-400 mt-2">{t.printed_total_note}</p>
      </Card>

      <div><p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">{t.line_breakdown}</p>
        {!bill || bill.items.length === 0
          ? <Card className="p-6 text-center"><FileText className="w-10 h-10 text-neutral-300 mx-auto mb-3" /><p className="font-semibold text-neutral-600">{t.no_bill_items}</p></Card>
          : <div className="flex flex-col gap-2">{bill.items.map((item, index) => <motion.div key={`${item.description}-${index}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.06 }}><Card className="px-4 py-3.5"><div className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-teal-500 mt-0.5" /><div className="flex-1"><p className="text-base font-semibold text-neutral-900">{item.description}</p><p className="text-xs text-neutral-400">{t.extracted_from}</p></div><span className="text-base font-bold text-neutral-700">{money(bill.currency, item.amount)}</span></div></Card></motion.div>)}</div>}
      </div>
      <Button variant="ghost" size="md" fullWidth onClick={() => onNavigate('results')}>{t.back_results}</Button>
    </div>
  </div>
}

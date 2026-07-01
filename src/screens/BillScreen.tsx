import { motion } from 'framer-motion'
import { CheckCircle2, FileText } from 'lucide-react'
import { Button, Card, Divider, TopBar } from '../components/ui'
import type { ExtractedBill, Screen } from '../types'

interface Props { onNavigate: (screen: Screen) => void; bill: ExtractedBill | null; institution: string | null; visitDate: string | null }

const money = (currency: string, amount: number | null) => amount === null ? 'Not identified' : new Intl.NumberFormat('en-SG', { style: 'currency', currency: currency === 'SGD' ? 'SGD' : currency, maximumFractionDigits: 2 }).format(amount)

export default function BillScreen({ onNavigate, bill, institution, visitDate }: Props) {
  return <div className="min-h-full bg-neutral-50 flex flex-col">
    <TopBar title="Bill Explained" subtitle={[institution, visitDate].filter(Boolean).join(' · ') || 'Processed document'} onBack={() => onNavigate('results')} />
    <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3"><p className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Bill Summary</p><div className="w-9 h-9 rounded-xl bg-orange-50 grid place-items-center"><FileText className="w-4 h-4 text-orange-500" /></div></div>
        <Divider className="mb-4" />
        <div className="flex justify-between items-center"><span className="text-base font-bold text-neutral-900">Printed total</span><span className="text-2xl font-bold text-orange-500">{bill ? money(bill.currency, bill.totalAmount) : 'Unavailable'}</span></div>
        <p className="text-xs text-neutral-400 mt-2">Subsidy deductions and final payable amounts are shown only when explicitly returned by the document API.</p>
      </Card>

      <div><p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Line-by-line breakdown</p>
        {!bill || bill.items.length === 0 ? <Card className="p-6 text-center"><FileText className="w-10 h-10 text-neutral-300 mx-auto mb-3" /><p className="font-semibold text-neutral-600">No bill line items were extracted</p></Card> : <div className="flex flex-col gap-2">{bill.items.map((item, index) => <motion.div key={`${item.description}-${index}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.06 }}><Card className="px-4 py-3.5"><div className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-teal-500 mt-0.5" /><div className="flex-1"><p className="text-base font-semibold text-neutral-900">{item.description}</p><p className="text-xs text-neutral-400">Extracted from document</p></div><span className="text-base font-bold text-neutral-700">{money(bill.currency, item.amount)}</span></div></Card></motion.div>)}</div>}
      </div>
      <Button variant="ghost" size="md" fullWidth onClick={() => onNavigate('results')}>Back to results</Button>
    </div>
  </div>
}

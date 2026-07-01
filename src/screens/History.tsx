import { BarChart2, ScanLine } from 'lucide-react'
import { Button, TopBar } from '../components/ui'
import { useLang } from '../hooks/i18n'
import type { Screen } from '../types'

interface Props { onNavigate: (screen: Screen) => void }
const MONTHS = ['All', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function History({ onNavigate }: Props) {
  const { language } = useLang()
  const title = language === 'zh' ? '扫描历史' : language === 'ms' ? 'Sejarah Imbasan' : language === 'ta' ? 'ஸ்கேன் வரலாறு' : 'Scan History'
  return <div className="min-h-full bg-neutral-50 flex flex-col">
    <TopBar title={title} subtitle="0 documents scanned" />
    <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">{[
        { label: 'Total scans', value: '0', color: 'text-navy-500' },
        { label: 'Avg. paid', value: '—', color: 'text-teal-700' },
        { label: 'Total saved', value: '—', color: 'text-success-500' },
      ].map(stat => <div key={stat.label} className="bg-white rounded-xl border border-neutral-200 shadow-card p-3 text-center"><p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p><p className="text-xs text-neutral-400 mt-0.5">{stat.label}</p></div>)}</div>
      <div className="flex gap-2 overflow-x-auto pb-1">{MONTHS.map((month, index) => <span key={month} className={`flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-semibold border ${index === 0 ? 'bg-teal-700 text-white border-teal-700 shadow-btn-teal' : 'bg-white text-neutral-400 border-neutral-200'}`}>{month}</span>)}</div>
      <div className="flex-1 flex flex-col items-center justify-center py-14 text-center"><BarChart2 className="w-12 h-12 text-neutral-300 mb-3" /><p className="text-base font-semibold text-neutral-500">No scans yet</p><p className="text-sm text-neutral-400 mt-1 max-w-xs">This version does not persist uploaded documents or results.</p><Button variant="primary" size="md" onClick={() => onNavigate('camera')} className="gap-2 mt-5"><ScanLine className="w-4 h-4" />Scan a document</Button></div>
    </div>
  </div>
}

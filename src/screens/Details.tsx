import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Phone, ChevronRight } from 'lucide-react'
import { Button, Card, Badge, TopBar, Divider } from '../components/ui'
import { MOCK_RESULT } from '../lib/utils'
import type { Screen, SubsidyCard } from '../types'

interface Props { onNavigate: (s: Screen) => void; subsidy: SubsidyCard | null }

const badgeVariant = (c: SubsidyCard['badgeColor']) =>
  c === 'orange' ? 'orange' as const : c === 'teal' ? 'teal' as const : c === 'navy' ? 'navy' as const : 'gray' as const

export default function Details({ onNavigate, subsidy }: Props) {
  const s = subsidy ?? MOCK_RESULT.subsidies[0]

  return (
    <div className="min-h-full bg-neutral-50 flex flex-col">
      <TopBar title={s.name} subtitle={s.chineseName} onBack={() => onNavigate('results')} />

      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">

        {/* What is this subsidy */}
        <Card className="p-5">
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">What is this?</p>
          <p className="text-base text-neutral-700 leading-relaxed">{s.description}</p>
        </Card>

        {/* How much you save */}
        <Card className="p-5">
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">How much you save</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-success-50 border border-success-400/20 rounded-xl p-4 text-center">
              <p className="text-xs text-success-500 font-semibold uppercase mb-1">Subsidy covers</p>
              <p className="text-3xl font-bold text-success-500">${s.saves}</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
              <p className="text-xs text-orange-500 font-semibold uppercase mb-1">You pay</p>
              <p className="text-3xl font-bold text-orange-500">${s.outOfPocket}</p>
            </div>
          </div>
        </Card>

        {/* Benefits */}
        <Card className="p-5">
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Your benefits</p>
          <div className="flex flex-col gap-3">
            {s.benefits.map((b, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="flex items-start gap-3"
              >
                <CheckCircle2 className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                <p className="text-base text-neutral-700 leading-snug">{b}</p>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Qualification checklist */}
        <Card className="p-5">
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Eligibility status</p>
          <div className="flex items-center gap-3 mb-3">
            {s.eligible
              ? <><CheckCircle2 className="w-6 h-6 text-success-500" /><p className="text-base font-bold text-success-500">You qualify for this subsidy</p></>
              : <><XCircle className="w-6 h-6 text-danger-500" /><p className="text-base font-bold text-danger-500">Not applicable for your profile</p></>
            }
          </div>
          <Badge variant={badgeVariant(s.badgeColor)} className="text-sm py-1.5 px-3">
            {s.eligible ? '✓ Detected from your document' : '✗ Criteria not met'}
          </Badge>
        </Card>

        {/* How to use */}
        <Card className="p-5">
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">How to use this benefit</p>
          <p className="text-base text-neutral-700 leading-relaxed">{s.howToUse}</p>
        </Card>

        {/* MSO Helpline */}
        <div className="bg-navy-50 border border-navy-100 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-navy-500 flex items-center justify-center flex-shrink-0">
            <Phone className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-navy-500">MOH SilverLine Helpline</p>
            <p className="text-sm text-neutral-600">1800-650-6060 · Mon–Fri 8am–8pm</p>
          </div>
          <a href="tel:18006506060">
            <ChevronRight className="w-5 h-5 text-neutral-400" />
          </a>
        </div>

        <Button variant="secondary" size="md" fullWidth onClick={() => onNavigate('results')}>
          Back to results
        </Button>
      </div>
    </div>
  )
}

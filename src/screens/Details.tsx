import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Phone, ChevronRight } from 'lucide-react'
import { Button, Card, Badge, TopBar } from '../components/ui'
import { useLang, T } from '../hooks/i18n'
import type { Screen, SubsidyCard } from '../types'

interface Props { onNavigate: (s: Screen) => void; subsidy: SubsidyCard | null }

const badgeVariant = (c: SubsidyCard['badgeColor']) =>
  c === 'orange' ? 'orange' as const : c === 'teal' ? 'teal' as const : c === 'navy' ? 'navy' as const : 'gray' as const

export default function Details({ onNavigate, subsidy }: Props) {
  const { language } = useLang()
  const t = T[language]
  const s = subsidy

  if (!s) {
    return (
      <div className="min-h-full bg-neutral-50 flex flex-col">
        <TopBar title={t.subsidy_details} onBack={() => onNavigate('results')} />
        <div className="flex-1 grid place-items-center p-6 text-center">
          <div>
            <p className="font-bold text-neutral-900 mb-2">{t.no_subsidy_selected}</p>
            <Button variant="primary" onClick={() => onNavigate('results')}>{t.back_results}</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-neutral-50 flex flex-col">
      <TopBar title={s.name} subtitle={s.chineseName} onBack={() => onNavigate('results')} />

      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">

        {/* What is this subsidy */}
        <Card className="p-5">
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">{t.what_is_this}</p>
          <p className="text-base text-neutral-700 leading-relaxed">{s.description}</p>
        </Card>

        {/* How much you save */}
        <Card className="p-5">
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">{t.how_much_save}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-success-50 border border-success-400/20 rounded-xl p-4 text-center">
              <p className="text-xs text-success-500 font-semibold uppercase mb-1">{t.subsidy_covers}</p>
              <p className="text-3xl font-bold text-success-500">{s.saves}%</p>
            </div>
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-center">
              <p className="text-xs text-teal-700 font-semibold uppercase mb-1">{t.you_pay}</p>
              <p className="text-3xl font-bold text-teal-700">{s.outOfPocket}%</p>
            </div>
          </div>
        </Card>

        {/* Benefits */}
        <Card className="p-5">
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">{t.your_benefits}</p>
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
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">{t.eligibility_status}</p>
          <div className="flex items-center gap-3 mb-3">
            {s.eligible
              ? <><CheckCircle2 className="w-6 h-6 text-success-500" /><p className="text-base font-bold text-success-500">{t.you_qualify}</p></>
              : <><XCircle className="w-6 h-6 text-danger-500" /><p className="text-base font-bold text-danger-500">{t.not_applicable_profile}</p></>
            }
          </div>
          <Badge variant={badgeVariant(s.badgeColor)} className="text-sm py-1.5 px-3">
            {s.eligible ? t.detected_from_doc : t.criteria_not_met}
          </Badge>
        </Card>

        {/* How to use */}
        <Card className="p-5">
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">{t.how_to_use_benefit}</p>
          <p className="text-base text-neutral-700 leading-relaxed">{s.howToUse}</p>
        </Card>

        {/* MSO Helpline */}
        <div className="bg-navy-50 border border-navy-100 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-navy-500 flex items-center justify-center flex-shrink-0">
            <Phone className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-navy-500">{t.helpline_name}</p>
            <p className="text-sm text-neutral-600">{t.helpline_hours}</p>
          </div>
          <a href="tel:18006506060">
            <ChevronRight className="w-5 h-5 text-neutral-400" />
          </a>
        </div>

        <Button variant="secondary" size="md" fullWidth onClick={() => onNavigate('results')}>
          {t.back_results}
        </Button>
      </div>
    </div>
  )
}

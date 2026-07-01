import { motion } from 'framer-motion'
import {
  AlertTriangle,
  BadgeCheck,
  ChevronRight,
  FileText,
  Pill,
  Printer,
  Share2,
} from 'lucide-react'

import TTSButton from '../components/TTSButton'
import { Badge, Button, Card, Divider, TopBar } from '../components/ui'
import { useLang } from '../hooks/i18n'
import { useTTS } from '../hooks/useTTS'
import type {
  ProcessDocumentResponse,
  Screen,
  SubsidyCard,
  SubsidyResult,
} from '../types'

interface Props {
  onNavigate: (screen: Screen) => void
  onSelectSubsidy: (subsidy: SubsidyCard) => void
  apiResult?: ProcessDocumentResponse | null
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
}

const SUBSIDY_STYLES = [
  ['pioneer', '🎖️', 'orange'],
  ['merdeka', '🏅', 'gray'],
  ['chas', '🏷️', 'navy'],
  ['medisave', '💳', 'teal'],
  ['cdmp', '🏥', 'teal'],
  ['medishield', '🛡️', 'teal'],
  ['medifund', '💰', 'orange'],
] as const

function toSubsidyCard(result: SubsidyResult, index: number): SubsidyCard {
  const lowerName = result.schemeName.toLowerCase()
  const style = SUBSIDY_STYLES.find(([key]) => lowerName.includes(key))

  return {
    id: `subsidy-${index}`,
    name: result.schemeName,
    chineseName:
      result.translations?.['cmn-Hans-CN']?.schemeName ?? '',
    eligible: result.estimatedCoveragePercent > 0,
    saves: result.estimatedCoveragePercent,
    outOfPocket: Math.max(0, 100 - result.estimatedCoveragePercent),
    icon: style?.[1] ?? '📋',
    badgeColor: style?.[2] ?? 'teal',
    description: result.coverageDescription,
    benefits: result.eligibilityConditions
      .split(/[.;]\s*/)
      .filter(Boolean),
    howToUse: result.coverageDescription,
  }
}

function badgeVariant(color: SubsidyCard['badgeColor']) {
  if (color === 'orange') return 'orange' as const
  if (color === 'navy') return 'navy' as const
  if (color === 'gray') return 'gray' as const
  return 'teal' as const
}

function formatMoney(currency: string, value: number | null) {
  if (value === null) return '—'

  const upperCurrency = currency.toUpperCase()
  const currencyCode = /^[A-Z]{3}$/.test(upperCurrency)
    ? upperCurrency
    : 'SGD'

  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(value)
}

function EmptyResults({ onNavigate }: Pick<Props, 'onNavigate'>) {
  return (
    <div className="min-h-full bg-neutral-50 flex flex-col">
      <TopBar title="Your Results" onBack={() => onNavigate('home')} />
      <div className="flex-1 grid place-items-center p-6 text-center">
        <div>
          <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto mb-3" />
          <p className="font-bold">No processed document</p>
          <Button
            variant="primary"
            className="mt-4"
            onClick={() => onNavigate('home')}
          >
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function Results({
  onNavigate,
  onSelectSubsidy,
  apiResult,
}: Props) {
  const { language } = useLang()
  const { toggle, speaking } = useTTS(language)

  if (!apiResult) {
    return <EmptyResults onNavigate={onNavigate} />
  }

  const { extracted, subsidies, message } = apiResult
  const subsidyCards = subsidies.map(toSubsidyCard)
  const billTotal = extracted.bill?.totalAmount ?? null
  const currency = extracted.bill?.currency ?? 'SGD'
  const hasAppliedSubsidy = subsidyCards.some((card) => card.eligible)
  const payableAmount = hasAppliedSubsidy ? null : billTotal
  const savedAmount = !hasAppliedSubsidy && billTotal !== null ? 0 : null

  const visitDate = extracted.visitDate
    ? new Intl.DateTimeFormat('en-SG', { dateStyle: 'medium' }).format(
        new Date(`${extracted.visitDate}T00:00:00`),
      )
    : 'Date not identified'

  const spokenText = [
    `Document results for ${extracted.institution ?? 'healthcare provider'}.`,
    `${subsidyCards.length} subsidy matches`,
    `and ${extracted.prescriptions.length} medications were extracted.`,
  ].join(' ')

  const summaryItems = [
    {
      label: 'Original bill',
      value: formatMoney(currency, billTotal),
      color: 'text-neutral-700',
    },
    {
      label: 'Total saved',
      value: formatMoney(currency, savedAmount),
      color: 'text-success-500',
    },
    {
      label: 'Before MediSave',
      value: formatMoney(currency, payableAmount),
      color: 'text-orange-500',
    },
  ]

  return (
    <div className="min-h-full bg-neutral-50 flex flex-col">
      <TopBar
        title="Your Results"
        subtitle={`${extracted.institution ?? 'Healthcare provider'} · ${visitDate}`}
        onBack={() => onNavigate('confirm')}
        right={
          <Badge variant="success" className="gap-1">
            <BadgeCheck className="w-3.5 h-3.5" />
            Processed
          </Badge>
        }
      />

      <motion.div
        className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={fadeUp}>
          <Card className="p-5 text-center bg-gradient-to-b from-navy-50 to-white border-navy-100">
            <div className="flex justify-end mb-2">
              <TTSButton
                text={spokenText}
                speaking={speaking}
                onToggle={toggle}
                size="sm"
              />
            </div>

            <p className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              You pay
            </p>
            <p className="text-[52px] font-bold text-orange-500 leading-none mb-2">
              {formatMoney(currency, payableAmount)}
            </p>
            <p className="text-sm text-neutral-500 mb-4">
              {!hasAppliedSubsidy && billTotal !== null
                ? 'No matching subsidies were applied'
                : 'Final payable amount requires provider confirmation'}
            </p>

            <Divider className="mb-4" />

            <div className="grid grid-cols-3 gap-1 text-center">
              {summaryItems.map((item) => (
                <div key={item.label}>
                  <p className={`text-xl font-bold ${item.color}`}>
                    {item.value}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
          <button
            onClick={() => extracted.bill && onNavigate('bill')}
            disabled={!extracted.bill}
            className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-left hover:bg-orange-100 active:scale-[0.97] transition-all shadow-card disabled:opacity-55"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-500 grid place-items-center mb-3">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-bold text-orange-700">
              Bill Explained
            </p>
            <p className="text-xs text-orange-500 mt-0.5">
              {extracted.bill
                ? 'Every charge explained'
                : 'No bill data detected'}
            </p>
          </button>

          <button
            onClick={() =>
              extracted.prescriptions.length && onNavigate('medications')
            }
            disabled={!extracted.prescriptions.length}
            className="bg-teal-50 border border-teal-200 rounded-2xl p-4 text-left hover:bg-teal-100 active:scale-[0.97] transition-all shadow-card disabled:opacity-55"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-500 grid place-items-center mb-3">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-bold text-teal-700">
              Your Medications
            </p>
            <p className="text-xs text-teal-500 mt-0.5">
              {extracted.prescriptions.length
                ? 'Instructions & schedule'
                : 'No medications detected'}
            </p>
          </button>
        </motion.div>

        <motion.div variants={fadeUp}>
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">
            Applied subsidies
          </p>

          <div className="flex flex-col gap-3">
            {subsidyCards.length === 0 ? (
              <Card className="p-5 text-center text-neutral-500">
                No matching subsidy schemes were returned.
              </Card>
            ) : (
              subsidyCards.map((card) => (
                <Card
                  key={card.id}
                  className="p-4"
                  onClick={() => {
                    onSelectSubsidy(card)
                    onNavigate('details')
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{card.icon}</span>

                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-neutral-900">
                        {card.name}
                      </p>
                      {card.chineseName && (
                        <p className="text-sm text-neutral-400 mb-2">
                          {card.chineseName}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant={badgeVariant(card.badgeColor)}>
                          ✓ Matched
                        </Badge>
                        <span className="text-sm font-semibold text-success-500">
                          Up to {card.saves}% coverage
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-bold text-orange-500">
                        {card.saves}%
                      </p>
                      <p className="text-xs text-neutral-400">coverage</p>
                      <ChevronRight className="w-4 h-4 text-neutral-300 ml-auto mt-1" />
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex gap-3"
        >
          <span className="text-xl">💳</span>
          <div>
            <p className="text-sm font-bold text-teal-700">
              Payable amount requires confirmation
            </p>
            <p className="text-sm text-teal-600 mt-0.5">
              Coverage percentages are estimates. Confirm actual subsidies and
              MediSave usage with the healthcare provider.
            </p>
          </div>
        </motion.div>

        {message && (
          <motion.div
            variants={fadeUp}
            className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-sm text-orange-700"
          >
            {message}
          </motion.div>
        )}

        <motion.div variants={fadeUp} className="flex flex-col gap-3">
          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={() => window.print()}
            className="gap-2"
          >
            <Printer className="w-5 h-5" />
            Print Results
          </Button>
          <Button
            variant="secondary"
            size="md"
            fullWidth
            disabled
            className="gap-2"
          >
            <Share2 className="w-5 h-5" />
            Share with Doctor
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}

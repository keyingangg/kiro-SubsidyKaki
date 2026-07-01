import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronDown } from 'lucide-react'
import { Card, TopBar } from '../components/ui'
import { useLang, T } from '../hooks/i18n'
import type { Screen } from '../types'

interface Props { onNavigate: (s: Screen) => void }

export default function Help({}: Props) {
  const { language } = useLang()
  const t = T[language]

  const SECTIONS = [
    {
      title: t.faq_s1_title,
      faqs: [
        { q: t.faq_s1_q1, a: t.faq_s1_a1 },
        { q: t.faq_s1_q2, a: t.faq_s1_a2 },
        { q: t.faq_s1_q3, a: t.faq_s1_a3 },
      ],
    },
    {
      title: t.faq_s2_title,
      faqs: [
        { q: t.faq_s2_q1, a: t.faq_s2_a1 },
        { q: t.faq_s2_q2, a: t.faq_s2_a2 },
        { q: t.faq_s2_q3, a: t.faq_s2_a3 },
        { q: t.faq_s2_q4, a: t.faq_s2_a4 },
      ],
    },
    {
      title: t.faq_s3_title,
      faqs: [
        { q: t.faq_s3_q1, a: t.faq_s3_a1 },
        { q: t.faq_s3_q2, a: t.faq_s3_a2 },
        { q: t.faq_s3_q3, a: t.faq_s3_a3 },
      ],
    },
    {
      title: t.faq_s4_title,
      faqs: [
        { q: t.faq_s4_q1, a: t.faq_s4_a1 },
        { q: t.faq_s4_q2, a: t.faq_s4_a2 },
      ],
    },
  ]

  const [search, setSearch]   = useState('')
  const [openKey, setOpenKey] = useState<string | null>(null)

  const filtered = SECTIONS.map(s => ({
    ...s,
    faqs: s.faqs.filter(f => !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())),
  })).filter(s => s.faqs.length > 0)

  return (
    <div className="min-h-full bg-neutral-50 flex flex-col">
      <TopBar title={t.help_title} subtitle={t.help_sub} />

      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.search_placeholder}
            className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-neutral-300 bg-white text-base text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-4 focus:ring-teal-500/30 focus:border-teal-700"
            aria-label={t.search_placeholder}
          />
        </div>

        {/* FAQ accordion */}
        {filtered.map(section => (
          <div key={section.title}>
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">{section.title}</p>
            <div className="flex flex-col gap-2">
              {section.faqs.map((faq, idx) => {
                const key = `${section.title}-${idx}`
                const isOpen = openKey === key
                return (
                  <Card key={key} className="overflow-hidden">
                    <button className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-neutral-50 transition-colors"
                      onClick={() => setOpenKey(prev => prev === key ? null : key)} aria-expanded={isOpen}>
                      <span className="text-base font-semibold text-neutral-900 leading-snug pr-2">{faq.q}</span>
                      <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }} className="flex-shrink-0">
                        <ChevronDown className="w-5 h-5 text-neutral-400" />
                      </motion.div>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28 }} className="overflow-hidden">
                          <div className="px-4 pb-4 border-t border-neutral-100 pt-3">
                            <p className="text-base text-neutral-600 leading-relaxed">{faq.a}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}

      </div>
    </div>
  )
}

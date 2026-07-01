import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronDown, ThumbsUp, ThumbsDown } from 'lucide-react'
import { Card, TopBar } from '../components/ui'
import type { Screen } from '../types'

interface Props { onNavigate: (s: Screen) => void }

const SECTIONS = [
  {
    title: 'Getting Started',
    faqs: [
      { q: 'How do I scan my medical document?', a: 'Tap "Scan Medical Document" on the home screen. Point your phone camera at the document, ensure it fits within the frame, and tap the capture button. The app will automatically process your document.' },
      { q: 'What documents can I scan?', a: 'You can scan polyclinic invoices, hospital bills, discharge summaries, prescription slips, specialist referral letters, and any other medical documents showing treatment costs or diagnoses.' },
      { q: 'Does it work offline?', a: 'No. An internet connection is required for document processing, and this version does not save scan history.' },
    ],
  },
  {
    title: 'Subsidies & Benefits',
    faqs: [
      { q: 'What is CHAS?', a: 'CHAS provides healthcare subsidies at participating clinics. Eligibility and benefit limits can change, so verify the latest details with official Singapore healthcare sources.' },
      { q: 'Who qualifies for Pioneer Generation?', a: 'Eligibility depends on citizenship and age criteria set by the Singapore Government. Treat this app’s matches as estimates and verify them through official channels.' },
      { q: 'What is the Merdeka Generation package?', a: 'It is a Singapore support package for eligible older citizens. Benefits and eligibility should be verified through official channels.' },
      { q: 'Can I use MediSave at polyclinics?', a: 'MediSave may be usable for eligible outpatient treatments. Ask the provider to confirm whether your specific treatment and account meet the current rules.' },
    ],
  },
  {
    title: 'Troubleshooting',
    faqs: [
      { q: "Why couldn't the app read my document?", a: 'This usually happens when the document is blurry, in poor lighting, or at an angle. Try placing the document flat on a light surface, ensuring good lighting with no shadows, and capturing the full document within the frame.' },
      { q: 'My subsidy result seems wrong. What should I do?', a: 'Our system estimates based on document content. For the most accurate information, contact the polyclinic or hospital billing counter directly, or call the MOH SilverLine helpline at 1800-650-6060.' },
      { q: 'I am Pioneer Generation but it shows "not applicable". Why?', a: 'This may happen if your Pioneer card number is not visible on the document scanned, or if the document type doesn\'t include relevant fields. Try scanning your Pioneer card separately or contact our support team.' },
    ],
  },
  {
    title: 'Contact & Feedback',
    faqs: [
      { q: 'How do I get more help?', a: 'This prototype does not provide live support. For a definitive eligibility or billing answer, contact your healthcare provider or use an official Singapore Government healthcare channel.' },
      { q: 'How do I give feedback on the app?', a: 'Use the thumbs up or down buttons below each answer during this session.' },
    ],
  },
]

export default function Help({}: Props) {
  const [search, setSearch]     = useState('')
  const [openKey, setOpenKey]   = useState<string | null>(null)
  const [rated, setRated]       = useState<Record<string, 'up' | 'down'>>({})

  const filtered = SECTIONS.map(s => ({
    ...s,
    faqs: s.faqs.filter(f => !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())),
  })).filter(s => s.faqs.length > 0)

  return (
    <div className="min-h-full bg-neutral-50 flex flex-col">
      <TopBar title="Help & Support" subtitle="FAQs and contact options" />

      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search FAQs…"
            className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-neutral-300 bg-white text-base text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-4 focus:ring-orange-400/30 focus:border-orange-400"
            aria-label="Search frequently asked questions"
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
                            <div className="flex items-center gap-3 mt-4">
                              <p className="text-sm text-neutral-400">Was this helpful?</p>
                              <button onClick={() => setRated(p => ({ ...p, [key]: 'up' }))}
                                className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-full border transition-colors ${rated[key] === 'up' ? 'bg-success-50 border-success-400/30 text-success-500' : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50'}`}>
                                <ThumbsUp className="w-3.5 h-3.5" /> Yes
                              </button>
                              <button onClick={() => setRated(p => ({ ...p, [key]: 'down' }))}
                                className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-full border transition-colors ${rated[key] === 'down' ? 'bg-danger-50 border-danger-400/30 text-danger-500' : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50'}`}>
                                <ThumbsDown className="w-3.5 h-3.5" /> No
                              </button>
                            </div>
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

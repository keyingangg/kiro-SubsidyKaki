import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, BarChart2, ChevronRight } from 'lucide-react'
import { TopBar } from '../components/ui'
import { MOCK_HISTORY } from '../lib/utils'
import { useLang } from '../hooks/i18n'
import type { Screen, HistoryItem } from '../types'

interface Props { onNavigate: (s: Screen) => void }

const MONTHS = ['All', 'Jan', 'Feb', 'Oct', 'Nov', 'Dec']

/* Confirmation modal rendered as normal-flow overlay — no fixed positioning */
function DeleteConfirmModal({ item, onConfirm, onCancel }: { item: HistoryItem; onConfirm: () => void; onCancel: () => void }) {
  const { language } = useLang()
  return (
    <div
      style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }}
        transition={{ duration: 0.22 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl w-full shadow-2xl overflow-hidden"
      >
        {/* Icon + text */}
        <div className="px-6 pt-7 pb-5 text-center border-b border-neutral-100">
          <div className="w-16 h-16 rounded-2xl bg-danger-50 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-danger-500" />
          </div>
          <p className="text-xl font-bold text-neutral-900 mb-1">
            {language === 'zh' ? '删除此扫描记录？' : language === 'ms' ? 'Padam imbasan ini?' : language === 'ta' ? 'இந்த ஸ்கேனை நீக்கவா?' : 'Delete this scan?'}
          </p>
          <p className="text-base text-neutral-600 leading-snug">{item.clinicName}</p>
          <p className="text-sm text-neutral-400 mt-0.5">{item.date} at {item.time}</p>
          <p className="text-sm text-neutral-400 mt-2">
            {language === 'zh' ? '此操作无法撤销。' : language === 'ms' ? 'Tindakan ini tidak boleh dibatalkan.' : language === 'ta' ? 'இதை மீட்டெடுக்க முடியாது.' : 'This cannot be undone.'}
          </p>
        </div>

        {/* Two large buttons, full width */}
        <div className="divide-y divide-neutral-100">
          <button
            onClick={onConfirm}
            style={{ minHeight: 64 }}
            className="w-full flex items-center justify-center text-lg font-bold text-danger-500 bg-danger-50 hover:bg-danger-100 active:bg-danger-200 transition-colors"
          >
            <Trash2 className="w-5 h-5 mr-2" />
            {language === 'zh' ? '是，删除记录' : language === 'ms' ? 'Ya, Padam' : language === 'ta' ? 'ஆம், நீக்கு' : 'Yes, delete this scan'}
          </button>
          <button
            onClick={onCancel}
            style={{ minHeight: 64 }}
            className="w-full flex items-center justify-center text-lg font-semibold text-neutral-600 hover:bg-neutral-50 active:bg-neutral-100 transition-colors"
          >
            {language === 'zh' ? '取消，保留记录' : language === 'ms' ? 'Batal, Simpan' : language === 'ta' ? 'இல்லை, வைத்திரு' : 'No, keep it'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function History({ onNavigate }: Props) {
  const { language } = useLang()
  const [filter, setFilter]         = useState('All')
  const [items, setItems]           = useState(MOCK_HISTORY)
  const [pendingDelete, setPending] = useState<HistoryItem | null>(null)

  const filtered   = filter === 'All' ? items : items.filter(i => i.date.includes(filter))
  const totalScans = items.length
  const avgOop     = items.length ? Math.round(items.reduce((a, i) => a + i.outOfPocket, 0) / items.length) : 0
  const totalSaved = items.reduce((a, i) => a + i.totalSaved, 0)

  const confirmDelete = () => {
    if (pendingDelete) {
      setItems(prev => prev.filter(i => i.id !== pendingDelete.id))
      setPending(null)
    }
  }

  const lbl = {
    title:      language === 'zh' ? '扫描历史' : language === 'ms' ? 'Sejarah Imbasan' : language === 'ta' ? 'ஸ்கேன் வரலாறு' : 'Scan History',
    scanned:    language === 'zh' ? '份文件' : language === 'ms' ? 'dokumen' : language === 'ta' ? 'ஆவணங்கள்' : 'documents scanned',
    totalScans: language === 'zh' ? '总扫描' : language === 'ms' ? 'Imbasan' : language === 'ta' ? 'ஸ்கேன்கள்' : 'Total scans',
    avgOop:     language === 'zh' ? '平均自付' : language === 'ms' ? 'Purata bayar' : language === 'ta' ? 'சராசரி செலவு' : 'Avg. paid',
    totalSaved: language === 'zh' ? '总节省' : language === 'ms' ? 'Jimat' : language === 'ta' ? 'சேமிப்பு' : 'Total saved',
    paid:       language === 'zh' ? '已付' : language === 'ms' ? 'dibayar' : language === 'ta' ? 'செலுத்தியது' : 'paid',
    saved:      language === 'zh' ? '节省' : language === 'ms' ? 'Jimat' : language === 'ta' ? 'சேமிப்பு' : 'Saved',
    delete:     language === 'zh' ? '删除此记录' : language === 'ms' ? 'Padam Rekod Ini' : language === 'ta' ? 'இந்த பதிவை நீக்கு' : 'Delete this record',
    viewDetail: language === 'zh' ? '查看详情' : language === 'ms' ? 'Lihat butiran' : language === 'ta' ? 'விவரங்கள்' : 'Tap to view details',
    empty:      language === 'zh' ? '此月份无扫描记录' : language === 'ms' ? 'Tiada imbasan bulan ini' : language === 'ta' ? 'இந்த மாதம் ஸ்கேன் இல்லை' : 'No scans this month',
    emptyHint:  language === 'zh' ? '请选择其他月份' : language === 'ms' ? 'Cuba pilih bulan lain' : language === 'ta' ? 'வேறு மாதம் தேர்வு செய்யுங்கள்' : 'Try selecting a different month',
  }

  return (
    /* relative so the delete modal overlays correctly within the phone shell */
    <div className="min-h-full bg-neutral-50 flex flex-col relative">
      <TopBar title={lbl.title} subtitle={`${totalScans} ${lbl.scanned}`} />

      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: lbl.totalScans, val: String(totalScans), color: 'text-navy-500' },
            { label: lbl.avgOop,     val: `$${avgOop}`,       color: 'text-orange-500' },
            { label: lbl.totalSaved, val: `$${totalSaved}`,   color: 'text-success-500' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-neutral-200 shadow-card p-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
              <p className="text-xs text-neutral-400 mt-0.5 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Month filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {MONTHS.map(m => (
            <button
              key={m}
              onClick={() => setFilter(m)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-semibold transition-all border ${
                filter === m
                  ? 'bg-orange-500 text-white border-orange-500 shadow-btn-orange'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
              }`}
            >{m}</button>
          ))}
        </div>

        {/* History list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart2 className="w-12 h-12 text-neutral-300 mb-3" />
            <p className="text-base font-semibold text-neutral-500">{lbl.empty}</p>
            <p className="text-sm text-neutral-400 mt-1">{lbl.emptyHint}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {filtered.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scaleY: 0.85, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.28 }}
                >
                  {/* Card: two sections — view area + delete strip */}
                  <div className="bg-white rounded-2xl border border-neutral-200 shadow-card overflow-hidden">

                    {/* Top: tap to view results */}
                    <button
                      className="w-full px-4 pt-4 pb-3 text-left hover:bg-neutral-50 active:bg-neutral-100 transition-colors"
                      onClick={() => onNavigate('results')}
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* Left: clinic info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-bold text-neutral-900 leading-snug">{item.clinicName}</p>
                          <p className="text-sm text-neutral-400 mt-0.5">{item.documentType}</p>
                          <p className="text-xs text-neutral-300 mt-1.5">{item.date} · {item.time}</p>
                        </div>
                        {/* Right: cost */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-2xl font-bold text-orange-500">${item.outOfPocket}</p>
                          <p className="text-xs text-neutral-400 mt-0.5">{lbl.paid}</p>
                          <p className="text-sm font-bold text-success-500 mt-1">{lbl.saved} ${item.totalSaved}</p>
                        </div>
                      </div>
                      {/* View hint */}
                      <div className="flex justify-end mt-2.5">
                        <span className="text-xs text-neutral-300 flex items-center gap-0.5">
                          {lbl.viewDetail} <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </button>

                    {/* Bottom: full-width delete button — 56px tall, clearly labelled */}
                    <button
                      onClick={() => setPending(item)}
                      style={{ minHeight: 56 }}
                      className="w-full flex items-center justify-center gap-2.5 border-t-2 border-neutral-100 bg-danger-50 hover:bg-danger-100 active:bg-danger-200 transition-colors"
                      aria-label={`Delete scan from ${item.clinicName} on ${item.date}`}
                    >
                      <Trash2 className="w-5 h-5 text-danger-500" />
                      <span className="text-base font-bold text-danger-500">{lbl.delete}</span>
                    </button>

                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {pendingDelete && (
          <DeleteConfirmModal
            item={pendingDelete}
            onConfirm={confirmDelete}
            onCancel={() => setPending(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

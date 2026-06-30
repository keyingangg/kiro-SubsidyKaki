import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Home as HomeIcon, History, HelpCircle, Settings as SettingsIcon } from 'lucide-react'

import { LangProvider, useLang, T } from './hooks/i18n'

import HomeScreen        from './screens/Home'
import CameraScreen      from './screens/Camera'
import ConfirmScreen     from './screens/Confirm'
import ProcessingScreen  from './screens/Processing'
import ResultsScreen     from './screens/Results'
import DetailsScreen     from './screens/Details'
import BillScreen        from './screens/BillScreen'
import MedicationsScreen from './screens/MedicationsScreen'
import HistoryScreen     from './screens/History'
import HelpScreen        from './screens/Help'
import SettingsScreen    from './screens/Settings'
import ErrorScreen       from './screens/ErrorScreen'

import type { Screen, SubsidyCard } from './types'

const SHOW_NAV: Screen[] = ['home', 'history', 'help', 'settings']

const SCREEN_ORDER: Screen[] = [
  'home', 'camera', 'confirm', 'processing', 'results', 'bill', 'medications',
  'details', 'history', 'help', 'settings', 'error',
]

const ease = [0.25, 0.1, 0.25, 1] as [number, number, number, number]

const pageVariants = {
  initial: (dir: number) => ({ opacity: 0, x: dir >= 0 ? 32 : -32 }),
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease } },
  exit:    (dir: number) => ({ opacity: 0, x: dir >= 0 ? -32 : 32, transition: { duration: 0.25, ease } }),
}

function AppInner() {
  const [screen, setScreen]           = useState<Screen>('home')
  const [prevScreen, setPrev]         = useState<Screen>('home')
  const [file, setFile]               = useState<File | null>(null)
  const [selectedSubsidy, setSubsidy] = useState<SubsidyCard | null>(null)
  const { language } = useLang()

  const navigate = useCallback((next: Screen) => {
    setPrev(screen)
    setScreen(next)
  }, [screen])

  const dir = SCREEN_ORDER.indexOf(screen) >= SCREEN_ORDER.indexOf(prevScreen) ? 1 : -1
  const showNav = SHOW_NAV.includes(screen)

  const NAV_ITEMS = [
    { id: 'home'     as Screen, label: language === 'zh' ? '主页' : language === 'ms' ? 'Utama' : language === 'ta' ? 'முகப்பு' : 'Home',     Icon: HomeIcon },
    { id: 'history'  as Screen, label: language === 'zh' ? '历史' : language === 'ms' ? 'Sejarah' : language === 'ta' ? 'வரலாறு' : 'History', Icon: History },
    { id: 'help'     as Screen, label: language === 'zh' ? '帮助' : language === 'ms' ? 'Bantuan' : language === 'ta' ? 'உதவி' : 'Help',     Icon: HelpCircle },
    { id: 'settings' as Screen, label: language === 'zh' ? '设置' : language === 'ms' ? 'Tetapan' : language === 'ta' ? 'அமைப்பு' : 'Settings', Icon: SettingsIcon },
  ]

  const renderScreen = () => {
    switch (screen) {
      case 'home':        return <HomeScreen onNavigate={navigate} />
      case 'camera':      return <CameraScreen onNavigate={navigate} onFileReady={setFile} />
      case 'confirm':     return <ConfirmScreen onNavigate={navigate} file={file} />
      case 'processing':  return <ProcessingScreen onNavigate={navigate} />
      case 'results':     return <ResultsScreen onNavigate={navigate} onSelectSubsidy={setSubsidy} />
      case 'bill':        return <BillScreen onNavigate={navigate} />
      case 'medications': return <MedicationsScreen onNavigate={navigate} />
      case 'details':     return <DetailsScreen onNavigate={navigate} subsidy={selectedSubsidy} />
      case 'history':     return <HistoryScreen onNavigate={navigate} />
      case 'help':        return <HelpScreen onNavigate={navigate} />
      case 'settings':    return <SettingsScreen onNavigate={navigate} />
      case 'error':       return <ErrorScreen onNavigate={navigate} errorType="upload" />
      default:            return <HomeScreen onNavigate={navigate} />
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F8F9FA' }}>
      {/* Screen content */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence custom={dir} mode="wait">
          <motion.div
            key={screen}
            custom={dir}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0 overflow-y-auto"
          >
            <div className="min-h-full max-w-2xl mx-auto w-full md:shadow-[1px_0_0_0_#e5e7eb,-1px_0_0_0_#e5e7eb]">
              {renderScreen()}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      <AnimatePresence>
        {showNav && (
          <motion.nav
            key="bottom-nav"
            initial={{ y: 72, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 72, opacity: 0 }}
            transition={{ duration: 0.3, ease }}
            className="flex-shrink-0 bg-white border-t border-neutral-200"
            aria-label="Main navigation"
          >
            <div className="flex items-center justify-around px-2 pt-2 pb-6 max-w-2xl mx-auto">
              {NAV_ITEMS.map(({ id, label, Icon }) => {
                const active = screen === id
                return (
                  <button
                    key={id}
                    onClick={() => navigate(id)}
                    aria-current={active ? 'page' : undefined}
                    aria-label={label}
                    className="relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl min-w-[60px] transition-colors"
                    style={{ minHeight: 56 }}
                  >
                    <motion.div animate={{ scale: active ? 1.12 : 1 }} transition={{ type: 'spring', stiffness: 420, damping: 22 }}>
                      <Icon className={`w-6 h-6 transition-colors ${active ? 'text-orange-500' : 'text-neutral-400'}`} strokeWidth={active ? 2.5 : 1.8} />
                    </motion.div>
                    <span className={`text-xs font-semibold transition-colors ${active ? 'text-orange-500' : 'text-neutral-400'}`}>
                      {label}
                    </span>
                    {active && (
                      <motion.div layoutId="tab-dot" className="absolute bottom-1 w-1 h-1 rounded-full bg-orange-500" transition={{ type: 'spring', stiffness: 420, damping: 30 }} />
                    )}
                  </button>
                )
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function App() {
  return (
    <LangProvider>
      <AppInner />
    </LangProvider>
  )
}

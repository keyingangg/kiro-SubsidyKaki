import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Camera, Zap } from 'lucide-react'
import type { Screen } from '../types'

interface Props { onNavigate: (s: Screen) => void; onFileReady: (f: File) => void }

export default function CameraScreen({ onNavigate, onFileReady }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [flash, setFlash] = useState(false)

  const handleCapture = () => {
    // Trigger the capture flash visual then open file input
    setFlash(true)
    setTimeout(() => setFlash(false), 300)
    if (inputRef.current) {
      inputRef.current.setAttribute('capture', 'environment')
      inputRef.current.click()
    }
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) { onFileReady(file); onNavigate('confirm') }
  }

  return (
    <div className="min-h-full bg-neutral-900 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <button onClick={() => onNavigate('home')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white" aria-label="Cancel">
          <X className="w-5 h-5" />
        </button>
        <span className="text-white font-semibold text-base">Scan Document</span>
        <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white" aria-label="Flash toggle">
          <Zap className="w-5 h-5" />
        </button>
      </div>

      {/* Viewfinder */}
      <div className="flex-1 relative flex items-center justify-center px-5">
        {/* Camera bg simulation */}
        <div className="w-full aspect-[3/4] max-h-[420px] relative rounded-2xl overflow-hidden bg-neutral-800">
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-neutral-500 text-base text-center px-8">Camera preview appears here<br/><span className="text-sm">(tap capture to select file on desktop)</span></p>
          </div>
          {/* Corner guides */}
          {[['top-3 left-3', 'border-t-4 border-l-4', 'rounded-tl-lg'],
            ['top-3 right-3', 'border-t-4 border-r-4', 'rounded-tr-lg'],
            ['bottom-3 left-3', 'border-b-4 border-l-4', 'rounded-bl-lg'],
            ['bottom-3 right-3', 'border-b-4 border-r-4', 'rounded-br-lg'],
          ].map(([pos, border, radius], i) => (
            <div key={i} className={`absolute ${pos} w-8 h-8 ${border} ${radius} border-orange-400`} />
          ))}
          {/* Scan line animation */}
          <motion.div
            className="absolute left-0 right-0 h-0.5 bg-orange-400/60"
            animate={{ top: ['15%', '85%', '15%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Flash overlay */}
          {flash && <div className="absolute inset-0 bg-white/80" />}
        </div>
      </div>

      {/* Guide text */}
      <div className="text-center px-6 py-4">
        <p className="text-white text-base font-medium mb-1">Position document within frame</p>
        <p className="text-neutral-400 text-sm">Ensure all text is visible and well-lit</p>
      </div>

      {/* Capture button */}
      <div className="flex items-center justify-center gap-10 pb-10 pt-2">
        <button onClick={() => onNavigate('home')} className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white text-sm font-medium" aria-label="Cancel">
          <X className="w-6 h-6" />
        </button>
        <button
          onClick={handleCapture}
          className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          aria-label="Capture document"
        >
          <Camera className="w-9 h-9 text-neutral-800" />
        </button>
        <div className="w-14 h-14" />
      </div>

      <input ref={inputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFile} />
    </div>
  )
}

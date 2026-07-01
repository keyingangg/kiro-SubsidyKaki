import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera, ImageUp, CameraOff, SwitchCamera } from 'lucide-react'
import { useLang, T } from '../hooks/i18n'
import type { Screen } from '../types'

interface Props { onNavigate: (s: Screen) => void; onFileReady: (f: File) => void }

type CameraState = 'requesting' | 'live' | 'denied' | 'unavailable'

export default function CameraScreen({ onNavigate, onFileReady }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const uploadRef = useRef<HTMLInputElement>(null)

  const [camState, setCamState] = useState<CameraState>('requesting')
  const [flash, setFlash] = useState(false)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false)

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    stopStream()
    setCamState('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play().catch(() => {})
      }
      setCamState('live')

      // Detect if device has multiple cameras
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoInputs = devices.filter(d => d.kind === 'videoinput')
      setHasMultipleCameras(videoInputs.length > 1)
    } catch (err) {
      const error = err as DOMException
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCamState('denied')
      } else {
        setCamState('unavailable')
      }
    }
  }, [stopStream])

  useEffect(() => {
    startCamera(facingMode)
    return () => stopStream()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFlipCamera = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(next)
    startCamera(next)
  }

  const handleCapture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || camState !== 'live') return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)

    setFlash(true)
    setTimeout(() => setFlash(false), 250)

    canvas.toBlob(blob => {
      if (!blob) return
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' })
      onFileReady(file)
      onNavigate('confirm')
    }, 'image/jpeg', 0.92)
  }

  const { language } = useLang()
  const t = T[language]

  const handleUpload = () => uploadRef.current?.click()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) { onFileReady(file); onNavigate('confirm') }
    e.target.value = ''
  }

  return (
    <div className="min-h-full bg-black flex flex-col select-none">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 z-10">
        <button
          onClick={() => { stopStream(); onNavigate('home') }}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
          aria-label="Cancel"
        >
          <X className="w-5 h-5" />
        </button>
        <span className="text-white font-semibold text-base">{t.camera_title}</span>
        {hasMultipleCameras ? (
          <button
            onClick={handleFlipCamera}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
            aria-label="Switch camera"
          >
            <SwitchCamera className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-10 h-10" />
        )}
      </div>

      {/* Viewfinder */}
      <div className="flex-1 relative flex items-center justify-center px-4">
        <div className="w-full aspect-[3/4] max-h-[480px] relative rounded-2xl overflow-hidden bg-neutral-900">

          {/* Live video */}
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />

          {/* Fallback states */}
          <AnimatePresence>
            {camState !== 'live' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-neutral-900"
              >
                <CameraOff className="w-10 h-10 text-neutral-500" />
                <p className="text-neutral-400 text-sm text-center px-8 leading-relaxed">
                  {camState === 'requesting' && 'Starting camera…'}
                  {camState === 'denied' && 'Camera access denied.\nUse the upload button below.'}
                  {camState === 'unavailable' && 'No camera found.\nUse the upload button below.'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Corner guides */}
          {([
            ['top-3 left-3',    'border-t-4 border-l-4', 'rounded-tl-lg'],
            ['top-3 right-3',   'border-t-4 border-r-4', 'rounded-tr-lg'],
            ['bottom-3 left-3', 'border-b-4 border-l-4', 'rounded-bl-lg'],
            ['bottom-3 right-3','border-b-4 border-r-4', 'rounded-br-lg'],
          ] as const).map(([pos, border, radius], i) => (
            <div key={i} className={`absolute ${pos} w-8 h-8 ${border} ${radius} border-teal-500 pointer-events-none`} />
          ))}

          {/* Animated scan line — only while live */}
          {camState === 'live' && (
            <motion.div
              className="absolute left-0 right-0 h-0.5 bg-teal-400/50 pointer-events-none"
              animate={{ top: ['15%', '85%', '15%'] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}

          {/* Flash overlay */}
          {flash && <div className="absolute inset-0 bg-white/70 pointer-events-none" />}
        </div>
      </div>

      {/* Guide text */}
      <div className="text-center px-6 py-3">
        <p className="text-white text-sm font-medium">{t.camera_guide}</p>
        <p className="text-neutral-500 text-xs mt-0.5">{t.camera_guide_sub}</p>
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-center gap-8 pb-10 pt-2">
        {/* Cancel */}
        <button
          onClick={() => { stopStream(); onNavigate('home') }}
          className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-95 transition-transform"
          aria-label="Cancel"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Shutter */}
        <button
          onClick={handleCapture}
          disabled={camState !== 'live'}
          className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-40"
          aria-label="Capture document"
        >
          <Camera className="w-9 h-9 text-neutral-800" />
        </button>

        {/* Upload */}
        <button
          onClick={handleUpload}
          className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-95 transition-transform"
          aria-label="Upload from gallery"
        >
          <ImageUp className="w-6 h-6" />
        </button>
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden file input for gallery upload */}
      <input
        ref={uploadRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}

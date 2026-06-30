import { useCallback, useEffect, useRef, useState } from 'react'
import type { Language } from '../types'

const LANG_CODES: Record<Language, string> = {
  en: 'en-SG',
  zh: 'zh-CN',
  ms: 'ms-MY',
  ta: 'ta-IN',
}

export function useTTS(language: Language = 'en') {
  const [speaking, setSpeaking]       = useState(false)
  const [supported, setSupported]     = useState(false)
  const [rate, setRate]               = useState(0.85)   // slower default for elderly
  const utteranceRef                  = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window)
    return () => { window.speechSynthesis?.cancel() }
  }, [])

  const speak = useCallback((text: string, overrideLang?: Language) => {
    if (!supported) return
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = LANG_CODES[overrideLang ?? language]
    utter.rate = rate
    utter.pitch = 1.0
    utter.volume = 1.0
    utter.onstart  = () => setSpeaking(true)
    utter.onend    = () => setSpeaking(false)
    utter.onerror  = () => setSpeaking(false)
    utteranceRef.current = utter
    window.speechSynthesis.speak(utter)
  }, [supported, language, rate])

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel()
    setSpeaking(false)
  }, [])

  const toggle = useCallback((text: string, overrideLang?: Language) => {
    if (speaking) stop()
    else speak(text, overrideLang)
  }, [speaking, speak, stop])

  return { speak, stop, toggle, speaking, supported, rate, setRate }
}

/* Build a natural-language summary for the results screen */
export function buildResultsSummary(
  language: Language,
  outOfPocket: number,
  finalCost: number,
  totalSaved: number,
  clinicName: string,
  subsidyNames: string[]
): string {
  const schemes = subsidyNames.join(', ')
  switch (language) {
    case 'zh':
      return `您好。您在${clinicName}的账单分析已完成。您的应付金额是${outOfPocket}新元。使用保健储蓄后，实际自付金额为${finalCost}新元。您通过${schemes}共节省了${totalSaved}新元。`
    case 'ms':
      return `Selamat datang. Bil anda di ${clinicName} telah dianalisis. Jumlah yang perlu dibayar ialah $${outOfPocket}. Selepas menggunakan MediSave, kos sebenar ialah $${finalCost}. Anda telah menjimatkan $${totalSaved} melalui ${schemes}.`
    case 'ta':
      return `வணக்கம். ${clinicName} மருத்துவமனையில் உங்கள் பில் பகுப்பாய்வு செய்யப்பட்டது. நீங்கள் செலுத்த வேண்டியது $${outOfPocket}. மெடிசேவ் பயன்படுத்திய பிறகு, உங்கள் செலவு $${finalCost}. ${schemes} மூலம் $${totalSaved} சேமிக்கப்பட்டது.`
    default:
      return `Hello. Your bill from ${clinicName} has been analysed. You need to pay $${outOfPocket}. After using MediSave, your actual out-of-pocket cost is $${finalCost}. You saved $${totalSaved} through ${schemes}.`
  }
}

/* Build medication reminder speech */
export function buildMedSummary(language: Language, medName: string, purpose: string, frequency: string, timing: string): string {
  switch (language) {
    case 'zh':
      return `${medName}：${purpose}。服用方法：${frequency}。${timing}。`
    case 'ms':
      return `${medName}: ${purpose}. Cara penggunaan: ${frequency}. ${timing}.`
    case 'ta':
      return `${medName}: ${purpose}. எப்படி உட்கொள்வது: ${frequency}. ${timing}.`
    default:
      return `${medName}: ${purpose}. How to take it: ${frequency}. ${timing}.`
  }
}

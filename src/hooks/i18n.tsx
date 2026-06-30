import React, { createContext, useContext, useState } from 'react'
import type { Language } from '../types'

interface LangCtx {
  language: Language
  setLanguage: (l: Language) => void
}

const LangContext = createContext<LangCtx>({ language: 'en', setLanguage: () => {} })

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en')
  return <LangContext.Provider value={{ language, setLanguage }}>{children}</LangContext.Provider>
}

export const useLang = () => useContext(LangContext)

/* UI label translations */
export const T: Record<Language, Record<string, string>> = {
  en: {
    appName: 'SubsidyKaki',
    home_title: 'Know Your Subsidies in Seconds',
    home_sub: 'Snap any medical document — before or after your visit — and instantly see what you\'re entitled to.',
    scan: 'Scan Medical Document',
    upload: 'Upload from Gallery',
    before_visit: 'Before your visit (highest value)',
    during_care: 'During ongoing care (also valuable)',
    after_care: 'After your visit — scan your bill',
    results_title: 'Your Results',
    bill_title: 'Bill Explained',
    meds_title: 'Your Medications',
    listen: 'Listen',
    stop: 'Stop',
    reading: 'Reading…',
    total_saved: 'Total saved',
    you_pay: 'You pay',
    original_bill: 'Original bill',
    need_help: 'Need Help?',
    privacy: 'Your NRIC and personal details are automatically removed before processing. We never store your documents.',
  },
  zh: {
    appName: '津贴卡基',
    home_title: '几秒钟内了解您的医疗津贴',
    home_sub: '拍摄任何医疗文件，立即了解您有权享有的津贴。',
    scan: '扫描医疗文件',
    upload: '从相册上传',
    before_visit: '就诊前（价值最高）',
    during_care: '持续护理期间',
    after_care: '就诊后 — 扫描账单',
    results_title: '您的结果',
    bill_title: '账单说明',
    meds_title: '您的药物',
    listen: '朗读',
    stop: '停止',
    reading: '朗读中…',
    total_saved: '总节省',
    you_pay: '您支付',
    original_bill: '原始账单',
    need_help: '需要帮助？',
    privacy: '您的身份证号码和个人详细信息将在处理前自动删除。我们从不存储您的文件。',
  },
  ms: {
    appName: 'SubsidyKaki',
    home_title: 'Ketahui Subsidi Anda dalam Beberapa Saat',
    home_sub: 'Ambil gambar mana-mana dokumen perubatan — sebelum atau selepas lawatan — dan lihat kelayakan anda sekarang.',
    scan: 'Imbas Dokumen Perubatan',
    upload: 'Muat Naik dari Galeri',
    before_visit: 'Sebelum lawatan anda (nilai tertinggi)',
    during_care: 'Semasa penjagaan berterusan',
    after_care: 'Selepas lawatan — imbas bil anda',
    results_title: 'Keputusan Anda',
    bill_title: 'Penerangan Bil',
    meds_title: 'Ubat-ubatan Anda',
    listen: 'Dengar',
    stop: 'Berhenti',
    reading: 'Membaca…',
    total_saved: 'Jumlah jimat',
    you_pay: 'Anda bayar',
    original_bill: 'Bil asal',
    need_help: 'Perlu Bantuan?',
    privacy: 'NRIC dan maklumat peribadi anda akan dikeluarkan secara automatik sebelum pemprosesan.',
  },
  ta: {
    appName: 'சப்சிடிகாக்கி',
    home_title: 'சில நொடிகளில் உங்கள் மானியங்களை அறிந்துகொள்ளுங்கள்',
    home_sub: 'எந்த மருத்துவ ஆவணத்தையும் புகைப்படம் எடுத்து, உங்கள் உரிமைகளை உடனே பாருங்கள்.',
    scan: 'மருத்துவ ஆவணத்தை ஸ்கேன் செய்யுங்கள்',
    upload: 'கேலரியிலிருந்து பதிவேற்றுங்கள்',
    before_visit: 'வருகைக்கு முன்பு (அதிக மதிப்பு)',
    during_care: 'தொடர் சிகிச்சையின் போது',
    after_care: 'வருகைக்கு பிறகு — பில்லை ஸ்கேன் செய்யுங்கள்',
    results_title: 'உங்கள் முடிவுகள்',
    bill_title: 'பில் விளக்கம்',
    meds_title: 'உங்கள் மருந்துகள்',
    listen: 'கேளுங்கள்',
    stop: 'நிறுத்துங்கள்',
    reading: 'படிக்கிறது…',
    total_saved: 'மொத்த சேமிப்பு',
    you_pay: 'நீங்கள் செலுத்துவது',
    original_bill: 'அசல் பில்',
    need_help: 'உதவி வேண்டுமா?',
    privacy: 'உங்கள் NRIC மற்றும் தனிப்பட்ட விவரங்கள் செயல்படுத்தும் முன் தானாகவே அகற்றப்படும்.',
  },
}

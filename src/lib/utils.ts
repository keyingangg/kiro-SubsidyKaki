import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ScanResult, HistoryItem, Medication } from '../types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const MOCK_MEDICATIONS: Medication[] = [
  {
    id: 'metformin',
    name: 'Metformin 500mg',
    genericName: 'Metformin Hydrochloride',
    purpose: 'Controls your blood sugar levels for Type 2 Diabetes',
    dosage: '1 tablet (500mg)',
    frequency: 'Twice a day — morning and evening',
    timing: 'Take with or after meals to reduce stomach upset',
    specialNotes: 'Do not skip doses. If you feel dizzy or nauseous, take with food.',
    icon: '💊',
    translations: {
      zh: {
        purpose: '控制您的血糖水平（2型糖尿病）',
        frequency: '每天两次 — 早晨和晚上',
        timing: '随餐或餐后服用以减少胃部不适',
        specialNotes: '不要漏服。如果感到头晕或恶心，请随餐服用。',
      },
      ms: {
        purpose: 'Mengawal paras gula dalam darah anda untuk Diabetes Jenis 2',
        frequency: 'Dua kali sehari — pagi dan malam',
        timing: 'Ambil semasa atau selepas makan untuk mengurangkan sakit perut',
        specialNotes: 'Jangan langkau dos. Jika rasa pening atau loya, ambil semasa makan.',
      },
      ta: {
        purpose: 'இரத்த சர்க்கரை அளவை கட்டுப்படுத்துகிறது (வகை 2 நீரிழிவு)',
        frequency: 'தினமும் இரண்டு முறை — காலை மற்றும் மாலை',
        timing: 'வயிற்று வலியை குறைக்க சாப்பிடும்போது அல்லது சாப்பிட்ட பிறகு எடுக்கவும்',
        specialNotes: 'டோஸ் தவிர்க்காதீர்கள். தலைசுற்றல் ஏற்பட்டால் உணவுடன் எடுக்கவும்.',
      },
    },
  },
  {
    id: 'amlodipine',
    name: 'Amlodipine 5mg',
    genericName: 'Amlodipine Besylate',
    purpose: 'Lowers your blood pressure and reduces risk of heart disease',
    dosage: '1 tablet (5mg)',
    frequency: 'Once a day — every morning',
    timing: 'Take at the same time each morning, with or without food',
    specialNotes: 'May cause ankle swelling or dizziness when standing up. Rise slowly from bed.',
    icon: '❤️',
    translations: {
      zh: {
        purpose: '降低血压并减少心脏病风险',
        frequency: '每天一次 — 每天早上',
        timing: '每天早上同一时间服用，可随餐或不随餐',
        specialNotes: '可能导致脚踝肿胀或起身时头晕。请缓慢起床。',
      },
      ms: {
        purpose: 'Menurunkan tekanan darah dan mengurangkan risiko penyakit jantung',
        frequency: 'Sekali sehari — setiap pagi',
        timing: 'Ambil pada masa yang sama setiap pagi, dengan atau tanpa makanan',
        specialNotes: 'Mungkin menyebabkan bengkak buku lali atau pening ketika bangun. Bangun perlahan-lahan.',
      },
      ta: {
        purpose: 'இரத்த அழுத்தத்தை குறைத்து இதய நோய் அபாயத்தை குறைக்கிறது',
        frequency: 'தினமும் ஒரு முறை — ஒவ்வொரு காலையும்',
        timing: 'ஒவ்வொரு காலையும் ஒரே நேரத்தில் எடுக்கவும்',
        specialNotes: 'கணுக்கால் வீக்கம் அல்லது தலைசுற்றல் ஏற்படலாம். மெதுவாக எழுந்திருக்கவும்.',
      },
    },
  },
  {
    id: 'simvastatin',
    name: 'Simvastatin 20mg',
    genericName: 'Simvastatin',
    purpose: 'Reduces cholesterol levels to protect your heart and blood vessels',
    dosage: '1 tablet (20mg)',
    frequency: 'Once a day — every night before bed',
    timing: 'Take at night — cholesterol production is highest while you sleep',
    specialNotes: 'Avoid grapefruit juice. If you have muscle pain or weakness, inform your doctor.',
    icon: '🫀',
    translations: {
      zh: {
        purpose: '降低胆固醇水平以保护心脏和血管',
        frequency: '每天一次 — 每晚睡前',
        timing: '睡前服用 — 胆固醇在睡眠期间产生最多',
        specialNotes: '避免葡萄柚汁。如果出现肌肉疼痛或无力，请告知医生。',
      },
      ms: {
        purpose: 'Mengurangkan tahap kolesterol untuk melindungi jantung dan saluran darah',
        frequency: 'Sekali sehari — setiap malam sebelum tidur',
        timing: 'Ambil pada waktu malam — pengeluaran kolesterol tertinggi semasa tidur',
        specialNotes: 'Elakkan jus limau gedang. Jika ada sakit atau lemah otot, beritahu doktor.',
      },
      ta: {
        purpose: 'கொலஸ்ட்ரால் அளவை குறைத்து இதயத்தை பாதுகாக்கிறது',
        frequency: 'தினமும் ஒரு முறை — ஒவ்வொரு இரவும் தூக்கத்திற்கு முன்',
        timing: 'இரவில் எடுக்கவும் — தூக்கத்தின் போது கொலஸ்ட்ரால் அதிகமாக உற்பத்தியாகிறது',
        specialNotes: 'திராட்சைப்பழ சாறு தவிர்க்கவும். தசை வலி இருந்தால் மருத்துவரிடம் சொல்லுங்கள்.',
      },
    },
  },
]

export const MOCK_RESULT: ScanResult = {
  id: 'scan_001',
  date: '15 Jan 2025',
  time: '2:30 PM',
  documentType: 'Polyclinic Invoice',
  clinicName: 'Toa Payoh Polyclinic',
  totalBill: 120,
  totalSaved: 91,
  outOfPocket: 29,
  canUseMediSave: true,
  mediSaveBalance: 4500,
  finalCost: 0,
  confidence: 82,
  medications: MOCK_MEDICATIONS,
  billLines: [
    { item: 'Consultation fee',              amount: 38,  subsidised: true,  coveredBy: 'CHAS + Pioneer' },
    { item: 'Metformin 500mg × 60 tablets',  amount: 18,  subsidised: true,  coveredBy: 'CDMP MediSave' },
    { item: 'Amlodipine 5mg × 30 tablets',   amount: 12,  subsidised: true,  coveredBy: 'CDMP MediSave' },
    { item: 'Simvastatin 20mg × 30 tablets', amount: 10,  subsidised: true,  coveredBy: 'CDMP MediSave' },
    { item: 'HbA1c blood test',              amount: 22,  subsidised: true,  coveredBy: 'Pioneer Generation' },
    { item: 'Blood pressure monitoring',     amount: 10,  subsidised: true,  coveredBy: 'Pioneer Generation' },
    { item: 'Syringe / consumables',         amount: 10,  subsidised: false  },
  ],
  subsidies: [
    {
      id: 'pioneer',
      name: 'Pioneer Generation Package',
      chineseName: '建国一代配套',
      eligible: true,
      saves: 41,
      outOfPocket: 79,
      icon: '🎖️',
      badgeColor: 'orange',
      description: 'For Singapore Citizens born on or before 31 Dec 1949 who became citizens before 1 Jan 1987.',
      benefits: ['Additional CHAS subsidies at GP and dental clinics', 'MediShield Life premium subsidies (up to 60%)', 'Annual MediSave top-ups ($200–$800)', 'Outpatient subsidies at Specialist Outpatient Clinics'],
      howToUse: 'Show your blue Pioneer Generation card at the clinic counter before consultation. Subsidy is applied automatically to your bill.',
    },
    {
      id: 'cdmp',
      name: 'Chronic Disease Management',
      chineseName: '慢性病管理计划',
      eligible: true,
      saves: 30,
      outOfPocket: 49,
      icon: '🏥',
      badgeColor: 'teal',
      description: 'CDMP covers subsidised treatment for 23 chronic conditions including diabetes, hypertension, and high cholesterol.',
      benefits: ['MediSave can be used for chronic disease treatments', 'Up to $500 per year from MediSave for CDMP', 'Applies at CHAS GPs and polyclinics', 'Covers medications and related tests'],
      howToUse: 'Ensure your diagnosis is registered under CDMP with your doctor. Use your MediCard at participating clinics.',
    },
    {
      id: 'chas',
      name: 'CHAS (Community Health Assist)',
      chineseName: '综合健保计划',
      eligible: true,
      saves: 20,
      outOfPocket: 29,
      icon: '🏷️',
      badgeColor: 'navy',
      description: 'CHAS provides subsidies to lower and middle-income Singaporeans at participating GP and dental clinics.',
      benefits: ['Subsidised GP consultations', 'Subsidised dental treatments', 'Lower co-payment for chronic disease management', 'Valid at 1,800+ participating clinics island-wide'],
      howToUse: 'Present your CHAS card (blue, orange, or green) at any CHAS-participating clinic.',
    },
    {
      id: 'merdeka',
      name: 'Merdeka Generation Package',
      chineseName: '立国一代配套',
      eligible: false,
      saves: 0,
      outOfPocket: 120,
      icon: '🏅',
      badgeColor: 'gray',
      description: 'For Singapore Citizens born between 1 Jan 1950 and 31 Dec 1959 who became citizens before 31 Dec 1996.',
      benefits: ['Additional CHAS subsidies', 'MediShield Life premium subsidies (up to 25%)', 'Annual MediSave top-ups ($200)'],
      howToUse: 'If eligible, show your Merdeka Generation card at the clinic. Contact SilverLine at 1800-650-6060.',
    },
  ],
}

export const MOCK_HISTORY: HistoryItem[] = [
  { id: 'h1', date: '15 Jan 2025', time: '2:30 PM', clinicName: 'Toa Payoh Polyclinic',   outOfPocket: 0,  totalSaved: 91,  documentType: 'Polyclinic Invoice' },
  { id: 'h2', date: '14 Jan 2025', time: '3:15 PM', clinicName: 'Ang Mo Kio Polyclinic',  outOfPocket: 0,  totalSaved: 65,  documentType: 'Prescription Slip' },
  { id: 'h3', date: '28 Nov 2024', time: '10:15 AM', clinicName: 'SGH Specialist Clinic', outOfPocket: 15, totalSaved: 126, documentType: 'Referral Letter' },
  { id: 'h4', date: '5 Oct 2024',  time: '4:00 PM', clinicName: 'CHAS GP Clinic',         outOfPocket: 5,  totalSaved: 43,  documentType: 'Diagnosis Letter' },
]

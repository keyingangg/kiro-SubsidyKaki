export type Screen =
  | 'home'
  | 'camera'
  | 'confirm'
  | 'processing'
  | 'results'
  | 'details'
  | 'bill'
  | 'medications'
  | 'history'
  | 'help'
  | 'settings'
  | 'error'

export type ErrorType = 'upload' | 'processing' | 'no_subsidies' | 'offline' | 'validation'

export type Language = 'en' | 'zh' | 'ms' | 'ta'

export interface SubsidyCard {
  id: string
  name: string
  chineseName: string
  eligible: boolean
  saves: number
  outOfPocket: number
  icon: string
  badgeColor: 'orange' | 'teal' | 'navy' | 'gray'
  description: string
  benefits: string[]
  howToUse: string
}

export interface Medication {
  id: string
  name: string
  genericName: string
  purpose: string
  dosage: string
  frequency: string
  timing: string
  specialNotes: string
  icon: string
  translations: {
    zh: { purpose: string; frequency: string; timing: string; specialNotes: string }
    ms: { purpose: string; frequency: string; timing: string; specialNotes: string }
    ta: { purpose: string; frequency: string; timing: string; specialNotes: string }
  }
}

export interface BillLine {
  item: string
  amount: number
  subsidised: boolean
  coveredBy?: string
}

export interface ScanResult {
  id: string
  date: string
  time: string
  documentType: string
  clinicName: string
  totalBill: number
  totalSaved: number
  outOfPocket: number
  canUseMediSave: boolean
  mediSaveBalance: number
  finalCost: number
  confidence: number
  subsidies: SubsidyCard[]
  medications?: Medication[]
  billLines?: BillLine[]
}

export interface HistoryItem {
  id: string
  date: string
  time: string
  clinicName: string
  outOfPocket: number
  totalSaved: number
  documentType: string
}

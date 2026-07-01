// ============================================================
// Shared Type Definitions for HealthKaki Medical Assistant
// Requirements: 2.7, 3.1, 5.3, 6.5
// ============================================================

// --- Language & Processing Types ---

export type SupportedLanguage = "en-SG" | "cmn-Hans-CN" | "ms-MY" | "ta-IN";

export type ProcessingStage =
  | "uploading"
  | "reading"
  | "finding"
  | "scanning_medication";

// --- Subsidy Types ---

export interface SubsidyResult {
  schemeName: string;
  coverageDescription: string;
  eligibilityConditions: string;
  estimatedCoveragePercent: number;
  translations: Record<
    SupportedLanguage,
    {
      schemeName: string;
      coverageDescription: string;
      eligibilityConditions: string;
    } | null
  >;
}

export interface SubsidyScheme {
  id: string;
  scheme_name: string;
  scheme_type:
    | "pioneer"
    | "merdeka"
    | "chas_blue"
    | "chas_orange"
    | "chas_green"
    | "medisave_cdmp"
    | "medishield_life"
    | "medifund";
  eligible_birth_year_min: number | null;
  eligible_birth_year_max: number | null;
  eligible_clinic_types: ("public_hospital" | "polyclinic" | "gp_clinic")[];
  medical_codes: string[];
  condition_keywords: string[];
  coverage_description: string;
  eligibility_conditions: string;
  estimated_coverage_percent: number;
  translations: Record<
    SupportedLanguage,
    {
      scheme_name: string;
      coverage_description: string;
      eligibility_conditions: string;
    } | null
  >;
}

// --- Document Extraction Types ---

export interface ExtractedPrescription {
  medicationName: string;
  dosage: string | null;
  frequency: string | null;
  instructions: string | null;
}

export interface ExtractedBillItem {
  description: string;
  amount: number | null;
}

export interface ExtractedBill {
  currency: string;
  totalAmount: number | null;
  items: ExtractedBillItem[];
}

export interface RawExtractedData {
  medicalCodes: string[];
  diagnoses: string[];
  visitDate: string | null;
  institution: string | null;
  rawText: string;
  prescriptions: ExtractedPrescription[];
  bill: ExtractedBill | null;
}

export interface RedactedExtractedData {
  medicalCodes: string[];
  diagnoses: string[];
  visitDate: string | null;
  institution: string | null;
  rawText: string; // All NRIC patterns replaced with [REDACTED]
  prescriptions: ExtractedPrescription[];
  bill: ExtractedBill | null;
}

export type ExtractedDocumentData = RedactedExtractedData;

// --- Redaction Types ---

export interface RedactionResult {
  success: boolean;
  redactedText: string;
  redactionCount: number;
}

// --- Subsidy Lookup Types ---

export interface SubsidyLookupParams {
  medicalCodes: string[];
  diagnoses: string[];
  institution: string | null;
  birthYear?: number;
  clinicType?: "public_hospital" | "polyclinic" | "gp_clinic";
}

export interface SubsidyLookupResult {
  subsidies: SubsidyResult[];
  message: string | null;
  needsManualInput: boolean;
}

// --- Manual Input Types ---

export interface ManualInputData {
  birthYear: number;
  clinicType: "public_hospital" | "polyclinic" | "gp_clinic";
  chronicConditions: string[];
}

// --- API Response Types ---

export interface ProcessDocumentResponse {
  extracted: ExtractedDocumentData;
  subsidies: SubsidyResult[];
  message: string | null;
  needsManualInput: boolean;
}

// --- App State ---

export interface AppState {
  // Flow state
  stage:
    | "capture"
    | "processing"
    | "results"
    | "error"
    | "manual-input"
    | "medication-capture"
    | "medication-processing"
    | "medication-results"
    | "medication-error";
  processingStage: ProcessingStage | null;

  // Data
  selectedFile: File | null;
  previewUrl: string | null;
  extractedData: ExtractedDocumentData | null;
  subsidyResults: SubsidyResult[];

  // Medication data
  medicationResult: MedicationResult | null;
  medicationWarning: "low_confidence" | null;
  handwritingRejected: boolean;

  // UI preferences
  language: SupportedLanguage;

  // Error state
  error: {
    message: string;
    instruction?: string;
    retryable: boolean;
    stage?: ProcessingStage;
    type?: "handwriting_detected" | "unreadable_label" | "not_medication_label";
  } | null;
}

// --- Medication Types ---

export interface MedicationResult {
  medicationName: string;
  purpose: string;
  dosageFrequency: string;
  confidence: number;
  translations: Record<
    SupportedLanguage,
    {
      purpose: string;
      dosageFrequency: string;
    } | null
  >;
}

export interface MedicationExtraction {
  medicationName: string;
  purpose: string;
  dosageFrequency: string;
  confidence: number;
}

export interface MedicationOcrResult {
  success: boolean;
  extraction: MedicationExtraction | null;
  error: string | null;
}

export interface HandwritingDetectionResult {
  isHandwritten: boolean;
  confidence: number;
  reason: string | null;
}

export interface ProcessMedicationResponse {
  medication: {
    medicationName: string;
    purpose: string;
    dosageFrequency: string;
    confidence: number;
    translations: Record<
      SupportedLanguage,
      {
        purpose: string;
        dosageFrequency: string;
      } | null
    >;
  };
  warning: "low_confidence" | null;
}

// ============================================================
// Error Classes
// ============================================================

/**
 * Base error class for all HealthKaki errors.
 */
export class HealthKakiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HealthKakiError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when NRIC redaction fails or encounters an error.
 * Fail-closed: document processing is halted to prevent privacy breach.
 */
export class NricRedactionError extends HealthKakiError {
  constructor(message: string = "NRIC redaction failed") {
    super(message);
    this.name = "NricRedactionError";
  }
}

/**
 * Thrown when OCR extraction fails or returns empty/invalid data.
 */
export class OcrExtractionError extends HealthKakiError {
  constructor(message: string = "OCR extraction failed") {
    super(message);
    this.name = "OcrExtractionError";
  }
}

/**
 * Thrown when subsidy lookup query fails.
 */
export class SubsidyLookupError extends HealthKakiError {
  constructor(message: string = "Subsidy lookup failed") {
    super(message);
    this.name = "SubsidyLookupError";
  }
}

/**
 * Thrown when file validation fails (wrong type, too large, too many pages).
 */
export class FileValidationError extends HealthKakiError {
  constructor(message: string = "File validation failed") {
    super(message);
    this.name = "FileValidationError";
  }
}

/**
 * Thrown when a processing stage exceeds its timeout.
 */
export class TimeoutError extends HealthKakiError {
  constructor(message: string = "Processing timed out") {
    super(message);
    this.name = "TimeoutError";
  }
}

/**
 * Thrown when handwriting is detected on a medication label image.
 * Includes safety warning message and instruction for the user.
 */
export class HandwritingDetectedError extends HealthKakiError {
  public readonly instruction: string;

  constructor(
    message: string = "Handwritten labels cannot be accepted because misread handwriting may lead to incorrect medication information",
    instruction: string = "Please scan only official printed labels from the pharmacy or manufacturer"
  ) {
    super(message);
    this.name = "HandwritingDetectedError";
    this.instruction = instruction;
  }
}

/**
 * Thrown when medication extraction fails.
 * Supports "unreadable" and "not_medication" variants.
 */
export class MedicationExtractionError extends HealthKakiError {
  public readonly variant: "unreadable" | "not_medication";
  public readonly instruction: string;

  constructor(
    variant: "unreadable" | "not_medication",
    message?: string,
    instruction?: string
  ) {
    const defaultMessages: Record<string, string> = {
      unreadable: "Could not read the medication label",
      not_medication:
        "This does not appear to be a medication label",
    };
    const defaultInstructions: Record<string, string> = {
      unreadable:
        "Please retake the photo with better lighting, ensuring the printed text is clearly visible",
      not_medication:
        "Please scan the printed sticker or label on the medication box or bottle",
    };

    super(message ?? defaultMessages[variant]);
    this.name = "MedicationExtractionError";
    this.variant = variant;
    this.instruction = instruction ?? defaultInstructions[variant];
  }
}


// ============================================================
// Legacy Types (retained for backward compatibility with existing screens)
// ============================================================

export type Screen =
  | "home"
  | "camera"
  | "confirm"
  | "processing"
  | "results"
  | "details"
  | "bill"
  | "medications"
  | "history"
  | "help"
  | "settings"
  | "error";

export type ErrorType =
  | "upload"
  | "processing"
  | "no_subsidies"
  | "offline"
  | "validation";

export type Language = "en" | "zh" | "ms" | "ta";

export interface SubsidyCard {
  id: string;
  name: string;
  chineseName: string;
  eligible: boolean;
  saves: number;
  outOfPocket: number;
  icon: string;
  badgeColor: "orange" | "teal" | "navy" | "gray";
  description: string;
  benefits: string[];
  howToUse: string;
}

export interface Medication {
  id: string;
  name: string;
  genericName: string;
  purpose: string;
  dosage: string;
  frequency: string;
  timing: string;
  specialNotes: string;
  icon: string;
  translations: {
    zh: {
      purpose: string;
      frequency: string;
      timing: string;
      specialNotes: string;
    };
    ms: {
      purpose: string;
      frequency: string;
      timing: string;
      specialNotes: string;
    };
    ta: {
      purpose: string;
      frequency: string;
      timing: string;
      specialNotes: string;
    };
  };
}

export interface BillLine {
  item: string;
  amount: number;
  subsidised: boolean;
  coveredBy?: string;
}

export interface ScanResult {
  id: string;
  date: string;
  time: string;
  documentType: string;
  clinicName: string;
  totalBill: number;
  totalSaved: number;
  outOfPocket: number;
  canUseMediSave: boolean;
  mediSaveBalance: number;
  finalCost: number;
  confidence: number;
  subsidies: SubsidyCard[];
  medications?: Medication[];
  billLines?: BillLine[];
}

export interface HistoryItem {
  id: string;
  date: string;
  time: string;
  clinicName: string;
  outOfPocket: number;
  totalSaved: number;
  documentType: string;
}

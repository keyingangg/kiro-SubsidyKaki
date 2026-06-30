# Design Document: HealthKaki Medical Assistant

## Overview

HealthKaki is a privacy-first, accessibility-oriented web application that helps elderly users in Singapore navigate their healthcare needs through two core features: a **Medical Subsidy Checker** and a **Medication Label Scanner**. Users can photograph medical documents to understand their subsidy eligibility, or scan medication labels to understand what their medicine is for and how to take it — all presented in their preferred language with Text-to-Speech support.

The Medical Subsidy Checker processes documents through a stateless pipeline: capture → OCR extraction → NRIC redaction → subsidy lookup → multilingual results with Text-to-Speech. The Medication Label Scanner processes medication packaging images through: capture → handwriting detection gate → medication OCR extraction → multilingual results with Text-to-Speech. The handwriting detection gate ensures only official printed labels are processed, preventing dangerous misreads of handwritten notes.

The architecture prioritises:
- **Privacy**: Fail-closed NRIC redaction, no image persistence, no raw text storage
- **Accessibility**: Large touch targets (44×44px), large fonts (18px body / 24px headings, 20px medication names), WCAG 2.1 AA contrast, TTS at 0.7–0.75x speed
- **Simplicity**: Single-page flow targeting elderly users with minimal cognitive load
- **Safety**: Handwriting detection rejects unofficial labels to prevent medication misunderstanding
- **Stateless processing**: Document images exist only in server memory during the API call

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Dual-layer NRIC redaction (Gemini prompt + deterministic regex) | LLM-based redaction alone is probabilistic; regex provides a guaranteed safety net |
| Fail-closed on redaction errors | Privacy breach is worse than a failed request for this demographic |
| Web Speech API for TTS | No server-side TTS costs; works offline after page load; supports Singapore locales |
| Supabase for subsidy data only (not document storage) | Aligns with stateless processing requirement; subsidy_schemes is read-only reference data |
| Client-side language state | Avoids server round-trips for language switching; TTS voice selection is browser-native |
| Handwriting detection before medication OCR | Misreading handwritten dosage instructions is a patient safety risk; reject early |
| Confidence threshold of 0.7 for medication results | Below 0.7, OCR output is unreliable for medication information; users must verify with pharmacist |
| Medication-specific Gemini prompt (separate from document prompt) | Medication labels have different structure than medical bills; a tailored prompt improves extraction accuracy |
| Shared Gemini model instance for both flows | Avoids maintaining separate API keys/configurations; keeps architecture simple |

## Architecture

### System Architecture Diagram

```mermaid
graph TD
    subgraph "Client (Browser)"
        A[Document Capture UI] --> B[Image Preview]
        B --> C[Submit to API]
        C --> D[Loading States]
        D --> E[Results Display]
        E --> F[TTS Controls]
        E --> G[Language Toggle]
        H[Manual Fallback Form] --> C

        AA[Medication Scanner UI] --> AB[Medication Image Preview]
        AB --> AC[Submit to Medication API]
        AC --> AD[Medication Loading State]
        AD --> AE[Medication Results Display]
        AE --> AF[Medication TTS Controls]
    end

    subgraph "Server (Next.js API Route)"
        I[POST /api/process-document] --> J[File Validation]
        J --> K[Gemini OCR Extraction]
        K --> L[NRIC Regex Redaction]
        L --> M{Redaction OK?}
        M -->|Yes| N[Subsidy Lookup Service]
        M -->|No| O[Reject: Privacy Error]
        N --> P[Return JSON Response]

        MA[POST /api/process-medication] --> MB[File Validation]
        MB --> MC[Handwriting Detection]
        MC --> MD{Handwriting Found?}
        MD -->|Yes| ME[Reject: Safety Warning]
        MD -->|No| MF[Gemini Medication OCR]
        MF --> MG{Extraction OK?}
        MG -->|No name| MH[Reject: Unreadable Label]
        MG -->|Valid| MI[Return Medication Result]
    end

    subgraph "External Services"
        Q[Google Gemini 1.5 Flash]
        R[Supabase - subsidy_schemes table]
    end

    C -->|multipart/form-data| I
    AC -->|multipart/form-data| MA
    K -->|Base64 image + document prompt| Q
    MF -->|Base64 image + medication prompt| Q
    MC -->|Base64 image + handwriting prompt| Q
    Q -->|Structured JSON| K
    Q -->|Medication JSON| MF
    Q -->|Handwriting analysis| MC
    N -->|SQL query| R
    R -->|Matching schemes| N
    P -->|JSON response| D
    MI -->|JSON response| AD
```

### Request Sequence Diagram — Document Flow

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant API as /api/process-document
    participant G as Gemini 1.5 Flash
    participant R as NRIC Redactor
    participant S as Supabase (subsidy_schemes)

    U->>API: POST multipart/form-data (image)
    API->>API: Validate file (type, size)
    API->>G: Send base64 image + extraction prompt
    G-->>API: JSON {medicalCodes, diagnoses, visitDate, institution, rawText}
    API->>R: Apply regex redaction to all text fields
    R-->>API: Redacted extraction result

    alt Redaction Error
        API-->>U: 500 {error: "Privacy protection failed"}
    end

    alt Insufficient Data (no codes, no diagnoses)
        API-->>U: 200 {subsidies: [], message: "Insufficient data", needsManualInput: true}
    end

    API->>S: Query subsidy_schemes WHERE codes/diagnoses match
    S-->>API: Matching subsidy schemes
    API-->>U: 200 {extracted: {...}, subsidies: [...]}

    Note over API: Image data discarded after Gemini response
    Note over API: No raw text persisted to database
```

### Request Sequence Diagram — Medication Scanning Flow

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant API as /api/process-medication
    participant HD as Handwriting Detector
    participant G as Gemini 1.5 Flash

    U->>API: POST multipart/form-data (medication image)
    API->>API: Validate file (type, size ≤10MB)
    API->>HD: Analyse image for handwriting
    HD->>G: Send base64 image + handwriting detection prompt
    G-->>HD: JSON {isHandwritten: boolean, confidence: number}

    alt Handwriting Detected
        HD-->>API: isHandwritten = true
        API-->>U: 422 {error: "handwriting_detected", message: "Safety warning..."}
    end

    HD-->>API: isHandwritten = false
    API->>G: Send base64 image + medication extraction prompt
    G-->>API: JSON {medicationName, purpose, dosageFrequency, confidence}

    alt No Medication Name Extracted
        API-->>U: 422 {error: "unreadable_label", message: "Could not read label..."}
    end

    alt Confidence < 0.7
        API-->>U: 200 {medication: {...}, warning: "low_confidence"}
    end

    API-->>U: 200 {medication: {medicationName, purpose, dosageFrequency, confidence}}

    Note over API: Image data discarded after Gemini response
```

## Components and Interfaces

### Client Components

```typescript
// ============================================================
// src/components/DocumentCapture.tsx
// ============================================================

interface DocumentCaptureProps {
  onSubmit: (file: File) => void;
  isProcessing: boolean;
}

// States: idle | preview | submitting | error
// Accepts: JPEG, PNG, WebP, HEIC, PDF (≤10MB, PDF ≤5 pages)
// Provides: camera button, file upload button, image preview, confirm/retake

// ============================================================
// src/components/MedicationScanner.tsx
// ============================================================

interface MedicationScannerProps {
  onSubmit: (file: File) => void;
  isProcessing: boolean;
  language: SupportedLanguage;
}

// States: idle | preview | submitting | handwriting_rejected | error | results
// Accepts: JPEG, PNG, WebP, HEIC (≤10MB) — no PDF for medication labels
// Provides: dedicated "Scan Medication" camera button, image preview, confirm/retake
// Distinct from DocumentCapture — separate button on main interface

// ============================================================
// src/components/MedicationResultDisplay.tsx
// ============================================================

interface MedicationResult {
  medicationName: string;
  purpose: string;
  dosageFrequency: string;
  confidence: number;
  translations: Record<SupportedLanguage, {
    purpose: string;
    dosageFrequency: string;
  } | null>;
}

interface MedicationResultDisplayProps {
  medication: MedicationResult;
  language: SupportedLanguage;
  showWarning: boolean; // true when confidence < 0.7
}

// Renders medication card with:
//   - Medication name (20px font minimum)
//   - Purpose in selected language (18px font minimum)
//   - Dosage frequency in selected language (18px font minimum)
//   - Low confidence warning banner when showWarning=true
//   - TTS "Read Aloud" button for medication info
// Falls back to English if translation unavailable for selected language

// ============================================================
// src/components/HandwritingWarning.tsx
// ============================================================

interface HandwritingWarningProps {
  onRetry: () => void;
  onCancel: () => void;
}

// Displays safety warning when handwriting is detected:
//   - Warning icon and bold safety message
//   - Explanation: handwritten labels cannot be accepted because misread
//     handwriting may lead to incorrect medication information
//   - Instruction: scan only official printed labels from pharmacy or manufacturer
//   - "Try Again" button (44×44px touch target)
//   - "Cancel" button

// ============================================================
// src/components/LoadingProgress.tsx
// ============================================================

type ProcessingStage = "uploading" | "reading" | "finding" | "scanning_medication";

interface LoadingProgressProps {
  stage: ProcessingStage;
  onTimeout: () => void;
  timeoutMs?: number; // default 30000
}

// Displays animated indicator with stage-specific text:
//   uploading            → "Uploading your document..."
//   reading              → "Reading your document..."
//   finding              → "Finding your subsidies..."
//   scanning_medication  → "Reading your medication label..."
// Auto-triggers onTimeout after 30s per stage

// ============================================================
// src/components/ResultsDisplay.tsx
// ============================================================

interface SubsidyResult {
  schemeName: string;
  coverageDescription: string;
  eligibilityConditions: string;
  estimatedCoveragePercent: number;
  translations: Record<SupportedLanguage, {
    schemeName: string;
    coverageDescription: string;
    eligibilityConditions: string;
  } | null>;
}

type SupportedLanguage = "en-SG" | "cmn-Hans-CN" | "ms-MY" | "ta-IN";

interface ResultsDisplayProps {
  subsidies: SubsidyResult[];
  language: SupportedLanguage;
  extractedData: ExtractedDocumentData;
}

// Renders subsidy cards ordered by estimatedCoveragePercent (desc)
// Shows summary count at top
// Falls back to English if translation unavailable for selected language

// ============================================================
// src/components/TTSControls.tsx
// ============================================================

interface TTSControlsProps {
  textContent: string;
  language: SupportedLanguage;
  isSupported: boolean; // derived from window.speechSynthesis check
}

// States: idle | playing | paused
// Provides: Read Aloud button (44×44px), Pause button, Stop button
// Highlights current spoken segment
// Rate: 0.7–0.75x normal speed

// ============================================================
// src/components/LanguageToggle.tsx
// ============================================================

interface LanguageToggleProps {
  current: SupportedLanguage;
  onChange: (lang: SupportedLanguage) => void;
}

// Four-option toggle: English | 中文 | Melayu | தமிழ்
// 44×44px minimum touch targets

// ============================================================
// src/components/ManualFallbackForm.tsx
// ============================================================

interface ManualFallbackFormProps {
  onSubmit: (data: ManualInputData) => void;
  isProcessing: boolean;
}

interface ManualInputData {
  birthYear: number;
  clinicType: "public_hospital" | "polyclinic" | "gp_clinic";
  chronicConditions: string[];
}

// Displayed when OCR cannot extract birth year OR clinic type
// Birth year dropdown (1920–current year)
// Clinic type selector (3 options)
// Chronic condition checkboxes (from CDMP list)
```

### Server-Side Modules

```typescript
// ============================================================
// src/lib/nric-redactor.ts
// ============================================================

/**
 * Dual-layer NRIC redaction:
 * Layer 1: Gemini prompt instructs model to redact during extraction
 * Layer 2: Deterministic regex applied to ALL output text fields
 *
 * Fail-closed: if regex execution throws, the entire request is rejected.
 */

interface RedactionResult {
  success: boolean;
  redactedText: string;
  redactionCount: number;
}

/**
 * Redacts all NRIC patterns from text.
 * Full NRIC: [STFG]\d{7}[A-Z] (case-insensitive)
 * Partial NRIC: [STFG]\d{4,6}[A-Z] (case-insensitive)
 * Returns RedactionResult with fail-closed semantics.
 */
export function redactNric(text: string): RedactionResult;

/**
 * Applies redaction to all string fields in an extracted document.
 * Throws NricRedactionError if any field fails redaction.
 */
export function redactExtractedData(data: RawExtractedData): RedactedExtractedData;

// ============================================================
// src/lib/handwriting-detector.ts
// ============================================================

interface HandwritingDetectionResult {
  isHandwritten: boolean;
  confidence: number;
  reason: string | null; // e.g., "Detected cursive handwriting on label"
}

/**
 * Analyses a medication label image for the presence of handwritten text.
 * Uses Gemini 1.5 Flash with a handwriting-specific detection prompt.
 *
 * Pipeline position: MUST run BEFORE medication OCR extraction.
 * If isHandwritten is true, the medication scanning pipeline is halted
 * and a safety warning is returned to the user.
 *
 * @param imageBuffer - Raw image bytes
 * @param mimeType - Image MIME type
 * @returns HandwritingDetectionResult
 */
export async function detectHandwriting(
  imageBuffer: ArrayBuffer,
  mimeType: string
): Promise<HandwritingDetectionResult>;

// Gemini prompt for handwriting detection:
const HANDWRITING_DETECTION_PROMPT = `Analyse this medication label image.
Determine if the label contains ANY handwritten text (cursive, block letters written by hand, 
or any non-printed text). Focus on dosage instructions, medication names, and notes.

Respond ONLY with a JSON object:
{
  "isHandwritten": true/false,
  "confidence": 0.0 to 1.0,
  "reason": "description of what was detected or null"
}

IMPORTANT: Err on the side of caution. If there is ANY doubt about whether text is 
handwritten vs printed, classify it as handwritten for patient safety.`;

// ============================================================
// src/lib/medication-ocr.ts
// ============================================================

interface MedicationExtraction {
  medicationName: string;
  purpose: string;
  dosageFrequency: string;
  confidence: number;
}

interface MedicationOcrResult {
  success: boolean;
  extraction: MedicationExtraction | null;
  error: string | null;
}

/**
 * Extracts medication information from a printed label image using Gemini.
 * Uses a medication-specific prompt distinct from the document extraction prompt.
 *
 * @param imageBuffer - Raw image bytes (after handwriting check passes)
 * @param mimeType - Image MIME type
 * @returns MedicationOcrResult with structured medication data
 */
export async function extractMedicationInfo(
  imageBuffer: ArrayBuffer,
  mimeType: string
): Promise<MedicationOcrResult>;

// Gemini prompt for medication extraction:
const MEDICATION_EXTRACTION_PROMPT = `You are a medication label reader for elderly patients in Singapore.

Analyse the provided medication label image and extract:
1. Medication name (brand name or generic name as printed)
2. Purpose/indication (what the medication is for, in simple plain language)
3. Dosage frequency (how often to take it, e.g., "Twice daily", "Once every morning")

IMPORTANT: 
- Only extract from PRINTED text on official labels.
- Provide the purpose in simple, plain language suitable for elderly patients.
- If you cannot identify a medication name, return null for medicationName.

Respond ONLY with a JSON object:
{
  "medicationName": "string or null",
  "purpose": "string - plain language explanation",
  "dosageFrequency": "string - how often to take",
  "confidence": 0.0 to 1.0
}`;

/**
 * Validates a MedicationExtraction object.
 * Returns true if medicationName is non-null and non-empty.
 */
export function isValidMedicationExtraction(
  extraction: MedicationExtraction | null
): extraction is MedicationExtraction;

/**
 * Determines if extraction confidence is below the safety threshold.
 * Threshold: 0.7
 * Below threshold: show warning to verify with pharmacist.
 */
export function isBelowConfidenceThreshold(confidence: number): boolean;

// ============================================================
// src/lib/subsidy-lookup.ts
// ============================================================

interface SubsidyScheme {
  id: string;
  scheme_name: string;
  scheme_type: "pioneer" | "merdeka" | "chas_blue" | "chas_orange" | "chas_green" | "medisave_cdmp" | "medishield_life" | "medifund";
  eligible_birth_year_min: number | null;
  eligible_birth_year_max: number | null;
  eligible_clinic_types: ("public_hospital" | "polyclinic" | "gp_clinic")[];
  medical_codes: string[];
  condition_keywords: string[];
  coverage_description: string;
  eligibility_conditions: string;
  estimated_coverage_percent: number;
  translations: Record<SupportedLanguage, {
    scheme_name: string;
    coverage_description: string;
    eligibility_conditions: string;
  } | null>;
}

interface SubsidyLookupParams {
  medicalCodes: string[];
  diagnoses: string[];
  institution: string | null;
  birthYear?: number;
  clinicType?: "public_hospital" | "polyclinic" | "gp_clinic";
}

interface SubsidyLookupResult {
  subsidies: SubsidyResult[];
  message: string | null;
  needsManualInput: boolean;
}

/**
 * Queries Supabase subsidy_schemes table.
 * Matches on medical codes OR diagnosis keywords.
 * Filters by institution type mapping.
 * Returns empty with message if no codes/diagnoses provided.
 */
export async function lookupSubsidies(
  params: SubsidyLookupParams
): Promise<SubsidyLookupResult>;

/**
 * Filters subsidy schemes by birth year eligibility.
 * A scheme matches if:
 *   - eligible_birth_year_min is null (no lower bound), AND
 *   - eligible_birth_year_max is null (no upper bound), OR
 *   - birthYear falls within [eligible_birth_year_min, eligible_birth_year_max] (inclusive)
 * If birthYear is undefined, birth-year-gated schemes (Pioneer, Merdeka)
 * are included with a requiresVerification flag set to true.
 */
export function filterByBirthYear(
  schemes: SubsidyScheme[],
  birthYear: number | undefined
): SubsidyScheme[];

// ============================================================
// src/lib/ocr-pipeline.ts
// ============================================================

interface RawExtractedData {
  medicalCodes: string[];
  diagnoses: string[];
  visitDate: string | null;
  institution: string | null;
  rawText: string;
}

interface RedactedExtractedData {
  medicalCodes: string[];
  diagnoses: string[];
  visitDate: string | null;
  institution: string | null;
  rawText: string;  // All NRIC patterns replaced with [REDACTED]
}

type ExtractedDocumentData = RedactedExtractedData;

/**
 * Full pipeline: validate → extract via Gemini → redact → return.
 * Image data is NOT persisted at any point.
 */
export async function processDocument(
  fileBuffer: ArrayBuffer,
  mimeType: string
): Promise<{ extracted: RedactedExtractedData }>;
```

### API Route Interfaces

```typescript
// ============================================================
// POST /api/process-document
// ============================================================
// Content-Type: multipart/form-data

// Request body:
// - file: File (JPEG, PNG, WebP, HEIC, PDF; max 10MB)
// - birthYear?: string (optional, from manual fallback)
// - clinicType?: string (optional, from manual fallback)
// - chronicConditions?: string (optional, JSON array from manual fallback)

// Success Response (200):
interface ProcessDocumentResponse {
  extracted: ExtractedDocumentData;
  subsidies: SubsidyResult[];
  message: string | null;
  needsManualInput: boolean;
}

// Error Responses:
// 400: { error: "No file provided" }
// 400: { error: "Unsupported file type" }
// 400: { error: "File too large (max 10MB)" }
// 400: { error: "PDF exceeds 5 page limit" }
// 500: { error: "Privacy protection failed - document rejected" }
// 500: { error: "Document extraction failed" }
// 500: { error: "Subsidy lookup failed" }
// 504: { error: "Processing timed out" }

// ============================================================
// POST /api/process-medication
// ============================================================
// Content-Type: multipart/form-data

// Request body:
// - file: File (JPEG, PNG, WebP, HEIC; max 10MB) — no PDF for medication labels

// Success Response (200):
interface ProcessMedicationResponse {
  medication: {
    medicationName: string;
    purpose: string;
    dosageFrequency: string;
    confidence: number;
    translations: Record<SupportedLanguage, {
      purpose: string;
      dosageFrequency: string;
    } | null>;
  };
  warning: "low_confidence" | null; // present when confidence < 0.7
}

// Error Responses:
// 400: { error: "No file provided" }
// 400: { error: "Unsupported file type" }
// 400: { error: "File too large (max 10MB)" }
// 422: { error: "handwriting_detected", message: "Handwritten labels cannot be accepted...", instruction: "Please scan only official printed labels..." }
// 422: { error: "unreadable_label", message: "Could not read the medication label...", instruction: "Please retake the photo with better lighting..." }
// 422: { error: "not_medication_label", message: "This does not appear to be a medication label...", instruction: "Please scan the printed sticker or label on the medication box or bottle." }
// 500: { error: "Medication extraction failed" }
// 504: { error: "Processing timed out" }
```

## Data Models

### Supabase Schema: `subsidy_schemes` Table

```sql
CREATE TABLE subsidy_schemes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheme_name TEXT NOT NULL,
  scheme_type TEXT NOT NULL CHECK (scheme_type IN (
    'pioneer', 'merdeka', 'chas_blue', 'chas_orange', 'chas_green',
    'medisave_cdmp', 'medishield_life', 'medifund'
  )),
  eligible_birth_year_min INTEGER,        -- NULL means no lower bound
  eligible_birth_year_max INTEGER,        -- NULL means no upper bound
  eligible_clinic_types TEXT[] NOT NULL,   -- e.g., {'public_hospital', 'polyclinic'}
  medical_codes TEXT[] NOT NULL DEFAULT '{}',       -- ICD-10/SNOMED codes
  condition_keywords TEXT[] NOT NULL DEFAULT '{}',  -- diagnosis keyword matches
  coverage_description TEXT NOT NULL,
  eligibility_conditions TEXT NOT NULL,
  estimated_coverage_percent INTEGER NOT NULL CHECK (
    estimated_coverage_percent >= 0 AND estimated_coverage_percent <= 100
  ),
  translations JSONB NOT NULL DEFAULT '{}',
  -- translations shape: { "cmn-Hans-CN": {...}, "ms-MY": {...}, "ta-IN": {...} }
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for medical code lookups
CREATE INDEX idx_subsidy_schemes_medical_codes ON subsidy_schemes USING GIN (medical_codes);

-- Index for condition keyword lookups
CREATE INDEX idx_subsidy_schemes_condition_keywords ON subsidy_schemes USING GIN (condition_keywords);

-- Index for clinic type filtering
CREATE INDEX idx_subsidy_schemes_clinic_types ON subsidy_schemes USING GIN (eligible_clinic_types);
```

### Client State Model

```typescript
// Main application state (managed in page component)
interface AppState {
  // Flow state
  stage: "capture" | "processing" | "results" | "error" | "manual-input"
    | "medication-capture" | "medication-processing" | "medication-results" | "medication-error";
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
```

### Medication Result Model

```typescript
interface MedicationResult {
  medicationName: string;
  purpose: string;
  dosageFrequency: string;
  confidence: number;
  translations: Record<SupportedLanguage, {
    purpose: string;
    dosageFrequency: string;
  } | null>;
}
```

### NRIC Pattern Definitions

```typescript
// Full NRIC: prefix letter + 7 digits + suffix letter
const FULL_NRIC_PATTERN = /[STFGstfg]\d{7}[A-Za-z]/g;

// Partial NRIC: prefix letter + 4-6 digits + suffix letter
const PARTIAL_NRIC_PATTERN = /[STFGstfg]\d{4,6}[A-Za-z]/g;

// Combined pattern for single-pass redaction
const ALL_NRIC_PATTERN = /[STFGstfg]\d{4,7}[A-Za-z]/g;
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: File Validation Correctness

*For any* file submission with a given MIME type and file size, the validation function SHALL accept the file if and only if the MIME type is one of {image/jpeg, image/png, image/webp, image/heic, application/pdf} AND the file size is ≤ 10MB; otherwise it SHALL reject the file with an appropriate error message.

**Validates: Requirements 1.2, 1.4, 1.5, 2.9**

### Property 2: OCR Response Parsing Produces Valid Structure

*For any* valid JSON string returned by Gemini that contains the expected fields (medicalCodes, diagnoses, visitDate, institution, rawText), parsing SHALL produce an object where medicalCodes is an array of strings, diagnoses is an array of strings, visitDate is either a valid ISO 8601 date string or null, institution is either a string or null, and rawText is a string. Missing fields SHALL default to null or empty array as appropriate.

**Validates: Requirements 2.7, 2.11**

### Property 3: Empty Extraction Detection

*For any* extraction result where medicalCodes is empty AND diagnoses is empty AND visitDate is null AND institution is null, the system SHALL classify the extraction as failed and trigger the "document could not be read" error path.

**Validates: Requirements 2.6**

### Property 4: NRIC Redaction Completeness

*For any* input string containing one or more NRIC patterns (full: [STFG]\d{7}[A-Za-z], or partial: [STFG]\d{4,6}[A-Za-z]), after applying the redactNric function, the output string SHALL contain zero substrings matching any NRIC pattern, AND the output SHALL contain exactly as many "[REDACTED]" placeholders as there were NRIC patterns in the input.

**Validates: Requirements 3.1, 3.2, 3.5**

### Property 5: NRIC Redaction Fail-Closed

*For any* input (including null, undefined, or strings containing characters that could cause regex exceptions), if the redaction function encounters any error during processing, the function SHALL throw an NricRedactionError rather than returning potentially unredacted text.

**Validates: Requirements 3.6**

### Property 6: Subsidy Query Decision Logic

*For any* extraction result, the subsidy lookup service SHALL execute a database query if and only if medicalCodes contains at least one non-empty string OR diagnoses contains at least one non-empty string. When both are empty or null, it SHALL skip the query and return a "insufficient data" message with needsManualInput set to true.

**Validates: Requirements 5.1, 5.7**

### Property 7: Subsidy Lookup Completeness and Filtering

*For any* set of subsidy_schemes in the database and any valid lookup query (with medicalCodes, diagnoses, and institution), the lookup result SHALL include every scheme whose medical_codes or condition_keywords overlap with the query parameters AND whose eligible_clinic_types include the mapped clinic type of the query institution. No matching scheme SHALL be omitted from results.

**Validates: Requirements 5.2, 5.5**

### Property 8: Results Ordering by Coverage

*For any* non-empty array of SubsidyResult objects, when displayed in the results view, they SHALL be ordered such that for every consecutive pair (result[i], result[i+1]), result[i].estimatedCoveragePercent >= result[i+1].estimatedCoveragePercent.

**Validates: Requirements 6.1**

### Property 9: Language Display with English Fallback

*For any* SubsidyResult and any selected SupportedLanguage, the displayed text SHALL use the translation for the selected language if translations[language] is non-null; otherwise it SHALL display the English (default) text. No display field SHALL ever be empty or null.

**Validates: Requirements 6.5, 6.7**

### Property 10: TTS Configuration Correctness

*For any* TTS invocation with a selected SupportedLanguage, the SpeechSynthesisUtterance SHALL have: (a) rate set to a value in the range [0.7, 0.75] inclusive, and (b) lang set to the locale code matching the selected language ("en-SG", "cmn-Hans-CN", "ms-MY", or "ta-IN").

**Validates: Requirements 7.3, 7.9**

### Property 11: Medication OCR Response Parsing

*For any* valid JSON string returned by Gemini for a medication label extraction, parsing SHALL produce an object where medicationName is a string or null, purpose is a string, dosageFrequency is a string, and confidence is a number in the range [0, 1]. If any required field is missing from the raw JSON, the parser SHALL set it to null (for medicationName) or empty string (for purpose, dosageFrequency) and set confidence to 0.

**Validates: Requirements 9.2, 9.8**

### Property 12: Handwriting Detection Gate Ordering

*For any* medication label image submission, the handwriting detection step SHALL execute before the medication OCR extraction step. If handwriting detection returns isHandwritten=true, the medication OCR extraction step SHALL NOT execute.

**Validates: Requirements 9.5**

### Property 13: Handwriting Rejection Safety

*For any* handwriting detection result where isHandwritten is true, the medication scanning pipeline SHALL reject the submission and return a response containing: (a) a safety warning explaining that handwritten labels cannot be accepted because misread handwriting may lead to incorrect medication information, and (b) an instruction to scan only official printed labels from the pharmacy or manufacturer.

**Validates: Requirements 9.6, 9.7**

### Property 14: Medication Extraction Quality Decision

*For any* medication extraction result: (a) if medicationName is null or empty, the system SHALL reject with an "unreadable label" error; (b) if medicationName is non-empty AND confidence < 0.7, the system SHALL return the result with a "low_confidence" warning; (c) if medicationName is non-empty AND confidence >= 0.7, the system SHALL return the result with no warning.

**Validates: Requirements 9.9, 9.10**

### Property 15: Medication Display with Language Support

*For any* MedicationResult and any selected SupportedLanguage, the displayed text SHALL show: the medicationName (always in original form), the purpose in the selected language if translations[language] is non-null (otherwise in English), and the dosageFrequency in the selected language if translations[language] is non-null (otherwise in English). No display field SHALL ever be empty or null.

**Validates: Requirements 9.3**

### Property 16: Medication TTS Content Completeness

*For any* MedicationResult, the text content passed to the TTS module SHALL include the medicationName, purpose (in the selected language), and dosageFrequency (in the selected language). All three pieces of information SHALL be present in the TTS text content.

**Validates: Requirements 9.12**

## Error Handling

### Strategy Overview

The application uses two distinct error handling strategies depending on the sensitivity of the operation:

| Context | Strategy | Rationale |
|---------|----------|-----------|
| NRIC redaction | **Fail-closed** | Privacy breach is catastrophic for this user group; better to fail the request than risk exposure |
| Handwriting detection | **Fail-safe** | If in doubt, reject the image as handwritten — patient safety over convenience |
| Medication OCR | **Fail-graceful with warning** | Low confidence results are shown with pharmacist verification warning |
| OCR extraction | **Fail-graceful** | Partial data is still useful; user can retry or use manual fallback |
| Subsidy lookup | **Fail-graceful** | Database issues are transient; user gets clear message and retry option |
| File validation | **Fail-fast** | Invalid input should be rejected immediately with actionable feedback |
| TTS playback | **Fail-silent** | TTS unavailability should not block access to visual results |

### Error Types and Handling

```typescript
// Base error classes
class HealthKakiError extends Error {
  constructor(
    message: string,
    public readonly userMessage: string,
    public readonly retryable: boolean,
    public readonly stage?: ProcessingStage
  ) {
    super(message);
  }
}

class NricRedactionError extends HealthKakiError {
  constructor(cause?: Error) {
    super(
      `NRIC redaction failed: ${cause?.message ?? "unknown"}`,
      "Privacy protection failed — document rejected for your safety. Please try again.",
      true,
      "reading"
    );
  }
}

class OcrExtractionError extends HealthKakiError {
  constructor(cause?: Error) {
    super(
      `OCR extraction failed: ${cause?.message ?? "unknown"}`,
      "We couldn't read your document. Please retake the photo with better lighting.",
      true,
      "reading"
    );
  }
}

class SubsidyLookupError extends HealthKakiError {
  constructor(cause?: Error) {
    super(
      `Subsidy lookup failed: ${cause?.message ?? "unknown"}`,
      "We couldn't find subsidy information right now. Please try again later.",
      true,
      "finding"
    );
  }
}

class FileValidationError extends HealthKakiError {
  constructor(message: string, userMessage: string) {
    super(message, userMessage, false);
  }
}

class TimeoutError extends HealthKakiError {
  constructor(stage: ProcessingStage) {
    super(
      `${stage} timed out after 30s`,
      "This is taking longer than expected. Please try again.",
      true,
      stage
    );
  }
}

class HandwritingDetectedError extends HealthKakiError {
  constructor() {
    super(
      "Handwriting detected in medication label image",
      "Handwritten labels cannot be accepted because misread handwriting may lead to incorrect medication information.",
      true,
      "scanning_medication"
    );
  }
  readonly instruction = "Please scan only official printed labels from the pharmacy or manufacturer.";
}

class MedicationExtractionError extends HealthKakiError {
  constructor(type: "unreadable" | "not_medication") {
    const messages = {
      unreadable: {
        internal: "Medication name could not be extracted from label",
        user: "We couldn't read the medication label. Please retake the photo with better lighting, ensuring the printed text is clearly visible.",
      },
      not_medication: {
        internal: "Image does not contain a medication label",
        user: "This does not appear to be a medication label. Please scan the printed sticker or label on the medication box or bottle.",
      },
    };
    super(
      messages[type].internal,
      messages[type].user,
      true,
      "scanning_medication"
    );
  }
}
```

### Fail-Closed Redaction Pipeline

```mermaid
graph TD
    A[Receive extracted text] --> B[Apply NRIC regex]
    B --> C{Regex succeeded?}
    C -->|Yes| D{Remaining NRIC patterns?}
    C -->|No - Exception| E[Throw NricRedactionError]
    D -->|None found| F[Return redacted text]
    D -->|Patterns remain| G[Throw NricRedactionError]
    E --> H[API returns 500: Privacy Error]
    G --> H
    F --> I[Continue to subsidy lookup]
```

### Medication Scanning Error Flow

```mermaid
graph TD
    A[Receive medication image] --> B[Validate file type/size]
    B --> C{Valid?}
    C -->|No| D[Return 400: Validation Error]
    C -->|Yes| E[Handwriting Detection]
    E --> F{Handwriting found?}
    F -->|Yes| G[Return 422: Safety Warning]
    F -->|No| H[Medication OCR Extraction]
    H --> I{Name extracted?}
    I -->|No - null/empty| J[Return 422: Unreadable Label]
    I -->|No - no medication content| K[Return 422: Not Medication Label]
    I -->|Yes| L{Confidence >= 0.7?}
    L -->|No| M[Return 200 with low_confidence warning]
    L -->|Yes| N[Return 200 - success]
```

### Client Error Recovery

- All retryable errors retain the original file in memory so the user does not need to re-upload
- Non-retryable errors (file validation) provide immediate actionable feedback
- Network errors trigger automatic retry (1 attempt) before showing error to user
- Progress indicator is replaced by error card with prominent "Try Again" button (44×44px)
- Handwriting rejection shows specific HandwritingWarning component with safety explanation and instruction to use printed labels
- Low confidence medication results are displayed with a visible pharmacist verification warning banner

## Testing Strategy

### Framework and Libraries

- **Test runner**: Vitest (fast, native ESM, TypeScript-first)
- **Property-based testing**: fast-check (de facto standard for JS/TS PBT)
- **Component testing**: React Testing Library + jsdom
- **Mocking**: Vitest built-in mocking (vi.mock, vi.fn)

### Test Categories

#### 1. Property-Based Tests (fast-check)

Each correctness property maps to one property-based test with minimum 100 iterations. Tests are tagged with property references.

| Property | Test File | What It Generates |
|----------|-----------|-------------------|
| Property 1: File validation | `file-validation.property.test.ts` | Random MIME types × file sizes |
| Property 2: OCR parsing | `ocr-pipeline.property.test.ts` | Random JSON strings with field variations |
| Property 3: Empty extraction | `ocr-pipeline.property.test.ts` | Random empty/null field combinations |
| Property 4: NRIC redaction completeness | `nric-redactor.property.test.ts` | Random text with embedded NRICs |
| Property 5: NRIC fail-closed | `nric-redactor.property.test.ts` | Adversarial inputs (null, special chars) |
| Property 6: Query decision | `subsidy-lookup.property.test.ts` | Random code/diagnosis arrays |
| Property 7: Lookup completeness | `subsidy-lookup.property.test.ts` | Random schemes × queries |
| Property 8: Results ordering | `results-display.property.test.ts` | Random subsidy result arrays |
| Property 9: Language fallback | `results-display.property.test.ts` | Random results × language selections |
| Property 10: TTS config | `tts-controls.property.test.ts` | All 4 language × rate combinations |
| Property 11: Medication OCR parsing | `medication-ocr.property.test.ts` | Random medication JSON strings with field variations |
| Property 12: Handwriting gate ordering | `medication-pipeline.property.test.ts` | Random images with mocked detection/extraction services |
| Property 13: Handwriting rejection | `handwriting-detector.property.test.ts` | Random HandwritingDetectionResult with isHandwritten=true |
| Property 14: Medication quality decision | `medication-ocr.property.test.ts` | Random medication names × confidence values in [0,1] |
| Property 15: Medication display language | `medication-result-display.property.test.ts` | Random MedicationResult × all 4 languages |
| Property 16: Medication TTS content | `medication-tts.property.test.ts` | Random MedicationResult × languages |

**Configuration:**
```typescript
// vitest.config.ts property test settings
fc.configureGlobal({ numRuns: 100 });
```

**Tagging format:**
```typescript
it("Feature: medicsnap-subsidy-checker, Property 4: NRIC Redaction Completeness", () => {
  fc.assert(fc.property(/* ... */));
});

it("Feature: medicsnap-subsidy-checker, Property 14: Medication Extraction Quality Decision", () => {
  fc.assert(fc.property(/* ... */));
});
```

#### 2. Unit Tests (Vitest)

Focused on specific examples, edge cases, and integration points:

- File validation: boundary cases (exactly 10MB, 5-page PDF)
- NRIC regex: known NRIC formats, case variations, embedded in sentences
- Subsidy lookup: specific scheme matching scenarios
- Results display: rendering with 0, 1, many results
- TTS: Web Speech API unavailable scenario
- Loading states: stage transitions, timeout boundaries
- Handwriting detection: specific examples of handwritten vs printed labels
- Medication OCR: specific medication label extractions with known expected outputs
- Medication result display: rendering with low confidence warning
- Medication result display: font size verification (20px name, 18px purpose/dosage)
- Medication scanner: "Scan Medication" button presence and distinctness from document button

#### 3. Integration Tests

- API route `/api/process-document` end-to-end with mocked Gemini (verify full pipeline)
- API route `/api/process-medication` end-to-end with mocked Gemini (verify handwriting gate → OCR → response)
- Supabase query correctness with test data
- Client → API → response flow with MSW (Mock Service Worker)
- Medication pipeline: handwriting detection → rejection path
- Medication pipeline: printed label → successful extraction path
- Medication pipeline: non-medication image → appropriate error

### Test File Structure

```
src/
├── lib/
│   ├── __tests__/
│   │   ├── nric-redactor.test.ts              # Unit tests
│   │   ├── nric-redactor.property.test.ts     # PBT
│   │   ├── subsidy-lookup.test.ts             # Unit tests
│   │   ├── subsidy-lookup.property.test.ts    # PBT
│   │   ├── ocr-pipeline.test.ts              # Unit tests
│   │   ├── ocr-pipeline.property.test.ts     # PBT
│   │   ├── file-validation.property.test.ts  # PBT
│   │   ├── handwriting-detector.test.ts       # Unit tests
│   │   ├── handwriting-detector.property.test.ts  # PBT
│   │   ├── medication-ocr.test.ts             # Unit tests
│   │   ├── medication-ocr.property.test.ts    # PBT
│   │   └── medication-pipeline.property.test.ts   # PBT (pipeline ordering)
│   └── ...
├── components/
│   ├── __tests__/
│   │   ├── ResultsDisplay.test.tsx
│   │   ├── results-display.property.test.ts   # PBT
│   │   ├── TTSControls.test.tsx
│   │   ├── tts-controls.property.test.ts      # PBT
│   │   ├── DocumentCapture.test.tsx
│   │   ├── LoadingProgress.test.tsx
│   │   ├── ManualFallbackForm.test.tsx
│   │   ├── MedicationScanner.test.tsx          # Unit tests
│   │   ├── MedicationResultDisplay.test.tsx    # Unit tests
│   │   ├── medication-result-display.property.test.ts  # PBT
│   │   ├── medication-tts.property.test.ts     # PBT
│   │   └── HandwritingWarning.test.tsx         # Unit tests
│   └── ...
└── app/
    └── api/
        ├── process-document/
        │   └── __tests__/
        │       └── route.integration.test.ts   # Integration test
        └── process-medication/
            └── __tests__/
                └── route.integration.test.ts   # Integration test
```

### Key Testing Decisions

| Decision | Rationale |
|----------|-----------|
| fast-check over custom generators | Industry-standard shrinking, arbitrary composition, reproducible seeds |
| Vitest over Jest | Native ESM support for Next.js 14, faster execution, same API surface |
| Mock Gemini API in all tests | External service; deterministic tests require controlled responses |
| Mock Supabase in property tests | Focus on lookup logic correctness, not database connectivity |
| Real Supabase in integration tests | Verify actual query syntax and response parsing |
| Separate property tests for medication pipeline ordering | Pipeline ordering bugs (skipping handwriting check) are safety-critical |
| Confidence threshold (0.7) as a property test boundary | Ensures no medication info is shown without warning when OCR is uncertain |
| No E2E browser tests in this spec | Separate concern; accessibility testing requires manual + axe-core audit |

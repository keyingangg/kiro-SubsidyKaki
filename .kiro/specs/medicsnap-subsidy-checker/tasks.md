# Implementation Plan: HealthKaki Medical Assistant

## Overview

This plan implements the HealthKaki stateless document processing pipeline, medication label scanner, and UI. The existing Gemini wrapper (`src/lib/gemini.ts`), Supabase clients (`src/lib/supabase/client.ts`, `server.ts`) are already in place. Tasks cover new modules, Supabase schema, client components, API route rewrite, page integration, and tests.

Additionally, this plan covers the **Medication Label Scanning** feature: handwriting detection, medication OCR extraction, medication-specific UI components, and the `/api/process-medication` API route.

## Tasks

- [ ] 1. Define TypeScript types and error classes
  - [ ] 1.1 Create shared type definitions at `src/types/index.ts`
    - Define `SupportedLanguage`, `ProcessingStage`, `SubsidyResult`, `SubsidyScheme`, `ExtractedDocumentData`, `RedactedExtractedData`, `RawExtractedData`, `RedactionResult`, `SubsidyLookupParams`, `SubsidyLookupResult`, `ManualInputData`, `ProcessDocumentResponse`, `AppState` interfaces/types
    - Define `HealthKakiError`, `NricRedactionError`, `OcrExtractionError`, `SubsidyLookupError`, `FileValidationError`, `TimeoutError` error classes
    - _Requirements: 2.7, 3.1, 5.3, 6.5_

- [ ] 2. Implement NRIC redaction module
  - [ ] 2.1 Create `src/lib/nric-redactor.ts`
    - Implement `FULL_NRIC_PATTERN`, `PARTIAL_NRIC_PATTERN`, and `ALL_NRIC_PATTERN` regex constants
    - Implement `redactNric(text: string): RedactionResult` with fail-closed semantics
    - Implement `redactExtractedData(data: RawExtractedData): RedactedExtractedData` that applies redaction to all string fields
    - Throw `NricRedactionError` on any error (null input, regex failure, remaining patterns after redaction)
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6_

  - [ ]* 2.2 Write property test for NRIC redaction completeness
    - **Property 4: NRIC Redaction Completeness**
    - Generate random strings with embedded NRIC patterns; verify zero NRIC patterns remain after redaction and correct `[REDACTED]` count
    - **Validates: Requirements 3.1, 3.2, 3.5**

  - [ ]* 2.3 Write property test for NRIC redaction fail-closed
    - **Property 5: NRIC Redaction Fail-Closed**
    - Generate adversarial inputs (null, undefined, special characters); verify `NricRedactionError` is thrown rather than returning unredacted text
    - **Validates: Requirements 3.6**

  - [ ]* 2.4 Write unit tests for NRIC redactor
    - Test known NRIC formats (S1234567A, T9876543Z), case variations, partial NRICs, NRICs embedded in sentences, multiple NRICs in one string, empty string input
    - Create test file at `src/lib/__tests__/nric-redactor.test.ts`
    - _Requirements: 3.1, 3.2, 3.5, 3.6_

- [ ] 3. Implement file validation module
  - [ ] 3.1 Create `src/lib/file-validator.ts`
    - Implement `validateFile(file: File): { valid: boolean; error?: string }` that checks MIME type against allowed list and file size ≤ 10MB
    - Implement PDF page count validation (≤ 5 pages) — parse PDF header or use lightweight check
    - Return descriptive error messages per the API error response spec
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.10, 2.9_

  - [ ]* 3.2 Write property test for file validation
    - **Property 1: File Validation Correctness**
    - Generate random MIME types and file sizes; verify acceptance iff MIME ∈ {image/jpeg, image/png, image/webp, image/heic, application/pdf} AND size ≤ 10MB
    - **Validates: Requirements 1.2, 1.4, 1.5, 2.9**

  - [ ]* 3.3 Write unit tests for file validator
    - Test boundary cases: exactly 10MB, 10MB + 1 byte, 5-page PDF, 6-page PDF, each allowed/disallowed MIME type
    - Create test file at `src/lib/__tests__/file-validator.test.ts`
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.10_

- [ ] 4. Implement OCR pipeline module
  - [ ] 4.1 Create `src/lib/ocr-pipeline.ts`
    - Implement `processDocument(fileBuffer: ArrayBuffer, mimeType: string): Promise<{ extracted: RedactedExtractedData }>` that sends base64 image to Gemini with extraction prompt, parses JSON response, applies NRIC redaction, and returns structured data
    - Handle Gemini response parsing with fallback for malformed JSON
    - Ensure image data is discarded after Gemini response (stateless)
    - Detect empty extraction (all fields null/empty) and throw `OcrExtractionError`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.11, 3.3, 4.1, 4.2_

  - [ ]* 4.2 Write property test for OCR response parsing
    - **Property 2: OCR Response Parsing Produces Valid Structure**
    - Generate random JSON strings with expected fields; verify parsed output matches type constraints (arrays are arrays, nulls are null, strings are strings)
    - **Validates: Requirements 2.7, 2.11**

  - [ ]* 4.3 Write property test for empty extraction detection
    - **Property 3: Empty Extraction Detection**
    - Generate extraction results where all of medicalCodes, diagnoses, visitDate, institution are empty/null; verify system classifies as failed extraction
    - **Validates: Requirements 2.6**

  - [ ]* 4.4 Write unit tests for OCR pipeline
    - Test Gemini response parsing (valid JSON, JSON wrapped in markdown code fences, malformed JSON), empty extraction detection, NRIC redaction integration
    - Mock `geminiModel.generateContent` via Vitest
    - Create test file at `src/lib/__tests__/ocr-pipeline.test.ts`
    - _Requirements: 2.1, 2.6, 2.7, 2.11, 4.1, 4.2_

- [ ] 5. Implement subsidy lookup service
  - [ ] 5.1 Create `src/lib/subsidy-lookup.ts`
    - Implement `lookupSubsidies(params: SubsidyLookupParams): Promise<SubsidyLookupResult>` that queries Supabase `subsidy_schemes` table matching on medical_codes OR condition_keywords overlap, filtered by institution clinic type mapping
    - Implement `filterByBirthYear(schemes: SubsidyScheme[], birthYear: number | undefined): SubsidyScheme[]` for age-gated scheme filtering
    - Return `{ subsidies: [], message: "Insufficient data", needsManualInput: true }` when no codes/diagnoses provided
    - Map institution name to clinic type category (public_hospital, polyclinic, gp_clinic)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7_

  - [ ]* 5.2 Write property test for subsidy query decision logic
    - **Property 6: Subsidy Query Decision Logic**
    - Generate random medicalCodes/diagnoses arrays; verify query executes iff at least one non-empty entry exists, otherwise returns insufficient data message
    - **Validates: Requirements 5.1, 5.7**

  - [ ]* 5.3 Write property test for subsidy lookup completeness
    - **Property 7: Subsidy Lookup Completeness and Filtering**
    - Generate random subsidy scheme sets and queries; verify every scheme whose codes/keywords overlap AND clinic type matches is included in results
    - **Validates: Requirements 5.2, 5.5**

  - [ ]* 5.4 Write unit tests for subsidy lookup
    - Test specific scheme matching scenarios, birth year filtering (Pioneer <1950, Merdeka 1950-1959), institution mapping, empty results message
    - Mock Supabase client via Vitest
    - Create test file at `src/lib/__tests__/subsidy-lookup.test.ts`
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 5.7_

- [ ] 6. Checkpoint - Core modules complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Create Supabase schema and seed data
  - [ ] 7.1 Create migration file for `subsidy_schemes` table
    - Create `supabase/migrations/001_create_subsidy_schemes.sql` with full schema including UUID PK, all columns, CHECK constraints, GIN indexes on medical_codes, condition_keywords, and eligible_clinic_types — copy the exact CREATE TABLE SQL from design.md as the source of truth
    - _Requirements: 5.1, 5.2_

  - [ ] 7.2 Create seed data file with Singapore subsidy schemes
    - Create `supabase/seed.sql` with INSERT statements for Pioneer Generation, Merdeka Generation, CHAS Blue/Orange/Green, MediSave CDMP, MediShield Life, and MediFund schemes
    - Include translations for cmn-Hans-CN, ms-MY, and ta-IN where available
    - Include representative medical_codes and condition_keywords for each scheme
    - _Requirements: 5.2, 6.5_

- [ ] 8. Implement client components
  - [ ] 8.1 Create `src/components/LanguageToggle.tsx`
    - Four-option toggle: English | 中文 | Melayu | தமிழ்
    - 44×44px minimum touch targets per option
    - Accept `current` and `onChange` props per design interface
    - _Requirements: 6.5, 7.9_

  - [ ] 8.2 Create `src/components/SubsidyCard.tsx`
    - Display single subsidy scheme: name, coverage description, eligibility conditions, estimated coverage percent
    - Support multilingual display with English fallback
    - 18px body text, 24px headings, WCAG AA contrast
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.7_

  - [ ] 8.3 Create `src/components/ResultsDisplay.tsx`
    - Render subsidy cards ordered by `estimatedCoveragePercent` descending
    - Summary count at top showing number of applicable schemes
    - Accept `subsidies`, `language`, and `extractedData` props
    - Fall back to English if translation unavailable for selected language
    - _Requirements: 6.1, 6.4, 6.5, 6.7_

  - [ ] 8.4 Create `src/components/TTSControls.tsx`
    - States: idle | playing | paused
    - Read Aloud, Pause, Stop buttons (44×44px touch targets)
    - Use Web Speech API with rate 0.7–0.75x
    - Language-aware voice selection (en-SG, cmn-Hans-CN, ms-MY, ta-IN)
    - Highlight currently spoken segment
    - Hide entirely if Web Speech API unsupported
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9_

  - [ ] 8.5 Create `src/components/DocumentCapture.tsx`
    - States: idle | preview | submitting | error
    - Camera button + file upload button
    - Image preview with confirm/retake
    - Accept JPEG, PNG, WebP, HEIC, PDF (≤10MB)
    - Disable camera button if permission denied/unavailable
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10_

  - [ ] 8.6 Create `src/components/LoadingProgress.tsx`
    - Display stage-specific animated indicator with text per stage (uploading, reading, finding, scanning_medication)
    - Auto-trigger `onTimeout` callback after configurable timeout (default 30s)
    - Minimum 48px width/height for indicator
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ] 8.7 Create `src/components/ManualFallbackForm.tsx`
    - Birth year dropdown (1920–current year)
    - Clinic type selector (public_hospital, polyclinic, gp_clinic)
    - Chronic condition checkboxes (CDMP list)
    - Submit handler calls API with manual data
    - _Requirements: 2.12_

  - [ ] 8.8 Create `src/components/ErrorDisplay.tsx`
    - Display error message with "Try Again" button (44×44px)
    - Distinguish retryable vs non-retryable errors
    - Show which processing stage failed
    - _Requirements: 1.8, 2.6, 2.10, 5.6, 8.5, 8.6_

- [ ] 9. Checkpoint - Components complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Rewrite API route to stateless architecture
  - [ ] 10.1 Replace `src/app/api/process-document/route.ts` with stateless implementation
    - Remove all Supabase Storage upload logic
    - Remove all `document_submissions` database persistence
    - Integrate file validation module, OCR pipeline, NRIC redaction, and subsidy lookup
    - Accept optional `birthYear`, `clinicType`, `chronicConditions` form fields for manual fallback
    - Return `ProcessDocumentResponse` shape: `{ extracted, subsidies, message, needsManualInput }`
    - Return appropriate error codes: 400 (validation), 500 (privacy/extraction/lookup), 504 (timeout)
    - Ensure image data is discarded after processing (stateless)
    - _Requirements: 2.9, 3.3, 3.6, 4.1, 4.2, 4.3, 5.1, 5.6, 5.7_

  - [ ]* 10.2 Write integration tests for the API route
    - Mock Gemini API responses, use test Supabase data
    - Test full pipeline: valid image → extraction → redaction → subsidy lookup → response
    - Test error cases: invalid file type, oversized file, privacy failure, timeout
    - Create test file at `src/app/api/process-document/__tests__/route.integration.test.ts`
    - _Requirements: 2.9, 3.6, 4.1, 5.1_

- [ ] 11. Rewrite main page with component integration
  - [ ] 11.1 Create `src/app/check/page.tsx` as the dedicated HealthKaki flow page (do NOT replace the existing landing page at `src/app/page.tsx`)
    - Implement `AppState` management (capture → processing → results → error → manual-input stages)
    - Wire DocumentCapture → API submission → LoadingProgress → ResultsDisplay flow
    - Integrate LanguageToggle (client-side state), TTSControls, ManualFallbackForm, ErrorDisplay
    - Handle retry (retain file in memory, no re-upload needed)
    - Responsive layout with accessibility: 18px body, 24px headings, 44×44px touch targets
    - _Requirements: 1.1, 1.7, 1.8, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.9, 8.1, 8.2, 8.3, 8.5, 8.6_

- [ ] 12. Property tests for UI correctness
  - [ ]* 12.1 Write property test for results ordering
    - **Property 8: Results Ordering by Coverage**
    - Generate random SubsidyResult arrays; verify displayed order is descending by `estimatedCoveragePercent`
    - Create test file at `src/components/__tests__/results-display.property.test.ts`
    - **Validates: Requirements 6.1**

  - [ ]* 12.2 Write property test for language fallback
    - **Property 9: Language Display with English Fallback**
    - Generate random SubsidyResult × SupportedLanguage combinations; verify translation used when available, English fallback when null, no empty display fields
    - Create test file at `src/components/__tests__/results-display.property.test.ts`
    - **Validates: Requirements 6.5, 6.7**

  - [ ]* 12.3 Write property test for TTS configuration
    - **Property 10: TTS Configuration Correctness**
    - For all 4 SupportedLanguage values, verify SpeechSynthesisUtterance rate ∈ [0.7, 0.75] and lang matches expected locale code
    - Create test file at `src/components/__tests__/tts-controls.property.test.ts`
    - **Validates: Requirements 7.3, 7.9**

  - [ ]* 12.4 Write unit tests for client components
    - Test DocumentCapture (file selection, preview, error states), LoadingProgress (stage transitions, timeout), ResultsDisplay (0/1/many results), TTSControls (Web Speech API unavailable), ManualFallbackForm (validation)
    - Create test files under `src/components/__tests__/`
    - _Requirements: 1.1, 1.6, 6.1, 7.7, 8.1_

- [ ] 13. Final checkpoint - Document processing integration
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Define medication-specific TypeScript types and error classes
  - [ ] 14.1 Add medication types to `src/types/index.ts`
    - Define `MedicationResult`, `MedicationExtraction`, `MedicationOcrResult`, `HandwritingDetectionResult`, `ProcessMedicationResponse` interfaces
    - Define `HandwritingDetectedError` error class with `instruction` property and safety warning message
    - Define `MedicationExtractionError` error class supporting "unreadable" and "not_medication" variants
    - Add `"scanning_medication"` to `ProcessingStage` type
    - Add medication-related states to `AppState`: `medication-capture`, `medication-processing`, `medication-results`, `medication-error`
    - _Requirements: 9.2, 9.5, 9.6, 9.8, 9.9, 9.14_

- [ ] 15. Implement handwriting detector module
  - [ ] 15.1 Create `src/lib/handwriting-detector.ts`
    - Implement `detectHandwriting(imageBuffer: ArrayBuffer, mimeType: string): Promise<HandwritingDetectionResult>` using Gemini 1.5 Flash with the handwriting detection prompt from design.md
    - Return structured `{ isHandwritten: boolean, confidence: number, reason: string | null }`
    - Err on the side of caution: if any doubt, classify as handwritten for patient safety
    - Handle Gemini response parsing with fallback for malformed JSON (default to isHandwritten=true on parse failure for safety)
    - _Requirements: 9.4, 9.5, 9.6, 9.7_

  - [ ]* 15.2 Write property test for handwriting rejection safety
    - **Property 13: Handwriting Rejection Safety**
    - Generate random `HandwritingDetectionResult` with `isHandwritten=true`; verify response contains safety warning about misread handwriting and instruction to scan only official printed labels
    - Create test file at `src/lib/__tests__/handwriting-detector.property.test.ts`
    - **Validates: Requirements 9.6, 9.7**

  - [ ]* 15.3 Write unit tests for handwriting detector
    - Test Gemini response parsing (valid JSON, malformed JSON defaults to handwritten=true)
    - Test with mocked handwritten detection result (confidence thresholds)
    - Test with mocked printed-only detection result
    - Create test file at `src/lib/__tests__/handwriting-detector.test.ts`
    - _Requirements: 9.5, 9.6, 9.7_

- [ ] 16. Implement medication OCR module
  - [ ] 16.1 Create `src/lib/medication-ocr.ts`
    - Implement `extractMedicationInfo(imageBuffer: ArrayBuffer, mimeType: string): Promise<MedicationOcrResult>` using Gemini 1.5 Flash with the medication extraction prompt from design.md
    - Implement `isValidMedicationExtraction(extraction): extraction is MedicationExtraction` type guard (checks medicationName is non-null and non-empty)
    - Implement `isBelowConfidenceThreshold(confidence: number): boolean` with threshold of 0.7
    - Handle Gemini response parsing: set missing fields to null/empty/0 per Property 11 spec
    - Return structured `MedicationOcrResult` with `success`, `extraction`, and `error` fields
    - _Requirements: 9.2, 9.8, 9.9, 9.10, 9.13_

  - [ ]* 16.2 Write property test for medication OCR response parsing
    - **Property 11: Medication OCR Response Parsing**
    - Generate random JSON strings with medication fields; verify parsed output has medicationName as string or null, purpose as string, dosageFrequency as string, confidence as number in [0,1]; missing fields default correctly
    - Create test file at `src/lib/__tests__/medication-ocr.property.test.ts`
    - **Validates: Requirements 9.2, 9.8**

  - [ ]* 16.3 Write property test for medication extraction quality decision
    - **Property 14: Medication Extraction Quality Decision**
    - Generate random medication names (string|null) × confidence values in [0,1]; verify: null/empty name → reject, non-empty name + confidence<0.7 → low_confidence warning, non-empty name + confidence≥0.7 → success with no warning
    - Create test file at `src/lib/__tests__/medication-ocr.property.test.ts`
    - **Validates: Requirements 9.9, 9.10**

  - [ ]* 16.4 Write property test for handwriting detection gate ordering
    - **Property 12: Handwriting Detection Gate Ordering**
    - Generate random images with mocked detection/extraction services; verify handwriting detection always executes before medication OCR, and if isHandwritten=true, medication OCR does NOT execute
    - Create test file at `src/lib/__tests__/medication-pipeline.property.test.ts`
    - **Validates: Requirements 9.5**

  - [ ]* 16.5 Write unit tests for medication OCR
    - Test `extractMedicationInfo` with mocked Gemini responses: valid medication label, missing fields, malformed JSON
    - Test `isValidMedicationExtraction` with null, empty string, and valid medication names
    - Test `isBelowConfidenceThreshold` at boundary (0.69, 0.7, 0.71)
    - Create test file at `src/lib/__tests__/medication-ocr.test.ts`
    - _Requirements: 9.2, 9.8, 9.9, 9.10_

- [ ] 17. Implement medication client components
  - [ ] 17.1 Create `src/components/MedicationScanner.tsx`
    - States: idle | preview | submitting | handwriting_rejected | error | results
    - Dedicated "Scan Medication" button distinct from document capture button
    - Accept JPEG, PNG, WebP, HEIC only (no PDF for medication labels), ≤10MB
    - Image preview with confirm/retake (same pattern as DocumentCapture)
    - Accept `onSubmit`, `isProcessing`, and `language` props per design interface
    - _Requirements: 9.1, 9.4_

  - [ ] 17.2 Create `src/components/MedicationResultDisplay.tsx`
    - Display medication name (20px font minimum), purpose (18px), dosage frequency (18px) in selected language
    - Show low confidence warning banner when `showWarning=true` advising pharmacist verification
    - Fall back to English if translation unavailable for selected language
    - Include TTS "Read Aloud" button for medication info (reuse TTSControls)
    - Accept `medication`, `language`, and `showWarning` props per design interface
    - _Requirements: 9.3, 9.10, 9.11, 9.12_

  - [ ] 17.3 Create `src/components/HandwritingWarning.tsx`
    - Warning icon and bold safety message
    - Explanation: handwritten labels cannot be accepted because misread handwriting may lead to incorrect medication information
    - Instruction: scan only official printed labels from pharmacy or manufacturer
    - "Try Again" button (44×44px touch target) and "Cancel" button
    - Accept `onRetry` and `onCancel` props per design interface
    - _Requirements: 9.6, 9.7_

  - [ ]* 17.4 Write property test for medication display language support
    - **Property 15: Medication Display with Language Support**
    - Generate random MedicationResult × all 4 SupportedLanguage values; verify medicationName always shown in original form, purpose/dosageFrequency use translation when available else English fallback, no empty display fields
    - Create test file at `src/components/__tests__/medication-result-display.property.test.ts`
    - **Validates: Requirements 9.3**

  - [ ]* 17.5 Write property test for medication TTS content completeness
    - **Property 16: Medication TTS Content Completeness**
    - Generate random MedicationResult × languages; verify TTS text content includes medicationName, purpose (in selected language), and dosageFrequency (in selected language)
    - Create test file at `src/components/__tests__/medication-tts.property.test.ts`
    - **Validates: Requirements 9.12**

  - [ ]* 17.6 Write unit tests for medication components
    - Test MedicationScanner ("Scan Medication" button presence, file type restrictions, state transitions)
    - Test MedicationResultDisplay (rendering with/without warning, font sizes, language fallback)
    - Test HandwritingWarning (safety message content, button actions)
    - Create test files under `src/components/__tests__/`
    - _Requirements: 9.1, 9.3, 9.6, 9.7, 9.10, 9.11_

- [ ] 18. Implement medication API route
  - [ ] 18.1 Create `src/app/api/process-medication/route.ts`
    - Accept multipart/form-data with file (JPEG, PNG, WebP, HEIC; max 10MB — no PDF)
    - Pipeline: validate file → handwriting detection → medication OCR extraction → build response
    - Return `ProcessMedicationResponse` shape: `{ medication: {...}, warning: "low_confidence" | null }`
    - Return 422 with `handwriting_detected` error if handwriting found (include safety warning message and instruction)
    - Return 422 with `unreadable_label` error if medication name cannot be extracted
    - Return 422 with `not_medication_label` error if image is not a medication label
    - Return appropriate error codes: 400 (validation), 500 (extraction failure), 504 (timeout)
    - Ensure image data is discarded after processing (stateless)
    - _Requirements: 9.1, 9.2, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10, 9.13, 9.14_

  - [ ]* 18.2 Write integration tests for the medication API route
    - Mock Gemini API responses for handwriting detection and medication extraction
    - Test full pipeline: printed label image → handwriting check passes → extraction → success response
    - Test handwriting rejection path: handwriting detected → 422 with safety warning
    - Test unreadable label path: extraction returns null name → 422 error
    - Test not-medication-label path: no medication content → 422 error
    - Test low confidence path: confidence < 0.7 → 200 with warning
    - Test file validation: invalid type, oversized file → 400 error
    - Create test file at `src/app/api/process-medication/__tests__/route.integration.test.ts`
    - _Requirements: 9.2, 9.5, 9.6, 9.9, 9.10, 9.14_

- [ ] 19. Integrate medication scanning flow into page
  - [ ] 19.1 Update `src/app/check/page.tsx` to add medication scanning flow
    - Add medication-related `AppState` stages: `medication-capture`, `medication-processing`, `medication-results`, `medication-error`
    - Wire MedicationScanner → `/api/process-medication` submission → LoadingProgress (scanning_medication stage) → MedicationResultDisplay flow
    - Integrate HandwritingWarning component for handwriting rejection state
    - Handle low_confidence warning display in MedicationResultDisplay
    - Add "Scan Medication" button on main interface (distinct from document capture)
    - Handle retry for medication scanning (retain file in memory)
    - Integrate TTSControls for medication results (read medication name, purpose, dosage aloud)
    - _Requirements: 9.1, 9.3, 9.6, 9.7, 9.10, 9.12_

- [ ] 20. Final checkpoint - Full integration with medication features
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Existing files (`src/lib/gemini.ts`, `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`) are NOT modified — new modules import from them
- Tasks 10.1 and 11.1 fully replace existing file contents (not incremental edits) to align with the stateless design architecture
- Task 19.1 modifies the page created in 11.1 to add medication scanning flow alongside the existing document scanning flow
- Vitest and fast-check need to be installed as dev dependencies before running tests
- The medication scanning pipeline shares the same Gemini model instance as the document pipeline but uses distinct prompts
- Handwriting detection defaults to `isHandwritten=true` on parse failure (fail-safe for patient safety)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "3.1", "7.1", "14.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "3.2", "3.3", "4.1", "5.1", "7.2", "15.1"] },
    { "id": 3, "tasks": ["4.2", "4.3", "4.4", "5.2", "5.3", "5.4", "15.2", "15.3", "16.1"] },
    { "id": 4, "tasks": ["8.1", "8.2", "8.6", "8.7", "8.8", "16.2", "16.3", "16.4", "16.5"] },
    { "id": 5, "tasks": ["8.3", "8.4", "8.5", "17.1", "17.2", "17.3"] },
    { "id": 6, "tasks": ["10.1", "11.1", "17.4", "17.5", "17.6", "18.1"] },
    { "id": 7, "tasks": ["10.2", "12.1", "12.2", "12.3", "12.4", "18.2"] },
    { "id": 8, "tasks": ["19.1"] }
  ]
}
```

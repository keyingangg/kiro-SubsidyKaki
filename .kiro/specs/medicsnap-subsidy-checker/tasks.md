# Implementation Plan: HealthKaki

## Overview

This plan implements the real backend logic for HealthKaki and wires the existing screen components (built by the team) to live API responses. The existing screens (`Home`, `Camera`, `Confirm`, `Processing`, `Results`, `Details`, `BillScreen`, `MedicationsScreen`, `ErrorScreen`, `History`, `Help`, `Settings`) provide the full UI. The Gemini wrapper (`src/lib/gemini.ts`), TTS system (`src/lib/tts.ts`), i18n (`src/lib/i18n.tsx`), and UI components (`src/components/ui.tsx`) are already in place.

**What exists:** Complete UI screens with mock data (`MOCK_RESULT`), TTS, i18n, navigation.
**What's needed:** Real OCR pipeline, NRIC redaction, subsidy matching logic, medication translation, API route, and wiring screens to real data.

## Tasks

- [ ] 1. Update types and add new interfaces
  - [ ] 1.1 Update `src/lib/types.ts`
    - Add `DocumentType` type: "referral_letter" | "diagnosis_letter" | "prescription_letter" | "follow_up_letter" | "specialist_memo" | "unknown"
    - Add `RawExtractedData` and `RedactedExtractedData` interfaces for OCR pipeline output
    - Add `RedactionResult` interface
    - Add `SubsidyLookupResult` interface with `insufficientData`, `message`, `suggestions` fields
    - Add `MedicationTranslation` interface for medication label scanning
    - Add `ProcessMode` type: "check_subsidies" | "translate_medication"
    - Ensure existing `SubsidyCard`, `Medication`, `ErrorType` types are compatible with new API response shapes
    - _Requirements: 2.8, 5.3, 6.1_

- [ ] 2. Implement NRIC redaction module
  - [ ] 2.1 Create `src/lib/nric-redactor.ts`
    - Implement `FULL_NRIC_PATTERN` (/[STFGstfg]\d{7}[A-Za-z]/g) and `PARTIAL_NRIC_PATTERN` (/[STFGstfg]\d{4,6}[A-Za-z]/g)
    - Implement `redactNric(text: string): RedactionResult` — fail-closed (throws on any error)
    - Implement `redactExtractedData(data: RawExtractedData): RedactedExtractedData` — applies redaction to all string fields and arrays
    - On error: throw rather than return potentially unredacted text
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3. Implement file validation module
  - [ ] 3.1 Create `src/lib/file-validator.ts`
    - Implement `validateFile(file: File | Blob, mimeType: string, size: number): { valid: boolean; error?: string }`
    - Allowed MIME types: image/jpeg, image/png, image/webp, image/heic, application/pdf
    - Max size: 10MB
    - PDF max pages: 5
    - Return descriptive error messages matching API error spec
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.10_

- [ ] 4. Implement OCR pipeline
  - [ ] 4.1 Create `src/lib/ocr-pipeline.ts`
    - Implement `processDocumentForSubsidies(fileBuffer: ArrayBuffer, mimeType: string, docTypeHint?: string): Promise<{ extracted: RedactedExtractedData }>`
    - Build Gemini prompt that instructs extraction of: documentType, institutions, conditions, documentDate, clinicType, medications, rawText
    - Parse Gemini JSON response (handle markdown code fences, malformed JSON gracefully)
    - Apply NRIC redaction to all text fields via `redactExtractedData`
    - Detect empty extraction (all fields null/empty) and throw error
    - Discard image buffer after Gemini response
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.11, 3.3, 4.1, 4.2_

- [ ] 5. Implement subsidy eligibility logic
  - [ ] 5.1 Create `src/lib/subsidy-schemes.ts`
    - Define static `SUBSIDY_SCHEMES` array with all Singapore schemes: Pioneer Generation, Merdeka Generation, CHAS Blue, CHAS Orange, CHAS Green, CHAS CDMP, MediSave, MediShield Life, MediFund
    - Each scheme has: schemeName, schemeType, eligibleClinicTypes, conditionKeywords, coverageDescription, eligibilityConditions
    - Include translations for zh, ms, ta where applicable
    - _Requirements: 5.2, 5.3, 7.5_

  - [ ] 5.2 Create `src/lib/subsidy-logic.ts`
    - Implement `hasEnoughDataForSubsidyMatch(data: RedactedExtractedData): boolean`
      - Returns false if: no conditions AND no clinicType AND no medications AND documentType is "unknown"
    - Implement `lookupSubsidies(extracted: RedactedExtractedData): SubsidyLookupResult`
      - Match conditions against scheme conditionKeywords (case-insensitive substring match)
      - Filter by clinicType against scheme eligibleClinicTypes
      - Document-type-specific logic:
        - referral_letter: match referred-to institution type + conditions
        - diagnosis_letter: match chronic conditions for CDMP
        - prescription_letter: check MediSave eligibility for medications
        - follow_up_letter: verify by institution + condition
        - specialist_memo: comprehensive match
      - Return `insufficientData: true` with suggestions when data is too generic
      - Map results to existing `SubsidyCard` type shape for the Results_Screen
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 5.6, 5.7_

- [ ] 6. Implement medication label translation
  - [ ] 6.1 Create `src/lib/medication-translator.ts`
    - Implement `translateMedicationLabel(fileBuffer: ArrayBuffer, mimeType: string, targetLanguage: string): Promise<{ medications: Medication[] }>`
    - Build Gemini prompt that: extracts medication name, purpose (plain language), dosage, frequency, timing, warnings; detects handwritten text; translates to target language
    - Output must conform to existing `Medication` type (with id, name, genericName, icon, purpose, dosage, frequency, timing, specialNotes, translations)
    - Return indicator if handwriting detected
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ] 7. Checkpoint — Core modules complete
  - Verify all logic modules compile and basic functionality works. Ask user if questions arise.

- [ ] 8. Rewrite API route
  - [ ] 8.1 Replace `src/app/api/process-document/route.ts` with dual-mode implementation
    - Accept multipart/form-data with fields: file, mode, docType (optional), language (optional)
    - **check_subsidies mode:**
      1. Validate file (type, size)
      2. Call `processDocumentForSubsidies` (Gemini OCR + NRIC redaction)
      3. Call `lookupSubsidies` on extracted data
      4. Return `SubsidyCheckResponse` shape matching what Results_Screen expects
    - **translate_medication mode:**
      1. Validate file
      2. Call `translateMedicationLabel` (Gemini)
      3. Return `MedicationTranslationResponse` with Medication[] matching MedicationsScreen
    - Error responses: 400 (validation), 500 (privacy/extraction), 504 (timeout)
    - Enforce 30s timeout
    - Ensure stateless: image buffer discarded after processing
    - _Requirements: 1.4, 1.5, 2.10, 3.5, 4.1, 4.2, 4.3, 5.6, 6.7_

- [ ] 9. Wire screens to real API
  - [ ] 9.1 Update `src/App.tsx` — add state for API response data
    - Add state: `apiResult` (holds full API response), `processMode` ("check_subsidies" | "translate_medication")
    - Pass real data to Results_Screen, Details_Screen, BillScreen, MedicationsScreen instead of MOCK_RESULT
    - Pass `processMode` so Processing_Screen knows which mode is running
    - _Requirements: 7.1, 7.3, 7.4_

  - [ ] 9.2 Update `src/screens/Processing.tsx` — make API call during processing animation
    - On mount: submit the file + mode to `/api/process-document`
    - Map API call progress to the existing stage animation (keep visual timing similar)
    - On success: store result in App state, navigate to Results or MedicationsScreen based on mode
    - On failure: navigate to ErrorScreen with appropriate errorType
    - On timeout (30s): navigate to ErrorScreen with errorType "processing"
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 9.3 Update `src/screens/Results.tsx` — use real data instead of MOCK_RESULT
    - Accept API response data as props (or read from App state)
    - Replace all `MOCK_RESULT` references with real data
    - Handle `insufficientData` case by navigating to ErrorScreen
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 9.4 Update `src/screens/BillScreen.tsx` — use real bill line data
    - Accept real `billLines` from API response instead of MOCK_RESULT
    - _Requirements: 7.1_

  - [ ] 9.5 Update `src/screens/MedicationsScreen.tsx` — use real medication data
    - Accept real `medications` array from API response (either from document extraction or medication label translation)
    - Handle case where medications come from label scan (translation mode)
    - _Requirements: 6.5, 7.7_

  - [ ] 9.6 Update `src/screens/Home.tsx` — add medication scan CTA and rebrand to HealthKaki
    - Add a "Translate Medication Label" button/CTA alongside existing "Scan Medical Document"
    - Update logo reference and branding text from MediScan/SubsidyKaki to HealthKaki
    - Set `processMode` when user picks a CTA
    - _Requirements: 6.1, 7.5_

  - [ ] 9.7 Update `src/screens/Confirm.tsx` — pass mode to processing
    - When user confirms, include the selected mode (subsidies vs medication) in the submit action
    - For medication mode: skip document type picker, show medication-specific guidance text
    - _Requirements: 6.1_

- [ ] 10. Checkpoint — Full integration
  - Verify end-to-end flow works for both modes:
    1. Subsidy check: Home → Camera → Confirm → Processing → Results (with real subsidies)
    2. Medication scan: Home → Camera → Confirm → Processing → MedicationsScreen (with real translations)
  - Verify error flows: bad image → ErrorScreen, generic referral → "no_subsidies" screen
  - Ask user if questions arise.

## Notes

- The existing screen components are the source of truth for UI — do NOT redesign them. Wire real data into the existing props/patterns.
- `MOCK_RESULT` in `src/lib/utils.ts` defines the exact shape the screens expect. The API response must conform to this shape.
- Subsidy scheme data is static TypeScript (not Supabase) — simple to maintain and update.
- The app uses a Vite React SPA for the frontend with a Next.js API route at `src/app/api/process-document/route.ts` for server-side processing.
- Branding change: MediScan/SubsidyKaki → HealthKaki throughout.
- The `src/lib/gemini.ts` wrapper already exists — new modules import from it.
- Privacy: images never persisted, NRICs always redacted before display.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["4.1", "5.1", "6.1"] },
    { "id": 3, "tasks": ["5.2"] },
    { "id": 4, "tasks": ["8.1"] },
    { "id": 5, "tasks": ["9.1", "9.2", "9.3", "9.4", "9.5", "9.6", "9.7"] }
  ]
}
```

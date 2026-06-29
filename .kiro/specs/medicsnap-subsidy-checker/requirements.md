# Requirements Document

## Introduction

HealthKaki is a Singapore medical subsidy checker and medication translator application targeting elderly patients and their family caregivers. The application is a mobile-first web app (Vite + React SPA) with two core features:

1. **Medical Document Scanning for Subsidy Eligibility** — Users photograph medical documents (referral letters, diagnosis letters, chronic disease management letters, prescription letters, follow-up appointment letters, specialist memos) before or during their healthcare journey. The app extracts key information (institution, condition, referral type) via Gemini OCR and determines which government subsidies they may be eligible for (CHAS, CHAS CDMP, Pioneer/Merdeka Generation, MediSave caps) — ideally *before* the appointment so they can plan ahead.

2. **Medication Label Translation** — Users scan their medication's official printed label. The app translates the purpose of the medication and dosage instructions into simple, plain language. Only official printed labels are supported (no handwriting recognition).

**Key Insight:** Bills come after payment, so showing subsidies at that point is too late. Referral and diagnosis letters arrive *before* the visit — that's when knowing your subsidies is most actionable. However, referral letters sometimes contain only generic information that may not be sufficient to generate a list of eligible subsidies. In such cases, the app clearly communicates this limitation and suggests next steps.

## Glossary

- **HealthKaki_App**: The Vite + React SPA providing document scanning, subsidy checking, and medication translation
- **Home_Screen**: The landing screen (`src/screens/Home.tsx`) showing document type guidance and primary CTAs
- **Camera_Screen**: The camera/file capture screen (`src/screens/Camera.tsx`) for taking photos of documents
- **Confirm_Screen**: The review screen (`src/screens/Confirm.tsx`) where users confirm document type and consent before processing
- **Processing_Screen**: The loading screen (`src/screens/Processing.tsx`) showing progress stages
- **Results_Screen**: The results screen (`src/screens/Results.tsx`) displaying subsidy breakdown and cost summary
- **Details_Screen**: The subsidy detail screen (`src/screens/Details.tsx`) showing individual scheme details
- **BillScreen**: The bill breakdown screen (`src/screens/BillScreen.tsx`) showing line-by-line charges
- **MedicationsScreen**: The medications screen (`src/screens/MedicationsScreen.tsx`) showing medication details, dosage, timing
- **ErrorScreen**: The error screen (`src/screens/ErrorScreen.tsx`) handling various error types with retry options
- **OCR_Engine**: The Gemini 1.5 Flash model integration that extracts text and structured data from medical document images
- **NRIC_Redactor**: The component responsible for detecting and redacting Singapore NRIC numbers in extracted text
- **Medication_Translator**: The service that interprets medication labels and produces plain-language explanations
- **TTS_Module**: The Text-to-Speech component (`src/lib/tts.ts`, `src/components/TTSButton.tsx`) that reads results aloud
- **NRIC**: Singapore National Registration Identity Card number, formatted as [S/T/F/G] + seven digits + one letter suffix
- **Medical_Document**: A referral letter, diagnosis letter, chronic disease management letter, prescription letter, follow-up appointment letter, or specialist memo from a Singapore medical institution
- **Medication_Label**: An official printed pharmaceutical label containing medication name, dosage, frequency, and usage instructions
- **Document_Type**: One of: referral_letter, diagnosis_letter, prescription_letter, follow_up_letter, specialist_memo

## Requirements

### Requirement 1: Medical Document Capture

**User Story:** As an elderly user, I want to take a photo of my medical document or upload an existing image, so that I can have the system analyse it without manual data entry.

#### Acceptance Criteria

1. THE Camera_Screen SHALL provide a camera capture button and a file input for uploading from gallery
2. THE Camera_Screen SHALL accept images in JPEG, PNG, WebP, and HEIC formats
3. THE Camera_Screen SHALL accept PDF files for scanned documents containing no more than 5 pages
4. WHEN a file exceeding 10MB is selected, THE HealthKaki_App SHALL display an error message indicating the file is too large
5. WHEN a file with an unsupported format is selected, THE HealthKaki_App SHALL display an error message listing the supported formats
6. THE Confirm_Screen SHALL display a preview of the captured or uploaded image before submission
7. WHEN the user confirms the document, THE HealthKaki_App SHALL navigate to the Processing_Screen and submit the image to the processing API endpoint
8. IF the submission fails due to a network error or server error, THEN THE ErrorScreen SHALL be displayed with a retry option that retains the file without re-uploading
9. IF camera access permission is denied or unavailable, THEN THE Camera_Screen SHALL still allow file upload from gallery
10. WHEN a PDF file exceeding 5 pages is selected, THE HealthKaki_App SHALL display an error message indicating the maximum page limit

### Requirement 2: Document Type Detection and OCR Processing

**User Story:** As an elderly user, I want the system to automatically read my medical document and identify what type it is, so that I do not need to type in any details manually.

#### Acceptance Criteria

1. THE Confirm_Screen SHALL auto-detect and display the document type (referral_letter, diagnosis_letter, prescription_letter, follow_up_letter, specialist_memo) and allow the user to change it via a picker
2. WHEN a medical document image is submitted, THE OCR_Engine SHALL extract the healthcare institution name (referring institution and referred-to institution if applicable)
3. WHEN a medical document image is submitted, THE OCR_Engine SHALL extract any medical conditions, diagnoses, or reasons for referral mentioned in the document
4. WHEN a medical document image is submitted, THE OCR_Engine SHALL extract the date of the document
5. WHEN a medical document image is submitted, THE OCR_Engine SHALL extract any mentioned clinic type (public hospital, polyclinic, specialist outpatient clinic, GP clinic)
6. WHEN a medical document image is submitted, THE OCR_Engine SHALL extract any medications mentioned in the document
7. IF the OCR_Engine determines the submitted image does not contain recognisable medical content, THEN THE ErrorScreen SHALL be displayed with errorType "upload" informing the user the image does not appear to be a medical document
8. THE OCR_Engine SHALL return extracted data as a structured JSON object containing documentType, institutions (array), conditions (array of strings), documentDate (ISO 8601 or null), clinicType (string or null), medications (array), and rawText (string) fields
9. IF the OCR_Engine extracts none of the structured fields (all empty or null), THEN THE ErrorScreen SHALL be displayed with errorType "upload" suggesting the user retake the photo with better lighting
10. IF the OCR_Engine does not return a result within 30 seconds, THEN THE ErrorScreen SHALL be displayed with errorType "processing" indicating timeout
11. WHEN the OCR_Engine extracts only a subset of structured fields, THE OCR_Engine SHALL return null or empty arrays for fields that could not be identified, and THE Results_Screen SHALL present the partially extracted data
12. WHEN the extracted data is too generic or insufficient to determine subsidy eligibility, THE ErrorScreen SHALL be displayed with errorType "no_subsidies" informing the user and suggesting they try a more detailed document

### Requirement 3: NRIC Detection and Redaction

**User Story:** As an elderly user, I want my NRIC number to be automatically hidden from processed documents, so that my personal identity is protected.

#### Acceptance Criteria

1. WHEN text is extracted from a document, THE NRIC_Redactor SHALL detect all NRIC numbers matching the case-insensitive pattern of one letter prefix (S, T, F, or G) followed by seven digits followed by one letter suffix
2. WHEN an NRIC number is detected in extracted text, THE NRIC_Redactor SHALL replace the NRIC number with the placeholder text "[REDACTED]"
3. THE NRIC_Redactor SHALL redact NRIC numbers before any extracted text is displayed to the user
4. IF the NRIC_Redactor encounters a partial NRIC pattern (a prefix letter S, T, F, or G followed by between 4 and 6 digits followed by one letter suffix), THEN THE NRIC_Redactor SHALL still redact the partial match
5. IF the NRIC_Redactor encounters an error during processing, THEN THE HealthKaki_App SHALL reject the document and display the ErrorScreen with errorType "processing" rather than risk exposing unredacted NRIC numbers

### Requirement 4: Stateless Document Processing

**User Story:** As an elderly user, I want my document photo to be processed privately, so that my personal medical information is never stored on any server.

#### Acceptance Criteria

1. THE HealthKaki_App SHALL process all uploaded images in server memory only and SHALL NOT write image data to any database or file storage system
2. THE HealthKaki_App SHALL discard all image binary data immediately after the OCR API response is returned
3. THE HealthKaki_App SHALL NOT store raw extracted text in any database — only the computed result is returned in the API response
4. IF a user closes the app, THE HealthKaki_App SHALL retain no trace of the uploaded document

### Requirement 5: Subsidy Eligibility Lookup

**User Story:** As an elderly user, I want to know which government medical subsidies I may be eligible for based on my medical document, so that I can plan ahead and reduce my out-of-pocket healthcare costs.

#### Acceptance Criteria

1. WHEN extracted medical data contains at least one condition/diagnosis OR a specific institution with clinic type, THE HealthKaki_App SHALL determine applicable subsidy schemes
2. THE HealthKaki_App SHALL cover the following Singapore government medical subsidy schemes: Pioneer Generation Package, Merdeka Generation Package, CHAS Blue, CHAS Orange, CHAS Green, CHAS CDMP (Chronic Disease Management Programme), MediSave (including MediSave caps for outpatient treatments), MediShield Life, and MediFund
3. WHEN matching subsidy schemes are found, THE Results_Screen SHALL display subsidy cards with scheme name, eligibility badge, savings amount, and out-of-pocket cost per the existing UI pattern
4. WHEN no matching subsidy scheme is found OR the document does not contain enough information, THE ErrorScreen SHALL be displayed with errorType "no_subsidies" suggesting the user try a different document or contact MOH SilverLine
5. THE subsidy lookup SHALL consider the document type when determining subsidies:
   - Referral letters: identify referred-to institution type and condition for pre-visit subsidy planning
   - Diagnosis/CDMP letters: identify chronic conditions eligible for CHAS CDMP coverage
   - Prescription letters: identify if medications are claimable under MediSave
   - Follow-up letters: verify ongoing subsidy eligibility based on institution and condition
   - Specialist memos: extract diagnostic information for comprehensive subsidy matching
6. IF the subsidy lookup fails due to a system error, THEN THE ErrorScreen SHALL be displayed with errorType "processing" and a retry option
7. IF extracted data contains no conditions, no specific institution type, and no medications, THEN THE ErrorScreen SHALL be displayed with errorType "no_subsidies" indicating insufficient information

### Requirement 6: Medication Label Translation

**User Story:** As an elderly user, I want to scan my medication label and understand in simple language what the medicine is for and how often I should take it, so that I can manage my medications safely.

#### Acceptance Criteria

1. WHEN a medication label image is submitted in medication scan mode, THE Medication_Translator SHALL extract the medication name, purpose/indication, dosage, frequency, and any special instructions from the official printed label
2. THE Medication_Translator SHALL only process official printed pharmaceutical labels and SHALL NOT attempt to read handwritten text
3. IF the image contains handwritten text instead of a printed label, THE Medication_Translator SHALL inform the user that only official printed labels are supported
4. THE Medication_Translator SHALL present the translation in simple, plain language that a non-medical person can understand (e.g., "This medicine helps lower your blood sugar" rather than "Oral hypoglycaemic agent for glycaemic control")
5. THE MedicationsScreen SHALL clearly display: medication name, what it's for (purpose in plain language), how often to take it (frequency + timing), and any important warnings — using the existing card-based layout with expandable details
6. THE Medication_Translator SHALL support displaying results in English (default), Simplified Chinese, Bahasa Melayu, and Tamil using the existing i18n system
7. IF the Medication_Translator cannot identify the medication or read the label clearly, THEN THE ErrorScreen SHALL be displayed with errorType "upload" suggesting retaking the photo or consulting their pharmacist

### Requirement 7: Results Presentation

**User Story:** As an elderly user, I want the subsidy information and medication translations presented clearly and simply, so that I can understand the information without confusion.

#### Acceptance Criteria

1. WHEN subsidy results are available, THE Results_Screen SHALL display each applicable subsidy scheme as a card with icon, scheme name, eligibility badge, savings amount, and out-of-pocket cost — matching the existing UI pattern
2. THE HealthKaki_App SHALL use the existing large font sizes (body ≥ 18px, headings ≥ 24px) and high-contrast colours across all screens
3. THE Results_Screen SHALL display a hero cost card at the top showing final out-of-pocket cost, total savings, and original bill amount
4. THE Results_Screen SHALL provide navigation to Details_Screen (per subsidy), BillScreen (line-by-line breakdown), and MedicationsScreen
5. THE HealthKaki_App SHALL display results in the user's selected language using the existing i18n system (English, 中文, Melayu, தமிழ்)
6. IF no applicable subsidy schemes are found or insufficient information was extracted, THEN THE ErrorScreen SHALL display with errorType "no_subsidies" with helpful guidance
7. THE MedicationsScreen SHALL present medication information in expandable cards with TTS buttons per medication, daily schedule visual, and safety disclaimers — matching the existing layout

### Requirement 8: Text-to-Speech Accessibility

**User Story:** As an elderly user with limited vision, I want the results read aloud to me, so that I can understand the information without straining to read the screen.

#### Acceptance Criteria

1. THE TTSButton component SHALL be available on Results_Screen, BillScreen, MedicationsScreen, and Details_Screen, with a minimum touch target of 44×44px
2. WHEN the user activates a TTSButton, THE TTS_Module SHALL read the associated text content aloud using the Web Speech API
3. THE TTS_Module SHALL use a configurable speaking rate (default 0.7–0.75x) adjustable in Settings_Screen
4. THE TTS_Module SHALL support four language voices: English (en-SG), Simplified Chinese (cmn-Hans-CN), Bahasa Melayu (ms-MY), and Tamil (ta-IN) — matching the selected app language
5. IF the Web Speech API is not supported by the user's browser, THEN THE TTSButton SHALL be hidden gracefully
6. THE MedicationsScreen SHALL provide a "Listen to all medication instructions" button that reads all medications sequentially

### Requirement 9: Loading and Progress Feedback

**User Story:** As an elderly user, I want clear feedback while my document is being processed, so that I know the application is working and I do not need to take any action.

#### Acceptance Criteria

1. THE Processing_Screen SHALL display an animated progress ring with stage-specific labels: "Scanning document…", "Removing personal data…", "Checking your subsidies…", "Calculating final cost…"
2. THE Processing_Screen SHALL show a percentage progress indicator and rotating reassurance messages about privacy/security
3. WHEN processing completes, THE Processing_Screen SHALL show "Analysis complete!" with a success icon and auto-navigate to Results_Screen
4. IF processing does not complete within 30 seconds, THEN THE HealthKaki_App SHALL navigate to ErrorScreen with errorType "processing" and a retry option
5. THE Processing_Screen SHALL display stage progress dots showing overall pipeline advancement

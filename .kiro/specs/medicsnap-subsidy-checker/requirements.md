# Requirements Document

## Introduction

HealthKaki is a Singapore medical assistant application targeting elderly users who need help understanding their medical bills, subsidy eligibility, and medication labels. The application provides two core features: (1) a Medical Subsidy Checker that allows users to photograph medical documents (receipts, bills, referral letters), extracts structured data via Gemini OCR, automatically detects and redacts NRIC numbers for privacy, looks up applicable government medical subsidies from a Supabase database, and presents results with Text-to-Speech output for accessibility; and (2) a Medication Label Scanner that allows users to photograph medication packaging to understand what their medicine is for and how to take it, in their preferred language. The system is built on Next.js 14 with existing integrations to Google Gemini and Supabase.

## Glossary

- **HealthKaki_App**: The Next.js web application that provides the medical document scanning and subsidy checking interface
- **Document_Capture_Module**: The component responsible for capturing or uploading medical document images from the user's device camera or file system
- **OCR_Engine**: The Gemini 1.5 Flash model integration that extracts text and structured data from medical document images
- **NRIC_Redactor**: The component responsible for detecting and redacting Singapore National Registration Identity Card numbers in extracted text
- **Subsidy_Lookup_Service**: The server-side service that queries the Supabase database to determine applicable medical subsidies based on extracted document data
- **TTS_Module**: The Text-to-Speech component that reads subsidy results aloud to the user for accessibility
- **NRIC**: Singapore National Registration Identity Card number, formatted as one letter prefix [S/T/F/G], seven digits, and one letter suffix (e.g., S1234567A)
- **Medical_Document**: A receipt, bill, referral letter, or other healthcare-related document from a Singapore medical institution
- **Subsidy_Result**: The computed eligibility information including scheme name, coverage percentage, and applicable conditions
- **Medication_Scanner**: The component responsible for capturing medication label images and coordinating OCR extraction of medication purpose and dosage frequency information
- **Medication_Label**: An official printed label on medicine packaging, including pharmacy-printed stickers and manufacturer labels, containing medication name, purpose, and dosage instructions
- **Medication_Result**: The structured output containing the medication name, translated purpose description, and dosage frequency in the user's selected language
- **Handwriting_Detector**: The validation component within the OCR_Engine pipeline that identifies handwritten text on medication images and rejects submissions containing handwriting

## Requirements

### Requirement 1: Medical Document Capture

**User Story:** As an elderly user, I want to take a photo of my medical document or upload an existing image, so that I can have the system analyse it without manual data entry.

#### Acceptance Criteria

1. THE Document_Capture_Module SHALL provide a camera capture button and a file upload button on the main interface
2. THE Document_Capture_Module SHALL accept images in JPEG, PNG, WebP, and HEIC formats
3. THE Document_Capture_Module SHALL accept PDF files for scanned documents containing no more than 5 pages
4. WHEN a file exceeding 10MB is selected, THE Document_Capture_Module SHALL display an error message indicating the file is too large
5. WHEN a file with an unsupported format is selected, THE Document_Capture_Module SHALL display an error message listing the supported formats
6. THE Document_Capture_Module SHALL display a preview of the captured or uploaded image before submission
7. WHEN the user confirms the document image, THE Document_Capture_Module SHALL display a loading indicator and submit the image to the processing API endpoint
8. IF the submission to the processing API endpoint fails due to a network error or server error, THEN THE Document_Capture_Module SHALL display an error message indicating the submission failed and allow the user to retry without re-uploading the document
9. IF camera access permission is denied by the user or unavailable on the device, THEN THE Document_Capture_Module SHALL disable the camera capture button and display a message directing the user to use the file upload option instead
10. WHEN a PDF file exceeding 5 pages is selected, THE Document_Capture_Module SHALL display an error message indicating the maximum page limit

### Requirement 2: Gemini OCR Document Processing

**User Story:** As an elderly user, I want the system to automatically read my medical document, so that I do not need to type in any details manually.

#### Acceptance Criteria

1. WHEN a medical document image is submitted, THE OCR_Engine SHALL extract medical codes (ICD-10, SNOMED, or local clinic codes) from the document
2. WHEN a medical document image is submitted, THE OCR_Engine SHALL extract diagnosis or condition names from the document
3. WHEN a medical document image is submitted, THE OCR_Engine SHALL extract the date of visit from the document
4. WHEN a medical document image is submitted, THE OCR_Engine SHALL extract the healthcare institution name from the document
5. WHEN a medical document image is submitted, THE OCR_Engine SHALL extract the full text content of the document
6. IF the OCR_Engine extracts none of the structured fields (medicalCodes, diagnoses, visitDate, and institution are all empty or null), THEN THE HealthKaki_App SHALL display an error message indicating the document could not be read and suggesting the user retake the photo with better lighting or angle
7. THE OCR_Engine SHALL return extracted data as a structured JSON object containing medicalCodes (array of strings), diagnoses (array of strings), visitDate (ISO 8601 date string in YYYY-MM-DD format or null), institution (string or null), and rawText (string) fields
8. IF the OCR_Engine determines the submitted image does not contain medical content, THEN THE HealthKaki_App SHALL inform the user that the image does not appear to be a medical document
9. WHEN a medical document image is submitted, THE HealthKaki_App SHALL accept only JPEG, PNG, WebP, HEIC, or PDF files with a maximum file size of 10 MB
10. IF the OCR_Engine does not return a result within 30 seconds, THEN THE HealthKaki_App SHALL display an error message indicating the request timed out and suggesting the user try again
11. WHEN the OCR_Engine extracts only a subset of structured fields, THE OCR_Engine SHALL return null or an empty array for any fields that could not be identified, and THE HealthKaki_App SHALL present the partially extracted data to the user
12. WHEN the OCR_Engine cannot extract birth year OR clinic type with sufficient confidence, THE HealthKaki_App SHALL display a manual fallback form with a birth year dropdown, clinic type selector, and chronic condition checkboxes, and SHALL NOT display a dead-end error screen

### Requirement 3: NRIC Detection and Redaction

**User Story:** As an elderly user, I want my NRIC number to be automatically hidden from stored documents, so that my personal identity is protected.

#### Acceptance Criteria

1. WHEN text is extracted from a document, THE NRIC_Redactor SHALL detect all NRIC numbers matching the case-insensitive pattern of one letter prefix (S, T, F, or G) followed by seven digits followed by one letter suffix
2. WHEN an NRIC number is detected in extracted text, THE NRIC_Redactor SHALL replace the NRIC number with the placeholder text "[REDACTED]"
3. THE NRIC_Redactor SHALL redact NRIC numbers before any extracted text is stored in the database
4. THE NRIC_Redactor SHALL redact NRIC numbers before any extracted text is displayed to the user in results
5. IF the NRIC_Redactor encounters a partial NRIC pattern (a prefix letter S, T, F, or G followed by between 4 and 6 digits followed by one letter suffix), THEN THE NRIC_Redactor SHALL still redact the partial match to prevent information leakage
6. IF the NRIC_Redactor encounters an error during processing, THEN THE HealthKaki_App SHALL reject the document processing request and return an error rather than risk exposing unredacted NRIC numbers

### Requirement 4: Stateless Document Processing

**User Story:** As an elderly user, I want my document photo 
to be processed privately, so that my personal medical 
information is never stored on any server.

#### Acceptance Criteria

1. THE HealthKaki_App SHALL process all uploaded images in server memory only and SHALL NOT write image data to any database or file storage system
2. THE HealthKaki_App SHALL discard all image binary data immediately after the OCR API response is returned
3. THE HealthKaki_App SHALL NOT store raw extracted text in any database — only the computed subsidy result may be held temporarily in the API response
4. IF a user closes the app, THE HealthKaki_App SHALL retain no trace of the uploaded document

### Requirement 5: Subsidy Eligibility Lookup

**User Story:** As an elderly user, I want to know which government medical subsidies I may be eligible for based on my medical document, so that I can reduce my out-of-pocket healthcare costs.

#### Acceptance Criteria

1. WHEN extracted medical data is available and contains at least one non-empty medicalCodes entry or one non-empty diagnoses entry, THE Subsidy_Lookup_Service SHALL query the Supabase "subsidy_schemes" table for matching subsidy schemes based on medical codes and diagnoses
2. THE Subsidy_Lookup_Service SHALL return all applicable Singapore government medical subsidy schemes including Pioneer Generation Package (born before 1950), Merdeka Generation Package (born 1950–1959), CHAS Blue, CHAS Orange, CHAS Green, MediSave CDMP, MediShield Life, and MediFund
3. WHEN a matching subsidy scheme is found, THE Subsidy_Lookup_Service SHALL return the scheme name, coverage description, eligibility conditions, and estimated coverage percentage
4. WHEN no matching subsidy scheme is found, THE Subsidy_Lookup_Service SHALL return a message indicating no subsidies were found and suggest the user consult a medical social worker
5. THE Subsidy_Lookup_Service SHALL filter subsidy results by the institution type extracted from the document, mapping the institution name to one of the categories: public hospital, polyclinic, or GP clinic
6. IF the subsidy database query fails, THEN THE HealthKaki_App SHALL display a user-friendly error message and suggest the user try again later
7. IF extracted medical data contains no medicalCodes and no diagnoses (both are empty arrays or null), THEN THE Subsidy_Lookup_Service SHALL skip the database query and return a message indicating insufficient data was extracted to determine subsidy eligibility

### Requirement 6: Results Presentation

**User Story:** As an elderly user, I want the subsidy information presented clearly and simply, so that I can understand what financial help is available to me.

#### Acceptance Criteria

1. WHEN subsidy results are available, THE HealthKaki_App SHALL display each applicable subsidy scheme as a distinct card with the scheme name, coverage description, and eligibility conditions, ordered by estimated coverage amount from highest to lowest
2. THE HealthKaki_App SHALL use a minimum font size of 18px for body text and 24px for headings in the results display
3. THE HealthKaki_App SHALL use high-contrast colours meeting WCAG 2.1 AA contrast ratio requirements (minimum 4.5:1 for body text)
4. WHEN subsidy results are displayed, THE HealthKaki_App SHALL include a summary section at the top showing the total number of applicable schemes found
5. THE HealthKaki_App SHALL display results in the user's selected language, supporting English (default), Simplified Chinese, Bahasa Melayu, and Tamil, controlled by the same language toggle used by the TTS_Module. WHERE a translation for a subsidy scheme is unavailable in the selected language, THE HealthKaki_App SHALL fall back to displaying that scheme's card in English.
6. IF no applicable subsidy schemes are found, THEN THE HealthKaki_App SHALL display a message indicating that no matching schemes were identified and suggest the user verify their document or consult a nearby Community Centre for assistance
7. IF a subsidy scheme does not have a translation available in the selected language, THEN THE HealthKaki_App SHALL display that scheme's card in English only.

### Requirement 7: Text-to-Speech Accessibility

**User Story:** As an elderly user with limited vision, I want the subsidy results read aloud to me, so that I can understand the information without straining to read the screen.

#### Acceptance Criteria

1. WHEN subsidy results are displayed, THE TTS_Module SHALL provide a "Read Aloud" button with a minimum touch target size of 44×44 CSS pixels, positioned at the top of the results section
2. WHEN the user activates the "Read Aloud" button, THE TTS_Module SHALL read all visible subsidy results text content aloud using the Web Speech API, in top-to-bottom document order
3. THE TTS_Module SHALL use a speaking rate between 0.7x and 0.75x normal speed (inclusive) to accommodate elderly listeners
4. WHILE the TTS_Module is reading aloud, THE TTS_Module SHALL display pause and stop controls with a minimum touch target size of 44×44 CSS pixels each
5. WHILE the TTS_Module is reading aloud, THE TTS_Module SHALL visually highlight the text segment currently being spoken using a background color that meets a minimum contrast ratio of 3:1 against surrounding unhighlighted text
6. IF the English (Singapore) voice locale (en-SG) is available on the device, THEN THE TTS_Module SHALL use en-SG as the speech voice locale; otherwise THE TTS_Module SHALL use the device default English locale
7. IF the Web Speech API is not supported by the user's browser, THEN THE TTS_Module SHALL hide the "Read Aloud" button and display no error
8. WHEN the TTS_Module finishes reading all content or the user activates the stop control, THE TTS_Module SHALL remove the text highlight, hide the pause and stop controls, and restore the "Read Aloud" button to its initial state
9. THE TTS_Module SHALL support four language options: English (en-SG), Simplified Chinese (cmn-Hans-CN), Bahasa Melayu (ms-MY), and Tamil (ta-IN), selectable via a language toggle visible on the results screen

### Requirement 8: Loading and Progress Feedback

**User Story:** As an elderly user, I want clear feedback while my document is being processed, so that I know the application is working and I do not need to take any action.

#### Acceptance Criteria

1. WHILE the document is being uploaded, THE HealthKaki_App SHALL display an animated progress indicator with the text "Uploading your document..." within 500 milliseconds of the upload starting
2. WHILE the OCR_Engine is processing the document, THE HealthKaki_App SHALL display an animated progress indicator with the text "Reading your document..." within 500 milliseconds of the OCR stage starting
3. WHILE the Subsidy_Lookup_Service is querying subsidies, THE HealthKaki_App SHALL display an animated progress indicator with the text "Finding your subsidies..." within 500 milliseconds of the subsidy lookup starting
4. THE HealthKaki_App SHALL display progress indicators with a minimum width and height of 48px
5. IF any processing stage (upload, OCR, or subsidy lookup) does not complete within 30 seconds, THEN THE HealthKaki_App SHALL display an error message indicating the operation timed out and provide an option to retry
6. IF a processing stage fails due to an error, THEN THE HealthKaki_App SHALL replace the progress indicator with an error message indicating which stage failed and provide an option to retry


### Requirement 9: Medication Label Scanning and Translation

**User Story:** As an elderly user, I want to scan the label on my medication packaging, so that I can understand what the medication is for and how often I should take it, in my preferred language.

#### Acceptance Criteria

1. THE Medication_Scanner SHALL provide a dedicated "Scan Medication" button on the main interface, distinct from the medical document capture button
2. WHEN a medication label image is submitted, THE OCR_Engine SHALL extract the medication name, purpose (indication), and dosage frequency from the label
3. WHEN medication information is successfully extracted, THE Medication_Scanner SHALL display the medication name, a plain-language explanation of the medication purpose, and the dosage frequency translated into the user's selected language (English, Simplified Chinese, Bahasa Melayu, or Tamil)
4. THE Medication_Scanner SHALL accept only images of official printed labels, including pharmacy-printed stickers and manufacturer-printed labels on medication packaging
5. WHEN a medication label image is submitted, THE Handwriting_Detector SHALL analyse the image for the presence of handwritten text before proceeding with medication data extraction
6. IF the Handwriting_Detector identifies handwritten text in the submitted image, THEN THE Medication_Scanner SHALL reject the submission and display a safety warning explaining that handwritten labels cannot be accepted because misread handwriting may lead to incorrect medication information
7. IF the Handwriting_Detector identifies handwritten text, THEN THE Medication_Scanner SHALL instruct the user to scan only official printed labels from the pharmacy or manufacturer
8. WHEN medication information is extracted, THE OCR_Engine SHALL return a structured JSON object containing medicationName (string), purpose (string), dosageFrequency (string), and confidence (number between 0 and 1) fields
9. IF the OCR_Engine cannot extract the medication name from the label, THEN THE Medication_Scanner SHALL display an error message indicating the label could not be read and suggest the user retake the photo with better lighting, ensuring the printed text is clearly visible
10. IF the OCR_Engine extracts medication information with a confidence value below 0.7, THEN THE Medication_Scanner SHALL display the extracted information with a visible warning advising the user to verify the details with a pharmacist
11. THE Medication_Scanner SHALL use a minimum font size of 20px for the medication name and 18px for the purpose and dosage frequency text in the results display
12. WHEN medication results are displayed, THE TTS_Module SHALL provide a "Read Aloud" button to read the medication name, purpose, and dosage frequency aloud at a speaking rate between 0.7x and 0.75x normal speed
13. THE Medication_Scanner SHALL process medication label images using the same Gemini OCR_Engine integration used for medical document processing, with a medication-specific extraction prompt
14. IF the OCR_Engine determines the submitted image does not contain a medication label (no medication name or dosage information identifiable), THEN THE Medication_Scanner SHALL inform the user that the image does not appear to be a medication label and suggest scanning the printed sticker or label on the medication box or bottle

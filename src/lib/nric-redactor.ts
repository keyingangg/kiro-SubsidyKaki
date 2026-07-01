/**
 * NRIC Redaction Module
 *
 * Dual-layer NRIC redaction:
 * Layer 1: Gemini prompt instructs model to redact during extraction
 * Layer 2: Deterministic regex applied to ALL output text fields (this module)
 *
 * Fail-closed: if regex execution throws, the entire request is rejected
 * via NricRedactionError rather than returning potentially unredacted text.
 *
 * Requirements: 3.1, 3.2, 3.4, 3.5, 3.6
 */

import type { RawExtractedData, RedactedExtractedData, RedactionResult } from "@/types";
import { NricRedactionError } from "@/types";

// Full NRIC: prefix letter (S, T, F, G) + 7 digits + suffix letter
export const FULL_NRIC_PATTERN = /[STFGstfg]\d{7}[A-Za-z]/g;

// Partial NRIC: prefix letter (S, T, F, G) + 4-6 digits + suffix letter
export const PARTIAL_NRIC_PATTERN = /[STFGstfg]\d{4,6}[A-Za-z]/g;

// Combined pattern for single-pass redaction (4-7 digits covers both full and partial)
export const ALL_NRIC_PATTERN = /[STFGstfg]\d{4,7}[A-Za-z]/g;

const REDACTION_PLACEHOLDER = "[REDACTED]";

/**
 * Redacts all NRIC patterns (full and partial) from the given text.
 *
 * Fail-closed semantics:
 * - Throws NricRedactionError on null/undefined input
 * - Throws NricRedactionError if any error occurs during regex processing
 * - Throws NricRedactionError if NRIC patterns remain after redaction (verification step)
 *
 * @param text - The input text to redact NRIC patterns from
 * @returns RedactionResult with the redacted text and count of redactions
 * @throws NricRedactionError on any error condition
 */
export function redactNric(text: string): RedactionResult {
  try {
    // Fail-closed: reject null/undefined input
    if (text === null || text === undefined) {
      throw new NricRedactionError("Input text is null or undefined");
    }

    // Handle empty string — no redaction needed
    if (text === "") {
      return {
        success: true,
        redactedText: "",
        redactionCount: 0,
      };
    }

    // Reset regex lastIndex to ensure clean state (global flag)
    ALL_NRIC_PATTERN.lastIndex = 0;

    // Count matches before replacement
    const matches = text.match(ALL_NRIC_PATTERN);
    const redactionCount = matches ? matches.length : 0;

    // Perform single-pass redaction using combined pattern
    ALL_NRIC_PATTERN.lastIndex = 0;
    const redactedText = text.replace(ALL_NRIC_PATTERN, REDACTION_PLACEHOLDER);

    // Verification: ensure no NRIC patterns remain in the output
    ALL_NRIC_PATTERN.lastIndex = 0;
    const remainingMatches = redactedText.match(ALL_NRIC_PATTERN);
    if (remainingMatches && remainingMatches.length > 0) {
      throw new NricRedactionError(
        `NRIC patterns remain after redaction: ${remainingMatches.length} pattern(s) found`
      );
    }

    return {
      success: true,
      redactedText,
      redactionCount,
    };
  } catch (error) {
    // Re-throw NricRedactionError as-is
    if (error instanceof NricRedactionError) {
      throw error;
    }
    // Wrap any other error in NricRedactionError (fail-closed)
    throw new NricRedactionError(
      `NRIC redaction failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Applies NRIC redaction to all string fields in an extracted document.
 *
 * Redacts:
 * - rawText
 * - institution (if non-null)
 * - visitDate (if non-null)
 * - Each item in diagnoses array
 * - Each item in medicalCodes array
 *
 * @param data - The raw extracted data from OCR
 * @returns RedactedExtractedData with all NRIC patterns removed
 * @throws NricRedactionError if any field fails redaction
 */
export function redactExtractedData(data: RawExtractedData): RedactedExtractedData {
  try {
    // Fail-closed: reject null/undefined input
    if (data === null || data === undefined) {
      throw new NricRedactionError("Extracted data is null or undefined");
    }

    // Redact rawText
    const rawTextResult = redactNric(data.rawText);

    // Redact institution if present
    let redactedInstitution: string | null = null;
    if (data.institution !== null) {
      const institutionResult = redactNric(data.institution);
      redactedInstitution = institutionResult.redactedText;
    }

    // Redact visitDate if present
    let redactedVisitDate: string | null = null;
    if (data.visitDate !== null) {
      const visitDateResult = redactNric(data.visitDate);
      redactedVisitDate = visitDateResult.redactedText;
    }

    // Redact each diagnosis
    const redactedDiagnoses = data.diagnoses.map((diagnosis) => {
      const result = redactNric(diagnosis);
      return result.redactedText;
    });

    // Redact each medical code
    const redactedMedicalCodes = data.medicalCodes.map((code) => {
      const result = redactNric(code);
      return result.redactedText;
    });

    const redactedPrescriptions = data.prescriptions.map((prescription) => ({
      medicationName: redactNric(prescription.medicationName).redactedText,
      dosage: prescription.dosage === null ? null : redactNric(prescription.dosage).redactedText,
      frequency: prescription.frequency === null ? null : redactNric(prescription.frequency).redactedText,
      instructions: prescription.instructions === null ? null : redactNric(prescription.instructions).redactedText,
    }));

    const redactedBill = data.bill === null ? null : {
      ...data.bill,
      currency: redactNric(data.bill.currency).redactedText,
      items: data.bill.items.map((item) => ({ ...item, description: redactNric(item.description).redactedText })),
    };

    return {
      rawText: rawTextResult.redactedText,
      institution: redactedInstitution,
      visitDate: redactedVisitDate,
      diagnoses: redactedDiagnoses,
      medicalCodes: redactedMedicalCodes,
      prescriptions: redactedPrescriptions,
      bill: redactedBill,
    };
  } catch (error) {
    // Re-throw NricRedactionError as-is
    if (error instanceof NricRedactionError) {
      throw error;
    }
    // Wrap any other error in NricRedactionError (fail-closed)
    throw new NricRedactionError(
      `Extracted data redaction failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

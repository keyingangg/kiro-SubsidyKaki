import { FileValidationError } from "@/types";

// --- Constants ---

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
] as const;

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_PDF_PAGES = 5;

// --- Error Messages ---

const ERROR_UNSUPPORTED_TYPE = "Unsupported file type";
const ERROR_FILE_TOO_LARGE = "File too large (max 10MB)";
const ERROR_PDF_TOO_MANY_PAGES = "PDF exceeds 5 page limit";

// --- Public Interface ---

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a file for upload eligibility.
 * Checks MIME type against the allowed list and file size ≤ 10MB.
 */
export function validateFile(file: File): FileValidationResult {
  if (file.size === 0) {
    return { valid: false, error: "File is empty" };
  }
  // Check MIME type
  if (!isAllowedMimeType(file.type)) {
    return { valid: false, error: ERROR_UNSUPPORTED_TYPE };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: ERROR_FILE_TOO_LARGE };
  }

  return { valid: true };
}

/**
 * Validates a PDF file's page count (≤ 5 pages).
 * Uses a lightweight regex approach to count page objects in the PDF buffer.
 *
 * @param buffer - The raw PDF file content as an ArrayBuffer
 * @returns FileValidationResult indicating validity
 */
export function validatePdfPageCount(buffer: ArrayBuffer): FileValidationResult {
  const pageCount = countPdfPages(buffer);

  if (pageCount > MAX_PDF_PAGES) {
    return { valid: false, error: ERROR_PDF_TOO_MANY_PAGES };
  }

  return { valid: true };
}

/**
 * Full file validation including async PDF page count check.
 * Combines MIME/size validation with PDF-specific page count validation.
 *
 * @param file - The File object to validate
 * @returns Promise resolving to FileValidationResult
 * @throws FileValidationError on validation failure
 */
export async function validateFileComplete(
  file: File
): Promise<FileValidationResult> {
  // Run synchronous checks first
  const basicResult = validateFile(file);
  if (!basicResult.valid) {
    throw new FileValidationError(basicResult.error!);
  }

  // If PDF, check page count
  if (file.type === "application/pdf") {
    const buffer = await file.arrayBuffer();
    const pdfResult = validatePdfPageCount(buffer);
    if (!pdfResult.valid) {
      throw new FileValidationError(pdfResult.error!);
    }
  }

  return { valid: true };
}

// --- Internal Helpers ---

/**
 * Checks whether a MIME type is in the allowed list.
 */
function isAllowedMimeType(mimeType: string): boolean {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
}

/**
 * Counts the number of pages in a PDF by examining the raw bytes.
 * Uses a regex to find `/Type /Page` entries (excluding `/Type /Pages`
 * which is the page tree root, not an individual page).
 *
 * This is a lightweight heuristic that works for most standard PDFs
 * without requiring a full PDF parsing library.
 */
function countPdfPages(buffer: ArrayBuffer): number {
  const bytes = new Uint8Array(buffer);
  const text = new TextDecoder("latin1").decode(bytes);

  // Match /Type /Page but not /Type /Pages
  // The pattern looks for /Type followed by whitespace and /Page
  // but excludes /Pages (the page tree container)
  const pagePattern = /\/Type\s*\/Page(?!s)/g;
  const matches = text.match(pagePattern);

  return matches ? matches.length : 0;
}

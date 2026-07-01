import { NextRequest } from "next/server";
import { detectHandwriting } from "@/lib/handwriting-detector";
import {
  extractMedicationInfo,
  isValidMedicationExtraction,
  isBelowConfidenceThreshold,
} from "@/lib/medication-ocr";
import type { ProcessMedicationResponse, SupportedLanguage } from "@/types";

// --- Constants ---

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const PROCESSING_TIMEOUT_MS = 30_000; // 30 seconds

// --- Route Handler ---

export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file");

    // --- Validation ---

    if (!(file instanceof File)) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return Response.json({ error: "Unsupported file type" }, { status: 400 });
    }

    if (file.size === 0) {
      return Response.json({ error: "File is empty" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return Response.json(
        { error: "File too large (max 10MB)" },
        { status: 400 }
      );
    }

    // Read image buffer once — used for both detection steps
    const imageBuffer = await file.arrayBuffer();
    const mimeType = file.type;

    // --- Processing Pipeline (with timeout) ---

    const processingResult = await Promise.race([
      processMedicationPipeline(imageBuffer, mimeType),
      createTimeout(PROCESSING_TIMEOUT_MS),
    ]);

    return processingResult;
  } catch (error) {
    // Catch-all for unexpected errors
    if (
      error instanceof Error &&
      error.message === "Processing timed out"
    ) {
      return Response.json(
        { error: "Processing timed out" },
        { status: 504 }
      );
    }

    return Response.json(
      { error: "Medication extraction failed" },
      { status: 500 }
    );
  }
}

// --- Pipeline ---

async function processMedicationPipeline(
  imageBuffer: ArrayBuffer,
  mimeType: string
): Promise<Response> {
  // Step 1: Handwriting detection
  const handwritingResult = await detectHandwriting(imageBuffer, mimeType);

  if (handwritingResult.isHandwritten) {
    return Response.json(
      {
        error: "handwriting_detected",
        message:
          "Handwritten labels cannot be accepted because misread handwriting may lead to incorrect medication information",
        instruction:
          "Please scan only official printed labels from the pharmacy or manufacturer",
      },
      { status: 422 }
    );
  }

  // Step 2: Medication OCR extraction
  const ocrResult = await extractMedicationInfo(imageBuffer, mimeType);

  if (!ocrResult.success) {
    return Response.json(
      { error: "Medication extraction failed" },
      { status: 500 }
    );
  }

  // Step 3: Validate extraction quality
  const rawExtraction = ocrResult.extraction;

  if (!isValidMedicationExtraction(rawExtraction)) {
    // Determine error variant: "unreadable" vs "not_medication"
    // Use a separate null check (not the type guard) to differentiate
    const ext = ocrResult.extraction as {
      purpose?: string;
      dosageFrequency?: string;
    } | null;

    if (ext === null) {
      return Response.json(
        {
          error: "not_medication_label",
          message: "This does not appear to be a medication label.",
          instruction:
            "Please scan the printed sticker or label on the medication box or bottle.",
        },
        { status: 422 }
      );
    }

    // If extraction has partial data (purpose or dosage present), it's unreadable
    // Otherwise it's not a medication label
    const hasPartialData =
      (ext.purpose?.trim().length ?? 0) > 0 ||
      (ext.dosageFrequency?.trim().length ?? 0) > 0;

    if (hasPartialData) {
      return Response.json(
        {
          error: "unreadable_label",
          message:
            "Could not read the medication label. Please retake the photo with better lighting, ensuring the printed text is clearly visible.",
          instruction:
            "Please retake the photo with better lighting, ensuring the printed text is clearly visible",
        },
        { status: 422 }
      );
    }

    return Response.json(
      {
        error: "not_medication_label",
        message: "This does not appear to be a medication label.",
        instruction:
          "Please scan the printed sticker or label on the medication box or bottle.",
      },
      { status: 422 }
    );
  }

  // After validation, rawExtraction is guaranteed to be MedicationExtraction
  const extraction = rawExtraction;

  // Step 4: Build success response
  const warning = isBelowConfidenceThreshold(extraction.confidence)
    ? "low_confidence"
    : null;

  // Empty translations for now — actual translation logic added later
  const translations: Record<
    SupportedLanguage,
    { purpose: string; dosageFrequency: string } | null
  > = {
    "en-SG": null,
    "cmn-Hans-CN": null,
    "ms-MY": null,
    "ta-IN": null,
  };

  const response: ProcessMedicationResponse = {
    medication: {
      medicationName: extraction.medicationName,
      purpose: extraction.purpose,
      dosageFrequency: extraction.dosageFrequency,
      confidence: extraction.confidence,
      translations,
    },
    warning,
  };

  return Response.json(response, { status: 200 });
}

// --- Helpers ---

function createTimeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error("Processing timed out"));
    }, ms);
  });
}

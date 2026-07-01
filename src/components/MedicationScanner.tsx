"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Pill, Camera, Check, X, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SupportedLanguage } from "@/types";

// --- Constants ---

const ALLOWED_MEDICATION_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
] as const;

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

const ACCEPTED_EXTENSIONS = ".jpg,.jpeg,.png,.webp,.heic";

// --- Types ---

type ScannerState =
  | "idle"
  | "preview"
  | "submitting"
  | "handwriting_rejected"
  | "error"
  | "results";

interface MedicationScannerProps {
  onSubmit: (file: File) => void;
  isProcessing: boolean;
  language: SupportedLanguage;
}

// --- Validation ---

function validateMedicationFile(file: File): { valid: boolean; error?: string } {
  // Check MIME type — no PDF allowed for medication labels
  if (
    !(ALLOWED_MEDICATION_MIME_TYPES as readonly string[]).includes(file.type)
  ) {
    if (file.type === "application/pdf") {
      return {
        valid: false,
        error: "PDF files are not accepted for medication labels. Please use an image (JPEG, PNG, WebP, or HEIC).",
      };
    }
    return {
      valid: false,
      error: "Unsupported file type. Please use JPEG, PNG, WebP, or HEIC images only.",
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: "File too large (max 10MB). Please select a smaller image.",
    };
  }

  return { valid: true };
}

// --- Component ---

export function MedicationScanner({
  onSubmit,
  isProcessing,
}: MedicationScannerProps) {
  const [state, setState] = useState<ScannerState>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleFileSelected = useCallback((file: File) => {
    const validation = validateMedicationFile(file);

    if (!validation.valid) {
      setErrorMessage(validation.error ?? "Invalid file");
      setState("error");
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    // Create preview URL
    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(url);
    setErrorMessage(null);
    setState("preview");
  }, []);

  const handleCameraCapture = useCallback(() => {
    cameraInputRef.current?.click();
  }, []);

  const handleFileUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelected(file);
      }
      // Reset input value so the same file can be re-selected
      e.target.value = "";
    },
    [handleFileSelected]
  );

  const handleConfirm = useCallback(() => {
    if (!selectedFile) return;
    setState("submitting");
    onSubmit(selectedFile);
  }, [selectedFile, onSubmit]);

  const handleRetake = useCallback(() => {
    // Clean up preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMessage(null);
    setState("idle");
  }, [previewUrl]);

  const handleDismissError = useCallback(() => {
    setErrorMessage(null);
    setState("idle");
  }, []);

  // Derive effective state: if parent says isProcessing, override to submitting
  const effectiveState: ScannerState = isProcessing ? "submitting" : state;
  const isDisabled = effectiveState === "submitting";

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleInputChange}
        aria-hidden="true"
        tabIndex={-1}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        className="hidden"
        onChange={handleInputChange}
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Error state */}
      {effectiveState === "error" && errorMessage && (
        <div
          className="w-full bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col items-center gap-3"
          role="alert"
        >
          <AlertCircle className="w-8 h-8 text-red-500" aria-hidden="true" />
          <p className="text-base text-red-700 text-center font-medium">
            {errorMessage}
          </p>
          <button
            onClick={handleDismissError}
            disabled={isDisabled}
            className={cn(
              "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150",
              "bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50",
              "text-base px-5 py-3 min-h-[44px] min-w-[44px]",
              "active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/40",
              "disabled:opacity-50 disabled:pointer-events-none"
            )}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Image preview state */}
      {effectiveState === "preview" && previewUrl && (
        <div className="w-full flex flex-col items-center gap-4">
          <div className="relative w-full max-w-sm rounded-2xl overflow-hidden border border-neutral-200 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Medication label preview"
              className="w-full h-auto object-contain max-h-64"
            />
          </div>

          {/* Confirm / Retake buttons */}
          <div className="flex gap-3 w-full max-w-sm">
            <button
              onClick={handleRetake}
              disabled={isDisabled}
              className={cn(
                "flex-1 inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150",
                "bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50 shadow-sm",
                "text-base px-4 py-3 min-h-[44px] min-w-[44px]",
                "active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/40",
                "disabled:opacity-50 disabled:pointer-events-none"
              )}
              aria-label="Retake photo"
            >
              <X className="w-5 h-5" aria-hidden="true" />
              Retake
            </button>
            <button
              onClick={handleConfirm}
              disabled={isDisabled}
              className={cn(
                "flex-1 inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150",
                "bg-teal-500 text-white hover:bg-teal-600 shadow-sm",
                "text-base px-4 py-3 min-h-[44px] min-w-[44px]",
                "active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-400/40",
                "disabled:opacity-50 disabled:pointer-events-none"
              )}
              aria-label="Confirm and scan medication"
            >
              <Check className="w-5 h-5" aria-hidden="true" />
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* Submitting / Processing state */}
      {effectiveState === "submitting" && (
        <div className="w-full flex flex-col items-center gap-3 py-6">
          <Loader2
            className="w-10 h-10 text-teal-500 animate-spin"
            aria-hidden="true"
          />
          <p className="text-base text-neutral-600 font-medium">
            Reading your medication label...
          </p>
        </div>
      )}

      {/* Idle state — Scan Medication button */}
      {effectiveState === "idle" && (
        <div className="w-full flex flex-col items-center gap-3">
          {/* Primary: Camera capture */}
          <button
            onClick={handleCameraCapture}
            disabled={isDisabled}
            className={cn(
              "w-full max-w-sm inline-flex items-center justify-center gap-3 font-semibold rounded-2xl transition-all duration-150",
              "bg-teal-500 text-white hover:bg-teal-600 shadow-md",
              "text-lg px-6 py-4 min-h-[56px]",
              "active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-400/40",
              "disabled:opacity-50 disabled:pointer-events-none"
            )}
            aria-label="Scan medication label using camera"
          >
            <Pill className="w-6 h-6" aria-hidden="true" />
            Scan Medication
          </button>

          {/* Secondary: File upload */}
          <button
            onClick={handleFileUpload}
            disabled={isDisabled}
            className={cn(
              "w-full max-w-sm inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150",
              "bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50 shadow-sm",
              "text-base px-5 py-3 min-h-[44px] min-w-[44px]",
              "active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/40",
              "disabled:opacity-50 disabled:pointer-events-none"
            )}
            aria-label="Upload medication label image from gallery"
          >
            <Camera className="w-5 h-5" aria-hidden="true" />
            Upload from Gallery
          </button>
        </div>
      )}
    </div>
  );
}

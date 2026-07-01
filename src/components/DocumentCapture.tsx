"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { Camera, Upload, Check, X, FileText, AlertCircle } from "lucide-react";
import { validateFile, validatePdfPageCount } from "@/lib/file-validator";
import { cn } from "@/lib/utils";

// --- Types ---

type CaptureState = "idle" | "preview" | "submitting" | "error";

interface DocumentCaptureProps {
  onSubmit: (file: File) => void;
  isProcessing: boolean;
}

// --- Component ---

export default function DocumentCapture({
  onSubmit,
  isProcessing,
}: DocumentCaptureProps) {
  const [state, setState] = useState<CaptureState>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameraAvailable, setCameraAvailable] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    // Check if mediaDevices is available (basic camera support check)
    return !!navigator.mediaDevices;
  });

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  // Cleanup preview URL to prevent memory leaks
  const cleanupPreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  // Validate selected file (async for PDF page count)
  const handleFileSelected = useCallback(
    async (file: File) => {
      // Run basic validation (MIME type + size)
      const result = validateFile(file);
      if (!result.valid) {
        setErrorMessage(result.error ?? "Invalid file");
        setState("error");
        return;
      }

      // For PDFs, validate page count
      if (file.type === "application/pdf") {
        try {
          const buffer = await file.arrayBuffer();
          const pdfResult = validatePdfPageCount(buffer);
          if (!pdfResult.valid) {
            setErrorMessage(pdfResult.error ?? "Invalid PDF");
            setState("error");
            return;
          }
        } catch {
          setErrorMessage("Could not read PDF file");
          setState("error");
          return;
        }
      }

      // File is valid — show preview
      cleanupPreview();
      setSelectedFile(file);

      if (file.type === "application/pdf") {
        // PDF: no image preview, use placeholder
        setPreviewUrl(null);
      } else {
        // Image: generate preview URL
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }

      setErrorMessage(null);
      setState("preview");
    },
    [cleanupPreview]
  );

  // Handle file input change events
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelected(file);
      }
      // Reset the input so the same file can be re-selected
      e.target.value = "";
    },
    [handleFileSelected]
  );

  // Camera button click
  const handleCameraClick = useCallback(() => {
    if (!cameraAvailable) return;
    cameraInputRef.current?.click();
  }, [cameraAvailable]);

  // File upload button click
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Confirm submission
  const handleConfirm = useCallback(() => {
    if (!selectedFile) return;
    setState("submitting");
    onSubmit(selectedFile);
  }, [selectedFile, onSubmit]);

  // Retake / go back to idle
  const handleRetake = useCallback(() => {
    cleanupPreview();
    setSelectedFile(null);
    setErrorMessage(null);
    setState("idle");
  }, [cleanupPreview]);

  // Retry from error state
  const handleRetry = useCallback(() => {
    setErrorMessage(null);
    setState("idle");
  }, []);

  // Camera permission error handler
  const handleCameraError = useCallback(() => {
    setCameraAvailable(false);
  }, []);

  // Determine if we're in submitting state (from parent prop or local state)
  const isSubmitting = isProcessing || state === "submitting";

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleInputChange}
        aria-hidden="true"
        onError={handleCameraError}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.heic,.pdf"
        className="hidden"
        onChange={handleInputChange}
        aria-hidden="true"
      />

      {/* Idle State: Show capture buttons */}
      {state === "idle" && (
        <div className="flex flex-col items-center gap-4 w-full">
          <p className="text-lg text-neutral-600 text-center">
            Take a photo of your medical document or upload a file
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            {/* Camera button */}
            <button
              type="button"
              onClick={handleCameraClick}
              disabled={!cameraAvailable}
              className={cn(
                "flex items-center justify-center gap-3 w-full min-h-[44px] min-w-[44px] px-6 py-4 rounded-xl text-lg font-semibold transition-colors",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/40",
                cameraAvailable
                  ? "bg-teal-700 text-white hover:bg-teal-800 active:bg-teal-800"
                  : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
              )}
              aria-label="Take photo with camera"
            >
              <Camera className="w-6 h-6 flex-shrink-0" />
              <span>Take Photo</span>
            </button>

            {/* File upload button */}
            <button
              type="button"
              onClick={handleUploadClick}
              className={cn(
                "flex items-center justify-center gap-3 w-full min-h-[44px] min-w-[44px] px-6 py-4 rounded-xl text-lg font-semibold transition-colors",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/40",
                "bg-white text-neutral-700 border-2 border-neutral-300 hover:border-teal-500 hover:text-teal-700 active:bg-neutral-50"
              )}
              aria-label="Upload file from device"
            >
              <Upload className="w-6 h-6 flex-shrink-0" />
              <span>Upload File</span>
            </button>
          </div>

          {/* Camera unavailable message */}
          {!cameraAvailable && (
            <p className="text-sm text-neutral-500 text-center mt-1">
              Camera not available. Please use the file upload option.
            </p>
          )}

          {/* Supported formats hint */}
          <p className="text-sm text-neutral-400 text-center">
            Supported: JPEG, PNG, WebP, HEIC, PDF (max 10MB)
          </p>
        </div>
      )}

      {/* Preview State: Show image/document preview with confirm/retake */}
      {state === "preview" && selectedFile && (
        <div className="flex flex-col items-center gap-4 w-full max-w-md">
          {/* Preview area */}
          <div className="w-full rounded-xl overflow-hidden border-2 border-neutral-200 bg-neutral-50">
            {previewUrl ? (
              // Image preview
              <Image
                src={previewUrl}
                alt="Document preview"
                width={800}
                height={1000}
                unoptimized
                className="w-full max-h-[400px] object-contain"
              />
            ) : (
              // PDF placeholder
              <div className="flex flex-col items-center justify-center gap-3 py-12">
                <FileText className="w-16 h-16 text-neutral-400" />
                <p className="text-lg text-neutral-600 font-medium">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-neutral-400">PDF Document</p>
              </div>
            )}
          </div>

          {/* Confirm / Retake buttons */}
          <div className="flex gap-4 w-full">
            <button
              type="button"
              onClick={handleRetake}
              disabled={isSubmitting}
              className={cn(
                "flex items-center justify-center gap-2 flex-1 min-h-[44px] min-w-[44px] px-5 py-3 rounded-xl text-lg font-semibold transition-colors",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-400/40",
                "bg-white text-neutral-700 border-2 border-neutral-300 hover:border-neutral-400",
                isSubmitting && "opacity-50 cursor-not-allowed"
              )}
              aria-label="Retake photo"
            >
              <X className="w-5 h-5 flex-shrink-0" />
              <span>Retake</span>
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className={cn(
                "flex items-center justify-center gap-2 flex-1 min-h-[44px] min-w-[44px] px-5 py-3 rounded-xl text-lg font-semibold transition-colors",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-400/40",
                "bg-green-600 text-white hover:bg-green-700 active:bg-green-800",
                isSubmitting && "opacity-50 cursor-not-allowed"
              )}
              aria-label="Confirm and submit document"
            >
              {isSubmitting ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <span>Confirm</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Submitting State (when parent isProcessing is true but we haven't transitioned) */}
      {state === "submitting" && !isProcessing && (
        <div className="flex flex-col items-center gap-4">
          <span className="w-12 h-12 border-4 border-teal-100 border-t-teal-700 rounded-full animate-spin" />
          <p className="text-lg text-neutral-600">Submitting document...</p>
        </div>
      )}

      {/* Error State: Show error with retry */}
      {state === "error" && (
        <div className="flex flex-col items-center gap-4 w-full max-w-md">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 w-full">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-lg text-red-700 font-medium">
                {errorMessage ?? "Something went wrong"}
              </p>
              <p className="text-sm text-red-600 mt-1">
                Please try again with a different file.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRetry}
            className={cn(
              "flex items-center justify-center gap-2 min-h-[44px] min-w-[44px] px-6 py-3 rounded-xl text-lg font-semibold transition-colors",
              "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/40",
              "bg-teal-700 text-white hover:bg-teal-800 active:bg-teal-800"
            )}
            aria-label="Try again"
          >
            <span>Try Again</span>
          </button>
        </div>
      )}
    </div>
  );
}

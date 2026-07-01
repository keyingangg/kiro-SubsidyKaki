"use client";

import { useState, useCallback } from "react";
import DocumentCapture from "@/components/DocumentCapture";
import LoadingProgress from "@/components/LoadingProgress";
import ResultsDisplay from "@/components/ResultsDisplay";
import ErrorDisplay from "@/components/ErrorDisplay";
import LanguageToggle from "@/components/LanguageToggle";
import TTSControls from "@/components/TTSControls";
import ManualFallbackForm from "@/components/ManualFallbackForm";
import { MedicationScanner } from "@/components/MedicationScanner";
import MedicationResultDisplay from "@/components/MedicationResultDisplay";
import HandwritingWarning from "@/components/HandwritingWarning";
import type {
  AppState,
  ProcessingStage,
  SupportedLanguage,
  ManualInputData,
  ProcessDocumentResponse,
  MedicationResult,
} from "@/types";

// ============================================================
// HealthKaki Check Page — Document Subsidy & Medication Scanning Flow
// Requirements: 1.1, 1.7, 1.8, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.9, 8.1, 8.2, 8.3, 8.5, 8.6, 9.1, 9.3, 9.6, 9.7, 9.10, 9.12
// ============================================================

type CaptureMode = "document" | "medication";

const INITIAL_STATE: AppState = {
  stage: "capture",
  processingStage: null,
  selectedFile: null,
  previewUrl: null,
  extractedData: null,
  subsidyResults: [],
  medicationResult: null,
  medicationWarning: null,
  handwritingRejected: false,
  language: "en-SG",
  error: null,
};

export default function CheckPage() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [captureMode, setCaptureMode] = useState<CaptureMode>("document");

  // Check if Web Speech API is available for TTS
  const [ttsSupported] = useState(
    () => typeof window !== "undefined" && "speechSynthesis" in window
  );

  // --- Language change handler ---
  const handleLanguageChange = useCallback((lang: SupportedLanguage) => {
    setState((prev) => ({ ...prev, language: lang }));
  }, []);

  // --- Process document via API ---
  const processDocument = useCallback(async (file: File) => {
    setState((prev) => ({
      ...prev,
      stage: "processing",
      processingStage: "uploading" as ProcessingStage,
      selectedFile: file,
      error: null,
    }));

    try {
      // Simulate stage progression for UX feedback
      setState((prev) => ({ ...prev, processingStage: "uploading" }));

      const formData = new FormData();
      formData.append("file", file);

      // Transition to "reading" stage once upload starts
      setState((prev) => ({ ...prev, processingStage: "reading" }));

      const response = await fetch("/api/process-document", {
        method: "POST",
        body: formData,
      });

      // Transition to "finding" stage while parsing response
      setState((prev) => ({ ...prev, processingStage: "finding" }));

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(
          errorBody?.error || `Processing failed (${response.status})`
        );
      }

      const data: ProcessDocumentResponse = await response.json();

      if (data.needsManualInput) {
        setState((prev) => ({
          ...prev,
          stage: "manual-input",
          processingStage: null,
          extractedData: data.extracted,
          subsidyResults: data.subsidies,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          stage: "results",
          processingStage: null,
          extractedData: data.extracted,
          subsidyResults: data.subsidies,
        }));
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setState((prev) => ({
        ...prev,
        stage: "error",
        processingStage: null,
        error: {
          message,
          instruction: "Please try again or use a different document.",
          retryable: true,
          stage: prev.processingStage ?? undefined,
        },
      }));
    }
  }, []);

  // --- File submission from DocumentCapture ---
  const handleFileSubmit = useCallback(
    (file: File) => {
      processDocument(file);
    },
    [processDocument]
  );

  // --- Retry: re-process the retained file ---
  const handleRetry = useCallback(() => {
    if (state.selectedFile) {
      processDocument(state.selectedFile);
    } else {
      // No file retained — go back to capture
      setState((prev) => ({
        ...prev,
        stage: "capture",
        error: null,
        processingStage: null,
      }));
    }
  }, [state.selectedFile, processDocument]);

  // --- Timeout during processing ---
  const handleTimeout = useCallback(() => {
    setState((prev) => ({
      ...prev,
      stage: "error",
      processingStage: null,
      error: {
        message: "Processing is taking too long",
        instruction: "Please try again. If the problem persists, try a clearer photo.",
        retryable: true,
        stage: prev.processingStage ?? undefined,
      },
    }));
  }, []);

  // --- Process medication via API ---
  const processMedication = useCallback(async (file: File) => {
    setState((prev) => ({
      ...prev,
      stage: "medication-processing",
      processingStage: "scanning_medication" as ProcessingStage,
      selectedFile: file,
      error: null,
      handwritingRejected: false,
      medicationResult: null,
      medicationWarning: null,
    }));

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/process-medication", {
        method: "POST",
        body: formData,
      });

      if (response.status === 422) {
        const errorBody = await response.json().catch(() => null);
        if (errorBody?.error === "handwriting_detected") {
          setState((prev) => ({
            ...prev,
            stage: "medication-error",
            processingStage: null,
            handwritingRejected: true,
            error: {
              message: errorBody.message || "Handwritten label detected",
              instruction: errorBody.instruction || "Please scan only official printed labels.",
              retryable: true,
              type: "handwriting_detected",
            },
          }));
          return;
        }
      }

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(
          errorBody?.error || `Processing failed (${response.status})`
        );
      }

      const data: { medication: MedicationResult; warning: "low_confidence" | null } = await response.json();

      setState((prev) => ({
        ...prev,
        stage: "medication-results",
        processingStage: null,
        medicationResult: data.medication,
        medicationWarning: data.warning,
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setState((prev) => ({
        ...prev,
        stage: "medication-error",
        processingStage: null,
        error: {
          message,
          instruction: "Please try again or use a different image.",
          retryable: true,
          stage: "scanning_medication",
        },
      }));
    }
  }, []);

  // --- Medication file submission from MedicationScanner ---
  const handleMedicationSubmit = useCallback(
    (file: File) => {
      processMedication(file);
    },
    [processMedication]
  );

  // --- Medication retry: re-process retained file ---
  const handleMedicationRetry = useCallback(() => {
    if (state.selectedFile) {
      processMedication(state.selectedFile);
    } else {
      setState((prev) => ({
        ...prev,
        stage: "medication-capture",
        error: null,
        processingStage: null,
        handwritingRejected: false,
      }));
    }
  }, [state.selectedFile, processMedication]);

  // --- Cancel from medication error — go back to medication capture ---
  const handleMedicationCancel = useCallback(() => {
    setState((prev) => ({
      ...prev,
      stage: "capture",
      error: null,
      processingStage: null,
      handwritingRejected: false,
      medicationResult: null,
      medicationWarning: null,
      selectedFile: null,
    }));
    setCaptureMode("medication");
  }, []);

  // --- Manual fallback form submission ---
  const handleManualSubmit = useCallback(
    async (data: ManualInputData) => {
      setState((prev) => ({
        ...prev,
        stage: "processing",
        processingStage: "finding",
        error: null,
      }));

      try {
        const formData = new FormData();
        if (state.selectedFile) {
          formData.append("file", state.selectedFile);
        }
        formData.append("birthYear", String(data.birthYear));
        formData.append("clinicType", data.clinicType);
        formData.append(
          "chronicConditions",
          JSON.stringify(data.chronicConditions)
        );

        const response = await fetch("/api/process-document", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => null);
          throw new Error(
            errorBody?.error || `Processing failed (${response.status})`
          );
        }

        const result: ProcessDocumentResponse = await response.json();

        setState((prev) => ({
          ...prev,
          stage: "results",
          processingStage: null,
          extractedData: result.extracted,
          subsidyResults: result.subsidies,
        }));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong";
        setState((prev) => ({
          ...prev,
          stage: "error",
          processingStage: null,
          error: {
            message,
            instruction: "Please try again.",
            retryable: true,
            stage: "finding",
          },
        }));
      }
    },
    [state.selectedFile]
  );

  // --- Compose TTS text from subsidies ---
  const composeTtsText = useCallback((): string => {
    if (state.subsidyResults.length === 0) {
      return "No matching subsidy schemes were found for your document.";
    }

    const lang = state.language;
    const lines = state.subsidyResults.map((s) => {
      const translation = s.translations[lang];
      const name = translation?.schemeName || s.schemeName;
      const desc =
        translation?.coverageDescription || s.coverageDescription;
      return `${name}: ${desc}. Estimated coverage: ${s.estimatedCoveragePercent}%.`;
    });

    return `Found ${state.subsidyResults.length} subsidy schemes. ${lines.join(" ")}`;
  }, [state.subsidyResults, state.language]);

  // --- Render ---
  return (
    <main
      className="flex flex-col items-center min-h-screen px-4 py-6 sm:px-6 md:py-10"
      style={{ fontSize: "18px" }}
    >
      <div className="w-full max-w-lg flex flex-col gap-6">
        {/* Header with language toggle — always visible */}
        <header className="flex flex-col items-center gap-4">
          <h1
            className="font-bold text-neutral-900 text-center"
            style={{ fontSize: "24px" }}
          >
            HealthKaki Subsidy Checker
          </h1>
          <LanguageToggle
            current={state.language}
            onChange={handleLanguageChange}
          />
        </header>

        {/* Stage: Capture — with mode toggle */}
        {state.stage === "capture" && (
          <div className="flex flex-col gap-4">
            {/* Mode toggle tabs */}
            <div className="flex w-full rounded-xl bg-neutral-100 p-1" role="tablist" aria-label="Scan mode">
              <button
                role="tab"
                aria-selected={captureMode === "document"}
                onClick={() => setCaptureMode("document")}
                className={`flex-1 rounded-lg py-2.5 text-base font-semibold transition-colors min-h-[44px] ${
                  captureMode === "document"
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                Check Subsidies
              </button>
              <button
                role="tab"
                aria-selected={captureMode === "medication"}
                onClick={() => setCaptureMode("medication")}
                className={`flex-1 rounded-lg py-2.5 text-base font-semibold transition-colors min-h-[44px] ${
                  captureMode === "medication"
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                Scan Medication
              </button>
            </div>

            {/* Document capture mode */}
            {captureMode === "document" && (
              <DocumentCapture
                onSubmit={handleFileSubmit}
                isProcessing={false}
              />
            )}

            {/* Medication capture mode */}
            {captureMode === "medication" && (
              <MedicationScanner
                onSubmit={handleMedicationSubmit}
                isProcessing={false}
                language={state.language}
              />
            )}
          </div>
        )}

        {/* Stage: Medication Capture (dedicated — reached via back navigation) */}
        {state.stage === "medication-capture" && (
          <MedicationScanner
            onSubmit={handleMedicationSubmit}
            isProcessing={false}
            language={state.language}
          />
        )}

        {/* Stage: Processing */}
        {state.stage === "processing" && state.processingStage && (
          <LoadingProgress
            stage={state.processingStage}
            onTimeout={handleTimeout}
            timeoutMs={30000}
          />
        )}

        {/* Stage: Results */}
        {state.stage === "results" && state.extractedData && (
          <div className="flex flex-col gap-6">
            <ResultsDisplay
              subsidies={state.subsidyResults}
              language={state.language}
              extractedData={state.extractedData}
            />
            <TTSControls
              textContent={composeTtsText()}
              language={state.language}
              isSupported={ttsSupported}
            />
          </div>
        )}

        {/* Stage: Manual Input */}
        {state.stage === "manual-input" && (
          <ManualFallbackForm
            onSubmit={handleManualSubmit}
            isProcessing={false}
          />
        )}

        {/* Stage: Error */}
        {state.stage === "error" && state.error && (
          <ErrorDisplay error={state.error} onRetry={handleRetry} />
        )}

        {/* Stage: Medication Processing */}
        {state.stage === "medication-processing" && state.processingStage && (
          <LoadingProgress
            stage={state.processingStage}
            onTimeout={handleTimeout}
            timeoutMs={30000}
          />
        )}

        {/* Stage: Medication Results */}
        {state.stage === "medication-results" && state.medicationResult && (
          <div className="flex flex-col gap-6">
            <MedicationResultDisplay
              medication={state.medicationResult}
              language={state.language}
              showWarning={state.medicationWarning === "low_confidence"}
            />
            {/* Back to scan button */}
            <button
              onClick={() => {
                setState((prev) => ({
                  ...prev,
                  stage: "capture",
                  medicationResult: null,
                  medicationWarning: null,
                  selectedFile: null,
                }));
                setCaptureMode("medication");
              }}
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-6 py-3 rounded-full border-2 border-neutral-200 bg-white text-neutral-700 font-semibold text-base hover:bg-neutral-50 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/40"
            >
              Scan Another Medication
            </button>
          </div>
        )}

        {/* Stage: Medication Error */}
        {state.stage === "medication-error" && (
          <>
            {state.handwritingRejected ? (
              <HandwritingWarning
                onRetry={handleMedicationRetry}
                onCancel={handleMedicationCancel}
              />
            ) : (
              state.error && (
                <ErrorDisplay
                  error={state.error}
                  onRetry={handleMedicationRetry}
                />
              )
            )}
          </>
        )}
      </div>
    </main>
  );
}

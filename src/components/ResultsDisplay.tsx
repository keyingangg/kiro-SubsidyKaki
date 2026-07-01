"use client";

import type {
  SubsidyResult,
  SupportedLanguage,
  ExtractedDocumentData,
} from "../types";
import SubsidyCard from "./SubsidyCard";

interface ResultsDisplayProps {
  subsidies: SubsidyResult[];
  language: SupportedLanguage;
  extractedData: ExtractedDocumentData;
}

/**
 * Displays subsidy results ordered by estimated coverage percent (descending).
 * Shows a summary count at the top and renders SubsidyCard for each result.
 * Falls back to English if translation is unavailable for the selected language.
 *
 * Validates: Requirements 6.1, 6.4, 6.5, 6.6, 6.7
 */
export default function ResultsDisplay({
  subsidies,
  language,
}: ResultsDisplayProps) {
  // Sort subsidies by estimatedCoveragePercent in descending order
  const sortedSubsidies = [...subsidies].sort(
    (a, b) => b.estimatedCoveragePercent - a.estimatedCoveragePercent
  );

  // No applicable schemes found
  if (sortedSubsidies.length === 0) {
    return (
      <section
        aria-label="Subsidy results"
        className="flex flex-col items-center gap-4 px-4 py-8"
      >
        <p className="text-lg text-neutral-700 text-center leading-relaxed">
          No matching subsidy schemes were identified for your document. Please
          verify your document or consult a nearby Community Centre for
          assistance.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Subsidy results" className="flex flex-col gap-5 px-4 py-6">
      {/* Summary count */}
      <p className="text-lg font-semibold text-neutral-800">
        Found {sortedSubsidies.length} applicable subsidy{" "}
        {sortedSubsidies.length === 1 ? "scheme" : "schemes"}
      </p>

      {/* Subsidy cards */}
      <div className="flex flex-col gap-4">
        {sortedSubsidies.map((subsidy, index) => (
          <SubsidyCard
            key={`${subsidy.schemeName}-${index}`}
            subsidy={subsidy}
            language={language}
          />
        ))}
      </div>
    </section>
  );
}

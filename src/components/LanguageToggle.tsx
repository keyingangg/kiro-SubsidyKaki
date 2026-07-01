"use client";

import { cn } from "../lib/utils";
import type { SupportedLanguage } from "../types";

interface LanguageToggleProps {
  current: SupportedLanguage;
  onChange: (lang: SupportedLanguage) => void;
}

const LANGUAGE_OPTIONS: { value: SupportedLanguage; label: string }[] = [
  { value: "en-SG", label: "English" },
  { value: "cmn-Hans-CN", label: "中文" },
  { value: "ms-MY", label: "Melayu" },
  { value: "ta-IN", label: "தமிழ்" },
];

export default function LanguageToggle({ current, onChange }: LanguageToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Select language"
      className="inline-flex rounded-xl bg-neutral-100 p-1 gap-1"
    >
      {LANGUAGE_OPTIONS.map((option) => {
        const isSelected = current === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={`Language: ${option.label}`}
            onClick={() => onChange(option.value)}
            className={cn(
              "min-w-[44px] min-h-[44px] px-3 py-2 rounded-lg text-sm font-semibold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1",
              isSelected
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, Square, Volume2 } from "lucide-react";
import type { SupportedLanguage } from "@/types";

// ============================================================
// TTSControls Component
// Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9
// ============================================================

type TTSState = "idle" | "playing" | "paused";

interface TTSControlsProps {
  textContent: string;
  language: SupportedLanguage;
  isSupported: boolean;
}

/**
 * Maps SupportedLanguage to Web Speech API locale codes.
 * en-SG stays as-is; cmn-Hans-CN maps to zh-CN for speech synthesis.
 */
const LANGUAGE_TO_SPEECH_LOCALE: Record<SupportedLanguage, string> = {
  "en-SG": "en-SG",
  "cmn-Hans-CN": "zh-CN",
  "ms-MY": "ms-MY",
  "ta-IN": "ta-IN",
};

/** Default speaking rate for elderly listeners (0.7–0.75x range) */
const SPEECH_RATE = 0.72;

export default function TTSControls({
  textContent,
  language,
  isSupported,
}: TTSControlsProps) {
  const [state, setState] = useState<TTSState>("idle");
  const [highlightRange, setHighlightRange] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const [activeContent, setActiveContent] = useState({ textContent, language });

  if (activeContent.textContent !== textContent || activeContent.language !== language) {
    setActiveContent({ textContent, language });
    setState("idle");
    setHighlightRange(null);
  }

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Initialize speechSynthesis reference
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Cleanup on unmount — cancel any ongoing speech
  useEffect(() => {
    return () => {
      synthRef.current?.cancel();
    };
  }, []);

  // Cancel playback when text or language changes.
  useEffect(() => {
    synthRef.current?.cancel();
  }, [textContent, language]);

  /**
   * Select the best available voice for the given locale.
   * Prefers exact locale match (e.g. en-SG); falls back to device default.
   */
  const selectVoice = useCallback(
    (locale: string): SpeechSynthesisVoice | null => {
      if (!synthRef.current) return null;
      const voices = synthRef.current.getVoices();
      // Try exact match first
      const exact = voices.find((v) => v.lang === locale);
      if (exact) return exact;
      // Try language prefix match (e.g. "en" for "en-SG")
      const prefix = locale.split("-")[0];
      const prefixMatch = voices.find((v) => v.lang.startsWith(prefix));
      if (prefixMatch) return prefixMatch;
      // Fall back to device default
      return null;
    },
    []
  );

  const handlePlay = useCallback(() => {
    if (!synthRef.current || !textContent) return;

    // If resuming from paused
    if (state === "paused") {
      synthRef.current.resume();
      setState("playing");
      return;
    }

    // Start fresh playback
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(textContent);
    const locale = LANGUAGE_TO_SPEECH_LOCALE[language];
    utterance.lang = locale;
    utterance.rate = SPEECH_RATE;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voice = selectVoice(locale);
    if (voice) {
      utterance.voice = voice;
    }

    // Track word boundaries for highlighting
    utterance.onboundary = (event: SpeechSynthesisEvent) => {
      if (event.name === "word") {
        const start = event.charIndex;
        const end = start + event.charLength;
        setHighlightRange({ start, end });
      }
    };

    utterance.onstart = () => {
      setState("playing");
    };

    utterance.onend = () => {
      setState("idle");
      setHighlightRange(null);
    };

    utterance.onerror = () => {
      setState("idle");
      setHighlightRange(null);
    };

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  }, [state, textContent, language, selectVoice]);

  const handlePause = useCallback(() => {
    if (!synthRef.current) return;
    synthRef.current.pause();
    setState("paused");
  }, []);

  const handleStop = useCallback(() => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    setState("idle");
    setHighlightRange(null);
  }, []);

  // Hide entirely if Web Speech API is not supported (Requirement 7.7)
  if (!isSupported) {
    return null;
  }

  /**
   * Renders the text with the currently spoken segment highlighted.
   * Uses a yellow background for the active word (Requirement 7.5).
   */
  const renderHighlightedText = () => {
    if (!highlightRange || state === "idle") return null;

    const { start, end } = highlightRange;
    const before = textContent.slice(0, start);
    const highlighted = textContent.slice(start, end);
    const after = textContent.slice(end);

    return (
      <div
        className="mt-3 p-3 rounded-lg bg-gray-50 text-base leading-relaxed max-h-32 overflow-y-auto"
        aria-live="polite"
        aria-atomic={false}
      >
        <span>{before}</span>
        <mark
          className="bg-yellow-300 text-gray-900 px-0.5 rounded"
          aria-current="true"
        >
          {highlighted}
        </mark>
        <span>{after}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        {/* Idle state: show "Read Aloud" button (Requirement 7.1) */}
        {state === "idle" && (
          <button
            onClick={handlePlay}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-w-[44px] min-h-[44px] rounded-full bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/40 transition-colors"
            aria-label="Read aloud"
          >
            <Volume2 className="w-5 h-5 flex-shrink-0" />
            <span>Read Aloud</span>
          </button>
        )}

        {/* Playing state: show Pause + Stop (Requirement 7.4) */}
        {state === "playing" && (
          <>
            <button
              onClick={handlePause}
              className="inline-flex items-center gap-2 px-4 py-2.5 min-w-[44px] min-h-[44px] rounded-full bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/40 transition-colors"
              aria-label="Pause reading"
            >
              <Pause className="w-5 h-5 flex-shrink-0" />
              <span>Pause</span>
            </button>
            <button
              onClick={handleStop}
              className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full bg-red-500 text-white hover:bg-red-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-400/40 transition-colors"
              aria-label="Stop reading"
            >
              <Square className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Paused state: show Resume + Stop (Requirement 7.4, 7.8) */}
        {state === "paused" && (
          <>
            <button
              onClick={handlePlay}
              className="inline-flex items-center gap-2 px-4 py-2.5 min-w-[44px] min-h-[44px] rounded-full bg-green-600 text-white font-semibold text-sm hover:bg-green-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-400/40 transition-colors"
              aria-label="Resume reading"
            >
              <Play className="w-5 h-5 flex-shrink-0" />
              <span>Resume</span>
            </button>
            <button
              onClick={handleStop}
              className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full bg-red-500 text-white hover:bg-red-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-400/40 transition-colors"
              aria-label="Stop reading"
            >
              <Square className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Highlighted text display (Requirement 7.5) */}
      {renderHighlightedText()}
    </div>
  );
}

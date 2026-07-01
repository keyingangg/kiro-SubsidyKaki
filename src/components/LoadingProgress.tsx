"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ProcessingStage } from "@/types";

interface LoadingProgressProps {
  stage: ProcessingStage;
  onTimeout: () => void;
  timeoutMs?: number; // default 30000
}

const STAGE_TEXT: Record<ProcessingStage, string> = {
  uploading: "Uploading your document...",
  reading: "Reading your document...",
  finding: "Finding your subsidies...",
  scanning_medication: "Reading your medication label...",
};

export default function LoadingProgress({
  stage,
  onTimeout,
  timeoutMs = 30000,
}: LoadingProgressProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear any existing timer when stage changes
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Set a new timeout for the current stage
    timerRef.current = setTimeout(() => {
      onTimeout();
    }, timeoutMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [stage, onTimeout, timeoutMs]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12">
      {/* Animated spinner indicator — minimum 48px width/height */}
      <div className="relative flex items-center justify-center w-[48px] h-[48px]">
        {/* Outer pulsing ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-teal-100"
          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.2, 0.6] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Spinning border */}
        <motion.div
          className="w-[48px] h-[48px] rounded-full border-4 border-neutral-200 border-t-teal-700"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Stage-specific text — minimum 18px font */}
      <AnimatePresence mode="wait">
        <motion.p
          key={stage}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="text-lg font-semibold text-neutral-800 text-center"
          style={{ fontSize: "18px" }}
        >
          {STAGE_TEXT[stage]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

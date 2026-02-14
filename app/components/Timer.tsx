"use client";

import { useEffect, useState } from "react";

interface TimerProps {
  /** Total seconds (e.g. 480 for 8 minutes) */
  initialSeconds: number;
  isRunning: boolean;
  onComplete: () => void;
  /** Seconds to deduct from display and from effective remaining (e.g. system reset penalty) */
  penaltySeconds?: number;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function Timer({
  initialSeconds,
  isRunning,
  onComplete,
  penaltySeconds = 0,
}: TimerProps) {
  const [timeRemainingSeconds, setTimeRemainingSeconds] =
    useState(initialSeconds);

  useEffect(() => {
    setTimeRemainingSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        const next = prev - 1;
        const effectiveRemaining = next - penaltySeconds;
        if (next <= 0 || effectiveRemaining <= 0) {
          clearInterval(interval);
          onComplete();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, onComplete, penaltySeconds]);

  const displaySeconds = Math.max(0, timeRemainingSeconds - penaltySeconds);
  const isLow = displaySeconds <= 60 && isRunning;
  return (
    <div
      className={
        "rounded-xl border border-slate-600 bg-slate-800/80 px-6 py-3 shadow-lg " +
        (isLow ? "border-amber-500/60 bg-amber-900/20" : "")
      }
    >
      <div className="text-center text-xs uppercase tracking-wider text-slate-400">
        Time remaining
      </div>
      <div
        className={
          "font-mono text-3xl font-bold " +
          (isLow ? "text-amber-400" : "text-emerald-400")
        }
      >
        {formatTime(displaySeconds)}
      </div>
    </div>
  );
}

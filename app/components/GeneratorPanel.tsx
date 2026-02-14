"use client";

import { RED_ZONE, GENERATOR_LOW } from "@/types/gameTypes";

interface GeneratorPanelProps {
  value: number;
  onOn: () => void;
  onStabilize: () => void;
  disabled?: boolean;
}

export default function GeneratorPanel({
  value,
  onOn,
  onStabilize,
  disabled,
}: GeneratorPanelProps) {
  const isLow = value < GENERATOR_LOW;
  const isRed = value > RED_ZONE.GENERATOR_HIGH;
  const pct = Math.max(0, Math.min(100, value));

  return (
    <div className="rounded-xl border border-slate-600 bg-slate-800/90 px-4 py-3 shadow-lg">
      <div className="mb-2 text-center text-xs font-medium uppercase tracking-wider text-slate-400">
        Generator
      </div>
      <div className="flex items-end justify-center gap-1">
        {[0, 1, 2, 3, 4].map((i) => {
          const segmentPct = (i + 1) * 20;
          const filled = pct >= segmentPct;
          const inRed = segmentPct > RED_ZONE.GENERATOR_HIGH;
          const inLow = segmentPct <= GENERATOR_LOW;
          return (
            <div
              key={i}
              className="relative h-12 w-6 overflow-hidden rounded-sm border border-slate-600 bg-slate-700/50"
              title={`${segmentPct}%`}
            >
              <div
                className={
                  "absolute bottom-0 left-0 right-0 w-full rounded-b-sm transition-all duration-300 " +
                  (filled
                    ? inRed
                      ? "bg-red-500"
                      : inLow
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    : "bg-transparent")
                }
                style={{ height: filled ? "100%" : "0%" }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-center font-mono text-lg text-slate-200">
        {Math.round(value)}%
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onOn}
          disabled={disabled}
          className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          ON
        </button>
        <button
          type="button"
          onClick={onStabilize}
          disabled={disabled}
          className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
        >
          STABILIZE
        </button>
      </div>
    </div>
  );
}

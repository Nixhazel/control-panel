"use client";

import { RED_ZONE } from "@/types/gameTypes";

interface TemperaturePanelProps {
  value: number;
  history: number[];
  onHigh: () => void;
  on3rdHigh: () => void;
  disabled?: boolean;
}

const MAX_HISTORY = 20;

export default function TemperaturePanel({
  value,
  history,
  onHigh,
  on3rdHigh,
  disabled,
}: TemperaturePanelProps) {
  const isRed = value > RED_ZONE.TEMPERATURE;
  const displayHistory = history.slice(-MAX_HISTORY);

  return (
    <div className="rounded-xl border border-slate-600 bg-slate-800/90 px-4 py-3 shadow-lg">
      <div className="mb-2 text-center text-xs font-medium uppercase tracking-wider text-slate-400">
        Temperature
      </div>
      <div className="flex items-end gap-0.5">
        {displayHistory.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-slate-600 transition-all duration-300"
            style={{
              height: `${Math.min(100, (h / 100) * 40)}px`,
              backgroundColor: h > RED_ZONE.TEMPERATURE ? "#ef4444" : "#22c55e",
            }}
            title={`${Math.round(h)}%`}
          />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span
          className={
            "font-mono text-lg " + (isRed ? "text-red-400" : "text-emerald-400")
          }
        >
          {Math.round(value)}%
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onHigh}
            disabled={disabled}
            className="rounded bg-amber-600 px-2 py-1 text-xs font-medium text-white hover:bg-amber-500 disabled:opacity-50"
          >
            HIGH
          </button>
          <button
            type="button"
            onClick={on3rdHigh}
            disabled={disabled}
            className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50"
          >
            3RD HIGH
          </button>
        </div>
      </div>
    </div>
  );
}

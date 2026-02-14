"use client";

import { RED_ZONE } from "@/types/gameTypes";

interface GasPanelProps {
  o2: number;
  co2: number;
  onReset: () => void;
  onAlarm: () => void;
  disabled?: boolean;
}

function Bar({ value, label, isLowRed }: { value: number; label: string; isLowRed: boolean }) {
  const isRed = isLowRed ? value < RED_ZONE.O2_LOW : value > RED_ZONE.CO2_HIGH;
  return (
    <div className="flex flex-col items-center">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="relative h-24 w-8 overflow-hidden rounded border border-slate-600 bg-slate-800">
        <div className="absolute inset-0 flex flex-col justify-end">
          <div
            className="w-full transition-all duration-300"
            style={{
              height: `${value}%`,
              backgroundColor: isRed ? "#ef4444" : "#22c55e",
            }}
          />
        </div>
      </div>
      <div className="mt-1 font-mono text-sm text-slate-300">{Math.round(value)}%</div>
    </div>
  );
}

export default function GasPanel({
  o2,
  co2,
  onReset,
  onAlarm,
  disabled,
}: GasPanelProps) {
  return (
    <div className="rounded-xl border border-slate-600 bg-slate-800/90 px-4 py-3 shadow-lg">
      <div className="mb-2 text-center text-xs font-medium uppercase tracking-wider text-slate-400">
        O₂ / CO₂
      </div>
      <div className="flex justify-around gap-4">
        <Bar value={o2} label="O₂" isLowRed={true} />
        <Bar value={co2} label="CO₂" isLowRed={false} />
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onReset}
          disabled={disabled}
          className="flex-1 rounded-lg bg-slate-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-500 disabled:opacity-50"
        >
          RESET
        </button>
        <button
          type="button"
          onClick={onAlarm}
          disabled={disabled}
          className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
        >
          ALARM
        </button>
      </div>
    </div>
  );
}

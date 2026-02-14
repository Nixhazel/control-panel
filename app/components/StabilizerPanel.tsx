"use client";

import { RED_ZONE } from "@/types/gameTypes";

interface StabilizerPanelProps {
  top: number;
  bottom: number;
  onRecentre: () => void;
  onReset: () => void;
  disabled?: boolean;
}

function Dial({ value, label }: { value: number; label: string }) {
  const isRed = value < RED_ZONE.STABILIZER_LOW || value > RED_ZONE.STABILIZER_HIGH;
  const rotation = (value / 100) * 180 - 90;
  return (
    <div className="flex flex-col items-center">
      <div className="text-xs text-slate-500">{label}</div>
      <div
        className={
          "relative h-20 w-20 rounded-full border-4 border-slate-600 bg-slate-800 " +
          (isRed ? "border-red-500" : "border-emerald-600")
        }
      >
        <div
          className="absolute left-1/2 top-1/2 h-1 w-8 origin-left -translate-y-1/2 bg-slate-300"
          style={{ transform: `rotate(${rotation}deg)` }}
        />
      </div>
      <div className="mt-1 font-mono text-sm text-slate-300">{Math.round(value)}</div>
    </div>
  );
}

export default function StabilizerPanel({
  top,
  bottom,
  onRecentre,
  onReset,
  disabled,
}: StabilizerPanelProps) {
  return (
    <div className="rounded-xl border border-slate-600 bg-slate-800/90 px-4 py-3 shadow-lg">
      <div className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-slate-400">
        Stabilizers
      </div>
      <div className="flex justify-around">
        <Dial value={top} label="Top" />
        <Dial value={bottom} label="Bottom" />
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onRecentre}
          disabled={disabled}
          className="flex-1 rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-amber-500 disabled:opacity-50"
        >
          RECENTRE
        </button>
        <button
          type="button"
          onClick={onReset}
          disabled={disabled}
          className="flex-1 rounded-lg bg-slate-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-500 disabled:opacity-50"
        >
          RESET
        </button>
      </div>
    </div>
  );
}

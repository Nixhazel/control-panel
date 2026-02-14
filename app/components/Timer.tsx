"use client";

interface TimerProps {
  timeRemainingSeconds: number;
  phase: "idle" | "playing" | "ended";
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Timer({ timeRemainingSeconds, phase }: TimerProps) {
  const isLow = timeRemainingSeconds <= 60 && phase === "playing";
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
        {formatTime(timeRemainingSeconds)}
      </div>
    </div>
  );
}

"use client";

interface ScorePanelProps {
  totalScore: number;
  correct: number;
  incorrect: number;
  missed: number;
  unnecessary: number;
}

export default function ScorePanel({
  totalScore,
  correct,
  incorrect,
  missed,
  unnecessary,
}: ScorePanelProps) {
  return (
    <div className="rounded-xl border border-slate-600 bg-slate-800/80 px-4 py-3 shadow-lg">
      <div className="text-center text-xs uppercase tracking-wider text-slate-400">
        Score
      </div>
      <div
        className={
          "font-mono text-2xl font-bold " +
          (totalScore >= 0 ? "text-emerald-400" : "text-red-400")
        }
      >
        {totalScore}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-slate-500">
        <span>✓ {correct}</span>
        <span>✗ {incorrect}</span>
        <span>Miss {missed}</span>
        <span>Unnec. {unnecessary}</span>
      </div>
    </div>
  );
}

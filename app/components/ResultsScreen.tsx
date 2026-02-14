"use client";

import type { PersonalityTraits, OperatorClassification } from "@/types/gameTypes";

interface ResultsScreenProps {
  finalScore: number;
  accuracyPercent: number;
  averageReactionMs: number;
  personality: PersonalityTraits;
  passed: boolean;
  classification: OperatorClassification;
  onRestart: () => void;
}

const TRAIT_LABELS: (keyof PersonalityTraits)[] = [
  "vigilance",
  "compliance",
  "impulsivity",
  "stressTolerance",
  "consistency",
];

function TraitBar({ label, value }: { label: string; value: number }) {
  const displayLabel = label.replace(/([A-Z])/g, " $1").trim();
  return (
    <div className="flex items-center gap-2">
      <span className="w-32 text-sm text-slate-400 capitalize">{displayLabel}</span>
      <div className="h-4 flex-1 overflow-hidden rounded bg-slate-700">
        <div
          className="h-full rounded bg-emerald-500 transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-8 text-right font-mono text-sm text-slate-300">{value}</span>
    </div>
  );
}

export default function ResultsScreen({
  finalScore,
  accuracyPercent,
  averageReactionMs,
  personality,
  passed,
  classification,
  onRestart,
}: ResultsScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-600 bg-slate-800 p-6 shadow-2xl">
        <h2 className="mb-6 text-center text-2xl font-bold text-slate-100">
          Assessment Complete
        </h2>

        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-slate-700/50 p-3 text-center">
            <div className="text-xs text-slate-500">Final Score</div>
            <div
              className={
                "text-2xl font-bold " +
                (finalScore >= 0 ? "text-emerald-400" : "text-red-400")
              }
            >
              {finalScore}
            </div>
          </div>
          <div className="rounded-lg bg-slate-700/50 p-3 text-center">
            <div className="text-xs text-slate-500">Accuracy</div>
            <div className="text-2xl font-bold text-slate-200">{accuracyPercent}%</div>
          </div>
          <div className="rounded-lg bg-slate-700/50 p-3 text-center">
            <div className="text-xs text-slate-500">Avg. Reaction</div>
            <div className="text-2xl font-bold text-slate-200">
              {averageReactionMs}ms
            </div>
          </div>
          <div className="rounded-lg bg-slate-700/50 p-3 text-center">
            <div className="text-xs text-slate-500">Result</div>
            <div
              className={
                "text-lg font-bold " +
                (passed ? "text-emerald-400" : "text-red-400")
              }
            >
              {passed ? "PASS" : "FAIL"}
            </div>
          </div>
        </div>

        <div className="mb-4 text-sm font-medium text-slate-400">
          Operator classification
        </div>
        <p className="mb-6 text-center text-xl font-medium text-slate-200">
          {classification}
        </p>

        <div className="mb-4 text-sm font-medium text-slate-400">
          Personality traits (SHL-style)
        </div>
        <div className="mb-6 space-y-2">
          {TRAIT_LABELS.map((key) => (
            <TraitBar key={key} label={key} value={personality[key]} />
          ))}
        </div>

        <button
          type="button"
          onClick={onRestart}
          className="w-full rounded-xl bg-emerald-600 py-3 font-medium text-white transition hover:bg-emerald-500"
        >
          Restart simulation
        </button>
      </div>
    </div>
  );
}

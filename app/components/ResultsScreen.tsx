"use client";

import { useEffect, useState } from "react";
import type {
  PersonalityTraits,
  OperatorClassification,
  StoredAttempt,
} from "@/types/gameTypes";
import { loadAttempts, clearAttempts } from "@/app/lib/storage";

interface ResultsScreenProps {
  finalScore: number;
  accuracyPercent: number;
  averageReactionMs: number;
  personality: PersonalityTraits;
  passed: boolean;
  classification: OperatorClassification;
  status: "PASS" | "FAIL";
  onRestart: () => void;
  restartDisabled?: boolean;
  restartCooldownSeconds?: number;
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
      <span className="w-32 text-sm text-slate-400 capitalize">
        {displayLabel}
      </span>
      <div className="h-4 flex-1 overflow-hidden rounded bg-slate-700">
        <div
          className="h-full rounded bg-emerald-500 transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-8 text-right font-mono text-sm text-slate-300">
        {value}%
      </span>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default function ResultsScreen({
  finalScore,
  accuracyPercent,
  averageReactionMs,
  personality,
  passed,
  classification,
  status,
  onRestart,
  restartDisabled = false,
  restartCooldownSeconds = 0,
}: ResultsScreenProps) {
  const [attempts, setAttempts] = useState<StoredAttempt[]>([]);

  useEffect(() => {
    setAttempts(loadAttempts());
  }, []);

  const handleClearHistory = () => {
    clearAttempts();
    setAttempts([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-600 bg-slate-800 p-6 shadow-2xl">
        <h2 className="mb-6 text-center text-2xl font-bold text-slate-100">
          Assessment Complete
        </h2>

        <div className="mb-6 flex justify-center">
          <span
            className={
              "rounded-xl px-8 py-3 text-2xl font-bold uppercase tracking-wider " +
              (status === "PASS"
                ? "bg-emerald-600/90 text-white"
                : "bg-red-600/90 text-white")
            }
          >
            {status}
          </span>
        </div>

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
            <div className="text-2xl font-bold text-slate-200">
              {accuracyPercent}%
            </div>
          </div>
          <div className="rounded-lg bg-slate-700/50 p-3 text-center">
            <div className="text-xs text-slate-500">Avg. Reaction</div>
            <div className="text-2xl font-bold text-slate-200">
              {averageReactionMs}ms
            </div>
          </div>
          <div className="rounded-lg bg-slate-700/50 p-3 text-center">
            <div className="text-xs text-slate-500">Classification</div>
            <div className="text-lg font-medium text-slate-200">
              {classification}
            </div>
          </div>
        </div>

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
          disabled={restartDisabled}
          className="w-full rounded-xl bg-emerald-600 py-3 font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {restartDisabled && restartCooldownSeconds > 0
            ? `Restart simulation (${restartCooldownSeconds}s)`
            : "Restart simulation"}
        </button>

        {attempts.length > 0 && (
          <>
            <div className="mt-8 mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">
                Attempt history
              </span>
              <button
                type="button"
                onClick={handleClearHistory}
                className="text-sm text-amber-400 hover:text-amber-300"
              >
                Clear history
              </button>
            </div>
            <ul className="space-y-2 rounded-lg bg-slate-700/30 p-3">
              {attempts.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-600 bg-slate-800/50 px-3 py-2 text-sm"
                >
                  <span className="text-slate-400">{formatDate(a.date)}</span>
                  <span className="font-mono text-slate-200">{a.finalScore}</span>
                  <span
                    className={
                      a.status === "PASS"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }
                  >
                    {a.status}
                  </span>
                  <span className="text-slate-300">{a.classification}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

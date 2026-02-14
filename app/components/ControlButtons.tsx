"use client";

interface ControlButtonsProps {
  onRecentre: () => void;
  onSystemReset: () => void;
  disabled?: boolean;
  systemResetCooldownRemainingMs?: number;
}

export default function ControlButtons({
  onRecentre,
  onSystemReset,
  disabled,
  systemResetCooldownRemainingMs = 0,
}: ControlButtonsProps) {
  const resetDisabled = disabled || systemResetCooldownRemainingMs > 0;
  return (
    <div className="rounded-xl border border-slate-600 bg-slate-800/80 px-4 py-3 shadow-lg">
      <div className="mb-2 text-center text-xs font-medium uppercase tracking-wider text-slate-400">
        System controls
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onRecentre}
          disabled={disabled}
          className="btn-press flex-1 rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-amber-500 disabled:opacity-50"
        >
          RECENTRE
        </button>
        <button
          type="button"
          onClick={onSystemReset}
          disabled={resetDisabled}
          className="btn-press flex-1 rounded-lg bg-rose-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-rose-600 disabled:opacity-50"
          title={
            systemResetCooldownRemainingMs > 0
              ? `Cooldown: ${Math.ceil(systemResetCooldownRemainingMs / 1000)}s`
              : "Reset all systems"
          }
        >
          SYSTEM RESET
          {systemResetCooldownRemainingMs > 0 && (
            <span className="ml-1 text-xs">
              ({Math.ceil(systemResetCooldownRemainingMs / 1000)}s)
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

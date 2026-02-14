"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import GeneratorPanel from "@/app/components/GeneratorPanel";
import StabilizerPanel from "@/app/components/StabilizerPanel";
import TemperaturePanel from "@/app/components/TemperaturePanel";
import GasPanel from "@/app/components/GasPanel";
import ControlButtons from "@/app/components/ControlButtons";
import Timer from "@/app/components/Timer";
import ScorePanel from "@/app/components/ScorePanel";
import ResultsScreen from "@/app/components/ResultsScreen";
import {
  updateSystemState,
  getRequiredAction,
  INITIAL_SYSTEM_STATE,
  isTemperatureRed,
  countRedConditions,
} from "@/app/lib/gameEngine";
import {
  createInitialScoreState,
  recordAction,
  recordMissedAction,
  setPendingRequiredAction,
  getFinalScoreData,
} from "@/app/lib/scoringEngine";
import {
  computePersonality,
  classifyOperator,
} from "@/app/lib/personalityEngine";
import { saveAttempt, buildStoredAttempt } from "@/app/lib/storage";
import type {
  GameState,
  ScoreState,
  ActionType,
  OperatorClassification,
} from "@/types/gameTypes";
import {
  GAME_DURATION_SECONDS,
  TICK_MS,
  REQUIRED_ACTION_WINDOW_MS,
  SYSTEM_RESET_COOLDOWN_MS,
  SYSTEM_RESET_TIME_PENALTY_SECONDS,
} from "@/types/gameTypes";

const TEMP_HISTORY_LENGTH = 30;
const BUTTON_COOLDOWN_MS = 500;
const RESTART_COOLDOWN_SECONDS = 5;

function createInitialGameState(): GameState {
  return {
    phase: "idle",
    systemState: { ...INITIAL_SYSTEM_STATE },
    timeRemainingSeconds: GAME_DURATION_SECONDS,
    temperatureSpikeCount: 0,
    lastUpdateAt: 0,
    lastSystemResetAt: null,
  };
}

export default function SimulatorPage() {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState);
  const [scoreState, setScoreState] = useState<ScoreState>(createInitialScoreState);
  const [temperatureHistory, setTemperatureHistory] = useState<number[]>([]);
  const [result, setResult] = useState<{
    finalScore: number;
    accuracyPercent: number;
    averageReactionMs: number;
    personality: ReturnType<typeof computePersonality>;
    passed: boolean;
    classification: OperatorClassification;
    status: "PASS" | "FAIL";
  } | null>(null);
  const [restartCooldownSeconds, setRestartCooldownSeconds] = useState(0);
  const [timePenaltySeconds, setTimePenaltySeconds] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingMissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevTempRedRef = useRef(false);
  const lastRequiredActionRef = useRef<ActionType | null>(null);
  const latestSystemRef = useRef(INITIAL_SYSTEM_STATE);
  const gameStartTimeRef = useRef<number>(0);
  const lastActionAtRef = useRef<number>(0);

  const isGameActive = gameState.phase === "playing";

  const handleTimerComplete = useCallback(() => {
    setGameState((g) => ({ ...g, phase: "ended", timeRemainingSeconds: 0 }));
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
    if (pendingMissTimeoutRef.current) {
      clearTimeout(pendingMissTimeoutRef.current);
      pendingMissTimeoutRef.current = null;
    }
  }, []);

  const handleAction = useCallback(
    (actionType: ActionType) => {
      if (!isGameActive) return;
      const now = Date.now();
      if (now - lastActionAtRef.current < BUTTON_COOLDOWN_MS) return;
      lastActionAtRef.current = now;

      if (pendingMissTimeoutRef.current) {
        clearTimeout(pendingMissTimeoutRef.current);
        pendingMissTimeoutRef.current = null;
      }
      const newScore = recordAction(
        scoreState,
        gameState,
        actionType,
        now,
        gameStartTimeRef.current
      );
      setScoreState(newScore);

      let newGameState = { ...gameState };
      if (actionType === "TEMP_HIGH") {
        if (gameState.temperatureSpikeCount === 0 || gameState.temperatureSpikeCount === 1)
          newGameState = {
            ...newGameState,
            temperatureSpikeCount: gameState.temperatureSpikeCount + 1,
          };
      } else if (actionType === "TEMP_3RD_HIGH") {
        newGameState = { ...newGameState, temperatureSpikeCount: 0 };
      } else if (actionType === "SYSTEM_RESET") {
        const wasCorrect =
          newScore.actionHistory[newScore.actionHistory.length - 1]?.correct === true;
        if (wasCorrect) {
          setTimePenaltySeconds((p) => p + SYSTEM_RESET_TIME_PENALTY_SECONDS);
        }
        newGameState = {
          ...newGameState,
          systemState: {
            generator: 50,
            temperature: 45,
            o2: 55,
            co2: 40,
            stabilizerTop: 50,
            stabilizerBottom: 50,
          },
          lastSystemResetAt: now,
        };
      }
      setGameState(newGameState);
    },
    [gameState, scoreState, isGameActive]
  );

  const startGame = useCallback(() => {
    setGameState(createInitialGameState());
    setScoreState(createInitialScoreState());
    setTemperatureHistory([]);
    setResult(null);
    setRestartCooldownSeconds(0);
    setTimePenaltySeconds(0);
    setShowHelp(false);
    prevTempRedRef.current = false;
    lastRequiredActionRef.current = null;
    latestSystemRef.current = INITIAL_SYSTEM_STATE;
    gameStartTimeRef.current = Date.now();
    lastActionAtRef.current = 0;
    if (pendingMissTimeoutRef.current) {
      clearTimeout(pendingMissTimeoutRef.current);
      pendingMissTimeoutRef.current = null;
    }
    setGameState((g) => ({ ...g, phase: "playing", lastUpdateAt: Date.now() }));
  }, []);

  latestSystemRef.current = gameState.systemState;

  useEffect(() => {
    if (!isGameActive) return;
    tickIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - gameStartTimeRef.current) / 1000);
      const nextSystem = updateSystemState(
        latestSystemRef.current,
        now,
        elapsedSeconds
      );
      latestSystemRef.current = nextSystem;
      const wasRed = prevTempRedRef.current;
      const isRed = isTemperatureRed(nextSystem.temperature);
      if (!wasRed && isRed) prevTempRedRef.current = true;
      else prevTempRedRef.current = isRed;
      setGameState((g) => ({
        ...g,
        systemState: nextSystem,
        lastUpdateAt: now,
        temperatureSpikeCount:
          !wasRed && isRed ? 0 : g.temperatureSpikeCount,
      }));
      setTemperatureHistory((prev) => [
        ...prev.slice(-(TEMP_HISTORY_LENGTH - 1)),
        nextSystem.temperature,
      ]);
    }, TICK_MS);
    return () => {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    };
  }, [isGameActive]);

  useEffect(() => {
    if (!isGameActive) return;
    const required = getRequiredAction(
      gameState.systemState,
      gameState.temperatureSpikeCount
    );
    if (required && required.action !== lastRequiredActionRef.current) {
      lastRequiredActionRef.current = required.action;
      setScoreState((s) =>
        setPendingRequiredAction(s, required.action, Date.now())
      );
      if (pendingMissTimeoutRef.current) clearTimeout(pendingMissTimeoutRef.current);
      pendingMissTimeoutRef.current = setTimeout(() => {
        setScoreState((s) => recordMissedAction(s));
        pendingMissTimeoutRef.current = null;
        lastRequiredActionRef.current = null;
      }, REQUIRED_ACTION_WINDOW_MS);
    }
    if (!required) lastRequiredActionRef.current = null;
    return () => {
      if (pendingMissTimeoutRef.current) clearTimeout(pendingMissTimeoutRef.current);
    };
  }, [gameState.systemState, gameState.temperatureSpikeCount, isGameActive]);

  useEffect(() => {
    if (gameState.phase !== "ended") return;
    const scoreData = getFinalScoreData(scoreState);
    const personality = computePersonality(scoreState);
    const { status, classification } = classifyOperator(scoreData, personality);
    setResult({
      finalScore: scoreData.finalScore,
      accuracyPercent: scoreData.accuracy,
      averageReactionMs: scoreData.averageReaction,
      personality,
      passed: status === "PASS",
      classification,
      status,
    });
    saveAttempt(
      buildStoredAttempt(
        scoreData.finalScore,
        scoreData.accuracy,
        scoreData.averageReaction,
        personality,
        classification,
        status
      )
    );
    setRestartCooldownSeconds(RESTART_COOLDOWN_SECONDS);
  }, [gameState.phase, scoreState]);

  useEffect(() => {
    if (restartCooldownSeconds <= 0) return;
    const t = setInterval(() => {
      setRestartCooldownSeconds((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [restartCooldownSeconds]);

  const systemResetCooldownMs =
    gameState.lastSystemResetAt != null
      ? Math.max(
          0,
          SYSTEM_RESET_COOLDOWN_MS - (Date.now() - gameState.lastSystemResetAt)
        )
      : 0;

  const disabled = !isGameActive;
  const redCount = countRedConditions(gameState.systemState);
  const criticalOverlap = redCount >= 2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-slate-800 to-[#0f172a] text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-600 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            DCS Operator Assessment Simulated Control Panel
          </h1>
          <div className="flex items-center gap-4">
            <Timer
              key={gameState.phase === "idle" ? "idle" : gameStartTimeRef.current}
              initialSeconds={GAME_DURATION_SECONDS}
              isRunning={isGameActive}
              onComplete={handleTimerComplete}
              penaltySeconds={timePenaltySeconds}
            />
            <ScorePanel
              totalScore={scoreState.totalScore}
              correct={scoreState.correctActions}
              incorrect={scoreState.incorrectActions}
              missed={scoreState.missedActions}
              unnecessary={scoreState.unnecessaryActions}
            />
            <button
              type="button"
              onClick={() => setShowHelp((h) => !h)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-600 bg-slate-800 text-slate-400 transition hover:bg-slate-700 hover:text-slate-200"
              title="Rules"
              aria-label="Show rules"
            >
              ?
            </button>
          </div>
        </header>

        {showHelp && (
          <div className="mb-6 rounded-xl border border-slate-600 bg-slate-800/90 p-4 shadow-lg">
            <h3 className="mb-2 font-semibold text-amber-400">
              ✔ FOLLOW THE RULES
            </h3>
            <ul className="mb-3 list-inside list-disc space-y-1 text-sm text-slate-300">
              <li>ISOLATE any deviation first.</li>
              <li>RECENTRE drift if stable.</li>
              <li>RESET only when normal.</li>
            </ul>
            <p className="text-sm italic text-slate-400">
              Good operators wait. They don&apos;t panic-reset.
            </p>
          </div>
        )}

        {gameState.phase === "idle" && (
          <div className="mb-6 rounded-xl border border-slate-600 bg-slate-800/50 p-6 text-center">
            <p className="mb-4 text-slate-300">
              8-minute session. React to red zones with the correct controls.
            </p>
            <button
              type="button"
              onClick={startGame}
              className="rounded-xl bg-emerald-600 px-6 py-3 font-medium text-white transition hover:bg-emerald-500 active:scale-[0.98]"
            >
              Start simulation
            </button>
          </div>
        )}

        {!result && (
          <div
            className={
              "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 " +
              (criticalOverlap ? "shake-critical" : "")
            }
          >
            <GeneratorPanel
              value={gameState.systemState.generator}
              onOn={() => handleAction("GENERATOR_ON")}
              onStabilize={() => handleAction("GENERATOR_STABILIZE")}
              disabled={disabled}
            />
            <StabilizerPanel
              top={gameState.systemState.stabilizerTop}
              bottom={gameState.systemState.stabilizerBottom}
              onRecentre={() => handleAction("STABILIZER_RECENTRE")}
              onReset={() => handleAction("STABILIZER_RESET")}
              disabled={disabled}
            />
            <TemperaturePanel
              value={gameState.systemState.temperature}
              history={temperatureHistory}
              onHigh={() => handleAction("TEMP_HIGH")}
              on3rdHigh={() => handleAction("TEMP_3RD_HIGH")}
              disabled={disabled}
            />
            <GasPanel
              o2={gameState.systemState.o2}
              co2={gameState.systemState.co2}
              onReset={() => handleAction("GAS_RESET")}
              onAlarm={() => handleAction("GAS_ALARM")}
              disabled={disabled}
            />
            <ControlButtons
              onRecentre={() => handleAction("STABILIZER_RECENTRE")}
              onSystemReset={() => handleAction("SYSTEM_RESET")}
              disabled={disabled}
              systemResetCooldownRemainingMs={systemResetCooldownMs}
            />
          </div>
        )}
      </div>

      {result && (
        <ResultsScreen
          finalScore={result.finalScore}
          accuracyPercent={result.accuracyPercent}
          averageReactionMs={result.averageReactionMs}
          personality={result.personality}
          passed={result.passed}
          classification={result.classification}
          status={result.status}
          onRestart={startGame}
          restartDisabled={restartCooldownSeconds > 0}
          restartCooldownSeconds={restartCooldownSeconds}
        />
      )}
    </div>
  );
}

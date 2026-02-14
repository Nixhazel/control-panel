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
} from "@/app/lib/gameEngine";
import {
  createInitialScoreState,
  recordAction,
  recordMissedAction,
  setPendingRequiredAction,
  getAccuracyPercent,
  getAverageReactionMs,
} from "@/app/lib/scoringEngine";
import {
  computePersonality,
  getPassFail,
  getClassification,
} from "@/app/lib/personalityEngine";
import type { GameState, ScoreState, ActionType } from "@/types/gameTypes";
import {
  SESSION_DURATION_SECONDS,
  TICK_MS,
  REQUIRED_ACTION_WINDOW_MS,
  SYSTEM_RESET_COOLDOWN_MS,
} from "@/types/gameTypes";

const TEMP_HISTORY_LENGTH = 30;

function createInitialGameState(): GameState {
  return {
    phase: "idle",
    systemState: { ...INITIAL_SYSTEM_STATE },
    timeRemainingSeconds: SESSION_DURATION_SECONDS,
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
    classification: ReturnType<typeof getClassification>;
  } | null>(null);

  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingMissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevTempRedRef = useRef(false);
  const lastRequiredActionRef = useRef<ActionType | null>(null);
  const latestSystemRef = useRef(INITIAL_SYSTEM_STATE);

  const handleAction = useCallback(
    (actionType: ActionType) => {
      if (gameState.phase !== "playing") return;
      if (pendingMissTimeoutRef.current) {
        clearTimeout(pendingMissTimeoutRef.current);
        pendingMissTimeoutRef.current = null;
      }
      const now = Date.now();
      const newScore = recordAction(scoreState, gameState, actionType, now);
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
    [gameState, scoreState]
  );

  const startGame = useCallback(() => {
    setGameState(createInitialGameState());
    setScoreState(createInitialScoreState());
    setTemperatureHistory([]);
    setResult(null);
    prevTempRedRef.current = false;
    lastRequiredActionRef.current = null;
    latestSystemRef.current = INITIAL_SYSTEM_STATE;
    if (pendingMissTimeoutRef.current) {
      clearTimeout(pendingMissTimeoutRef.current);
      pendingMissTimeoutRef.current = null;
    }
    setGameState((g) => ({ ...g, phase: "playing", lastUpdateAt: Date.now() }));
  }, []);

  latestSystemRef.current = gameState.systemState;

  useEffect(() => {
    if (gameState.phase !== "playing") return;
    tickIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const nextSystem = updateSystemState(latestSystemRef.current, now);
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
  }, [gameState.phase]);

  useEffect(() => {
    if (gameState.phase !== "playing") return;
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
  }, [gameState.systemState, gameState.temperatureSpikeCount, gameState.phase]);

  useEffect(() => {
    if (gameState.phase !== "playing") return;
    timerIntervalRef.current = setInterval(() => {
      setGameState((g) => {
        const next = g.timeRemainingSeconds - 1;
        if (next <= 0) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          return { ...g, phase: "ended", timeRemainingSeconds: 0 };
        }
        return { ...g, timeRemainingSeconds: next };
      });
    }, 1000);
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [gameState.phase]);

  useEffect(() => {
    if (gameState.phase !== "ended") return;
    const personality = computePersonality(scoreState);
    const passed = getPassFail(scoreState, personality);
    const classification = getClassification(scoreState, personality, passed);
    setResult({
      finalScore: scoreState.totalScore,
      accuracyPercent: getAccuracyPercent(scoreState),
      averageReactionMs: getAverageReactionMs(scoreState),
      personality,
      passed,
      classification,
    });
  }, [gameState.phase, scoreState]);

  const systemResetCooldownMs =
    gameState.lastSystemResetAt != null
      ? Math.max(
          0,
          SYSTEM_RESET_COOLDOWN_MS - (Date.now() - gameState.lastSystemResetAt)
        )
      : 0;

  const disabled = gameState.phase !== "playing";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-600 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            DCS Operator Monitoring Simulator
          </h1>
          <div className="flex items-center gap-4">
            <Timer
              timeRemainingSeconds={gameState.timeRemainingSeconds}
              phase={gameState.phase}
            />
            <ScorePanel
              totalScore={scoreState.totalScore}
              correct={scoreState.correctActions}
              incorrect={scoreState.incorrectActions}
              missed={scoreState.missedActions}
              unnecessary={scoreState.unnecessaryActions}
            />
          </div>
        </header>

        {gameState.phase === "idle" && (
          <div className="mb-6 rounded-xl border border-slate-600 bg-slate-800/50 p-6 text-center">
            <p className="mb-4 text-slate-300">
              5-minute session. React to red zones with the correct controls.
            </p>
            <button
              type="button"
              onClick={startGame}
              className="rounded-xl bg-emerald-600 px-6 py-3 font-medium text-white transition hover:bg-emerald-500"
            >
              Start simulation
            </button>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      </div>

      {result && (
        <ResultsScreen
          finalScore={result.finalScore}
          accuracyPercent={result.accuracyPercent}
          averageReactionMs={result.averageReactionMs}
          personality={result.personality}
          passed={result.passed}
          classification={result.classification}
          onRestart={startGame}
        />
      )}
    </div>
  );
}

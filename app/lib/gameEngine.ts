/**
 * Core game logic: system state updates, red zones, and rule-based event detection.
 * All functions are pure: take state in, return new state / events.
 * Difficulty scales by elapsed time: Phase 1 (0–160s), Phase 2 (160–320s), Phase 3 (320–480s).
 */

import {
  RED_ZONE,
  GENERATOR_LOW,
  type SystemState,
  type ActionType,
  type GameState,
} from "@/types/gameTypes";
import { nudgeValue, randomChance, spikeToward } from "./randomizer";

/** Phase boundaries in seconds */
const PHASE_1_END = 160;
const PHASE_2_END = 320;

/**
 * Difficulty multiplier based on elapsed time.
 * Phase 1 (0–160s): low volatility (1.0).
 * Phase 2 (160–320s): medium (1.5).
 * Phase 3 (320–480s): high (2.0).
 */
export function getDifficultyMultiplier(elapsedTime: number): number {
  if (elapsedTime < PHASE_1_END) return 1.0;
  if (elapsedTime < PHASE_2_END) return 1.5;
  return 2.0;
}

/**
 * Base spike probability 0–1. Phase 1: 10%, Phase 2: 15%, Phase 3: 20%.
 */
export function getSpikeProbability(elapsedTime: number): number {
  if (elapsedTime < PHASE_1_END) return 0.1;
  if (elapsedTime < PHASE_2_END) return 0.15;
  return 0.2;
}

/** Red zone checks */
export function isGeneratorRed(value: number): boolean {
  return value > RED_ZONE.GENERATOR_HIGH;
}

export function isGeneratorLow(value: number): boolean {
  return value < GENERATOR_LOW;
}

export function isTemperatureRed(value: number): boolean {
  return value > RED_ZONE.TEMPERATURE;
}

export function isO2Red(value: number): boolean {
  return value < RED_ZONE.O2_LOW;
}

export function isCO2Red(value: number): boolean {
  return value > RED_ZONE.CO2_HIGH;
}

export function isStabilizerRed(value: number): boolean {
  return value < RED_ZONE.STABILIZER_LOW || value > RED_ZONE.STABILIZER_HIGH;
}

/** Both stabilizers in red zone */
export function areBothStabilizersRed(state: SystemState): boolean {
  return isStabilizerRed(state.stabilizerTop) && isStabilizerRed(state.stabilizerBottom);
}

/** Both stabilizers in green zone */
export function areBothStabilizersGreen(state: SystemState): boolean {
  return !isStabilizerRed(state.stabilizerTop) && !isStabilizerRed(state.stabilizerBottom);
}

/** One gas red (O2 or CO2) */
export function isOneGasRed(state: SystemState): boolean {
  const o2Red = isO2Red(state.o2);
  const co2Red = isCO2Red(state.co2);
  return (o2Red && !co2Red) || (!o2Red && co2Red);
}

/** Both gases red */
export function areBothGasesRed(state: SystemState): boolean {
  return isO2Red(state.o2) && isCO2Red(state.co2);
}

/** Level 5: System reset required when temp red AND O2 red */
export function isSystemResetRequired(state: SystemState): boolean {
  return isTemperatureRed(state.temperature) && isO2Red(state.o2);
}

/**
 * Count how many red-zone conditions are currently active (for critical overlap / shake).
 */
export function countRedConditions(state: SystemState): number {
  let n = 0;
  if (isGeneratorLow(state.generator) || isGeneratorRed(state.generator)) n += 1;
  if (isTemperatureRed(state.temperature)) n += 1;
  if (isO2Red(state.o2)) n += 1;
  if (isCO2Red(state.co2)) n += 1;
  if (areBothStabilizersRed(state)) n += 1;
  return n;
}

/**
 * Update system state: nudge + spike chance scaled by difficulty (elapsed time).
 */
export function updateSystemState(
  prev: SystemState,
  now: number,
  elapsedSeconds: number
): SystemState {
  const mult = getDifficultyMultiplier(elapsedSeconds);
  const spikeChance = getSpikeProbability(elapsedSeconds);
  const spike = randomChance(spikeChance);
  const nudgeGen = 5 * mult;
  const nudgeTemp = 4 * mult;
  const nudgeGas = 3 * mult;
  const nudgeStab = 6 * mult;
  const spikeAmount = 12 + 6 * (mult - 1);
  return {
    generator: spike
      ? spikeToward(prev.generator, randomChance(0.5) ? 90 : 30, 15 * mult)
      : nudgeValue(prev.generator, nudgeGen),
    temperature: spike
      ? spikeToward(prev.temperature, randomChance(0.5) ? 85 : 50, spikeAmount)
      : nudgeValue(prev.temperature, nudgeTemp),
    o2: spike
      ? spikeToward(prev.o2, randomChance(0.5) ? 15 : 60, 10 * mult)
      : nudgeValue(prev.o2, nudgeGas),
    co2: spike
      ? spikeToward(prev.co2, randomChance(0.5) ? 85 : 40, 10 * mult)
      : nudgeValue(prev.co2, nudgeGas),
    stabilizerTop: nudgeValue(prev.stabilizerTop, nudgeStab),
    stabilizerBottom: nudgeValue(prev.stabilizerBottom, nudgeStab),
  };
}

/** Event types the UI/rules care about */
export type DetectedEvent =
  | { type: "GENERATOR_LOW" }
  | { type: "GENERATOR_HIGH" }
  | { type: "STABILIZERS_BOTH_RED" }
  | { type: "STABILIZERS_BOTH_GREEN" }
  | { type: "TEMP_SPIKE" }
  | { type: "ONE_GAS_RED" }
  | { type: "BOTH_GASES_RED" }
  | { type: "SYSTEM_RESET_REQUIRED" };

/**
 * Detect which events are currently active (for required actions).
 */
export function detectEvents(state: SystemState): DetectedEvent[] {
  const events: DetectedEvent[] = [];
  if (isGeneratorLow(state.generator)) events.push({ type: "GENERATOR_LOW" });
  if (isGeneratorRed(state.generator)) events.push({ type: "GENERATOR_HIGH" });
  if (areBothStabilizersRed(state)) events.push({ type: "STABILIZERS_BOTH_RED" });
  if (areBothStabilizersGreen(state)) events.push({ type: "STABILIZERS_BOTH_GREEN" });
  if (isTemperatureRed(state.temperature)) events.push({ type: "TEMP_SPIKE" });
  if (isOneGasRed(state) && !areBothGasesRed(state)) events.push({ type: "ONE_GAS_RED" });
  if (areBothGasesRed(state)) events.push({ type: "BOTH_GASES_RED" });
  if (isSystemResetRequired(state)) events.push({ type: "SYSTEM_RESET_REQUIRED" });
  return events;
}

/**
 * What action is required right now (priority: system reset > generator > stabilizers > temp > gas).
 * Returns single required action or null if none / "do nothing" cases.
 */
export function getRequiredAction(
  state: SystemState,
  temperatureSpikeCount: number
): { action: ActionType; reason: string } | null {
  if (isSystemResetRequired(state))
    return { action: "SYSTEM_RESET", reason: "Temp and O2 red" };

  if (isGeneratorLow(state.generator)) return { action: "GENERATOR_ON", reason: "Generator low" };
  if (isGeneratorRed(state.generator))
    return { action: "GENERATOR_STABILIZE", reason: "Generator high" };

  if (areBothStabilizersRed(state))
    return { action: "STABILIZER_RECENTRE", reason: "Both stabilizers red" };
  if (areBothStabilizersGreen(state))
    return { action: "STABILIZER_RESET", reason: "Both stabilizers green" };

  if (isTemperatureRed(state.temperature)) {
    if (temperatureSpikeCount === 0 || temperatureSpikeCount === 1)
      return { action: "TEMP_HIGH", reason: "Temp spike 1 or 2" };
    if (temperatureSpikeCount === 2) return { action: "TEMP_3RD_HIGH", reason: "Temp spike 3" };
  }

  if (areBothGasesRed(state)) return { action: "GAS_ALARM", reason: "Both gases red" };
  if (isOneGasRed(state)) return { action: "GAS_RESET", reason: "One gas red" };

  return null;
}

/**
 * Check if the user's action matches what is required. Used by scoring.
 */
export function evaluateUserAction(
  actionType: ActionType,
  state: SystemState,
  temperatureSpikeCount: number
): { correct: boolean; wasRequired: boolean; requiredAction: ActionType | null } {
  const required = getRequiredAction(state, temperatureSpikeCount);
  const requiredAction = required?.action ?? null;

  if (actionType === "NONE") {
    return { correct: true, wasRequired: false, requiredAction };
  }

  if (!required) {
    return { correct: false, wasRequired: false, requiredAction: null };
  }

  const correct = actionType === requiredAction;
  return { correct, wasRequired: true, requiredAction };
}

/** Safe initial system state (all green) */
export const INITIAL_SYSTEM_STATE: SystemState = {
  generator: 50,
  temperature: 45,
  o2: 55,
  co2: 40,
  stabilizerTop: 50,
  stabilizerBottom: 50,
};

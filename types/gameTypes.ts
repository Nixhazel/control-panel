/**
 * Global types for DCS Operator Monitoring Simulator
 */

export type ZoneType = "green" | "red";

export interface SystemState {
  generator: number;
  temperature: number;
  o2: number;
  co2: number;
  stabilizerTop: number;
  stabilizerBottom: number;
}

export type ActionType =
  | "GENERATOR_ON"
  | "GENERATOR_STABILIZE"
  | "STABILIZER_RECENTRE"
  | "STABILIZER_RESET"
  | "TEMP_HIGH"
  | "TEMP_3RD_HIGH"
  | "GAS_RESET"
  | "GAS_ALARM"
  | "SYSTEM_RESET"
  | "NONE";

export type GamePhase = "idle" | "playing" | "ended";

export interface GameState {
  phase: GamePhase;
  systemState: SystemState;
  timeRemainingSeconds: number;
  temperatureSpikeCount: number;
  lastUpdateAt: number;
  /** Tracks when system reset was last used (cooldown) */
  lastSystemResetAt: number | null;
}

export interface ActionRecord {
  actionType: ActionType;
  timestamp: number;
  /** Time from event detection to action (ms) */
  reactionTimeMs: number | null;
  /** Was this the correct action for current state */
  correct: boolean;
  /** Was action required at all (vs unnecessary press) */
  wasRequired: boolean;
}

export interface ScoreState {
  totalScore: number;
  correctActions: number;
  incorrectActions: number;
  missedActions: number;
  unnecessaryActions: number;
  actionHistory: ActionRecord[];
  /** Pending "required action" window - when it started */
  pendingRequiredActionAt: number | null;
  /** Type of action currently required (for scoring reaction time) */
  pendingActionType: ActionType | null;
}

export interface PersonalityTraits {
  vigilance: number;
  compliance: number;
  impulsivity: number;
  stressTolerance: number;
  consistency: number;
}

export type OperatorClassification =
  | "Excellent Operator"
  | "Competent Operator"
  | "Needs Improvement"
  | "High Risk Operator";

export interface AssessmentResult {
  finalScore: number;
  accuracyPercent: number;
  averageReactionMs: number;
  personality: PersonalityTraits;
  passed: boolean;
  classification: OperatorClassification;
}

/** Red zone thresholds (from spec) */
export const RED_ZONE = {
  GENERATOR_HIGH: 80,
  TEMPERATURE: 75,
  O2_LOW: 25,
  CO2_HIGH: 75,
  STABILIZER_LOW: 30,
  STABILIZER_HIGH: 70,
} as const;

/** Generator low threshold for "press ON" */
export const GENERATOR_LOW = 40;

/** Session duration in seconds */
export const SESSION_DURATION_SECONDS = 5 * 60;

/** Tick interval in ms */
export const TICK_MS = 1500;

/** Time window to respond to required action before "miss" (ms) */
export const REQUIRED_ACTION_WINDOW_MS = 3000;

/** System reset cooldown (ms) - cannot spam */
export const SYSTEM_RESET_COOLDOWN_MS = 10000;

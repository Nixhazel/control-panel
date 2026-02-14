/**
 * SHL-style personality trait scoring from behavior (0–100 each).
 * Stress tolerance uses Phase 3 only; consistency uses variance of reaction times.
 */

import type {
  ScoreState,
  PersonalityTraits,
  FinalScoreData,
  PassFailStatus,
  OperatorClassification,
} from "@/types/gameTypes";
import {
  getAccuracyPercent,
  getAverageReactionMs,
  getReactionTimes,
} from "./scoringEngine";

const PHASE_3_START_SECONDS = 320;
const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

/**
 * Vigilance: reaction speed. Fast reactions -> high. Slow -> low.
 * Use inverse of average reaction time (e.g. 0ms = 100, 3000ms = 0).
 */
function scoreVigilance(scoreState: ScoreState): number {
  const avg = getAverageReactionMs(scoreState);
  const withTime = scoreState.actionHistory.filter(
    (a) => a.wasRequired && a.reactionTimeMs != null
  );
  if (withTime.length === 0) return 50;
  const ideal = 500;
  const maxPenalty = 2500;
  const penalty = Math.min(avg, maxPenalty);
  const score = 100 - (penalty / maxPenalty) * 100;
  return clamp(score);
}

/**
 * Rule compliance: accuracy %.
 */
function scoreCompliance(scoreState: ScoreState): number {
  return clamp(getAccuracyPercent(scoreState));
}

/**
 * Impulsivity: unnecessary presses -> high impulsivity.
 * Based on ratio of unnecessary to total actions, scaled 0–100.
 */
function scoreImpulsivity(scoreState: ScoreState): number {
  const total = scoreState.correctActions + scoreState.incorrectActions + scoreState.unnecessaryActions;
  if (total === 0) return 0;
  const ratio = scoreState.unnecessaryActions / total;
  return clamp(Math.min(100, ratio * 200));
}

/**
 * Stress tolerance: performance during Phase 3 only (high difficulty).
 * Accuracy during 320–480s elapsed.
 */
function scoreStressTolerance(scoreState: ScoreState): number {
  const phase3 = scoreState.actionHistory.filter(
    (a) => a.elapsedSeconds != null && a.elapsedSeconds >= PHASE_3_START_SECONDS
  );
  const required = phase3.filter((a) => a.wasRequired);
  if (required.length === 0) return 50;
  const correct = required.filter((a) => a.correct).length;
  return clamp((correct / required.length) * 100);
}

/**
 * Consistency: variance in reaction times. Low variance = high consistency.
 */
function scoreConsistency(scoreState: ScoreState): number {
  const times = getReactionTimes(scoreState);
  if (times.length < 2) return 50;
  const mean = times.reduce((a, b) => a + b, 0) / times.length;
  const variance =
    times.reduce((s, t) => s + (t - mean) ** 2, 0) / times.length;
  const stdDev = Math.sqrt(variance);
  const maxStdDev = 1500;
  const consistency = 100 - Math.min(1, stdDev / maxStdDev) * 100;
  return clamp(consistency);
}

/**
 * Compute all personality traits from final score state (all clamped 0–100).
 */
export function computePersonality(scoreState: ScoreState): PersonalityTraits {
  return {
    vigilance: scoreVigilance(scoreState),
    compliance: scoreCompliance(scoreState),
    impulsivity: scoreImpulsivity(scoreState),
    stressTolerance: scoreStressTolerance(scoreState),
    consistency: scoreConsistency(scoreState),
  };
}

/** Pass criteria from spec */
const PASS = {
  ACCURACY_MIN: 70,
  IMPULSIVITY_MAX: 40,
  VIGILANCE_MIN: 60,
  SCORE_MIN: 300,
} as const;

/**
 * Pass if: accuracy ≥ 70%, impulsivity ≤ 40, vigilance ≥ 60, score ≥ 300.
 */
export function getPassFail(
  scoreState: ScoreState,
  personality: PersonalityTraits
): boolean {
  const accuracy = getAccuracyPercent(scoreState);
  return (
    accuracy >= PASS.ACCURACY_MIN &&
    personality.impulsivity <= PASS.IMPULSIVITY_MAX &&
    personality.vigilance >= PASS.VIGILANCE_MIN &&
    scoreState.totalScore >= PASS.SCORE_MIN
  );
}

/**
 * Classify operator: Excellent, Competent, Needs Improvement, High Risk.
 */
export function getClassification(
  scoreState: ScoreState,
  personality: PersonalityTraits,
  passed: boolean
): OperatorClassification {
  const accuracy = getAccuracyPercent(scoreState);
  if (!passed) {
    if (personality.impulsivity > 60 || scoreState.totalScore < 0)
      return "High Risk Operator";
    return "Needs Improvement";
  }
  if (scoreState.totalScore >= 500) return "Excellent Operator";
  if (scoreState.totalScore >= 400) return "Competent Operator";
  if (scoreState.totalScore >= 300) return "Needs Improvement";
  return "High Risk Operator";
}

/**
 * Classify from final score + personality data. Returns status and classification string.
 */
export function classifyOperator(
  scoreData: FinalScoreData,
  personalityData: PersonalityTraits
): { status: PassFailStatus; classification: OperatorClassification } {
  const passed =
    scoreData.accuracy >= PASS.ACCURACY_MIN &&
    personalityData.vigilance >= PASS.VIGILANCE_MIN &&
    personalityData.impulsivity <= PASS.IMPULSIVITY_MAX &&
    scoreData.finalScore >= PASS.SCORE_MIN;
  const status: PassFailStatus = passed ? "PASS" : "FAIL";
  if (!passed) {
    if (
      personalityData.impulsivity > 60 ||
      scoreData.finalScore < 0
    )
      return { status, classification: "High Risk Operator" };
    return { status, classification: "Needs Improvement" };
  }
  if (scoreData.finalScore >= 500)
    return { status, classification: "Excellent Operator" };
  if (scoreData.finalScore >= 400)
    return { status, classification: "Competent Operator" };
  if (scoreData.finalScore >= 300)
    return { status, classification: "Needs Improvement" };
  return { status, classification: "High Risk Operator" };
}


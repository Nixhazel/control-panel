/**
 * SHL-style personality trait scoring from behavior (0–100 each).
 */

import type { ScoreState, PersonalityTraits } from "@/types/gameTypes";
import { getAccuracyPercent, getAverageReactionMs } from "./scoringEngine";

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
  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Rule compliance: accuracy %.
 */
function scoreCompliance(scoreState: ScoreState): number {
  return getAccuracyPercent(scoreState);
}

/**
 * Impulsivity: unnecessary presses -> high impulsivity.
 * Based on ratio of unnecessary to total actions, scaled 0–100.
 */
function scoreImpulsivity(scoreState: ScoreState): number {
  const total = scoreState.correctActions + scoreState.incorrectActions + scoreState.unnecessaryActions;
  if (total === 0) return 0;
  const ratio = scoreState.unnecessaryActions / total;
  return Math.round(Math.min(100, ratio * 200));
}

/**
 * Stress tolerance: performance during multi-red events.
 * Use segments where multiple events were possible; accuracy in those segments.
 * Simplified: use overall accuracy under pressure as proxy (missed + wrong vs correct).
 */
function scoreStressTolerance(scoreState: ScoreState): number {
  const total = scoreState.correctActions + scoreState.incorrectActions + scoreState.missedActions;
  if (total === 0) return 50;
  const good = scoreState.correctActions;
  return Math.round((good / total) * 100);
}

/**
 * Consistency: score variance. Lower variance -> higher consistency.
 * Use variance of per-action score deltas (simplified: use streak or variance of correct/incorrect).
 */
function scoreConsistency(scoreState: ScoreState): number {
  const history = scoreState.actionHistory.filter((a) => a.wasRequired || !a.wasRequired);
  if (history.length < 2) return 50;
  const correctSequence = history.map((a) => (a.correct ? 1 : 0));
  let changes = 0;
  for (let i = 1; i < correctSequence.length; i++) {
    if (correctSequence[i] !== correctSequence[i - 1]) changes++;
  }
  const changeRatio = changes / (correctSequence.length - 1);
  const consistency = 100 - changeRatio * 100;
  return Math.round(Math.max(0, Math.min(100, consistency)));
}

/**
 * Compute all personality traits from final score state.
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

import type { OperatorClassification } from "@/types/gameTypes";

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
  if (accuracy >= 90 && personality.vigilance >= 80 && scoreState.totalScore >= 450)
    return "Excellent Operator";
  if (accuracy >= 70 && scoreState.totalScore >= 300)
    return "Competent Operator";
  return "Needs Improvement";
}


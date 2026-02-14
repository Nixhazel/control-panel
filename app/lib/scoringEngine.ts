/**
 * Scoring: correct/incorrect/missed/unnecessary actions, reaction time, and score deltas.
 */

import type { ScoreState, ActionRecord, ActionType } from "@/types/gameTypes";
import type { GameState } from "@/types/gameTypes";
import { evaluateUserAction } from "./gameEngine";

export const SCORE = {
  CORRECT: 10,
  FAST_BONUS_THRESHOLD_MS: 1500,
  FAST_BONUS: 5,
  WRONG: -15,
  MISSED: -20,
  UNNECESSARY: -10,
} as const;

/**
 * Create initial score state.
 */
export function createInitialScoreState(): ScoreState {
  return {
    totalScore: 0,
    correctActions: 0,
    incorrectActions: 0,
    missedActions: 0,
    unnecessaryActions: 0,
    actionHistory: [],
    pendingRequiredActionAt: null,
    pendingActionType: null,
  };
}

/**
 * Record a user action and update score. Returns new ScoreState.
 */
export function recordAction(
  scoreState: ScoreState,
  gameState: GameState,
  actionType: ActionType,
  now: number
): ScoreState {
  const { systemState, temperatureSpikeCount } = gameState;
  const evalResult = evaluateUserAction(actionType, systemState, temperatureSpikeCount);

  let delta = 0;
  const history: ActionRecord[] = [...scoreState.actionHistory];
  let correctActions = scoreState.correctActions;
  let incorrectActions = scoreState.incorrectActions;
  let missedActions = scoreState.missedActions;
  let unnecessaryActions = scoreState.unnecessaryActions;

  const reactionTimeMs =
    scoreState.pendingRequiredActionAt != null
      ? now - scoreState.pendingRequiredActionAt
      : null;

  if (actionType === "NONE") {
    return scoreState;
  }

  if (evalResult.wasRequired) {
    if (evalResult.correct) {
      delta = SCORE.CORRECT;
      if (reactionTimeMs != null && reactionTimeMs < SCORE.FAST_BONUS_THRESHOLD_MS)
        delta += SCORE.FAST_BONUS;
      correctActions += 1;
    } else {
      delta = SCORE.WRONG;
      incorrectActions += 1;
    }
    history.push({
      actionType,
      timestamp: now,
      reactionTimeMs,
      correct: evalResult.correct,
      wasRequired: true,
    });
  } else {
    delta = SCORE.UNNECESSARY;
    unnecessaryActions += 1;
    history.push({
      actionType,
      timestamp: now,
      reactionTimeMs: null,
      correct: false,
      wasRequired: false,
    });
  }

  return {
    ...scoreState,
    totalScore: scoreState.totalScore + delta,
    correctActions,
    incorrectActions,
    missedActions,
    unnecessaryActions,
    actionHistory: history,
    pendingRequiredActionAt: null,
    pendingActionType: null,
  };
}

/**
 * Record a missed required action (called when window expires).
 */
export function recordMissedAction(scoreState: ScoreState): ScoreState {
  return {
    ...scoreState,
    totalScore: scoreState.totalScore + SCORE.MISSED,
    missedActions: scoreState.missedActions + 1,
    pendingRequiredActionAt: null,
    pendingActionType: null,
  };
}

/**
 * Set pending required action (when a new required action appears).
 */
export function setPendingRequiredAction(
  scoreState: ScoreState,
  actionType: ActionType,
  at: number
): ScoreState {
  return {
    ...scoreState,
    pendingRequiredActionAt: at,
    pendingActionType: actionType,
  };
}

/**
 * Compute accuracy % from score state (correct / (correct + incorrect + missed) or 0).
 */
export function getAccuracyPercent(scoreState: ScoreState): number {
  const total = scoreState.correctActions + scoreState.incorrectActions + scoreState.missedActions;
  if (total === 0) return 100;
  return Math.round((scoreState.correctActions / total) * 100);
}

/**
 * Average reaction time in ms (only for actions that had a reaction time).
 */
export function getAverageReactionMs(scoreState: ScoreState): number {
  const withTime = scoreState.actionHistory.filter(
    (a) => a.wasRequired && a.reactionTimeMs != null
  );
  if (withTime.length === 0) return 0;
  const sum = withTime.reduce((s, a) => s + (a.reactionTimeMs ?? 0), 0);
  return Math.round(sum / withTime.length);
}

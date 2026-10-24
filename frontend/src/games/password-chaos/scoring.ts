import { MAX_SCORE } from './challenges';

export function roundScore(value: number) {
  return Math.round(value * 100) / 100;
}

export function challengeScore(base: number, bonus: number, limitMs: number, remainingMs: number) {
  if (limitMs <= 0) return 0;
  const ratio = Math.min(1, Math.max(0, remainingMs / limitMs));
  return Math.min(base + bonus, Math.max(0, roundScore(base + bonus * ratio)));
}

export function totalScore(scores: number[]) {
  return Math.min(MAX_SCORE, Math.max(0, roundScore(scores.reduce((sum, score) => sum + score, 0))));
}

/** The score route stores an integer. Scale the 100-point total to the mission ceiling. */
export function submittedScore(precise: number, maxScore: number) {
  if (maxScore <= 0) return 0;
  return Math.min(maxScore, Math.max(0, Math.round(precise / MAX_SCORE * maxScore)));
}

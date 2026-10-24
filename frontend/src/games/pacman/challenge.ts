export const DURATION_SECONDS = 300;
// 240 dots × 10 + 4 pellets × 50 = 2600 per maze. 10,000 rewards roughly
// three mazes plus fruit/ghosts, and matches the original extra-life milestone.
export const TARGET_SCORE = 10000;
export const normalizeScore = (raw: number, maximum: number) =>
  Math.max(0, Math.min(maximum, Math.round(raw / TARGET_SCORE * maximum)));
export type Challenge = { deadline: number; score: number; handedOff: boolean };
export type EngineMessage = { channel: 'rally-pacman-v1'; instance: string;
  type: 'ready' | 'started' | 'score' | 'round-over' | 'stopped' | 'error';
  sequence: number; at: number; score: number };
export function isEngineMessage(value: unknown, instance: string): value is EngineMessage {
  if (!value || typeof value !== 'object') return false;
  const v = value as EngineMessage;
  return v.channel === 'rally-pacman-v1' && v.instance === instance
    && ['ready', 'started', 'score', 'round-over', 'stopped', 'error'].includes(v.type)
    && Number.isSafeInteger(v.sequence) && v.sequence > 0 && Number.isSafeInteger(v.at)
    && Number.isSafeInteger(v.score) && v.score >= 0 && v.score <= 1000000;
}
export function readChallenge(key: string): Challenge | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  const state = JSON.parse(raw) as Challenge;
  if (!Number.isSafeInteger(state.deadline) || !Number.isSafeInteger(state.score) || state.score < 0 || typeof state.handedOff !== 'boolean') {
    throw new Error('Saved challenge is invalid. Ask an organiser for help.');
  }
  return state;
}

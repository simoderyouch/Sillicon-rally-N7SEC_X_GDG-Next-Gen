import { CHALLENGES } from './challenges';
import type { Outcome, Save } from './types';
import { getTeamToken } from '../../teamSession';

export function storageKey(missionId: string) {
  const token = getTeamToken() ?? 'preview';
  return `rally:password-chaos:v2:${token}:${missionId}`;
}

export function legacyStorageKey(missionId: string) {
  const token = getTeamToken() ?? 'preview';
  return `rally:password-chaos:v1:${token}:${missionId}`;
}

/** Move in-progress Password Chaos data from pre-durable player sessions. */
function readStored(key: string): string | null {
  const persistent = localStorage.getItem(key);
  if (persistent !== null) return persistent;
  const legacy = sessionStorage.getItem(key);
  if (legacy === null) return null;
  try {
    localStorage.setItem(key, legacy);
    sessionStorage.removeItem(key);
  } catch {
    // Retain the legacy session when persistent browser storage is unavailable.
  }
  return legacy;
}

/** Drop a session saved under the retired 188-second limits. Those deadlines cannot be mapped onto the current countdowns. */
export function retireLegacySession(missionId: string) {
  try {
    const legacy = legacyStorageKey(missionId);
    if (!readStored(legacy)) return false;
    localStorage.removeItem(legacy);
    sessionStorage.removeItem(legacy);
    return true;
  } catch {
    return false;
  }
}

export function blankSave(): Save {
  return { phase: 'briefing', index: 0, deadline: null, outcomes: [], draft: '', handedOff: false, startedAt: null, finishedAt: null };
}

function validOutcome(value: Outcome) {
  return Number.isInteger(value.id) && (value.status === 'success' || value.status === 'timeout') && Number.isFinite(value.score) && Number.isFinite(value.elapsedMs);
}

export function parseSave(raw: string | null): Save | null {
  if (!raw) return blankSave();
  try {
    const save = JSON.parse(raw) as Save;
    if (!save || (save.phase !== 'briefing' && save.phase !== 'playing' && save.phase !== 'done')) return null;
    if (!Number.isInteger(save.index) || save.index < 0 || save.index > CHALLENGES.length) return null;
    if (save.deadline !== null && !Number.isFinite(save.deadline)) return null;
    if (!Array.isArray(save.outcomes) || !save.outcomes.every(validOutcome)) return null;
    if (typeof save.draft !== 'string' || typeof save.handedOff !== 'boolean') return null;
    if (save.startedAt !== null && !Number.isFinite(save.startedAt)) return null;
    if (save.finishedAt !== null && !Number.isFinite(save.finishedAt)) return null;
    return save;
  } catch {
    return null;
  }
}

export function readSave(key: string) {
  try {
    return parseSave(readStored(key));
  } catch {
    return null;
  }
}

export function writeSave(key: string, save: Save) {
  localStorage.setItem(key, JSON.stringify(save));
  return save;
}

/** Time spent away still expires challenges. The next deadline continues from the missed deadline. */
export function settleExpired(save: Save, now: number): Save {
  if (save.phase !== 'playing' || save.deadline === null) return save;
  let index = save.index;
  let deadline = save.deadline;
  const outcomes = [...save.outcomes];
  let draft = save.draft;
  while (index < CHALLENGES.length && deadline <= now) {
    const challenge = CHALLENGES[index];
    outcomes.push({ id: challenge.id, status: 'timeout', score: 0, elapsedMs: challenge.seconds * 1000 });
    const expiredAt = deadline;
    index += 1;
    draft = '';
    if (index >= CHALLENGES.length) {
      return { ...save, phase: 'done', index, deadline: null, outcomes, draft, finishedAt: expiredAt };
    }
    deadline += CHALLENGES[index].seconds * 1000;
  }
  if (index === save.index) return save;
  return { ...save, index, deadline, outcomes, draft };
}

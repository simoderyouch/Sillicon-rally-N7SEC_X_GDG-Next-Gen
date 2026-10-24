import { describe, expect, it } from 'vitest';
import { CHALLENGES, TOTAL_SECONDS } from './challenges';
import { blankSave, legacyStorageKey, parseSave, retireLegacySession, retiredStorageKeys, settleExpired } from './persistence';
import { challengeScore, submittedScore, totalScore } from './scoring';
import { afterEach } from 'vitest';

afterEach(() => { localStorage.clear(); sessionStorage.clear(); });

describe('password scoring and recovery', () => {
  it('pays the base plus a proportional speed bonus, rounded to cents', () => {
    const hard = CHALLENGES[0].seconds * 1000;
    const expert = CHALLENGES[15].seconds * 1000;
    expect(challengeScore(2, 2, hard, hard)).toBe(4);
    expect(challengeScore(2, 2, hard, hard / 2)).toBe(3);
    expect(challengeScore(2, 2, hard, 1)).toBe(2);
    expect(challengeScore(4, 4, expert, expert / 2)).toBe(6);
    expect(challengeScore(4, 4, expert, expert)).toBe(8);
    expect(challengeScore(2, 2, hard, 0)).toBe(2);
    expect(challengeScore(2, 2, hard, -hard)).toBe(2);
    expect(challengeScore(4, 4, expert, expert * 4)).toBe(8);
    expect(challengeScore(2, 2, hard, hard / 2)).toBeGreaterThan(challengeScore(2, 2, hard, 1));
    expect(totalScore([4, 3.33, 2])).toBe(9.33);
    expect(totalScore([100, 5])).toBe(100);
    expect(submittedScore(62.6, 100)).toBe(63);
    expect(submittedScore(62.4, 100)).toBe(62);
    expect(submittedScore(50, 40)).toBe(20);
    expect(submittedScore(0, 100)).toBe(0);
  });

  it('expires every missed deadline from the original timestamps', () => {
    const start = 1_000_000;
    const first = CHALLENGES[0].seconds * 1000;
    const second = CHALLENGES[1].seconds * 1000;
    const save = { ...blankSave(), phase: 'playing' as const, deadline: start + first, startedAt: start };
    const settled = settleExpired(save, start + first + second);
    expect(settled.index).toBe(2);
    expect(settled.outcomes.map(item => item.status)).toEqual(['timeout', 'timeout']);
    expect(settled.deadline).toBe(start + first + second + CHALLENGES[2].seconds * 1000);
    const finished = settleExpired(save, start + TOTAL_SECONDS * 1000);
    expect(finished.phase).toBe('done');
    expect(finished.outcomes).toHaveLength(20);
    expect(finished.outcomes.every(item => item.score === 0)).toBe(true);
    expect(finished.finishedAt).toBe(start + TOTAL_SECONDS * 1000);
  });

  it('rejects a damaged saved session and drops a retired v1 session', () => {
    expect(parseSave(null)?.phase).toBe('briefing');
    expect(parseSave('{')).toBeNull();
    expect(parseSave(JSON.stringify({ phase: 'playing', index: 99, deadline: 1, outcomes: [], draft: '', handedOff: false, startedAt: 1, finishedAt: null }))).toBeNull();
    localStorage.setItem(legacyStorageKey('mission'), '{"phase":"playing"}');
    localStorage.setItem(retiredStorageKeys('mission')[1], '{"phase":"playing","index":3}');
    expect(retireLegacySession('mission')).toBe(true);
    expect(localStorage.getItem(legacyStorageKey('mission'))).toBeNull();
    expect(localStorage.getItem(retiredStorageKeys('mission')[1])).toBeNull();
    expect(retireLegacySession('mission')).toBe(false);
  });
});

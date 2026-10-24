import { describe, expect, it } from 'vitest';
import { cellColor, failureMessage, normalizeScore, run } from './engine';
import { LEVELS, TOTAL_POINTS } from './levels';
import type { Instruction, Programs } from './types';

const F = (when?: Instruction['when']): Instruction => ({ op: 'forward', when });
const L = (when?: Instruction['when']): Instruction => ({ op: 'left', when });
const R = (when?: Instruction['when']): Instruction => ({ op: 'right', when });
const call = (op: 'f1' | 'f2'): Instruction => ({ op });
const program = (f1: Instruction[], f2: Instruction[] = []): Programs => ({ f1, f2 });
const level = (id: number) => LEVELS.find(item => item.id === id)!;

describe('algo engine', () => {
  it('turns, moves, rejects an off-board step, and collects a star', () => {
    const first = level(1);
    const turned = run(first, program([R()]));
    expect(turned.steps.at(-1)?.dir).toBe('S');
    const crashed = run(first, program([L(), F()]));
    expect(crashed.ok).toBe(false);
    expect(crashed.reason).toBe('off-board');
    expect(failureMessage(crashed.reason)).toMatch(/left the path/);
    const solved = run(first, program([F(), F(), F(), F(), F()]));
    expect(solved.ok).toBe(true);
    expect(solved.steps.at(-1)?.collected).toEqual(['2,6']);
  });

  it('skips a color condition and stops runaway functions', () => {
    const sixth = level(6);
    const skipped = run(sixth, program([F('cyan')]));
    expect(skipped.steps[0]).toMatchObject({ skipped: true, r: sixth.start.r, c: sixth.start.c });
    expect(cellColor(sixth, sixth.start.r, sixth.start.c)).toBe('red');
    expect(run(sixth, program([call('f1')])).reason).toBe('depth');
    expect(run(firstSafe(), program(Array.from({ length: 501 }, () => L()))).reason).toBe('limit');
  });

  it('runs nested functions for every level solution', () => {
    const solutions: Programs[] = [
      program([F(), F(), F(), F(), F()]),
      program([F(), F(), F(), L(), F(), F(), R(), F()]),
      program([F(), F(), F(), F(), F(), L(), F(), F(), L(), F(), F(), F()]),
      program([F(), F(), F(), L(), call('f1')]),
      program([F(), L(), F(), R(), call('f1')]),
      program([F('red'), F('red'), F('red'), L('cyan'), F('cyan'), F('cyan'), R('cyan'), F('cyan')]),
      program([call('f2'), call('f2'), call('f2'), call('f2')], [F(), F(), L()]),
      program([call('f2'), call('f2'), call('f2')], [F(), F(), L('red'), R('cyan'), F('orange')]),
    ];
    expect(TOTAL_POINTS).toBe(100);
    solutions.forEach((solution, index) => {
      const result = run(LEVELS[index], solution);
      expect(result.ok, `level ${index + 1} ${result.reason}`).toBe(true);
    });
    const nested = run(level(7), solutions[6]);
    expect(nested.steps.some(step => step.program === 'f2')).toBe(true);
  });

  it('normalizes level points to the mission ceiling', () => {
    expect(normalizeScore(0, 100)).toBe(0);
    expect(normalizeScore(5, 100)).toBe(5);
    expect(normalizeScore(100, 100)).toBe(100);
    expect(normalizeScore(100, 40)).toBe(40);
    expect(normalizeScore(5, 50)).toBe(3);
    expect(normalizeScore(-10, 100)).toBe(0);
  });
});

function firstSafe() { return level(1); }

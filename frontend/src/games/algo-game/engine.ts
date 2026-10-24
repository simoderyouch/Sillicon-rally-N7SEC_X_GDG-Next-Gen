import type { Color, Dir, Instruction, Level, ProgramName, Programs, RunResult, TraceStep } from './types';

export const DURATION_SECONDS = 300;
export const MAX_STEPS = 500;
export const MAX_DEPTH = 24;
const DELTA: Record<Dir, { r: number; c: number }> = {
  N: { r: -1, c: 0 }, E: { r: 0, c: 1 }, S: { r: 1, c: 0 }, W: { r: 0, c: -1 },
};
const LEFT: Record<Dir, Dir> = { N: 'W', W: 'S', S: 'E', E: 'N' };
const RIGHT: Record<Dir, Dir> = { N: 'E', E: 'S', S: 'W', W: 'N' };

export function cellColor(level: Level, r: number, c: number): Color | null {
  const row = level.rows[r];
  const ch = row?.[c];
  if (ch === 'R') return 'red';
  if (ch === 'O') return 'orange';
  if (ch === 'C') return 'cyan';
  return null;
}

export function starKey(r: number, c: number) { return `${r},${c}`; }

export function normalizeScore(earned: number, maxScore: number) {
  return Math.max(0, Math.min(maxScore, Math.round(earned / 100 * maxScore)));
}

export function levelPoints(ids: number[], levels: { id: number; points: number }[]) {
  return ids.reduce((sum, id) => sum + (levels.find(level => level.id === id)?.points ?? 0), 0);
}

function filled(program: (Instruction | null)[]) {
  return program.some(instruction => instruction !== null);
}

export function run(level: Level, programs: Programs): RunResult {
  if (!filled(programs.f1) && !filled(programs.f2)) return { ok: false, steps: [], reason: 'empty' };
  const stars = new Set(level.stars.map(star => starKey(star.r, star.c)));
  const collected = new Set<string>();
  let r = level.start.r;
  let c = level.start.c;
  let dir = level.start.dir;
  const here = starKey(r, c);
  if (stars.has(here)) collected.add(here);
  const steps: TraceStep[] = [];
  const stack: { name: ProgramName; index: number }[] = [{ name: 'f1', index: 0 }];
  let executed = 0;

  const snapshot = (program: ProgramName, index: number, skipped: boolean): TraceStep => ({
    r, c, dir, program, index, skipped, collected: [...collected],
  });

  while (stack.length) {
    if (stack.length > MAX_DEPTH) return { ok: false, steps, reason: 'depth' };
    if (executed >= MAX_STEPS) return { ok: false, steps, reason: 'limit' };
    const frame = stack[stack.length - 1];
    const program = programs[frame.name];
    if (frame.index >= program.length) { stack.pop(); continue; }
    const index = frame.index;
    const instruction = program[index];
    frame.index += 1;
    if (!instruction) continue;
    executed += 1;
    const standing = cellColor(level, r, c);
    if (instruction.when && standing !== instruction.when) {
      steps.push(snapshot(frame.name, index, true));
      continue;
    }
    if (instruction.op === 'f1' || instruction.op === 'f2') {
      steps.push(snapshot(frame.name, index, false));
      stack.push({ name: instruction.op, index: 0 });
      continue;
    }
    if (instruction.op === 'left') dir = LEFT[dir];
    if (instruction.op === 'right') dir = RIGHT[dir];
    if (instruction.op === 'forward') {
      const next = { r: r + DELTA[dir].r, c: c + DELTA[dir].c };
      if (!cellColor(level, next.r, next.c)) return { ok: false, steps, reason: 'off-board' };
      r = next.r;
      c = next.c;
      if (stars.has(starKey(r, c))) collected.add(starKey(r, c));
    }
    steps.push(snapshot(frame.name, index, false));
    if (collected.size === stars.size) return { ok: true, steps, reason: 'complete' };
  }
  return { ok: collected.size === stars.size, steps, reason: collected.size === stars.size ? 'complete' : 'incomplete' };
}

export function failureMessage(reason: RunResult['reason']) {
  if (reason === 'empty') return 'Add at least one instruction to F1.';
  if (reason === 'off-board') return 'The robot left the path.';
  if (reason === 'limit') return 'The program ran too long and was stopped.';
  if (reason === 'depth') return 'The functions called each other too deeply and were stopped.';
  return 'The program ended before every star was collected.';
}

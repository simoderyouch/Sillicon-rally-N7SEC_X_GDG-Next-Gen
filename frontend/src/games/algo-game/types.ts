export type Dir = 'N' | 'E' | 'S' | 'W';
export type Color = 'red' | 'orange' | 'cyan';
export type Op = 'forward' | 'left' | 'right' | 'f1' | 'f2';
export type ProgramName = 'f1' | 'f2';

export type Instruction = { op: Op; when?: Color };

export type Level = {
  id: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  points: number;
  hint: string;
  rows: string[];
  start: { r: number; c: number; dir: Dir };
  stars: { r: number; c: number }[];
  slots: { f1: number; f2: number };
  commands: Op[];
  conditions: boolean;
  note?: string;
};

export type Programs = Record<ProgramName, (Instruction | null)[]>;

export type TraceStep = {
  r: number;
  c: number;
  dir: Dir;
  program: ProgramName;
  index: number;
  skipped: boolean;
  collected: string[];
};

export type RunResult = {
  ok: boolean;
  steps: TraceStep[];
  reason: 'complete' | 'incomplete' | 'off-board' | 'limit' | 'depth' | 'empty';
};

export type Tier = 'HARD' | 'EXPERT';

export type Challenge = {
  id: number;
  title: string;
  tier: Tier;
  seconds: number;
  base: number;
  bonus: number;
  length: { exact?: number; min?: number; max?: number };
  rules: { id: string; label: string }[];
};

export type Outcome = {
  id: number;
  status: 'success' | 'timeout';
  score: number;
  elapsedMs: number;
};

export type Phase = 'briefing' | 'playing' | 'done';

export type Save = {
  phase: Phase;
  index: number;
  deadline: number | null;
  outcomes: Outcome[];
  draft: string;
  handedOff: boolean;
  startedAt: number | null;
  finishedAt: number | null;
};

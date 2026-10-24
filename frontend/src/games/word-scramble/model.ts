export const words = [
  { word: 'CAMERA', hint: 'A device used to watch or record an area' },
  { word: 'SECURITY', hint: 'Keeping people, devices, or information safe' },
  { word: 'PASSWORD', hint: 'A secret word used to access an account' },
  { word: 'PROTECTION', hint: 'Keeping something safe from danger' },
  { word: 'DEFENSE', hint: 'The act of protecting against attacks' },
  { word: 'HACKER', hint: 'Someone who uses technical skills to explore computer systems' },
  { word: 'VIRUS', hint: 'A type of malicious computer program' },
  { word: 'FIREWALL', hint: 'A security system that filters network traffic' },
  { word: 'BACKUP', hint: 'A saved copy of important files' },
  { word: 'PRIVACY', hint: 'Keeping personal information from being exposed' },
] as const;

export type Round = { word: string; scrambled: string; hintUsed: boolean; wrongAttempts: number; solved: boolean };
export type Run = { version: 1; id: string; rounds: Round[]; submitted: boolean };
export const MAX_ATTEMPTS = 3;
export const isDone = (round: Round) => round.solved || round.wrongAttempts >= MAX_ATTEMPTS;
export const points = (round: Round) => !round.solved ? 0 : round.hintUsed ? round.wrongAttempts > 0 ? 3 : 7 : round.wrongAttempts > 0 ? 5 : 10;
export const score = (run: Run) => run.rounds.reduce((sum, round) => sum + points(round), 0);
export const hintsRemaining = (run: Run) => 3 - run.rounds.filter(round => round.hintUsed).length;
export const currentIndex = (run: Run) => run.rounds.findIndex(round => !isDone(round));
function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
export function newRun(random = Math.random): Run {
  return { version: 1, id: crypto.randomUUID(), submitted: false, rounds: shuffle(words, random).map(({ word }) => {
    let scrambled = shuffle([...word], random).join('');
    if (scrambled === word) scrambled = word.slice(1) + word[0];
    return { word, scrambled, hintUsed: false, wrongAttempts: 0, solved: false };
  }) };
}
export function readRun(key: string): Run | null {
  const raw = localStorage.getItem(key);
  if (raw === null) return null;
  let run: Run;
  try { run = JSON.parse(raw) as Run; } catch { throw new Error('La sauvegarde est illisible. Recommencez une nouvelle partie.'); }
  const valid = run && run.version === 1 && typeof run.id === 'string' && typeof run.submitted === 'boolean'
    && Array.isArray(run.rounds) && run.rounds.length === words.length
    && new Set(run.rounds.map(round => round.word)).size === words.length
    && run.rounds.every(round => words.some(entry => entry.word === round.word)
      && typeof round.scrambled === 'string' && round.scrambled !== round.word
      && [...round.scrambled].sort().join('') === [...round.word].sort().join('')
      && typeof round.hintUsed === 'boolean' && typeof round.solved === 'boolean'
      && Number.isSafeInteger(round.wrongAttempts) && round.wrongAttempts >= 0)
    && hintsRemaining(run) >= 0
    && run.rounds.every((round, i) => !isDone(round) || run.rounds.slice(0, i).every(isDone))
    && run.rounds.every((round, i) => isDone(round) || i === currentIndex(run) || (!round.hintUsed && round.wrongAttempts === 0))
    && (!run.submitted || currentIndex(run) === -1);
  if (!valid) throw new Error('La sauvegarde est invalide. Recommencez une nouvelle partie.');
  return run;
}
export function saveRun(key: string, run: Run): void { localStorage.setItem(key, JSON.stringify(run)); }
export function storageKey(missionId: string): string {
  // Only a one-way hash of the durable team token is used in the local key.
  const identity = localStorage.getItem('teamToken') ?? sessionStorage.getItem('teamToken') ?? 'local-preview';
  let hash = 2166136261;
  for (const char of identity) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return `word-scramble:v1:${missionId}:${(hash >>> 0).toString(36)}`;
}

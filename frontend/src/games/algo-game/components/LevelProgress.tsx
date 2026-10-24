import type { Level } from '../types';

export function LevelProgress({ levels, current, cleared, onPick, disabled }: {
  levels: Level[];
  current: number;
  cleared: number[];
  onPick: (id: number) => void;
  disabled: boolean;
}) {
  return <ol className="algo-progress">
    {levels.map(level => {
      const done = cleared.includes(level.id);
      const open = done || level.id === current || cleared.includes(level.id - 1) || level.id === 1;
      return <li key={level.id}>
        <button type="button" disabled={disabled || !open} aria-current={level.id === current ? 'step' : undefined} onClick={() => onPick(level.id)}>
          <b>{level.id}</b>
          <span>{done ? 'Done' : `${level.points} pts`}</span>
        </button>
      </li>;
    })}
  </ol>;
}

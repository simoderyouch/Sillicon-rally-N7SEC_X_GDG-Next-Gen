import type { Dir, Level } from '../types';
import { cellColor, starKey } from '../engine';

const ROTATION: Record<Dir, number> = { N: 0, E: 90, S: 180, W: 270 };

export function GameBoard({ level, r, c, dir, collected, moving }: {
  level: Level;
  r: number;
  c: number;
  dir: Dir;
  collected: string[];
  moving: boolean;
}) {
  const columns = level.rows[0].length;
  return <div className="algo-board" role="img" aria-label={`Level ${level.id} board. Robot facing ${dir}.`}>
    <div className="algo-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {level.rows.flatMap((row, rowIndex) => [...row].map((ch, column) => {
        const color = cellColor(level, rowIndex, column);
        const key = starKey(rowIndex, column);
        const star = level.stars.some(item => item.r === rowIndex && item.c === column);
        const robot = rowIndex === r && column === c;
        return <div key={key} className={`algo-cell ${color ?? 'void'}`}>
          {star && <span className={`algo-star ${collected.includes(key) ? 'got' : ''}`} aria-hidden="true">★</span>}
          {robot && color && <span className={`algo-robot ${moving ? 'moving' : ''}`} style={{ transform: `rotate(${ROTATION[dir]}deg)` }} aria-hidden="true" />}
          {ch === '.' && null}
        </div>;
      }))}
    </div>
  </div>;
}

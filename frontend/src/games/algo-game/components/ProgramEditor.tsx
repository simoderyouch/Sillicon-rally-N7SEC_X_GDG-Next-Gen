import type { Instruction, ProgramName } from '../types';
import { instructionLabel } from './labels';

export function ProgramEditor({ rows, active, onSlot, disabled }: {
  rows: { name: ProgramName; label: string; slots: (Instruction | null)[] }[];
  active?: { name: ProgramName; index: number };
  onSlot: (name: ProgramName, index: number) => void;
  disabled: boolean;
}) {
  return <div className="algo-editor">
    {rows.map(row => <div key={row.name} className="algo-row">
      <span className="algo-fn">{row.label}</span>
      <div className="algo-slots">
        {row.slots.map((instruction, index) => {
          const hot = active?.name === row.name && active.index === index;
          return <button key={index} type="button" className={`algo-slot ${instruction ? 'filled' : ''} ${hot ? 'hot' : ''}`}
            disabled={disabled} onClick={() => onSlot(row.name, index)}
            aria-label={`${row.label} slot ${index + 1}${instruction ? `, ${instructionLabel(instruction)}` : ', empty'}`}>
            {instruction && <i className={`swatch ${instruction.when ?? ''}`} aria-hidden="true" />}
            <b>{instruction ? shortOp(instruction.op) : ''}</b>
          </button>;
        })}
      </div>
    </div>)}
  </div>;
}

function shortOp(op: Instruction['op']) {
  if (op === 'forward') return '↑';
  if (op === 'left') return '↺';
  if (op === 'right') return '↻';
  if (op === 'f1') return 'F1';
  return 'F2';
}

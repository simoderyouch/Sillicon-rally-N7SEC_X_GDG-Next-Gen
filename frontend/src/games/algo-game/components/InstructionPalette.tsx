import type { Color, Op } from '../types';
import { COLOR_LABEL, OP_LABEL } from './labels';

export function InstructionPalette({ ops, armed, brush, conditions, onArm, onBrush, disabled }: {
  ops: Op[];
  armed: Op | null;
  brush: Color | null;
  conditions: boolean;
  onArm: (op: Op) => void;
  onBrush: (color: Color) => void;
  disabled: boolean;
}) {
  const colors: Color[] = ['red', 'orange', 'cyan'];
  return <div className="algo-palette" role="toolbar" aria-label="Instructions">
    {ops.map(op => <button key={op} type="button" className="algo-cmd" aria-pressed={armed === op} disabled={disabled} onClick={() => onArm(op)}>{glyph(op)}<span>{OP_LABEL[op]}</span></button>)}
    {conditions && colors.map(color => <button key={color} type="button" className={`algo-color ${color}`} aria-pressed={brush === color} disabled={disabled} onClick={() => onBrush(color)} aria-label={COLOR_LABEL[color]} />)}
  </div>;
}

function glyph(op: Op) {
  if (op === 'forward') return '↑';
  if (op === 'left') return '↺';
  if (op === 'right') return '↻';
  if (op === 'f1') return 'F1';
  return 'F2';
}

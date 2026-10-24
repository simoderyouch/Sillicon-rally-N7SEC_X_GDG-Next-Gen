import type { Color, Instruction, Op } from '../types';

export const OP_LABEL: Record<Op, string> = {
  forward: 'Forward',
  left: 'Turn left',
  right: 'Turn right',
  f1: 'Call F1',
  f2: 'Call F2',
};

export const COLOR_LABEL: Record<Color, string> = {
  red: 'Only on red',
  orange: 'Only on orange',
  cyan: 'Only on cyan',
};

export function instructionLabel(instruction: Instruction) {
  const base = OP_LABEL[instruction.op];
  return instruction.when ? `${base}, ${COLOR_LABEL[instruction.when].toLowerCase()}` : base;
}

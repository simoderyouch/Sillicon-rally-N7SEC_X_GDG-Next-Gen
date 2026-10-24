import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { games } from '../registry';
import { game } from './index';

const mission = { id: 'algo-id', slug: 'algo-game', title: 'Algo Game', description: '', maxScore: 100, releaseState: 'PUBLISHED' as const };
const Component = game.component;

function advance(ms: number) { act(() => vi.advanceTimersByTime(ms)); }
function rallyScore() { return screen.getByText(/Rally score/).querySelector('strong')?.textContent; }
function slots(count: number) {
  for (let index = 1; index <= count; index += 1) fireEvent.click(screen.getByRole('button', { name: `F1 slot ${index}, empty` }));
}
function runProgram() {
  fireEvent.click(screen.getByRole('button', { name: 'x50' }));
  fireEvent.click(screen.getByRole('button', { name: 'Run program' }));
  advance(1200);
}

beforeEach(() => { vi.useFakeTimers(); sessionStorage.clear(); });
afterEach(() => { cleanup(); vi.useRealTimers(); sessionStorage.clear(); });

describe('Algo Game', () => {
  it('is discovered by the game registry', () => {
    expect(games['algo-game'].slug).toBe('algo-game');
    expect(game.slug).toBe('algo-game');
  });

  it('solves level 1 once, unlocks level 2, and does not score the retry', () => {
    const complete = vi.fn();
    render(<Component mission={mission} onComplete={complete} />);
    expect(screen.getByRole('heading', { name: 'Level 1' })).toBeInTheDocument();
    expect(screen.getByLabelText('Time remaining')).toHaveTextContent('05:00');
    slots(5);
    runProgram();
    expect(screen.getByRole('heading', { name: 'Level 2' })).toBeInTheDocument();
    expect(rallyScore()).toBe('5');
    expect(complete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /1 Done/ }));
    runProgram();
    expect(rallyScore()).toBe('5');
  });

  it('gives no points for an incomplete program', () => {
    render(<Component mission={mission} onComplete={vi.fn()} />);
    slots(1);
    runProgram();
    expect(screen.getByRole('status')).toHaveTextContent(/before every star/);
    expect(rallyScore()).toBe('0');
    expect(screen.getByRole('heading', { name: 'Level 1' })).toBeInTheDocument();
  });

  it('keeps the deadline and score across a remount and completes once', () => {
    const complete = vi.fn();
    const first = render(<Component mission={mission} onComplete={complete} />);
    slots(5);
    runProgram();
    advance(60000);
    first.unmount();
    render(<Component mission={mission} onComplete={complete} />);
    expect(screen.getByLabelText('Time remaining')).toHaveTextContent('03:59');
    expect(rallyScore()).toBe('5');
    expect(complete).not.toHaveBeenCalled();
    advance(240000);
    expect(complete).toHaveBeenCalledTimes(1);
    expect(complete.mock.calls[0][0]).toMatchObject({ score: 5, completed: true, details: { source: 'algo-game', levelsCompleted: 1, totalLevels: 8, durationSeconds: 300 } });
    advance(5000);
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it('submits the accumulated score when time expires and ignores a later remount', () => {
    const complete = vi.fn();
    const view = render(<Component mission={mission} onComplete={complete} />);
    advance(300000);
    expect(screen.getByLabelText('Time remaining')).toHaveTextContent('00:00');
    expect(complete).toHaveBeenCalledWith(expect.objectContaining({ score: 0, completed: true, details: expect.objectContaining({ levelsCompleted: 0 }) }));
    view.unmount();
    render(<Component mission={mission} onComplete={complete} />);
    advance(1000);
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it('does not submit while disabled and submits once controls return', () => {
    const complete = vi.fn();
    const view = render(<Component mission={mission} onComplete={complete} disabled />);
    advance(301000);
    expect(complete).not.toHaveBeenCalled();
    view.rerender(<Component mission={mission} onComplete={complete} />);
    expect(complete).toHaveBeenCalledTimes(1);
  });
});

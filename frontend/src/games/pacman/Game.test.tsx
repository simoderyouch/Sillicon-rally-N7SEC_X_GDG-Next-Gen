import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { game } from './index';
import { normalizeScore } from './challenge';
const mission = { id: 'pacman-id', slug: 'pacman', title: 'Pac-Man Challenge', description: '', maxScore: 100, releaseState: 'PUBLISHED' as const };
const Component = game.component;
let sequence = 0;
function message(type: string, score = 0, overrides: Record<string, unknown> = {}, sender?: Window | null, origin = location.origin) {
  const frame = screen.getByTitle('Pac-Man game') as HTMLIFrameElement;
  const instance = frame.srcdoc.match(/const INSTANCE="([^"]+)"/)![1];
  act(() => window.dispatchEvent(new MessageEvent('message', { source: sender === undefined ? frame.contentWindow : sender,
    origin, data: { channel: 'rally-pacman-v1', instance, type, score, sequence: ++sequence, at: Date.now(), ...overrides } })));
}
function start() { message('ready'); fireEvent.click(screen.getByRole('button', { name: 'Start five-minute challenge' })); }
function advance(ms: number) { act(() => vi.advanceTimersByTime(ms)); }
beforeEach(() => { vi.useFakeTimers(); sessionStorage.clear(); sequence = 0; });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); sessionStorage.clear(); });
describe('Pac-Man challenge', () => {
  it('renders the mission and waits for readiness before starting', () => {
    render(<Component mission={mission} onComplete={vi.fn()} />);
    expect(screen.getByRole('heading', { name: mission.title })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start five/ })).toBeDisabled();
    message('ready'); expect(screen.getByRole('button', { name: /Start five/ })).toBeEnabled();
    expect(screen.getByLabelText('Time remaining')).toHaveTextContent('05:00');
  });
  it('starts once, receives engine scores, retains round-over points and completes exactly once', () => {
    const complete = vi.fn(); render(<Component mission={mission} onComplete={complete} />); start();
    advance(1000); message('started'); message('score', 2600); message('round-over', 2600);
    expect(screen.getByRole('status')).toHaveTextContent('Round over');
    message('started'); message('score', 3000);
    expect(screen.getByLabelText('Time remaining')).toHaveTextContent('04:59');
    advance(299000); expect(screen.getByLabelText('Time remaining')).toHaveTextContent('00:00');
    message('stopped', 3000);
    expect(complete).toHaveBeenCalledWith({ score: 30, completed: true, details: { pacmanScore: 3000, durationSeconds: 300 } });
    advance(1000); expect(complete).toHaveBeenCalledTimes(1);
  });
  it('rejects foreign senders, origins, stale instances, sequences and malformed scores', () => {
    render(<Component mission={mission} onComplete={vi.fn()} />); start();
    message('score', 100, {}, window); message('score', 100, {}, undefined, 'https://elsewhere.example');
    message('score', 100, { instance: 'stale' });
    for (const score of [-1, NaN, Infinity, 1.2, '100', 1000001]) message('score', 0, { score });
    expect(screen.getByText('Pac-Man score: 0')).toBeInTheDocument();
    message('score', 100); message('score', 200, { sequence: 1 }); message('score', 10);
    expect(screen.getByText('Pac-Man score: 100')).toBeInTheDocument();
  });
  it('ignores scores before starting and at/after the deadline', () => {
    const complete = vi.fn(); render(<Component mission={mission} onComplete={complete} />);
    message('score', 200); start(); message('score', 100);
    advance(300000); message('score', 9000); advance(300);
    expect(complete.mock.calls[0][0].score).toBe(1);
  });
  it('preserves the deadline and accumulated score across unmount and remount', () => {
    const complete = vi.fn(); const first = render(<Component mission={mission} onComplete={complete} />);
    start(); message('score', 2000); advance(60000); first.unmount(); advance(60000);
    render(<Component mission={mission} onComplete={complete} />); message('ready');
    expect(screen.getByLabelText('Time remaining')).toHaveTextContent('03:00');
    expect(screen.getByText('Pac-Man score: 2000')).toBeInTheDocument();
    advance(180300); expect(complete).toHaveBeenCalledTimes(1);
    cleanup(); render(<Component mission={mission} onComplete={complete} />); advance(1000);
    expect(complete).toHaveBeenCalledTimes(1);
  });
  it('does not run disabled, destroys the frame and keeps the deadline through disable/enable', () => {
    const complete = vi.fn(); const view = render(<Component mission={mission} onComplete={complete} disabled />);
    expect(screen.queryByTitle('Pac-Man game')).not.toBeInTheDocument();
    view.rerender(<Component mission={mission} onComplete={complete} />); start(); message('score', 500);
    view.rerender(<Component mission={mission} onComplete={complete} disabled />);
    expect(screen.queryByTitle('Pac-Man game')).not.toBeInTheDocument(); advance(301000);
    expect(complete).not.toHaveBeenCalled(); view.rerender(<Component mission={mission} onComplete={complete} />);
    advance(500); expect(complete).toHaveBeenCalledTimes(1);
  });
  it('times out missing resources and retries without resetting the timer', () => {
    render(<Component mission={mission} onComplete={vi.fn()} />); advance(20000);
    expect(screen.getByRole('alert')).toHaveTextContent('did not become ready');
    fireEvent.click(screen.getByText('Retry loading')); start(); advance(5000); message('error');
    expect(screen.getByRole('alert')).toHaveTextContent('resources failed');
    fireEvent.click(screen.getByText('Retry loading')); message('ready');
    expect(screen.getByLabelText('Time remaining')).toHaveTextContent('04:55');
  });
  it('cleans timers and message listeners on unmount', () => {
    const remove = vi.spyOn(window, 'removeEventListener'); const clear = vi.spyOn(window, 'clearInterval'); const complete = vi.fn();
    const view = render(<Component mission={mission} onComplete={complete} />); start(); view.unmount();
    expect(remove).toHaveBeenCalledWith('message', expect.any(Function)); expect(clear).toHaveBeenCalled();
    advance(301000); expect(complete).not.toHaveBeenCalled();
  });
  it('shows zero when the engine stops before the next countdown tick', () => {
    const complete = vi.fn(); render(<Component mission={mission} onComplete={complete} />); start();
    vi.setSystemTime(Date.now() + 300000); message('stopped');
    expect(screen.getByLabelText('Time remaining')).toHaveTextContent('00:00');
    expect(complete).toHaveBeenCalledTimes(1);
  });
  it('clamps normalization to the mission maximum', () => {
    expect(normalizeScore(20000, 100)).toBe(100); expect(normalizeScore(-10, 100)).toBe(0);
    expect(normalizeScore(5000, 50)).toBe(25);
  });
});

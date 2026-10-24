import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { games } from '../registry';
import { CHALLENGES, TOTAL_SECONDS } from './challenges';
import { game } from './index';
import { legacyStorageKey } from './persistence';

const mission = { id: 'pw-id', slug: 'password-chaos', title: 'Password Chaos', description: '', maxScore: 100, releaseState: 'PUBLISHED' as const };
const Component = game.component;

function advance(ms: number) { act(() => { vi.advanceTimersByTime(ms); }); }
function start() { fireEvent.click(screen.getByRole('button', { name: 'Start' })); }
function answer(value: string) {
  fireEvent.change(screen.getByLabelText('Password'), { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: 'Validate' }));
}

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.useRealTimers(); localStorage.clear(); sessionStorage.clear(); });

describe('Password Chaos', () => {
  it('is discovered by the game registry', () => {
    expect(games['password-chaos'].slug).toBe('password-chaos');
  });

  it('keeps the briefing off the clock, rejects a partial password, then scores a fast answer once', () => {
    const complete = vi.fn();
    render(<Component mission={mission} onComplete={complete} />);
    expect(screen.getByText(/satisfies all conditions/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
    start();
    expect(screen.getByRole('heading', { name: 'Digital Equation' })).toBeInTheDocument();
    expect(screen.getByLabelText('Time remaining')).toHaveTextContent('30.0');
    answer('nope');
    expect(screen.getByRole('status')).toHaveTextContent(/not met/);
    expect(screen.getByRole('heading', { name: 'Digital Equation' })).toBeInTheDocument();
    answer('AB12345!');
    expect(screen.getByRole('heading', { name: 'Prime Hunter' })).toBeInTheDocument();
    expect(screen.getByText(/Score/).querySelector('strong')).toHaveTextContent('4.00');
    expect(complete).not.toHaveBeenCalled();
  });

  it('times out into the next challenge and restores that deadline after a reload', () => {
    const complete = vi.fn();
    const view = render(<Component mission={mission} onComplete={complete} />);
    start();
    answer('AB12345!');
    advance(3000);
    view.unmount();
    render(<Component mission={mission} onComplete={complete} />);
    expect(screen.getByRole('heading', { name: 'Prime Hunter' })).toBeInTheDocument();
    expect(screen.getByLabelText('Time remaining')).toHaveTextContent('32.0');
    advance(CHALLENGES[1].seconds * 1000);
    expect(screen.getByRole('heading', { name: 'Product 24' })).toBeInTheDocument();
    expect(screen.getByText(/Score/).querySelector('strong')).toHaveTextContent('4.00');
    expect(complete).not.toHaveBeenCalled();
  });

  it('submits once when the clock runs out and ignores a later remount', () => {
    const complete = vi.fn();
    const view = render(<Component mission={mission} onComplete={complete} />);
    start();
    vi.setSystemTime(Date.now() + TOTAL_SECONDS * 1000);
    advance(50);
    expect(screen.getByText(/Session complete/)).toBeInTheDocument();
    expect(complete).toHaveBeenCalledTimes(1);
    expect(complete.mock.calls[0][0]).toMatchObject({ score: 0, completed: true, details: { source: 'password-chaos', preciseScore: 0, solved: 0, timedOut: 20, challenges: 20 } });
    view.unmount();
    render(<Component mission={mission} onComplete={complete} />);
    advance(1000);
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it('does not resume a session saved with the retired time limits', () => {
    localStorage.setItem(legacyStorageKey(mission.id), JSON.stringify({ phase: 'playing', index: 4, deadline: Date.now() + 1000, outcomes: [], draft: '11111000', handedOff: false, startedAt: Date.now(), finishedAt: null }));
    render(<Component mission={mission} onComplete={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent(/retired time limits/);
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
    expect(localStorage.getItem(legacyStorageKey(mission.id))).toBeNull();
  });

  it('waits to submit while the platform has disabled the game', () => {
    const complete = vi.fn();
    const view = render(<Component mission={mission} onComplete={complete} />);
    start();
    view.rerender(<Component mission={mission} onComplete={complete} disabled />);
    vi.setSystemTime(Date.now() + TOTAL_SECONDS * 1000);
    advance(50);
    expect(complete).not.toHaveBeenCalled();
    view.rerender(<Component mission={mission} onComplete={complete} />);
    expect(complete).toHaveBeenCalledTimes(1);
  });
});

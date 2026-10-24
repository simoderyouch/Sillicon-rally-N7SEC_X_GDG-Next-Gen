import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { game } from './index';
import { flagApi, type FlagState } from './gameApi';
import { content } from './content';
const mission = { id: 'final-test', slug: 'final-flag-challenge', title: 'Final Flag Challenge', description: '', maxScore: 100, releaseState: 'PUBLISHED' as const };
const Component = game.component;
const initial: FlagState = { attempts: 0, maxAttempts: 0, solved: false, recorded: false, available: true, retryAfterMs: 0 };
function mount(disabled = false) { const onComplete = vi.fn(); return { ...render(<Component mission={mission} onComplete={onComplete} disabled={disabled} />), onComplete }; }
async function ready() { await waitFor(() => expect(screen.getByLabelText('Your flag')).toBeEnabled()); }
function enter(flag: string) { fireEvent.change(screen.getByLabelText('Your flag'), { target: { value: flag } }); }
beforeEach(() => {
  localStorage.clear(); sessionStorage.clear(); localStorage.setItem('teamToken', 'existing-team');
  vi.spyOn(flagApi, 'state').mockResolvedValue(initial);
  vi.spyOn(flagApi, 'verify').mockResolvedValue({ ...initial, attempts: 1, retryAfterMs: 3000 });
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it('shows the supplied asset and editable story and provides enlargement, zoom and close', async () => {
  mount(); await ready();
  expect(screen.getByText(content.storyTitle)).toBeInTheDocument();
  expect(screen.getAllByAltText(content.imageAlt)[0]).toHaveAttribute('src', content.image);
  expect(screen.getByText(content.paragraphs[3])).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Enlarge challenge image' }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
  expect(screen.getByText('125%')).toBeInTheDocument();
  fireEvent.change(screen.getByRole('slider', { name: 'Image zoom' }), { target: { value: '3' } });
  expect(screen.getByText('300%')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Zoom in' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Close image inspector' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
it('rejects blanks and sends trimmed flags only to the private validator using the current session', async () => {
  const { onComplete } = mount(); await ready(); enter('   ');
  expect(screen.getByRole('button', { name: /Submit Flag/ })).toBeDisabled();
  enter('  FLAG{test-only-incorrect}  '); fireEvent.click(screen.getByRole('button', { name: /Submit Flag/ }));
  expect(await screen.findByText('Incorrect flag. Keep investigating.')).toBeInTheDocument();
  expect(flagApi.verify).toHaveBeenCalledWith('existing-team', 'FLAG{test-only-incorrect}');
  expect(screen.getByText('Attempts: 1')).toBeInTheDocument();
  expect(onComplete).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: /Submit Flag/ })).toBeDisabled();
});
it('locks rapid clicks, celebrates server-verified success and hands off exactly once', async () => {
  let resolve!: (value: FlagState) => void;
  vi.mocked(flagApi.verify).mockImplementation(() => new Promise(done => { resolve = done; }));
  const { onComplete, rerender } = mount(); await ready(); enter('FLAG{test-only}');
  const form = screen.getByLabelText('Your flag').closest('form')!;
  fireEvent.submit(form); fireEvent.submit(form); fireEvent.submit(form);
  expect(flagApi.verify).toHaveBeenCalledTimes(1);
  resolve({ ...initial, attempts: 2, solved: true });
  expect(await screen.findByText('MISSION COMPLETE')).toBeInTheDocument();
  expect(screen.queryByLabelText('Your flag')).not.toBeInTheDocument();
  await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1), { timeout: 2500 });
  expect(onComplete).toHaveBeenCalledWith({ score: 100, completed: true, details: { challenge: 'final-flag', solved: true, attempts: 2 } });
  rerender(<Component mission={mission} onComplete={onComplete} disabled />);
  expect(onComplete).toHaveBeenCalledTimes(1);
});
it('restores pending validated completion but never replays an already recorded completion', async () => {
  vi.mocked(flagApi.state).mockResolvedValue({ ...initial, attempts: 4, solved: true, recorded: true });
  const { onComplete } = mount();
  expect(await screen.findByText('Your team’s result is already recorded.')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Submit|Restart|Play again/i })).not.toBeInTheDocument();
  expect(onComplete).not.toHaveBeenCalled();
});
it('recovers a lost successful validation reply through server state', async () => {
  vi.mocked(flagApi.state).mockResolvedValueOnce(initial).mockResolvedValue({ ...initial, attempts: 1, solved: true });
  vi.mocked(flagApi.verify).mockRejectedValue(new Error('Connection interrupted'));
  const { onComplete } = mount(); await ready(); enter('FLAG{test-only}');
  fireEvent.click(screen.getByRole('button', { name: /Submit Flag/ }));
  expect(await screen.findByText('MISSION COMPLETE')).toBeInTheDocument();
  await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1), { timeout: 2500 });
});
it('respects disabled props, configured limits, unavailable configuration and missing sessions', async () => {
  let view = mount(true); await screen.findByText('Attempts: 0');
  expect(screen.getByLabelText('Your flag')).toBeDisabled(); view.unmount();
  vi.mocked(flagApi.state).mockResolvedValue({ ...initial, maxAttempts: 2, attempts: 2 });
  view = mount(); expect(await screen.findByText('No attempts remaining.')).toBeInTheDocument();
  expect(screen.getByLabelText('Your flag')).toBeDisabled(); view.unmount();
  vi.mocked(flagApi.state).mockResolvedValue({ ...initial, available: false }); view = mount();
  expect(await screen.findByText(/waiting for the organiser/)).toBeInTheDocument();
  expect(screen.getByLabelText('Your flag')).toBeDisabled(); view.unmount();
  localStorage.clear(); mount(); expect(await screen.findByRole('alert')).toHaveTextContent('Your team session is missing');
});

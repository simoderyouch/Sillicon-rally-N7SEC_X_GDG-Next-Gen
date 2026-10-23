import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { game } from './index';
import { categories, triviaApi, type Snapshot } from './gameApi';
const mission = { id: 'trivia', slug: 'team-trivia-battle', title: 'Team Trivia Battle', description: '', maxScore: 100, releaseState: 'PUBLISHED' as const };
const Component = game.component;
function fixture(): Snapshot {
  return { category: 'it', number: 1, answered: 0, rawScore: 0, score: 0, correctAnswers: 0, incorrectAnswers: 0, timeouts: 0, totalTimeMs: 0, rank: 'Keep Learning', serverNow: 1000, deadline: 46000, nextAt: 0, complete: false, handedOff: false, question: { id: 'it-1', text: 'Quel composant exécute les instructions ?', options: ['CPU', 'Écran', 'Clavier', 'Souris'], difficulty: 'easy' }, feedback: null, review: [] };
}
function mount(disabled = false, onComplete = vi.fn()) { return { ...render(<MemoryRouter><Component mission={mission} onComplete={onComplete} disabled={disabled} /></MemoryRouter>), onComplete }; }
beforeEach(() => { sessionStorage.clear(); sessionStorage.setItem('teamToken', 'existing-team-token'); sessionStorage.setItem('teamName', 'Équipe Campus'); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });
describe('Team Trivia Battle', () => {
  it('uses the existing session and offers exactly six categories before confirmation', async () => {
    vi.spyOn(triviaApi, 'state').mockResolvedValue(null);
    const start = vi.spyOn(triviaApi, 'start').mockResolvedValue(fixture());
    mount(); await screen.findByText('Votre équipe.');
    expect(triviaApi.state).toHaveBeenCalledWith('existing-team-token');
    expect(screen.getByText('Équipe · Équipe Campus')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(categories).toHaveLength(6);
    for (const item of categories) expect(screen.getByRole('button', { name: `Choisir ${item.name}` })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Choisir IT' }));
    expect(start).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Confirmer et commencer/ }));
    await screen.findByRole('heading', { name: 'Quel composant exécute les instructions ?' });
    expect(start).toHaveBeenCalledWith('existing-team-token', 'it');
    expect(screen.queryByRole('button', { name: 'Choisir Movies' })).not.toBeInTheDocument();
    expect(screen.getByRole('timer')).toHaveTextContent('45');
  });
  it('resumes the server-selected category and remaining time after reopening', async () => {
    const saved = fixture(); saved.serverNow = 31000;
    const state = vi.spyOn(triviaApi, 'state').mockResolvedValue(saved);
    const view = mount(); await screen.findByRole('timer');
    expect(screen.getByRole('timer')).toHaveTextContent('15');
    expect(screen.queryByText(/Confirmer et commencer/)).not.toBeInTheDocument();
    view.unmount(); mount(); await screen.findByRole('timer');
    expect(screen.getByRole('timer')).toHaveTextContent('15');
    expect(state).toHaveBeenCalledTimes(2);
  });
  it('locks the chosen answer immediately, shows feedback, and advances on the server response', async () => {
    vi.spyOn(triviaApi, 'state').mockResolvedValue(fixture());
    let resolve!: (value: Snapshot) => void;
    const answer = vi.spyOn(triviaApi, 'answer').mockReturnValue(new Promise<Snapshot>(done => { resolve = done; }));
    mount(); const button = await screen.findByRole('button', { name: 'A CPU' });
    fireEvent.click(button); fireEvent.click(button);
    expect(screen.getByRole('button', { name: 'B Écran' })).toBeDisabled();
    await waitFor(() => expect(answer).toHaveBeenCalledTimes(1));
    const feedback = fixture(); feedback.answered = 1; feedback.rawScore = 10; feedback.nextAt = 3000;
    feedback.feedback = { question: feedback.question!, selected: 0, correctOption: 0, correct: true, timeout: false, explanation: 'Le CPU exécute les instructions.' };
    await act(async () => resolve(feedback));
    expect(screen.getByText('Bonne réponse · +10 points')).toBeInTheDocument();
    expect(screen.getByText('Le CPU exécute les instructions.')).toBeInTheDocument();
    expect(button).toBeDisabled();
  });
  it('uses the server deadline for timeouts and never offers a timer reset', async () => {
    const expired = fixture(); expired.deadline = expired.serverNow;
    vi.spyOn(triviaApi, 'state').mockResolvedValue(expired);
    const answer = vi.spyOn(triviaApi, 'answer');
    mount(); await screen.findByRole('timer');
    expect(screen.getByRole('timer')).toHaveTextContent('0');
    expect(screen.getByRole('button', { name: 'A CPU' })).toBeDisabled();
    expect(screen.getByText(/Temps écoulé. Synchronisation/)).toBeInTheDocument();
    expect(answer).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /pause|reset|recommencer/i })).not.toBeInTheDocument();
  });
  it('reviews 15 questions and hands off the actual normalized result only once across reloads', async () => {
    const result = fixture(); result.complete = true; result.question = null; result.answered = 15; result.number = 15;
    result.correctAnswers = 12; result.incorrectAnswers = 2; result.timeouts = 1; result.rawScore = 120; result.score = 80; result.totalTimeMs = 180000; result.rank = 'Knowledge Expert';
    result.review = Array.from({ length: 15 }, (_, i) => ({ question: { id: `it-${i}`, text: `Question revue ${i + 1}`, options: ['A', 'B', 'C', 'D'], difficulty: 'easy' as const }, selected: i < 14 ? 0 : null, correctOption: 0, correct: i < 12, timeout: i === 14, explanation: `Explication ${i + 1}` }));
    vi.spyOn(triviaApi, 'state').mockResolvedValue(result);
    const handoff = vi.spyOn(triviaApi, 'handoff').mockResolvedValue({ ...result, handedOff: true });
    const view = mount(); await screen.findByRole('heading', { name: 'Knowledge Expert' });
    expect(document.querySelectorAll('.tt-review details')).toHaveLength(15);
    expect(view.onComplete).not.toHaveBeenCalled();
    const button = screen.getByRole('button', { name: 'Transmettre mon score' });
    fireEvent.click(button); fireEvent.click(button);
    await waitFor(() => expect(view.onComplete).toHaveBeenCalledTimes(1));
    expect(handoff).toHaveBeenCalledTimes(1);
    expect(view.onComplete).toHaveBeenCalledWith({ score: 80, completed: true, details: { category: 'it', correctAnswers: 12, incorrectAnswers: 2, timeouts: 1, rawScore: 120, normalizedScore: 80, totalTimeMs: 180000 } });
    view.unmount(); vi.mocked(triviaApi.state).mockResolvedValue({ ...result, handedOff: true });
    mount(false, view.onComplete); await screen.findByRole('button', { name: 'Résultat déjà transmis' });
    expect(screen.getByRole('button', { name: 'Résultat déjà transmis' })).toBeDisabled();
    expect(view.onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link', { name: 'Return to Games →' })).toHaveAttribute('href', '/games');
  });
  it('respects disabled and does not invent a team identity without a session', async () => {
    vi.spyOn(triviaApi, 'state').mockResolvedValue(null);
    const view = mount(true); await screen.findByRole('button', { name: 'Choisir IT' });
    expect(screen.getByRole('button', { name: 'Choisir IT' })).toBeDisabled();
    view.unmount(); sessionStorage.clear(); mount();
    expect(screen.getByRole('heading', { name: 'La session d’équipe est nécessaire.' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
  it('calls only the private game API with the platform team token', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ state: null }), { status: 200 }));
    await triviaApi.start('platform-token', 'football');
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/v1/games/team-trivia-battle/start'), expect.objectContaining({ method: 'POST', headers: expect.objectContaining({ 'X-Team-Token': 'platform-token' }), body: JSON.stringify({ category: 'football' }) }));
    expect(fetch.mock.calls[0][0]).not.toMatch(/\/score$/);
  });
});

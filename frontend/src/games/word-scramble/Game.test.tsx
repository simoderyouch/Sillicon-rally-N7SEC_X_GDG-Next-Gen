import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { game } from './index';
import { completionApi } from './completionApi';
import * as model from './model';
const mission = { id: 'scramble-test', slug: 'word-scramble', title: 'Cyber Word Scramble', description: '', maxScore: 100, releaseState: 'PUBLISHED' as const };
const Component = game.component;
const originalNewRun = model.newRun;
function mount(onComplete = vi.fn(), disabled = false) { return { ...render(<Component mission={mission} onComplete={onComplete} disabled={disabled} />), onComplete }; }
async function start() { fireEvent.click(await screen.findByRole('button', { name: /Commencer le/ })); }
function answer(value: string) {
  fireEvent.change(screen.getByLabelText('Votre réponse'), { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: /Vérifier/ }));
}
function solve() { const saved = model.readRun(model.storageKey(mission.id))!; answer(saved.rounds[model.currentIndex(saved)].word.toLowerCase()); }
function hint() { fireEvent.click(screen.getByRole('button', { name: 'Afficher un indice' })); }
beforeEach(() => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('teamToken', 'team-test'); vi.spyOn(completionApi, 'state').mockResolvedValue({ locked: false, score: null, claimed: false }); vi.spyOn(completionApi, 'claim').mockImplementation(async (_, score) => ({ locked: true, score, claimed: true })); vi.spyOn(model, 'newRun').mockImplementation(() => originalNewRun(() => 0.999)); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
describe('word-scramble', async () => {
  it('plays exactly the prescribed words, always scrambled, in randomized order', async () => {
    expect(model.words.map(entry => entry.word)).toEqual(['CAMERA', 'SECURITY', 'PASSWORD', 'PROTECTION', 'DEFENSE', 'HACKER', 'VIRUS', 'FIREWALL', 'BACKUP', 'PRIVACY']);
    const run = originalNewRun(() => 0.3);
    expect(run.rounds).toHaveLength(10);
    expect(run.rounds.map(round => round.word)).not.toEqual(model.words.map(entry => entry.word));
    expect(run.rounds.map(round => round.word).sort()).toEqual(model.words.map(entry => entry.word).sort());
    for (const round of run.rounds) {
      expect(round.scrambled).not.toBe(round.word);
      expect([...round.scrambled].sort()).toEqual([...round.word].sort());
    }
    expect(model.hintsRemaining(run)).toBe(3);
  });
  it('shares exactly three hints, prevents repeat use, and persists across remount and storage events', async () => {
    let view = mount(); await start();
    expect(screen.getByText('Hints Remaining: 3/3')).toBeInTheDocument();
    hint();
    expect(screen.getByText(model.words[0].hint)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Indice déjà révélé' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Indice déjà révélé' }));
    expect(await screen.findByText('Hints Remaining: 2/3')).toBeInTheDocument();
    answer('wrong');
    view.unmount(); view = mount();
    expect(await screen.findByText('Hints Remaining: 2/3')).toBeInTheDocument();
    expect(screen.getByText(model.words[0].hint)).toBeInTheDocument();
    solve();
    expect(screen.queryByText(model.words[0].hint)).not.toBeInTheDocument();
    expect(await screen.findByText('Hints Remaining: 2/3')).toBeInTheDocument();
    hint(); solve();
    // Simulate another tab spending the final hint before this tab renders it.
    const key = model.storageKey(mission.id); const otherTab = model.readRun(key)!;
    otherTab.rounds[2].hintUsed = true; model.saveRun(key, otherTab);
    hint();
    expect(await screen.findByText('Hints Remaining: 0/3')).toBeInTheDocument();
    solve();
    expect(screen.getByRole('button', { name: 'No hints remaining' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'No hints remaining' }));
    view.unmount(); mount();
    expect(await screen.findByText('Hints Remaining: 0/3')).toBeInTheDocument();
    expect(model.score(model.readRun(key)!)).toBe(17); // 3 + 7 + 7
    window.dispatchEvent(new StorageEvent('storage', { key }));
    expect(await screen.findByText('Hints Remaining: 0/3')).toBeInTheDocument();
  });
  it('scores each of the four cases independently and submits the mixed result only once, including after reload', async () => {
    const view = mount(); await start();
    solve(); // 10
    hint(); solve(); // 7
    answer('wrong'); answer('stillwrong'); solve(); // 5, no cumulative deduction
    hint(); answer('wrong'); solve(); // 3
    answer('wrong'); hint(); solve(); // 3, inverse order of hint/error
    for (let i = 5; i < 10; i++) solve(); // 50
    expect(screen.getByRole('heading', { name: 'Votre score final' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Votre réponse')).not.toBeInTheDocument();
    expect(screen.getByText('78', { selector: '.ws-final-score' })).toBeInTheDocument();
    const submit = screen.getByRole('button', { name: 'Transmettre mon score' });
    fireEvent.click(submit); fireEvent.click(submit);
    await waitFor(() => expect(view.onComplete).toHaveBeenCalledTimes(1));
    expect(view.onComplete).toHaveBeenCalledWith({ score: 78, completed: true, details: { wordsSolved: 10, wordsFailed: 0, hintsUsed: 3, incorrectAttempts: 4, rawScore: 78 } });
    view.unmount(); mount(view.onComplete);
    expect(await screen.findByRole('button', { name: 'Résultat transmis' })).toBeDisabled();
    expect(view.onComplete).toHaveBeenCalledTimes(1);
  });
  it('awards 100 for a perfect game, ignores empty answers, and never skips a word', async () => {
    const { onComplete } = mount(); await start();
    expect(screen.getByRole('button', { name: /Vérifier/ })).toBeDisabled();
    answer('   ');
    expect(model.readRun(model.storageKey(mission.id))!.rounds[0].wrongAttempts).toBe(0);
    for (let i = 0; i < 10; i++) { expect(screen.getByText(`MOT ${String(i + 1).padStart(2, '0')} / 10`)).toBeInTheDocument(); solve(); }
    fireEvent.click(screen.getByRole('button', { name: 'Transmettre mon score' }));
    await waitFor(() => expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ score: 100, completed: true })));
  });
  it('offers no restart and preserves hints and attempts across reopening', async () => {
    let view = mount(); await start(); hint(); answer('wrong'); answer('wrong');
    expect(screen.getByText('Essais restants : 1/3')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Nouvelle partie|Recommencer|Rejouer/ })).not.toBeInTheDocument();
    view.unmount(); view = mount();
    expect(await screen.findByText('Essais restants : 1/3')).toBeInTheDocument();
    expect(await screen.findByText('Hints Remaining: 2/3')).toBeInTheDocument();
    answer('wrong');
    expect(screen.getByText('MOT 02 / 10')).toBeInTheDocument();
    expect(screen.getByText('Essais restants : 3/3')).toBeInTheDocument();
    expect(await screen.findByText('Hints Remaining: 2/3')).toBeInTheDocument();
    expect(screen.getByRole('status')).not.toHaveTextContent('CAMERA');
    expect(model.score(model.readRun(model.storageKey(mission.id))!)).toBe(0);
    view.rerender(<Component mission={mission} disabled onComplete={view.onComplete} />);
    expect(screen.getByLabelText('Votre réponse')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Afficher un indice' })).toBeDisabled();
  });
  it('separates team sessions and fails closed if storage cannot be written', async () => {
    localStorage.setItem('teamToken', 'team-a'); const a = model.storageKey(mission.id);
    localStorage.setItem('teamToken', 'team-b'); expect(model.storageKey(mission.id)).not.toBe(a);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage blocked'); });
    mount(); await start();
    expect(screen.getByRole('alert')).toHaveTextContent('Sauvegarde impossible');
    expect(screen.queryByLabelText('Votre réponse')).not.toBeInTheDocument();
  });
});

describe('three-attempt limit and team completion', () => {
  it('gives zero for ten exhausted words and shows only the final score', async () => {
    const view = mount(); await start();
    for (let i = 0; i < 10; i++) {
      expect(screen.getByText('MOT '+String(i+1).padStart(2,'0')+' / 10')).toBeInTheDocument();
      answer('wrong'); answer('wrong'); answer('wrong');
    }
    expect(screen.getByRole('heading', {name:'Votre score final'})).toBeInTheDocument();
    expect(screen.getByText('0', {selector:'.ws-final-score'})).toBeInTheDocument();
    expect(screen.queryByLabelText('Votre réponse')).not.toBeInTheDocument();
    for (const entry of model.words) expect(screen.queryByText(entry.word)).not.toBeInTheDocument();
    expect(document.querySelector('.ws-summary')).toBeNull();
    fireEvent.click(screen.getByRole('button', {name:'Transmettre mon score'}));
    await waitFor(() => expect(view.onComplete).toHaveBeenCalledWith({score:0,completed:true,details:{wordsSolved:0,wordsFailed:10,hintsUsed:0,incorrectAttempts:30,rawScore:0}}));
  });
  it('keeps the score after team-session renewal without offering another game', async () => {
    vi.mocked(completionApi.state).mockResolvedValue({locked:true,score:90,claimed:false});
    const view = mount();
    expect(await screen.findByText('90', {selector:'.ws-final-score'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name:'Résultat transmis'})).toBeDisabled();
    expect(screen.queryByRole('button', {name:/Commencer|Rejouer|Recommencer|Nouvelle partie/})).not.toBeInTheDocument();
    view.unmount(); localStorage.clear(); localStorage.setItem('teamToken','renewed-token');
    mount(view.onComplete);
    await screen.findByText('90', {selector:'.ws-final-score'});
    expect(completionApi.state).toHaveBeenLastCalledWith('renewed-token');
    expect(view.onComplete).not.toHaveBeenCalled();
  });
});

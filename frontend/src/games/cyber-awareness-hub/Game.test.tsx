import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { game } from './index';
import { completionApi } from './completionApi';
import * as data from './scenarios';
import { screenshot } from './visuals';
const mission = { id: 'cyber', slug: 'cyber-awareness-hub', title: 'Phishing Detective', description: '', maxScore: 100, releaseState: 'PUBLISHED' as const };
beforeEach(() => {
  localStorage.clear(); sessionStorage.clear(); localStorage.setItem('teamToken', 'platform-team-token');
  vi.spyOn(completionApi, 'state').mockResolvedValue({ locked: false, score: null, claimed: false });
  vi.spyOn(completionApi, 'claim').mockImplementation(async (_, score) => ({ locked: true, score, claimed: true }));
});
afterEach(() => { cleanup(); localStorage.clear(); sessionStorage.clear(); vi.restoreAllMocks(); });
describe('Phishing Detective', () => {
  it('contains exactly the required distribution, safe simulations, and valid vector screenshots', () => {
    expect(new Set(data.scenarios.map(s => s.id)).size).toBe(12);
    const emails = data.scenarios.filter(s => s.category === 'email');
    const logins = data.scenarios.filter(s => s.category === 'login');
    expect(emails).toHaveLength(6);
    expect(emails.filter(s => s.phishing)).toHaveLength(3);
    expect(logins).toHaveLength(3);
    expect(logins.filter(s => !s.phishing)).toHaveLength(2);
    expect(data.scenarios.filter(s => s.category === 'url')).toHaveLength(3);
    expect(new Set(emails.map(screenshot)).size).toBe(6);
    for (const item of data.scenarios) {
      expect(typeof item.phishing).toBe('boolean');
      expect(item.evidence.length).toBeGreaterThan(50);
      if (item.phishing) expect(new URL(item.url).hostname.endsWith('.example')).toBe(true);
      const doc = new DOMParser().parseFromString(decodeURIComponent(screenshot(item).split(',')[1]), 'image/svg+xml');
      expect(doc.querySelector('parsererror')).toBeNull();
      expect(doc.documentElement.nodeName).toBe('svg');
      expect(doc.documentElement.textContent).toContain(item.brand);
      for (const line of item.body) expect(doc.documentElement.textContent).toContain(line);
    }
  });
  it('shuffles each stage without losing scenario metadata', () => {
    const shuffled = data.shuffledStages(() => 0.2);
    expect(shuffled.map(s => s.id).sort()).toEqual(data.scenarios.map(s => s.id).sort());
    expect(shuffled.slice(0, 6).every(s => s.category === 'email')).toBe(true);
    expect(shuffled.slice(6, 9).every(s => s.category === 'url')).toBe(true);
    expect(shuffled.slice(9).every(s => s.category === 'login')).toBe(true);
    shuffled.forEach(s => expect(s).toBe(data.scenarios.find(original => original.id === s.id)));
  });
  it.each([0, 6, 7, 12])('plays all stages and hands off %s correct answers exactly once', async (numberCorrect) => {
    vi.spyOn(data, 'shuffledStages').mockReturnValue(data.scenarios);
    const complete = vi.fn(); const Component = game.component;
    render(<Component mission={mission} onComplete={complete} />);
    fireEvent.click(await screen.findByRole('button', { name: /Commencer/ }));
    expect(screen.getByRole('button', { name: 'Valider ma réponse' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /Agrandir/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    data.scenarios.forEach((item, i) => {
      expect(screen.queryByText(item.evidence)).not.toBeInTheDocument();
      const value = i < numberCorrect ? item.phishing : !item.phishing;
      fireEvent.click(screen.getByRole('button', { name: value ? item.category === 'url' ? 'Destination suspecte' : 'Phishing' : 'Légitime' }));
      fireEvent.click(screen.getByRole('button', { name: 'Valider ma réponse' }));
      expect(screen.getByRole('status')).toHaveTextContent('Réponse enregistrée');
      expect(screen.getByRole('button', { name: 'Légitime' })).toBeDisabled();
      expect(complete).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole('button', { name: i === 11 ? 'Voir le bilan' : /Dossier suivant/ }));
    });
    const score = Math.round(numberCorrect / 12 * 100);
    expect(screen.getByText(`${score}/100`)).toBeInTheDocument();
    expect(screen.queryByText(data.scenarios[0].evidence)).not.toBeInTheDocument();
    expect(document.querySelectorAll('.pd-review > details')).toHaveLength(0);
    expect(document.querySelector('input')).toBeNull();
    expect(document.querySelector('a')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Transmettre mon score' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Résultat transmis' }));
    expect(complete).toHaveBeenCalledTimes(1);
    expect(complete).toHaveBeenCalledWith({ score, completed: true, details: { correct: numberCorrect, total: 12, accuracy: score, rawScore: score } });
  });
  it('respects disabled state', async () => {
    const Component = game.component;
    render(<Component mission={mission} disabled onComplete={vi.fn()} />);
    expect(await screen.findByRole('button', { name: /Commencer/ })).toBeDisabled();
  });
});


describe('completed team lock', () => {
  it('keeps a submitted team on its score screen after reopening and session renewal', async () => {
    vi.mocked(completionApi.state).mockResolvedValue({ locked: true, score: 75, claimed: false });
    const Component = game.component; const onComplete = vi.fn();
    const view = render(<Component mission={mission} onComplete={onComplete} />);
    expect(await screen.findByText('75/100')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Commencer|Rejouer|Réactiver|Recommencer/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Résultat transmis' })).toBeDisabled();
    view.unmount(); localStorage.setItem('teamToken', 'renewed-platform-token');
    render(<Component mission={mission} onComplete={onComplete} />);
    expect(await screen.findByText('75/100')).toBeInTheDocument();
    expect(completionApi.state).toHaveBeenLastCalledWith('renewed-platform-token');
    expect(onComplete).not.toHaveBeenCalled();
  });
  it('does not emit another completion when another tab already reserved the result', async () => {
    // An already completed team is blocked before any question is displayed.
    vi.mocked(completionApi.state).mockResolvedValue({ locked: true, score: 50, claimed: false });
    const Component = game.component; const onComplete = vi.fn();
    render(<Component mission={mission} onComplete={onComplete} />);
    await screen.findByText('50/100');
    fireEvent.click(screen.getByRole('button', { name: 'Résultat transmis' }));
    expect(completionApi.claim).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });
});

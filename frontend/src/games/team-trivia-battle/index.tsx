import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { triviaApi, categories, type CategoryId, type Snapshot } from './gameApi';
import type { GameDefinition, GameProps } from '../types';
import './trivia.css';

function Trivia({ mission, onComplete, disabled = false }: GameProps) {
  const token = sessionStorage.getItem('teamToken');
  const teamName = sessionStorage.getItem('teamName');
  const [view, setView] = useState<{ state: Snapshot | null; received: number } | null>(null);
  const [selection, setSelection] = useState<CategoryId | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [clock, setClock] = useState(performance.now());
  const [frozenAt, setFrozenAt] = useState<number | null>(null);
  const inFlight = useRef(false);
  const actionLock = useRef(false);
  const pendingSync = useRef<Promise<void>>(Promise.resolve());
  const mounted = useRef(true);
  const submitted = useRef(false);
  const focusHeading = useRef<HTMLHeadingElement>(null);
  const state = view?.state;
  const category = categories.find(c => c.id === state?.category);
  const question = state?.question;
  const seconds = state && view ? Math.max(0, Math.min(45, Math.ceil((state.deadline - state.serverNow - Math.max(0, (frozenAt ?? clock) - view.received)) / 1000))) : 45;
  const apply = useCallback((result: Snapshot | null) => { if (mounted.current) { const now = performance.now(); setView({ state: result, received: now }); setClock(now); setError(''); } }, []);
  const sync = useCallback(async () => {
    if (!token || inFlight.current) return;
    inFlight.current = true;
    const pending = (async () => {
      try { apply(await triviaApi.state(token)); } catch (cause) { if (mounted.current) setError(cause instanceof Error ? cause.message : 'Connexion impossible.'); }
      finally { inFlight.current = false; }
    })();
    pendingSync.current = pending;
    await pending;
  }, [token, apply]);
  useEffect(() => { mounted.current = true; void sync(); return () => { mounted.current = false; }; }, [sync]);
  useEffect(() => {
    if (!state || state.complete) return;
    const animation = window.setInterval(() => setClock(performance.now()), 200);
    const polling = window.setInterval(() => void sync(), 1000);
    return () => { window.clearInterval(animation); window.clearInterval(polling); };
  }, [!!state, state?.complete, sync]);
  useEffect(() => { focusHeading.current?.focus(); }, [question?.id, state?.complete]);
  async function act(operation: () => Promise<Snapshot | null>, handoff = false) {
    if (disabled || actionLock.current || !token) return;
    actionLock.current = true; setBusy(true); setError('');
    await pendingSync.current;
    if (!mounted.current) { actionLock.current = false; return; }
    inFlight.current = true;
    try {
      const result = await operation(); apply(result);
      if (handoff && result?.complete && !submitted.current) {
        submitted.current = true;
        onComplete({ score: Math.min(result.score, mission.maxScore), completed: true, details: {
          category: result.category, correctAnswers: result.correctAnswers, incorrectAnswers: result.incorrectAnswers, timeouts: result.timeouts, rawScore: result.rawScore, normalizedScore: result.score, totalTimeMs: result.totalTimeMs,
        } });
      }
    } catch (cause) { if (mounted.current) setError(cause instanceof Error ? cause.message : 'Action impossible.'); }
    finally { inFlight.current = false; actionLock.current = false; if (mounted.current) { setBusy(false); setFrozenAt(null); } }
  }
  const block = disabled || busy || !!error;
  return <section className="tt-game" aria-label="Team Trivia Battle">
    <header className="tt-header"><strong>✦ TEAM TRIVIA BATTLE</strong><span>{teamName ? `Équipe · ${teamName}` : 'Session de la plateforme'}</span></header>
    {!token ? <div className="tt-body"><h2>La session d’équipe est nécessaire.</h2><p>Ouvrez ce défi depuis la plateforme avec votre équipe connectée.</p><Link to="/games">Return to Games →</Link></div>
    : <>{error && <div className="tt-error" role="alert"><p>{error}</p><button onClick={() => void sync()} disabled={busy || disabled}>Recharger l’état du serveur</button></div>}
      {!view ? <p role="status" className="tt-body">Chargement de votre mission…</p>
      : !state ? <div className="tt-body"><span className="tt-kicker">SIX UNIVERS · UNE SEULE CHANCE</span><h1>Votre équipe.<br/><em>Votre terrain de jeu.</em></h1><p>Chaque équipe peut choisir une seule catégorie et répondre à ses 15 questions. Une fois la partie commencée, vous ne pouvez plus changer de catégorie. À la fin, votre score est affiché.</p><div className='tt-categories'>{categories.map(item => <article key={item.id} className={selection === item.id ? 'tt-selected' : ''}><h2>{item.name}</h2><p>{item.description}</p><small>15 questions · 45 secondes / question</small><button aria-pressed={selection === item.id} disabled={block} onClick={() => setSelection(item.id)}>Choisir {item.name}</button></article>)}</div>{selection && <div className="tt-confirm"><p><b>{categories.find(c => c.id === selection)?.name}</b> sera verrouillée pour votre équipe. La partie commence dès la confirmation ; le temps continue si vous fermez la page.</p><button className="tt-primary" disabled={block} onClick={() => void act(() => triviaApi.start(token, selection))}>Confirmer et commencer →</button></div>}</div>
      : state.complete ? <div className='tt-body tt-results'><h2 ref={focusHeading} tabIndex={-1}>Votre score final</h2><p className='tt-final-score'>{state.score}<span>/100</span></p><div className='tt-actions'><button className='tt-primary' disabled={block || state.handedOff || submitted.current} onClick={() => void act(() => triviaApi.handoff(token), true)}>{busy ? 'Transmission…' : state.handedOff ? 'Résultat déjà transmis' : 'Transmettre mon score'}</button><Link to='/games'>Return to Games →</Link></div></div>
      : question && <div className="tt-body tt-play"><div className="tt-round-meta"><span>{category?.name} · Question {state.number}/15</span><strong>{state.rawScore}/150 pts</strong></div><progress aria-label="Questions terminées" max={15} value={state.answered}/><div className="tt-question-top"><span className="tt-kicker">{question.difficulty === 'easy' ? 'FACILE' : question.difficulty === 'medium' ? 'INTERMÉDIAIRE' : 'PLUS DIFFICILE'}</span><div role="timer" aria-label="Temps restant" className={`tt-timer ${!state.feedback && seconds <= 5 ? 'tt-critical' : !state.feedback && seconds <= 15 ? 'tt-warning' : ''}`}>{state.feedback ? '✓' : seconds}<small>{state.feedback ? 'VALIDÉ' : 'SECONDES'}</small></div></div><h2 ref={focusHeading} tabIndex={-1}>{question.text}</h2><div className="tt-options">{question.options.map((option, i) => <button key={`${question.id}-${i}`} disabled={block || !!state.feedback || seconds === 0} className={state.feedback ? state.feedback.correctOption === i ? 'tt-correct' : state.feedback.selected === i ? 'tt-incorrect' : '' : ''} onClick={() => { setFrozenAt(performance.now()); void act(() => triviaApi.answer(token, question.id, i)); }}><span>{String.fromCharCode(65 + i)}</span>{option}</button>)}</div><div role="status" className="tt-feedback">{state.feedback ? <><b>{state.feedback.timeout ? 'Temps écoulé · 0 point' : state.feedback.correct ? 'Bonne réponse · +10 points' : 'Réponse incorrecte · 0 point'}</b><p>{state.feedback.explanation}</p><small>Question suivante automatiquement…</small></> : seconds === 0 ? 'Temps écoulé. Synchronisation avec le serveur…' : busy ? 'Validation de votre réponse…' : 'Choisissez une réponse. Votre choix devient immédiatement définitif.'}</div><p className="tt-muted">Le chronomètre est géré par le serveur. Un rafraîchissement conserve votre catégorie, vos questions et le temps écoulé.</p></div>}
    </>}
  </section>;
}
export const game: GameDefinition = { slug: "team-trivia-battle", component: Trivia };

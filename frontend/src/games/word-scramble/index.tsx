import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Check, Lightbulb, LockKeyhole, RotateCcw, Send, ShieldCheck } from 'lucide-react';
import type { GameDefinition, GameProps } from '../types';
import { currentIndex, hintsRemaining, newRun, points, readRun, saveRun, score, storageKey, words, type Run } from './model';
import './word-scramble.css';

function Game({ mission, onComplete, disabled = false }: GameProps) {
  const [key] = useState(() => storageKey(mission.id));
  const [initial] = useState(() => { try { return { run: readRun(key), error: '' }; } catch { return { run: null, error: 'Impossible de lire la sauvegarde. Autorisez le stockage local ou recommencez une nouvelle partie.' }; } });
  const [run, setRun] = useState<Run | null>(initial.run);
  const [error, setError] = useState(initial.error);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [restart, setRestart] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const submitGuard = useRef(false);
  const index = run ? currentIndex(run) : -1;
  const round = run && index >= 0 ? run.rounds[index] : null;
  const finished = !!run && index === -1;

  useEffect(() => {
    function sync(event: StorageEvent) {
      if (event.key !== key && event.key !== null) return;
      try { setRun(readRun(key)); setAnswer(''); setFeedback('Partie synchronisée avec votre autre onglet.'); setError(''); }
      catch { setError('La sauvegarde a changé et ne peut pas être lue. Recommencez une nouvelle partie.'); }
    }
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [key]);
  useEffect(() => { input.current?.focus(); }, [index, run?.id]);

  function store(updated: Run): boolean {
    try { saveRun(key, updated); setRun(updated); setError(''); return true; }
    catch { setError('Sauvegarde impossible. Autorisez le stockage local pour continuer sans perdre vos indices.'); return false; }
  }
  function begin() {
    if (disabled) return;
    if (store(newRun())) { setAnswer(''); setFeedback(''); setRestart(false); submitGuard.current = false; }
  }
  function latest(): Run | null {
    try {
      const saved = readRun(key);
      if (!saved || saved.id !== run?.id || currentIndex(saved) !== index || saved.submitted) {
        setRun(saved); setAnswer(''); setFeedback('La partie a changé. Vérifiez le mot affiché avant de continuer.'); return null;
      }
      return saved;
    } catch { setError('Impossible de lire la sauvegarde. Recommencez une nouvelle partie.'); return null; }
  }
  function hint() {
    if (disabled || error || !round) return;
    const saved = latest(); if (!saved) return;
    const active = saved.rounds[index];
    if (active.hintUsed || hintsRemaining(saved) <= 0) { setRun(saved); return; }
    const updated = { ...saved, rounds: saved.rounds.map((entry, i) => i === index ? { ...entry, hintUsed: true } : entry) };
    if (store(updated)) setFeedback('Indice révélé. Il reste disponible pour ce mot.');
  }
  function check(event: FormEvent) {
    event.preventDefault();
    if (disabled || error || !round || !answer.trim()) return;
    const saved = latest(); if (!saved) return;
    const active = saved.rounds[index];
    const correct = answer.trim().toUpperCase() === active.word;
    const updatedRound = correct ? { ...active, solved: true } : { ...active, wrongAttempts: active.wrongAttempts + 1 };
    const updated = { ...saved, rounds: saved.rounds.map((entry, i) => i === index ? updatedRound : entry) };
    if (store(updated)) {
      setFeedback(correct ? `Correct ! ${active.word} : +${points(updatedRound)} points.${index < 9 ? ' À vous de trouver le mot suivant.' : ' Les 10 mots sont résolus !'}` : 'Ce n’est pas le bon mot. Regardez les lettres et réessayez.');
      setAnswer(''); input.current?.focus();
    }
  }
  function submit() {
    if (disabled || error || !finished || submitGuard.current) return;
    const saved = latest(); if (!saved) return;
    const updated = { ...saved, submitted: true };
    if (!store(updated)) return;
    submitGuard.current = true;
    onComplete({ score: Math.min(score(saved), mission.maxScore), completed: true, details: {
      wordsSolved: 10, hintsUsed: 3 - hintsRemaining(saved), incorrectAttempts: saved.rounds.reduce((sum, entry) => sum + entry.wrongAttempts, 0), rawScore: score(saved),
    } });
  }
  return <section className="ws-game" aria-label="Cyber Word Scramble">
    <header className="ws-header"><span><ShieldCheck size={17} aria-hidden="true" /> CYBER WORD LAB</span><span>10 mots · 100 points</span></header>
    {error && <p role="alert" className="ws-alert">{error}</p>}
    {!run ? <div className="ws-intro"><span className="ws-kicker">DÉFI / VOCABULAIRE</span><h1>Cyber Word <em>Scramble.</em></h1><p>Des lettres en désordre. Dix mots anglais à retrouver pour découvrir les bases de la cybersécurité.</p><div className="ws-sample" aria-hidden="true">{'CYBER'.split('').map((letter, i) => <span key={i}>{letter}</span>)}</div><div className="ws-guide"><div><b>10 mots</b><span>Un mot à la fois, sans passer.</span></div><div><b>3 indices au total</b><span>À utiliser sur les mots de votre choix.</span></div><div><b>100 points</b><span>Chaque réponse compte.</span></div></div><Scoring /><p className="ws-muted">La progression et les indices sont sauvegardés dans ce navigateur. Recharger la page ne rend pas d’indices. « Nouvelle partie » remet tout à zéro.</p><button onClick={begin} disabled={disabled} className="ws-primary">{error ? 'Créer une nouvelle partie' : 'Commencer le défi'} <span aria-hidden="true">→</span></button></div>
    : <><div className="ws-stats"><div><span>PROGRESSION</span><strong>{finished ? '10 / 10' : `${index + 1} / 10`}</strong></div><div><span>SCORE</span><strong>{score(run)} <small>/ 100</small></strong></div><div><span>INDICES PARTAGÉS</span><strong className="ws-hints">Hints Remaining: {hintsRemaining(run)}/3</strong></div></div>
      {finished ? <div className="ws-results"><span className="ws-seal"><Check size={30} aria-hidden="true" /></span><span className="ws-kicker">MISSION ACCOMPLIE</span><h2>Les 10 mots sont déchiffrés.</h2><p className="ws-final-score">{score(run)}<span>/100</span></p><p>{3 - hintsRemaining(run)} indice(s) utilisé(s) · {run.rounds.reduce((sum, entry) => sum + entry.wrongAttempts, 0)} tentative(s) incorrecte(s)</p><div role="status" className="ws-feedback">{feedback}</div><div className="ws-summary">{run.rounds.map(entry => <div key={entry.word}><b>{entry.word}</b><span>{entry.hintUsed ? 'Avec indice' : 'Sans indice'} · {entry.wrongAttempts} erreur(s)</span><strong>+{points(entry)}</strong></div>)}</div>{mission.maxScore < 100 && <p>Le score transmis sera plafonné à {mission.maxScore}, selon la configuration de la mission.</p>}<button onClick={submit} disabled={disabled || run.submitted || !!error} className="ws-primary"><Send size={16} aria-hidden="true" /> {run.submitted ? 'Résultat transmis' : 'Transmettre mon score'}</button>{run.submitted && <p className="ws-muted">Envoi déclenché une seule fois pour cette partie. La plateforme indique le résultat de l’enregistrement.</p>}</div>
      : round && <div className="ws-workbench"><div className="ws-challenge"><div className="ws-word-label"><span className="ws-kicker">MOT {String(index + 1).padStart(2, '0')} / 10</span><span>{round.word.length} lettres</span></div><h2>Remettez les lettres dans l’ordre.</h2><p>Retrouvez un mot anglais lié à la sécurité.</p><div className="ws-letters" aria-label={`Lettres mélangées : ${round.scrambled.split('').join(' ')}`}>{round.scrambled.split('').map((letter, i) => <span key={`${round.word}-${i}`}>{letter}</span>)}</div><form onSubmit={check}><label htmlFor="ws-answer">Votre réponse</label><div className="ws-answer-row"><input ref={input} id="ws-answer" value={answer} onChange={event => setAnswer(event.target.value)} autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={40} placeholder="Écrivez le mot…" disabled={disabled || !!error} /><button type="submit" className="ws-primary" disabled={disabled || !!error || !answer.trim()}>Vérifier <span aria-hidden="true">→</span></button></div></form><p role="status" className="ws-feedback">{feedback || 'Majuscules ou minuscules : les deux sont acceptées.'}</p><progress aria-label="Mots résolus" max={10} value={index} /></div><aside><span className="ws-icon"><Lightbulb size={23} aria-hidden="true" /></span><h3>Un coup de pouce ?</h3><p>Seulement 3 indices pour toute la partie. Chaque indice révèle la définition du mot actuel.</p><button className="ws-hint-button" onClick={hint} disabled={disabled || !!error || round.hintUsed || hintsRemaining(run) === 0}><Lightbulb size={16} aria-hidden="true" />{round.hintUsed ? 'Indice déjà révélé' : hintsRemaining(run) === 0 ? 'No hints remaining' : 'Afficher un indice'}</button>{hintsRemaining(run) === 0 && <p className="ws-muted">No hints remaining</p>}{round.hintUsed && <div className="ws-clue"><span>VOTRE INDICE</span><p>{words.find(entry => entry.word === round.word)!.hint}</p></div>}<Scoring /></aside></div>}
      <footer className="ws-footer"><span><LockKeyhole size={13} aria-hidden="true" /> Progression sauvegardée localement</span><button onClick={() => setRestart(true)} disabled={disabled}><RotateCcw size={14} aria-hidden="true" /> Nouvelle partie</button></footer>
    </>}
    {restart && <div className="ws-restart" role="group" aria-label="Confirmer une nouvelle partie"><p>Recommencer les 10 mots ? Le score et la progression seront effacés. La nouvelle partie aura 3 indices.</p><button className="ws-primary" onClick={begin} disabled={disabled}>Recommencer à zéro</button><button onClick={() => setRestart(false)}>Annuler</button></div>}
  </section>;
}
function Scoring() { return <div className="ws-scoring"><h3>Le barème par mot</h3><dl><div><dt>Du premier coup, sans indice</dt><dd>10 pts</dd></div><div><dt>Avec indice, sans erreur</dt><dd>7 pts</dd></div><div><dt>Après une erreur, sans indice</dt><dd>5 pts</dd></div><div><dt>Avec indice et erreur</dt><dd>3 pts</dd></div></dl></div>; }
export const game: GameDefinition = { slug: "word-scramble", component: Game };

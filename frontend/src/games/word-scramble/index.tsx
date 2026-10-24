import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Lightbulb, LockKeyhole, Send, ShieldCheck } from 'lucide-react';
import type { GameDefinition, GameProps } from '../types';
import { currentIndex, hintsRemaining, MAX_ATTEMPTS, newRun, points, readRun, saveRun, score, storageKey, words, type Run } from './model';
import { completionApi } from './completionApi';
import './word-scramble.css';

function Game({ mission, onComplete, disabled = false }: GameProps) {
  const token = sessionStorage.getItem('teamToken');
  const preview = mission.id === 'word-scramble-preview' && !token;
  const [key] = useState(() => storageKey(mission.id));
  const [initial] = useState(() => { try { return { run: readRun(key), error: '' }; } catch { return { run: null, error: 'Impossible de lire la sauvegarde. Contactez un organisateur.' }; } });
  const [run, setRun] = useState<Run | null>(initial.run);
  const [error, setError] = useState(initial.error);
  const [accessError, setAccessError] = useState('');
  const [checked, setChecked] = useState(preview);
  const [lockedScore, setLockedScore] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const submitGuard = useRef(false);
  const index = run ? currentIndex(run) : -1;
  const round = run && index >= 0 ? run.rounds[index] : null;
  const finished = !!run && index === -1;
  const blocked = disabled || !!error || !!accessError || sending || lockedScore !== null || !!run?.submitted || !checked;

  useEffect(() => {
    if (preview || lockedScore !== null) return;
    if (!token) { setAccessError('Ouvrez le jeu avec votre session d’équipe de la plateforme.'); return; }
    let active = true;
    function refresh() {
      void completionApi.state(token!).then(result => {
        if (!active) return;
        setChecked(true); setAccessError('');
        if (result.locked && result.score !== null) setLockedScore(result.score);
      }).catch(cause => { if (active) setAccessError(cause instanceof Error ? cause.message : 'Vérification impossible.'); });
    }
    refresh(); const poll = window.setInterval(refresh, 3000);
    return () => { active = false; window.clearInterval(poll); };
  }, [preview, token, lockedScore]);
  useEffect(() => {
    function sync(event: StorageEvent) {
      if (event.key !== key && event.key !== null) return;
      try { setRun(readRun(key)); setAnswer(''); setFeedback('Partie synchronisée avec votre autre onglet.'); setError(''); }
      catch { setError('La sauvegarde a changé et ne peut pas être lue. Contactez un organisateur.'); }
    }
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [key]);
  useEffect(() => { input.current?.focus(); }, [index, run?.id]);
  function store(updated: Run): boolean {
    try { saveRun(key, updated); setRun(updated); setError(''); return true; }
    catch { setError('Sauvegarde impossible. Autorisez le stockage local pour conserver vos essais et vos indices.'); return false; }
  }
  function begin() {
    if (blocked || run) return;
    if (store(newRun())) { setAnswer(''); setFeedback(''); }
  }
  function latest(): Run | null {
    try {
      const saved = readRun(key);
      if (!saved || saved.id !== run?.id || currentIndex(saved) !== index || saved.submitted) {
        setRun(saved); setAnswer(''); setFeedback('La partie a changé. Vérifiez le mot affiché avant de continuer.'); return null;
      }
      return saved;
    } catch { setError('Impossible de lire la sauvegarde. Contactez un organisateur.'); return null; }
  }
  function hint() {
    if (blocked || !round) return;
    const saved = latest(); if (!saved) return;
    const active = saved.rounds[index];
    if (active.hintUsed || hintsRemaining(saved) <= 0) { setRun(saved); return; }
    const updated = { ...saved, rounds: saved.rounds.map((entry, i) => i === index ? { ...entry, hintUsed: true } : entry) };
    if (store(updated)) setFeedback('Indice révélé. Il reste disponible pour ce mot.');
  }
  function check(event: FormEvent) {
    event.preventDefault();
    if (blocked || !round || !answer.trim()) return;
    const saved = latest(); if (!saved) return;
    const active = saved.rounds[index];
    const correct = answer.trim().toUpperCase() === active.word;
    const updatedRound = correct ? { ...active, solved: true } : { ...active, wrongAttempts: Math.min(MAX_ATTEMPTS, active.wrongAttempts + 1) };
    const exhausted = !correct && updatedRound.wrongAttempts === MAX_ATTEMPTS;
    const updated = { ...saved, rounds: saved.rounds.map((entry, i) => i === index ? updatedRound : entry) };
    if (store(updated)) {
      setFeedback(correct ? `Bonne réponse ! +${points(updatedRound)} points.` : exhausted ? '3 essais incorrects : ce mot rapporte 0 point. Passage au mot suivant.' : `Ce n’est pas le bon mot. Il reste ${MAX_ATTEMPTS - updatedRound.wrongAttempts} essai(s).`);
      setAnswer(''); input.current?.focus();
    }
  }
  async function submit() {
    if (blocked || !finished || submitGuard.current) return;
    const saved = latest(); if (!saved) return;
    submitGuard.current = true; setSending(true); setAccessError('');
    try {
      const boundedScore = Math.min(score(saved), mission.maxScore);
      const result = preview ? { locked: true, score: boundedScore, claimed: true } : await completionApi.claim(token!, boundedScore);
      if (!result.locked || result.score === null) throw new Error('La transmission n’a pas pu être réservée.');
      // A confirmed server reservation stays locked even when this browser cannot write locally.
      setLockedScore(result.score); store({ ...saved, submitted: true });
      if (result.claimed) onComplete({ score: result.score, completed: true, details: {
        wordsSolved: saved.rounds.filter(entry => entry.solved).length,
        wordsFailed: saved.rounds.filter(entry => !entry.solved && entry.wrongAttempts >= MAX_ATTEMPTS).length,
        hintsUsed: 3 - hintsRemaining(saved), incorrectAttempts: saved.rounds.reduce((sum, entry) => sum + entry.wrongAttempts, 0), rawScore: score(saved),
      } });
    } catch (cause) { setAccessError(cause instanceof Error ? cause.message : 'Transmission impossible.'); submitGuard.current = false; }
    finally { setSending(false); }
  }
  const finalScore = lockedScore ?? (run ? score(run) : 0);
  return <section className="ws-game" aria-label="Cyber Word Scramble">
    <header className="ws-header"><span><ShieldCheck size={17} aria-hidden="true" /> CYBER WORD LAB</span><span>10 mots · 100 points</span></header>
    {(error || accessError) && <p role="alert" className="ws-alert">{accessError || error}</p>}
    {!checked && lockedScore === null ? <p className="ws-intro" role="status">Vérification de la participation de votre équipe…</p>
    : finished || lockedScore !== null || run?.submitted ? <div className="ws-results"><h2>Votre score final</h2><p className="ws-final-score">{finalScore}<span>/100</span></p><button onClick={() => void submit()} disabled={blocked} className="ws-primary"><Send size={16} aria-hidden="true" />{sending || disabled ? 'Envoi en cours…' : lockedScore !== null || run?.submitted ? 'Résultat transmis' : 'Transmettre mon score'}</button></div>
    : !run ? <div className="ws-intro"><span className="ws-kicker">DÉFI / VOCABULAIRE</span><h1>Cyber Word <em>Scramble.</em></h1><p>Retrouvez 10 mots anglais liés à la cybersécurité. Vous disposez de 3 essais par mot et de 3 indices pour toute la partie.</p><div className="ws-guide"><div><b>10 mots</b><span>Un mot à la fois.</span></div><div><b>3 essais par mot</b><span>Après 3 erreurs : passage au suivant, sans point.</span></div><div><b>3 indices au total</b><span>Choisissez les mots sur lesquels les utiliser.</span></div></div><Scoring /><p className="ws-muted">Les essais et les indices sont conservés après rechargement. Après transmission, votre équipe ne peut plus rejouer cette mission.</p><button onClick={begin} disabled={blocked} className="ws-primary">Commencer le défi →</button></div>
    : round && <><div className="ws-stats"><div><span>MOT ACTUEL</span><strong>{index + 1} / 10</strong></div><div><span>SCORE</span><strong>{score(run)} <small>/ 100</small></strong></div><div><span>INDICES PARTAGÉS</span><strong className="ws-hints">Hints Remaining: {hintsRemaining(run)}/3</strong></div></div><div className="ws-workbench"><div className="ws-challenge"><div className="ws-word-label"><span className="ws-kicker">MOT {String(index + 1).padStart(2, '0')} / 10</span><span>{round.word.length} lettres</span></div><h2>Remettez les lettres dans l’ordre.</h2><p>Retrouvez un mot anglais lié à la sécurité.</p><p className="ws-attempts" aria-live="polite">Essais restants : {Math.max(0, MAX_ATTEMPTS - round.wrongAttempts)}/3</p><div className="ws-letters" aria-label={`Lettres mélangées : ${round.scrambled.split('').join(' ')}`}>{round.scrambled.split('').map((letter, i) => <span key={`${round.word}-${i}`}>{letter}</span>)}</div><form onSubmit={check}><label htmlFor="ws-answer">Votre réponse</label><div className="ws-answer-row"><input ref={input} id="ws-answer" value={answer} onChange={event => setAnswer(event.target.value)} autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={40} placeholder="Écrivez le mot…" disabled={blocked} /><button type="submit" className="ws-primary" disabled={blocked || !answer.trim()}>Vérifier →</button></div></form><p role="status" className="ws-feedback">{feedback || 'Majuscules ou minuscules : les deux sont acceptées.'}</p><progress aria-label="Mots terminés" max={10} value={index} /></div><aside><span className="ws-icon"><Lightbulb size={23} aria-hidden="true" /></span><h3>Un coup de pouce ?</h3><p>Seulement 3 indices pour toute la partie.</p><button className="ws-hint-button" onClick={hint} disabled={blocked || round.hintUsed || hintsRemaining(run) === 0}>{round.hintUsed ? 'Indice déjà révélé' : hintsRemaining(run) === 0 ? 'No hints remaining' : 'Afficher un indice'}</button>{hintsRemaining(run) === 0 && <p className="ws-muted">No hints remaining</p>}{round.hintUsed && <div className="ws-clue"><span>VOTRE INDICE</span><p>{words.find(entry => entry.word === round.word)!.hint}</p></div>}<Scoring /></aside></div><footer className="ws-footer"><span><LockKeyhole size={13} aria-hidden="true" /> Essais et indices sauvegardés localement</span></footer></>}
  </section>;
}
function Scoring() { return <div className="ws-scoring"><h3>Le barème par mot</h3><dl><div><dt>Du premier coup, sans indice</dt><dd>10 pts</dd></div><div><dt>Avec indice, sans erreur</dt><dd>7 pts</dd></div><div><dt>Après une erreur, sans indice</dt><dd>5 pts</dd></div><div><dt>Avec indice et erreur</dt><dd>3 pts</dd></div><div><dt>3 essais incorrects</dt><dd>0 pt</dd></div></dl></div>; }
export const game: GameDefinition = { slug: "word-scramble", component: Game };

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Expand, Flag, LockKeyhole, Send, ShieldCheck, X, ZoomIn, ZoomOut } from 'lucide-react';
import { getTeamToken } from '../../teamSession';
import type { GameDefinition, GameProps } from '../types';
import { content } from './content';
import { flagApi, type FlagState } from './gameApi';
import './style.css';

function ImageInspector() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [zoom, setZoom] = useState(1);
  function open() { setZoom(1); dialog.current?.showModal(); }
  return <figure className="ff-evidence">
    <div className="ff-evidence-bar"><span><span className="ff-dot" /> EVIDENCE / 001</span><span>EXAMINE EVERY DETAIL</span></div>
    <button type="button" className="ff-image-button" onClick={open} aria-label="Enlarge challenge image">
      <img src={content.image} alt={content.imageAlt} /><span className="ff-image-action"><Expand size={16} /> Enlarge & inspect</span>
    </button>
    <figcaption>One image. All the clues you need to begin. Click to inspect.</figcaption>
    <dialog ref={dialog} className="ff-inspector" aria-labelledby="ff-inspector-title" onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <div className="ff-inspector-toolbar"><h2 id="ff-inspector-title">Inspect the evidence</h2><button type="button" aria-label="Close image inspector" onClick={() => dialog.current?.close()}><X size={20} /></button></div>
      <div className="ff-zoom-controls"><button type="button" aria-label="Zoom out" disabled={zoom <= 1} onClick={() => setZoom(value => Math.max(1, value - 0.25))}><ZoomOut size={18} /></button><label>Zoom <input aria-label="Image zoom" type="range" min="1" max="3" step="0.25" value={zoom} onChange={event => setZoom(Number(event.target.value))} /></label><output>{Math.round(zoom * 100)}%</output><button type="button" aria-label="Zoom in" disabled={zoom >= 3} onClick={() => setZoom(value => Math.min(3, value + 0.25))}><ZoomIn size={18} /></button></div>
      <div className="ff-zoom-viewport" tabIndex={0} aria-label="Scrollable challenge image"><img src={content.image} alt={content.imageAlt} style={{ width: `${zoom * 100}%` }} /></div>
      <p className="ff-inspector-tip">Scroll to explore. Press Escape to close.</p>
    </dialog>
  </figure>;
}

function FinalFlagChallenge({ mission, onComplete, disabled = false }: GameProps) {
  const token = getTeamToken();
  const [state, setState] = useState<FlagState | null>(null);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [retryAt, setRetryAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const busy = useRef(false);
  const delivered = useRef(false);
  const active = useRef(true);
  const callback = useRef(onComplete);
  callback.current = onComplete;

  function receive(value: FlagState) { const timestamp = Date.now(); setState(value); setNow(timestamp); setRetryAt(timestamp + value.retryAfterMs); }
  useEffect(() => {
    active.current = true;
    let cancelled = false;
    if (!token) { setError('Your team session is missing. Return to the challenge board.'); setLoading(false); return; }
    setLoading(true);
    flagApi.state(token).then(value => { if (!cancelled) { receive(value); setError(''); } })
      .catch(cause => { if (!cancelled) setError(cause.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; active.current = false; };
  }, [token, mission.id]);

  useEffect(() => {
    if (retryAt <= Date.now()) return;
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, [retryAt]);

  useEffect(() => {
    if (!state?.solved || state.recorded || delivered.current || disabled) return;
    // A recovered, validated completion also resumes the runner's score handoff after a lost response.
    const timer = window.setTimeout(() => {
      if (delivered.current) return;
      delivered.current = true;
      callback.current({ score: 100, completed: true, details: { challenge: 'final-flag', solved: true, attempts: state.attempts } });
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [state, disabled]);

  const wait = Math.max(0, Math.ceil((retryAt - now) / 1000));
  const exhausted = !!state && state.maxAttempts > 0 && state.attempts >= state.maxAttempts;
  const blocked = disabled || sending || loading || !state || !state.available || state.solved || exhausted || wait > 0 || mission.releaseState !== 'PUBLISHED';

  async function refresh() {
    if (!token || busy.current) return;
    busy.current = true; setLoading(true);
    try { receive(await flagApi.state(token)); setError(''); }
    catch (cause) { setError((cause as Error).message); }
    finally { busy.current = false; setLoading(false); }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (blocked || busy.current || !token || !answer.trim()) return;
    busy.current = true; setSending(true); setError(''); setFeedback('');
    try {
      const value = await flagApi.verify(token, answer.trim());
      if (!active.current) return;
      receive(value); setAnswer('');
      if (!value.solved) setFeedback('Incorrect flag. Keep investigating.');
    } catch (cause) {
      if (!active.current) return;
      setError((cause as Error).message);
      // Resynchronize after a lost reply, another tab's success, or a server-side cooldown.
      try { const value = await flagApi.state(token); if (active.current) receive(value); } catch { /* Keep the original error and allow an explicit retry. */ }
    } finally { busy.current = false; if (active.current) setSending(false); }
  }

  return <section className="ff-game" aria-label="Final Flag Challenge">
    <header className="ff-header"><p className="ff-eyebrow"><Flag size={14} /> FINAL STAGE / 100 POINTS</p><h1>{content.title}</h1><p className="ff-subtitle">{content.subtitle}</p><div className="ff-header-rule"><span />THE LAST SECRET<span /></div></header>
    {state?.solved ? <div className="ff-success" role="status"><div className="ff-success-icon"><ShieldCheck size={44} /></div><p className="ff-eyebrow">FINAL FLAG VERIFIED</p><h2>MISSION COMPLETE</h2><p>{content.successMessage}</p><div className="ff-score">100 <span>/ 100</span></div><p className="ff-muted">{state.recorded ? 'Your team’s result is already recorded.' : 'Passing your result to the competition…'}</p></div> : <>
      <ImageInspector />
      <div className="ff-bottom"><article className="ff-story"><p className="ff-eyebrow">01 / THE MYSTERY</p><h2>{content.storyTitle}</h2>{content.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}<div className="ff-security-note"><LockKeyhole size={16} /><span>Your team. One final discovery.</span></div></article>
        <section className="ff-submit-panel" aria-labelledby="ff-submit-title"><p className="ff-eyebrow">02 / THE REVELATION</p><h2 id="ff-submit-title">Submit the final flag</h2><p>Follow the clues. When you have the answer, send your flag for verification.</p>
          {loading && <p role="status">Checking your team’s challenge…</p>}
          {state && !state.available && <p className="ff-notice" role="status">The final challenge is waiting for the organiser’s configuration.</p>}
          <form onSubmit={event => void submit(event)}><label htmlFor="ff-answer">Your flag</label><input id="ff-answer" value={answer} onChange={event => setAnswer(event.target.value)} placeholder={content.placeholder} autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={512} disabled={blocked} aria-describedby="ff-attempts ff-feedback" /><button className="ff-primary" type="submit" disabled={blocked || !answer.trim()}><span>{sending ? 'Verifying…' : 'Submit Flag'}</span><Send size={17} /></button></form>
          <p id="ff-attempts" className="ff-attempts">{state ? `Attempts: ${state.attempts}${state.maxAttempts > 0 ? ` / ${state.maxAttempts}` : ''}` : 'Team progress is kept on the server.'}</p>
          <div id="ff-feedback" aria-live="polite">{feedback && <p className="ff-notice">{feedback}</p>}{wait > 0 && <p className="ff-muted">Next submission in {wait}s.</p>}{exhausted && <p className="ff-notice">No attempts remaining.</p>}</div>
          {error && <div className="ff-error" role="alert"><p>{error}</p><button type="button" onClick={() => void refresh()} disabled={loading || sending}>Retry connection</button></div>}
          <p className="ff-validation"><LockKeyhole size={12} /> Privately verified. No points lost for incorrect flags.</p>
        </section></div>
    </>}
    <footer className="ff-footer"><span>SILLICON RALLY / FINAL TRANSMISSION</span><span>ONE LAST MYSTERY.</span></footer>
  </section>;
}

export const game: GameDefinition = { slug: "final-flag-challenge", component: FinalFlagChallenge };

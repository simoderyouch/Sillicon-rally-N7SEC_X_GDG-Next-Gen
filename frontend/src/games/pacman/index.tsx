import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameDefinition, GameProps } from '../types';
import { DURATION_SECONDS, isEngineMessage, normalizeScore, readChallenge, type Challenge } from './challenge';
import { frameDocument } from './frame';

function Game({ mission, onComplete, disabled = false }: GameProps) {
  const key = `rally:pacman:v1:${sessionStorage.getItem('teamToken') ?? 'preview'}:${mission.id}`;
  const [initial] = useState(() => {
    try { return { state: readChallenge(key), error: '' }; }
    catch { return { state: null, error: 'Challenge storage is unavailable or invalid. Ask an organiser for help.' }; }
  });
  const state = useRef<Challenge | null>(initial.state);
  const [score, setScore] = useState(initial.state?.score ?? 0);
  const [remaining, setRemaining] = useState(() => initial.state ? Math.max(0, Math.ceil((initial.state.deadline - Date.now()) / 1000)) : DURATION_SECONDS);
  const [finished, setFinished] = useState(initial.state?.handedOff ?? false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(initial.error);
  const [roundOver, setRoundOver] = useState(false);
  const [instance, setInstance] = useState(() => crypto.randomUUID());
  const frame = useRef<HTMLIFrameElement>(null);
  const sequence = useRef(0);
  const stopping = useRef(false);
  const callback = useRef(onComplete);
  callback.current = onComplete;
  const document = useMemo(() => frameDocument(instance), [instance]);
  function persist(next: Challenge) {
    try { sessionStorage.setItem(key, JSON.stringify(next)); state.current = next; return true; }
    catch { setError('Cannot save the challenge. Ask an organiser for help.'); return false; }
  }
  function command(type: 'start' | 'stop') {
    frame.current?.contentWindow?.postMessage({ channel: 'rally-pacman-v1', instance, type,
      deadline: state.current?.deadline, score: state.current?.score ?? 0 }, location.origin);
  }
  function finish() {
    const current = state.current;
    if (!current || current.handedOff || disabled) return;
    // Persist before invoking a callback that can synchronously navigate/unmount.
    if (!persist({ ...current, handedOff: true })) return;
    setRemaining(0);
    setFinished(true);
    callback.current({ score: normalizeScore(current.score, mission.maxScore), completed: true,
      details: { pacmanScore: current.score, durationSeconds: Math.min(DURATION_SECONDS, Math.max(0, Math.floor((Date.now() - (current.deadline - DURATION_SECONDS * 1000)) / 1000))) } });
  }
  function start() {
    if (!ready || disabled || error || state.current || finished) return;
    if (!persist({ deadline: Date.now() + DURATION_SECONDS * 1000, score: 0, handedOff: false })) return;
    command('start');
    frame.current?.focus();
    setRemaining(DURATION_SECONDS);
  }
  function reload() {
    sequence.current = 0;
    setReady(false);
    setError('');
    setRoundOver(false);
    setInstance(crypto.randomUUID());
  }
  const wasDisabled = useRef(disabled);
  useEffect(() => {
    if (wasDisabled.current && !disabled) reload();
    wasDisabled.current = disabled;
  }, [disabled]);
  useEffect(() => {
    let fallback: number | undefined;
    const checkDeadline = () => {
      const current = state.current;
      if (!current || current.handedOff) return;
      const seconds = Math.max(0, Math.ceil((current.deadline - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds === 0 && !disabled && !stopping.current) {
        stopping.current = true;
        command('stop');
        // A final bridge acknowledgement drains score messages queued before the deadline.
        fallback = window.setTimeout(finish, 300);
      }
    };
    const receive = (event: MessageEvent) => {
      if (event.origin !== location.origin || event.source !== frame.current?.contentWindow || disabled || state.current?.handedOff) return;
      if (!isEngineMessage(event.data, instance) || event.data.sequence <= sequence.current) return;
      const data = event.data;
      sequence.current = data.sequence;
      if (data.type === 'error') { setError('Pac-Man resources failed to load. Retry loading; your timer and points are retained.'); return; }
      if (data.type === 'ready') {
        setReady(true);
        if (state.current && Date.now() < state.current.deadline) command('start');
        return;
      }
      const current = state.current;
      if (!current) return;
      if (['score', 'round-over'].includes(data.type) && data.at < current.deadline && data.at <= Date.now() && data.score >= current.score) {
        if (persist({ ...current, score: data.score })) setScore(data.score);
        if (data.type === 'round-over') {
          setRoundOver(true);
          finish();
          return;
        }
      }
      if (data.type === 'started') setRoundOver(false);
      if (data.type === 'stopped' && Date.now() >= current.deadline) finish();
    };
    window.addEventListener('message', receive);
    window.addEventListener('focus', checkDeadline);
    const timer = window.setInterval(checkDeadline, 100);
    checkDeadline();
    return () => {
      window.removeEventListener('message', receive);
      window.removeEventListener('focus', checkDeadline);
      clearInterval(timer);
      clearTimeout(fallback);
      stopping.current = false;
    };
  }, [instance, disabled, key, mission.maxScore]);
  useEffect(() => {
    if (ready || disabled || finished || error) return;
    const timeout = window.setTimeout(() => setError('Pac-Man did not become ready. Retry loading; your timer and points are retained.'), 20000);
    return () => clearTimeout(timeout);
  }, [ready, instance, disabled, finished, error]);
  const time = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
  return <section className="game-shell">
    <div className="game-briefing"><p className="eyebrow">Silicon Rally · Arcade</p><h1>{mission.title}</h1>
      <p>Collect dots and fruit, avoid ghosts, and use power pellets to turn the chase around.</p>
      <p>Arrow keys or WASD to move · Escape to pause · Q to mute. Pausing and leaving the page do not stop the five-minute clock.</p></div>
    <div className="game-workbench">
      <div className="workbench-header" style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <strong aria-label="Time remaining">{time}</strong><strong>Pac-Man score: {score}</strong>
        <span>Mission estimate: {normalizeScore(score, mission.maxScore)} / {mission.maxScore}</span>
      </div>
      {finished ? <p role="status">Challenge complete. Score is saved and being submitted to Silicon Rally.</p> : disabled ? <p role="status">Mission unavailable. The challenge clock continues.</p> : <>
        {!state.current && <button className="button-primary" disabled={!ready || !!error} onClick={start}>Start five-minute challenge</button>}
        <p role="status">{error ? '' : !ready ? 'Loading Pac-Man…' : roundOver ? 'Round over. Press PLAY in the game to continue; your points and deadline are retained.' : state.current ? 'Challenge running. Click the maze to focus the keyboard.' : 'Ready. Start when your team is prepared.'}</p>
        {error ? <div role="alert"><p>{error}</p>{!initial.error && <button onClick={reload}>Retry loading</button>}</div> :
          <iframe ref={frame} title="Pac-Man game" srcDoc={document} onError={() => setError('Pac-Man could not load.')}
            style={{ display: 'block', width: '100%', height: 'min(72vh, 760px)', minHeight: 320, border: 0, background: '#000' }} />}
      </>}
      <p style={{ padding: 12 }}>Original implementation: Brent Ward · MIT. New rounds keep all earned points. Sound is optional.</p>
    </div>
  </section>;
}
export const game: GameDefinition = { slug: "pacman", component: Game };

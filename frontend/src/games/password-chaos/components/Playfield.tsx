import { useEffect, useRef } from 'react';
import type { Challenge } from '../types';

export function Playfield({ challenge, index, total, score, remainingMs, draft, checks, notice, disabled, onDraft, onSubmit }: {
  challenge: Challenge;
  index: number;
  total: number;
  score: string;
  remainingMs: number;
  draft: string;
  checks: { id: string; label: string; pass: boolean }[];
  notice: string;
  disabled: boolean;
  onDraft: (value: string) => void;
  onSubmit: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const limitMs = challenge.seconds * 1000;
  const ratio = Math.max(0, Math.min(1, remainingMs / limitMs));
  const urgent = remainingMs > 0 && remainingMs < 2000;
  const length = challenge.length.exact ? String(challenge.length.exact) : `${challenge.length.min}–${challenge.length.max}`;
  useEffect(() => { input.current?.focus(); }, [challenge.id]);

  return <section className={`pc-play ${urgent ? 'urgent' : ''}`}>
    <header className="pc-top">
      <div>
        <p className="pc-kicker">Password Chaos</p>
        <p className="pc-count">{index + 1} / {total}</p>
      </div>
      <p className="pc-score">Score <strong>{score}</strong> / 100</p>
    </header>
    <ol className="pc-progress" aria-label="Challenge progress">
      {Array.from({ length: total }, (_, item) => <li key={item} className={item < index ? 'done' : item === index ? 'now' : ''} />)}
    </ol>
    <div className="pc-layout">
      <div>
        <div className="pc-title">
          <h2>{challenge.title}</h2>
          <span className={`pc-tier ${challenge.tier.toLowerCase()}`}>{challenge.tier}</span>
        </div>
        <ul className="pc-rules">
          {checks.map(rule => <li key={rule.id} className={rule.pass ? 'pass' : 'miss'}>
            <span aria-hidden="true">{rule.pass ? '✓' : '·'}</span>
            <span>{rule.label}</span>
            <span className="pc-sr">{rule.pass ? 'Satisfied' : 'Not satisfied'}</span>
          </li>)}
        </ul>
        <form onSubmit={event => { event.preventDefault(); onSubmit(); }}>
          <label className="pc-field">
            Password
            <input ref={input} value={draft} autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false} disabled={disabled} aria-label="Password" onChange={event => onDraft(event.target.value)} />
          </label>
          <p className="pc-length">{draft.length} / {length} characters</p>
          <div className="pc-actions">
            <button type="submit" className="pc-primary" disabled={disabled}>Validate</button>
            {notice && <p role="status" className="pc-notice">{notice}</p>}
          </div>
        </form>
      </div>
      <aside className="pc-timer" aria-label="Time remaining">
        <div className="pc-ring" style={{ ['--ratio' as string]: String(ratio) }}>
          <strong>{(remainingMs / 1000).toFixed(1)}</strong>
          <span>seconds</span>
        </div>
        <p>{challenge.base} base + {challenge.bonus} speed</p>
      </aside>
    </div>
  </section>;
}

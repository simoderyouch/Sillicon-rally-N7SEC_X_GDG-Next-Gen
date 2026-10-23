import { CHALLENGES } from '../challenges';
import type { Outcome } from '../types';

function clock(ms: number) {
  const seconds = Math.max(0, ms) / 1000;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${(seconds - minutes * 60).toFixed(1).padStart(4, '0')}`;
}

export function Results({ outcomes, precise, submitted, elapsedMs, maxScore }: {
  outcomes: Outcome[];
  precise: string;
  submitted: number;
  elapsedMs: number;
  maxScore: number;
}) {
  const solved = outcomes.filter(item => item.status === 'success').length;
  const failed = outcomes.length - solved;
  return <section className="pc-results">
    <p className="pc-kicker">Session complete</p>
    <h2>Password Chaos</h2>
    <p className="pc-final"><strong>{precise}</strong><span>/ 100</span></p>
    <p>Submitted score {submitted} / {maxScore}. {solved} completed, {failed} failed. Elapsed {clock(elapsedMs)}.</p>
    <ol className="pc-breakdown">
      {CHALLENGES.map(challenge => {
        const outcome = outcomes.find(item => item.id === challenge.id);
        return <li key={challenge.id}>
          <span>{String(challenge.id).padStart(2, '0')} {challenge.title}</span>
          <b>{outcome?.status === 'success' ? outcome.score.toFixed(2) : '0.00'}</b>
        </li>;
      })}
    </ol>
  </section>;
}

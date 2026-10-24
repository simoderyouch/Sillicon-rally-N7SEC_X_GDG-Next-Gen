import { useEffect, useRef, useState } from 'react';
import type { GameDefinition, GameProps } from '../types';
import { CHALLENGES } from './challenges';
import { Briefing } from './components/Briefing';
import { Playfield } from './components/Playfield';
import { Results } from './components/Results';
import { readSave, retireLegacySession, settleExpired, storageKey, writeSave, blankSave } from './persistence';
import { challengeScore, submittedScore, totalScore } from './scoring';
import type { Save } from './types';
import { evaluate, isValid } from './validators';
import './styles.css';

function Game({ mission, onComplete, disabled = false }: GameProps) {
  const key = storageKey(mission.id);
  const [retired] = useState(() => {
    const hadLegacy = retireLegacySession(mission.id);
    const existing = readSave(key);
    return hadLegacy && (existing === null || existing.phase === 'briefing');
  });
  const [save, setSave] = useState<Save | null>(() => readSave(key));
  const [now, setNow] = useState(() => Date.now());
  const [notice, setNotice] = useState('');
  const current = useRef<Save | null>(save);
  current.current = save;
  const callback = useRef(onComplete);
  callback.current = onComplete;
  const lockUntil = useRef(0);
  const finishing = useRef(false);

  function commit(next: Save) {
    try {
      writeSave(key, next);
      current.current = next;
      setSave(next);
      return true;
    } catch {
      setSave(null);
      return false;
    }
  }

  function sync(at = Date.now()) {
    const active = current.current;
    if (!active) return;
    const settled = settleExpired(active, at);
    if (settled !== active) {
      commit(settled);
      setNotice('Time is up.');
    }
    setNow(at);
  }

  useEffect(() => {
    sync(Date.now());
    const timer = window.setInterval(() => sync(Date.now()), 50);
    const onShow = () => { if (document.visibilityState === 'visible') sync(Date.now()); };
    document.addEventListener('visibilitychange', onShow);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', onShow); };
  }, [key]);

  useEffect(() => {
    if (!save || save.phase !== 'done' || save.handedOff || finishing.current || disabled) return;
    const precise = totalScore(save.outcomes.map(item => item.score));
    if (!commit({ ...save, handedOff: true })) return;
    finishing.current = true;
    const elapsedMs = save.startedAt !== null && save.finishedAt !== null ? Math.max(0, save.finishedAt - save.startedAt) : 0;
    callback.current({
      score: submittedScore(precise, mission.maxScore),
      completed: true,
      details: {
        source: 'password-chaos',
        preciseScore: precise,
        solved: save.outcomes.filter(item => item.status === 'success').length,
        timedOut: save.outcomes.filter(item => item.status === 'timeout').length,
        elapsedMs,
        challenges: CHALLENGES.length,
      },
    });
  }, [save, disabled, mission.maxScore]);

  function start() {
    if (disabled || !save || save.phase !== 'briefing') return;
    const at = Date.now();
    setNotice('');
    commit({ ...blankSave(), phase: 'playing', deadline: at + CHALLENGES[0].seconds * 1000, startedAt: at });
  }

  function validate() {
    const at = Date.now();
    const active = current.current;
    if (!active || active.phase !== 'playing' || active.deadline === null || disabled || at < lockUntil.current) return;
    if (at >= active.deadline) { sync(at); return; }
    const challenge = CHALLENGES[active.index];
    if (!challenge || !isValid(challenge.id, active.draft)) { setNotice('Conditions are not met.'); return; }
    const limitMs = challenge.seconds * 1000;
    const remainingMs = active.deadline - at;
    const outcomes = [...active.outcomes, { id: challenge.id, status: 'success' as const, score: challengeScore(challenge.base, challenge.bonus, limitMs, remainingMs), elapsedMs: limitMs - remainingMs }];
    const index = active.index + 1;
    lockUntil.current = at + 280;
    setNotice('Accepted.');
    if (index >= CHALLENGES.length) {
      commit({ ...active, phase: 'done', index, deadline: null, outcomes, draft: '', finishedAt: at });
      return;
    }
    commit({ ...active, index, deadline: at + CHALLENGES[index].seconds * 1000, outcomes, draft: '' });
  }

  if (!save) return <section className="pc"><p role="alert">Challenge storage is unavailable or invalid. Ask an organiser for help.</p></section>;
  if (save.phase === 'briefing') return <section className="pc" aria-label="Password Chaos"><Briefing title={mission.title} notice={retired ? 'A previous attempt used the retired time limits and was not resumed.' : undefined} onStart={start} /></section>;
  if (save.phase === 'done') {
    const precise = totalScore(save.outcomes.map(item => item.score));
    const elapsedMs = save.startedAt !== null && save.finishedAt !== null ? Math.max(0, save.finishedAt - save.startedAt) : 0;
    return <section className="pc" aria-label="Password Chaos"><Results outcomes={save.outcomes} precise={precise.toFixed(2)} submitted={submittedScore(precise, mission.maxScore)} elapsedMs={elapsedMs} maxScore={mission.maxScore} /></section>;
  }
  const challenge = CHALLENGES[save.index] ?? CHALLENGES[0];
  const remainingMs = save.deadline === null ? 0 : Math.max(0, save.deadline - now);
  return <section className="pc" aria-label="Password Chaos">
    <Playfield challenge={challenge} index={save.index} total={CHALLENGES.length} score={totalScore(save.outcomes.map(item => item.score)).toFixed(2)} remainingMs={remainingMs} draft={save.draft} checks={evaluate(challenge.id, save.draft)} notice={notice} disabled={disabled} onDraft={value => { if (!disabled && current.current?.phase === 'playing') { setNotice(''); commit({ ...current.current, draft: value }); } }} onSubmit={validate} />
  </section>;
}

export const game: GameDefinition = { slug: "password-chaos", component: Game };

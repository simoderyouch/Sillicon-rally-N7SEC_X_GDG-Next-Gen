import { useEffect, useRef, useState } from 'react';
import type { GameDefinition, GameProps } from '../types';
import { DURATION_SECONDS, failureMessage, levelPoints, normalizeScore, run, starKey } from './engine';
import { LEVELS } from './levels';
import type { Color, Dir, Op, ProgramName, Programs } from './types';
import { GameBoard } from './components/GameBoard';
import { GameControls } from './components/GameControls';
import { InstructionPalette } from './components/InstructionPalette';
import { LevelProgress } from './components/LevelProgress';
import { ProgramEditor } from './components/ProgramEditor';
import './style.css';

type Save = { deadline: number; cleared: number[]; level: number; handedOff: boolean };

function blank(id: number): Programs {
  const level = LEVELS.find(item => item.id === id) ?? LEVELS[0];
  return { f1: Array(level.slots.f1).fill(null), f2: Array(level.slots.f2).fill(null) };
}

function load(key: string) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) {
      const save: Save = { deadline: Date.now() + DURATION_SECONDS * 1000, cleared: [], level: 1, handedOff: false };
      sessionStorage.setItem(key, JSON.stringify(save));
      return { save, error: '' };
    }
    const save = JSON.parse(raw) as Save;
    if (!Number.isSafeInteger(save.deadline) || !Array.isArray(save.cleared) || !Number.isSafeInteger(save.level) || typeof save.handedOff !== 'boolean') {
      throw new Error('invalid');
    }
    return { save, error: '' };
  } catch {
    return { save: null, error: 'Challenge storage is unavailable or invalid. Ask an organiser for help.' };
  }
}

function clock(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function Game({ mission, onComplete, disabled = false }: GameProps) {
  const key = `rally:algo-game:v1:${sessionStorage.getItem('teamToken') ?? 'preview'}:${mission.id}`;
  const [initial] = useState(() => load(key));
  const save = useRef<Save | null>(initial.save);
  const [levelId, setLevelId] = useState(initial.save?.level ?? 1);
  const [cleared, setCleared] = useState<number[]>(initial.save?.cleared ?? []);
  const [remaining, setRemaining] = useState(() => initial.save ? Math.max(0, Math.ceil((initial.save.deadline - Date.now()) / 1000)) : DURATION_SECONDS);
  const [finished, setFinished] = useState(initial.save?.handedOff ?? false);
  const [programs, setPrograms] = useState<Programs>(() => blank(initial.save?.level ?? 1));
  const [armed, setArmed] = useState<Op | null>('forward');
  const [brush, setBrush] = useState<Color | null>(null);
  const [speed, setSpeed] = useState(1);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState(initial.error);
  const [pose, setPose] = useState<{ r: number; c: number; dir: Dir }>(() => {
    const level = LEVELS.find(item => item.id === (initial.save?.level ?? 1)) ?? LEVELS[0];
    return { r: level.start.r, c: level.start.c, dir: level.start.dir };
  });
  const [collected, setCollected] = useState<string[]>([]);
  const [active, setActive] = useState<{ name: ProgramName; index: number }>();
  const memory = useRef<Record<number, Programs>>({});
  const runToken = useRef(0);
  const callback = useRef(onComplete);
  callback.current = onComplete;
  const level = LEVELS.find(item => item.id === levelId) ?? LEVELS[0];
  const earned = levelPoints(cleared, LEVELS);
  const locked = disabled || finished || !save.current;

  function persist(next: Save) {
    try {
      sessionStorage.setItem(key, JSON.stringify(next));
      save.current = next;
      return true;
    } catch {
      setMessage('Cannot save the challenge. Ask an organiser for help.');
      return false;
    }
  }

  function finish(done = save.current?.cleared ?? cleared) {
    const current = save.current;
    if (!current || current.handedOff || disabled) return;
    if (!persist({ ...current, cleared: done, handedOff: true, level: levelId })) return;
    runToken.current += 1;
    setCleared(done);
    setRunning(false);
    setFinished(true);
    setRemaining(0);
    callback.current({
      score: normalizeScore(levelPoints(done, LEVELS), mission.maxScore),
      completed: true,
      details: { source: 'algo-game', levelsCompleted: done.length, totalLevels: LEVELS.length, durationSeconds: DURATION_SECONDS },
    });
  }

  function resetPose(id: number) {
    const next = LEVELS.find(item => item.id === id) ?? LEVELS[0];
    setPose({ r: next.start.r, c: next.start.c, dir: next.start.dir });
    setCollected(next.stars.some(star => star.r === next.start.r && star.c === next.start.c) ? [starKey(next.start.r, next.start.c)] : []);
    setActive(undefined);
    setRunning(false);
  }

  function show(id: number) {
    resetPose(id);
    setPrograms(memory.current[id] ?? blank(id));
  }

  function openLevel(id: number) {
    if (locked || running) return;
    memory.current[levelId] = programs;
    setLevelId(id);
    setArmed('forward');
    setBrush(null);
    setMessage('');
    if (save.current) persist({ ...save.current, level: id });
    show(id);
  }

  function resetRobot() {
    runToken.current += 1;
    resetPose(levelId);
    if (!finished) setMessage('');
  }

  function place(name: ProgramName, index: number) {
    if (locked || running) return;
    setPrograms(previous => {
      const slots = [...previous[name]];
      slots[index] = armed ? { op: armed, when: brush ?? undefined } : null;
      return { ...previous, [name]: slots };
    });
  }

  function play() {
    if (locked || running) return;
    const result = run(level, programs);
    if (result.steps.length === 0) { setMessage(failureMessage(result.reason)); return; }
    const token = ++runToken.current;
    const delay = Math.max(16, Math.round(320 / speed));
    setRunning(true);
    setMessage('');
    let index = 0;
    const tick = () => {
      if (runToken.current !== token) return;
      if (index >= result.steps.length) {
        setRunning(false);
        setActive(undefined);
        if (!result.ok) { setMessage(failureMessage(result.reason)); return; }
        setMessage('Stars collected.');
        const done = save.current && save.current.cleared.includes(level.id) ? save.current.cleared : [...(save.current?.cleared ?? []), level.id];
        setCleared(done);
        if (save.current) persist({ ...save.current, cleared: done, level: level.id });
        window.setTimeout(() => {
          if (runToken.current !== token || !save.current || save.current.handedOff) return;
          if (done.length === LEVELS.length) { finish(done); return; }
          const following = Math.min(LEVELS.length, level.id + 1);
          memory.current[level.id] = programs;
          persist({ ...save.current, cleared: done, level: following });
          setLevelId(following);
          setMessage('');
          show(following);
        }, 450);
        return;
      }
      const step = result.steps[index];
      index += 1;
      setPose({ r: step.r, c: step.c, dir: step.dir });
      setCollected(step.collected);
      setActive({ name: step.program, index: step.index });
      window.setTimeout(tick, delay);
    };
    window.setTimeout(tick, delay);
  }

  useEffect(() => () => { runToken.current += 1; }, []);

  useEffect(() => {
    const check = () => {
      const current = save.current;
      if (!current) return;
      const seconds = Math.max(0, Math.ceil((current.deadline - Date.now()) / 1000));
      setRemaining(current.handedOff ? 0 : seconds);
      if (seconds === 0 && !current.handedOff && !disabled) finish(current.cleared);
    };
    check();
    const timer = window.setInterval(check, 100);
    return () => clearInterval(timer);
  }, [disabled, finished, levelId]);

  const ops = level.commands;
  const rows = [
    { name: 'f1' as const, label: 'F1', slots: programs.f1 },
    ...(level.slots.f2 ? [{ name: 'f2' as const, label: 'F2', slots: programs.f2 }] : []),
  ];

  if (!save.current) {
    return <section className="algo-game"><p role="alert">{message}</p></section>;
  }

  return <section className="algo-game" aria-label="Algo Game">
    <header className="algo-top">
      <div><p className="algo-kicker">Silicon Rally · Algo Game</p><h2>{mission.title}</h2></div>
      <p className="algo-clock" aria-label="Time remaining">{clock(remaining)}</p>
      <p className="algo-score">Rally score <strong>{normalizeScore(earned, mission.maxScore)}</strong> / {mission.maxScore}</p>
    </header>
    {finished ? <div className="algo-results" role="status">
      <p>Challenge complete. Result handed to Silicon Rally for submission.</p>
      <p>{cleared.length} / {LEVELS.length} levels · {earned} level points · submitted score {normalizeScore(earned, mission.maxScore)}.</p>
    </div> : <>
      <LevelProgress levels={LEVELS} current={level.id} cleared={cleared} disabled={locked || running} onPick={openLevel} />
      <div className="algo-layout">
        <div>
          <div className="algo-level-head">
            <h3>Level {level.id}</h3>
            <span className={`algo-badge ${level.difficulty.toLowerCase()}`}>{level.difficulty}</span>
            <span>{level.points} pts</span>
          </div>
          <GameBoard level={level} r={pose.r} c={pose.c} dir={pose.dir} collected={collected} moving={running} />
          <p className="algo-hint">{level.hint}</p>
        </div>
        <div className="algo-side">
          <GameControls speed={speed} running={running} disabled={locked} onSpeed={setSpeed} onRun={play} onReset={resetRobot} />
          <ProgramEditor rows={rows} active={active} disabled={locked || running} onSlot={place} />
          <InstructionPalette ops={ops} armed={armed} brush={brush} conditions={level.conditions} disabled={locked || running} onArm={op => setArmed(current => current === op ? null : op)} onBrush={color => setBrush(current => current === color ? null : color)} />
          <p className="algo-help">Select a command, then click a slot. Click a color first to run that command only on cells of that color. Click a slot with no command selected to clear it. Reset puts the robot back and keeps the program.</p>
        </div>
      </div>
      {message && <p role="status" className="algo-status">{message}</p>}
    </>}
  </section>;
}

export const game: GameDefinition = { slug: "algo-game", component: Game };

import { useState } from "react";
import type { GameDefinition, GameProps } from "../types";
import "./beacon-bounce.css";

type BeaconId = "sun" | "rose" | "mint" | "violet" | "ember" | "pearl" | "lime" | "plum" | "apricot";
type Phase = "ready" | "showing" | "input" | "complete" | "failed";

const beacons: { id: BeaconId; name: string; glyph: string }[] = [
  { id: "sun", name: "Sun", glyph: "✦" }, { id: "rose", name: "Rose", glyph: "●" }, { id: "mint", name: "Mint", glyph: "◆" },
  { id: "violet", name: "Violet", glyph: "✳" }, { id: "ember", name: "Ember", glyph: "▲" }, { id: "pearl", name: "Pearl", glyph: "○" },
  { id: "lime", name: "Lime", glyph: "✚" }, { id: "plum", name: "Plum", glyph: "⬟" }, { id: "apricot", name: "Apricot", glyph: "✶" },
];

const rounds: { route: BeaconId[]; pace: number; label: string; points: number }[] = [
  { route: ["sun", "rose", "mint"], pace: 760, label: "Steady", points: 8 },
  { route: ["violet", "ember", "lime"], pace: 650, label: "Brisk", points: 10 },
  { route: ["pearl", "sun", "plum", "rose"], pace: 540, label: "Quick", points: 13 },
  { route: ["mint", "violet", "apricot", "ember", "sun", "plum"], pace: 380, label: "Hard mode", points: 16 },
  { route: ["lime", "pearl", "rose", "plum", "sun", "mint", "violet"], pace: 300, label: "Harder", points: 22 },
  { route: ["apricot", "mint", "ember", "violet", "lime", "pearl", "sun", "plum", "rose"], pace: 235, label: "Final burst", points: 31 },
];

const hintActions = ["Replay this route", "Pin the first two stops"];

function BeaconBounce({ mission, onComplete, disabled = false }: GameProps) {
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<Phase>("ready");
  const [activeBeacon, setActiveBeacon] = useState<BeaconId | null>(null);
  const [attempt, setAttempt] = useState<BeaconId[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [totalHintsUsed, setTotalHintsUsed] = useState(0);
  const [showPinnedStart, setShowPinnedStart] = useState(false);
  const [earnedScore, setEarnedScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const currentRound = rounds[round];
  const nextHint = hintsUsed < hintActions.length ? hintActions[hintsUsed] : null;

  function showRoute() {
    if (phase !== "ready" || disabled || finished) return;
    setAttempt([]);
    setPhase("showing");
    const pulseDuration = Math.max(175, Math.round(currentRound.pace * 0.65));
    currentRound.route.forEach((beaconId, index) => {
      window.setTimeout(() => setActiveBeacon(beaconId), index * currentRound.pace);
      window.setTimeout(() => setActiveBeacon(null), index * currentRound.pace + pulseDuration);
    });
    window.setTimeout(() => { setActiveBeacon(null); setPhase("input"); }, currentRound.route.length * currentRound.pace);
  }

  function chooseBeacon(beaconId: BeaconId) {
    if (phase !== "input" || disabled || finished) return;
    const expectedBeacon = currentRound.route[attempt.length];
    if (beaconId !== expectedBeacon) {
      setPhase("failed");
      setActiveBeacon(null);
      return;
    }

    const nextAttempt = [...attempt, beaconId];
    setAttempt(nextAttempt);
    if (nextAttempt.length !== currentRound.route.length) return;

    const scoreAfterRound = earnedScore + currentRound.points;
    setEarnedScore(scoreAfterRound);
    if (round === rounds.length - 1) {
      setPhase("complete");
      return;
    }

    setRound((value) => value + 1);
    setPhase("ready");
    setAttempt([]);
    setHintsUsed(0);
    setShowPinnedStart(false);
  }

  function useHint() {
    if (!nextHint || phase !== "input" || disabled || finished) return;
    setHintsUsed((value) => value + 1);
    setTotalHintsUsed((value) => value + 1);
    if (hintsUsed === 0) {
      setAttempt([]);
      setPhase("ready");
      return;
    }
    setShowPinnedStart(true);
  }

  function resetRun() {
    if (disabled || finished) return;
    setRound(0);
    setPhase("ready");
    setActiveBeacon(null);
    setAttempt([]);
    setHintsUsed(0);
    setTotalHintsUsed(0);
    setShowPinnedStart(false);
    setEarnedScore(0);
  }

  function finish() {
    if (phase !== "complete" || disabled || finished) return;
    setFinished(true);
    onComplete({ score: earnedScore, completed: true, details: { roundsCleared: rounds.length, hintsUsed: totalHintsUsed, incorrectSequences: 0 } });
  }

  const roundMessage = phase === "failed"
    ? { eyebrow: `Round ${round + 1} ended the run`, title: "Run over.", body: "A beacon was out of order. No points were submitted—start again from round 1." }
    : phase === "complete"
      ? { eyebrow: "All six routes cleared", title: "Parade complete.", body: `${earnedScore} points secured. Dispatch the result to record your team score.` }
      : phase === "showing"
        ? { eyebrow: `Round ${round + 1} · ${currentRound.points} points`, title: "Watch the route.", body: "The board will unlock when the final beacon fades." }
        : phase === "input"
          ? { eyebrow: `Round ${round + 1} · ${currentRound.points} points`, title: `${attempt.length} of ${currentRound.route.length} beacons repeated.`, body: "Choose the next beacon. One wrong tap ends this run." }
          : { eyebrow: `Round ${round + 1} of ${rounds.length} · ${currentRound.points} points`, title: round === 0 ? "Ready for the first route." : "Route cleared.", body: round === 0 ? "Watch the order, then repeat it exactly. One wrong tap ends the run." : round === 3 ? `${earnedScore} points secured. Hard mode begins: six beacons at 380 ms.` : `${earnedScore} points secured. The next route plays faster.` };

  return (
    <section className="game-shell beacon-bounce">
      <div className="game-briefing"><p className="eyebrow">Challenge beacon-bounce · light parade</p><h1>{mission.title}</h1><p className="lede">Six routes. Faster playback each round. One wrong beacon ends the run.</p></div>
      <div className="beacon-bounce-board">
        <div className="beacon-bounce-topline"><span>Round <b>{Math.min(round + 1, rounds.length)}</b> / {rounds.length}<small>{currentRound.label} · {currentRound.pace} ms</small></span><span>Secured <b>{earnedScore}</b> / {mission.maxScore} pts<small>Current round · {currentRound.points} pts</small></span></div>
        <div className="beacon-bounce-stage">
          <div className={`beacon-bounce-round-message is-${phase}`} aria-live="polite"><span>{roundMessage.eyebrow}</span><strong>{roundMessage.title}</strong><p>{roundMessage.body}</p></div>
          <div className="beacon-bounce-grid" aria-label="Beacon route board">
            {beacons.map((beacon) => <button key={beacon.id} type="button" className={`beacon beacon-${beacon.id} ${activeBeacon === beacon.id ? "is-lit" : ""} ${attempt.includes(beacon.id) && phase === "input" ? "is-picked" : ""}`} aria-label={`Beacon ${beacon.name}`} disabled={phase !== "input" || disabled || finished} onClick={() => chooseBeacon(beacon.id)}><span aria-hidden="true">{beacon.glyph}</span><small>{beacon.name}</small></button>)}
          </div>
          {showPinnedStart && phase !== "failed" && <p className="beacon-bounce-pinned">Pinned start: {currentRound.route.slice(0, 2).map((id) => beacons.find((beacon) => beacon.id === id)?.name).join(" → ")}</p>}
          {phase === "failed" ? <button type="button" className="beacon-bounce-show" onClick={resetRun} disabled={disabled || finished}>Start again <span aria-hidden="true">↺</span><small>Return to round 1 · 0 points</small></button> : <button type="button" className="beacon-bounce-show" disabled={phase !== "ready" || disabled || finished} onClick={showRoute}>{round === 0 ? "Show the first route" : "Show next route"} <span aria-hidden="true">↗</span><small>{currentRound.label} · {currentRound.route.length} beacons · {currentRound.points} points</small></button>}
        </div>
        {phase !== "failed" && phase !== "complete" && <div className="beacon-bounce-console"><div className="beacon-bounce-help"><span>Need a hand?</span><small>{nextHint ?? "Both hints have been used this round."}</small><button type="button" className="beacon-bounce-hint" disabled={!nextHint || phase !== "input" || disabled || finished} onClick={useHint}>{nextHint ? `Reveal hint ${hintsUsed + 1}` : "Hints used"}<b>{nextHint ? "No point penalty" : "Round limit reached"}</b></button></div></div>}
      </div>
      <div className="game-action-row"><span>{phase === "complete" ? "All six routes are complete." : phase === "failed" ? "This run has ended. Start again to try the six-route course." : "Clear every route in order to unlock dispatch."}</span><button className="button-primary" disabled={phase !== "complete" || disabled || finished} onClick={finish}>{finished ? "Result recorded" : "Dispatch result"} <span aria-hidden="true">→</span></button></div>
    </section>
  );
}

export const game: GameDefinition = { slug: "beacon-bounce", component: BeaconBounce };

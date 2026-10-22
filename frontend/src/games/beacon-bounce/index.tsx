import { useMemo, useState } from "react";
import type { GameDefinition, GameProps } from "../types";
import "./beacon-bounce.css";

type BeaconId = "sun" | "rose" | "mint" | "violet" | "ember" | "pearl";
type Phase = "ready" | "showing" | "input" | "complete";

const beacons: { id: BeaconId; name: string; glyph: string }[] = [
  { id: "sun", name: "Sun", glyph: "✦" },
  { id: "rose", name: "Rose", glyph: "●" },
  { id: "mint", name: "Mint", glyph: "◆" },
  { id: "violet", name: "Violet", glyph: "✳" },
  { id: "ember", name: "Ember", glyph: "▲" },
  { id: "pearl", name: "Pearl", glyph: "○" },
];

const routes: BeaconId[][] = [
  ["sun", "rose", "mint"],
  ["violet", "ember", "sun", "pearl"],
  ["mint", "rose", "violet", "ember", "sun"],
];

const hintMessages = [
  "The route will play again. Watch for the beacon order, not the colour pattern.",
  "The first two stops are now pinned beneath the route board.",
  "This round was cleared for you. One final route remains.",
];

function BeaconBounce({ mission, onComplete, disabled = false }: GameProps) {
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<Phase>("ready");
  const [activeBeacon, setActiveBeacon] = useState<BeaconId | null>(null);
  const [attempt, setAttempt] = useState<BeaconId[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [notice, setNotice] = useState("Show the first route, then repeat the glow in order.");
  const [finished, setFinished] = useState(false);

  const route = routes[round];
  const projectedScore = useMemo(() => Math.max(0, Math.round(mission.maxScore * (1 - ([0, 0.1, 0.2, 0.3][hintsUsed] ?? 0.3)))), [hintsUsed, mission.maxScore]);

  function showRoute() {
    if (phase !== "ready" || disabled || finished) return;
    setAttempt([]);
    setPhase("showing");
    setNotice("Watch the beacons. The route will fade before your turn.");
    route.forEach((beaconId, index) => {
      window.setTimeout(() => setActiveBeacon(beaconId), index * 700);
      window.setTimeout(() => setActiveBeacon(null), index * 700 + 470);
    });
    window.setTimeout(() => { setActiveBeacon(null); setPhase("input"); setNotice("Your turn. Repeat the route one beacon at a time."); }, route.length * 700);
  }

  function chooseBeacon(beaconId: BeaconId) {
    if (phase !== "input" || disabled || finished) return;
    const expectedBeacon = route[attempt.length];
    if (beaconId !== expectedBeacon) {
      setAttempt([]);
      setMistakes((value) => value + 1);
      setNotice("That was not the next stop. The route is reset; try the sequence again.");
      return;
    }

    const nextAttempt = [...attempt, beaconId];
    setAttempt(nextAttempt);
    if (nextAttempt.length !== route.length) return;

    if (round === routes.length - 1) {
      setPhase("complete");
      setNotice("The light parade is complete. Dispatch the result when your team is ready.");
      return;
    }

    setRound((value) => value + 1);
    setPhase("ready");
    setNotice("Route complete. The next route is one step longer.");
  }

  function useHint() {
    if (hintsUsed >= hintMessages.length || phase === "complete" || disabled || finished) return;
    const nextHint = hintsUsed + 1;
    setHintsUsed(nextHint);
    if (nextHint === 1) {
      setPhase("ready");
      setNotice(hintMessages[0]);
      return;
    }
    if (nextHint === 2) {
      setNotice(hintMessages[1]);
      return;
    }
    if (round === routes.length - 1) {
      setPhase("complete");
      setNotice("The last route was cleared for you. Dispatch the result when ready.");
      return;
    }
    setRound((value) => value + 1);
    setPhase("ready");
    setAttempt([]);
    setNotice(hintMessages[2]);
  }

  function finish() {
    if (phase !== "complete" || disabled || finished) return;
    setFinished(true);
    onComplete({ score: projectedScore, completed: true, details: { roundsCleared: routes.length, hintsUsed, incorrectSequences: mistakes } });
  }

  return (
    <section className="game-shell beacon-bounce">
      <div className="game-briefing"><p className="eyebrow">Challenge beacon-bounce · light parade</p><h1>{mission.title}</h1><p className="lede">Watch the glowing route, remember the order, and guide the beacon parade home.</p></div>
      <div className="beacon-bounce-board">
        <div className="beacon-bounce-topline"><span>Round <b>{Math.min(round + 1, routes.length)}</b> / {routes.length}</span><span>Projected score <b>{projectedScore}</b> pts</span></div>
        <div className="beacon-bounce-stage">
          <div className="beacon-bounce-route" aria-live="polite"><span>Route status</span><strong>{phase === "showing" ? "Watching the glow" : phase === "input" ? `${attempt.length} / ${route.length} repeated` : phase === "complete" ? "Parade complete" : "Ready when you are"}</strong></div>
          <div className="beacon-bounce-grid" aria-label="Beacon route board">
            {beacons.map((beacon) => <button key={beacon.id} type="button" className={`beacon beacon-${beacon.id} ${activeBeacon === beacon.id ? "is-lit" : ""} ${attempt.includes(beacon.id) && phase === "input" ? "is-picked" : ""}`} aria-label={`Beacon ${beacon.name}`} disabled={phase !== "input" || disabled || finished} onClick={() => chooseBeacon(beacon.id)}><span aria-hidden="true">{beacon.glyph}</span><small>{beacon.name}</small></button>)}
          </div>
          {hintsUsed >= 2 && phase !== "complete" && <p className="beacon-bounce-pinned">Pinned start: {route.slice(0, 2).map((id) => beacons.find((beacon) => beacon.id === id)?.name).join(" → ")}</p>}
        </div>
        <div className="beacon-bounce-console" aria-live="polite"><p>{notice}</p><div><button type="button" className="beacon-bounce-hint" disabled={hintsUsed >= hintMessages.length || phase === "complete" || disabled || finished} onClick={useHint}>{hintsUsed >= hintMessages.length ? "All hints used" : `Use hint ${hintsUsed + 1}`} <span>−{hintsUsed === 0 ? "10" : hintsUsed === 1 ? "20" : "30"}%</span></button><button type="button" className="beacon-bounce-show" disabled={phase !== "ready" || disabled || finished} onClick={showRoute}>{round === 0 ? "Show route" : "Show next route"} <span aria-hidden="true">↗</span></button></div></div>
      </div>
      <div className="game-action-row"><span>{phase === "complete" ? "All three routes are complete." : "Complete all three routes to unlock dispatch."}</span><button className="button-primary" disabled={phase !== "complete" || disabled || finished} onClick={finish}>{finished ? "Result recorded" : "Dispatch result"} <span aria-hidden="true">→</span></button></div>
    </section>
  );
}

export const game: GameDefinition = { slug: "beacon-bounce", component: BeaconBounce };

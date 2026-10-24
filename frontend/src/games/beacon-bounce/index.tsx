import { useEffect, useState } from "react";
import { Circle, Diamond, Hexagon, Plus, Sparkles, Star, Sun, Triangle, Zap, type LucideIcon } from "lucide-react";
import type { GameDefinition, GameProps } from "../types";
import { beaconBounceApi, type BeaconRun } from "./gameApi";
import { getTeamToken } from "../../teamSession";
import "./beacon-bounce.css";

type BeaconId = "sun" | "rose" | "mint" | "violet" | "ember" | "pearl" | "lime" | "plum" | "apricot";
type Phase = "loading" | "ready" | "showing" | "input" | "complete" | "failed";

const beacons: { id: BeaconId; name: string; icon: LucideIcon }[] = [
  { id: "sun", name: "Sun", icon: Sun }, { id: "rose", name: "Rose", icon: Circle }, { id: "mint", name: "Mint", icon: Diamond },
  { id: "violet", name: "Violet", icon: Sparkles }, { id: "ember", name: "Ember", icon: Triangle }, { id: "pearl", name: "Pearl", icon: Star },
  { id: "lime", name: "Lime", icon: Plus }, { id: "plum", name: "Plum", icon: Hexagon }, { id: "apricot", name: "Apricot", icon: Zap },
];
const rounds = [
  { pace: 760, label: "Steady", points: 8 }, { pace: 650, label: "Brisk", points: 10 }, { pace: 540, label: "Quick", points: 13 },
  { pace: 380, label: "Hard mode", points: 16 }, { pace: 300, label: "Harder", points: 22 }, { pace: 235, label: "Final burst", points: 31 },
];

function BeaconBounce({ mission, onComplete, disabled = false }: GameProps) {
  const token = getTeamToken();
  const [run, setRun] = useState<BeaconRun | null>(null);
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<Phase>("loading");
  const [activeBeacon, setActiveBeacon] = useState<BeaconId | null>(null);
  const [attempt, setAttempt] = useState<BeaconId[]>([]);
  const [earnedScore, setEarnedScore] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!token) { setRequestError("Join a team before opening this challenge."); setPhase("failed"); return; }
    beaconBounceApi.start(token).then((response) => {
      setRun(response); setRound(response.round); setEarnedScore(response.securedScore); setHintsUsed(response.hintsUsed);
      setPhase(response.failed ? "failed" : response.complete ? "complete" : "ready");
    }).catch((error) => { setRequestError(error instanceof Error ? error.message : "Beacon Bounce could not start."); setPhase("failed"); });
  }, [token]);

  const currentRound = rounds[round] ?? rounds[rounds.length - 1];
  const route = (run?.routes[round] ?? []) as BeaconId[];

  function playRoute(clearAttempt: boolean, routeToShow = route) {
    if (!run || disabled || finished) return;
    if (clearAttempt) setAttempt([]);
    setPhase("showing");
    const pulseDuration = Math.max(175, Math.round(currentRound.pace * .65));
    routeToShow.forEach((beaconId, index) => {
      window.setTimeout(() => setActiveBeacon(beaconId), index * currentRound.pace);
      window.setTimeout(() => setActiveBeacon(null), index * currentRound.pace + pulseDuration);
    });
    window.setTimeout(() => { setActiveBeacon(null); setPhase("input"); }, routeToShow.length * currentRound.pace);
  }

  function showRoute() {
    if (phase !== "ready") return;
    playRoute(true);
  }

  async function newRouteHint() {
    if (!run || !token || phase !== "input" || attempt.length || hintsUsed >= 3 || disabled || isChecking || finished) return;
    setIsChecking(true); setRequestError(null);
    try {
      const response = await beaconBounceApi.hint(token, run.runId, round);
      const routes = run.routes.map((currentRoute, index) => index === round ? response.route : currentRoute);
      setRun({ ...run, routes, securedScore: response.securedScore, hintsUsed: response.hintsUsed, hintsRemaining: response.hintsRemaining });
      setHintsUsed(response.hintsUsed); setEarnedScore(response.securedScore); setAttempt([]);
      playRoute(true, response.route as BeaconId[]);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Beacon Bounce could not create a new route.");
    } finally { setIsChecking(false); }
  }

  async function chooseBeacon(beaconId: BeaconId) {
    if (!run || phase !== "input" || disabled || isChecking || finished || !token) return;
    setIsChecking(true); setRequestError(null);
    try {
      const response = await beaconBounceApi.attempt(token, run.runId, round, beaconId);
      setEarnedScore(response.securedScore);
      if (response.failed) { setPhase("failed"); setActiveBeacon(null); return; }
      const nextAttempt = [...attempt, beaconId];
      if (!response.roundCleared) { setAttempt(nextAttempt); return; }
      if (response.complete) { setPhase("complete"); return; }
      setRound(response.nextRound); setAttempt([]); setPhase("ready");
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Beacon Bounce could not verify that beacon.");
    } finally { setIsChecking(false); }
  }

  function finish() {
    if ((phase !== "complete" && phase !== "failed") || disabled || finished) return;
    setFinished(true);
    onComplete({ score: earnedScore, completed: phase === "complete", details: { roundsCleared: phase === "complete" ? rounds.length : round, incorrectSequences: phase === "failed" ? 1 : 0, hintsUsed, serverVerified: true } });
  }

  const message = phase === "loading"
    ? { eyebrow: "Preparing team route", title: "Charging the board.", body: "Your competition route is being generated." }
    : phase === "failed"
      ? { eyebrow: `Round ${round + 1} ended the run`, title: "Route ended.", body: `${earnedScore} points are secured. Dispatch the result now—competition runs cannot be replayed.` }
      : phase === "complete"
        ? { eyebrow: "All six routes cleared", title: "Parade complete.", body: `${earnedScore} points secured. Dispatch the result to record your team score.` }
        : phase === "showing"
          ? { eyebrow: `Round ${round + 1} · ${currentRound.points} points`, title: "Watch the route.", body: "The board unlocks after the final beacon fades." }
          : phase === "input"
            ? { eyebrow: `Round ${round + 1} · ${currentRound.points} points`, title: `${attempt.length} of ${route.length} beacons repeated.`, body: hintsUsed ? `${hintsUsed} of 3 new-route hints used. Choose the next beacon.` : "Choose the next beacon. One wrong tap ends this competition run." }
            : { eyebrow: `Round ${round + 1} of ${rounds.length} · ${currentRound.points} points`, title: round === 0 ? "Your random route is ready." : "Route cleared.", body: round === 0 ? "Watch the order once, then repeat it exactly. One wrong tap ends the run." : `${earnedScore} points secured. The next random route plays faster.` };

  return <section className="game-shell beacon-bounce">
    <div className="game-briefing"><p className="eyebrow">Challenge beacon-bounce · light parade</p><h1>{mission.title}</h1><p className="lede">One server-verified run per team. Six random routes. No replay after a failure.</p></div>
    <div className="beacon-bounce-board">
      <div className="beacon-bounce-topline"><span>Round <b>{Math.min(round + 1, rounds.length)}</b> / {rounds.length}<small>{currentRound.label} · {currentRound.pace} ms</small></span><span>Secured <b>{earnedScore}</b> / {mission.maxScore} pts<small>Current round · {currentRound.points} pts</small></span></div>
      <div className="beacon-bounce-stage">
        <div className={`beacon-bounce-round-message is-${phase}`} aria-live="polite"><span>{message.eyebrow}</span><strong>{message.title}</strong><p>{message.body}</p></div>
        <div className="beacon-bounce-grid" aria-label="Beacon route board">{beacons.map((beacon) => <button key={beacon.id} type="button" className={`beacon beacon-${beacon.id} ${activeBeacon === beacon.id ? "is-lit" : ""} ${attempt.includes(beacon.id) && phase === "input" ? "is-picked" : ""}`} aria-label={`Beacon ${beacon.name}`} disabled={phase !== "input" || disabled || isChecking || finished} onClick={() => chooseBeacon(beacon.id)}><beacon.icon aria-hidden="true" strokeWidth={1.7} /><small>{beacon.name}</small></button>)}</div>
        {phase !== "failed" && phase !== "complete" && <button type="button" className="beacon-bounce-show" disabled={phase !== "ready" || disabled || finished || !run} onClick={showRoute}>{phase === "loading" ? "Loading route" : round === 0 ? "Show competition route" : "Show next route"} <span aria-hidden="true">↗</span><small>{route.length ? `${currentRound.label} · ${route.length} beacons · ${currentRound.points} points` : "Server verified"}</small></button>}
        {phase === "input" && <div className="beacon-bounce-console"><div className="beacon-bounce-help"><span>Missed the route?</span><small>{attempt.length ? "A new route can only be requested before choosing a beacon." : hintsUsed >= 3 ? "All 3 new-route hints have been used." : `${3 - hintsUsed} new-route ${3 - hintsUsed === 1 ? "hint" : "hints"} remaining. This route is replaced.`}</small><button type="button" className="beacon-bounce-hint" onClick={newRouteHint} disabled={Boolean(attempt.length) || hintsUsed >= 3 || disabled || isChecking || finished}>New route <b>−{currentRound.points * 2} pts</b></button></div></div>}
      </div>
      {requestError && <p className="code-breaker-error" role="alert">{requestError}</p>}
    </div>
    <div className="game-action-row"><span>{phase === "complete" ? "All six routes are complete. Dispatch the final score." : phase === "failed" ? `${earnedScore} secured points must be dispatched to finish this run.` : "Your run is server-verified. A failed route cannot be replayed."}</span><button className="button-primary" disabled={(phase !== "complete" && phase !== "failed") || disabled || finished} onClick={finish}>{finished ? "Result recorded" : "Dispatch result"} <span aria-hidden="true">→</span></button></div>
  </section>;
}

export const game: GameDefinition = { slug: "beacon-bounce", component: BeaconBounce };

import { useState } from "react";
import type { GameDefinition, GameProps } from "../types";

function Game({ mission, onComplete, disabled = false }: GameProps) {
  const [score, setScore] = useState(0);

  function finish() {
    onComplete({
      score: Math.min(Math.max(score, 0), mission.maxScore),
      completed: true,
      details: { source: "__GAME_SLUG__" },
    });
  }

  return (
    <section className="game-shell">
      <div className="game-briefing"><p className="eyebrow">Challenge __GAME_SLUG__ · puzzle briefing</p><h1>{mission.title}</h1><p className="lede">Replace this starter panel with the safe, authorised challenge from your game brief. Keep the score handoff below intact.</p></div>
      <div className="game-workbench">
        <div className="workbench-header"><span className="workbench-dot" /><span>Challenge workspace</span><small>Limit {mission.maxScore} pts</small></div>
        <div className="workbench-body">
          <p className="form-kicker">Safe training control</p>
          <h2>Build the challenge interaction here.</h2>
          <p>Use this surface for the quiz, mail triage, investigation, or puzzle controls that make this challenge unique.</p>
          <label>
            Development score
            <input aria-label="Development score" type="number" min="0" max={mission.maxScore} value={score} onChange={(event) => setScore(Number(event.target.value))} disabled={disabled} />
          </label>
        </div>
        <div className="workbench-footer"><span>Result ready</span><button className="button-primary" onClick={finish} disabled={disabled}>Submit result <span aria-hidden="true">→</span></button></div>
      </div>
    </section>
  );
}

export const game: GameDefinition = { slug: "__GAME_SLUG__", component: Game };

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
      <div className="game-briefing"><p className="eyebrow">Mission __GAME_SLUG__ · briefing</p><h1>{mission.title}</h1><p className="lede">Replace this starter panel with the challenge from your game brief. Keep the score handoff below intact.</p></div>
      <div className="game-workbench">
        <div className="workbench-header"><span className="workbench-dot" /><span>Game workspace</span><small>Max {mission.maxScore} pts</small></div>
        <div className="workbench-body">
          <p className="form-kicker">Development control</p>
          <h2>Build your interaction here.</h2>
          <p>Use this surface for the puzzle, scenario, timer, or response controls that make this checkpoint unique.</p>
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

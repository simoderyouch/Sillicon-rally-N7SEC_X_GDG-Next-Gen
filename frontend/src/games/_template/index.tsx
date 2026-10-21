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
    <section>
      <h1>{mission.title}</h1>
      <p>Replace this component with the game described in your assigned script.</p>
      <label>
        Development score
        <input aria-label="Development score" type="number" min="0" max={mission.maxScore} value={score} onChange={(event) => setScore(Number(event.target.value))} disabled={disabled} />
      </label>
      <button onClick={finish} disabled={disabled}>Submit result</button>
    </section>
  );
}

export const game: GameDefinition = { slug: "__GAME_SLUG__", component: Game };

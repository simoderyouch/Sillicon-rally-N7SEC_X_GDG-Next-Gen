import { useState } from "react";
import type { GameDefinition, GameProps } from "../types";

const scenario = "A message claims your account will be disabled today and asks you to sign in through an unfamiliar link.";

function IntakeGame({ mission, onComplete, disabled = false }: GameProps) {
  const [selected, setSelected] = useState<"escalate" | "trust" | null>(null);

  function submit() {
    if (!selected) return;
    onComplete({
      score: selected === "escalate" ? mission.maxScore : Math.round(mission.maxScore * 0.2),
      completed: true,
      details: { decision: selected },
    });
  }

  return (
    <section>
      <h1>{mission.title}</h1>
      <p>{scenario}</p>
      <fieldset disabled={disabled}>
        <legend>What should the response team do?</legend>
        <label><input type="radio" name="intake-choice" onChange={() => setSelected("escalate")} /> Treat it as a suspected phishing incident and verify through an official channel.</label>
        <label><input type="radio" name="intake-choice" onChange={() => setSelected("trust")} /> Trust the message because it is urgent.</label>
      </fieldset>
      <button disabled={!selected || disabled} onClick={submit}>Submit decision</button>
    </section>
  );
}

export const game: GameDefinition = { slug: "intake", component: IntakeGame };

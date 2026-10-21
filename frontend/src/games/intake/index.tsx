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
    <section className="game-shell intake-game">
      <div className="game-briefing"><p className="eyebrow">Checkpoint 01 · message triage</p><h1>{mission.title}</h1><p className="lede">Read the signal, ignore the pressure, and choose the response that protects the team.</p></div>
      <div className="case-file"><div className="case-file-bar"><span>Incoming message</span><small>Priority: urgent</small></div><blockquote>“{scenario}”</blockquote></div>
      <fieldset className="decision-fieldset" disabled={disabled}>
        <legend>Choose the team response</legend>
        <label className={`decision-option ${selected === "escalate" ? "is-selected" : ""}`}><input type="radio" name="intake-choice" onChange={() => setSelected("escalate")} /><span className="choice-key">A</span><span><strong>Verify and escalate</strong><small>Treat it as a suspected phishing incident and verify through an official channel.</small></span></label>
        <label className={`decision-option ${selected === "trust" ? "is-selected" : ""}`}><input type="radio" name="intake-choice" onChange={() => setSelected("trust")} /><span className="choice-key">B</span><span><strong>Trust the urgent request</strong><small>Follow the unfamiliar link because the message sounds urgent.</small></span></label>
      </fieldset>
      <div className="game-action-row"><span>One response · up to {mission.maxScore} pts</span><button className="button-primary" disabled={!selected || disabled} onClick={submit}>Submit decision <span aria-hidden="true">→</span></button></div>
    </section>
  );
}

export const game: GameDefinition = { slug: "intake", component: IntakeGame };

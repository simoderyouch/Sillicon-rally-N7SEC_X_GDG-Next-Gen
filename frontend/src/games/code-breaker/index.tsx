import { useState, type CSSProperties } from "react";
import type { GameDefinition, GameProps } from "../types";
import { codeBreakerApi } from "./gameApi";
import "./code-breaker.css";

type SymbolId = "comet" | "orbit" | "spark" | "leaf" | "wave" | "cube" | "moon" | "bolt";
type Phase = "building" | "between-rounds" | "complete" | "failed";
type GuessRecord = { symbols: SymbolId[]; exact: number; shifted: number; absent: number };

const symbols: { id: SymbolId; name: string; glyph: string }[] = [
  { id: "comet", name: "Comet", glyph: "✦" }, { id: "orbit", name: "Orbit", glyph: "◉" },
  { id: "spark", name: "Spark", glyph: "✳" }, { id: "leaf", name: "Leaf", glyph: "◆" },
  { id: "wave", name: "Wave", glyph: "≈" }, { id: "cube", name: "Cube", glyph: "▣" },
  { id: "moon", name: "Moon", glyph: "☾" }, { id: "bolt", name: "Bolt", glyph: "ϟ" },
];

const rounds: { slots: number; attempts: number; maxPoints: number; penalty: number; hintPenalty: number; label: string }[] = [
  { slots: 3, attempts: 6, maxPoints: 25, penalty: 2, hintPenalty: 3, label: "Opening key" },
  { slots: 4, attempts: 5, maxPoints: 32, penalty: 3, hintPenalty: 4, label: "Crossing wires" },
  { slots: 5, attempts: 4, maxPoints: 43, penalty: 5, hintPenalty: 5, label: "Master sequence" },
];

function symbolFor(id: string) { return symbols.find((symbol) => symbol.id === id); }

function CodeBreaker({ mission, onComplete, disabled = false }: GameProps) {
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<Phase>("building");
  const [draft, setDraft] = useState<SymbolId[]>([]);
  const [history, setHistory] = useState<GuessRecord[]>([]);
  const [earnedScore, setEarnedScore] = useState(0);
  const [totalGuesses, setTotalGuesses] = useState(0);
  const [hint, setHint] = useState<{ position: number; symbol: SymbolId } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const currentRound = rounds[round];
  const triesLeft = currentRound.attempts - history.length;
  const token = sessionStorage.getItem("teamToken");

  function addSymbol(symbol: SymbolId) {
    if (phase !== "building" || disabled || isChecking || finished || draft.length >= currentRound.slots) return;
    setDraft((value) => [...value, symbol]);
  }

  function removeSymbol() {
    if (phase !== "building" || disabled || isChecking || finished) return;
    setDraft((value) => value.slice(0, -1));
  }

  function resetDraft() {
    if (phase !== "building" || disabled || isChecking || finished) return;
    setDraft([]);
  }

  async function checkGuess() {
    if (phase !== "building" || disabled || isChecking || finished || draft.length !== currentRound.slots) return;
    if (!token) { setRequestError("Join a team before opening this challenge."); return; }
    setIsChecking(true);
    setRequestError(null);
    try {
      const feedback = await codeBreakerApi.check(token, round, draft);
      const nextHistory = [...history, { symbols: draft, exact: feedback.exact, shifted: feedback.shifted, absent: feedback.absent }];
      setHistory(nextHistory);
      setTotalGuesses((value) => value + 1);
      setDraft([]);

      if (feedback.correct) {
        const roundScore = Math.max(1, currentRound.maxPoints - (history.length * currentRound.penalty) - (hint ? currentRound.hintPenalty : 0));
        setEarnedScore((value) => value + roundScore);
        setPhase(round === rounds.length - 1 ? "complete" : "between-rounds");
      } else if (nextHistory.length === currentRound.attempts) {
        setPhase("failed");
      }
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Code Breaker could not verify that sequence.");
    } finally {
      setIsChecking(false);
    }
  }

  async function revealHint() {
    if (phase !== "building" || hint || disabled || isChecking || finished) return;
    if (!token) { setRequestError("Join a team before opening this challenge."); return; }
    setIsChecking(true);
    setRequestError(null);
    try {
      const position = Math.min(history.length, currentRound.slots - 1);
      const result = await codeBreakerApi.hint(token, round, position);
      if (symbolFor(result.symbol)) setHint({ position: result.position, symbol: result.symbol as SymbolId });
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Code Breaker could not reveal a hint.");
    } finally {
      setIsChecking(false);
    }
  }

  function nextRound() {
    if (phase !== "between-rounds" || disabled || isChecking || finished) return;
    setRound((value) => value + 1);
    setHistory([]);
    setDraft([]);
    setHint(null);
    setRequestError(null);
    setPhase("building");
  }

  function restart() {
    if (disabled || isChecking || finished) return;
    setRound(0);
    setPhase("building");
    setDraft([]);
    setHistory([]);
    setEarnedScore(0);
    setTotalGuesses(0);
    setHint(null);
    setRequestError(null);
  }

  function finish() {
    if (phase !== "complete" || disabled || finished) return;
    setFinished(true);
    onComplete({ score: Math.min(earnedScore, mission.maxScore), completed: true, details: { roundsCleared: rounds.length, guesses: totalGuesses, teamSpecificCodes: true } });
  }

  const message = phase === "failed"
    ? { kicker: `Round ${round + 1} · code unsolved`, title: "Run over.", body: "No attempts remain. This run is not submitted—start again from the first code." }
    : phase === "complete"
      ? { kicker: "All three codes solved", title: "Sequence cracked.", body: `${earnedScore} points secured. Dispatch the result to record your team score.` }
      : phase === "between-rounds"
        ? { kicker: `Round ${round + 1} cleared`, title: "Code accepted.", body: `${earnedScore} points secured. The next team-specific code has fewer chances to test.` }
        : { kicker: `Round ${round + 1} of ${rounds.length} · ${currentRound.maxPoints} points maximum`, title: history.length ? "Read the feedback. Refine the sequence." : "Your team code is ready.", body: `${triesLeft} ${triesLeft === 1 ? "attempt" : "attempts"} remain. Exact means the right symbol in the right slot.` };

  return (
    <section className="game-shell code-breaker">
      <div className="game-briefing"><p className="eyebrow">Challenge code-breaker · deduction console</p><h1>{mission.title}</h1><p className="lede">Each team receives its own hidden codes. Place a sequence, inspect the clues, and crack all three before attempts run out.</p></div>
      <div className="code-breaker-board">
        <div className="code-breaker-topline"><span>Round <b>{Math.min(round + 1, rounds.length)}</b> / {rounds.length}<small>{currentRound.label} · {currentRound.slots} slots</small></span><span>Secured <b>{earnedScore}</b> / {mission.maxScore} pts<small>{currentRound.maxPoints} pts maximum this round</small></span></div>
        <div className={`code-breaker-message is-${phase}`} aria-live="polite"><span>{message.kicker}</span><strong>{message.title}</strong><p>{message.body}</p></div>
        {phase === "building" && <>
          <div className="code-breaker-workspace">
            <div className="code-breaker-draft" aria-label="Current sequence" style={{ "--slot-count": currentRound.slots } as CSSProperties}>
              {Array.from({ length: currentRound.slots }, (_, index) => {
                const symbol = draft[index];
                return <div className={`code-slot ${symbol ? "is-filled" : ""}`} key={index}><small>0{index + 1}</small><span aria-label={symbol ? symbolFor(symbol)?.name : "Empty slot"}>{symbol ? symbolFor(symbol)?.glyph : "·"}</span></div>;
              })}
            </div>
            <div className="code-breaker-controls"><button type="button" className="code-control" onClick={removeSymbol} disabled={!draft.length || disabled || isChecking || finished}>Undo</button><button type="button" className="code-control" onClick={resetDraft} disabled={!draft.length || disabled || isChecking || finished}>Clear</button><button type="button" className="code-check" onClick={checkGuess} disabled={draft.length !== currentRound.slots || disabled || isChecking || finished}>{isChecking ? "Checking…" : "Check sequence"} <span aria-hidden="true">→</span></button></div>
          </div>
          <div className="code-breaker-palette" aria-label="Available symbols">{symbols.map((symbol) => <button key={symbol.id} type="button" className={`code-symbol code-symbol-${symbol.id}`} onClick={() => addSymbol(symbol.id)} disabled={draft.length >= currentRound.slots || disabled || isChecking || finished} aria-label={`Add ${symbol.name}`}><span aria-hidden="true">{symbol.glyph}</span><small>{symbol.name}</small></button>)}</div>
          <div className="code-breaker-hint"><div><span>Need a hand?</span><small>{hint ? `Position ${hint.position + 1} is ${symbolFor(hint.symbol)?.name}.` : "Reveal one position in your team code."}</small></div><button type="button" onClick={revealHint} disabled={Boolean(hint) || disabled || isChecking || finished}>Reveal position <b>−{currentRound.hintPenalty} pts</b></button></div>
        </>}
        {requestError && <p className="code-breaker-error" role="alert">{requestError}</p>}
        {history.length > 0 && <div className="code-breaker-history"><div className="history-heading"><span>Attempt log</span><small>Exact = right symbol, right slot · Shifted = right symbol, different slot</small></div>{history.map((guess, index) => <div className="guess-row" key={`${round}-${index}`}><span className="guess-number">{String(index + 1).padStart(2, "0")}</span><div className="guess-symbols">{guess.symbols.map((symbol, position) => <span className={`guess-token code-symbol-${symbol}`} key={`${symbol}-${position}`} aria-label={symbolFor(symbol)?.name}>{symbolFor(symbol)?.glyph}</span>)}</div><div className="guess-feedback"><span className="feedback-exact">{guess.exact} exact</span><span className="feedback-shifted">{guess.shifted} shifted</span><span className="feedback-absent">{guess.absent} absent</span></div></div>)}</div>}
        {phase === "between-rounds" && <button type="button" className="code-breaker-next" onClick={nextRound} disabled={disabled || isChecking || finished}>Open round {round + 2} <span aria-hidden="true">→</span></button>}
        {phase === "failed" && <button type="button" className="code-breaker-next" onClick={restart} disabled={disabled || isChecking || finished}>Start a new run <span aria-hidden="true">↺</span></button>}
      </div>
      <div className="game-action-row"><span>{phase === "complete" ? "All three team codes are ready to record." : phase === "failed" ? "This run has ended. Begin again to crack the full sequence." : "Clear all three codes to unlock dispatch."}</span><button className="button-primary" onClick={finish} disabled={phase !== "complete" || disabled || finished}>{finished ? "Result recorded" : "Dispatch result"} <span aria-hidden="true">→</span></button></div>
    </section>
  );
}

export const game: GameDefinition = { slug: "code-breaker", component: CodeBreaker };

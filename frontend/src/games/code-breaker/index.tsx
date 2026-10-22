import { useState, type CSSProperties } from "react";
import type { GameDefinition, GameProps } from "../types";
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

const rounds: { secret: SymbolId[]; attempts: number; maxPoints: number; penalty: number; hintPenalty: number; label: string }[] = [
  { secret: ["comet", "orbit", "spark"], attempts: 6, maxPoints: 25, penalty: 2, hintPenalty: 3, label: "Opening key" },
  { secret: ["spark", "moon", "orbit", "cube"], attempts: 5, maxPoints: 32, penalty: 3, hintPenalty: 4, label: "Crossing wires" },
  { secret: ["moon", "bolt", "moon", "leaf", "orbit"], attempts: 4, maxPoints: 43, penalty: 5, hintPenalty: 5, label: "Master sequence" },
];

function symbolFor(id: SymbolId) { return symbols.find((symbol) => symbol.id === id)!; }

function evaluateGuess(guess: SymbolId[], secret: SymbolId[]): Omit<GuessRecord, "symbols"> {
  let exact = 0;
  const remainingGuess: SymbolId[] = [];
  const remainingSecret: SymbolId[] = [];

  guess.forEach((symbol, index) => {
    if (symbol === secret[index]) exact += 1;
    else {
      remainingGuess.push(symbol);
      remainingSecret.push(secret[index]);
    }
  });

  let shifted = 0;
  remainingGuess.forEach((symbol) => {
    const index = remainingSecret.indexOf(symbol);
    if (index >= 0) {
      shifted += 1;
      remainingSecret.splice(index, 1);
    }
  });

  return { exact, shifted, absent: guess.length - exact - shifted };
}

function CodeBreaker({ mission, onComplete, disabled = false }: GameProps) {
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<Phase>("building");
  const [draft, setDraft] = useState<SymbolId[]>([]);
  const [history, setHistory] = useState<GuessRecord[]>([]);
  const [earnedScore, setEarnedScore] = useState(0);
  const [totalGuesses, setTotalGuesses] = useState(0);
  const [hintRevealed, setHintRevealed] = useState(false);
  const [finished, setFinished] = useState(false);

  const currentRound = rounds[round];
  const triesLeft = currentRound.attempts - history.length;
  const revealedIndex = Math.min(history.length, currentRound.secret.length - 1);

  function addSymbol(symbol: SymbolId) {
    if (phase !== "building" || disabled || finished || draft.length >= currentRound.secret.length) return;
    setDraft((value) => [...value, symbol]);
  }

  function removeSymbol() {
    if (phase !== "building" || disabled || finished) return;
    setDraft((value) => value.slice(0, -1));
  }

  function resetDraft() {
    if (phase !== "building" || disabled || finished) return;
    setDraft([]);
  }

  function checkGuess() {
    if (phase !== "building" || disabled || finished || draft.length !== currentRound.secret.length) return;
    const feedback = evaluateGuess(draft, currentRound.secret);
    const nextHistory = [...history, { symbols: draft, ...feedback }];
    setHistory(nextHistory);
    setTotalGuesses((value) => value + 1);
    setDraft([]);

    if (feedback.exact === currentRound.secret.length) {
      const roundScore = Math.max(1, currentRound.maxPoints - (history.length * currentRound.penalty) - (hintRevealed ? currentRound.hintPenalty : 0));
      setEarnedScore((value) => value + roundScore);
      setPhase(round === rounds.length - 1 ? "complete" : "between-rounds");
      return;
    }

    if (nextHistory.length === currentRound.attempts) setPhase("failed");
  }

  function revealHint() {
    if (phase !== "building" || hintRevealed || disabled || finished) return;
    setHintRevealed(true);
  }

  function nextRound() {
    if (phase !== "between-rounds" || disabled || finished) return;
    setRound((value) => value + 1);
    setHistory([]);
    setDraft([]);
    setHintRevealed(false);
    setPhase("building");
  }

  function restart() {
    if (disabled || finished) return;
    setRound(0);
    setPhase("building");
    setDraft([]);
    setHistory([]);
    setEarnedScore(0);
    setTotalGuesses(0);
    setHintRevealed(false);
  }

  function finish() {
    if (phase !== "complete" || disabled || finished) return;
    setFinished(true);
    onComplete({ score: Math.min(earnedScore, mission.maxScore), completed: true, details: { roundsCleared: rounds.length, guesses: totalGuesses } });
  }

  const message = phase === "failed"
    ? { kicker: `Round ${round + 1} · code unsolved`, title: "Run over.", body: "No attempts remain. This run is not submitted—start again from the first code." }
    : phase === "complete"
      ? { kicker: "All three codes solved", title: "Sequence cracked.", body: `${earnedScore} points secured. Dispatch the result to record your team score.` }
      : phase === "between-rounds"
        ? { kicker: `Round ${round + 1} cleared`, title: "Code accepted.", body: `${earnedScore} points secured. The next code has fewer chances to test.` }
        : { kicker: `Round ${round + 1} of ${rounds.length} · ${currentRound.maxPoints} points maximum`, title: history.length ? "Read the feedback. Refine the sequence." : "Build the hidden sequence.", body: `${triesLeft} ${triesLeft === 1 ? "attempt" : "attempts"} remain. Exact means the right symbol in the right slot.` };

  return (
    <section className="game-shell code-breaker">
      <div className="game-briefing"><p className="eyebrow">Challenge code-breaker · deduction console</p><h1>{mission.title}</h1><p className="lede">Place a sequence, inspect the clues, and crack every hidden code before attempts run out.</p></div>
      <div className="code-breaker-board">
        <div className="code-breaker-topline"><span>Round <b>{Math.min(round + 1, rounds.length)}</b> / {rounds.length}<small>{currentRound.label} · {currentRound.secret.length} slots</small></span><span>Secured <b>{earnedScore}</b> / {mission.maxScore} pts<small>{currentRound.maxPoints} pts maximum this round</small></span></div>
        <div className={`code-breaker-message is-${phase}`} aria-live="polite"><span>{message.kicker}</span><strong>{message.title}</strong><p>{message.body}</p></div>
        {phase === "building" && <>
          <div className="code-breaker-workspace">
            <div className="code-breaker-draft" aria-label="Current sequence" style={{ "--slot-count": currentRound.secret.length } as CSSProperties}>
              {Array.from({ length: currentRound.secret.length }, (_, index) => {
                const symbol = draft[index];
                return <div className={`code-slot ${symbol ? "is-filled" : ""}`} key={index}><small>0{index + 1}</small><span aria-label={symbol ? symbolFor(symbol).name : "Empty slot"}>{symbol ? symbolFor(symbol).glyph : "·"}</span></div>;
              })}
            </div>
            <div className="code-breaker-controls"><button type="button" className="code-control" onClick={removeSymbol} disabled={!draft.length || disabled || finished}>Undo</button><button type="button" className="code-control" onClick={resetDraft} disabled={!draft.length || disabled || finished}>Clear</button><button type="button" className="code-check" onClick={checkGuess} disabled={draft.length !== currentRound.secret.length || disabled || finished}>Check sequence <span aria-hidden="true">→</span></button></div>
          </div>
          <div className="code-breaker-palette" aria-label="Available symbols">{symbols.map((symbol) => <button key={symbol.id} type="button" className={`code-symbol code-symbol-${symbol.id}`} onClick={() => addSymbol(symbol.id)} disabled={draft.length >= currentRound.secret.length || disabled || finished} aria-label={`Add ${symbol.name}`}><span aria-hidden="true">{symbol.glyph}</span><small>{symbol.name}</small></button>)}</div>
          <div className="code-breaker-hint"><div><span>Need a hand?</span><small>{hintRevealed ? `Position ${revealedIndex + 1} is ${symbolFor(currentRound.secret[revealedIndex]).name}.` : "Reveal one position in this code."}</small></div><button type="button" onClick={revealHint} disabled={hintRevealed || disabled || finished}>Reveal position <b>−{currentRound.hintPenalty} pts</b></button></div>
        </>}
        {history.length > 0 && <div className="code-breaker-history"><div className="history-heading"><span>Attempt log</span><small>Exact = right symbol, right slot · Shifted = right symbol, different slot</small></div>{history.map((guess, index) => <div className="guess-row" key={`${round}-${index}`}><span className="guess-number">{String(index + 1).padStart(2, "0")}</span><div className="guess-symbols">{guess.symbols.map((symbol, position) => <span className={`guess-token code-symbol-${symbol}`} key={`${symbol}-${position}`} aria-label={symbolFor(symbol).name}>{symbolFor(symbol).glyph}</span>)}</div><div className="guess-feedback"><span className="feedback-exact">{guess.exact} exact</span><span className="feedback-shifted">{guess.shifted} shifted</span><span className="feedback-absent">{guess.absent} absent</span></div></div>)}</div>}
        {phase === "between-rounds" && <button type="button" className="code-breaker-next" onClick={nextRound} disabled={disabled || finished}>Open round {round + 2} <span aria-hidden="true">→</span></button>}
        {phase === "failed" && <button type="button" className="code-breaker-next" onClick={restart} disabled={disabled || finished}>Start a new run <span aria-hidden="true">↺</span></button>}
      </div>
      <div className="game-action-row"><span>{phase === "complete" ? "All three codes are ready to record." : phase === "failed" ? "This run has ended. Begin again to crack the full sequence." : "Clear all three codes to unlock dispatch."}</span><button className="button-primary" onClick={finish} disabled={phase !== "complete" || disabled || finished}>{finished ? "Result recorded" : "Dispatch result"} <span aria-hidden="true">→</span></button></div>
    </section>
  );
}

export const game: GameDefinition = { slug: "code-breaker", component: CodeBreaker };

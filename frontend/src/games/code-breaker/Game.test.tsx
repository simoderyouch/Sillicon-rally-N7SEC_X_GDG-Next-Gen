import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { game } from "./index";

const mission = { id: "game-id", slug: "code-breaker", title: "Code Breaker", description: "", maxScore: 100, releaseState: "PUBLISHED" as const };

function enter(...symbols: string[]) {
  symbols.forEach((symbol) => fireEvent.click(screen.getByRole("button", { name: `Add ${symbol}` })));
  fireEvent.click(screen.getByRole("button", { name: /check sequence/i }));
}

function nextRound() { fireEvent.click(screen.getByRole("button", { name: /open round/i })); }

afterEach(cleanup);

describe("code-breaker game", () => {
  it("reports the full score for cracking all three codes on the first attempt", () => {
    const onComplete = vi.fn();
    const Component = game.component;
    render(<Component mission={mission} onComplete={onComplete} />);

    enter("Comet", "Orbit", "Spark"); nextRound();
    enter("Spark", "Moon", "Orbit", "Cube"); nextRound();
    enter("Moon", "Bolt", "Moon", "Leaf", "Orbit");
    fireEvent.click(screen.getByRole("button", { name: /dispatch result/i }));

    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ score: 100, completed: true, details: expect.objectContaining({ roundsCleared: 3, guesses: 3 }) }));
  });

  it("shows exact, shifted, and absent feedback for a guess", () => {
    const Component = game.component;
    render(<Component mission={mission} onComplete={vi.fn()} />);

    enter("Comet", "Spark", "Leaf");

    expect(screen.getByText("1 exact")).toBeInTheDocument();
    expect(screen.getByText("1 shifted")).toBeInTheDocument();
    expect(screen.getByText("1 absent")).toBeInTheDocument();
  });

  it("ends the run after the final failed attempt without submitting a score", () => {
    const onComplete = vi.fn();
    const Component = game.component;
    render(<Component mission={mission} onComplete={onComplete} />);

    for (let attempt = 0; attempt < 6; attempt += 1) enter("Leaf", "Leaf", "Leaf");

    expect(screen.getByText("Run over.")).toBeInTheDocument();
    expect(screen.getByText(/not submitted/i)).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
  });
});

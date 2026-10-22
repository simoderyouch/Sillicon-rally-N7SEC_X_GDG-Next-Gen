import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { game } from "./index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mission = { id: "game-id", slug: "beacon-bounce", title: "Beacon Bounce", description: "", maxScore: 100, releaseState: "PUBLISHED" as const };

function revealRoute() {
  fireEvent.click(screen.getByRole("button", { name: /(show the route|start next route)/i }));
  act(() => vi.runAllTimers());
}

function tap(...beacons: string[]) {
  beacons.forEach((beacon) => fireEvent.click(screen.getByRole("button", { name: `Beacon ${beacon}` })));
}

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("beacon-bounce game", () => {
  it("awards full points for replaying all three routes without hints", () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    const Component = game.component;
    render(<Component mission={mission} onComplete={onComplete} />);
    revealRoute(); tap("Sun", "Rose", "Mint");
    revealRoute(); tap("Violet", "Ember", "Lime", "Pearl");
    revealRoute(); tap("Mint", "Rose", "Plum", "Ember", "Apricot");
    fireEvent.click(screen.getByRole("button", { name: /dispatch result/i }));
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ score: 100, completed: true, details: expect.objectContaining({ hintsUsed: 0, incorrectSequences: 0 }) }));
  });

  it("deducts score when a hint is used", () => {
    const Component = game.component;
    render(<Component mission={mission} onComplete={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /reveal hint 1/i }));
    expect(screen.getByText(/the route will play again/i)).toBeInTheDocument();
    expect(screen.getByText(/projected score/i).parentElement).toHaveTextContent("90 pts");
  });
});

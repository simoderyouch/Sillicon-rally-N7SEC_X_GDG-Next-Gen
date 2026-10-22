import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { game } from "./index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mission = { id: "game-id", slug: "beacon-bounce", title: "Beacon Bounce", description: "", maxScore: 100, releaseState: "PUBLISHED" as const };

function revealRoute() {
  fireEvent.click(screen.getByRole("button", { name: /(show the first route|show next route)/i }));
  act(() => vi.runAllTimers());
}

function tap(...beacons: string[]) {
  beacons.forEach((beacon) => fireEvent.click(screen.getByRole("button", { name: `Beacon ${beacon}` })));
}

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("beacon-bounce game", () => {
  it("awards all 100 points for clearing six routes without hints", () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    const Component = game.component;
    render(<Component mission={mission} onComplete={onComplete} />);
    revealRoute(); tap("Sun", "Rose", "Mint");
    revealRoute(); tap("Violet", "Ember", "Lime");
    revealRoute(); tap("Pearl", "Sun", "Plum", "Rose");
    revealRoute(); tap("Mint", "Violet", "Apricot", "Ember", "Sun", "Plum");
    revealRoute(); tap("Lime", "Pearl", "Rose", "Plum", "Sun", "Mint", "Violet");
    revealRoute(); tap("Apricot", "Mint", "Ember", "Violet", "Lime", "Pearl", "Sun", "Plum", "Rose");
    fireEvent.click(screen.getByRole("button", { name: /dispatch result/i }));
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ score: 100, completed: true, details: expect.objectContaining({ roundsCleared: 6, hintsUsed: 0, incorrectSequences: 0 }) }));
  });

  it("requires dispatching banked points after a wrong beacon", () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    const Component = game.component;
    render(<Component mission={mission} onComplete={onComplete} />);
    revealRoute(); tap("Sun", "Rose", "Mint");
    revealRoute(); tap("Sun");
    expect(screen.getByText("Route ended.")).toBeInTheDocument();
    expect(screen.getByText(/8 points are secured/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /dispatch result/i }));
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ score: 8, completed: false, details: expect.objectContaining({ roundsCleared: 1, incorrectSequences: 1 }) }));
  });
});

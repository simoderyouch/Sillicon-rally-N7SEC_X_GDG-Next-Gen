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

  it("ends the run immediately after a wrong beacon without submitting a score", () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    const Component = game.component;
    render(<Component mission={mission} onComplete={onComplete} />);
    revealRoute();
    tap("Rose");
    expect(screen.getByText("Run over.")).toBeInTheDocument();
    expect(screen.getByText(/no points were submitted/i)).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /start again/i }));
    expect(screen.getByText("Ready for the first route.")).toBeInTheDocument();
  });
});

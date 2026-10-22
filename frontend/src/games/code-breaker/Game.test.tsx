import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { game } from "./index";

const mission = { id: "game-id", slug: "code-breaker", title: "Code Breaker", description: "", maxScore: 100, releaseState: "PUBLISHED" as const };
const response = (body: unknown) => Promise.resolve({ ok: true, json: () => Promise.resolve(body) } as Response);

function enter(...symbols: string[]) {
  symbols.forEach((symbol) => fireEvent.click(screen.getByRole("button", { name: `Add ${symbol}` })));
  fireEvent.click(screen.getByRole("button", { name: /check sequence/i }));
}

async function nextRound() {
  await waitFor(() => expect(screen.getByRole("button", { name: /open round/i })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: /open round/i }));
}

beforeEach(() => { sessionStorage.setItem("teamToken", "team-token"); });
afterEach(() => { cleanup(); sessionStorage.clear(); vi.unstubAllGlobals(); });

describe("code-breaker game", () => {
  it("reports the full score for cracking all three team codes on the first attempt", async () => {
    const fetchMock = vi.fn()
      .mockReturnValueOnce(response({ exact: 3, shifted: 0, absent: 0, correct: true }))
      .mockReturnValueOnce(response({ exact: 4, shifted: 0, absent: 0, correct: true }))
      .mockReturnValueOnce(response({ exact: 5, shifted: 0, absent: 0, correct: true }));
    vi.stubGlobal("fetch", fetchMock);
    const onComplete = vi.fn();
    const Component = game.component;
    render(<Component mission={mission} onComplete={onComplete} />);

    enter("Comet", "Orbit", "Spark"); await nextRound();
    enter("Spark", "Moon", "Orbit", "Cube"); await nextRound();
    enter("Moon", "Bolt", "Moon", "Leaf", "Orbit");
    await waitFor(() => expect(screen.getByText("Sequence cracked.")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /dispatch result/i }));

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ score: 100, completed: true, details: expect.objectContaining({ roundsCleared: 3, guesses: 3, teamSpecificCodes: true }) }));
  });

  it("shows exact, shifted, and absent feedback from the team puzzle endpoint", async () => {
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(response({ exact: 1, shifted: 1, absent: 1, correct: false })));
    const Component = game.component;
    render(<Component mission={mission} onComplete={vi.fn()} />);

    enter("Comet", "Spark", "Leaf");
    await waitFor(() => expect(screen.getByText("1 exact")).toBeInTheDocument());
    expect(screen.getByText("1 shifted")).toBeInTheDocument();
    expect(screen.getByText("1 absent")).toBeInTheDocument();
  });

  it("shows a team-specific hint returned by the endpoint", async () => {
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(response({ position: 0, symbol: "orbit" })));
    const Component = game.component;
    render(<Component mission={mission} onComplete={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /reveal position/i }));
    await waitFor(() => expect(screen.getByText("Position 1 is Orbit.")).toBeInTheDocument());
  });

  it("continues after failed rounds and requires dispatch after round three", async () => {
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(response({ exact: 0, shifted: 0, absent: 3, correct: false })));
    const onComplete = vi.fn();
    const Component = game.component;
    render(<Component mission={mission} onComplete={onComplete} />);

    for (let attempt = 0; attempt < 6; attempt += 1) {
      enter("Leaf", "Leaf", "Leaf");
      await waitFor(() => expect(screen.getAllByText("0 exact")).toHaveLength(attempt + 1));
    }
    await nextRound();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      enter("Leaf", "Leaf", "Leaf", "Leaf");
      await waitFor(() => expect(screen.getAllByText("0 exact")).toHaveLength(attempt + 1));
    }
    await waitFor(() => expect(screen.getByRole("button", { name: /open round 3/i })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: /open round 3/i }));
    for (let attempt = 0; attempt < 4; attempt += 1) {
      enter("Leaf", "Leaf", "Leaf", "Leaf", "Leaf");
      await waitFor(() => expect(screen.getAllByText("0 exact")).toHaveLength(attempt + 1));
    }
    await waitFor(() => expect(screen.getByText("Run complete.")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /dispatch result/i }));
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ score: 0, completed: true, details: expect.objectContaining({ roundsCleared: 0, guesses: 15 }) }));
  });
});

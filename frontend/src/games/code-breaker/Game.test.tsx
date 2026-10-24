import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { game } from "./index";

const mission = { id: "game-id", slug: "code-breaker", title: "Code Breaker", description: "", maxScore: 100, releaseState: "PUBLISHED" as const };
const response = (body: unknown) => Promise.resolve({ ok: true, json: () => Promise.resolve(body) } as Response);
const startRun = { round: 0, securedScore: 0, roundsCleared: 0, complete: false, attemptsRemaining: 7 };

function enter(...symbols: string[]) {
  symbols.forEach((symbol) => fireEvent.click(screen.getByRole("button", { name: `Add ${symbol}` })));
  fireEvent.click(screen.getByRole("button", { name: /check sequence/i }));
}

async function ready() { await waitFor(() => expect(screen.getByRole("button", { name: "Add Comet" })).toBeEnabled()); }
async function nextRound() {
  await waitFor(() => expect(screen.getByRole("button", { name: /open round/i })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: /open round/i }));
  await ready();
}

beforeEach(() => { sessionStorage.setItem("teamToken", "team-token"); });
afterEach(() => { cleanup(); sessionStorage.clear(); vi.unstubAllGlobals(); });

describe("code-breaker game", () => {
  it("reports the server-verified full score after cracking all three fixed codes", async () => {
    const fetchMock = vi.fn()
      .mockReturnValueOnce(response(startRun))
      .mockReturnValueOnce(response({ exact: 3, shifted: 0, absent: 0, correct: true, roundCleared: true, roundFailed: false, complete: false, securedScore: 20, roundsCleared: 1, nextRound: 1, attemptsRemaining: 6 }))
      .mockReturnValueOnce(response({ exact: 3, shifted: 0, absent: 0, correct: true, roundCleared: true, roundFailed: false, complete: false, securedScore: 50, roundsCleared: 2, nextRound: 2, attemptsRemaining: 4 }))
      .mockReturnValueOnce(response({ exact: 5, shifted: 0, absent: 0, correct: true, roundCleared: true, roundFailed: false, complete: true, securedScore: 100, roundsCleared: 3, nextRound: 2, attemptsRemaining: 0 }));
    vi.stubGlobal("fetch", fetchMock);
    const onComplete = vi.fn();
    const Component = game.component;
    render(<Component mission={mission} onComplete={onComplete} />);

    await ready();
    enter("Moon", "Comet", "Cube"); await nextRound();
    enter("Bolt", "Spark", "Cube"); await nextRound();
    enter("Orbit", "Bolt", "Wave", "Comet", "Moon");
    await waitFor(() => expect(screen.getByText("Sequence cracked.")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /dispatch result/i }));

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ score: 100, completed: true, details: expect.objectContaining({ roundsCleared: 3, guesses: 3, fixedCodes: true, serverVerified: true }) }));
  });

  it("shows exact, shifted, and absent feedback from the team puzzle endpoint", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockReturnValueOnce(response(startRun))
      .mockReturnValueOnce(response({ exact: 1, shifted: 1, absent: 1, correct: false, roundCleared: false, roundFailed: false, complete: false, securedScore: 0, roundsCleared: 0, nextRound: 0, attemptsRemaining: 6 })));
    const Component = game.component;
    render(<Component mission={mission} onComplete={vi.fn()} />);

    await ready();
    enter("Comet", "Spark", "Leaf");
    await waitFor(() => expect(screen.getByText("1 exact")).toBeInTheDocument());
    expect(screen.getByText("1 shifted")).toBeInTheDocument();
    expect(screen.getByText("1 absent")).toBeInTheDocument();
  });

  it("shows a server-provided hint returned by the endpoint", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockReturnValueOnce(response(startRun))
      .mockReturnValueOnce(response({ position: 0, symbol: "orbit" })));
    const Component = game.component;
    render(<Component mission={mission} onComplete={vi.fn()} />);

    await ready();
    fireEvent.click(screen.getByRole("button", { name: /reveal position/i }));
    await waitFor(() => expect(screen.getByText("Position 1 is Orbit.")).toBeInTheDocument());
  });

  it("advances after missed rounds and only enables final dispatch after round three", async () => {
    const attemptsByRound = [0, 0, 0];
    vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string, options?: RequestInit) => {
      if (url.endsWith("/runs")) return response(startRun);
      const round = JSON.parse(String(options?.body)).round as number;
      attemptsByRound[round] += 1;
      const maximum = [7, 6, 4][round];
      const roundFailed = attemptsByRound[round] === maximum;
      const complete = round === 2 && roundFailed;
      return response({ exact: 0, shifted: 0, absent: round + 3, correct: false, roundCleared: false, roundFailed, complete, securedScore: 0, roundsCleared: 0, nextRound: roundFailed && !complete ? round + 1 : round, attemptsRemaining: roundFailed ? (complete ? 0 : [6, 4][round]) : maximum - attemptsByRound[round] });
    }));
    const onComplete = vi.fn();
    const Component = game.component;
    render(<Component mission={mission} onComplete={onComplete} />);

    await ready();
    for (let attempt = 0; attempt < 7; attempt += 1) {
      enter("Leaf", "Leaf", "Leaf");
      await waitFor(() => expect(screen.getAllByText("0 exact")).toHaveLength(attempt + 1));
    }
    await nextRound();
    for (let attempt = 0; attempt < 6; attempt += 1) {
      enter("Leaf", "Leaf", "Leaf");
      await waitFor(() => expect(screen.getAllByText("0 exact")).toHaveLength(attempt + 1));
    }
    await nextRound();
    for (let attempt = 0; attempt < 4; attempt += 1) {
      enter("Leaf", "Leaf", "Leaf", "Leaf", "Leaf");
      await waitFor(() => expect(screen.getAllByText("0 exact")).toHaveLength(attempt + 1));
    }
    await waitFor(() => expect(screen.getByText("Run complete.")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /dispatch result/i }));
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ score: 0, completed: true, details: expect.objectContaining({ roundsCleared: 0, guesses: 17, serverVerified: true }) }));
  });
});

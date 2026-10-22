import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { game } from "./index";

const mission = { id: "game-id", slug: "beacon-bounce", title: "Beacon Bounce", description: "", maxScore: 100, releaseState: "PUBLISHED" as const };
const routes = [["sun", "rose", "mint"], ["violet", "ember", "lime"], ["pearl", "sun", "plum", "rose"], ["mint", "violet", "apricot", "ember", "sun", "plum"], ["lime", "pearl", "rose", "plum", "sun", "mint", "violet"], ["apricot", "mint", "ember", "violet", "lime", "pearl", "sun", "plum", "rose"]];
const response = (body: unknown) => Promise.resolve({ ok: true, json: () => Promise.resolve(body) } as Response);

async function showRoute() {
  fireEvent.click(screen.getByRole("button", { name: /(show competition route|show next route)/i }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Beacon Sun" })).toBeEnabled(), { timeout: 4_000 });
}

beforeEach(() => { sessionStorage.setItem("teamToken", "team-token"); });
afterEach(() => { cleanup(); sessionStorage.clear(); vi.unstubAllGlobals(); });

describe("beacon-bounce game", () => {
  it("uses a server-created route and verifies each beacon through the private endpoint", async () => {
    const fetchMock = vi.fn()
      .mockReturnValueOnce(response({ runId: "run-1", routes, round: 0, securedScore: 0, failed: false, complete: false }))
      .mockReturnValueOnce(response({ correct: true, roundCleared: false, failed: false, complete: false, securedScore: 0, nextRound: 0 }));
    vi.stubGlobal("fetch", fetchMock);
    const Component = game.component;
    render(<Component mission={mission} onComplete={vi.fn()} />);

    await waitFor(() => expect(screen.getByRole("button", { name: /show competition route/i })).toBeEnabled());
    await showRoute();
    fireEvent.click(screen.getByRole("button", { name: "Beacon Sun" }));
    await waitFor(() => expect(screen.getByText("1 of 3 beacons repeated.")).toBeInTheDocument());
    expect(fetchMock).toHaveBeenLastCalledWith("http://localhost:8080/api/v1/games/beacon-bounce/attempt", expect.objectContaining({ method: "POST", body: JSON.stringify({ runId: "run-1", round: 0, beacon: "sun" }) }));
  });

  it("does not offer a replay after failure and requires dispatching the verified score", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockReturnValueOnce(response({ runId: "run-2", routes, round: 1, securedScore: 8, failed: false, complete: false }))
      .mockReturnValueOnce(response({ correct: false, roundCleared: false, failed: true, complete: false, securedScore: 8, nextRound: 1 })));
    const onComplete = vi.fn();
    const Component = game.component;
    render(<Component mission={mission} onComplete={onComplete} />);

    await waitFor(() => expect(screen.getByRole("button", { name: /show next route/i })).toBeEnabled());
    await showRoute();
    fireEvent.click(screen.getByRole("button", { name: "Beacon Sun" }));
    await waitFor(() => expect(screen.getByText("Route ended.")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /start again/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /dispatch result/i }));
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ score: 8, completed: false, details: expect.objectContaining({ serverVerified: true, roundsCleared: 1 }) }));
  });
});

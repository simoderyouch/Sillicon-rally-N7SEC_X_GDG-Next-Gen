import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const mocks = vi.hoisted(() => ({ missions: vi.fn(), submitGameScore: vi.fn() }));

vi.mock("../api/client", () => ({ api: { missions: mocks.missions, submitGameScore: mocks.submitGameScore } }));
vi.mock("../games/registry", () => ({
  games: {
    pacman: {
      slug: "pacman",
      component: ({ onComplete }: { onComplete: (result: { score: number; completed: boolean; details?: Record<string, string | number | boolean> }) => void }) =>
        <button onClick={() => onComplete({ score: 26, completed: true, details: { pacmanScore: 2600 } })}>Finish Pac-Man</button>,
    },
  },
}));

import { GameRunner } from "./GameRunner";

const mission = { id: "pacman-id", slug: "pacman", title: "Pac-Man Challenge", description: "", maxScore: 100, releaseState: "PUBLISHED" as const };

function renderRunner() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={["/games/pacman"]}><Routes><Route path="/games/:slug" element={<GameRunner />} /></Routes></MemoryRouter></QueryClientProvider>);
}

beforeEach(() => {
  sessionStorage.clear();
  sessionStorage.setItem("teamToken", "team-token");
  mocks.missions.mockResolvedValue([mission]);
  mocks.submitGameScore.mockReset();
});
afterEach(() => { vi.clearAllMocks(); sessionStorage.clear(); });

describe("GameRunner score delivery", () => {
  it("keeps a failed Pac-Man score and retries that payload without restarting the game", async () => {
    mocks.submitGameScore.mockRejectedValue(new Error("offline"));
    renderRunner();

    fireEvent.click(await screen.findByRole("button", { name: "Finish Pac-Man" }));
    await waitFor(() => expect(mocks.submitGameScore).toHaveBeenCalledTimes(3), { timeout: 5_000 });
    expect(screen.getByRole("alert")).toHaveTextContent("saved on this device");
    expect(sessionStorage.getItem("rally:pending-score:v1:team-token:pacman")).toContain('"score":26');

    fireEvent.click(screen.getByRole("button", { name: "Retry score submission" }));
    await waitFor(() => expect(mocks.submitGameScore).toHaveBeenCalledTimes(4));
    expect(mocks.submitGameScore).toHaveBeenLastCalledWith("team-token", "pacman", { score: 26, completed: true, details: { pacmanScore: 2600 } });
  });
});

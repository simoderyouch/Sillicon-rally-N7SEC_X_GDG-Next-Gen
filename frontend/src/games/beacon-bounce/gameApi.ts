const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? "http://localhost:8080" : "");

export type BeaconRun = { runId: string; routes: string[][]; round: number; securedScore: number; hintsUsed: number; hintsRemaining: number; failed: boolean; complete: boolean };
export type BeaconAttempt = { correct: boolean; roundCleared: boolean; failed: boolean; complete: boolean; securedScore: number; nextRound: number };
export type BeaconHint = { route: string[]; penalty: number; securedScore: number; hintsUsed: number; hintsRemaining: number };

async function request<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers: { "Content-Type": "application/json", "X-Team-Token": token, ...init.headers } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message ?? "Beacon Bounce could not verify this run.");
  }
  return response.json() as Promise<T>;
}

export const beaconBounceApi = {
  start: (token: string) => request<BeaconRun>("/api/v1/games/beacon-bounce/runs", token, { method: "POST" }),
  attempt: (token: string, runId: string, round: number, beacon: string) => request<BeaconAttempt>("/api/v1/games/beacon-bounce/attempt", token, { method: "POST", body: JSON.stringify({ runId, round, beacon }) }),
  hint: (token: string, runId: string, round: number) => request<BeaconHint>("/api/v1/games/beacon-bounce/hint", token, { method: "POST", body: JSON.stringify({ runId, round }) }),
};

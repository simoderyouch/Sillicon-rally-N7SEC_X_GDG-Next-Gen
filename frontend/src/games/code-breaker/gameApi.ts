const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? "http://localhost:8080" : "");

export type GuessFeedback = { exact: number; shifted: number; absent: number; correct: boolean };
export type Hint = { position: number; symbol: string };

async function request<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", "X-Team-Token": token, ...init.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message ?? "Code Breaker could not verify that sequence.");
  }
  return response.json() as Promise<T>;
}

export const codeBreakerApi = {
  check: (token: string, round: number, symbols: string[]) => request<GuessFeedback>("/api/v1/games/code-breaker/attempt", token, { method: "POST", body: JSON.stringify({ round, symbols }) }),
  hint: (token: string, round: number, position: number) => request<Hint>(`/api/v1/games/code-breaker/hint?round=${round}&position=${position}`, token),
};

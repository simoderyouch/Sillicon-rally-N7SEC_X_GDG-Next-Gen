import type { AdminSession, EventState, GameScoreResponse, LeaderboardEntry, Mission, Team, TeamSession } from "./types";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message ?? "Request failed");
  }

  return response.json() as Promise<T>;
}

export const api = {
  joinTeam: (teamName: string, joinCode?: string) =>
    request<TeamSession>("/api/v1/team-sessions", {
      method: "POST",
      body: JSON.stringify({ teamName, joinCode }),
    }),
  missions: () => request<Mission[]>("/api/v1/missions"),
  submitGameScore: (token: string, slug: string, payload: { score: number; completed: boolean; details?: Record<string, string | number | boolean> }) => request<GameScoreResponse>(`/api/v1/games/${slug}/score`, { method: "POST", headers: { "X-Team-Token": token }, body: JSON.stringify(payload) }),
  leaderboard: () => request<LeaderboardEntry[]>("/api/v1/leaderboard"),
  adminLogin: (email: string, password: string) =>
    request<AdminSession>("/api/v1/admin/sessions", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  adminTeams: (token: string) => request<Team[]>("/api/v1/admin/teams", { headers: { "X-Admin-Token": token } }),
  createTeam: (token: string, displayName: string, joinCode?: string) =>
    request<Team>("/api/v1/admin/teams", {
      method: "POST",
      headers: { "X-Admin-Token": token },
      body: JSON.stringify({ displayName, joinCode }),
    }),
  updateTeam: (token: string, id: string, patch: Partial<Pick<Team, "displayName" | "status">>) =>
    request<Team>(`/api/v1/admin/teams/${id}`, {
      method: "PATCH",
      headers: { "X-Admin-Token": token },
      body: JSON.stringify(patch),
    }),
  eventState: (token: string) => request<EventState>("/api/v1/admin/event", { headers: { "X-Admin-Token": token } }),
  updateEventState: (token: string, patch: Partial<EventState>) =>
    request<EventState>("/api/v1/admin/event", {
      method: "PATCH",
      headers: { "X-Admin-Token": token },
      body: JSON.stringify(patch),
    }),
};


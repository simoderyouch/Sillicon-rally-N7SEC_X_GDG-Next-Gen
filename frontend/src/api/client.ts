import type { AdminSession, EventState, GameScoreResponse, LeaderboardEntry, Mission, Team, TeamSession } from "./types";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? "http://localhost:8080" : "");

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message ?? "Request failed");
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  joinTeam: (teamName: string, joinCode?: string) =>
    request<TeamSession>("/api/v1/team-sessions", {
      method: "POST",
      body: JSON.stringify({ teamName, joinCode }),
    }),
  missions: () => request<Mission[]>("/api/v1/missions"),
  myGameScores: (token: string) => request<GameScoreResponse[]>("/api/v1/my-scores", { headers: { "X-Team-Token": token } }),
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
  adminMissions: (token: string) => request<Mission[]>("/api/v1/admin/missions", { headers: { "X-Admin-Token": token } }),
  createMission: (token: string, mission: Omit<Mission, "id">) => request<Mission>("/api/v1/admin/missions", { method: "POST", headers: { "X-Admin-Token": token }, body: JSON.stringify(mission) }),
  updateMission: (token: string, id: string, mission: Omit<Mission, "id">) => request<Mission>(`/api/v1/admin/missions/${id}`, { method: "PUT", headers: { "X-Admin-Token": token }, body: JSON.stringify(mission) }),
  eventState: (token: string) => request<EventState>("/api/v1/admin/event", { headers: { "X-Admin-Token": token } }),
  updateEventState: (token: string, patch: Partial<EventState>) =>
    request<EventState>("/api/v1/admin/event", {
      method: "PATCH",
      headers: { "X-Admin-Token": token },
      body: JSON.stringify(patch),
    }),
  resetLeaderboard: (token: string) => request<void>("/api/v1/admin/leaderboard/reset", { method: "POST", headers: { "X-Admin-Token": token } }),
  wipeEvent: (token: string) => request<void>("/api/v1/admin/event/wipe", { method: "POST", headers: { "X-Admin-Token": token } }),
};


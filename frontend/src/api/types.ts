export type Team = {
  id: string;
  displayName: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
};

export type TeamSession = {
  token: string;
  team: Team;
};

export type Mission = {
  id: string;
  slug: string;
  title: string;
  description: string;
  maxScore: number;
  releaseState: "DRAFT" | "PUBLISHED" | "CLOSED";
};

export type EventState = {
  isOpen: boolean;
  leaderboardLocked: boolean;
};

export type AdminSession = { token: string; email: string };

export type GameScoreResponse = { missionSlug: string; score: number; completed: boolean; submittedAt: string };

export type LeaderboardEntry = { rank: number; teamId: string; teamName: string; score: number };


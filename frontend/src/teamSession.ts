const TOKEN_KEY = "teamToken";
const NAME_KEY = "teamName";

export type TeamSession = { token: string; teamName: string };

/**
 * Player sessions deliberately survive a browser restart during an event.
 * Older tab-only sessions are migrated once, so deployment does not interrupt
 * an in-progress competition.
 */
function read(key: string): string | null {
  const persistent = localStorage.getItem(key);
  if (persistent !== null) return persistent;

  const legacy = sessionStorage.getItem(key);
  if (legacy === null) return null;
  try {
    localStorage.setItem(key, legacy);
    sessionStorage.removeItem(key);
  } catch {
    // Browsers with disabled persistent storage retain the prior tab session.
  }
  return legacy;
}

export function getTeamToken(): string | null { return read(TOKEN_KEY); }
export function getTeamName(): string | null { return read(NAME_KEY); }

export function getTeamSession(): TeamSession | null {
  const token = getTeamToken();
  const teamName = getTeamName();
  return token && teamName ? { token, teamName } : null;
}

export function saveTeamSession(token: string, teamName: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(NAME_KEY, teamName);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(NAME_KEY);
  } catch {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(NAME_KEY, teamName);
  }
}

export function clearTeamSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(NAME_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(NAME_KEY);
}

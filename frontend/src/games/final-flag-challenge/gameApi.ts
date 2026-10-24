export type FlagState = {
  attempts: number;
  maxAttempts: number;
  solved: boolean;
  recorded: boolean;
  available: boolean;
  retryAfterMs: number;
};
const base = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://localhost:8080' : '');
async function request(token: string, flag?: string): Promise<FlagState> {
  const response = await fetch(`${base}/api/v1/games/final-flag-challenge/${flag === undefined ? 'state' : 'verify'}`, {
    method: flag === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Team-Token': token },
    ...(flag === undefined ? {} : { body: JSON.stringify({ flag }) }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message ?? 'Unable to reach the challenge server. Please try again.');
  }
  return response.json();
}
export const flagApi = { state: (token: string) => request(token), verify: (token: string, flag: string) => request(token, flag) };

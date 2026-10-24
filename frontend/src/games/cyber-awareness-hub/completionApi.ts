export type Completion = { locked: boolean; score: number | null; claimed: boolean };
const base = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://localhost:8080' : '');
async function request(token: string, score?: number): Promise<Completion> {
  const response = await fetch(`${base}/api/v1/games/cyber-awareness-hub/completion`, {
    method: score === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', 'X-Team-Token': token },
    ...(score === undefined ? {} : { body: JSON.stringify({ score }) }),
  });
  if (!response.ok) { const cause = await response.json().catch(() => ({})); throw new Error(cause.message ?? 'Impossible de vérifier la participation de votre équipe.'); }
  return response.json() as Promise<Completion>;
}
export const completionApi = { state: (token: string) => request(token), claim: (token: string, score: number) => request(token, score) };

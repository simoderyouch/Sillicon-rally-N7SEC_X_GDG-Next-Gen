export type CategoryId = 'it' | 'cybersecurity' | 'general' | 'football' | 'countries' | 'movies';
export const categories: { id: CategoryId; icon: string; name: string; description: string }[] = [
  { id: 'it', icon: '💻', name: 'IT', description: 'Ordinateurs, Internet et bases de la programmation.' },
  { id: 'cybersecurity', icon: '🛡️', name: 'Cybersecurity', description: 'Phishing, mots de passe et réflexes de sécurité.' },
  { id: 'general', icon: '🧠', name: 'General Knowledge', description: 'Sciences, inventions et connaissances du quotidien.' },
  { id: 'football', icon: '⚽', name: 'Football', description: 'Joueurs, clubs et grandes compétitions historiques.' },
  { id: 'countries', icon: '🌍', name: 'Countries', description: 'Capitales, drapeaux, géographie et monuments.' },
  { id: 'movies', icon: '🎬', name: 'Movies', description: 'Personnages, réalisateurs et films incontournables.' },
];
export type Question = { id: string; text: string; options: string[]; difficulty: 'easy' | 'medium' | 'challenging' };
export type Review = { question: Question; selected: number | null; correctOption: number; correct: boolean; timeout: boolean; explanation: string };
export type Snapshot = { category: CategoryId; number: number; answered: number; rawScore: number; score: number; correctAnswers: number; incorrectAnswers: number; timeouts: number; totalTimeMs: number; rank: string; serverNow: number; deadline: number; nextAt: number; complete: boolean; handedOff: boolean; question: Question | null; feedback: Review | null; review: Review[] };
const base = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://localhost:8080' : '');
async function request(token: string, path: string, body?: object): Promise<Snapshot | null> {
  const response = await fetch(`${base}/api/v1/games/team-trivia-battle/${path}`, {
    method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', 'X-Team-Token': token }, ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.message ?? 'Le serveur ne peut pas charger la partie.'); }
  const data: { state: Snapshot | null } = await response.json(); return data.state;
}
export const triviaApi = {
  state: (token: string) => request(token, 'state'),
  start: (token: string, category: CategoryId) => request(token, 'start', { category }),
  answer: (token: string, questionId: string, optionIndex: number) => request(token, 'answer', { questionId, optionIndex }),
  handoff: (token: string) => request(token, 'handoff', {}),
};

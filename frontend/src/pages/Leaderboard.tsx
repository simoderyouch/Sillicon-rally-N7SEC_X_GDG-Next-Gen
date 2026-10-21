import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

export function Leaderboard() {
  const { data, isPending, error } = useQuery({ queryKey: ["leaderboard"], queryFn: api.leaderboard });
  return <section><h1>Leaderboard</h1>{isPending && <p>Loading scores…</p>}{error && <p className="error">{error.message}</p>}<table><thead><tr><th>Rank</th><th>Team</th><th>Score</th></tr></thead><tbody>{data?.map((entry) => <tr key={entry.teamId}><td>{entry.rank}</td><td>{entry.teamName}</td><td>{entry.score}</td></tr>)}</tbody></table></section>;
}

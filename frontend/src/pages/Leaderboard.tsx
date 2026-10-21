import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

export function Leaderboard() {
  const { data, isPending, error } = useQuery({ queryKey: ["leaderboard"], queryFn: api.leaderboard });
  return <section className="leaderboard-page">
    <div className="page-heading leaderboard-heading"><div><p className="eyebrow">Live telemetry · team standings</p><h1>Where the route<br /><em>stands now.</em></h1></div><p className="live-indicator"><span />Live board</p></div>
    {isPending && <p className="loading-copy">Receiving telemetry…</p>}
    {error && <p className="error" role="alert">{error.message}</p>}
    <div className="leaderboard-table-wrap"><table><thead><tr><th>Position</th><th>Team</th><th>Total points</th></tr></thead><tbody>{data?.map((entry) => <tr key={entry.teamId} className={entry.rank <= 3 ? `rank-${entry.rank}` : ""}><td><span className="rank-marker">{String(entry.rank).padStart(2, "0")}</span></td><td><strong>{entry.teamName}</strong></td><td><span className="score-value">{entry.score}</span><small> pts</small></td></tr>)}</tbody></table>{!isPending && !data?.length && <div className="table-empty">No points are on the board yet. The first completed mission sets the pace.</div>}</div>
  </section>;
}

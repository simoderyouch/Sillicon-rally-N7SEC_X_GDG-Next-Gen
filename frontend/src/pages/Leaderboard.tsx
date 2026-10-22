import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { LeaderboardEntry } from "../api/types";
import { Radio, Trophy } from "lucide-react";

function leaderboardSocketUrl() {
  const configuredUrl = import.meta.env.VITE_LEADERBOARD_WS_URL;
  if (configuredUrl) return configuredUrl;
  if (import.meta.env.DEV) return "ws://localhost:8080/ws/leaderboard";
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws/leaderboard`;
}

export function Leaderboard() {
  const queryClient = useQueryClient();
  const { data, isPending, error } = useQuery({ queryKey: ["leaderboard"], queryFn: api.leaderboard, refetchInterval: 15000 });

  useEffect(() => {
    let stopped = false;
    let reconnectTimer: number | undefined;
    let socket: WebSocket | undefined;
    const connect = () => {
      socket = new WebSocket(leaderboardSocketUrl());
      socket.onmessage = (event) => {
        try { queryClient.setQueryData<LeaderboardEntry[]>(["leaderboard"], JSON.parse(event.data)); }
        catch { queryClient.invalidateQueries({ queryKey: ["leaderboard"] }); }
      };
      socket.onclose = () => { if (!stopped) reconnectTimer = window.setTimeout(connect, 2000); };
      socket.onerror = () => socket?.close();
    };
    connect();
    return () => { stopped = true; if (reconnectTimer) window.clearTimeout(reconnectTimer); socket?.close(); };
  }, [queryClient]);

  return <section className="leaderboard-page">
    <div className="page-heading leaderboard-heading"><div><p className="eyebrow"><Trophy size={13} /> Live telemetry · team standings</p><h1>Where the route<br /><em>stands now.</em></h1></div><p className="live-indicator"><Radio size={13} /> Live board</p></div>
    {isPending && <p className="loading-copy">Receiving telemetry…</p>}
    {error && <p className="error" role="alert">{error.message}</p>}
    <div className="leaderboard-table-wrap"><table><thead><tr><th>Position</th><th>Team</th><th>Total points</th></tr></thead><tbody>{data?.map((entry) => <tr key={entry.teamId} className={entry.rank <= 3 ? `rank-${entry.rank}` : ""}><td><span className="rank-marker">{String(entry.rank).padStart(2, "0")}</span></td><td><strong>{entry.teamName}</strong></td><td><span className="score-value">{entry.score}</span><small> pts</small></td></tr>)}</tbody></table>{!isPending && !data?.length && <div className="table-empty">No points are on the board yet. The first completed mission sets the pace.</div>}</div>
  </section>;
}

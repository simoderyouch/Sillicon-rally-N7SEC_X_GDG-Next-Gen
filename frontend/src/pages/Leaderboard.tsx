import { FormEvent, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Radio, Trophy } from "lucide-react";
import { api } from "../api/client";
import type { LeaderboardEntry } from "../api/types";

function leaderboardSocketUrl() {
  const configuredUrl = import.meta.env.VITE_LEADERBOARD_WS_URL;
  if (configuredUrl) return configuredUrl;
  if (import.meta.env.DEV) return "ws://localhost:8080/ws/leaderboard";
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws/leaderboard`;
}

export function Leaderboard() {
  const queryClient = useQueryClient();
  const [adminToken, setAdminToken] = useState<string | null>(() => sessionStorage.getItem("adminToken"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const { data, isPending, error } = useQuery({
    queryKey: ["leaderboard", adminToken],
    queryFn: () => api.leaderboard(adminToken!),
    enabled: Boolean(adminToken),
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (!adminToken) return;
    let stopped = false;
    let reconnectTimer: number | undefined;
    let socket: WebSocket | undefined;
    const connect = () => {
      socket = new WebSocket(leaderboardSocketUrl());
      socket.onopen = () => socket?.send(adminToken);
      socket.onmessage = (event) => {
        try { queryClient.setQueryData<LeaderboardEntry[]>(["leaderboard", adminToken], JSON.parse(event.data)); }
        catch { queryClient.invalidateQueries({ queryKey: ["leaderboard"] }); }
      };
      socket.onclose = (event) => { if (!stopped && event.code !== 1008) reconnectTimer = window.setTimeout(connect, 2000); };
      socket.onerror = () => socket?.close();
    };
    connect();
    return () => { stopped = true; if (reconnectTimer) window.clearTimeout(reconnectTimer); socket?.close(); };
  }, [adminToken, queryClient]);

  async function login(event: FormEvent) {
    event.preventDefault();
    setLoggingIn(true);
    setLoginError("");
    try {
      const session = await api.adminLogin(email, password);
      sessionStorage.setItem("adminToken", session.token);
      setAdminToken(session.token);
      setPassword("");
    } catch (cause) {
      setLoginError(cause instanceof Error ? cause.message : "Login failed");
    } finally { setLoggingIn(false); }
  }

  function signInAgain() {
    sessionStorage.removeItem("adminToken");
    setAdminToken(null);
    queryClient.removeQueries({ queryKey: ["leaderboard"] });
  }

  if (!adminToken) return <section className="admin-login-layout"><div className="admin-login-copy"><p className="eyebrow">Restricted scoreboard</p><h1>View the<br /><em>standings.</em></h1><p className="lede">Use the same organiser credentials as the admin control room.</p></div><div className="form-card admin-login-card"><p className="form-kicker">Organiser access</p><h2>Unlock leaderboard</h2><form onSubmit={login}><label>Email<input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Password<input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label><button className="button-primary" disabled={loggingIn}>{loggingIn ? "Signing in…" : "Open scoreboard"}<span aria-hidden="true">→</span></button>{loginError && <p className="error" role="alert">{loginError}</p>}</form></div></section>;

  return <section className="leaderboard-page">
    <div className="page-heading leaderboard-heading"><div><p className="eyebrow"><Trophy size={13} /> Live telemetry · team standings</p><h1>Where the route<br /><em>stands now.</em></h1></div><p className="live-indicator"><Radio size={13} /> Live board</p></div>
    {isPending && <p className="loading-copy">Receiving telemetry…</p>}
    {error && <div className="error" role="alert"><p>{error.message}</p><button className="button-secondary" onClick={signInAgain}>Sign in again</button></div>}
    {!error && <div className="leaderboard-table-wrap"><table><thead><tr><th>Position</th><th>Team</th><th>Total points</th></tr></thead><tbody>{data?.map((entry) => <tr key={entry.teamId} className={entry.rank <= 3 ? `rank-${entry.rank}` : ""}><td><span className="rank-marker">{String(entry.rank).padStart(2, "0")}</span></td><td><strong>{entry.teamName}</strong></td><td><span className="score-value">{entry.score}</span><small> pts</small></td></tr>)}</tbody></table>{!isPending && !data?.length && <div className="table-empty">No points are on the board yet. The first completed mission sets the pace.</div>}</div>}
  </section>;
}

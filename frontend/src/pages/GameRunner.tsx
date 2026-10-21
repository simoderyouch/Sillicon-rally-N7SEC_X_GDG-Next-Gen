import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { games } from "../games/registry";

export function GameRunner() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const token = sessionStorage.getItem("teamToken");
  const missions = useQuery({ queryKey: ["missions"], queryFn: api.missions });
  const submit = useMutation({
    mutationFn: (result: { score: number; completed: boolean; details?: Record<string, string | number | boolean> }) => api.submitGameScore(token!, slug, result),
    onSuccess: () => navigate("/games"),
  });

  if (!token) return <section className="empty-state"><p className="eyebrow">No session found</p><h1>Start at the first checkpoint.</h1><Link className="button-primary" to="/play">Join a team <span aria-hidden="true">→</span></Link></section>;
  if (missions.isPending) return <section className="loading-state"><p className="eyebrow">Mission loading</p><h1>Setting up your checkpoint…</h1></section>;
  const mission = missions.data?.find((item) => item.slug === slug);
  const definition = games[slug];
  if (!mission || !definition) return <section className="empty-state"><p className="eyebrow">Detour required</p><h1>Mission unavailable.</h1><p>This checkpoint is not ready in the frontend yet.</p><Link className="button-primary" to="/games">Back to route <span aria-hidden="true">→</span></Link></section>;
  const Component = definition.component;

  return <section className="game-runner"><div className="game-runner-meta"><Link to="/games">← Back to the mission board</Link><span>Ticket checked · ready to play</span></div><div className="game-cabinet"><div className="cabinet-marquee"><span className="cabinet-light" aria-hidden="true" /> <strong>{mission.title}</strong><span>ACTIVE TICKET</span></div><div className="cabinet-screen"><Component mission={mission} disabled={submit.isPending} onComplete={(result) => submit.mutate(result)} /></div><div className="cabinet-footer"><span>Crew: {sessionStorage.getItem("teamName") ?? "Team"}</span><span>Prize pool: {mission.maxScore} pts</span><span>Keep it weird ✦</span></div></div>{submit.error && <p className="error" role="alert">{submit.error.message}</p>}</section>;
}

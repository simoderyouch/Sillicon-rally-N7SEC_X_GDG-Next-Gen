import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Radio, ShieldCheck } from "lucide-react";
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

  if (!token) return <section className="empty-state"><p className="eyebrow">Session missing</p><h1>Join the challenge.</h1><Link className="button-primary" to="/play">Join a team <span aria-hidden="true">→</span></Link></section>;
  if (missions.isPending) return <section className="loading-state"><p className="eyebrow">Challenge loading</p><h1>Preparing your challenge…</h1></section>;
  const mission = missions.data?.find((item) => item.slug === slug);
  const definition = games[slug];
  if (!mission || !definition) return <section className="empty-state"><p className="eyebrow">Challenge unavailable</p><h1>Challenge not ready.</h1><p>This challenge is not yet available in the player client.</p><Link className="button-primary" to="/games">Back to board <span aria-hidden="true">→</span></Link></section>;
  const Component = definition.component;

  return <section className="game-runner"><div className="game-runner-meta"><Link to="/games"><ChevronLeft size={15} /> Back to challenge board</Link><span><ShieldCheck size={13} /> Training challenge · no real systems</span></div><div className="game-cabinet"><div className="cabinet-marquee"><Radio className="cabinet-light" aria-hidden="true" size={14} /> <strong>{mission.title}</strong><span>Challenge active</span></div><div className="cabinet-screen"><Component mission={mission} disabled={submit.isPending} onComplete={(result) => submit.mutate(result)} /></div><div className="cabinet-footer"><span>Session: {sessionStorage.getItem("teamName") ?? "Team"}</span><span>Score limit: {mission.maxScore}</span><span>Authorised exercise only</span></div></div>{submit.error && <p className="error" role="alert">{submit.error.message}</p>}</section>;
}

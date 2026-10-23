import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Radio, ShieldCheck } from "lucide-react";
import { api } from "../api/client";
import { games } from "../games/registry";

type GameResult = { score: number; completed: boolean; details?: Record<string, string | number | boolean> };

function pendingSubmissionKey(teamToken: string, slug: string) {
  return `rally:pending-score:v1:${teamToken}:${slug}`;
}

function readPendingSubmission(key: string | null): GameResult | null {
  if (!key) return null;
  try {
    const value = JSON.parse(sessionStorage.getItem(key) ?? "null") as GameResult | null;
    if (!value || !Number.isSafeInteger(value.score) || value.score < 0 || typeof value.completed !== "boolean") return null;
    return value;
  } catch { return null; }
}

export function GameRunner() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const token = sessionStorage.getItem("teamToken");
  const pendingKey = token ? pendingSubmissionKey(token, slug) : null;
  const [pendingResult, setPendingResult] = useState<GameResult | null>(() => readPendingSubmission(pendingKey));
  const missions = useQuery({ queryKey: ["missions"], queryFn: api.missions });
  const mission = missions.data?.find((item) => item.slug === slug);
  const definition = games[slug];
  const submit = useMutation({
    mutationFn: (result: GameResult) => api.submitGameScore(token!, slug, result),
    retry: 2,
    retryDelay: (attempt) => Math.min(1_000 * (attempt + 1), 3_000),
    onSuccess: () => {
      if (pendingKey) sessionStorage.removeItem(pendingKey);
      setPendingResult(null);
      navigate("/games");
    },
  });

  useEffect(() => {
    if (mission && pendingResult && submit.status === "idle") submit.mutate(pendingResult);
  }, [mission, pendingResult, submit]);

  function submitResult(result: GameResult) {
    if (pendingKey) {
      try { sessionStorage.setItem(pendingKey, JSON.stringify(result)); }
      catch { /* The current submission can still proceed. */ }
    }
    setPendingResult(result);
    submit.mutate(result);
  }

  function retryPendingSubmission() {
    if (!pendingResult || submit.isPending) return;
    submit.reset();
    submit.mutate(pendingResult);
  }

  if (!token) return <section className="empty-state"><p className="eyebrow">Session missing</p><h1>Join the challenge.</h1><Link className="button-primary" to="/play">Join a team <span aria-hidden="true">→</span></Link></section>;
  if (missions.isPending) return <section className="loading-state"><p className="eyebrow">Challenge loading</p><h1>Preparing your challenge…</h1></section>;
  if (!mission || !definition) return <section className="empty-state"><p className="eyebrow">Challenge unavailable</p><h1>Challenge not ready.</h1><p>This challenge is not yet available in the player client.</p><Link className="button-primary" to="/games">Back to board <span aria-hidden="true">→</span></Link></section>;
  const Component = definition.component;

  return <section className="game-runner"><div className="game-runner-meta"><Link to="/games"><ChevronLeft size={15} /> Back to challenge board</Link><span><ShieldCheck size={13} /> Training challenge · no real systems</span></div><div className="game-cabinet"><div className="cabinet-marquee"><Radio className="cabinet-light" aria-hidden="true" size={14} /> <strong>{mission.title}</strong><span>Challenge active</span></div><div className="cabinet-screen"><Component mission={mission} disabled={submit.isPending} onComplete={submitResult} /></div><div className="cabinet-footer"><span>Session: {sessionStorage.getItem("teamName") ?? "Team"}</span><span>Score limit: {mission.maxScore}</span><span>Authorised exercise only</span></div></div>{submit.error && pendingResult && <div className="error" role="alert"><p>Your finished score is saved on this device but has not reached the server yet: {submit.error.message}</p><button className="button-primary" disabled={submit.isPending} onClick={retryPendingSubmission}>Retry score submission</button></div>}</section>;
}

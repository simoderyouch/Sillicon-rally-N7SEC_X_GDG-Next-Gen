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

  if (!token) return <section><p>No active team session.</p><Link to="/play">Join a team</Link></section>;
  if (missions.isPending) return <section><p>Loading game…</p></section>;
  const mission = missions.data?.find((item) => item.slug === slug);
  const definition = games[slug];
  if (!mission || !definition) return <section><h1>Game unavailable</h1><p>This mission is not registered in the frontend yet.</p><Link to="/games">Back to games</Link></section>;
  const Component = definition.component;

  return <section><Component mission={mission} disabled={submit.isPending} onComplete={(result) => submit.mutate(result)} />{submit.error && <p className="error">{submit.error.message}</p>}</section>;
}

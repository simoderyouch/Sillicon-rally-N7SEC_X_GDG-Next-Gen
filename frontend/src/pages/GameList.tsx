import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { games } from "../games/registry";

export function GameList() {
  const teamName = sessionStorage.getItem("teamName");
  const { data, isPending, error } = useQuery({ queryKey: ["missions"], queryFn: api.missions });
  if (!teamName) return <section><p>No active team session.</p><Link to="/play">Join a team</Link></section>;
  return <section><h1>Mission board</h1><p>Playing as <strong>{teamName}</strong></p>
    {isPending && <p>Loading games…</p>}
    {error && <p className="error">{error.message}</p>}
    <div className="grid">{data?.map((mission) => <article key={mission.id}><h2>{mission.title}</h2><p>{mission.description}</p><p>Max score: {mission.maxScore}</p>{games[mission.slug] ? <Link to={`/games/${mission.slug}`}>Start game</Link> : <p><small>Frontend game is not registered yet.</small></p>}</article>)}</div>
  </section>;
}


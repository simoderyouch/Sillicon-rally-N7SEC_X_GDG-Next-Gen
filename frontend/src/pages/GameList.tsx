import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { games } from "../games/registry";

export function GameList() {
  const teamName = sessionStorage.getItem("teamName");
  const { data, isPending, error } = useQuery({ queryKey: ["missions"], queryFn: api.missions });
  if (!teamName) return <section className="empty-state"><p className="eyebrow">No session found</p><h1>Start at the first checkpoint.</h1><Link className="button-primary" to="/play">Join a team <span aria-hidden="true">→</span></Link></section>;
  return <section className="mission-board">
    <div className="page-heading">
      <div><p className="eyebrow">Route map · active missions</p><h1>Choose your next<br /><em>checkpoint.</em></h1></div>
      <div className="team-badge"><span className="team-badge-dot" /><div><small>Racing as</small><strong>{teamName}</strong></div></div>
    </div>
    {isPending && <p className="loading-copy">Loading the route…</p>}
    {error && <p className="error" role="alert">{error.message}</p>}
    <div className="mission-grid">{data?.map((mission, index) => {
      const hasGame = Boolean(games[mission.slug]);
      return <article className={`mission-card ${hasGame ? "is-ready" : "is-waiting"}`} key={mission.id}>
        <div className="mission-card-top"><span className="mission-number">{String(index + 1).padStart(2, "0")}</span><span className="mission-status">{hasGame ? "Ready to run" : "In the garage"}</span></div>
        <div><h2>{mission.title}</h2><p>{mission.description}</p></div>
        <div className="mission-card-bottom"><span><b>{mission.maxScore}</b> max pts</span>{hasGame ? <Link className="mission-link" to={`/games/${mission.slug}`}>Open mission <span aria-hidden="true">↗</span></Link> : <span className="muted-label">Coming soon</span>}</div>
      </article>;
    })}</div>
  </section>;
}


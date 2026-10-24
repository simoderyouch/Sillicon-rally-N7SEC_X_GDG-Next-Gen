import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight, CheckCircle2, CircleDot, Construction, Play, Sparkles, UsersRound } from "lucide-react";
import { api } from "../api/client";
import { games } from "../games/registry";
import { getTeamName, getTeamToken } from "../teamSession";

export function GameList() {
  const location = useLocation();
  const teamJoined = Boolean((location.state as { teamJoined?: boolean } | null)?.teamJoined);
  const teamName = getTeamName();
  const teamToken = getTeamToken();
  const { data, isPending, error } = useQuery({ queryKey: ["missions"], queryFn: api.missions });
  const scores = useQuery({ queryKey: ["team-game-scores", teamToken], queryFn: () => api.myGameScores(teamToken!), enabled: Boolean(teamToken) });
  if (!teamName) return <section className="empty-state"><p className="eyebrow">Session missing</p><h1>Join the challenge.</h1><Link className="button-primary" to="/play">Join a team <ArrowUpRight size={17} /></Link></section>;
  return <section className="mission-board">
    <div className="page-heading">
      <div><p className="eyebrow"><Sparkles size={13} /> Challenge board · event arena</p><h1>Pick a<br /><em>challenge.</em></h1></div>
      <div className="team-badge"><CircleDot className="team-badge-dot" size={15} /><div><small>Team session active</small><strong>{teamName}</strong></div></div>
    </div>
    {teamJoined && <div className="team-welcome" role="status"><UsersRound size={18} /><span><strong>You're checked in, {teamName}.</strong> Your progress is saved to this team.</span></div>}
    {isPending && <p className="loading-copy">Loading authorised challenges…</p>}
    {error && <p className="error" role="alert">{error.message}</p>}
    {scores.error && <p className="error" role="alert">Could not load your completed challenges: {scores.error.message}</p>}
    <div className="mission-grid">{data?.map((mission, index) => {
      const hasGame = Boolean(games[mission.slug]);
      const savedScore = scores.data?.find((score) => score.missionSlug === mission.slug);
      const isFinished = Boolean(savedScore);
      return <article className={`mission-card ${hasGame ? "is-ready" : "is-waiting"} ${isFinished ? "is-completed" : ""}`} key={mission.id}>
        <div className="mission-card-top"><span className="mission-number"><span className="mission-index">{String(index + 1).padStart(2, "0")}</span> CH</span><span className={`mission-status ${isFinished ? "mission-status-completed" : ""}`}>{isFinished ? <><CheckCircle2 size={13} /> Finished · {savedScore?.score} pts</> : hasGame ? <><Play size={12} fill="currentColor" /> Challenge ready</> : <><Construction size={12} /> Provisioning</>}</span></div>
        <div><h2>{mission.title}</h2><p>{mission.description}</p></div>
        <div className="mission-card-bottom"><span><b>{mission.maxScore}</b> point ceiling</span>{isFinished ? <span className="muted-label mission-locked">Finished · challenge locked</span> : hasGame ? <Link className="mission-link" to={`/games/${mission.slug}`}>Open challenge <ArrowUpRight size={16} /></Link> : <span className="muted-label">Build in progress</span>}</div>
      </article>;
    })}</div>
  </section>;
}


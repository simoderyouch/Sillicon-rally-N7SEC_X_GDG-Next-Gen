import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";

/** Source artwork is 1672×941. Overlay boxes use those pixels and scale with the stage. */
const IMAGE = { width: 1672, height: 941 };

function box(x: number, y: number, width: number, height: number) {
  return {
    left: `${(x / IMAGE.width) * 100}%`,
    top: `${(y / IMAGE.height) * 100}%`,
    width: `${(width / IMAGE.width) * 100}%`,
    height: `${(height / IMAGE.height) * 100}%`,
  };
}

export function JoinTeam() {
  const navigate = useNavigate();
  const [teamName, setTeamName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const session = await api.joinTeam(teamName.trim(), joinCode || undefined);
      sessionStorage.setItem("teamToken", session.token);
      sessionStorage.setItem("teamName", session.team.displayName);
      navigate("/games");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not join team");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="home-stage">
      <img src="/images/silicon-rally-home.png" width={IMAGE.width} height={IMAGE.height} alt="Silicon Rally digital challenge event" />
      <nav className="home-nav" aria-label="Main navigation">
        <Link to="/play" className="home-hit" style={box(528, 16, 112, 54)} aria-label="Home" aria-current="page" />
        <Link to="/leaderboard" className="home-hit" style={box(652, 22, 176, 34)} aria-label="Leaderboard" />
        <Link to="/admin" className="home-hit" style={box(1278, 14, 168, 56)} aria-label="Admin Shell" />
      </nav>
      <form onSubmit={submit}>
        <label className="home-sr" htmlFor="team-name">Team name</label>
        <input
          id="team-name"
          className="home-field"
          style={box(1082, 402, 392, 36)}
          required
          autoFocus
          autoComplete="off"
          value={teamName}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "join-status" : undefined}
          onChange={(event) => setTeamName(event.target.value)}
        />
        <label className="home-sr" htmlFor="join-code">Join code, optional</label>
        <input
          id="join-code"
          className="home-field"
          style={box(1082, 510, 392, 38)}
          autoComplete="off"
          value={joinCode}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "join-status" : undefined}
          onChange={(event) => setJoinCode(event.target.value)}
        />
        <button className="home-submit" style={box(1026, 614, 460, 58)} type="submit" disabled={loading} aria-label="Join rally">
          Join rally
        </button>
        {(loading || error) && (
          <p id="join-status" className={error ? "home-status home-status-error" : "home-status"} role={error ? "alert" : "status"} style={box(1024, 716, 468, 72)}>
            {error || "Joining rally…"}
          </p>
        )}
      </form>
    </section>
  );
}

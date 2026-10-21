import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

export function JoinTeam() {
  const navigate = useNavigate();
  const [teamName, setTeamName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true); setError("");
    try {
      const session = await api.joinTeam(teamName.trim(), joinCode || undefined);
      sessionStorage.setItem("teamToken", session.token);
      sessionStorage.setItem("teamName", session.team.displayName);
      navigate("/games");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not join team");
    } finally { setLoading(false); }
  }

  return <section><h1>Join the game</h1><p>Enter your team name to begin.</p><form onSubmit={submit}>
    <label>Team name<input required value={teamName} onChange={(e) => setTeamName(e.target.value)} /></label>
    <label>Join code <small>(optional in local development)</small><input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} /></label>
    <button disabled={loading}>{loading ? "Joining…" : "Join team"}</button>
    {error && <p className="error">{error}</p>}
  </form></section>;
}


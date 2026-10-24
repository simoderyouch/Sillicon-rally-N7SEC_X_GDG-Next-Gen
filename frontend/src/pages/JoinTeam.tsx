import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Flag, UsersRound } from "lucide-react";
import { api } from "../api/client";
import { saveTeamSession } from "../teamSession";

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
      saveTeamSession(session.token, session.team.displayName);
      navigate("/games", { state: { teamJoined: true } });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not join team");
    } finally { setLoading(false); }
  }

  return <section className="join-layout">
    <div className="join-intro">
      <p className="eyebrow"><Flag size={13} /> Checkpoint 00 · team check-in</p>
      <h1>Put your crew<br /><em>on the route.</em></h1>
      <p className="lede">Choose the team name your crew will carry through every mission and up the standings.</p>
      <div className="rally-note"><UsersRound aria-hidden="true" size={20} /><p><strong>One name. One score.</strong><br />Your team session keeps your mission progress together on this device.</p></div>
    </div>
    <div className="form-card join-card">
      <p className="form-kicker">Rally access</p>
      <h2>Start a team session</h2>
      <form onSubmit={submit}>
        <label>Team name<input required autoFocus placeholder="e.g. Packet Pilots" value={teamName} onChange={(e) => setTeamName(e.target.value)} /></label>
        <label>Event join code <small>Use the shared code from your event organizer</small><input autoComplete="one-time-code" placeholder="Enter the event code" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} /></label>
        <button className="button-primary" disabled={loading}>{loading ? "Joining rally…" : "Join rally"}<ArrowUpRight aria-hidden="true" size={17} /></button>
        {error && <p className="error" role="alert">{error}</p>}
      </form>
    </div>
  </section>;
}


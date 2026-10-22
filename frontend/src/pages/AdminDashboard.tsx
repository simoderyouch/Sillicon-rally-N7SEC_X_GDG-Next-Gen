import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { api } from "../api/client";
import type { Mission } from "../api/types";

type MissionDraft = Omit<Mission, "id">;

const blankMission: MissionDraft = {
  slug: "",
  title: "",
  description: "",
  maxScore: 100,
  releaseState: "DRAFT",
};

export function AdminDashboard() {
  const token = sessionStorage.getItem("adminToken");
  const queryClient = useQueryClient();
  const [teamName, setTeamName] = useState("");
  const [missionDraft, setMissionDraft] = useState<MissionDraft>(blankMission);

  const teams = useQuery({ queryKey: ["admin", "teams"], queryFn: () => api.adminTeams(token!), enabled: Boolean(token) });
  const missions = useQuery({ queryKey: ["admin", "missions"], queryFn: () => api.adminMissions(token!), enabled: Boolean(token) });
  const eventState = useQuery({ queryKey: ["admin", "event"], queryFn: () => api.eventState(token!), enabled: Boolean(token) });
  const createTeam = useMutation({
    mutationFn: () => api.createTeam(token!, teamName),
    onSuccess: () => { setTeamName(""); queryClient.invalidateQueries({ queryKey: ["admin", "teams"] }); },
  });
  const toggleTeam = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "INACTIVE" }) => api.updateTeam(token!, id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "teams"] }),
  });
  const updateEvent = useMutation({
    mutationFn: (isOpen: boolean) => api.updateEventState(token!, { isOpen }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "event"] }),
  });
  const createMission = useMutation({
    mutationFn: () => api.createMission(token!, missionDraft),
    onSuccess: () => {
      setMissionDraft(blankMission);
      queryClient.invalidateQueries({ queryKey: ["admin", "missions"] });
      queryClient.invalidateQueries({ queryKey: ["missions"] });
    },
  });
  const updateMission = useMutation({
    mutationFn: ({ mission, releaseState }: { mission: Mission; releaseState: Mission["releaseState"] }) =>
      api.updateMission(token!, mission.id, { ...mission, releaseState }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "missions"] });
      queryClient.invalidateQueries({ queryKey: ["missions"] });
    },
  });
  const resetLeaderboard = useMutation({
    mutationFn: () => api.resetLeaderboard(token!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leaderboard"] }),
  });
  const wipeEvent = useMutation({
    mutationFn: () => api.wipeEvent(token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "teams"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "event"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });

  if (!token) return <Navigate to="/admin" replace />;

  const isOpen = eventState.data?.isOpen ?? false;
  function submitTeam(event: FormEvent) {
    event.preventDefault();
    if (teamName.trim()) createTeam.mutate();
  }
  function submitMission(event: FormEvent) {
    event.preventDefault();
    if (missionDraft.slug.trim() && missionDraft.title.trim() && missionDraft.description.trim()) createMission.mutate();
  }
  function confirmReset() {
    if (window.confirm("Remove every team score and reset the live leaderboard? This cannot be undone.")) resetLeaderboard.mutate();
  }
  function confirmWipe() {
    if (window.confirm("Wipe every team, every score, and all team sessions? The event will close. This cannot be undone.")) wipeEvent.mutate();
  }

  return <section className="admin-dashboard">
    <div className="page-heading">
      <div><p className="eyebrow">Control room · event operations</p><h1>Keep the rally<br /><em>on course.</em></h1></div>
      <div className={`event-state ${isOpen ? "is-open" : "is-closed"}`}><span /><div><small>Event state</small><strong>{isOpen ? "Open" : "Closed"}</strong></div></div>
    </div>
    <div className="admin-overview">
      <div className="admin-actions">
        <p className="panel-label">Route control</p><h2>{isOpen ? "The route is live." : "The route is waiting."}</h2>
        <p>{isOpen ? "Teams can join and submit mission results." : "Teams cannot submit results until you open the event."}</p>
        <div className="admin-action-row">
          <button className={isOpen ? "button-secondary" : "button-primary"} onClick={() => updateEvent.mutate(!isOpen)} disabled={updateEvent.isPending}>{isOpen ? "Close event" : "Open event"}<span aria-hidden="true">→</span></button>
          <button className="button-danger" onClick={confirmReset} disabled={resetLeaderboard.isPending}>Reset leaderboard</button>
          <button className="button-danger button-wipe" onClick={confirmWipe} disabled={wipeEvent.isPending}>Wipe teams & event</button>
        </div>
        {(updateEvent.error || resetLeaderboard.error || wipeEvent.error) && <p className="error" role="alert">{(updateEvent.error ?? resetLeaderboard.error ?? wipeEvent.error)?.message}</p>}
      </div>
      <div className="admin-stat"><span>{teams.data?.length ?? "—"}</span><p>registered teams</p></div>
    </div>
    <div className="admin-grid">
      <div className="form-card create-team-card">
        <p className="form-kicker">Manual entry</p><h2>Create a team</h2>
        <form onSubmit={submitTeam}><label>Team name<input placeholder="Team name" value={teamName} onChange={(event) => setTeamName(event.target.value)} /></label><button className="button-primary" disabled={createTeam.isPending}>Create team <span aria-hidden="true">→</span></button></form>
        {createTeam.error && <p className="error" role="alert">{createTeam.error.message}</p>}
      </div>
      <div className="team-table-panel">
        <div className="panel-heading"><div><p className="form-kicker">Registry</p><h2>Teams</h2></div><span>{teams.data?.length ?? 0} total</span></div>
        {teams.isPending ? <p className="loading-copy">Loading team registry…</p> : <div className="table-scroll"><table><thead><tr><th>Team</th><th>Status</th><th>Manage</th></tr></thead><tbody>{teams.data?.map((team) => <tr key={team.id}><td><strong>{team.displayName}</strong></td><td><span className={`status-pill ${team.status === "ACTIVE" ? "is-active" : "is-inactive"}`}>{team.status.toLowerCase()}</span></td><td><button className="table-action" onClick={() => toggleTeam.mutate({ id: team.id, status: team.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })}>{team.status === "ACTIVE" ? "Deactivate" : "Activate"}</button></td></tr>)}</tbody></table></div>}
      </div>
    </div>
    <div className="admin-missions">
      <div className="form-card mission-create-card">
        <p className="form-kicker">Mission catalogue</p><h2>Add a challenge</h2>
        <form onSubmit={submitMission}>
          <label>Slug<input placeholder="for example: log-investigation" value={missionDraft.slug} onChange={(event) => setMissionDraft({ ...missionDraft, slug: event.target.value.toLowerCase() })} /></label>
          <label>Challenge title<input placeholder="Log investigation" value={missionDraft.title} onChange={(event) => setMissionDraft({ ...missionDraft, title: event.target.value })} /></label>
          <label>Short description<input placeholder="What teams will do" value={missionDraft.description} onChange={(event) => setMissionDraft({ ...missionDraft, description: event.target.value })} /></label>
          <label>Point ceiling<input type="number" min="0" max="10000" value={missionDraft.maxScore} onChange={(event) => setMissionDraft({ ...missionDraft, maxScore: Number(event.target.value) })} /></label>
          <label>Release state<select value={missionDraft.releaseState} onChange={(event) => setMissionDraft({ ...missionDraft, releaseState: event.target.value as Mission["releaseState"] })}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="CLOSED">Closed</option></select></label>
          <button className="button-primary" disabled={createMission.isPending}>Add challenge <span aria-hidden="true">→</span></button>
        </form>
        {createMission.error && <p className="error" role="alert">{createMission.error.message}</p>}
      </div>
      <div className="team-table-panel">
        <div className="panel-heading"><div><p className="form-kicker">Release control</p><h2>Challenges</h2></div><span>{missions.data?.length ?? 0} total</span></div>
        {missions.isPending ? <p className="loading-copy">Loading challenge catalogue…</p> : <div className="table-scroll"><table><thead><tr><th>Challenge</th><th>Ceiling</th><th>State</th><th>Manage</th></tr></thead><tbody>{missions.data?.map((mission) => <tr key={mission.id}><td><strong>{mission.title}</strong><br /><small>{mission.slug}</small></td><td>{mission.maxScore} pts</td><td><span className={`status-pill mission-state-${mission.releaseState.toLowerCase()}`}>{mission.releaseState.toLowerCase()}</span></td><td><button className="table-action" onClick={() => updateMission.mutate({ mission, releaseState: mission.releaseState === "PUBLISHED" ? "CLOSED" : "PUBLISHED" })}>{mission.releaseState === "PUBLISHED" ? "Close" : "Publish"}</button></td></tr>)}</tbody></table></div>}
        {updateMission.error && <p className="error" role="alert">{updateMission.error.message}</p>}
      </div>
    </div>
  </section>;
}

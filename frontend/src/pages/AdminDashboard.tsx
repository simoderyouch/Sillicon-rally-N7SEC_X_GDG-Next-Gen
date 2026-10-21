import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { api } from "../api/client";

export function AdminDashboard() {
  const token = sessionStorage.getItem("adminToken"); const queryClient = useQueryClient(); const [teamName, setTeamName] = useState("");
  const teams = useQuery({ queryKey: ["admin", "teams"], queryFn: () => api.adminTeams(token!) , enabled: Boolean(token) });
  const eventState = useQuery({ queryKey: ["admin", "event"], queryFn: () => api.eventState(token!), enabled: Boolean(token) });
  const createTeam = useMutation({ mutationFn: () => api.createTeam(token!, teamName), onSuccess: () => { setTeamName(""); queryClient.invalidateQueries({ queryKey: ["admin", "teams"] }); } });
  const toggleTeam = useMutation({ mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "INACTIVE" }) => api.updateTeam(token!, id, { status }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "teams"] }) });
  const updateEvent = useMutation({ mutationFn: (isOpen: boolean) => api.updateEventState(token!, { isOpen }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "event"] }) });
  if (!token) return <Navigate to="/admin" replace />;
  function submit(event: FormEvent) { event.preventDefault(); if (teamName.trim()) createTeam.mutate(); }
  const isOpen = eventState.data?.isOpen ?? false;
  return <section className="admin-dashboard"><div className="page-heading"><div><p className="eyebrow">Control room · event operations</p><h1>Keep the rally<br /><em>on course.</em></h1></div><div className={`event-state ${isOpen ? "is-open" : "is-closed"}`}><span /><div><small>Event state</small><strong>{isOpen ? "Open" : "Closed"}</strong></div></div></div>
    <div className="admin-overview"><div className="admin-actions"><p className="panel-label">Route control</p><h2>{isOpen ? "The route is live." : "The route is waiting."}</h2><p>{isOpen ? "Teams can join and submit mission results." : "Teams cannot submit results until you open the event."}</p><button className={isOpen ? "button-secondary" : "button-primary"} onClick={() => updateEvent.mutate(!isOpen)} disabled={updateEvent.isPending}>{isOpen ? "Close event" : "Open event"}<span aria-hidden="true">→</span></button></div><div className="admin-stat"><span>{teams.data?.length ?? "—"}</span><p>registered teams</p></div></div>
    <div className="admin-grid"><div className="form-card create-team-card"><p className="form-kicker">Manual entry</p><h2>Create a team</h2><form onSubmit={submit}><label>Team name<input placeholder="Team name" value={teamName} onChange={(e) => setTeamName(e.target.value)} /></label><button className="button-primary" disabled={createTeam.isPending}>Create team <span aria-hidden="true">→</span></button></form>{createTeam.error && <p className="error" role="alert">{createTeam.error.message}</p>}</div>
      <div className="team-table-panel"><div className="panel-heading"><div><p className="form-kicker">Registry</p><h2>Teams</h2></div><span>{teams.data?.length ?? 0} total</span></div>{teams.isPending ? <p className="loading-copy">Loading team registry…</p> : <div className="table-scroll"><table><thead><tr><th>Team</th><th>Status</th><th>Manage</th></tr></thead><tbody>{teams.data?.map((team) => <tr key={team.id}><td><strong>{team.displayName}</strong></td><td><span className={`status-pill ${team.status === "ACTIVE" ? "is-active" : "is-inactive"}`}>{team.status.toLowerCase()}</span></td><td><button className="table-action" onClick={() => toggleTeam.mutate({ id: team.id, status: team.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })}>{team.status === "ACTIVE" ? "Deactivate" : "Activate"}</button></td></tr>)}</tbody></table></div>}</div></div></section>;
}


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
  return <section><h1>Admin dashboard</h1><div className="admin-actions"><p>Event: <strong>{eventState.data?.isOpen ? "Open" : "Closed"}</strong></p><button onClick={() => updateEvent.mutate(!eventState.data?.isOpen)}>{eventState.data?.isOpen ? "Close event" : "Open event"}</button></div>
    <h2>Create team</h2><form onSubmit={submit}><label>Team name<input value={teamName} onChange={(e) => setTeamName(e.target.value)} /></label><button>Create</button></form>{createTeam.error && <p className="error">{createTeam.error.message}</p>}
    <h2>Teams</h2>{teams.isPending ? <p>Loading teams…</p> : <table><thead><tr><th>Name</th><th>Status</th><th>Action</th></tr></thead><tbody>{teams.data?.map((team) => <tr key={team.id}><td>{team.displayName}</td><td>{team.status}</td><td><button onClick={() => toggleTeam.mutate({ id: team.id, status: team.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })}>{team.status === "ACTIVE" ? "Deactivate" : "Activate"}</button></td></tr>)}</tbody></table>}</section>;
}


import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

export function AdminLogin() {
  const navigate = useNavigate(); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState("");
  async function submit(event: FormEvent) { event.preventDefault(); setError(""); try { const session = await api.adminLogin(email, password); sessionStorage.setItem("adminToken", session.token); navigate("/admin/dashboard"); } catch (cause) { setError(cause instanceof Error ? cause.message : "Login failed"); } }
  return <section className="admin-login-layout"><div className="admin-login-copy"><p className="eyebrow">Restricted route</p><h1>Control the<br /><em>rally.</em></h1><p className="lede">Manage teams, check event state, and open the route only when everything is ready.</p></div><div className="form-card admin-login-card"><p className="form-kicker">Organiser access</p><h2>Sign in to control room</h2><form onSubmit={submit}><label>Email<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label><label>Password<input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label><button className="button-primary">Sign in <span aria-hidden="true">→</span></button>{error && <p className="error" role="alert">{error}</p>}</form></div></section>;
}


import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

export function AdminLogin() {
  const navigate = useNavigate(); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState("");
  async function submit(event: FormEvent) { event.preventDefault(); setError(""); try { const session = await api.adminLogin(email, password); sessionStorage.setItem("adminToken", session.token); navigate("/admin/dashboard"); } catch (cause) { setError(cause instanceof Error ? cause.message : "Login failed"); } }
  return <section><h1>Admin sign-in</h1><form onSubmit={submit}><label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label><label>Password<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label><button>Sign in</button>{error && <p className="error">{error}</p>}</form></section>;
}


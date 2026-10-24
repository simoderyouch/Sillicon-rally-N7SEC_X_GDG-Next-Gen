import { Link, NavLink, Navigate, Route, Routes } from "react-router-dom";
import { Radio, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminLogin } from "./pages/AdminLogin";
import { GameList } from "./pages/GameList";
import { GameRunner } from "./pages/GameRunner";
import { JoinTeam } from "./pages/JoinTeam";
import { Leaderboard } from "./pages/Leaderboard";
import { getTeamSession } from "./teamSession";

export default function App() {
  const hasTeamSession = Boolean(getTeamSession());
  return (
    <main className="app-shell">
      <header className="site-header">
        <Link to="/" className="brand" aria-label="Sillicon Rally challenge home">
          <span className="brand-mark" aria-hidden="true"><Sparkles size={18} strokeWidth={2.4} /></span>
          <span><strong>Sillicon Rally</strong><em>Challenge Grid</em></span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          {hasTeamSession ? <NavLink to="/games"><Sparkles size={14} /> Games</NavLink> : <NavLink to="/play"><Sparkles size={14} /> Join challenge</NavLink>}
          <NavLink to="/leaderboard"><Trophy size={14} /> Scoreboard</NavLink>
          <NavLink to="/admin"><ShieldCheck size={14} /> Admin shell</NavLink>
        </nav>
        <span className="system-state"><Radio size={13} /> Live challenge</span>
      </header>
      <div className="route-line" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="page-content">
        <Routes>
          <Route path="/" element={<Navigate to={hasTeamSession ? "/games" : "/play"} replace />} />
          <Route path="/play" element={hasTeamSession ? <Navigate to="/games" replace /> : <JoinTeam />} />
          <Route path="/games" element={<GameList />} />
          <Route path="/games/:slug" element={<GameRunner />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </div>
      <footer className="site-footer"><span>Authorised training environment</span><span>Observe. Verify. Defend.</span></footer>
    </main>
  );
}


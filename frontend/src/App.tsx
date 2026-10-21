import { Link, NavLink, Navigate, Route, Routes } from "react-router-dom";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminLogin } from "./pages/AdminLogin";
import { GameList } from "./pages/GameList";
import { GameRunner } from "./pages/GameRunner";
import { JoinTeam } from "./pages/JoinTeam";
import { Leaderboard } from "./pages/Leaderboard";

export default function App() {
  return (
    <main className="app-shell">
      <aside className="command-rail">
        <Link to="/" className="brand" aria-label="Sillicon Rally challenge home">
          <span className="brand-mark" aria-hidden="true">N7</span>
          <span><strong>Sillicon Rally</strong><em>Challenge Grid</em></span>
        </Link>
        <div className="rail-context"><span className="rail-live-dot" />Challenge network online</div>
        <nav className="main-nav" aria-label="Main navigation">
          <NavLink to="/play">Join challenge</NavLink>
          <NavLink to="/leaderboard">Scoreboard</NavLink>
          <NavLink to="/admin">Admin shell</NavLink>
        </nav>
        <div className="rail-footer"><span>Session protocol</span><strong>Play fair · think sharp</strong></div>
      </aside>
      <div className="app-workspace">
        <header className="site-header"><span>Sillicon Rally / season grid</span><span className="system-state"><i />Challenge mode</span></header>
        <div className="route-line" aria-hidden="true"><i /><i /><i /><i /></div>
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Navigate to="/play" replace />} />
            <Route path="/play" element={<JoinTeam />} />
            <Route path="/games" element={<GameList />} />
            <Route path="/games/:slug" element={<GameRunner />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>
        </div>
        <footer className="site-footer"><span>N7SEC · authorised training environment</span><span>Observe. Verify. Defend.</span></footer>
      </div>
    </main>
  );
}


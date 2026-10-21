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
      <header className="site-header">
        <Link to="/" className="brand" aria-label="Sillicon Rally home">
          <span className="brand-mark" aria-hidden="true">SR</span>
          <span><strong>Sillicon</strong><em>Rally</em></span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <NavLink to="/play">Join rally</NavLink>
          <NavLink to="/leaderboard">Standings</NavLink>
          <NavLink to="/admin">Control room</NavLink>
        </nav>
      </header>
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
      <footer className="site-footer"><span>Sillicon Rally · live mission control</span><span>Play smart. Verify first.</span></footer>
    </main>
  );
}


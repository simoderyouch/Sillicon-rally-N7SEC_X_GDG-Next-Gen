import { Link, Navigate, Route, Routes } from "react-router-dom";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminLogin } from "./pages/AdminLogin";
import { GameList } from "./pages/GameList";
import { GameRunner } from "./pages/GameRunner";
import { JoinTeam } from "./pages/JoinTeam";
import { Leaderboard } from "./pages/Leaderboard";

export default function App() {
  return (
    <main className="app-shell">
      <header>
        <Link to="/">Sillicon Rally Next</Link>
        <nav><Link to="/play">Play</Link><Link to="/leaderboard">Leaderboard</Link><Link to="/admin">Admin</Link></nav>
      </header>
      <Routes>
        <Route path="/" element={<Navigate to="/play" replace />} />
        <Route path="/play" element={<JoinTeam />} />
        <Route path="/games" element={<GameList />} />
        <Route path="/games/:slug" element={<GameRunner />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </main>
  );
}


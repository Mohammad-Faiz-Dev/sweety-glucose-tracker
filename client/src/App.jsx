import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Readings from './pages/Readings';
import Reports from './pages/Reports';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="main">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppShell() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <nav className="nav">
        <div className="logo">Sweety</div>
        <NavLink to="/readings" className={({ isActive }) => isActive ? 'active' : ''}>Readings</NavLink>
        <NavLink to="/reports" className={({ isActive }) => isActive ? 'active' : ''}>Reports</NavLink>
        {user && <span className="user-name">{user.name}</span>}
        <button onClick={toggleTheme} title="Toggle dark/light mode" style={{ fontWeight: 600 }}>
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
        <button onClick={handleLogout}>Log out</button>
      </nav>
      <main className="main">
        <Routes>
          <Route path="/readings" element={<Protected><Readings /></Protected>} />
          <Route path="/reports" element={<Protected><Reports /></Protected>} />
          <Route path="*" element={<Navigate to="/readings" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/*" element={<AppShell />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

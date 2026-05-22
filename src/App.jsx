import { useState, useEffect } from 'react';
import Login from './components/Login';
import DashboardHome from './components/Dashboard/DashboardHome';
import { ApiService } from './services/apiService';

async function loadNavAccess(userId) {
  try {
    const res = await ApiService.getUserNavAccess(userId);
    const modules = Array.isArray(res?.modules) && res.modules.length > 0 ? res.modules : null;
    if (modules) localStorage.setItem(`nav_access_${userId}`, JSON.stringify(modules));
    return modules;
  } catch {
    try {
      const stored = localStorage.getItem(`nav_access_${userId}`);
      const parsed = stored ? JSON.parse(stored) : null;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
    } catch {
      return null;
    }
  }
}

function App() {
  const [user, setUser] = useState(null);
  const [navAccess, setNavAccess] = useState(null);
  const [isLoading, setIsLoading] = useState(() => !!localStorage.getItem('auth_token'));

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const userData = await ApiService.getMe();
          const u = userData.user || userData;
          setUser(u);
          const userId = u?.id || u?.user_id;
          if (userId) setNavAccess(await loadNavAccess(userId));
        } catch (error) {
          console.error('Session restoration failed:', error);
          localStorage.removeItem('auth_token');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = async (userData) => {
    const u = userData?.user || userData;
    const userId = u?.id || u?.user_id;
    // Fetch nav-access BEFORE setting user so the dashboard
    // renders with the correct restriction already in place (no flash).
    const access = userId ? await loadNavAccess(userId) : null;
    setNavAccess(access);
    setUser(u);
  };

  const handleLogout = () => {
    setUser(null);
    setNavAccess(null);
    localStorage.removeItem('auth_token');
  };

  if (isLoading) {
    return (
      <div className="refresher-loading-container">
        <div className="circular-loader-container">
          <div className="circular-spinner"></div>
          <div className="circular-logo-wrapper">
            <img src="/apitoria-logo.png" alt="Apitoria" className="circular-logo" />
          </div>
        </div>
        <div className="refresher-text">Initializing SOS Platform...</div>
      </div>
    );
  }

  return (
    <div className="App">
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : (
        <DashboardHome user={user} onLogout={handleLogout} navAccess={navAccess} />
      )}
    </div>
  );
}

export default App;

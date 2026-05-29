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

async function loadEquipmentAccess(userId) {
  try {
    const res = await ApiService.getAdminUserModules(userId);
    const modules = Array.isArray(res?.modules) ? res.modules : (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : null));
    if (modules) localStorage.setItem(`eq_access_${userId}`, JSON.stringify(modules));
    return modules;
  } catch {
    try {
      const stored = localStorage.getItem(`eq_access_${userId}`);
      const parsed = stored ? JSON.parse(stored) : null;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
    } catch {
      return null;
    }
  }
}

const getStoredCompanyLogo = () => {
  try {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      const u = JSON.parse(stored);
      const logo = u?.logo_url || u?.company_logo || u?.company?.logo || u?.logo || u?.company?.logo_url;
      if (logo) {
        if (logo.startsWith('http')) return logo;
        if (logo.startsWith('/uploads/logos/')) return `http://ehs.garrev.com${logo}`;
        if (logo.startsWith('uploads/logos/')) return `http://ehs.garrev.com/${logo}`;
        return `http://ehs.garrev.com/uploads/logos/${logo}`;
      }
    }
  } catch (e) {
    console.error(e);
  }
  return '/apitoria-logo.png';
};

function App() {
  const [user, setUser] = useState(null);
  const [navAccess, setNavAccess] = useState(null);
  const [equipmentAccess, setEquipmentAccess] = useState(null);
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
          if (userId) {
            setNavAccess(await loadNavAccess(userId));
            setEquipmentAccess(await loadEquipmentAccess(userId));
          }
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
    const eqAccess = userId ? await loadEquipmentAccess(userId) : null;
    setNavAccess(access);
    setEquipmentAccess(eqAccess);
    setUser(u);
  };

  const handleLogout = () => {
    setUser(null);
    setNavAccess(null);
    setEquipmentAccess(null);
    setNavAccess(null);
    localStorage.removeItem('auth_token');
  };

  if (isLoading) {
    return (
      <div className="refresher-loading-container">
        <div className="circular-loader-container">
          <div className="circular-spinner"></div>
          <div className="circular-logo-wrapper">
            <img src={getStoredCompanyLogo()} alt="Company Logo" className="circular-logo" />
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
        <DashboardHome user={user} onLogout={handleLogout} navAccess={navAccess} equipmentAccess={equipmentAccess} />
      )}
    </div>
  );
}

export default App;

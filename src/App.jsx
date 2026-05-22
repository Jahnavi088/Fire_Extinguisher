import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import DashboardHome from './components/Dashboard/DashboardHome';
import { ApiService } from './services/apiService';

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(() => !!localStorage.getItem('auth_token'));

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const userData = await ApiService.getMe();
          setUser(userData.user || userData);
        } catch (error) {
          console.error('Session restoration failed:', error);
          localStorage.removeItem('auth_token');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
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
        <DashboardHome user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;

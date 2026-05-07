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
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        background: '#0a0a0c',
        color: '#fff' 
      }}>
        <div className="loader"></div>
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

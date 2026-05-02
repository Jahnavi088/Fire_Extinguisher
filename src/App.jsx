import React, { useState } from 'react';
import Login from './components/Login';
import DashboardHome from './components/Dashboard/DashboardHome';

function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    // Expecting userData to have { username, role, ... }
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

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

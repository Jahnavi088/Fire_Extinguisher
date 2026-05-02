import React, { useState } from 'react';
import { User, Key, Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react';
import './Login.css';

import { ApiService } from '../services/apiService';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      alert("Enter username and password");
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await ApiService.login(username, password);
      setIsLoading(false);
      
      if (result && result.success) {
        onLogin(result.user);
      } else {
        alert("Invalid credentials");
      }
    } catch (error) {
      setIsLoading(false);
      alert(error.message || "An error occurred during login");
      console.error(error);
    }
  };

  return (
    <div className="login-container">
      <header className="login-header">
        <div className="header-icon">
          <ShieldCheck size={90} strokeWidth={1.5} />
        </div>
        <h1 className="header-title">SOS EMERGENCY PLATFORM</h1>
        <p className="header-subtitle">Inspection • Safety • Monitoring System</p>
      </header>

      <div className="login-card-wrapper">
        <div className="login-card">
          <h2>SYSTEM LOGIN</h2>
          
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <div className="input-field-wrapper">
                <User className="input-icon" size={20} />
                <input 
                  type="text" 
                  className="login-input" 
                  placeholder="Enter Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="input-group">
              <div className="input-field-wrapper">
                <Key className="input-icon" size={20} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="login-input" 
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </div>
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? (
                <div className="loader"></div>
              ) : (
                <>
                  <LogIn size={20} />
                  <span>LOGIN TO SYSTEM</span>
                </>
              )}
            </button>

            <div style={{ marginTop: '20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <strong>Demo Roles:</strong> superadmin, admin, user
            </div>
          </form>

          <span className="auth-notice">Authorized Access Only</span>
        </div>
      </div>
    </div>
  );
};

export default Login;

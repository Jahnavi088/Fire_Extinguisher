import React, { useState } from 'react';
import { User, Key, Eye, EyeOff, LogIn, ShieldCheck, Mail, Clipboard, CheckCircle2, ChevronRight, Lock } from 'lucide-react';
import './Login.css';
import { ApiService } from '../services/apiService';

const REGISTER_EQUIPMENTS = [
  { code: 'fire_extinguisher', name: 'Fire Extinguishers', icon: '🧯' },
  { code: 'sprinkler', name: 'Sprinkler System', icon: '🚿' },
  { code: 'fpca', name: 'Alarm Panels', icon: '🔔' },
  { code: 'hose_reel', name: 'Hose Reels', icon: '🧵' },
  { code: 'smoke_detector', name: 'Smoke Detectors', icon: '🌫️' },
  { code: 'scba', name: 'SCBA Units', icon: '🫁' },
  { code: 'ambulance', name: 'Ambulances', icon: '🚑' },
  { code: 'first_aid_kit', name: 'First Aid Kits', icon: '🏥' }
];

const DEPARTMENTS = [
  'Safety Operations',
  'Emergency Response Team',
  'Facility Maintenance',
  'QC Operations Lab',
  'Environmental Health & Safety (EHS)'
];

const Login = ({ onLogin }) => {
  const [view, setView] = useState('login'); // 'login', 'register', 'success'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // --- REGISTRATION STATE ---
  const [firstName, setFirstName] = useState('');
  const [secondName, setSecondName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [companyId, setCompanyId] = useState(21);
  const [registrationId, setRegistrationId] = useState(null);
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [department, setDepartment] = useState('');
  const [selectedEquips, setSelectedEquips] = useState([]);
  const [otpError, setOtpError] = useState('');
  const [otpSentNotice, setOtpSentNotice] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Handle Character-Only Filter for Names
  const handleNameChange = (val, setter) => {
    const filtered = val.replace(/[^a-zA-Z]/g, '');
    setter(filtered);
  };

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

  const sendOtp = async () => {
    if (!email || !email.includes('@')) {
      alert("Please enter a valid email address.");
      return;
    }
    if (!mobile || mobile.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    setIsLoading(true);
    setOtpError('');
    setOtpSentNotice('');

    try {
      const res = await ApiService.register(firstName, secondName, email, mobile, companyId);
      setIsLoading(false);
      if (res && res.success) {
        setRegistrationId(res.registration_id);
        setIsOtpSent(true);
        setOtpSentNotice(`📧 ${res.message || "OTP code sent to email and mobile!"}`);
      } else {
        setOtpError(res.message || "Failed to start registration");
      }
    } catch (err) {
      setIsLoading(false);
      setOtpError(`❌ Error: ${err.message || "Something went wrong"}`);
    }
  };

  const verifyOtp = async () => {
    if (!otp) {
      alert("Please enter the verification OTP code.");
      return;
    }
    setIsLoading(true);
    setOtpError('');

    try {
      const res = await ApiService.verifyEmailOtp(registrationId, otp);
      setIsLoading(false);
      if (res && res.success) {
        setIsOtpVerified(true);
        setOtpSentNotice(`✓ ${res.message || "Email verified successfully!"}`);
      } else {
        setOtpError(res.message || "Verification failed");
      }
    } catch (err) {
      setIsLoading(false);
      setOtpError(`❌ Error: ${err.message || "Invalid OTP code"}`);
    }
  };

  const toggleEquipment = (code) => {
    setSelectedEquips(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const submitRegistration = (e) => {
    e.preventDefault();
    if (!department) {
      alert("Please select a department.");
      return;
    }
    if (selectedEquips.length === 0) {
      alert("Please select at least one equipment module.");
      return;
    }
    setView('success');
  };

  const resetWizard = () => {
    setFirstName('');
    setSecondName('');
    setEmail('');
    setMobile('');
    setCompanyId(21);
    setRegistrationId(null);
    setOtp('');
    setIsOtpSent(false);
    setIsOtpVerified(false);
    setDepartment('');
    setSelectedEquips([]);
    setIsDropdownOpen(false);
    setView('login');
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

      <div className={`login-card-wrapper ${view === 'register' ? 'max-width-wide' : ''}`}>
        {view === 'success' ? (
          <div className="login-card success-card">
            <div className="success-icon-wrap">
              <CheckCircle2 size={80} className="success-check-icon" />
            </div>
            <h2>REQUEST SUBMITTED</h2>
            <div className="success-description-block">
              <p>Thank you, <strong>{firstName} {secondName}</strong>!</p>
              <p>Your request for department <strong>{department}</strong> and requested equipment access permissions has been logged.</p>
              <p className="success-warning-alert">📧 Account activation request is pending review. You will receive an confirmation email once your site administrator approves the access lines.</p>
            </div>

            <button type="button" className="login-btn back-login-btn" onClick={resetWizard}>
              Return to Login Screen
            </button>
          </div>
        ) : (
          <div className="login-card">
            {/* Top Tabs */}
            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab ${view === 'login' ? 'active' : ''}`}
                onClick={() => setView('login')}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-tab ${view === 'register' ? 'active' : ''}`}
                onClick={() => setView('register')}
              >
                Sign Up
              </button>
            </div>

            <p className="auth-description">
              Request access, choose your plants, and wait for admin approval
            </p>

            {view === 'login' ? (
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
              </form>
            ) : (
              <div className="wizard-step-content">
                {/* SECTION 1: Identity Names */}
                <div className="registration-section">
                  <div className="names-row">
                    <div className="input-group">
                      <label className="wizard-field-label">First Name <span className="req">*</span></label>
                      <div className="input-field-wrapper">
                        <input
                          type="text"
                          className="login-input no-left-icon"
                          placeholder="Characters only"
                          value={firstName}
                          onChange={(e) => handleNameChange(e.target.value, setFirstName)}
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <label className="wizard-field-label">Second Name <span className="req">*</span></label>
                      <div className={`input-field-wrapper ${!firstName ? 'disabled-wrapper' : ''}`}>
                        <input
                          type="text"
                          className="login-input no-left-icon"
                          placeholder="Characters only"
                          value={secondName}
                          onChange={(e) => handleNameChange(e.target.value, setSecondName)}
                          disabled={!firstName}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: Email, Mobile & Verification Lock */}
                <div className={`registration-section border-top ${(!firstName || !secondName) ? 'section-locked' : ''}`}>
                  <div className="input-group">
                    <label className="wizard-field-label">Email <span className="req">*</span></label>
                    <div className={`input-field-wrapper attached-btn-wrapper ${(!firstName || !secondName) ? 'disabled-wrapper' : ''}`}>
                      <input
                        type="email"
                        className="login-input no-left-icon"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={!firstName || !secondName || isOtpVerified}
                      />
                      <button
                        type="button"
                        className="verify-action-btn"
                        onClick={sendOtp}
                        disabled={!firstName || !secondName || isOtpVerified || isLoading || !email.includes('@')}
                      >
                        Verify
                      </button>
                    </div>
                    <div className={`auth-status-badge ${isOtpVerified ? 'verified' : 'unverified'}`}>
                      {isOtpVerified ? 'Email Verified' : 'Email Unverified'}
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="wizard-field-label">Mobile Number <span className="req">*</span></label>
                    <div className={`input-field-wrapper prefix-wrapper attached-btn-wrapper ${(!firstName || !secondName) ? 'disabled-wrapper' : ''}`}>
                      <span className="mobile-prefix-box">+91</span>
                      <input
                        type="tel"
                        className="login-input prefix-padding"
                        placeholder="10-digit number"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, ''))}
                        maxLength="10"
                        disabled={!firstName || !secondName || isOtpVerified}
                      />
                      <button
                        type="button"
                        className="verify-action-btn"
                        onClick={sendOtp}
                        disabled={!firstName || !secondName || isOtpVerified || isLoading || mobile.length < 10}
                      >
                        Verify
                      </button>
                    </div>
                    <div className={`auth-status-badge ${isOtpVerified ? 'verified' : 'unverified'}`}>
                      {isOtpVerified ? 'Mobile Verified' : 'Mobile Unverified'}
                    </div>
                  </div>

                  {firstName && secondName && isOtpSent && !isOtpVerified && (
                    <div className="input-group wizard-otp-group inline-otp-box">
                      <label className="wizard-field-label">Verification OTP Code <span className="req">*</span></label>
                      <div className="input-field-wrapper attached-btn-wrapper">
                        <Key className="input-icon" size={18} />
                        <input
                          type="text"
                          className="login-input"
                          placeholder="Enter 6-digit OTP code"
                          maxLength="6"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                        />
                        <button
                          type="button"
                          className="verify-action-btn active"
                          onClick={verifyOtp}
                          disabled={isLoading || otp.length < 4}
                        >
                          Confirm
                        </button>
                      </div>
                      {otpSentNotice && <div className="otp-success-banner">{otpSentNotice}</div>}
                      {otpError && <div className="otp-error-banner">{otpError}</div>}
                    </div>
                  )}
                </div>

                {/* SECTION 3: Department & Equipment Checklist Lock */}
                {isOtpVerified && (
                  <>
                    <div className="registration-section border-top reveal-animation">
                      <div className="input-group">
                        <label className="wizard-field-label">Select Department <span className="req">*</span></label>
                        <div className="input-field-wrapper">
                          <Clipboard className="input-icon" size={20} />
                          <select
                            className="login-input login-select"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                          >
                            <option value="">Choose Department</option>
                            {DEPARTMENTS.map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="input-group">
                        <label className="wizard-field-label">Select Safety Equipment <span className="req">*</span></label>
                        <div className="equip-dropdown-container">
                          <button
                            type="button"
                            className="login-input equip-dropdown-trigger"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          >
                            <ShieldCheck className="input-icon" size={20} />
                            <span className="trigger-text">
                              {selectedEquips.length === 0
                                ? "Select Safety Equipment..."
                                : `${selectedEquips.length} equipment(s) selected`}
                            </span>
                            <span className="arrow-icon">{isDropdownOpen ? '▲' : '▼'}</span>
                          </button>

                          {isDropdownOpen && (
                            <div className="equip-dropdown-panel">
                              {REGISTER_EQUIPMENTS.map(eq => {
                                const checked = selectedEquips.includes(eq.code);
                                return (
                                  <label key={eq.code} className="dropdown-checkbox-item">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => toggleEquipment(eq.code)}
                                    />
                                    <span className="eq-label-text">{eq.name}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="login-btn submit-approval-btn reveal-animation"
                      onClick={submitRegistration}
                      disabled={!department || selectedEquips.length === 0}
                    >
                      <CheckCircle2 size={20} />
                      <span>Send for Approval</span>
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="auth-footer">
              {view === 'login' ? (
                <>
                  <span className="auth-notice">Authorized Access Only</span>
                  <button className="auth-switch-link" onClick={() => setView('register')}>
                    Need an account? Sign Up
                  </button>
                </>
              ) : (
                <>
                  <span className="auth-notice">
                    Already have an account?{' '}
                    <button type="button" className="auth-inline-link" onClick={resetWizard}>
                      Sign In
                    </button>
                  </span>
                </>
              )}
              <span className="auth-copyright">SafeHydra © 2026</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;

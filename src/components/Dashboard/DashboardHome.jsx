import React from 'react';
import SafetyDashboard from './SafetyDashboard';

const DashboardHome = ({ user, onLogout }) => {
  return (
    <SafetyDashboard user={user} onLogout={onLogout} />
  );
};

export default DashboardHome;

import React from 'react';
import SafetyDashboard from './SafetyDashboard';

const DashboardHome = ({ user, onLogout, navAccess }) => {
  return (
    <SafetyDashboard user={user} onLogout={onLogout} navAccess={navAccess} />
  );
};

export default DashboardHome;

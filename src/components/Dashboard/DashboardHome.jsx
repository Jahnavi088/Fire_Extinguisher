import React from 'react';
import SafetyDashboard from './SafetyDashboard';

const DashboardHome = ({ user, onLogout, navAccess, equipmentAccess }) => {
  return (
    <SafetyDashboard user={user} onLogout={onLogout} navAccess={navAccess} equipmentAccess={equipmentAccess} />
  );
};

export default DashboardHome;

import { useState } from 'react';

const Sidebar = ({ navCollapsed, setNavCollapsed, activePage, setActivePage, handleLogout }) => {
  const [usersOpen, setUsersOpen] = useState(false);

  return (
    <div className={`sidebar ${navCollapsed ? 'collapsed' : ''}`}>
      <div className="sb-header" style={{ justifyContent: navCollapsed ? 'center' : 'space-between' }}>
        {!navCollapsed && (
          <div className="topbar-logo-pill" style={{ margin: '0' }}>
            <img
              src="/apitoria-logo.png"
              alt="Apitoria"
              className="topbar-logo"
            />
          </div>
        )}
        {navCollapsed && (
          <div className="topbar-logo-pill" style={{ width: '38px', height: '38px', padding: '4px' }}>
            <img
              src="/apitoria-logo.png"
              alt="Logo"
              style={{ height: '26px', width: '26px', objectFit: 'contain', display: 'block', margin: 'auto' }}
            />
          </div>
        )}
        <button
          className="sidenav-toggle-btn"
          onClick={() => setNavCollapsed(!navCollapsed)}
          title={navCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{ marginLeft: navCollapsed ? '0' : '8px' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      <div className="sb-scroll">
        {!navCollapsed && <div className="sb-section-label">Main</div>}

        <div className={`cat-header ${activePage === 'grid' ? 'active' : ''}`} onClick={() => setActivePage('grid')}>
          <span className="sidenav-icon">📊</span>
          {!navCollapsed && <span className="cat-name">Overview</span>}
          {navCollapsed && <div className="sidenav-tip">Overview</div>}
        </div>

        <div className={`cat-header ${activePage === 'fire-stats' ? 'active' : ''}`} onClick={() => setActivePage('fire-stats')}>
          <span className="sidenav-icon">📋</span>
          {!navCollapsed && <span className="cat-name">Reports</span>}
          {navCollapsed && <div className="sidenav-tip">Reports</div>}
        </div>

        <div className={`cat-header ${usersOpen ? 'active' : ''}`} onClick={() => setUsersOpen(!usersOpen)}>
          <span className="sidenav-icon">👥</span>
          {!navCollapsed && <span className="cat-name">Users</span>}
          {navCollapsed && <div className="sidenav-tip">Users</div>}
        </div>

        <div className={`sb-submenu ${usersOpen && !navCollapsed ? 'open' : ''}`}>
          <div className={`sb-sub-item ${activePage === 'users-manage' ? 'active' : ''}`} onClick={() => setActivePage('users-manage')}>
            <span className="sb-sub-icon">➕</span>
            <span className="sb-sub-text">Manage</span>
          </div>
          <div className={`sb-sub-item ${activePage === 'users-equipment-access' ? 'active' : ''}`} onClick={() => setActivePage('users-equipment-access')}>
            <span className="sb-sub-icon">🔐</span>
            <span className="sb-sub-text">Equipment Access</span>
          </div>
        </div>

        <div className="sidenav-divider"></div>
        {!navCollapsed && <div className="sb-section-label">Operations</div>}

        <div className="cat-header" onClick={() => { }}>
          <span className="sidenav-icon">🚨</span>
          {!navCollapsed && <span className="cat-name">Incidents</span>}
          {!navCollapsed && <span className="sidenav-badge">NEW</span>}
          {navCollapsed && <div className="sidenav-tip">Incidents</div>}
        </div>


        <div className="cat-header" onClick={() => { }}>
          <span className="sidenav-icon">📅</span>
          {!navCollapsed && <span className="cat-name">Planning</span>}
          {navCollapsed && <div className="sidenav-tip">Planning</div>}
        </div>

        <div className="cat-header" onClick={() => { }}>
          <span className="sidenav-icon">📈</span>
          {!navCollapsed && <span className="cat-name">Analytics</span>}
          {navCollapsed && <div className="sidenav-tip">Analytics</div>}
        </div>

        <div className="cat-header" onClick={() => { }}>
          <span className="sidenav-icon">📚</span>
          {!navCollapsed && <span className="cat-name">Training</span>}
          {!navCollapsed && <span className="sidenav-badge">NEW</span>}
          {navCollapsed && <div className="sidenav-tip">Training</div>}
        </div>

        <div className="cat-header" onClick={() => { }}>
          <span className="sidenav-icon">⚠️</span>
          {!navCollapsed && <span className="cat-name">Risk Register</span>}
          {navCollapsed && <div className="sidenav-tip">Risk Register</div>}
        </div>

        <div className="sidenav-divider"></div>
        {!navCollapsed && <div className="sb-section-label">System</div>}

        <div className="cat-header" onClick={() => { }}>
          <span className="sidenav-icon">⚙️</span>
          {!navCollapsed && <span className="cat-name">Settings</span>}
          {navCollapsed && <div className="sidenav-tip">Settings</div>}
        </div>
      </div>

      <div className="sb-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {!navCollapsed && 'Logout'}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

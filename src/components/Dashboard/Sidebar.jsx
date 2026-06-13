import { useState } from 'react';

const NAV_GROUPS = [
  {
    label: 'Main Dashboard',
    items: [
      {
        code: 'overview',
        page: 'grid',
        label: 'Overview',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Field Operations',
    items: [
      {
        code: 'reports',
        page: 'reports',
        label: 'Service Reports',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        ),
      },

      {
        code: 'pending_updates',
        page: 'pending-updates',
        label: 'Pending Approvals',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
        ),
      },
      {
        code: 'auto_scheduler',
        page: 'auto-scheduler',
        label: 'Auto-Scheduler',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'System & Security',
    items: [
      {
        code: 'audit_logs',
        page: 'audit-logs',
        label: 'Audit Logs',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        ),
      },
    ],
  },
];

const Sidebar = ({ navCollapsed, setNavCollapsed, activePage, setActivePage, handleLogout, user }) => {
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);

  const userInitial = (user?.name || user?.username || 'A').charAt(0).toUpperCase();
  const userName = user?.name || user?.username || 'Admin User';
  const ROLE_LABELS = {
    superadmin: 'Super Admin',
    admin: 'Admin',
    agm: 'Asst. General Manager',
    supervisor: 'Supervisor',
    user: 'Inspector',
    inspector: 'Inspector',
  };
  const userRole = ROLE_LABELS[user?.role] || user?.role || 'Safety Officer';

  return (
    <aside className={`sidebar ${navCollapsed ? 'collapsed' : ''}`}>
      <div className="sb-header" style={{ justifyContent: navCollapsed ? 'center' : 'space-between' }}>
        {!navCollapsed ? (
          <div className="topbar-logo-pill" style={{ margin: '0' }}>
            <img src="/images/eltrive.png" alt="Apitoria" className="topbar-logo" />
          </div>
        ) : (
          <div className="topbar-logo-pill" style={{ width: '40px', height: '40px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/images/eltrive.png" alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block', margin: 'auto', mixBlendMode: 'multiply' }} />
          </div>
        )}
        <button className="sidenav-toggle-btn" onClick={() => setNavCollapsed(!navCollapsed)} title={navCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} style={{ marginLeft: navCollapsed ? '0' : '8px' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      <div className="sb-scroll">
        {NAV_GROUPS.map(group => (
          <div className="sb-nav-group" key={group.label}>
            {!navCollapsed && <div className="nav-section-label">{group.label}</div>}
            {group.items.map(item => (
              <div
                key={item.code}
                className={`nav-item ${activePage === item.page ? 'active' : ''}`}
                onClick={() => setActivePage(item.page)}
              >
                <div className="nav-left">
                  <span className="nav-icon">{item.icon}</span>
                  {!navCollapsed && (
                    <span className="nav-label">
                      {item.label}
                      {item.badge > 0 && (
                        <span style={{ fontSize: '11px', opacity: 0.7, marginLeft: '6px' }}>
                          ({item.badge})
                        </span>
                      )}
                    </span>
                  )}
                </div>
                {navCollapsed && <div className="sidenav-tip">{item.label}</div>}
              </div>
            ))}
          </div>
        ))}

        {/* Management section with dropdowns */}
        <div className="sb-nav-group">
          {!navCollapsed && <div className="nav-section-label">Management</div>}


          {/* Setup dropdown */}
          <div className={`nav-item dropdown-toggle ${setupOpen ? 'open' : ''}`} onClick={e => { e.stopPropagation(); setSetupOpen(!setupOpen); }}>
            <div className="nav-left">
              <span className="nav-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </span>
              {!navCollapsed && <span className="nav-label">Setup</span>}
            </div>
            {!navCollapsed && (
              <svg className={`nav-chevron ${setupOpen ? 'rotated' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            )}
          </div>
          <div className={`nav-submenu ${setupOpen && !navCollapsed ? 'open' : ''}`}>
            <div className={`nav-submenu-item ${activePage === 'setup-onboarding' ? 'active' : ''}`} onClick={() => setActivePage('setup-onboarding')}>
              <span className="nav-icon-small">🚀</span>
              <span className="nav-label-small">Onboarding</span>
            </div>
            {user?.role === 'superadmin' && (
              <div className={`nav-submenu-item ${activePage === 'setup-company' ? 'active' : ''}`} onClick={() => setActivePage('setup-company')}>
                <span className="nav-icon-small">🏢</span>
                <span className="nav-label-small">Add Company</span>
              </div>
            )}
            <div className={`nav-submenu-item ${activePage === 'setup-operator-mapping' ? 'active' : ''}`} onClick={() => setActivePage('setup-operator-mapping')}>
              <span className="nav-icon-small">🗺️</span>
              <span className="nav-label-small">Operator Mapping</span>
            </div>
            {(user?.role === 'admin' || user?.role === 'superadmin') && (
              <div className={`nav-submenu-item ${activePage === 'locations-table' ? 'active' : ''}`} onClick={() => setActivePage('locations-table')}>
                <span className="nav-icon-small">📍</span>
                <span className="nav-label-small">Locations</span>
              </div>
            )}
          </div>

          {/* Users dropdown */}
          <div className={`nav-item dropdown-toggle ${usersOpen ? 'open' : ''}`} onClick={e => { e.stopPropagation(); setUsersOpen(!usersOpen); }}>
            <div className="nav-left">
              <span className="nav-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </span>
              {!navCollapsed && <span className="nav-label">Users</span>}
            </div>
            {!navCollapsed && (
              <svg className={`nav-chevron ${usersOpen ? 'rotated' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            )}
          </div>
          <div className={`nav-submenu ${usersOpen && !navCollapsed ? 'open' : ''}`}>
            <div className={`nav-submenu-item ${activePage === 'users-manage' ? 'active' : ''}`} onClick={() => setActivePage('users-manage')}>
              <span className="nav-icon-small">👤</span>
              <span className="nav-label-small">Manage Users</span>
            </div>
            <div className={`nav-submenu-item ${activePage === 'users-equipment-access' ? 'active' : ''}`} onClick={() => setActivePage('users-equipment-access')}>
              <span className="nav-icon-small">🔑</span>
              <span className="nav-label-small">Equipment Access</span>
            </div>
          </div>
        </div>
      </div>

      <div className="sb-footer">
        <div className="sb-user-section">
          <div className="sb-user-avatar">{userInitial}</div>
          {!navCollapsed && (
            <div className="sb-user-info">
              <div className="sb-user-name">{userName}</div>
              <div className="sb-user-role">{userRole}</div>
            </div>
          )}
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {!navCollapsed && 'Logout'}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

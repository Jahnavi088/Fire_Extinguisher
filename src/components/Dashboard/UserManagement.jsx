import { useState, useEffect, useReducer, useMemo } from 'react';
import { ApiService } from '../../services/apiService';
import './UserManagement.css';

const NAV_MODULES = [
  // --- MAIN ---
  { code: 'overview', label: 'Overview', icon: '🏠', category: 'Main' },

  // --- OPERATIONS ---
  { code: 'reports', label: 'Service Reports', icon: '📄', category: 'Operations' },
  { code: 'work_orders', label: 'Work Orders', icon: '🔧', category: 'Operations' },
  { code: 'pending_updates', label: 'Pending Approvals', icon: '⏳', category: 'Operations' },
  { code: 'auto_scheduler', label: 'Auto-Scheduler', icon: '📅', category: 'Operations' },

  // --- SYSTEM & SECURITY ---
  { code: 'audit_logs', label: 'Audit Logs', icon: '📝', category: 'System & Security' },
  { code: 'device_monitoring', label: 'Device Monitoring', icon: '🖥️', category: 'System & Security' },

  // --- EQUIPMENT MODULES ---
  { code: 'fire_extinguisher', label: 'Fire Extinguishers', icon: '🧯', category: 'Modules' },
  { code: 'hose_reel', label: 'Hose Reels', icon: '🧵', category: 'Modules' },
  { code: 'sprinkler', label: 'Sprinklers', icon: '🚿', category: 'Modules' },
  { code: 'hydrant', label: 'Fire Hydrants', icon: '🚒', category: 'Modules' },
  { code: 'fpca', label: 'Alarm Panels', icon: '🔔', category: 'Modules' },
  { code: 'smoke_detector', label: 'Smoke Detectors', icon: '🌫️', category: 'Modules' },
  { code: 'heat_detector', label: 'Heat Detectors', icon: '🌡️', category: 'Modules' },
  { code: 'fire_trolley', label: 'Fire Trolleys', icon: '🛒', category: 'Modules' },
  { code: 'emergency_door', label: 'Emergency Exits', icon: '🚪', category: 'Modules' },
  { code: 'emergency_light', label: 'Emergency Lighting', icon: '🔦', category: 'Modules' },
  { code: 'pa_system', label: 'PA Systems', icon: '📢', category: 'Modules' },
  { code: 'wind_sock', label: 'Wind Socks', icon: '📍', category: 'Modules' },
  { code: 'scba', label: 'SCBA Units', icon: '🫁', category: 'Modules' },
  { code: 'ambulance', label: 'Ambulances', icon: '🚑', category: 'Modules' },
  { code: 'first_aid_kit', label: 'First Aid Kits', icon: '🏥', category: 'Modules' },
  { code: 'eyewash_station', label: 'Eye Wash Stations', icon: '👀', category: 'Modules' },
  { code: 'spill_kit', label: 'Spill Kits', icon: '⚗️', category: 'Modules' },
  { code: 'chemical_shower', label: 'Chemical Showers', icon: '🚿', category: 'Modules' },
  { code: 'ppe_station', label: 'PPE Stations', icon: '🦺', category: 'Modules' },
  { code: 'suppression_system', label: 'CO2 Systems', icon: '💨', category: 'Modules' },
  { code: 'safety_signage', label: 'Safety Signage', icon: '⚠️', category: 'Modules' },
  { code: 'emergency_comm', label: 'Emergency Comms', icon: '📞', category: 'Modules' },
  { code: 'fire_blanket', label: 'Fire Blankets', icon: '🧲', category: 'Modules' },
  { code: 'muster_point', label: 'Muster Points', icon: '📌', category: 'Modules' },

  // --- SETUP ---
  { code: 'add_company', label: 'Add Company', icon: '🏢', category: 'Setup' },
  { code: 'add_equipment', label: 'Onboarding', icon: '🚀', category: 'Setup' },

  // --- USERS ---
  { code: 'user_manage', label: 'Manage Users', icon: '👥', category: 'Users' },
  { code: 'equipment_access', label: 'Equipment Access', icon: '🔐', category: 'Users' },
];
const NAV_CATEGORIES = ['Main', 'Operations', 'System & Security', 'Modules', 'Setup', 'Users'];

const ROLE_CONFIG = {
  superadmin: { label: 'Superadmin', color: '#5fd3f3', bg: 'rgba(95,211,243,0.18)' },
  admin: { label: 'Admin', color: '#FFD700', bg: 'rgba(255,215,0,0.18)' },
  inspector: { label: 'Inspector', color: '#FF9800', bg: 'rgba(255,152,0,0.18)' },
  user: { label: 'User', color: '#a0cfe8', bg: 'rgba(160,207,232,0.14)' },
};

const getRoleConf = (role) => ROLE_CONFIG[(role || '').toLowerCase()] || ROLE_CONFIG.user;

const EMPTY_FORM = { name: '', username: '', email: '', password: '', role: 'user', status: 'active', company_id: '' };
const PAGE_SIZE = 10;

function fetchReducer(state, action) {
  switch (action.type) {
    case 'loading': return { ...state, loading: true, error: null };
    case 'success': return { loading: false, error: null, users: action.users };
    case 'error': return { loading: false, error: action.error, users: [] };
    default: return state;
  }
}

const UserManagement = ({ onBack }) => {
  const [fetchState, dispatch] = useReducer(fetchReducer, { loading: true, error: null, users: [] });
  const { loading, error, users } = fetchState;

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [viewUser, setViewUser] = useState(null);
  const [modLoading, setModLoading] = useState(false);
  const [moduleChecks, setModuleChecks] = useState({});
  const [modSaving, setModSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    let active = true;
    dispatch({ type: 'loading' });

    ApiService.getAdminCompanies()
      .then(data => {
        if (active) setCompanies(Array.isArray(data) ? data : (data?.companies || data?.data || []));
      })
      .catch(() => { if (active) setCompanies([]); });

    ApiService.getAdminUsers()
      .then(data => {
        if (!active) return;
        const list = Array.isArray(data) ? data : (data?.users || data?.data || []);
        dispatch({ type: 'success', users: list });
      })
      .catch(err => {
        if (!active) return;
        dispatch({ type: 'error', error: err.message || 'Failed to load users' });
      });
    return () => { active = false; };
  }, [refreshKey]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      (u.name || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    );
  }, [users, search]);

  useEffect(() => { setPage(1); }, [search]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const pagedUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);


  const openAdd = () => { setEditUser(null); setForm(EMPTY_FORM); setFormError(''); setShowForm(true); };

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete user "${u.name || u.username}"? This cannot be undone.`)) return;
    try {
      await ApiService.deleteAdminUser(u.id);
      setRefreshKey(k => k + 1);
    } catch (err) {
      alert(err.message || 'Failed to delete user.');
    }
  };

  const openEdit = async (u) => {
    setEditUser(u);
    setForm({
      name: u.name || '',
      username: u.username || '',
      email: u.email || '',
      password: '',
      role: u.role || 'user',
      status: u.status || 'active',
      company_id: u.company_id || ''
    });
    setFormError('');
    setShowForm(true);

    try {
      const fullUser = await ApiService.getAdminUserById(u.id);
      const actualUser = fullUser.user || fullUser.data || fullUser;
      setForm({
        name: actualUser.name || '',
        username: actualUser.username || '',
        email: actualUser.email || '',
        password: '',
        role: actualUser.role || 'user',
        status: actualUser.status || 'active',
        company_id: actualUser.company_id || ''
      });
    } catch (err) {
      console.error('Failed to fetch full user details:', err);
    }
  };

  const openViewModules = (u) => {
    setViewUser(u);
    setModLoading(true);

    ApiService.getUserNavAccess(u.id)
      .then(res => {
        const modules = Array.isArray(res?.modules) && res.modules.length > 0 ? res.modules : null;
        if (modules) {
          const checks = {};
          NAV_MODULES.forEach(m => {
            checks[m.code] = modules.includes(m.code);
          });
          setModuleChecks(checks);
        } else {
          // Fallback to legacy getAdminUserModules
          return ApiService.getAdminUserModules(u.id)
            .then(data => {
              const legacyList = Array.isArray(data) ? data : (data?.modules || data?.data || []);
              const apiCodes = new Set(legacyList.map(m => m.code || m.module_code || ''));
              const hasNavCodes = NAV_MODULES.some(m => apiCodes.has(m.code));
              if (hasNavCodes) {
                const checks = {};
                NAV_MODULES.forEach(m => { checks[m.code] = apiCodes.has(m.code); });
                setModuleChecks(checks);
              } else {
                const defaults = {};
                NAV_MODULES.forEach(m => { defaults[m.code] = true; });
                setModuleChecks(defaults);
              }
            });
        }
      })
      .catch(() => {
        // Fallback to local storage
        const stored = localStorage.getItem(`nav_access_${u.id}`);
        try {
          const parsed = stored ? JSON.parse(stored) : null;
          if (Array.isArray(parsed)) {
            const checks = {};
            NAV_MODULES.forEach(m => { checks[m.code] = parsed.includes(m.code); });
            setModuleChecks(checks);
            return;
          }
        } catch { }
        // Default to all true if no config exists
        const defaults = {};
        NAV_MODULES.forEach(m => { defaults[m.code] = true; });
        setModuleChecks(defaults);
      })
      .finally(() => setModLoading(false));
  };

  const handleModuleToggle = (code) => {
    setModuleChecks(prev => ({ ...prev, [code]: !prev[code] }));
  };

  const saveModuleAccess = async () => {
    if (!viewUser) return;
    setModSaving(true);
    try {
      const userId = viewUser.id || viewUser.user_id || viewUser.username;
      // Build an array of enabled module codes (matches API format)
      const enabledCodes = NAV_MODULES.filter(m => moduleChecks[m.code]).map(m => m.code);

      await ApiService.updateUserNavAccess(userId, enabledCodes);
      localStorage.setItem(`nav_access_${userId}`, JSON.stringify(enabledCodes));
    } catch (err) {
      console.error('Failed to save nav access via API, falling back to localStorage:', err);
      // Fallback: still save locally so it works offline
      const userId = viewUser.id || viewUser.user_id || viewUser.username;
      const enabledCodes = NAV_MODULES.filter(m => moduleChecks[m.code]).map(m => m.code);
      localStorage.setItem(`nav_access_${userId}`, JSON.stringify(enabledCodes));
    } finally {
      setModSaving(false);
      setViewUser(null);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.username.trim()) { setFormError('Name and Username are required.'); return; }
    if (!editUser && !form.password.trim()) { setFormError('Password is required for new users.'); return; }
    setSaving(true); setFormError('');
    try {
      if (editUser) {
        const payload = { name: form.name, email: form.email, role: form.role, status: form.status, company_id: form.company_id };
        if (form.password.trim()) payload.password = form.password;
        await ApiService.updateAdminUser(editUser.id, payload);
      } else {
        await ApiService.createAdminUser({
          name: form.name,
          username: form.username,
          email: form.email,
          password: form.password,
          role: form.role,
          status: form.status,
          company_id: form.company_id
        });
      }
      setShowForm(false);
      setRefreshKey(k => k + 1);
    } catch (err) {
      setFormError(err.message || 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="setup-page">
      {/* Header */}
      <div className="setup-header">
        <button className="setup-back-btn" onClick={onBack} title="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="setup-header-info" style={{ flex: 1 }}>

          <div>
            <div className="setup-title">User Management</div>

          </div>
        </div>
        <div className="um-search-wrap">
          <svg className="um-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            className="um-search"
            placeholder="Search by name, username, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="um-search-clear" onClick={() => setSearch('')}>×</button>}
        </div>
        <button className="um-add-btn" onClick={openAdd}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" /><line x1="16" y1="11" x2="22" y2="11" />
          </svg>
          Add User
        </button>
      </div>


      {/* Content */}
      <div className="um-content-wrap">
        {loading ? (
          <div className="um-state-block"><div className="um-spinner" /><span>Loading users...</span></div>
        ) : error ? (
          <div className="um-state-block um-error-block">
            <span>⚠️ {error}</span>
            <button className="um-retry-btn" onClick={() => setRefreshKey(k => k + 1)}>Retry</button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="um-state-block">
            <span className="um-empty-icon">👤</span>
            <p>{search ? 'No users match your search.' : 'No users found. Click "Add User" to get started.'}</p>
          </div>
        ) : (
          <>
            <table className="um-table">
              <thead>
                <tr>
                  <th className="um-th-num">#</th>
                  <th>User</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="um-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedUsers.map((u, idx) => {
                  const rc = getRoleConf(u.role);
                  return (
                    <tr key={u.id || idx}>
                      <td className="um-td-num">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                      <td>
                        <div className="um-user-cell">
                          <div className="um-avatar" style={{ background: rc.bg, color: rc.color }}>
                            {(u.name || u.username || '?').charAt(0).toUpperCase()}
                          </div>
                          <span className="um-name">{u.name || u.username || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="um-mono">{u.username || '—'}</td>
                      <td className="um-email">{u.email || '—'}</td>
                      <td>
                        <span className="um-role-badge" style={{ color: rc.color, background: rc.bg, borderColor: rc.color + '44' }}>
                          {rc.label}
                        </span>
                      </td>
                      <td>
                        <span className={`um-status ${u.status === 'inactive' ? 'inactive' : 'active'}`}>
                          <span className="um-status-dot" />
                          {u.status === 'inactive' ? 'Inactive' : 'Active'}
                        </span>
                      </td>
                      <td>
                        <div className="um-actions">
                          <button className="um-action-btn edit" onClick={() => openEdit(u)} title="Edit user">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button className="um-action-btn modules" onClick={() => openViewModules(u)} title="Manage access">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                          </button>
                          <button className="um-action-btn delete" onClick={() => handleDelete(u)} title="Delete user">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6" /><path d="M14 11v6" />
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="um-pagination">
                <button className="um-pg-btn" onClick={() => setPage(1)} disabled={page === 1}>«</button>
                <button className="um-pg-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
                <span className="um-pg-info">Page {page} of {totalPages}</span>
                <button className="um-pg-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
                <button className="um-pg-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="um-overlay" onClick={() => setShowForm(false)}>
          <div className="um-modal" onClick={e => e.stopPropagation()}>
            <div className="um-modal-head">
              <div className="um-modal-title">
                {editUser ? (
                  <>
                    <div className="um-avatar-sm" style={{ background: getRoleConf(editUser.role).bg, color: getRoleConf(editUser.role).color }}>
                      {(editUser.name || editUser.username || '?').charAt(0).toUpperCase()}
                    </div>
                    Edit User
                  </>
                ) : <><span style={{ fontSize: 20 }}>👤</span> Add New User</>}
              </div>
              <button className="um-modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <div className="um-modal-body">
              {formError && <div className="um-form-error">⚠️ {formError}</div>}
              <div className="um-form-grid">
                <div className="um-form-field">
                  <label>Full Name <span className="um-req">*</span></label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. John Doe" />
                </div>
                <div className="um-form-field">
                  <label>Username <span className="um-req">*</span></label>
                  <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="e.g. johndoe" disabled={!!editUser} style={editUser ? { opacity: 0.5, cursor: 'not-allowed' } : {}} />
                </div>
                <div className="um-form-field">
                  <label>Email Address</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@company.com" />
                </div>
                <div className="um-form-field">
                  <label>{editUser ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                  <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder={editUser ? '••••••••' : 'Enter password'} />
                </div>
                <div className="um-form-field">
                  <label>Role</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                    <option value="superadmin">Superadmin</option>
                    <option value="admin">Admin</option>
                    <option value="inspector">Inspector</option>
                    <option value="user">User</option>
                  </select>
                </div>
                <div className="um-form-field">
                  <label>Assign Company</label>
                  <select value={form.company_id} onChange={e => setForm(f => ({ ...f, company_id: e.target.value }))}>
                    <option value="">No Company</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="um-form-field">
                  <label>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="um-modal-foot">
              <button className="um-btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="um-btn-save" onClick={handleSave} disabled={saving}>
                {saving ? <><div className="um-btn-spinner" /> Saving...</> : (editUser ? 'Update User' : 'Create User')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modules Modal */}
      {viewUser && (
        <div className="um-overlay" onClick={() => setViewUser(null)}>
          <div className="um-modal um-modules-modal" onClick={e => e.stopPropagation()}>
            <div className="um-modal-head">
              <div className="um-modal-title">
                <div className="um-avatar-sm" style={{ background: getRoleConf(viewUser.role).bg, color: getRoleConf(viewUser.role).color }}>
                  {(viewUser.name || viewUser.username || '?').charAt(0).toUpperCase()}
                </div>
                {viewUser.name || viewUser.username} — Modules
              </div>
              <button className="um-modal-close" onClick={() => setViewUser(null)}>×</button>
            </div>
            <div className="um-modal-body">
              {modLoading ? (
                <div className="um-state-block"><div className="um-spinner" /><span>Loading modules...</span></div>
              ) : (
                <div className="um-modules-list">
                  {NAV_CATEGORIES.map(cat => (
                    <div key={cat} className="um-module-category">
                      <div className="um-module-cat-label">{cat}</div>
                      <div className={`um-module-items-wrapper ${cat === 'Modules' ? 'multi-col-grid' : 'single-col-list'}`}>
                        {NAV_MODULES.filter(m => m.category === cat).map(m => (
                          <label
                            key={m.code}
                            className={`um-module-item${moduleChecks[m.code] ? ' assigned' : ''}`}
                            onClick={() => handleModuleToggle(m.code)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="um-mod-check-wrap">
                              <input
                                type="checkbox"
                                className="um-mod-checkbox"
                                checked={moduleChecks[m.code] || false}
                                onChange={() => handleModuleToggle(m.code)}
                                onClick={e => e.stopPropagation()}
                              />
                              <div className="um-mod-label">
                                <span className="um-module-emoji">{m.icon}</span>
                                <span className="um-module-name">{m.label}</span>
                              </div>
                            </div>
                            {moduleChecks[m.code] && (
                              <span className="um-mod-status-tag">Enabled</span>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="um-modal-foot">
              <button className="um-btn-cancel" onClick={() => setViewUser(null)}>Cancel</button>
              <button className="um-btn-save" onClick={saveModuleAccess} disabled={modSaving}>
                {modSaving ? <><div className="um-btn-spinner" /> Saving...</> : 'Save Access'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

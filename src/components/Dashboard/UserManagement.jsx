import { useState, useEffect, useReducer, useMemo } from 'react';
import { ApiService } from '../../services/apiService';
import './UserManagement.css';

const MODULE_EMOJI = {
  fire_extinguisher: '🧯', sprinkler: '🚿', fpca: '🔔', hose_reel: '🧵',
  hydrant: '🚒', drum_hose: '🛢️', fire_trolley: '🛒', suppression_system: '💨',
  fire_blanket: '🧺', smoke_detector: '🌫️', pa_system: '📢', scba: '🫁',
  ambulance: '🚑', first_aid_kit: '🏥', safety_shower: '🚰', eyewash_station: '👀',
  chemical_shower: '🚿', ppe_station: '🦺', fire_brigade: '👨‍🚒', wind_sock: '📍',
};

const ROLE_CONFIG = {
  superadmin: { label: 'Superadmin', color: '#5fd3f3', bg: 'rgba(95,211,243,0.15)' },
  admin: { label: 'Admin', color: '#FFD700', bg: 'rgba(255,215,0,0.15)' },
  inspector: { label: 'Inspector', color: '#FF9800', bg: 'rgba(255,152,0,0.15)' },
  user: { label: 'User', color: '#aaaaaa', bg: 'rgba(170,170,170,0.12)' },
};

const getRoleConf = (role) => ROLE_CONFIG[(role || '').toLowerCase()] || ROLE_CONFIG.user;

const EMPTY_FORM = { name: '', username: '', email: '', password: '', role: 'user', status: 'active' };

function fetchReducer(state, action) {
  switch (action.type) {
    case 'success': return { loading: false, error: null, users: action.users };
    case 'error': return { loading: false, error: action.error, users: [] };
    default: return state;
  }
}

const UserManagement = ({ onBack, onScroll }) => {
  const [fetchState, dispatch] = useReducer(fetchReducer, { loading: true, error: null, users: [] });
  const { loading, error, users } = fetchState;

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [viewUser, setViewUser] = useState(null);
  const [userModules, setUserModules] = useState([]);
  const [modLoading, setModLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
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
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(u =>
      (u.name || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    );
  }, [users, search]);

  const stats = useMemo(() => {
    const c = { total: users.length, superadmin: 0, admin: 0, inspector: 0, user: 0 };
    users.forEach(u => {
      const r = (u.role || 'user').toLowerCase();
      if (r in c) c[r]++;
    });
    return c;
  }, [users]);

  const openAdd = () => {
    setEditUser(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ name: u.name || '', username: u.username || '', email: u.email || '', password: '', role: u.role || 'user', status: u.status || 'active' });
    setFormError('');
    setShowForm(true);
  };

  const openViewModules = (u) => {
    setViewUser(u);
    setUserModules([]);
    setModLoading(true);
    ApiService.getAdminUserModules(u.id)
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.modules || data?.data || []);
        setUserModules(list);
      })
      .catch(() => setUserModules([]))
      .finally(() => setModLoading(false));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.username.trim()) { setFormError('Name and Username are required.'); return; }
    if (!editUser && !form.password.trim()) { setFormError('Password is required.'); return; }
    setSaving(true);
    setFormError('');
    try {
      if (editUser) {
        const payload = { name: form.name, email: form.email, role: form.role, status: form.status };
        if (form.password.trim()) payload.password = form.password;
        await ApiService.updateAdminUser(editUser.id, payload);
      } else {
        await ApiService.createAdminUser({ name: form.name, username: form.username, email: form.email, password: form.password, role: form.role, status: form.status });
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
    <div className="um-page">
      {/* Header */}
      <div className="um-header">
        <button className="um-back-btn" onClick={onBack}>← Back</button>
        <div className="um-header-info">
          <div className="um-header-icon">👥</div>
          <div>
            <div className="um-title">User Management</div>

          </div>
        </div>
        <button className="um-add-btn" onClick={openAdd}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" /><line x1="16" y1="11" x2="22" y2="11" />
          </svg>
          Add User
        </button>
      </div>

      {/* Stats */}
      <div className="um-stats-row">
        {[
          { key: 'total', label: 'Total Users', colorClass: '' },
          { key: 'superadmin', label: 'Superadmin', colorClass: 'cyan' },
          { key: 'admin', label: 'Admin', colorClass: 'gold' },
          { key: 'inspector', label: 'Inspector', colorClass: 'orange' },
          { key: 'user', label: 'User', colorClass: 'gray' },
        ].map(s => (
          <div key={s.key} className={`um-stat-card ${s.colorClass}`}>
            <div className="um-stat-val">{stats[s.key]}</div>
            <div className="um-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="um-toolbar">
        <div className="um-search-wrap">
          <svg className="um-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            className="um-search"
            placeholder="Search by name, username, email or role..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="um-search-clear" onClick={() => setSearch('')}>×</button>}
        </div>
        <div className="um-count">{filteredUsers.length} / {users.length} users</div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="um-state-block">
          <div className="um-spinner" />
          <span>Loading users...</span>
        </div>
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
        <div className="um-table-wrap" onScroll={onScroll}>
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
              {filteredUsers.map((u, idx) => {
                const rc = getRoleConf(u.role);
                return (
                  <tr key={u.id || idx}>
                    <td className="um-td-num">{idx + 1}</td>
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
                      <span className="um-role-badge" style={{ color: rc.color, background: rc.bg }}>{rc.label}</span>
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
                        <button className="um-action-btn modules" onClick={() => openViewModules(u)} title="View assigned modules">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

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
                ) : (
                  <><span style={{ fontSize: 20 }}>👤+</span> Add New User</>
                )}
              </div>
              <button className="um-modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <div className="um-modal-body">
              {formError && <div className="um-form-error">⚠️ {formError}</div>}
              <div className="um-form-grid">
                <div className="um-form-field">
                  <label>Full Name <span className="um-req">*</span></label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" />
                </div>
                <div className="um-form-field">
                  <label>Username <span className="um-req">*</span></label>
                  <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="johndoe" disabled={!!editUser} style={editUser ? { opacity: 0.5, cursor: 'not-allowed' } : {}} />
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
              ) : userModules.length === 0 ? (
                <div className="um-state-block">
                  <span className="um-empty-icon">🔐</span>
                  <p>No modules assigned to this user.</p>
                  <p className="um-hint">Use <strong>Equipment Access</strong> to assign modules.</p>
                </div>
              ) : (
                <div className="um-modules-list">
                  {userModules.map((m, i) => {
                    const code = m.code || m.module_code || '';
                    return (
                      <div key={m.id || m.module_id || i} className="um-module-item">
                        <span className="um-module-emoji">{MODULE_EMOJI[code] || '📦'}</span>
                        <span className="um-module-name">{m.name || m.module_name || `Module ${m.module_id}`}</span>
                        {m.access_level && <span className="um-module-level">{m.access_level}</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="um-modal-foot">
              <button className="um-btn-save" onClick={() => setViewUser(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

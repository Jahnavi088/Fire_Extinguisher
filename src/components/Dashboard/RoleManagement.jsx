import React, { useState, useEffect } from 'react';
import './UserManagement.css'; // Reusing UserManagement styling for consistency
import { ApiService } from '../../services/apiService';
import { NAV_MODULES, NAV_CATEGORIES } from './UserManagement';

const RoleManagement = ({ onBack }) => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const [form, setForm] = useState({ name: '' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [viewRole, setViewRole] = useState(null);
  const [moduleChecks, setModuleChecks] = useState({});
  const [modLoading, setModLoading] = useState(false);
  const [modSaving, setModSaving] = useState(false);

  const openViewModules = async (role) => {
    setViewRole(role);
    setModLoading(true);
    try {
      const res = await ApiService.getAdminRoleModules(role.id);
      const checks = {};
      let navList = [];
      if (res && res.data) {
        navList = Array.isArray(res.data) ? res.data : (res.data.modules || []);
      } else if (res && res.modules) {
        navList = res.modules;
      } else if (Array.isArray(res)) {
        navList = res;
      }
      navList.forEach(code => {
        if (code) checks[code] = true;
      });
      setModuleChecks(checks);
    } catch (err) {
      console.error("Failed to load role modules", err);
      // Assume none checked if error
      setModuleChecks({});
    } finally {
      setModLoading(false);
    }
  };

  const handleModToggle = (code) => {
    setModuleChecks(prev => ({ ...prev, [code]: !prev[code] }));
  };

  const handleModToggleAll = (category, isChecked) => {
    const newChecks = { ...moduleChecks };
    NAV_MODULES.filter(m => m.category === category).forEach(m => {
      newChecks[m.code] = isChecked;
    });
    setModuleChecks(newChecks);
  };

  const saveModuleAccess = async () => {
    if (!viewRole) return;
    setModSaving(true);
    try {
      const enabledNavCodes = NAV_MODULES.filter(m => moduleChecks[m.code]).map(m => m.code);
      await ApiService.updateAdminRoleModules(viewRole.id, { modules: enabledNavCodes });
      showToast('Role permissions updated successfully.', 'success');
      setViewRole(null);
    } catch (err) {
      console.error('Failed to save role modules:', err);
      showToast('Failed to save role permissions.', 'error');
    } finally {
      setModSaving(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadRoles = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getAdminRoles();
      const list = Array.isArray(res) ? res : (res?.roles || res?.data || []);
      setRoles(list);
    } catch (err) {
      console.error("Failed to load roles", err);
      setError("Failed to load roles. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleAdd = () => {
    setEditRole(null);
    setForm({ name: '' });
    setShowForm(true);
  };

  const handleEdit = (role) => {
    setEditRole(role);
    setForm({ name: role.name || '' });
    setShowForm(true);
  };

  const handleDeleteClick = (role) => {
    setDeleteConfirm(role);
  };

  const executeDeleteRole = async () => {
    if (!deleteConfirm) return;
    try {
      await ApiService.deleteAdminRole(deleteConfirm.id);
      showToast('Role deleted successfully.', 'success');
      loadRoles();
    } catch (err) {
      console.error("Delete failed", err);
      showToast('Failed to delete role.', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || ""
      };

      if (editRole) {
        await ApiService.updateAdminRole(editRole.id, payload);
        showToast('Role updated successfully.', 'success');
      } else {
        await ApiService.createAdminRole(payload);
        showToast('Role created successfully.', 'success');
      }
      setShowForm(false);
      loadRoles();
    } catch (err) {
      console.error("Save failed", err);
      const errMsg = err.message || err.error || err.toString();
      showToast(`Failed to save role: ${errMsg}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="setup-page">
      {toast && (
        <div className={`um-toast ${toast.type}`}>
          {toast.type === 'success' ? '✅' : '⚠️'} {toast.message}
        </div>
      )}

      {deleteConfirm && (
        <div className="um-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="um-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="um-modal-head">
              <div className="um-modal-title">
                <span style={{ fontSize: 20, marginRight: '8px' }}>⚠️</span> Confirm Deletion
              </div>
              <button className="um-modal-close" onClick={() => setDeleteConfirm(null)}>×</button>
            </div>
            <div className="um-modal-body">
              <p style={{ margin: 0, color: '#e2e8f0', fontSize: '14px', lineHeight: '1.5' }}>
                Are you sure you want to delete the role <strong>"{deleteConfirm.name}"</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="um-modal-foot">
              <button className="um-btn-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="um-btn-save" style={{ background: '#ef4444', color: '#fff' }} onClick={executeDeleteRole}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="setup-header">
        <button className="setup-back-btn" onClick={showForm ? () => setShowForm(false) : onBack} title="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="setup-header-info" style={{ flex: 1 }}>
          <div>
            <div className="setup-title">{showForm ? (editRole ? 'Edit Role' : 'Add New Role') : 'Role Management'}</div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
              {showForm ? 'Enter role details below' : 'Manage system roles and permissions'}
            </p>
          </div>
        </div>
        {!showForm && (
          <button className="um-add-btn" onClick={handleAdd}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add New Role
          </button>
        )}
      </div>

      {error && <div className="um-error-alert">{error}</div>}

      <div className="um-content-wrap" style={{ overflowX: 'hidden' }}>
        {showForm ? (
          <div className="um-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '24px', background: 'var(--surface, #045A97)', borderRadius: '12px' }}>
            <form className="um-form" onSubmit={handleSave}>
              <div className="um-form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>Role Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Operator"
                  required
                  style={{ width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                />
              </div>
              <div className="um-modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="um-btn-cancel" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="um-btn-save" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Role'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          loading ? (
            <div className="um-state-block">
              <div className="um-spinner"></div>
              <span>Loading Roles...</span>
            </div>
          ) : (
            <table className="um-table">
              <thead>
                <tr>
                  <th className="um-th-num">Role Name</th>
                  <th>Created At</th>
                  <th className="um-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="um-empty">
                      <div className="um-state-block">
                        <span className="um-empty-icon">👤</span>
                        <p>No roles found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  roles.map(r => (
                    <tr key={r.id}>
                      <td>
                        <div className="um-user-cell">
                          <div className="um-avatar" style={{ background: '#3b82f6', color: '#fff' }}>
                            {(r.name || 'R').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="um-name">{r.name}</div>
                          </div>
                        </div>
                      </td>
                      <td>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'}</td>
                      <td>
                        <div className="um-actions">
                          <button className="um-action-btn modules" onClick={() => openViewModules(r)} title="Manage access">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                          </button>
                          <button className="um-action-btn edit" onClick={() => handleEdit(r)} title="Edit Role">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button className="um-action-btn delete" onClick={() => handleDeleteClick(r)} title="Delete Role">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6" /><path d="M14 11v6" />
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )
        )}
      </div>

      {viewRole && (
        <div className="um-overlay" onClick={() => setViewRole(null)}>
          <div className="um-modal um-modules-modal" onClick={e => e.stopPropagation()}>
            <div className="um-modal-head">
              <div className="um-modal-title">
                <div className="um-avatar-sm" style={{ background: '#3b82f6', color: '#fff' }}>
                  {(viewRole.name || '?').charAt(0).toUpperCase()}
                </div>
                {viewRole.name} — Permissions
              </div>
              <button className="um-modal-close" onClick={() => setViewRole(null)}>×</button>
            </div>
            <div className="um-modal-body">
              {modLoading ? (
                <div className="um-state-block"><div className="um-spinner" /><span>Loading permissions...</span></div>
              ) : (
                <div className="um-modules-list">
                  {NAV_CATEGORIES.map(cat => {
                    const mods = NAV_MODULES.filter(m => m.category === cat);
                    if (mods.length === 0) return null;
                    return (
                      <div key={cat} className="um-module-category">
                        <div className="um-module-cat-label">{cat}</div>
                        <div className={`um-module-items-wrapper ${cat === 'Modules' ? 'multi-col-grid' : 'single-col-list'}`}>
                          {mods.map(m => (
                            <label
                              key={m.code}
                              className={`um-module-item${moduleChecks[m.code] ? ' assigned' : ''}`}
                              onClick={(e) => { e.preventDefault(); handleModToggle(m.code); }}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="um-mod-check-wrap">
                                <input
                                  type="checkbox"
                                  className="um-mod-checkbox"
                                  checked={moduleChecks[m.code] || false}
                                  onChange={() => handleModToggle(m.code)}
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
                    );
                  })}
                </div>
              )}
            </div>
            <div className="um-modal-foot">
              <button className="um-btn-cancel" onClick={() => setViewRole(null)}>Cancel</button>
              <button className="um-btn-save" onClick={saveModuleAccess} disabled={modSaving || modLoading}>
                {modSaving ? <><div className="um-btn-spinner" /> Saving...</> : 'Save Permissions'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;

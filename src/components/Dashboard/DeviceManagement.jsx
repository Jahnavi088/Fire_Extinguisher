import { useState, useEffect, useReducer, useMemo } from 'react';
import './DeviceManagement.css';
import { ApiService } from '../../services/apiService';

const PAGE_SIZE = 25;

function reducer(state, action) {
  switch (action.type) {
    case 'loading': return { ...state, loading: true, error: null };
    case 'success': return { loading: false, error: null, items: action.items, total: action.total };
    case 'error':   return { loading: false, error: action.error, items: [], total: 0 };
    default: return state;
  }
}

const DeviceManagement = ({ onBack }) => {
  const [state, dispatch] = useReducer(reducer, { loading: true, error: null, items: [], total: 0 });
  const { loading, error, items, total } = state;
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ is_approved: '', is_active: '' });
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [retry, setRetry] = useState(0);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let active = true;
    dispatch({ type: 'loading' });
    ApiService.getAdminDevices({ page, limit: PAGE_SIZE, ...filters })
      .then(res => { if (active) dispatch({ type: 'success', items: res.devices || [], total: res.total || 0 }); })
      .catch(err => { if (active) dispatch({ type: 'error', error: err.message || 'Failed to load devices' }); });
    return () => { active = false; };
  }, [page, filters, retry]);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(d =>
      (d.device_name || '').toLowerCase().includes(q) ||
      (d.user_name || '').toLowerCase().includes(q) ||
      (d.device_model || '').toLowerCase().includes(q) ||
      (d.os_version || '').toLowerCase().includes(q) ||
      (d.device_token || '').toLowerCase().includes(q)
    );
  }, [items, search]);

  const openDetail = async (id) => {
    setDetailLoading(true);
    setSelectedDevice({});
    try {
      setSelectedDevice(await ApiService.getAdminDeviceById(id));
    } catch (e) {
      alert(e.message || 'Failed to load device details');
      setSelectedDevice(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const approveDevice = async (id) => {
    if (!window.confirm('Approve this device for synchronization?')) return;
    setActionLoading(id);
    try {
      await ApiService.approveAdminDevice(id);
      setRetry(r => r + 1);
    } catch (e) { alert(e.message || 'Approval failed'); }
    finally { setActionLoading(null); }
  };

  const revokeDevice = async (id) => {
    const reason = window.prompt('Enter reason for revoking access:');
    if (reason === null) return;
    setActionLoading(id);
    try {
      await ApiService.revokeAdminDevice(id, reason);
      setRetry(r => r + 1);
    } catch (e) { alert(e.message || 'Revocation failed'); }
    finally { setActionLoading(null); }
  };

  const deleteDevice = async (id) => {
    if (!window.confirm('PERMANENTLY delete this device registration? synced data will be preserved.')) return;
    setActionLoading(id);
    try {
      await ApiService.deleteAdminDevice(id);
      setRetry(r => r + 1);
    } catch (e) { alert(e.message || 'Deletion failed'); }
    finally { setActionLoading(null); }
  };

  const approveFromDetail = async (id) => {
    if (!window.confirm('Approve this device for synchronization?')) return;
    setActionLoading(id);
    try {
      await ApiService.approveAdminDevice(id);
      setRetry(r => r + 1);
      setSelectedDevice(await ApiService.getAdminDeviceById(id));
    } catch (e) { alert(e.message || 'Approval failed'); }
    finally { setActionLoading(null); }
  };

  const revokeFromDetail = async (id) => {
    const reason = window.prompt('Enter reason for revoking access:');
    if (reason === null) return;
    setActionLoading(id);
    try {
      await ApiService.revokeAdminDevice(id, reason);
      setRetry(r => r + 1);
      setSelectedDevice(await ApiService.getAdminDeviceById(id));
    } catch (e) { alert(e.message || 'Revocation failed'); }
    finally { setActionLoading(null); }
  };

  const deleteFromDetail = async (id) => {
    if (!window.confirm('PERMANENTLY delete this device registration? synced data will be preserved.')) return;
    setActionLoading(id);
    try {
      await ApiService.deleteAdminDevice(id);
      setRetry(r => r + 1);
      setSelectedDevice(null);
    } catch (e) { alert(e.message || 'Deletion failed'); }
    finally { setActionLoading(null); }
  };

  const isSuperAdmin = ApiService.getUser()?.role === 'superadmin';

  const getOsInfo = (osVersion) => {
    const v = (osVersion || '').toLowerCase();
    if (v.includes('android')) return { emoji: '🤖', type: 'android' };
    if (v.includes('ios') || v.includes('apple') || v.includes('mac')) return { emoji: '', type: 'ios' };
    return { emoji: '📱', type: 'default' };
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="dm-container">
      <div className="dm-header">
        <div className="dm-title-section">
          <button className="setup-back-btn" onClick={onBack}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <div className="dm-title-icon">📱</div>
          <div className="dm-title-texts">
            <h1 className="dm-main-title">Device Monitoring Panel</h1>
            <span className="dm-subtitle">Part 11 Compliance — Authorize inspection terminals</span>
          </div>
        </div>
        <div className="pu-header-stats" style={{ margin: '0' }}>
          <div className="pu-stat-pill">
            <span className="pu-stat-dot" style={{ background: '#f59e0b', boxShadow: '0 0 8px rgba(245,158,11,0.5)' }} />
            <span className="pu-stat-val">{items.filter(d => !d.is_approved).length}</span>
            <span className="pu-stat-label">Pending Units</span>
          </div>
        </div>
      </div>

      <div className="dm-control-panel">
        <div className="dm-search-group">
          <div className="dm-search-input-wrapper">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input type="text" className="dm-search-input" placeholder="Search by device, model, OS, inspector name..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="dm-select-dropdown" value={filters.is_approved}
            onChange={e => { setFilters(f => ({ ...f, is_approved: e.target.value })); setPage(1); }}>
            <option value="">All Approval Status</option>
            <option value="true">Approved</option>
            <option value="false">Pending Approval</option>
          </select>
          <select className="dm-select-dropdown" value={filters.is_active}
            onChange={e => { setFilters(f => ({ ...f, is_active: e.target.value })); setPage(1); }}>
            <option value="">All Activity Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <div className="dm-view-toggles">
          <button className={`dm-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} title="Grid View (Hardware Cards)">🎴</button>
          <button className={`dm-toggle-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')} title="Table View (Registry List)">📋</button>
        </div>
      </div>

      <div className="um-content-wrap" style={{ flex: 1, padding: '0' }}>
        {loading ? (
          <div className="um-state-block" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <div className="um-spinner" />
            <span>Synchronizing device registry...</span>
          </div>
        ) : error ? (
          <div className="um-state-block um-error-block">
            <span>⚠️ {error}</span>
            <button className="um-retry-btn" onClick={() => setRetry(r => r + 1)}>Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="um-state-block" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <span className="um-empty-icon">📱</span>
            <p>No device nodes found matching parameters.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="dm-cards-grid">
            {filtered.map(device => {
              const osInfo = getOsInfo(device.os_version);
              return (
                <div key={device.id} className="dm-device-card"
                  style={{ '--card-border-gradient': osInfo.type === 'android' ? 'linear-gradient(90deg, #10b981, #06b6d4)' : 'linear-gradient(90deg, #3b82f6, #6366f1)' }}
                  onClick={() => openDetail(device.id)}>
                  <div className="dm-card-top">
                    <div className={`dm-avatar-frame ${osInfo.type}`}>{osInfo.emoji}</div>
                    <span className={`dm-card-status-badge ${device.is_approved ? 'dm-badge-approved' : 'dm-badge-pending'}`}>
                      <span className="dm-dot" />
                      {device.is_approved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                  <div className="dm-card-middle">
                    <div className="dm-card-name" title={device.device_name}>{device.device_name}</div>
                    <div className="dm-card-inspector">User: <strong>{device.user_name || 'Unassigned'}</strong></div>
                  </div>
                  <div className="dm-card-specs">
                    <div className="dm-spec-item">
                      <span className="dm-spec-lbl">Model Code</span>
                      <span className="dm-spec-val">{device.device_model || '—'}</span>
                    </div>
                    <div className="dm-spec-item">
                      <span className="dm-spec-lbl">OS Platform</span>
                      <span className="dm-spec-val">{device.os_version || '—'}</span>
                    </div>
                  </div>
                  <div className="dm-card-actions" onClick={e => e.stopPropagation()}>
                    <button className="dm-card-btn specs" onClick={() => openDetail(device.id)} title="Inspect Specs Log">🔍</button>
                    {device.is_approved
                      ? <button className="dm-card-btn revoke" onClick={() => revokeDevice(device.id)} disabled={actionLoading === device.id} title="Revoke Node Access">🚫</button>
                      : <button className="dm-card-btn approve" onClick={() => approveDevice(device.id)} disabled={actionLoading === device.id} title="Authorize Node">✅</button>
                    }
                    {isSuperAdmin && (
                      <button className="dm-card-btn delete" onClick={() => deleteDevice(device.id)} disabled={actionLoading === device.id} title="Purge Node Registration">🗑️</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="dm-table-wrap">
            <table className="dm-table">
              <thead>
                <tr>
                  <th>Device / Inspector</th>
                  <th>Model / OS</th>
                  <th>App Version</th>
                  <th>Approval</th>
                  <th>Last Sync</th>
                  <th style={{ width: '160px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(device => (
                  <tr key={device.id} onClick={() => openDetail(device.id)} style={{ cursor: 'pointer' }} title="Click to view specifications">
                    <td>
                      <div className="um-user-cell">
                        <div className="um-avatar" style={{ background: 'rgba(255,255,255,0.04)', color: '#fff' }}>
                          {device.device_name?.charAt(0) || 'D'}
                        </div>
                        <div>
                          <div className="um-name">{device.device_name}</div>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>{device.user_name || 'Unassigned'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>{device.device_model}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{device.os_version}</div>
                    </td>
                    <td className="um-mono">{device.app_version}</td>
                    <td>
                      <span className={`dm-card-status-badge ${device.is_approved ? 'dm-badge-approved' : 'dm-badge-pending'}`} style={{ padding: '3px 8px', fontSize: '10px' }}>
                        <span className="dm-dot" />
                        {device.is_approved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                      {device.last_sync_at ? new Date(device.last_sync_at).toLocaleString() : 'Never'}
                    </td>
                    <td>
                      <div className="um-actions" onClick={e => e.stopPropagation()}>
                        {device.is_approved
                          ? <button className="um-action-btn edit" onClick={() => revokeDevice(device.id)} disabled={actionLoading === device.id} style={{ filter: 'grayscale(1)' }} title="Revoke Access">🚫</button>
                          : <button className="um-action-btn edit" onClick={() => approveDevice(device.id)} disabled={actionLoading === device.id} title="Approve Device">✅</button>
                        }
                        {isSuperAdmin && (
                          <button className="um-action-btn delete" onClick={() => deleteDevice(device.id)} disabled={actionLoading === device.id} title="Delete Registration">🗑️</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && !error && total > PAGE_SIZE && (
        <div className="al-pagination">
          <span className="al-page-count">
            Showing <strong>{(page - 1) * PAGE_SIZE + 1}</strong> to <strong>{Math.min(page * PAGE_SIZE, total)}</strong> of <strong>{total}</strong> devices
          </span>
          <div className="al-page-btns">
            <button className="al-page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>◀ Previous</button>
            <span className="al-page-indicator">Page {page} of {totalPages}</span>
            <button className="al-page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next ▶</button>
          </div>
        </div>
      )}

      {selectedDevice && (
        <div className="um-overlay" onClick={() => setSelectedDevice(null)}>
          <div className="um-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px', background: '#0b1329' }}>
            <div className="um-modal-head" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="um-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📱</span> Device Specifications
              </div>
              <button className="um-modal-close" onClick={() => setSelectedDevice(null)}>✕</button>
            </div>
            <div className="um-modal-body" style={{ color: '#fff', background: '#0b1329', padding: '24px' }}>
              {detailLoading ? (
                <div className="um-state-block">
                  <div className="um-spinner" />
                  <span>Fetching live specs...</span>
                </div>
              ) : (
                <div className="dm-phone-frame">
                  <div className="dm-phone-notch" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div className="um-avatar" style={{ width: '48px', height: '48px', fontSize: '18px', background: 'rgba(6,182,212,0.1)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.25)' }}>
                        {selectedDevice.device_name?.charAt(0) || 'D'}
                      </div>
                      <div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>{selectedDevice.device_name || 'Generic Device'}</div>
                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
                          Assigned Inspector: <strong style={{ color: '#22d3ee' }}>{selectedDevice.user_name || 'Unassigned'}</strong>
                        </div>
                      </div>
                      <div style={{ marginLeft: 'auto' }}>
                        <span className={`dm-card-status-badge ${selectedDevice.is_approved ? 'dm-badge-approved' : 'dm-badge-pending'}`}>
                          <span className="dm-dot" />
                          {selectedDevice.is_approved ? 'Approved' : 'Pending'}
                        </span>
                      </div>
                    </div>

                    <div className="um-form-grid" style={{ gap: '16px' }}>
                      {[
                        { label: 'Device Token (Part 11 UUID)', value: selectedDevice.device_token, mono: true, color: '#22d3ee' },
                        { label: 'Device Model', value: selectedDevice.device_model },
                        { label: 'Operating System', value: selectedDevice.os_version },
                        { label: 'Client App Version', value: selectedDevice.app_version ? `v${selectedDevice.app_version}` : '—', mono: true },
                        { label: 'Registration Date', value: selectedDevice.created_at ? new Date(selectedDevice.created_at).toLocaleString() : '—' },
                        { label: 'Last Synchronization', value: selectedDevice.last_sync_at ? new Date(selectedDevice.last_sync_at).toLocaleString() : 'Never' },
                      ].map(f => (
                        <div key={f.label} className="um-form-field">
                          <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: '700' }}>{f.label}</label>
                          <div className={f.mono ? 'um-mono' : ''} style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: f.color || 'inherit', wordBreak: f.mono ? 'break-all' : undefined }}>
                            {f.value || '—'}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '8px' }}>Security & Authorization Status</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '8px', padding: '12px' }}>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Authorized By</div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginTop: '4px' }}>{selectedDevice.approved_by_name || 'System Auto-Accept'}</div>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{selectedDevice.approved_at ? new Date(selectedDevice.approved_at).toLocaleString() : '—'}</div>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '8px', padding: '12px' }}>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Revocation Reason</div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: selectedDevice.revocation_reason ? '#f87171' : 'rgba(255,255,255,0.3)', marginTop: '4px' }}>{selectedDevice.revocation_reason || 'No active revocation'}</div>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{selectedDevice.revoked_at ? new Date(selectedDevice.revoked_at).toLocaleString() : ''}</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                      {selectedDevice.is_approved
                        ? <button onClick={() => revokeFromDetail(selectedDevice.id)} className="al-page-btn" style={{ background: '#f59e0b', color: '#fff', border: '1px solid rgba(245,158,11,0.3)', padding: '10px 20px', borderRadius: '10px', fontWeight: '700' }} disabled={actionLoading === selectedDevice.id}>Revoke Access</button>
                        : <button onClick={() => approveFromDetail(selectedDevice.id)} className="al-page-btn" style={{ background: '#10b981', color: '#fff', border: '1px solid rgba(16,185,129,0.3)', padding: '10px 20px', borderRadius: '10px', fontWeight: '700' }} disabled={actionLoading === selectedDevice.id}>Authorize Device</button>
                      }
                      {isSuperAdmin && (
                        <button onClick={() => deleteFromDetail(selectedDevice.id)} className="al-page-btn" style={{ background: '#ef4444', color: '#fff', border: '1px solid rgba(239,68,68,0.3)', padding: '10px 20px', borderRadius: '10px', fontWeight: '700' }} disabled={actionLoading === selectedDevice.id}>Delete Registration</button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceManagement;

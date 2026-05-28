import { useState, useEffect, useReducer, useMemo } from 'react';
import './DeviceManagement.css';
import { ApiService } from '../../services/apiService';

const PAGE_SIZE = 10;

function reducer(state, action) {
  switch (action.type) {
    case 'loading': return { ...state, loading: true, error: null };
    case 'success': return { loading: false, error: null, items: action.items, total: action.total };
    case 'error': return { loading: false, error: action.error, items: [], total: 0 };
    default: return state;
  }
}

const DeviceManagement = ({ onBack }) => {
  const [state, dispatch] = useReducer(reducer, { loading: true, error: null, items: [], total: 0 });
  const { loading, error, items, total } = state;
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ is_approved: '', is_active: '' });
  const [search, setSearch] = useState('');
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

  const pendingCount = items.filter(d => !d.is_approved).length;
  const approvedCount = items.filter(d => d.is_approved).length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="ea-page">
      {/* ── Header ── */}
      <div className="setup-header">
        <button className="setup-back-btn" onClick={onBack} title="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="setup-header-info" style={{ flex: 1 }}>
          <div className="setup-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          </div>
          <div>
            <div className="setup-title">FDA Compliance Device Monitoring</div>

          </div>
        </div>

      </div>

      <div className="ea-body">

        {/* ── Controls ── */}
        <div className="dm-control-panel">
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

        {/* ── Content ── */}
        <div className="dm-content-wrap">
          {loading ? (
            <div className="dm-state-block">
              <div className="dm-spinner" />
              <span>Synchronizing device registry...</span>
            </div>
          ) : error ? (
            <div className="dm-state-block dm-error-block">
              <span>⚠️ {error}</span>
              <button className="dm-retry-btn" onClick={() => setRetry(r => r + 1)}>Retry</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="dm-state-block">
              <span className="dm-empty-icon">📱</span>
              <p>No device nodes found matching parameters.</p>
            </div>
          ) : (
            <div className="dm-table-wrap">
              <table className="dm-table">
                <thead>
                  <tr>
                    <th style={{ width: '220px' }}>Device / Inspector</th>
                    <th>Model / OS</th>
                    <th>App Version</th>
                    <th style={{ width: '130px' }}>Approval</th>
                    <th style={{ width: '190px' }}>Last Sync</th>
                    <th style={{ width: '130px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(device => (
                    <tr key={device.id} onClick={() => openDetail(device.id)} style={{ cursor: 'pointer' }}>
                      <td>
                        <div className="dm-cell-user">
                          <div className="dm-cell-avatar">{device.device_name?.charAt(0) || 'D'}</div>
                          <div>
                            <div className="dm-cell-name">{device.device_name}</div>
                            <div className="dm-cell-sub">{device.user_name || 'Unassigned'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="dm-cell-model">{device.device_model}</div>
                        <div className="dm-cell-os">{device.os_version}</div>
                      </td>
                      <td className="dm-cell-mono">{device.app_version || '—'}</td>
                      <td>
                        <span className={`dm-card-status-badge ${device.is_approved ? 'dm-badge-approved' : 'dm-badge-pending'}`} style={{ padding: '3px 9px', fontSize: '10px' }}>
                          <span className="dm-dot" />
                          {device.is_approved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td className="dm-cell-date">
                        {device.last_sync_at ? new Date(device.last_sync_at).toLocaleString() : 'Never'}
                      </td>
                      <td>
                        <div className="dm-table-actions" onClick={e => e.stopPropagation()}>
                          <button className="dm-action-btn edit" onClick={() => openDetail(device.id)} title="View Specs">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          {device.is_approved
                            ? <button className="dm-action-btn revoke" onClick={() => revokeDevice(device.id)} disabled={actionLoading === device.id} title="Revoke Access">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                              </svg>
                            </button>
                            : <button className="dm-action-btn approve" onClick={() => approveDevice(device.id)} disabled={actionLoading === device.id} title="Approve Device">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </button>
                          }
                          {isSuperAdmin && (
                            <button className="dm-action-btn delete" onClick={() => deleteDevice(device.id)} disabled={actionLoading === device.id} title="Delete">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
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

        {/* ── Pagination ── */}
        {!loading && !error && total > PAGE_SIZE && (
          <div className="dm-pagination">
            <span className="dm-page-count">
              Showing <strong>{(page - 1) * PAGE_SIZE + 1}</strong> – <strong>{Math.min(page * PAGE_SIZE, total)}</strong> of <strong>{total}</strong> devices
            </span>
            <div className="dm-page-btns">
              <button className="dm-page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>◀ Previous</button>
              <span className="dm-page-indicator">Page {page} of {totalPages}</span>
              <button className="dm-page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next ▶</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Detail Modal ── */}
      {selectedDevice && (
        <div className="dm-overlay" onClick={() => setSelectedDevice(null)}>
          <div className="dm-modal" onClick={e => e.stopPropagation()}>
            <div className="dm-modal-head">
              <div className="dm-modal-title">
                <span>📱</span> Device Specifications
              </div>
              <button className="dm-modal-close" onClick={() => setSelectedDevice(null)}>✕</button>
            </div>
            <div className="dm-modal-body">
              {detailLoading ? (
                <div className="dm-state-block">
                  <div className="dm-spinner" />
                  <span>Fetching live specs...</span>
                </div>
              ) : (
                <>
                  {/* Identity Row */}
                  <div className="dm-modal-identity">
                    <div className="dm-modal-avatar">{selectedDevice.device_name?.charAt(0) || 'D'}</div>
                    <div className="dm-modal-identity-info">
                      <div className="dm-modal-device-name">{selectedDevice.device_name || 'Generic Device'}</div>
                      <div className="dm-modal-device-user">
                        Inspector: <strong>{selectedDevice.user_name || 'Unassigned'}</strong>
                      </div>
                    </div>
                    <span className={`dm-card-status-badge ${selectedDevice.is_approved ? 'dm-badge-approved' : 'dm-badge-pending'}`}>
                      <span className="dm-dot" />
                      {selectedDevice.is_approved ? 'Approved' : 'Pending'}
                    </span>
                  </div>

                  {/* Field Grid */}
                  <div className="dm-modal-fields">
                    {[
                      { label: 'Device Token (Part 11 UUID)', value: selectedDevice.device_token, token: true },
                      { label: 'Device Model', value: selectedDevice.device_model },
                      { label: 'Operating System', value: selectedDevice.os_version },
                      { label: 'Client App Version', value: selectedDevice.app_version ? `v${selectedDevice.app_version}` : '—' },
                      { label: 'Registration Date', value: selectedDevice.created_at ? new Date(selectedDevice.created_at).toLocaleString() : '—' },
                      { label: 'Last Synchronization', value: selectedDevice.last_sync_at ? new Date(selectedDevice.last_sync_at).toLocaleString() : 'Never' },
                    ].map(f => (
                      <div key={f.label} className="dm-modal-field">
                        <label className="dm-modal-field-label">{f.label}</label>
                        <div className={`dm-modal-field-val${f.token ? ' token' : ''}`}>{f.value || '—'}</div>
                      </div>
                    ))}
                  </div>

                  {/* Security Panel */}
                  <div className="dm-modal-security">
                    <div className="dm-modal-security-title">Security & Authorization Status</div>
                    <div className="dm-modal-security-grid">
                      <div className="dm-modal-security-card">
                        <div className="dm-modal-security-card-label">Authorized By</div>
                        <div className="dm-modal-security-card-val">{selectedDevice.approved_by_name || 'System Auto-Accept'}</div>
                        <div className="dm-modal-security-card-sub">{selectedDevice.approved_at ? new Date(selectedDevice.approved_at).toLocaleString() : '—'}</div>
                      </div>
                      <div className="dm-modal-security-card">
                        <div className="dm-modal-security-card-label">Revocation Reason</div>
                        <div className="dm-modal-security-card-val" style={{ color: selectedDevice.revocation_reason ? '#f87171' : undefined }}>
                          {selectedDevice.revocation_reason || 'No active revocation'}
                        </div>
                        <div className="dm-modal-security-card-sub">{selectedDevice.revoked_at ? new Date(selectedDevice.revoked_at).toLocaleString() : ''}</div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="dm-modal-footer">
                    {selectedDevice.is_approved
                      ? <button className="dm-modal-action-btn revoke" onClick={() => revokeFromDetail(selectedDevice.id)} disabled={actionLoading === selectedDevice.id}>Revoke Access</button>
                      : <button className="dm-modal-action-btn approve" onClick={() => approveFromDetail(selectedDevice.id)} disabled={actionLoading === selectedDevice.id}>Authorize Device</button>
                    }
                    {isSuperAdmin && (
                      <button className="dm-modal-action-btn delete" onClick={() => deleteFromDetail(selectedDevice.id)} disabled={actionLoading === selectedDevice.id}>Delete Registration</button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceManagement;

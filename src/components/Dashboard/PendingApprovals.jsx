import { useState, useEffect, useReducer } from 'react';
import './PendingApprovals.css';
import { ApiService } from '../../services/apiService';

const PAGE_SIZE = 20;

function reducer(state, action) {
  switch (action.type) {
    case 'loading': return { ...state, loading: true, error: null };
    case 'success': return { loading: false, error: null, items: action.items };
    case 'error':   return { loading: false, error: action.error, items: [] };
    default: return state;
  }
}

const PendingApprovals = ({ onBack }) => {
  const [state, dispatch] = useReducer(reducer, { loading: true, error: null, items: [] });
  const { loading, error, items } = state;
  const [actionLoading, setActionLoading] = useState(null);
  const [retry, setRetry] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [remarksInput, setRemarksInput] = useState('');
  const [rejectInput, setRejectInput] = useState('');
  const [modalMode, setModalMode] = useState(null); // 'approve' | 'reject'

  useEffect(() => {
    let active = true;
    dispatch({ type: 'loading' });
    ApiService.getPendingUpdates()
      .then(res => {
        if (!active) return;
        const list = Array.isArray(res) ? res : (res?.updates || res?.data || res?.items || []);
        dispatch({ type: 'success', items: list });
      })
      .catch(err => { if (active) dispatch({ type: 'error', error: err.message || 'Failed to load pending approvals' }); });
    return () => { active = false; };
  }, [retry]);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openApprove = (item) => {
    setSelectedItem(item);
    setRemarksInput('');
    setModalMode('approve');
  };

  const openReject = (item) => {
    setSelectedItem(item);
    setRejectInput('');
    setModalMode('reject');
  };

  const handleApprove = async () => {
    if (!selectedItem) return;
    setActionLoading(selectedItem.id);
    try {
      await ApiService.approveUpdate(selectedItem.id, remarksInput.trim() || undefined);
      setModalMode(null);
      setRetry(r => r + 1);
    } catch (e) { alert(e.message || 'Approval failed'); }
    finally { setActionLoading(null); }
  };

  const handleReject = async () => {
    if (!selectedItem) return;
    if (!rejectInput.trim()) { alert('Please enter a reason for rejection.'); return; }
    setActionLoading(selectedItem.id);
    try {
      await ApiService.rejectUpdate(selectedItem.id, rejectInput.trim());
      setModalMode(null);
      setRetry(r => r + 1);
    } catch (e) { alert(e.message || 'Rejection failed'); }
    finally { setActionLoading(null); }
  };

  const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <div className="pa-container">
      <div className="pa-header">
        <div className="pa-header-left">
          <button className="setup-back-btn" onClick={onBack}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <div className="pa-title-icon">⏳</div>
          <div className="pa-title-texts">
            <h1 className="pa-main-title">Pending Approvals</h1>
            <span className="pa-subtitle">Equipment update requests awaiting review</span>
          </div>
        </div>
        <div className="pu-header-stats" style={{ margin: 0 }}>
          <div className="pu-stat-pill">
            <span className="pu-stat-dot" style={{ background: '#f59e0b', boxShadow: '0 0 8px rgba(245,158,11,0.5)' }} />
            <span className="pu-stat-val">{items.length}</span>
            <span className="pu-stat-label">Pending</span>
          </div>
        </div>
      </div>

      <div className="pa-body">
        {loading ? (
          <div className="um-state-block" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <div className="um-spinner" />
            <span>Loading pending approvals...</span>
          </div>
        ) : error ? (
          <div className="um-state-block um-error-block">
            <span>⚠️ {error}</span>
            <button className="um-retry-btn" onClick={() => setRetry(r => r + 1)}>Retry</button>
          </div>
        ) : items.length === 0 ? (
          <div className="um-state-block" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <span className="um-empty-icon">✅</span>
            <p>No pending approvals — everything is up to date.</p>
          </div>
        ) : (
          <div className="pa-table-wrap">
            <table className="pa-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Unit / SOS Code</th>
                  <th>Update Type</th>
                  <th>Submitted By</th>
                  <th>Submitted At</th>
                  <th>Details</th>
                  <th style={{ textAlign: 'right', width: '180px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item, i) => (
                  <tr key={item.id}>
                    <td style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>
                      {(page - 1) * PAGE_SIZE + i + 1}
                    </td>
                    <td>
                      <div className="pa-cell-main">{item.sos_code || item.equipment_code || '—'}</div>
                      <div className="pa-cell-sub">{item.equipment_name || item.module_name || ''}</div>
                    </td>
                    <td>
                      <span className="pa-type-badge">{item.update_type || item.type || 'Update'}</span>
                    </td>
                    <td>
                      <div className="pa-cell-main">{item.submitted_by_name || item.user_name || 'Unknown'}</div>
                      <div className="pa-cell-sub">{item.submitted_by_role || ''}</div>
                    </td>
                    <td style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>{fmt(item.created_at)}</td>
                    <td style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', maxWidth: '200px' }}>
                      <div className="pa-remarks-cell">{item.remarks || item.notes || item.description || '—'}</div>
                    </td>
                    <td>
                      <div className="um-actions">
                        <button
                          className="um-action-btn edit"
                          onClick={() => openApprove(item)}
                          disabled={actionLoading === item.id}
                          title="Approve"
                          style={{ background: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.3)', color: '#10b981' }}
                        >
                          ✅ Approve
                        </button>
                        <button
                          className="um-action-btn delete"
                          onClick={() => openReject(item)}
                          disabled={actionLoading === item.id}
                          title="Reject"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && !error && items.length > PAGE_SIZE && (
        <div className="al-pagination">
          <span className="al-page-count">
            Showing <strong>{(page - 1) * PAGE_SIZE + 1}</strong> to <strong>{Math.min(page * PAGE_SIZE, items.length)}</strong> of <strong>{items.length}</strong> records
          </span>
          <div className="al-page-btns">
            <button className="al-page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>◀ Previous</button>
            <span className="al-page-indicator">Page {page} of {totalPages}</span>
            <button className="al-page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next ▶</button>
          </div>
        </div>
      )}

      {/* Approve / Reject Modal */}
      {modalMode && selectedItem && (
        <div className="um-overlay" onClick={() => setModalMode(null)}>
          <div className="um-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="um-modal-head">
              <div className="um-modal-title">
                {modalMode === 'approve' ? '✅ Approve Update' : '✕ Reject Update'}
              </div>
              <button className="um-modal-close" onClick={() => setModalMode(null)}>✕</button>
            </div>
            <div className="um-modal-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Unit</div>
                <div style={{ fontWeight: 700, color: '#fff' }}>{selectedItem.sos_code || selectedItem.equipment_code || '—'}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{selectedItem.equipment_name || selectedItem.module_name || ''}</div>
              </div>

              {modalMode === 'approve' ? (
                <div className="um-form-field">
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 700 }}>Remarks (optional)</label>
                  <textarea
                    className="um-input"
                    rows={3}
                    placeholder="Add approval remarks..."
                    value={remarksInput}
                    onChange={e => setRemarksInput(e.target.value)}
                    style={{ resize: 'vertical', minHeight: '70px' }}
                  />
                </div>
              ) : (
                <div className="um-form-field">
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 700 }}>Reason for rejection *</label>
                  <textarea
                    className="um-input"
                    rows={3}
                    placeholder="Enter reason for rejection..."
                    value={rejectInput}
                    onChange={e => setRejectInput(e.target.value)}
                    style={{ resize: 'vertical', minHeight: '70px' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  className="al-page-btn"
                  onClick={() => setModalMode(null)}
                  style={{ padding: '10px 20px', borderRadius: '10px' }}
                >
                  Cancel
                </button>
                {modalMode === 'approve' ? (
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading === selectedItem.id}
                    style={{ background: '#10b981', color: '#fff', border: '1px solid rgba(16,185,129,0.3)', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {actionLoading === selectedItem.id ? 'Approving...' : 'Confirm Approve'}
                  </button>
                ) : (
                  <button
                    onClick={handleReject}
                    disabled={actionLoading === selectedItem.id}
                    style={{ background: '#ef4444', color: '#fff', border: '1px solid rgba(239,68,68,0.3)', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {actionLoading === selectedItem.id ? 'Rejecting...' : 'Confirm Reject'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;

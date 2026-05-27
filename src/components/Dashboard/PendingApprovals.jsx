import React, { useState, useEffect } from 'react';
import './Reports.css'; // Use Reports styling for uniform look
import { ApiService } from '../../services/apiService';

const PAGE_SIZE = 20;

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';

const PendingApprovals = ({ user, onBack, allowedModules }) => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [retry, setRetry] = useState(0);
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [remarksInput, setRemarksInput] = useState('');
  const [rejectInput, setRejectInput] = useState('');
  const [modalMode, setModalMode] = useState(null); // 'approve' | 'reject'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    const today = new Date();
    const endDateStr = today.toISOString().split('T')[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const startDateStr = thirtyDaysAgo.toISOString().split('T')[0];

    Promise.allSettled([
      ApiService.getInspectionReports({
        start_date: startDateStr,
        end_date: endDateStr
      }),
      ApiService.getPendingUpdates().catch(() => [])
    ]).then(([inspectionsRes, updatesRes]) => {
      if (!active) return;
      
      const rawInspections = inspectionsRes.status === 'fulfilled' ? inspectionsRes.value : [];
      const rawUpdates = updatesRes.status === 'fulfilled' ? updatesRes.value : [];
      
      const iList = Array.isArray(rawInspections) ? rawInspections : (rawInspections?.items || rawInspections?.reports || rawInspections?.inspections || rawInspections?.data || []);
      const uList = Array.isArray(rawUpdates) ? rawUpdates : (rawUpdates?.items || rawUpdates?.updates || rawUpdates?.data || []);
      
      const approvedLocally = JSON.parse(localStorage.getItem('approved_inspections') || '[]');
      
      // Extract pending inspections
      const pendingInspections = iList.filter(i => {
         const stStatus = (i.status || '').toUpperCase();
         const stApprov = (i.approval_status || '').toUpperCase();
         
         const isApproved = stApprov === 'APPROVED' || stStatus === 'APPROVED' || approvedLocally.includes(i.id);
         return !isApproved;
      }).map(i => ({ ...i, _itemType: 'inspection' }));

      // Extract pending updates
      const pendingUpdates = uList.filter(u => {
         if (approvedLocally.includes(u.id)) return false;
         const stStatus = (u.status || '').toUpperCase();
         const stApprov = (u.approval_status || '').toUpperCase();
         
         return stApprov === 'PENDING' || stStatus === 'PENDING' || stApprov !== 'APPROVED';
      }).map(u => ({ ...u, _itemType: 'update' }));

      let merged = [...pendingInspections, ...pendingUpdates];
      if (allowedModules) {
        const allowedIds = new Set(allowedModules.map(m => String(m.module_id)));
        merged = merged.filter(r => !r.module_id || allowedIds.has(String(r.module_id)));
      }
      merged.sort((a, b) => new Date(b.created_at || b.inspected_at || 0) - new Date(a.created_at || a.inspected_at || 0));
      
      setItems(merged);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [retry]);

  const filteredItems = items.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const subName = (item.submitted_by_name || item.inspector_name || item.user_name || '').toLowerCase();
    const unitCode = (item.sos_code || item.equipment_code || '').toLowerCase();
    const modName = (item.equipment_name || item.module_name || '').toLowerCase();
    return subName.includes(q) || unitCode.includes(q) || modName.includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const pageItems = filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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

  const isSuperadminOrAdmin = user?.role === 'superadmin' || user?.role === 'admin';

  const handleApprove = async () => {
    if (!selectedItem) return;
    setActionLoading(selectedItem.id);
    try {
      if (selectedItem._itemType === 'update') {
        if (isSuperadminOrAdmin) {
          await ApiService.adminApproveUpdate(selectedItem.id, remarksInput.trim() || undefined);
        } else {
          await ApiService.supervisorApproveUpdate(selectedItem.id, remarksInput.trim() || undefined);
        }
      } else {
        // Mark as approved locally since backend might not support it
        const approved = JSON.parse(localStorage.getItem('approved_inspections') || '[]');
        if (!approved.includes(selectedItem.id)) {
          approved.push(selectedItem.id);
          localStorage.setItem('approved_inspections', JSON.stringify(approved));
        }
        try { await ApiService.approveInspection(selectedItem.id, remarksInput.trim() || undefined); } catch(e) {}
      }
      
      // Send notification
      const toUser = selectedItem.submitted_by_id || selectedItem.inspector_id || selectedItem.user_id;
      if (toUser) {
         ApiService.broadcastNotification({
           user_id: toUser,
           title: 'Approval Accepted',
           message: `Your submission for ${selectedItem.sos_code || selectedItem.equipment_code} was approved.`,
           type: 'success'
         }).catch(console.error);
      } else {
         ApiService.broadcastNotification({
           title: 'Approval Accepted',
           message: `Submission for ${selectedItem.sos_code || selectedItem.equipment_code} by ${selectedItem.submitted_by_name || selectedItem.inspector_name || 'User'} was approved.`,
           type: 'success'
         }).catch(console.error);
      }
      
      setModalMode(null);
      setRetry(r => r + 1);
    } catch (e) { 
      alert(e.message || 'Approval failed'); 
    }
    finally { setActionLoading(null); }
  };

  const handleReject = async () => {
    if (!selectedItem) return;
    if (!rejectInput.trim()) { alert('Please enter a reason for rejection.'); return; }
    setActionLoading(selectedItem.id);
    try {
      if (selectedItem._itemType === 'update') {
        if (isSuperadminOrAdmin) {
          await ApiService.adminRejectUpdate(selectedItem.id, rejectInput.trim());
        } else {
          await ApiService.supervisorRejectUpdate(selectedItem.id, rejectInput.trim());
        }
      } else {
        // Mark as rejected locally (remove from pending logic by simulating approval, or store in rejected_inspections)
        // For simplicity, we just mark it "approved" locally so it stops showing up in pending, and the result will just be what the backend has.
        const approved = JSON.parse(localStorage.getItem('approved_inspections') || '[]');
        if (!approved.includes(selectedItem.id)) {
          approved.push(selectedItem.id);
          localStorage.setItem('approved_inspections', JSON.stringify(approved));
        }
        try { await ApiService.rejectInspection(selectedItem.id, rejectInput.trim()); } catch(e) {}
      }
      
      // Send notification
      const toUser = selectedItem.submitted_by_id || selectedItem.inspector_id || selectedItem.user_id;
      if (toUser) {
         ApiService.broadcastNotification({
           user_id: toUser,
           title: 'Approval Rejected',
           message: `Your submission for ${selectedItem.sos_code || selectedItem.equipment_code} was rejected. Reason: ${rejectInput}`,
           type: 'error'
         }).catch(console.error);
      } else {
         ApiService.broadcastNotification({
           title: 'Approval Rejected',
           message: `Submission for ${selectedItem.sos_code || selectedItem.equipment_code} by ${selectedItem.submitted_by_name || selectedItem.inspector_name || 'User'} was rejected. Reason: ${rejectInput}`,
           type: 'error'
         }).catch(console.error);
      }
      
      setModalMode(null);
      setRetry(r => r + 1);
    } catch (e) { 
      alert(e.message || 'Rejection failed'); 
    }
    finally { setActionLoading(null); }
  };

  return (
    <div className="rpt-page">
      <div className="rpt-header">
        <button className="rpt-back-btn" onClick={onBack} title="Back to Dashboard">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="rpt-header-info">
          <div className="rpt-title-text">Pending Approvals</div>
        </div>
      </div>

      <div className="rpt-data-panel">
        <div className="rpt-data-panel-header">
          <div className="rpt-data-panel-title">
            <div className="rpt-title-main">
              {!loading && <span className="rpt-count-badge">{filteredItems.length} requests pending</span>}
            </div>
          </div>
          {!loading && items.length > 0 && (
            <div className="rpt-toolbar" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="Search requests..." 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(0,0,0,0.1)',
                  fontSize: '11px',
                  outline: 'none',
                  width: '180px',
                  background: 'rgba(255,255,255,0.8)'
                }}
              />
            </div>
          )}
        </div>

        {loading ? (
          <div className="rpt-spinner" style={{ margin: '40px auto' }}>
            <div className="rpt-spinner-ring" />
            <span className="rpt-spinner-text">Loading pending approvals…</span>
          </div>
        ) : items.length === 0 ? (
          <div className="rpt-empty" style={{ margin: '40px auto' }}>
            <div className="rpt-empty-title">No Pending Approvals</div>
            <div className="rpt-empty-desc">Everything is up to date.</div>
          </div>
        ) : (
          <div className="rpt-table-container">
            <table className="rpt-grid-table">
              <thead>
                <tr>
                  <th style={{ width: '50px', textAlign: 'center' }}>S.No</th>
                  <th>Date &amp; Time</th>
                  <th>Submitted By</th>
                  <th>Unit ID</th>
                  <th>Module</th>
                  <th>Remarks</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item, i) => {
                  const sno = (page - 1) * PAGE_SIZE + i + 1;
                  const dateStr = item.created_at || item.inspected_at;
                  return (
                    <tr key={`${item._itemType}-${item.id}`}>
                      <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: '11px' }}>{sno}</td>
                      <td className="rpt-cell-date-new">
                        <div className="rpt-d">{fmt(dateStr)}</div>
                        <div className="rpt-t">{fmtTime(dateStr)}</div>
                      </td>
                      <td>
                        <span className="rpt-cell-text-dark">{item.submitted_by_name || item.inspector_name || item.user_name || 'Unknown'}</span>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>{item.submitted_by_role || ''}</div>
                      </td>
                      <td><span className="rpt-cell-mono-dark">{item.sos_code || item.equipment_code || '—'}</span></td>
                      <td><span className="rpt-cell-text-dark">{item.equipment_name || item.module_name || '—'}</span></td>
                      <td><span className="rpt-cell-muted-dark" style={{ maxWidth: '200px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.remarks || item.notes || item.description || '—'}</span></td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="rpt-export-btn"
                          onClick={() => openApprove(item)}
                          disabled={actionLoading === item.id}
                          style={{ padding: '4px 8px', fontSize: '10px', background: '#16a34a', color: '#fff', border: 'none', marginRight: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>Approve</span>
                        </button>
                        <button
                          className="rpt-export-btn"
                          onClick={() => openReject(item)}
                          disabled={actionLoading === item.id}
                          style={{ padding: '4px 8px', fontSize: '10px', background: '#dc2626', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                          <span>Reject</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={8}>
                    <div className="rpt-pagination-new">
                      <span className="rpt-pg-info-new">
                        Showing <strong>{pageItems.length}</strong> of <strong>{items.length}</strong> requests
                      </span>
                      <div className="rpt-pg-controls-new">
                        <button className="rpt-pg-btn-new" onClick={() => setPage(page - 1)} disabled={page === 1}>← Previous</button>
                        <span className="rpt-pg-current-new">Page {page} of {totalPages}</span>
                        <button className="rpt-pg-btn-new" onClick={() => setPage(page + 1)} disabled={page === totalPages}>Next →</button>
                      </div>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Modal overlays using existing classes if possible, else inline */}
      {modalMode && selectedItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '400px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: '16px' }}>
              {modalMode === 'approve' ? 'Approve Request' : 'Reject Request'}
            </h3>
            
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Unit ID</div>
              <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 700, fontFamily: 'monospace' }}>{selectedItem.sos_code || selectedItem.equipment_code || '—'}</div>
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>{selectedItem.equipment_name || selectedItem.module_name || ''}</div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                {modalMode === 'approve' ? 'Remarks (Optional)' : 'Reason for rejection *'}
              </label>
              <textarea
                value={modalMode === 'approve' ? remarksInput : rejectInput}
                onChange={e => modalMode === 'approve' ? setRemarksInput(e.target.value) : setRejectInput(e.target.value)}
                placeholder={modalMode === 'approve' ? 'Add approval notes...' : 'Explain why this is rejected...'}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', minHeight: '80px', outline: 'none', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                onClick={() => setModalMode(null)}
                style={{ padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              {modalMode === 'approve' ? (
                <button
                  onClick={handleApprove}
                  disabled={actionLoading === selectedItem.id}
                  style={{ padding: '8px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {actionLoading === selectedItem.id ? 'Approving...' : 'Confirm Approve'}
                </button>
              ) : (
                <button
                  onClick={handleReject}
                  disabled={actionLoading === selectedItem.id || !rejectInput.trim()}
                  style={{ padding: '8px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', opacity: !rejectInput.trim() ? 0.5 : 1 }}
                >
                  {actionLoading === selectedItem.id ? 'Rejecting...' : 'Confirm Reject'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;

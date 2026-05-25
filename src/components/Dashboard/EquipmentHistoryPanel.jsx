import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/apiService';

const fmt = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const EquipmentHistoryPanel = ({ equipmentId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!equipmentId) return;
    setLoading(true);
    ApiService.getEquipmentHistory(equipmentId)
      .then(data => {
        setHistory(Array.isArray(data) ? data : (data?.history || data?.data || []));
      })
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [equipmentId]);

  if (!equipmentId) return null;

  return (
    <div className="fe-ih-section" style={{ display: 'block', marginTop: '20px' }}>
      <div className="fe-ih-header">
        <div className="fe-ih-title">
          <span className="fe-ih-title-icon">📜</span>
          Equipment History
          <span className="fe-ih-count">{history.length}</span>
        </div>
      </div>

      {loading ? (
        <div className="fe-ih-empty">
          <span className="fe-ih-empty-icon">⏳</span>
          <p>Loading history…</p>
        </div>
      ) : history.length === 0 ? (
        <div className="fe-ih-empty">
          <span className="fe-ih-empty-icon">📝</span>
          <p>No historical records found for this equipment.</p>
        </div>
      ) : (
        <div className="fe-ih-list">
          <div className="fe-ih-row fe-ih-row-head">
            <div className="fe-ih-col fe-ih-col-date">Date</div>
            <div className="fe-ih-col">Type</div>
            <div className="fe-ih-col" style={{ flex: 2 }}>Description</div>
            <div className="fe-ih-col">Status</div>
            <div className="fe-ih-col" style={{ flex: 2 }}>Remarks</div>
          </div>

          {history.map((upd, idx) => {
            const isApproved = (upd.status || upd.approval_status || '').toLowerCase() === 'approved';
            const isPending = (upd.status || upd.approval_status || '').toLowerCase() === 'pending';
            
            return (
              <div key={upd.id || idx} className="fe-ih-row fe-ih-row-data">
                <div className="fe-ih-col fe-ih-col-date">
                  <span className="fe-ih-date">{fmt(upd.created_at || upd.submitted_at || upd.updated_at)}</span>
                  <span className="fe-ih-time" style={{ fontSize: '10px', color: 'var(--text3)', display: 'block', marginTop: 2 }}>
                    {upd.submitted_by_name || upd.user_name || 'System'}
                  </span>
                </div>
                <div className="fe-ih-col" style={{ fontSize: '12px', fontWeight: 500 }}>
                  {(upd.update_type || upd.type || 'General').toUpperCase()}
                </div>
                <div className="fe-ih-col" style={{ fontSize: '12px', flex: 2 }}>
                  {upd.description || upd.notes || '—'}
                </div>
                <div className="fe-ih-col">
                  <span className={`fe-ih-result ${isApproved ? 'fe-ih-result-pass' : (isPending ? 'fe-ih-result-pending' : 'fe-ih-result-issues')}`}>
                    {(upd.status || upd.approval_status || 'UNKNOWN').toUpperCase()}
                  </span>
                </div>
                <div className="fe-ih-col" style={{ fontSize: '12px', color: 'var(--text2)', flex: 2 }}>
                  {upd.remarks || upd.rejection_reason || '—'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EquipmentHistoryPanel;

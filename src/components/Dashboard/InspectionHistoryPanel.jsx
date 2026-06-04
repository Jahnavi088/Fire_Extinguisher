import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/apiService';

const fmt = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const scoreColor = (s) => {
  const n = parseFloat(s) || 0;
  return n >= 80 ? '#28a745' : n >= 50 ? '#FF9800' : '#dc3545';
};

const InspectionHistoryPanel = ({ moduleId }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!moduleId) return;
    setLoading(true);
    ApiService.getInspectionReports({ module_id: moduleId, limit: 20 })
      .then(data => {
        setRecords(data.items || []);
        setTotal(data.pagination?.total_matched ?? (data.items || []).length);
      })
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [moduleId]);

  return (
    <div className="fe-ih-section" style={{ display: 'block' }}>
      <div className="fe-ih-header">
        <div className="fe-ih-title">
          <span className="fe-ih-title-icon">📋</span>
          Recent Inspections
          <span className="fe-ih-count">{total}</span>
        </div>
      </div>

      {loading ? (
        <div className="fe-ih-empty">
          <span className="fe-ih-empty-icon">⏳</span>
          <p>Loading inspection records…</p>
        </div>
      ) : records.length === 0 ? (
        <div className="fe-ih-empty">
          <span className="fe-ih-empty-icon">📝</span>
          <p>No inspection records found for this module.</p>
        </div>
      ) : (
        <div className="fe-ih-list">
          <div className="fe-ih-row fe-ih-row-head">
            <div className="fe-ih-col fe-ih-col-date">Date</div>
            <div className="fe-ih-col">SOS Code</div>
            <div className="fe-ih-col">Inspector</div>
            <div className="fe-ih-col fe-ih-col-stat">Score</div>
            <div className="fe-ih-col fe-ih-col-stat">✅ Pass</div>
            <div className="fe-ih-col fe-ih-col-stat">❌ Fail</div>
            <div className="fe-ih-col fe-ih-col-status">Result</div>
          </div>

          {records.map((rec) => {
            const sc = parseFloat(rec.score) || 0;
            const col = scoreColor(sc);
            const isFail = rec.result === 'fail';
            const approvedLocally = JSON.parse(localStorage.getItem('approved_inspections') || '[]');
            const isApproved = (rec.approval_status || rec.status || '').toUpperCase() === 'APPROVED' || approvedLocally.map(String).includes(String(rec.id));
            const isPending = !isApproved && (rec.approval_status || rec.status || '').toUpperCase() === 'PENDING';

            return (
              <div key={rec.id} className="fe-ih-row fe-ih-row-data">
                <div className="fe-ih-col fe-ih-col-date">
                  <span className="fe-ih-date">{fmt(rec.created_at)}</span>
                  <span className="fe-ih-time" style={{ fontSize: '10px', color: 'var(--text3)', display: 'block', marginTop: 2 }}>
                    {rec.location_name || rec.building_name || ''}
                  </span>
                </div>
                <div className="fe-ih-col" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                  {rec.sos_code || '—'}
                </div>
                <div className="fe-ih-col" style={{ fontSize: '12px' }}>
                  {rec.inspector_name || '—'}
                </div>
                <div className="fe-ih-col fe-ih-col-stat">
                  <span style={{ color: col, fontWeight: 600, fontSize: '13px' }}>
                    {sc.toFixed(1)}%
                  </span>
                </div>
                <div className="fe-ih-col fe-ih-col-stat">
                  <span className="fe-ih-num fe-ih-pass">{rec.true_count ?? '—'}</span>
                </div>
                <div className="fe-ih-col fe-ih-col-stat">
                  <span className="fe-ih-num fe-ih-fail">{rec.false_count ?? '—'}</span>
                </div>
                <div className="fe-ih-col fe-ih-col-status">
                  {isPending ? (
                    <span className="fe-ih-result fe-ih-result-pending" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px' }}>
                      Pending
                    </span>
                  ) : (
                    <span className={`fe-ih-result ${isFail ? 'fe-ih-result-issues' : 'fe-ih-result-pass'}`}>
                      {isFail
                        ? (rec.critical_fail ? '⚠ Critical' : 'Fail')
                        : 'Pass'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InspectionHistoryPanel;

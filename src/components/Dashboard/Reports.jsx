import React, { useState, useEffect, useMemo } from 'react';
import './Reports.css';
import { ApiService } from '../../services/apiService';

const fmt = (d) => {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};
const fmtTime = (d) => {
  if (!d) return null;
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const REPORT_TYPES = [
  {
    id: 'inspections',
    name: 'Inspection History',
    icon: '📋',
    desc: 'All safety checks and audit logs',
  },
  {
    id: 'status',
    name: 'Equipment Status',
    icon: '📊',
    desc: 'Live health & operational state',
  },
  {
    id: 'expiry',
    name: 'Expiry Schedule',
    icon: '⏳',
    desc: 'NOC, refill & training deadlines',
  },
  {
    id: 'alerts',
    name: 'Critical Alerts Log',
    icon: '🚨',
    desc: 'High-severity safety breach history',
  },
];

const ROWS_PER_PAGE = 10;

/* ── Sub-components ──────────────────────────────────────────────────────── */

const Spinner = () => (
  <div className="rpt-spinner">
    <div className="rpt-spinner-ring" />
    <span className="rpt-spinner-text">Loading report data…</span>
  </div>
);

const ScoreBar = ({ value }) => {
  const cls = value >= 80 ? 'high' : value >= 50 ? 'medium' : 'low';
  return (
    <div className="rpt-score-bar-wrap">
      <div className="rpt-score-bar-track">
        <div className={`rpt-score-bar-fill ${cls}`} style={{ width: `${value}%` }} />
      </div>
      <span className={`rpt-score-val ${cls}`}>{value}%</span>
    </div>
  );
};

const StatusChip = ({ status }) => {
  if (!status) return <span className="rpt-cell-muted">—</span>;
  const normalised = status.toLowerCase().replace(/[^a-z]/g, '');
  const cls =
    ['ok', 'pass', 'operational', 'active'].includes(normalised) ? 'ok' :
    ['fail', 'failed', 'critical'].includes(normalised) ? 'fail' :
    ['warning', 'maintenance'].includes(normalised) ? 'warning' : 'checked';
  return <span className={`rpt-status-chip ${cls}`}>{status.toUpperCase()}</span>;
};

const EmptyState = ({ tab }) => (
  <div className="rpt-empty">
    <div className="rpt-empty-icon">🔍</div>
    <div className="rpt-empty-title">No records found</div>
    <div className="rpt-empty-desc">
      No {tab === 'inspections' ? 'inspection logs' : 'equipment records'} match your current
      filters. Try widening the date range or selecting a different category.
    </div>
  </div>
);

const ComingSoon = ({ tab }) => {
  const content = {
    expiry: {
      icon: '⏳',
      title: 'Expiry Schedule Report',
      desc: 'A comprehensive timeline of upcoming NOC renewals, refill deadlines, and personnel training expirations — compiled automatically from all active modules.',
      features: [
        { icon: '📜', label: 'NOC Renewals' },
        { icon: '🔥', label: 'Refill Deadlines' },
        { icon: '🎓', label: 'Training Expiry' },
        { icon: '📅', label: 'Calendar Export' },
      ],
    },
    alerts: {
      icon: '🚨',
      title: 'Critical Alerts Log',
      desc: 'A historical record of all high-severity safety events, near-misses, and compliance breaches across every facility and equipment category.',
      features: [
        { icon: '🔴', label: 'Severity Levels' },
        { icon: '📍', label: 'Location Drill-down' },
        { icon: '👤', label: 'Responsible Party' },
        { icon: '📤', label: 'Incident Export' },
      ],
    },
  };
  const c = content[tab];
  return (
    <div className="rpt-coming-soon">
      <span className="rpt-coming-badge">Coming Soon</span>
      <div className="rpt-coming-icon">{c.icon}</div>
      <div className="rpt-coming-title">{c.title}</div>
      <div className="rpt-coming-desc">{c.desc}</div>
      <div className="rpt-coming-features">
        {c.features.map(f => (
          <div key={f.label} className="rpt-coming-feature">
            <span>{f.icon}</span>{f.label}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════ */
const Reports = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('inspections');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState({ dateRange: '30', module: 'all' });
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
    fetchReport();
  }, [activeTab, filter]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let res;
      if (activeTab === 'inspections') res = await ApiService.getInspectionReports();
      else if (activeTab === 'status') res = await ApiService.getEquipmentStatusReports();
      else { res = []; }
      setData(Array.isArray(res) ? res : (res?.reports || []));
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (type) => {
    alert(`Exporting ${activeTab} report as ${type.toUpperCase()}. This feature is being prepared.`);
  };

  /* Paginated slice */
  const totalPages = Math.max(1, Math.ceil(data.length / ROWS_PER_PAGE));
  const pageData = useMemo(
    () => data.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE),
    [data, page],
  );

  /* KPI summary derived from data */
  const kpis = useMemo(() => {
    if (activeTab === 'inspections') {
      const total = data.length;
      const passed = data.filter(r => (r.status || '').toLowerCase() === 'ok').length;
      const rate = total > 0 ? Math.round((passed / total) * 100) : 0;
      return [
        { icon: '📋', label: 'Total Records', value: total, color: 'blue',   trend: null },
        { icon: '✅', label: 'Pass Rate',     value: `${rate}%`, color: 'green',  trend: 'up' },
        { icon: '❌', label: 'Issues Found',  value: total - passed, color: 'red',    trend: 'down' },
        { icon: '🔄', label: 'Last Synced',   value: 'Live', color: 'amber', trend: 'neutral' },
      ];
    }
    if (activeTab === 'status') {
      const total = data.length;
      const healthy = data.filter(r => (r.readiness_score || 0) >= 80).length;
      const atRisk  = data.filter(r => (r.readiness_score || 0) < 60).length;
      const avg = total > 0 ? Math.round(data.reduce((s, r) => s + (r.readiness_score || 0), 0) / total) : 0;
      return [
        { icon: '📦', label: 'Total Units',    value: total,   color: 'blue',  trend: null },
        { icon: '💚', label: 'Healthy (≥80%)', value: healthy, color: 'green', trend: 'up' },
        { icon: '⚠️', label: 'At Risk (<60%)', value: atRisk,  color: 'red',   trend: 'down' },
        { icon: '📈', label: 'Avg. Readiness', value: `${avg}%`, color: 'amber', trend: avg >= 70 ? 'up' : 'down' },
      ];
    }
    return [
      { icon: '📊', label: 'Total Records', value: '—', color: 'blue',  trend: null },
      { icon: '✅', label: 'Pass Rate',     value: '—', color: 'green', trend: null },
      { icon: '🚨', label: 'Alerts',        value: '—', color: 'red',   trend: null },
      { icon: '📅', label: 'Period',        value: `${filter.dateRange}d`, color: 'amber', trend: null },
    ];
  }, [data, activeTab, filter.dateRange]);

  const currentType = REPORT_TYPES.find(r => r.id === activeTab);

  return (
    <div className="rpt-page">
      {/* ── Header ── */}
      <div className="rpt-header">
        <button className="rpt-back-btn" onClick={onBack}>
          <svg viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
          Dashboard
        </button>
        <div className="rpt-header-info">
          <div className="rpt-header-title">
            <div className="rpt-header-title-icon">📊</div>
            Enterprise Safety Reporting
          </div>
          <div className="rpt-header-sub">Compliance records, audit logs &amp; historical safety analytics</div>
        </div>
        <div className="rpt-header-actions">
          <button className="rpt-export-btn csv" onClick={() => handleExport('csv')}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </button>
          <button className="rpt-export-btn pdf" onClick={() => handleExport('pdf')}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Export PDF
          </button>
        </div>
      </div>

      {/* ── KPI Summary ── */}
      <div className="rpt-kpi-strip">
        {kpis.map((k, i) => (
          <div key={i} className="rpt-kpi-card">
            <div className={`rpt-kpi-icon-wrap ${k.color}`}>{k.icon}</div>
            <div className="rpt-kpi-body">
              <div className="rpt-kpi-value">{k.value}</div>
              <div className="rpt-kpi-label">{k.label}</div>
              {k.trend && (
                <div className={`rpt-kpi-trend ${k.trend}`}>
                  {k.trend === 'up' && '▲ Good'}
                  {k.trend === 'down' && '▼ Needs attention'}
                  {k.trend === 'neutral' && '● Real-time'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Report Type Tabs ── */}
      <div className="rpt-tabs-row">
        {REPORT_TYPES.map(rt => (
          <div
            key={rt.id}
            className={`rpt-tab ${activeTab === rt.id ? 'active' : ''}`}
            onClick={() => setActiveTab(rt.id)}
          >
            <div className="rpt-tab-header">
              <div className="rpt-tab-icon-wrap">{rt.icon}</div>
              {activeTab === rt.id && <div className="rpt-tab-active-dot" />}
            </div>
            <div className="rpt-tab-name">{rt.name}</div>
            <div className="rpt-tab-desc">{rt.desc}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="rpt-filters">
        <div className="rpt-filter-group">
          <span className="rpt-filter-label">
            <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Time Range
          </span>
          <select
            className="rpt-select"
            value={filter.dateRange}
            onChange={e => setFilter({ ...filter, dateRange: e.target.value })}
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">This Year</option>
          </select>
        </div>

        <div className="rpt-filter-divider" />

        <div className="rpt-filter-group">
          <span className="rpt-filter-label">
            <svg viewBox="0 0 24 24"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            Category
          </span>
          <select
            className="rpt-select"
            value={filter.module}
            onChange={e => setFilter({ ...filter, module: e.target.value })}
          >
            <option value="all">All Modules</option>
            <option value="1">Fire Extinguishers</option>
            <option value="3">Sprinklers</option>
            <option value="29">Fire NOC</option>
            <option value="23">Trained Personnel</option>
          </select>
        </div>

        {!loading && data.length > 0 && (
          <div className="rpt-filter-results">
            Showing <strong>{pageData.length}</strong> of <strong>{data.length}</strong> records
          </div>
        )}
      </div>

      {/* ── Data Panel ── */}
      <div className="rpt-data-panel">
        <div className="rpt-data-panel-header">
          <div className="rpt-data-panel-title">
            <svg viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            {currentType.name} Data
            {!loading && data.length > 0 && (
              <span className="rpt-count-badge">{data.length} records</span>
            )}
          </div>
        </div>

        {loading ? (
          <Spinner />
        ) : activeTab === 'inspections' ? (
          <>
            <div className="rpt-table">
              <div className="rpt-table-head cols-6">
                {['Date & Time', 'Inspector', 'Unit ID', 'Result', 'Module', 'Remarks'].map(h => (
                  <span key={h} className="rpt-th">{h}</span>
                ))}
              </div>
              <div className="rpt-table-body">
                {pageData.length > 0 ? pageData.map((row, i) => (
                  <div key={i} className="rpt-table-row cols-6">
                    <div className="rpt-cell-date">
                      <strong>{fmt(row.created_at) || '—'}</strong>
                      <span>{fmtTime(row.created_at) || ''}</span>
                    </div>
                    <span className="rpt-cell-text">{row.staff_name || row.user_name || 'Admin'}</span>
                    <span className="rpt-cell-mono">{row.sos_code || row.equipment_code || '—'}</span>
                    <StatusChip status={row.status || 'CHECKED'} />
                    <span className="rpt-cell-text">{row.module_name || 'Safety'}</span>
                    <span className="rpt-cell-muted">{row.remarks || '—'}</span>
                  </div>
                )) : <EmptyState tab="inspections" />}
              </div>
            </div>
            {data.length > ROWS_PER_PAGE && (
              <Pagination page={page} totalPages={totalPages} onChange={setPage} total={data.length} />
            )}
          </>
        ) : activeTab === 'status' ? (
          <>
            <div className="rpt-table">
              <div className="rpt-table-head cols-6-status">
                {['Unit ID', 'Equipment Type', 'Operational State', 'Readiness', 'Building', 'Last Inspection'].map(h => (
                  <span key={h} className="rpt-th">{h}</span>
                ))}
              </div>
              <div className="rpt-table-body">
                {pageData.length > 0 ? pageData.map((row, i) => (
                  <div key={i} className="rpt-table-row cols-6-status">
                    <span className="rpt-cell-mono">{row.sos_code || '—'}</span>
                    <span className="rpt-cell-text">{row.equipment_type || '—'}</span>
                    <StatusChip status={row.operational_status || 'Operational'} />
                    <ScoreBar value={row.readiness_score ?? 0} />
                    <span className="rpt-cell-text">{row.building_name || '—'}</span>
                    <div className="rpt-cell-date">
                      <strong>{fmt(row.last_inspection_date) || '—'}</strong>
                      <span>{fmtTime(row.last_inspection_date) || ''}</span>
                    </div>
                  </div>
                )) : <EmptyState tab="status" />}
              </div>
            </div>
            {data.length > ROWS_PER_PAGE && (
              <Pagination page={page} totalPages={totalPages} onChange={setPage} total={data.length} />
            )}
          </>
        ) : (
          <ComingSoon tab={activeTab} />
        )}
      </div>
    </div>
  );
};

/* ── Pagination component ────────────────────────────────────────────────── */
const Pagination = ({ page, totalPages, onChange, total }) => {
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }
  return (
    <div className="rpt-pagination">
      <span className="rpt-page-info">
        Page <strong>{page}</strong> of <strong>{totalPages}</strong> &nbsp;·&nbsp; <strong>{total}</strong> total records
      </span>
      <div className="rpt-page-controls">
        <button className="rpt-page-btn" onClick={() => onChange(page - 1)} disabled={page === 1}>‹ Prev</button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, padding: '0 4px' }}>…</span>
          ) : (
            <button key={p} className={`rpt-page-btn ${page === p ? 'active' : ''}`} onClick={() => onChange(p)}>{p}</button>
          )
        )}
        <button className="rpt-page-btn" onClick={() => onChange(page + 1)} disabled={page === totalPages}>Next ›</button>
      </div>
    </div>
  );
};

export default Reports;

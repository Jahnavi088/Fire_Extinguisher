import { useState, useEffect, useMemo } from 'react';
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

/* ── SVG Icon Library ──────────────────────────────────────────────────────── */
const Icons = {
  Clipboard: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  ),
  BarChart: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="12" width="4" height="9" />
      <rect x="10" y="7" width="4" height="14" />
      <rect x="17" y="3" width="4" height="18" />
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  BellAlert: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      <line x1="12" y1="2" x2="12" y2="4" />
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  CheckCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  XCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  RefreshCw: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  Box: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  Heart: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  AlertTriangle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  TrendingUp: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  FileText: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="11" y2="17" />
    </svg>
  ),
  Flame: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2c0 0-5 5-5 10a5 5 0 0 0 10 0c0-2-1-3.5-2-5 0 0-1 1.5-2 2-1-2-1-7-1-7z" />
      <path d="M10 17.5A2.5 2.5 0 0 0 12.5 20a2.5 2.5 0 0 0 1.5-.5" />
    </svg>
  ),
  GraduationCap: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  ),
  ShieldAlert: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  MapPin: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  User: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Share: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  ArrowUp: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  ),
  ArrowDown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  ),
  RadioDot: () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="5" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  ChevronRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  List: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  Filter: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  ),
  Download: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  FilePdf: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
    </svg>
  ),
};

const REPORT_TYPES = [
  {
    id: 'inspections',
    name: 'Inspection History',
    Icon: Icons.Clipboard,
    desc: 'All safety checks and audit logs',
  },
  {
    id: 'status',
    name: 'Equipment Status',
    Icon: Icons.BarChart,
    desc: 'Live health & operational state',
  },
  {
    id: 'expiry',
    name: 'Expiry Schedule',
    Icon: Icons.Clock,
    desc: 'NOC, refill & training deadlines',
  },
  {
    id: 'alerts',
    name: 'Critical Alerts Log',
    Icon: Icons.BellAlert,
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
    <div className="rpt-empty-icon"><Icons.Search /></div>
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
      Icon: Icons.Clock,
      title: 'Expiry Schedule Report',
      desc: 'A comprehensive timeline of upcoming NOC renewals, refill deadlines, and personnel training expirations — compiled automatically from all active modules.',
      features: [
        { Icon: Icons.FileText, label: 'NOC Renewals' },
        { Icon: Icons.Flame, label: 'Refill Deadlines' },
        { Icon: Icons.GraduationCap, label: 'Training Expiry' },
        { Icon: Icons.Calendar, label: 'Calendar Export' },
      ],
    },
    alerts: {
      Icon: Icons.BellAlert,
      title: 'Critical Alerts Log',
      desc: 'A historical record of all high-severity safety events, near-misses, and compliance breaches across every facility and equipment category.',
      features: [
        { Icon: Icons.ShieldAlert, label: 'Severity Levels' },
        { Icon: Icons.MapPin, label: 'Location Drill-down' },
        { Icon: Icons.User, label: 'Responsible Party' },
        { Icon: Icons.Share, label: 'Incident Export' },
      ],
    },
  };
  const c = content[tab];
  return (
    <div className="rpt-coming-soon">
      <span className="rpt-coming-badge">Coming Soon</span>
      <div className="rpt-coming-icon"><c.Icon /></div>
      <div className="rpt-coming-title">{c.title}</div>
      <div className="rpt-coming-desc">{c.desc}</div>
      <div className="rpt-coming-features">
        {c.features.map(f => (
          <div key={f.label} className="rpt-coming-feature">
            <span className="rpt-coming-feature-icon"><f.Icon /></span>
            {f.label}
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

  const totalPages = Math.max(1, Math.ceil(data.length / ROWS_PER_PAGE));
  const pageData = useMemo(
    () => data.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE),
    [data, page],
  );

  const kpis = useMemo(() => {
    if (activeTab === 'inspections') {
      const total = data.length;
      const passed = data.filter(r => (r.status || '').toLowerCase() === 'ok').length;
      const rate = total > 0 ? Math.round((passed / total) * 100) : 0;
      return [
        { Icon: Icons.Clipboard, label: 'Total Records', value: total, color: 'blue', trend: null },
        { Icon: Icons.CheckCircle, label: 'Pass Rate', value: `${rate}%`, color: 'green', trend: 'up' },
        { Icon: Icons.XCircle, label: 'Issues Found', value: total - passed, color: 'red', trend: 'down' },
        { Icon: Icons.RefreshCw, label: 'Last Synced', value: 'Live', color: 'amber', trend: 'neutral' },
      ];
    }
    if (activeTab === 'status') {
      const total = data.length;
      const healthy = data.filter(r => (r.readiness_score || 0) >= 80).length;
      const atRisk = data.filter(r => (r.readiness_score || 0) < 60).length;
      const avg = total > 0 ? Math.round(data.reduce((s, r) => s + (r.readiness_score || 0), 0) / total) : 0;
      return [
        { Icon: Icons.Box, label: 'Total Units', value: total, color: 'blue', trend: null },
        { Icon: Icons.Heart, label: 'Healthy (≥80%)', value: healthy, color: 'green', trend: 'up' },
        { Icon: Icons.AlertTriangle, label: 'At Risk (<60%)', value: atRisk, color: 'red', trend: 'down' },
        { Icon: Icons.TrendingUp, label: 'Avg. Readiness', value: `${avg}%`, color: 'amber', trend: avg >= 70 ? 'up' : 'down' },
      ];
    }
    return [
      { Icon: Icons.BarChart, label: 'Total Records', value: '—', color: 'blue', trend: null },
      { Icon: Icons.CheckCircle, label: 'Pass Rate', value: '—', color: 'green', trend: null },
      { Icon: Icons.BellAlert, label: 'Alerts', value: '—', color: 'red', trend: null },
      { Icon: Icons.Calendar, label: 'Period', value: `${filter.dateRange}d`, color: 'amber', trend: null },
    ];
  }, [data, activeTab, filter.dateRange]);

  const currentType = REPORT_TYPES.find(r => r.id === activeTab);

  return (
    <div className="rpt-page">
      {/* ── Header ── */}
      <div className="rpt-header">
        <button className="rpt-back-btn" onClick={onBack} title="Back to Dashboard">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="rpt-header-info">
          <div className="rpt-header-title">
            <div className="rpt-header-title-icon">
              <Icons.BarChart />
            </div>
            <div>
              <div className="rpt-title-text">Enterprise Safety Reporting</div>
              <div className="rpt-header-sub">Compliance records, audit logs & historical safety analytics</div>
            </div>
          </div>
        </div>

        <div className="rpt-header-actions">
          <button className="rpt-export-btn csv" onClick={() => handleExport('csv')}>
            <Icons.Download />
            Export CSV
          </button>
          <button className="rpt-export-btn pdf" onClick={() => handleExport('pdf')}>
            <Icons.FilePdf />
            Export PDF
          </button>
        </div>
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
              <div className="rpt-tab-icon-wrap"><rt.Icon /></div>
              {activeTab === rt.id && <div className="rpt-tab-active-dot" />}
            </div>
            <div className="rpt-tab-name">{rt.name}</div>
            <div className="rpt-tab-desc">{rt.desc}</div>
          </div>
        ))}
      </div>

      {/* ── Data Panel ── */}
      <div className="rpt-data-panel">
        <div className="rpt-data-panel-header">
          <div className="rpt-data-panel-title">
            <div className="rpt-title-main">
              {!loading && data.length > 0 && (
                <span className="rpt-count-badge">{data.length} records found</span>
              )}
            </div>
          </div>

          <div className="rpt-header-filters">
            <div className="rpt-h-filter">
              <span className="rpt-h-label">Time Range:</span>
              <select
                className="rpt-h-select"
                value={filter.dateRange}
                onChange={e => setFilter({ ...filter, dateRange: e.target.value })}
              >
                <option value="7">Last 7d</option>
                <option value="30">Last 30d</option>
                <option value="90">Last 90d</option>
                <option value="365">This Year</option>
              </select>
            </div>

            <div className="rpt-h-divider" />

            <div className="rpt-h-filter">
              <span className="rpt-h-label">Category:</span>
              <select
                className="rpt-h-select"
                value={filter.module}
                onChange={e => setFilter({ ...filter, module: e.target.value })}
              >
                <option value="all">All Modules</option>
                <option value="30">Fire Extinguishers</option>
                <option value="3">Sprinklers</option>
                <option value="24">Emergency Exits</option>
                <option value="25">Emergency Lighting</option>
                <option value="29">Fire NOC</option>
                <option value="23">Trained Personnel</option>
              </select>
            </div>
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
        <button className="rpt-page-btn icon-btn" onClick={() => onChange(page - 1)} disabled={page === 1}>
          <Icons.ChevronLeft /> Prev
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="rpt-page-ellipsis">…</span>
          ) : (
            <button key={p} className={`rpt-page-btn ${page === p ? 'active' : ''}`} onClick={() => onChange(p)}>{p}</button>
          )
        )}
        <button className="rpt-page-btn icon-btn" onClick={() => onChange(page + 1)} disabled={page === totalPages}>
          Next <Icons.ChevronRight />
        </button>
      </div>
    </div>
  );
};

export default Reports;

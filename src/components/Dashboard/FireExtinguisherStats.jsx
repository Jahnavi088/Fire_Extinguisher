import React, { useState, useEffect, useMemo } from 'react';
import './FireExtinguisherStats.css';
import { ApiService } from '../../services/apiService';
import { fetchEquipmentByStatus } from '../../services/equipmentService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import SortIndicator from './SortIndicator';
import { sortItems } from '../../services/sorting';
import BackBtn from './BackBtn';
import InspectionHistoryPanel from './InspectionHistoryPanel';
import EquipmentHistoryPanel from './EquipmentHistoryPanel';

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const fmt = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const isExpired = (d) => d && new Date(d) < new Date();
const scoreColor = (s) => {
  const n = parseFloat(s) || 0;
  return n >= 90 ? '#28a745' : n >= 80 ? '#FF9800' : '#dc3545';
};
const condColor = (v) =>
  v === 'OK' ? '#28a745'
    : (v === 'LOW' || v === 'SCRATCHED') ? '#FF9800'
      : (v === 'MISSING' || v === 'DAMAGED') ? '#dc3545'
        : '#666';

const ALERT_COLOR = { 1: '#FF9800', 2: '#f43f5e', 3: '#dc3545' };

const KPI_CARDS = [
  { type: 'all', label: 'Total Fleet', icon: '🧯', color: '#3b82f6', key: 'total' },
  { type: 'active', label: 'Active', icon: '✅', color: '#28a745', key: 'active' },
  { type: 'needs-service', label: 'Needs Service', icon: '🔧', color: '#f59e0b', key: 'needs_service' },
  { type: 'expired', label: 'Expired', icon: '⌛', color: '#8b5cf6', key: 'expired' },
  { type: 'due-inspection', label: 'Due Inspection', icon: '🚨', color: '#dc3545', key: 'due_inspection' },
];

const PAGE_SIZE = 10;


/* ── Sub-components ───────────────────────────────────────────────────────── */
const Spinner = () => (
  <div className="fe-spinner">
    <div className="fe-spinner-ring" />
    <span className="fe-spinner-text">Loading data…</span>
  </div>
);

const Pagination = ({ page, totalPages, total, pageSize, onPage }) => {
  if (totalPages <= 1) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  return (
    <div className="fe-pagination">
      <span className="fe-page-info">
        Showing <strong>{start}–{end}</strong> of <strong>{total}</strong> records
      </span>
      <div className="fe-page-controls">
        <button className="fe-page-btn" onClick={() => onPage(page - 1)} disabled={page === 1}>
          ← Prev
        </button>
        {pages.map((p, i) =>
          p === '…'
            ? <span key={`e${i}`} className="fe-page-ellipsis">…</span>
            : <button
              key={p}
              className={`fe-page-btn fe-page-num${p === page ? ' fe-page-active' : ''}`}
              onClick={() => onPage(p)}
            >
              {p}
            </button>
        )}
        <button className="fe-page-btn" onClick={() => onPage(page + 1)} disabled={page === totalPages}>
          Next →
        </button>
      </div>
    </div>
  );
};

const SectionTitle = ({ children }) => (
  <div className="fe-section-title">{children}</div>
);

const InfoRow = ({ label, val, color }) => (
  <div className="fe-info-row">
    <span className="fe-info-label">{label}</span>
    <span className="fe-info-value" style={color ? { color } : {}}>
      {val || '—'}
    </span>
  </div>
);

const ReadinessBar = ({ score }) => {
  const pct = parseFloat(score) || 0;
  const c = scoreColor(pct);
  return (
    <>
      <div className="fe-readiness-label">Readiness Score</div>
      <div className="fe-readiness-bar">
        <div className="fe-readiness-track">
          <div className="fe-readiness-fill" style={{ width: `${pct}%`, background: c }} />
        </div>
        <span className="fe-readiness-pct" style={{ color: c }}>{pct}%</span>
      </div>
    </>
  );
};

/* ══════════════════════════════════════════════════════════════════════════ */
const FireExtinguisherStats = ({ module, onBack, onRaiseWorkOrder }) => {
  const modId = module?.module_id || 30;
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [alertsSummary, setAlertsSummary] = useState(null);
  const [topAlerts, setTopAlerts] = useState([]);
  const [error, setError] = useState(null);

  const [view, setView] = useState('overview');
  const [listCfg, setListCfg] = useState({ title: '', type: '', color: '' });
  const [listItems, setListItems] = useState([]);
  const [listTotal, setListTotal] = useState(0);
  const [listLoading, setListLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [showInspections, setShowInspections] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [sum, alertsSum, alertsData] = await Promise.all([
        ApiService.getModuleSummary(modId),
        ApiService.getAlertsSummary(),
        ApiService.getAlerts({ module_id: modId, limit: 100 }),
      ]);
      setSummary(sum);
      setAlertsSummary(alertsSum);
      setTopAlerts(alertsData.alerts || []);
    } catch {
      setError('Could not connect to the API. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  const openList = async (card) => {
    setListCfg({ title: card.label, type: card.type, color: card.color });
    setListItems([]);
    setListTotal(0);
    setCurrentPage(1);
    setView('list');
    setListLoading(true);
    try {
      const data = await fetchEquipmentByStatus(modId, card.type);
      setListItems(data.items || []);
      setListTotal(data.total || 0);
    } catch {
      setListItems([]);
    } finally {
      setListLoading(false);
    }
  };

  const openDetail = async (item) => {
    setView('detail');
    setDetailLoading(true);
    // Unwrap nested `details` so top-level fields like pressure_status, extinguisher_type are accessible
    setSelectedUnit({ ...item, ...(item.details || {}) });
    try {
      const data = await ApiService.getEquipmentById(item.sos_code || item.id);
      setSelectedUnit({ ...data, ...(data.details || {}) });
    } catch { /* keep row data */ }
    finally { setDetailLoading(false); }
  };

  const onSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return listItems.filter(item => {
      if (!q) return true;
      const d = item.details || {};
      return (item.sos_code || '').toLowerCase().includes(q) ||
        (d.equipment_code || item.equipment_code || '').toLowerCase().includes(q) ||
        (item.location_name || '').toLowerCase().includes(q) ||
        (item.building_name || '').toLowerCase().includes(q) ||
        (d.extinguisher_type || item.extinguisher_type || '').toLowerCase().includes(q) ||
        (d.barcode || '').toLowerCase().includes(q);
    });
  }, [listItems, searchQuery]);

  const sortedItems = useMemo(() => {
    return sortItems(filteredItems, sortConfig);
  }, [filteredItems, sortConfig]);

  const goBack = () => {
    if (view === 'detail') setView('list');
    else if (view === 'list') setView('overview');
    else onBack();
  };

  /* ── loading / error ──────────────────────────────────────────────────── */
  if (loading) return <Spinner />;
  if (error) {
    return (
      <div className="fe-error">
        <span className="fe-error-icon">⚠️</span>
        <p className="fe-error-msg">{error}</p>
        <BackBtn onClick={onBack}>Return to Dashboard</BackBtn>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════
     OVERVIEW
     ══════════════════════════════════════════════════════════════════════ */
  if (view === 'overview') {
    const totalAlerts = alertsSummary?.total_alerts || 0;
    return (
      <div className="fe-page">
        {/* Header */}
        <div className="fe-header">
          <BackBtn onClick={onBack} />
          <div className="fe-header-info">
            <div className="fe-header-title">Fire Extinguisher Fleet Monitor</div>
          </div>
          <span className="fe-score-badge"
            title="Health Calculation: ((Total Fleet - (Expired + Needs Service + Due Inspection)) / Total Fleet) * 100. Click to toggle inspection history panel."
            onClick={() => setShowInspections(!showInspections)}
            style={{ color: scoreColor(summary?.readiness_score), borderColor: scoreColor(summary?.readiness_score) + '66', background: scoreColor(summary?.readiness_score) + '18' }}>
            {summary?.readiness_score ?? 0}%
          </span>

          <div className="fe-header-search">
            <div className="fe-search-box">
              <input
                type="text"
                placeholder="Search SOS code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="fe-search-input"
              />
              {searchQuery && (
                <button className="fe-search-clear" onClick={() => setSearchQuery('')}>✕</button>
              )}
            </div>
          </div>
        </div>

        <div className="fe-kpi-grid">
          {KPI_CARDS.map(card => (
            <div
              key={card.type}
              className="fe-kpi-card"
              style={{ '--kpi-color': card.color }}
              onClick={() => openList(card)}
            >
              <span className="fe-kpi-emoji">{card.icon}</span>
              <span className="fe-kpi-value">
                {card.key === 'active'
                  ? ((summary?.active || 0) + (summary?.upcoming || 0))
                  : (summary?.[card.key] ?? '—')}
              </span>
              <span className="fe-kpi-label">{card.label}</span>
              <span className="fe-kpi-cta">View details →</span>
            </div>
          ))}
        </div>

        {/* Alerts + Fleet health */}
        <div className="fe-panels">
          {/* Alerts panel */}
          <div className="fe-panel">
            <div className="fe-panel-title">
              🔔 Active Alerts
              <span className="fe-panel-title-count">{totalAlerts}</span>
            </div>
            <div className="fe-alert-list">
              {(() => {
                const filtered = topAlerts.filter(a => {
                  const q = searchQuery.toLowerCase();
                  return !q ||
                    (a.sos_code || '').toLowerCase().includes(q) ||
                    (a.barcode || '').toLowerCase().includes(q) ||
                    (a.location_name || '').toLowerCase().includes(q) ||
                    (a.building_name || '').toLowerCase().includes(q);
                });

                if (filtered.length === 0) {
                  return <div className="fe-empty">No matching alerts found.</div>;
                }

                return filtered.slice(0, 10).map((a, i) => {
                  const c = ALERT_COLOR[a.alert_level] || '#888';
                  return (
                    <div key={a.id || i} className="fe-alert-row" style={{ '--alert-color': c }}>
                      <div className="fe-alert-body">
                        <div className="fe-alert-code">{a.sos_code || a.barcode}</div>
                        <div className="fe-alert-loc">{[a.location_name, a.building_name].filter(Boolean).join(' · ')}</div>
                        <div className="fe-alert-reason">
                          {a.alert_label} · {(a.alert_reason || '').replace(/_/g, ' ')}
                        </div>
                      </div>
                      <div className="fe-alert-meta">
                        {a.days_overdue > 0 && (
                          <span className="fe-overdue-chip">{a.days_overdue}d overdue</span>
                        )}
                        <div className="fe-alert-type">{a.extinguisher_type}</div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Fleet health panel */}
          <div className="fe-panel">
            <div className="fe-panel-title">📊 Fleet Health Breakdown</div>
            {summary && (
              <>
                <div style={{ height: 160, width: '100%', marginTop: 5 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={[
                        { name: 'Active', val: (summary.active || 0) + (summary.upcoming || 0), color: '#28a745' },
                        { name: 'Needs Service', val: summary.needs_service, color: '#f59e0b' },
                        { name: 'Expired', val: summary.expired, color: '#8b5cf6' },
                        { name: 'Due Inspection', val: summary.due_inspection, color: '#dc3545' },
                      ]}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--text3)', fontSize: 10, fontWeight: 600 }}
                        interval={0}
                      />
                      <YAxis hide />
                      <Tooltip
                        cursor={false}
                        contentStyle={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: 'var(--text)'
                        }}
                      />
                      <Bar dataKey="val" radius={[4, 4, 0, 0]} barSize={55}>
                        {[
                          { color: '#28a745' }, // Active
                          { color: '#f59e0b' }, // Needs Service
                          { color: '#8b5cf6' }, // Expired
                          { color: '#dc3545' }, // Due Inspection
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="fe-fleet-legend" style={{ marginTop: 20 }}>
                  {[
                    { label: 'Active', val: (summary.active || 0) + (summary.upcoming || 0), color: '#28a745' },
                    { label: 'Needs Service', val: summary.needs_service, color: '#f59e0b' },
                    { label: 'Expired', val: summary.expired, color: '#8b5cf6' },
                    { label: 'Due Inspection', val: summary.due_inspection, color: '#dc3545' },
                  ].map(row => (
                    <div key={row.label} className="fe-legend-row">
                      <div className="fe-legend-dot" style={{ background: row.color }} />
                      <span className="fe-legend-label">{row.label}</span>
                      <span className="fe-legend-val" style={{ color: row.color }}>{row.val}</span>
                      <span className="fe-legend-pct">
                        {((row.val / summary.total) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {showInspections && <InspectionHistoryPanel moduleId={modId} />}
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════
     LIST VIEW
     ══════════════════════════════════════════════════════════════════════ */
  if (view === 'list') {
    const totalPages = Math.ceil(sortedItems.length / PAGE_SIZE);
    const pageSlice = sortedItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    return (
      <div className="fe-page">
        <div className="fe-header">
          <BackBtn onClick={goBack} />
          <div className="fe-header-info">
            <div className="fe-header-title">{listCfg.title}</div>
            <div className="fe-header-sub">
              {listLoading ? 'Fetching units…' : `${listTotal} units`}
            </div>
          </div>

          <div className="fe-header-search">
            <div className="fe-search-box">
              <input
                type="text"
                placeholder="Search SOS code..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="fe-search-input"
              />
              {searchQuery && (
                <button className="fe-search-clear" onClick={() => setSearchQuery('')}>✕</button>
              )}
            </div>
          </div>
        </div>

        {listLoading ? <Spinner /> : (
          <div className="fe-list-body">
            <div className="fe-table">
              <div className="fe-table-head">
                {[
                  { label: 'SOS Code', key: 'sos_code' },
                  { label: 'Type', key: 'extinguisher_type' },
                  { label: 'Location', key: 'location_name' },
                  { label: 'Building / Dept', key: 'building_dept' },
                  { label: 'Readiness', key: 'readiness_score' },
                  { label: 'Last Inspected', key: 'last_inspection_date' },
                ].map(col => (
                  <span
                    key={col.key}
                    className={`fe-table-head-cell ${sortConfig.key === col.key ? 'active' : ''}`}
                    onClick={() => onSort(col.key)}
                  >
                    {col.label}
                    <SortIndicator sortConfig={sortConfig} columnKey={col.key} />
                  </span>
                ))}
              </div>
              {pageSlice.map((item, i) => {
                const sc = parseFloat(item.readiness_score) || 0;
                const col = scoreColor(sc);
                const d = item.details || {};
                return (
                  <div key={item.id || i} className="fe-table-row" onClick={() => openDetail(item)}>
                    <span className="fe-table-sos">{item.sos_code || d.equipment_code || item.equipment_code}</span>
                    <span className="fe-table-type">{d.extinguisher_type || item.extinguisher_type || '—'}</span>
                    <span className="fe-table-loc">{item.location_name || '—'}</span>
                    <span className="fe-table-bldg">
                      {[item.building_name, item.department_name].filter(Boolean).join(' · ') || '—'}
                    </span>
                    <span
                      className="fe-score-chip"
                      style={{ color: col, borderColor: col + '55', background: col + '14' }}
                    >
                      {sc}%
                    </span>
                    <span className="fe-table-date">{fmt(item.last_inspection_date || item.next_inspection_due)}</span>
                  </div>
                );
              })}
              {sortedItems.length === 0 && (
                <div className="fe-table-empty">No matching records found.</div>
              )}
              <Pagination
                page={currentPage}
                totalPages={totalPages}
                total={sortedItems.length}
                pageSize={PAGE_SIZE}
                onPage={(p) => { setCurrentPage(p); }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════
     DETAIL VIEW
     ══════════════════════════════════════════════════════════════════════ */
  const u = selectedUnit || {};
  const sc = parseFloat(u.readiness_score) || 0;
  const c = scoreColor(sc);

  return (
    <div className="fe-page">
      {/* Header */}
      <div className="fe-header">
        <BackBtn onClick={goBack} />
        <span className="fe-header-icon">🧯</span>
        <div className="fe-header-info">
          <div className="fe-header-title" style={{ fontFamily: 'var(--font-mono)' }}>
            {u.sos_code || u.equipment_code || '…'}
          </div>
          <div className="fe-header-sub">{u.extinguisher_type} · {u.location_name}</div>
        </div>
        {onRaiseWorkOrder && (
          <button
            className="fe-compliance-btn"
            style={{ marginRight: '8px', background: '#059669', borderColor: '#34d399' }}
            onClick={() => onRaiseWorkOrder(u.sos_code || u.equipment_code || u.id)}
          >
            🔧 Raise Work Order
          </button>
        )}
        <span
          className="fe-score-badge"
          style={{ color: c, borderColor: c + '66', background: c + '18' }}
        >
          {sc}%
        </span>
      </div>

      {detailLoading ? <Spinner /> : (
        <div className="fe-detail-grid">

          {/* Identity — full width */}
          <div className="fe-detail-card fe-full">
            <SectionTitle>Unit Identity</SectionTitle>
            <div className="fe-identity-grid">
              {[
                { label: 'SOS Code', val: u.sos_code, mono: true },
                { label: 'Barcode', val: u.barcode, mono: true },
                { label: 'Equipment Code', val: u.equipment_code, mono: true },
                { label: 'Serial Number', val: u.serial_number, mono: true },
                { label: 'Type', val: u.extinguisher_type },
                { label: 'Capacity', val: u.capacity_kg ? `${u.capacity_kg} kg` : u.capacity_text },
                { label: 'Manufacturer', val: u.manufacturer_name },
                { label: 'Status', val: u.operational_status },
              ].map(f => (
                <div key={f.label} className="fe-field">
                  <div className="fe-field-label">{f.label}</div>
                  <div className={`fe-field-value${f.mono ? ' mono' : ''}`}>{f.val || '—'}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="fe-detail-card">
            <SectionTitle>📍 Location</SectionTitle>
            <InfoRow label="Location" val={u.location_name} />
            <InfoRow label="Building" val={u.building_name} />
            <InfoRow label="Floor" val={u.floor_name} />
            <InfoRow label="Zone" val={u.zone_name} />
            <InfoRow label="Department" val={u.department_name} />
          </div>

          {/* Key Dates */}
          <div className="fe-detail-card">
            <SectionTitle>📅 Key Dates</SectionTitle>
            <InfoRow label="Installed On" val={fmt(u.installed_on)} />
            <InfoRow label="Last Service" val={fmt(u.last_service_on)} />
            <InfoRow label="Serviced By" val={u.serviced_by} />
            <InfoRow label="Next Inspection" val={fmt(u.next_inspection_due)} color="#FF9800" />
            <InfoRow
              label="Expiry Date"
              val={fmt(u.expiry_date)}
              color={isExpired(u.expiry_date) ? '#dc3545' : null}
            />
          </div>

          {/* Physical Condition */}
          <div className="fe-detail-card">
            <SectionTitle>🔧 Physical Condition</SectionTitle>
            <div className="fe-condition-pills">
              {[
                { label: 'Pressure', val: u.pressure_status },
                { label: 'Hose', val: u.hose_status },
                { label: 'Pin & Seal', val: u.pin_seal_status },
                { label: 'Body', val: u.body_status },
              ].map(pill => {
                const pc = condColor(pill.val);
                return (
                  <div
                    key={pill.label}
                    className="fe-condition-pill"
                    style={{ borderColor: pc + '44', background: pc + '12' }}
                  >
                    <span className="fe-condition-pill-label">{pill.label}</span>
                    <span className="fe-condition-pill-value" style={{ color: pc }}>
                      {pill.val || '—'}
                    </span>
                  </div>
                );
              })}
            </div>
            <ReadinessBar score={u.readiness_score} />
            {u.remarks && (
              <div className="fe-remarks">⚠️ {u.remarks}</div>
            )}
          </div>

          {/* Status Classification */}
          <div className="fe-detail-card">
            <SectionTitle>📊 Status Classification</SectionTitle>
            <div className="fe-status-chips">
              {[
                { label: 'Operational', val: u.operational_status, color: u.operational_status === 'active' ? '#28a745' : '#dc3545' },
                { label: 'Status Bucket', val: u.status_bucket, color: '#3b82f6' },
                { label: 'Overall', val: u.status, color: '#FF9800' },
              ].map(s => (
                <div
                  key={s.label}
                  className="fe-status-chip"
                  style={{ borderColor: s.color + '55', background: s.color + '14' }}
                >
                  <div className="fe-status-chip-label">{s.label}</div>
                  <div className="fe-status-chip-value" style={{ color: s.color }}>{s.val || '—'}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <EquipmentHistoryPanel equipmentId={u.sos_code || u.equipment_code || u.id} />
          </div>
        </div>
      )}
    </div>
  );
};

export default FireExtinguisherStats;

import React, { useState, useEffect } from 'react';
import './FireExtinguisherStats.css';
import { ApiService } from '../../services/apiService';

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const fmt = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const isExpired   = (d) => d && new Date(d) < new Date();
const scoreColor  = (s) => {
  const n = parseFloat(s) || 0;
  return n >= 80 ? '#28a745' : n >= 50 ? '#FF9800' : '#dc3545';
};
const condColor   = (v) =>
  v === 'OK' ? '#28a745'
  : (v === 'LOW' || v === 'SCRATCHED') ? '#FF9800'
  : (v === 'MISSING' || v === 'DAMAGED') ? '#dc3545'
  : '#666';

const ALERT_COLOR = { 1: '#FF9800', 2: '#f43f5e', 3: '#dc3545' };

const KPI_CARDS = [
  { type: 'all',            label: 'Total Fleet',    icon: '🧯', color: '#3b82f6', key: 'total'        },
  { type: 'active',         label: 'Active',         icon: '✅', color: '#28a745', key: 'active'       },
  { type: 'upcoming',       label: 'Due < 30 Days',  icon: '📅', color: '#FF9800', key: 'upcoming'     },
  { type: 'needs-service',  label: 'Needs Service',  icon: '🔧', color: '#f59e0b', key: 'needs_service' },
  { type: 'expired',        label: 'Expired',        icon: '⌛', color: '#8b5cf6', key: 'expired'      },
  { type: 'due-inspection', label: 'Due Inspection', icon: '🚨', color: '#dc3545', key: 'due_inspection' },
];

const PAGE_SIZE = 10;

const fetchByType = (type) => {
  switch (type) {
    case 'all':            return ApiService.getAllExtinguishers();
    case 'active':         return ApiService.getActiveUnits();
    case 'upcoming':       return ApiService.getUpcomingInspections();
    case 'needs-service':  return ApiService.getNeedsService();
    case 'expired':        return ApiService.getExpired();
    case 'due-inspection': return ApiService.getDueInspections();
    default:               return Promise.resolve({ items: [], total: 0 });
  }
};

/* ── Sub-components ───────────────────────────────────────────────────────── */
const Spinner = () => (
  <div className="fe-spinner">
    <div className="fe-spinner-ring" />
    <span className="fe-spinner-text">Loading data…</span>
  </div>
);

const BackBtn = ({ onClick, children }) => (
  <button className="fe-back-btn" onClick={onClick}>
    <svg viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
    {children}
  </button>
);

const Pagination = ({ page, totalPages, total, pageSize, onPage }) => {
  if (totalPages <= 1) return null;
  const start = (page - 1) * pageSize + 1;
  const end   = Math.min(page * pageSize, total);

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
  const c   = scoreColor(pct);
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
const FireExtinguisherStats = ({ onBack }) => {
  const [loading,       setLoading]       = useState(true);
  const [summary,       setSummary]       = useState(null);
  const [alertsSummary, setAlertsSummary] = useState(null);
  const [topAlerts,     setTopAlerts]     = useState([]);
  const [error,         setError]         = useState(null);

  const [view,          setView]          = useState('overview');
  const [listCfg,       setListCfg]       = useState({ title: '', type: '', color: '' });
  const [listItems,     setListItems]     = useState([]);
  const [listTotal,     setListTotal]     = useState(0);
  const [listLoading,   setListLoading]   = useState(false);

  const [currentPage,   setCurrentPage]   = useState(1);

  const [selectedUnit,  setSelectedUnit]  = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [sum, alertsSum, alertsData] = await Promise.all([
        ApiService.getSummary(),
        ApiService.getAlertsSummary(),
        ApiService.getAlerts(),
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
      const data = await fetchByType(card.type);
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
    setSelectedUnit(item);
    try {
      const data = await ApiService.getExtinguisherById(item.id);
      setSelectedUnit(data);
    } catch { /* keep row data */ }
    finally { setDetailLoading(false); }
  };

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
          <BackBtn onClick={onBack}>Back</BackBtn>
          <span className="fe-header-icon">🧯</span>
          <div className="fe-header-info">
            <div className="fe-header-title">Fire Extinguisher Fleet Monitor</div>
            <div className="fe-header-sub">Click any card to drill into that status group</div>
          </div>
          <div className="fe-header-right">
            <div className="fe-live-badge">
              <span className="fe-live-dot" />
              Live · ehs.garrev.com
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="fe-kpi-grid">
          {KPI_CARDS.map(card => (
            <div
              key={card.type}
              className="fe-kpi-card"
              style={{ '--kpi-color': card.color }}
              onClick={() => openList(card)}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 10px 28px ${card.color}30`; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
            >
              <span className="fe-kpi-emoji">{card.icon}</span>
              <span className="fe-kpi-value">{summary?.[card.key] ?? '—'}</span>
              <span className="fe-kpi-label">{card.label}</span>
              <span className="fe-kpi-cta">View details →</span>
            </div>
          ))}
        </div>

        {/* Alert level KPIs */}
        {alertsSummary && (
          <div className="fe-alert-levels">
            {[1, 2, 3].map(lvl => {
              const d = alertsSummary[`level_${lvl}`];
              const c = ALERT_COLOR[lvl];
              return (
                <div key={lvl} className="fe-alert-level-card" style={{ '--level-color': c }}>
                  <div className="fe-alert-level-count">{d.count}</div>
                  <div>
                    <div className="fe-alert-level-name">Level {lvl} — {d.label}</div>
                    <div className="fe-alert-level-desc">{d.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Alerts + Fleet health */}
        <div className="fe-panels">
          {/* Alerts panel */}
          <div className="fe-panel">
            <div className="fe-panel-title">
              🔔 Active Alerts
              <span className="fe-panel-title-count">{totalAlerts}</span>
            </div>
            <div className="fe-alert-list">
              {topAlerts.length === 0 && (
                <div className="fe-empty">No alerts at this time.</div>
              )}
              {topAlerts.slice(0, 10).map((a, i) => {
                const c = ALERT_COLOR[a.alert_level] || '#888';
                return (
                  <div key={a.id || i} className="fe-alert-row" style={{ '--alert-color': c }}>
                    <div className="fe-alert-body">
                      <div className="fe-alert-code">{a.sos_code || a.barcode}</div>
                      <div className="fe-alert-loc">{[a.location_name, a.building_name].filter(Boolean).join(' · ')}</div>
                      <div className="fe-alert-reason" style={{ color: c }}>
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
              })}
            </div>
          </div>

          {/* Fleet health panel */}
          <div className="fe-panel">
            <div className="fe-panel-title">📊 Fleet Health Breakdown</div>
            {summary && (
              <>
                <div className="fe-fleet-bar">
                  {[
                    { key: 'active',        color: '#28a745' },
                    { key: 'upcoming',      color: '#FF9800' },
                    { key: 'needs_service', color: '#f59e0b' },
                    { key: 'expired',       color: '#8b5cf6' },
                    { key: 'due_inspection',color: '#dc3545' },
                  ].map(s => (
                    <div key={s.key} className="fe-fleet-seg"
                      style={{ width: `${(summary[s.key] / summary.total) * 100}%`, background: s.color }}
                      title={`${s.key}: ${summary[s.key]}`}
                    />
                  ))}
                </div>
                <div className="fe-fleet-legend">
                  {[
                    { label: 'Active',         val: summary.active,         color: '#28a745' },
                    { label: 'Upcoming (30d)', val: summary.upcoming,        color: '#FF9800' },
                    { label: 'Needs Service',  val: summary.needs_service,   color: '#f59e0b' },
                    { label: 'Expired',        val: summary.expired,         color: '#8b5cf6' },
                    { label: 'Due Inspection', val: summary.due_inspection,  color: '#dc3545' },
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
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════
     LIST VIEW
     ══════════════════════════════════════════════════════════════════════ */
  if (view === 'list') {
    return (
      <div className="fe-page">
        <div className="fe-header">
          <BackBtn onClick={goBack}>Back</BackBtn>
          <div
            style={{ width: 11, height: 11, borderRadius: '50%', background: listCfg.color, flexShrink: 0, boxShadow: `0 0 8px ${listCfg.color}` }}
          />
          <div className="fe-header-info">
            <div className="fe-header-title">{listCfg.title}</div>
            <div className="fe-header-sub">
              {listLoading ? 'Fetching units…' : `${listTotal} units — click a row to view full details`}
            </div>
          </div>
          {!listLoading && (
            <span className="fe-count-badge" style={{ color: listCfg.color }}>{listTotal}</span>
          )}
        </div>

        {listLoading ? <Spinner /> : (() => {
          const totalPages  = Math.ceil(listItems.length / PAGE_SIZE);
          const pageSlice   = listItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
          return (
            <div className="fe-list-body">
              <div className="fe-table">
                <div className="fe-table-head">
                  {['SOS Code', 'Type', 'Location', 'Building / Dept', 'Readiness', 'Next Inspection'].map(h => (
                    <span key={h} className="fe-table-head-cell">{h}</span>
                  ))}
                </div>
                {pageSlice.map((item, i) => {
                  const sc  = parseFloat(item.readiness_score) || 0;
                  const col = scoreColor(sc);
                  return (
                    <div key={item.id || i} className="fe-table-row" onClick={() => openDetail(item)}>
                      <span className="fe-table-sos">{item.sos_code || item.equipment_code}</span>
                      <span className="fe-table-type">{item.extinguisher_type || '—'}</span>
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
                      <span className="fe-table-date">{fmt(item.next_inspection_due)}</span>
                    </div>
                  );
                })}
                {listItems.length === 0 && (
                  <div className="fe-table-empty">No records found for this status.</div>
                )}
                <Pagination
                  page={currentPage}
                  totalPages={totalPages}
                  total={listItems.length}
                  pageSize={PAGE_SIZE}
                  onPage={(p) => { setCurrentPage(p); }}
                />
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════
     DETAIL VIEW
     ══════════════════════════════════════════════════════════════════════ */
  const u  = selectedUnit || {};
  const sc = parseFloat(u.readiness_score) || 0;
  const c  = scoreColor(sc);

  return (
    <div className="fe-page">
      {/* Header */}
      <div className="fe-header">
        <BackBtn onClick={goBack}>Back to list</BackBtn>
        <span className="fe-header-icon">🧯</span>
        <div className="fe-header-info">
          <div className="fe-header-title" style={{ fontFamily: 'var(--font-mono)' }}>
            {u.sos_code || u.equipment_code || '…'}
          </div>
          <div className="fe-header-sub">{u.extinguisher_type} · {u.location_name}</div>
        </div>
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
                { label: 'SOS Code',       val: u.sos_code,          mono: true },
                { label: 'Barcode',        val: u.barcode,           mono: true },
                { label: 'Equipment Code', val: u.equipment_code,    mono: true },
                { label: 'Serial Number',  val: u.serial_number,     mono: true },
                { label: 'Type',           val: u.extinguisher_type             },
                { label: 'Capacity',       val: u.capacity_kg ? `${u.capacity_kg} kg` : u.capacity_text },
                { label: 'Manufacturer',   val: u.manufacturer_name             },
                { label: 'Status',         val: u.operational_status            },
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
            <InfoRow label="Location"   val={u.location_name} />
            <InfoRow label="Building"   val={u.building_name} />
            <InfoRow label="Floor"      val={u.floor_name} />
            <InfoRow label="Zone"       val={u.zone_name} />
            <InfoRow label="Department" val={u.department_name} />
          </div>

          {/* Key Dates */}
          <div className="fe-detail-card">
            <SectionTitle>📅 Key Dates</SectionTitle>
            <InfoRow label="Installed On"    val={fmt(u.installed_on)} />
            <InfoRow label="Last Service"    val={fmt(u.last_service_on)} />
            <InfoRow label="Serviced By"     val={u.serviced_by} />
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
                { label: 'Pressure',  val: u.pressure_status  },
                { label: 'Hose',      val: u.hose_status      },
                { label: 'Pin & Seal',val: u.pin_seal_status  },
                { label: 'Body',      val: u.body_status      },
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
                { label: 'Operational',   val: u.operational_status, color: u.operational_status === 'active' ? '#28a745' : '#dc3545' },
                { label: 'Status Bucket', val: u.status_bucket,      color: '#3b82f6' },
                { label: 'Overall',       val: u.status,             color: '#FF9800' },
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

        </div>
      )}
    </div>
  );
};

export default FireExtinguisherStats;

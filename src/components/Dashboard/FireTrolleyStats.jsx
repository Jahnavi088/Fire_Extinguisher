import React, { useState, useEffect } from 'react';
import './FireExtinguisherStats.css';
import { ApiService } from '../../services/apiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const fmt = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const scoreColor = (s) => {
  const n = parseFloat(s) || 0;
  return n >= 80 ? '#28a745' : n >= 50 ? '#FF9800' : '#dc3545';
};
const healthColour = (c) => {
  if (c === 'green') return '#28a745';
  if (c === 'amber') return '#FF9800';
  return '#dc3545';
};

const ALERT_COLOR = { 1: '#FF9800', 2: '#f43f5e', 3: '#dc3545' };

const KPI_CARDS = [
  { type: 'all',           label: 'Total Fleet',     icon: '🛒', color: '#3b82f6', key: 'total' },
  { type: 'active',        label: 'Functional',      icon: '✅', color: '#28a745', key: 'active' },
  { type: 'needs-service', label: 'Needs Service',   icon: '🔧', color: '#f59e0b', key: 'needs_service' },
  { type: 'expired',       label: 'Critical/Faulty', icon: '⌛', color: '#8b5cf6', key: 'expired' },
  { type: 'due-inspection',label: 'Due Inspection',  icon: '🚨', color: '#dc3545', key: 'due_inspection' },
];

const PAGE_SIZE = 15;

/* ── Sub-components ───────────────────────────────────────────────────────── */
const Spinner = () => (
  <div className="fe-spinner">
    <div className="fe-spinner-ring" />
    <span className="fe-spinner-text">Loading fire trolley data…</span>
  </div>
);

const BackBtn = ({ onClick, children }) => (
  <button className="fe-back-btn" onClick={onClick}>
    <svg viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
    {children}
  </button>
);

const SectionTitle = ({ children }) => <div className="fe-section-title">{children}</div>;
const InfoRow = ({ label, val, color }) => (
  <div className="fe-info-row">
    <span className="fe-info-label">{label}</span>
    <span className="fe-info-value" style={color ? { color } : {}}>{val || '—'}</span>
  </div>
);

/* ══════════════════════════════════════════════════════════════════════════ */
const FireTrolleyStats = ({ module, onBack }) => {
  // Use module_id from prop — falls back to 55 (Fire Trolley default)
  const modId = module?.module_id || 55;

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [alertsSummary, setAlertsSummary] = useState(null);
  const [topAlerts, setTopAlerts] = useState([]);
  const [plantHealth, setPlantHealth] = useState(null);
  const [view, setView] = useState('overview');
  const [listCfg, setListCfg] = useState({ title: '', type: '', color: '' });
  const [listItems, setListItems] = useState([]);
  const [listTotal, setListTotal] = useState(0);
  const [listLoading, setListLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { load(); }, [modId]);

  const load = async () => {
    try {
      setLoading(true);
      const [sum, alertsSum, alertsData, plantData] = await Promise.all([
        ApiService.getModuleSummary(modId),
        ApiService.getAlertsSummary(),
        ApiService.getAlerts({ module_id: modId, limit: 100 }),
        ApiService.getModulePlantHealth(modId).catch(() => null),
      ]);
      setSummary(sum);
      setAlertsSummary(alertsSum);
      setTopAlerts(alertsData.alerts || []);
      setPlantHealth(plantData);
    } catch (err) {
      console.error('API Load failed for Fire Trolleys:', err);
      setSummary({ total: 0, active: 0, upcoming: 0, needs_service: 0, expired: 0, due_inspection: 0, readiness_score: 0 });
    } finally { setLoading(false); }
  };

  const fetchByType = (type) => {
    const params = { module_id: modId, limit: 200 };
    if (type !== 'all') params.status = type;
    return ApiService.getEquipment(params);
  };

  const openList = async (card) => {
    setListCfg({ title: card.label, type: card.type, color: card.color });
    setListItems([]);
    setView('list');
    setListLoading(true);
    try {
      const data = await fetchByType(card.type);
      setListItems(data.items || []);
      setListTotal(data.total || 0);
    } catch { setListItems([]); }
    finally { setListLoading(false); }
  };

  const openDetail = (item) => {
    setSelectedUnit({ ...item, ...(item.details || {}) });
    setView('detail');
  };

  const goBack = () => {
    if (view === 'detail') setView('list');
    else if (view === 'list') setView('overview');
    else onBack();
  };

  if (loading) return <Spinner />;

  /* ── OVERVIEW ── */
  if (view === 'overview') {
    const totalAlerts = alertsSummary?.total_alerts || 0;
    return (
      <div className="fe-page">
        <div className="fe-header">
          <BackBtn onClick={onBack}>Back</BackBtn>
          <div className="fe-header-info">
            <div className="fe-header-title">{module?.name || 'Fire Trolley'} Fleet Monitor</div>
          </div>
          <span className="fe-score-badge"
            title="Health = ((Total - (Expired + Needs Service + Due Inspection)) / Total) × 100"
            style={{ color: scoreColor(summary?.readiness_score), borderColor: scoreColor(summary?.readiness_score) + '66', background: scoreColor(summary?.readiness_score) + '18', cursor: 'help' }}>
            {summary?.readiness_score ?? 0}%
          </span>
        </div>

        {/* KPI Cards */}
        <div className="fe-kpi-grid">
          {KPI_CARDS.map(card => (
            <div key={card.type} className="fe-kpi-card" style={{ '--kpi-color': card.color }} onClick={() => openList(card)}>
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

        <div className="fe-panels">
          {/* Active Faults */}
          <div className="fe-panel">
            <div className="fe-panel-title">🔔 Active Faults <span className="fe-panel-title-count">{totalAlerts}</span></div>
            <div className="fe-alert-list">
              {topAlerts.length === 0
                ? <div className="fe-empty">No active faults.</div>
                : topAlerts.slice(0, 8).map((a, i) => (
                  <div key={i} className="fe-alert-row" style={{ '--alert-color': ALERT_COLOR[a.alert_level] }}>
                    <div className="fe-alert-body">
                      <div className="fe-alert-code">{a.sos_code}</div>
                      <div className="fe-alert-loc">{a.location_name}</div>
                      <div className="fe-alert-reason">{a.alert_label}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Fleet Health Chart + Plant-Health per building */}
          <div className="fe-panel">
            <div className="fe-panel-title">📊 Fleet Health Breakdown</div>
            {summary && (
              <div style={{ height: 150, width: '100%', marginTop: 5 }}>
                <ResponsiveContainer>
                  <BarChart data={[
                    { name: 'Functional', val: summary.active,        color: '#28a745' },
                    { name: 'Upcoming',   val: summary.upcoming,      color: '#FF9800' },
                    { name: 'Needs Svc',  val: summary.needs_service, color: '#f59e0b' },
                    { name: 'Expired',    val: summary.expired,       color: '#8b5cf6' },
                    { name: 'Due Insp',   val: summary.due_inspection,color: '#dc3545' },
                  ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text3)', fontSize: 10 }} />
                    <YAxis hide />
                    <Tooltip cursor={false} contentStyle={{ background: 'var(--surface)', border: 'none', borderRadius: '8px', fontSize: '12px' }} />
                    <Bar dataKey="val" radius={[4, 4, 0, 0]} barSize={42}>
                      {['#28a745','#FF9800','#f59e0b','#8b5cf6','#dc3545'].map((col, i) => <Cell key={i} fill={col} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Plant-Health per building from /modules/:id/plant-health */}
            {plantHealth?.buildings?.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
                  🏢 Building Health
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {plantHealth.buildings.map(b => {
                    const col = healthColour(b.health_colour);
                    return (
                      <div key={b.building} style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '10px 14px', background: 'rgba(255,255,255,0.03)',
                        borderRadius: '10px', border: `1px solid ${col}33`
                      }}>
                        <div style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: '#fff' }}>{b.building}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>
                          {b.active}/{b.total} active · <span style={{ color: b.at_risk > 0 ? '#f59e0b' : 'rgba(255,255,255,0.3)' }}>{b.at_risk} at risk</span>
                        </div>
                        <div style={{ minWidth: '100px' }}>
                          <div style={{ height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${b.avg_readiness}%`, background: col, borderRadius: '4px' }} />
                          </div>
                          <div style={{ fontSize: '11px', color: col, textAlign: 'right', marginTop: '3px', fontWeight: 700 }}>
                            {b.avg_readiness}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── LIST VIEW ── */
  if (view === 'list') {
    const filtered = searchQuery
      ? listItems.filter(i =>
          (i.sos_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (i.location_name || '').toLowerCase().includes(searchQuery.toLowerCase()))
      : listItems;
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const pageSlice = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    return (
      <div className="fe-page">
        <div className="fe-header">
          <BackBtn onClick={goBack}>Back</BackBtn>
          <div className="fe-header-info">
            <div className="fe-header-title">{listCfg.title}</div>
            <div className="fe-header-sub">{listLoading ? 'Fetching units…' : `${listTotal} units found`}</div>
          </div>
        </div>
        {listLoading ? <Spinner /> : (
          <div className="fe-table">
            <div className="fe-table-head">
              {['SOS Code', 'Location', 'Building', 'Readiness', 'Next Inspection'].map(h =>
                <span key={h} className="fe-table-head-cell">{h}</span>)}
            </div>
            {pageSlice.map((item, i) => {
              const sc = parseFloat(item.readiness_score) || 0;
              const col = scoreColor(sc);
              return (
                <div key={item.id || i} className="fe-table-row" onClick={() => openDetail(item)}>
                  <span className="fe-table-sos">{item.sos_code}</span>
                  <span className="fe-table-loc">{item.location_name || '—'}</span>
                  <span className="fe-table-bldg">{item.building_name || '—'}</span>
                  <span className="fe-score-chip" style={{ color: col, borderColor: col + '55', background: col + '14' }}>{sc}%</span>
                  <span className="fe-table-date">{fmt(item.next_inspection_due)}</span>
                </div>
              );
            })}
            {filtered.length === 0 && <div className="fe-table-empty">No records found.</div>}
            {totalPages > 1 && (
              <div className="fe-pagination">
                <button className="fe-page-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>← Prev</button>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Page {currentPage} of {totalPages}</span>
                <button className="fe-page-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next →</button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  /* ── DETAIL VIEW ── */
  const u = selectedUnit || {};
  const sc = parseFloat(u.readiness_score) || 0;
  const c = scoreColor(sc);
  return (
    <div className="fe-page">
      <div className="fe-header">
        <BackBtn onClick={goBack}>Back to list</BackBtn>
        <span className="fe-header-icon">🛒</span>
        <div className="fe-header-info">
          <div className="fe-header-title" style={{ fontFamily: 'var(--font-mono)' }}>{u.sos_code || 'Unit Details'}</div>
          <div className="fe-header-sub">{u.location_name} · {u.building_name}</div>
        </div>
        <span className="fe-score-badge" style={{ color: c, borderColor: c + '66', background: c + '18' }}>{sc}%</span>
      </div>
      <div className="fe-detail-grid">
        <div className="fe-detail-card fe-full">
          <SectionTitle>Trolley Specifications</SectionTitle>
          <div className="fe-identity-grid">
            <InfoRow label="SOS Code" val={u.sos_code} />
            <InfoRow label="Serial No." val={u.serial_number} />
            <InfoRow label="Operational Status" val={u.operational_status} />
            <InfoRow label="Status Bucket" val={u.status_bucket} />
          </div>
        </div>
        <div className="fe-detail-card">
          <SectionTitle>📍 Location</SectionTitle>
          <InfoRow label="Location" val={u.location_name} />
          <InfoRow label="Building" val={u.building_name} />
          <InfoRow label="Floor" val={u.floor_name} />
          <InfoRow label="Zone" val={u.zone_name} />
          <InfoRow label="Department" val={u.department_name} />
        </div>
        <div className="fe-detail-card">
          <SectionTitle>📅 Key Dates</SectionTitle>
          <InfoRow label="Installed On" val={fmt(u.installed_on)} />
          <InfoRow label="Last Service" val={fmt(u.last_service_on)} />
          <InfoRow label="Next Inspection" val={fmt(u.next_inspection_due)} color="#FF9800" />
          <InfoRow label="Expiry Date" val={fmt(u.expiry_date)} />
          <InfoRow label="Remarks" val={u.remarks} />
        </div>
      </div>
    </div>
  );
};

export default FireTrolleyStats;

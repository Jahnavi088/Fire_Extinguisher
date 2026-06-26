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
  return n >= 80 ? '#10b981' : n >= 50 ? '#FF9800' : '#dc3545';
};
const condColor = (v) =>
  v === 'OK' || v === 'ONLINE' || v === 'GOOD' ? '#10b981'
    : (v === 'INTERMITTENT' || v === 'LOW_BATTERY' || v === 'STAINED') ? '#FF9800'
      : (v === 'OFFLINE' || v === 'DAMAGED' || v === 'FAULTY') ? '#dc3545'
        : '#666';

const ALERT_COLOR = { 1: '#FF9800', 2: '#f43f5e', 3: '#dc3545' };

const KPI_CARDS = [
  { type: 'all', label: 'Total Devices', icon: '📞', color: '#3b82f6', key: 'total' },
  { type: 'active', label: 'Online', icon: '✅', color: '#10b981', key: 'active' },
  { type: 'needs-service', label: 'Maintenance', icon: '🔧', color: '#f59e0b', key: 'needs_service' },
  { type: 'expired', label: 'Offline/Faulty', icon: '⌛', color: '#8b5cf6', key: 'expired' },
  { type: 'due-inspection', label: 'Due Inspection', icon: '🚨', color: '#dc3545', key: 'due_inspection' },
];

const fetchByType = async (type) => {
  if (type === 'active') {
    const [activeData, upcomingData] = await Promise.all([
      ApiService.getEquipment({ module_id: 61, limit: 500, status: 'active' }),
      ApiService.getEquipment({ module_id: 61, limit: 500, status: 'upcoming' }),
    ]);
    return {
      items: [...(activeData.items || []), ...(upcomingData.items || [])],
      total: (activeData.total || 0) + (upcomingData.total || 0),
    };
  }
  const params = { module_id: 61, limit: 500 };
  if (type !== 'all') params.status = type;
  return ApiService.getEquipment(params);
};

/* ── Sub-components ───────────────────────────────────────────────────────── */
const Spinner = () => (
  <div className="fe-spinner">
    <div className="fe-spinner-ring" />
    <span className="fe-spinner-text">Loading emergency comms data…</span>
  </div>
);

const BackBtn = ({ onClick, children }) => (
  <button className="fe-back-btn" onClick={onClick}>
    <svg viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
    {children}
  </button>
);

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
      <div className="fe-readiness-label">Connectivity Score</div>
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
const EmergencyCommStats = ({ module, onBack, onRaiseWorkOrder }) => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [alertsSummary, setAlertsSummary] = useState(null);
  const [topAlerts, setTopAlerts] = useState([]);
  const [view, setView] = useState('overview');
  const [listCfg, setListCfg] = useState({ title: '', type: '', color: '' });
  const [listItems, setListItems] = useState([]);
  const [listTotal, setListTotal] = useState(0);
  const [listLoading, setListLoading] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [detailSource, setDetailSource] = useState('list');
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [sum, alertsSum, alertsData] = await Promise.all([
        ApiService.getModuleSummary(61),                       // /modules/21/summary
        ApiService.getAlertsSummary({ module_id: modId }),                         // /alerts/summary
        ApiService.getAlerts({ module_id: 61, limit: 100 }),    // /alerts?module_id=21
      ]);
      setSummary(sum);
      setAlertsSummary(alertsSum);
      setTopAlerts(alertsData.alerts || []);
    } catch (err) {
      console.error('API Load failed:', err);
      setSummary({ total: 0, active: 0, upcoming: 0, needs_service: 0, expired: 0, due_inspection: 0, readiness_score: 100 });
      setAlertsSummary({ total_alerts: 0, level_1: { count: 0 }, level_2: { count: 0 }, level_3: { count: 0 } });
      setTopAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const openList = async (card) => {
    setListCfg({ title: card.label, type: card.type, color: card.color });
    setListItems([]);
    setListTotal(0);
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

  const openDetail = async (item, source = 'list') => {
    setDetailSource(source);
    setView('detail');
    setDetailLoading(true);
    setSelectedUnit(item);
    try {
      const data = await ApiService.getEquipmentBySosCode(item.sos_code || item.id);
      setSelectedUnit(data);
    } catch { /* keep row data */ }
    finally { setDetailLoading(false); }
  };

  const goBack = () => {
    if (view === 'detail') setView(detailSource);
    else if (view === 'list') setView('overview');
    else onBack();
  };

  if (loading) return <Spinner />;

  if (view === 'overview') {
    const totalAlerts = alertsSummary?.total_alerts || 0;
    return (
      <div className="fe-page">
        <div className="fe-header">
          <BackBtn onClick={onBack} />
          <div className="fe-header-info">
            <div className="fe-header-title">Emergency Communication Monitor</div>
          </div>
          <span className="fe-score-badge" 
            title="Health Calculation: ((Total Devices - (Expired + Needs Service + Due Inspection)) / Total Devices) * 100"
            style={{ color: scoreColor(summary?.readiness_score), borderColor: scoreColor(summary?.readiness_score) + '66', background: scoreColor(summary?.readiness_score) + '18', cursor: 'help' }}>
            {summary?.readiness_score ?? 0}% <span style={{ fontSize: '10px', opacity: 0.8, marginLeft: '4px' }}>ⓘ</span>
          </span>
          <div className="fe-header-search">
            <div className="fe-search-box">
              <span className="fe-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search SOS Code, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="fe-search-input"
              />
            </div>
          </div>
        </div>

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
          <div className="fe-panel">
            <div className="fe-panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🔔 Connectivity Alerts</span>
              <span className="fe-panel-title-count" style={{ border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', padding: '2px 8px', borderRadius: '4px', fontSize: '14px' }}>{totalAlerts}</span>
            </div>
            
            {topAlerts.length > 0 && (
              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>
                Showing latest {Math.min(topAlerts.length, 5)} alerts
              </div>
            )}
            
            <div className="fe-alert-list">
              {topAlerts.length === 0 ? <div className="fe-empty">No active comms alerts.</div> : topAlerts.slice(0, 5).map((a, i) => (
                <div key={i} className="fe-alert-row" onClick={() => openDetail(a, 'overview')} style={{ cursor: 'pointer', '--alert-color': ALERT_COLOR[a.alert_level] || '#ef4444' }}>
                  <div className="fe-alert-body">
                    <div className="fe-alert-code">{a.sos_code}</div>
                    <div className="fe-alert-loc">{a.location_name}</div>
                    <div className="fe-alert-reason" style={{ fontWeight: 700 }}>{a.alert_label || 'EXPIRED UNIT'}</div>
                  </div>
                </div>
              ))}
            </div>
            
            {topAlerts.length > 5 && (
              <div style={{ marginTop: '16px', textAlign: 'right' }}>
                <span 
                  style={{ color: '#3b82f6', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                  onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                >
                  View All Alerts &rarr;
                </span>
              </div>
            )}
          </div>

          <div className="fe-panel">
            <div className="fe-panel-title">📊 Network Health Breakdown</div>
            {summary && (
              <>
                <div style={{ height: 160, width: '100%', marginTop: 5 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={[
                        { name: 'Online', val: (summary.active || 0) + (summary.upcoming || 0), color: '#10b981' },
                        { name: 'Offline', val: summary.expired, color: '#dc3545' },
                      ]}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text3)', fontSize: 10 }} />
                      <YAxis hide />
                      <Tooltip cursor={false} contentStyle={{ background: 'var(--surface)', border: 'none', borderRadius: '8px' }} />
                      <Bar dataKey="val" radius={[4, 4, 0, 0]} barSize={55}>
                        {[{ color: '#10b981' }, { color: '#dc3545' }].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="fe-fleet-legend" style={{ marginTop: 20 }}>
                  {[
                    { label: 'Online', val: (summary.active || 0) + (summary.upcoming || 0), color: '#10b981' },
                    { label: 'Offline/Faulty', val: summary.expired, color: '#dc3545' },
                  ].map(row => (
                    <div key={row.label} className="fe-legend-row">
                      <div className="fe-legend-dot" style={{ background: row.color }} />
                      <span className="fe-legend-label">{row.label}</span>
                      <span className="fe-legend-val" style={{ color: row.color }}>{row.val}</span>
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

  if (view === 'list') {
    return (
      <div className="fe-page">
        <div className="fe-header">
          <BackBtn onClick={goBack} />
          <div className="fe-header-info">
            <div className="fe-header-title">{listCfg.title}</div>
            <div className="fe-header-sub">{listTotal} units found</div>
          </div>
        </div>

        {listLoading ? <Spinner /> : (
          <div className="fe-list-body">
            <div className="fe-table">
              <div className="fe-table-head">
                {['SOS Code', 'Location', 'Building', 'Status', 'Next Test'].map(h => (
                  <span key={h} className="fe-table-head-cell">{h}</span>
                ))}
              </div>
              {listItems.map((item, i) => {
                const sc = parseFloat(item.readiness_score) || 0;
                const col = scoreColor(sc);
                return (
                  <div key={item.id || i} className="fe-table-row" onClick={() => openDetail(item)}>
                    <span className="fe-table-sos">{item.sos_code}</span>
                    <span className="fe-table-loc">{item.location_name}</span>
                    <span className="fe-table-bldg">{item.building_name}</span>
                    <span className="fe-score-chip" style={{ color: col, borderColor: col + '55', background: col + '14' }}>{sc}%</span>
                    <span className="fe-table-date">{fmt(item.next_inspection_due)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  const u = selectedUnit || {};
  const sc = parseFloat(u.readiness_score) || 0;
  const c = scoreColor(sc);

  return (
    <div className="fe-page">
      <div className="fe-header">
        <BackBtn onClick={goBack} />
        <span className="fe-header-icon">📞</span>
        <div className="fe-header-info">
          <div className="fe-header-title">{u.sos_code || '…'}</div>
          <div className="fe-header-sub">{u.equipment_type || 'Emergency Comm Unit'} · {u.location_name}</div>
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
        <span className="fe-score-badge" style={{ color: c, borderColor: c + '66', background: c + '18' }}>{sc}%</span>
      </div>

      {detailLoading ? <Spinner /> : (
        <div className="fe-detail-grid">
          {/* Dynamic Specifications */}
          {Array.isArray(u.field_definitions) && u.field_definitions.length > 0 && (
          <div className="fe-detail-card fe-full">
            <div className="fe-section-title">📋 Specifications (Dynamic)</div>
            <div className="fe-identity-grid">
              {u.field_definitions.sort((a, b) => a.sort_order - b.sort_order).map(f => (
                <div key={f.field_key} className="fe-field">
                  <div className="fe-field-label">{f.field_label}</div>
                  <div className="fe-field-value">{u.details?.[f.field_key] ?? u[f.field_key] ?? '—'}</div>
                </div>
              ))}
            </div>
          </div>
          )}

          <div className="fe-detail-card fe-full">
            <SectionTitle>Unit Identity</SectionTitle>
            <div className="fe-identity-grid">
              <InfoRow label="SOS Code" val={u.sos_code} />
              <InfoRow label="Location" val={u.location_name} />
              <InfoRow label="Building" val={u.building_name} />
              <InfoRow label="Manufacturer" val={u.manufacturer_name || 'Standard Comms'} />
              <InfoRow label="Status" val={u.operational_status} />
            </div>
          </div>

          <div className="fe-detail-card">
            <SectionTitle>📅 Service Cycle</SectionTitle>
            <InfoRow label="Installed On" val={fmt(u.installed_on)} />
            <InfoRow label="Last Signal Test" val={fmt(u.last_inspection_date)} />
            <InfoRow label="Next Test Due" val={fmt(u.next_inspection_due)} color="#FF9800" />
          </div>

          <div className="fe-detail-card">
            <SectionTitle>🔧 System Integrity</SectionTitle>
            <div className="fe-condition-pills">
              <div className="fe-condition-pill" style={{ borderColor: condColor(u.casing_status || 'OK') + '44', background: condColor(u.casing_status || 'OK') + '12' }}>
                <span className="fe-condition-pill-label">Line State</span>
                <span className="fe-condition-pill-value" style={{ color: condColor(u.casing_status || 'OK') }}>{u.casing_status || 'ONLINE'}</span>
              </div>
              <div className="fe-condition-pill" style={{ borderColor: condColor(u.structure_status || 'OK') + '44', background: condColor(u.structure_status || 'OK') + '12' }}>
                <span className="fe-condition-pill-label">Audio Quality</span>
                <span className="fe-condition-pill-value" style={{ color: condColor(u.structure_status || 'OK') }}>{u.structure_status || 'GOOD'}</span>
              </div>
            </div>
            <ReadinessBar score={u.readiness_score} />
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyCommStats;

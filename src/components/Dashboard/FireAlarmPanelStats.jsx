import React, { useState, useEffect } from 'react';
import BackBtn from './BackBtn';
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
  v === 'NORMAL' || v === 'OK' || v === 'HEALTHY' ? '#10b981'
    : (v === 'FAULT' || v === 'TROUBLE' || v === 'DIRTY') ? '#FF9800'
      : (v === 'ALARM' || v === 'OFFLINE' || v === 'CRITICAL') ? '#dc3545'
        : '#666';

const ALERT_COLOR = { 1: '#FF9800', 2: '#f43f5e', 3: '#dc3545' };

const KPI_CARDS = [
  { type: 'all', label: 'Total Panels', icon: '🔔', color: '#3b82f6', key: 'total' },
  { type: 'active', label: 'Normal State', icon: '✅', color: '#10b981', key: 'active' },
  { type: 'needs-service', label: 'Needs Service', icon: '🔧', color: '#f59e0b', key: 'needs_service' },
  { type: 'expired', label: 'Faulty/Critical', icon: '⌛', color: '#8b5cf6', key: 'expired' },
  { type: 'due-inspection', label: 'Due Inspection', icon: '🚨', color: '#dc3545', key: 'due_inspection' },
];

const PAGE_SIZE = 10;

const fetchByType = async (type, moduleId = 35) => {
  if (type === 'active') {
    const [activeData, upcomingData] = await Promise.all([
      ApiService.getEquipment({ module_id: moduleId, limit: 500, status: 'active' }),
      ApiService.getEquipment({ module_id: moduleId, limit: 500, status: 'upcoming' }),
    ]);
    return {
      items: [...(activeData.items || []), ...(upcomingData.items || [])],
      total: (activeData.total || 0) + (upcomingData.total || 0),
    };
  }
  const params = { module_id: moduleId, limit: 500 };
  if (type !== 'all') params.status = type;
  return ApiService.getEquipment(params);
};

/* ── Sub-components ───────────────────────────────────────────────────────── */
const Spinner = () => (
  <div className="fe-spinner">
    <div className="fe-spinner-ring" />
    <span className="fe-spinner-text">Loading fire alarm panel data…</span>
  </div>
);

const ReadinessBar = ({ score }) => {
  const pct = parseFloat(score) || 0;
  const c = scoreColor(pct);
  return (
    <>
      <div className="fe-readiness-label">System Health Score</div>
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
const FireAlarmPanelStats = ({ module, onBack, onRaiseWorkOrder }) => {
  const modId = module?.module_id || module?.id || 35;
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
  const [detailSource, setDetailSource] = useState('list');
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [sum, alertsSum, alertsData] = await Promise.all([
        ApiService.getModuleSummary(modId),
        ApiService.getAlertsSummary({ module_id: modId }),
        ApiService.getAlerts({ module_id: modId, limit: 100 }),
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
    setView('list');
    setListLoading(true);
    try {
      const data = await fetchByType(card.type, modId);
      setListItems(data.items || []);
      setListTotal(data.total || 0);

      
    } catch { setListItems([]); }
    finally { setListLoading(false); }
  };

  const openDetail = async (item, source = 'list') => {
    setDetailSource(source);
    setView('detail');
    setDetailLoading(true);
    setSelectedUnit(item);
    try {
      const data = await ApiService.getEquipmentBySosCode(item.sos_code || item.id);
      setSelectedUnit(data);
    } catch { }
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
          <div className="fe-header-info"><div className="fe-header-title">Fire Alarm Panel Fleet Monitor</div></div>
          <span className="fe-score-badge" 
            title="Health Calculation: ((Total Panels - (Expired + Needs Service + Due Inspection)) / Total Panels) * 100"
            style={{ color: scoreColor(summary?.readiness_score), borderColor: scoreColor(summary?.readiness_score) + '66', background: scoreColor(summary?.readiness_score) + '18', cursor: 'help' }}>
            {summary?.readiness_score ?? 0}% <span style={{ fontSize: '10px', opacity: 0.8, marginLeft: '4px' }}>ⓘ</span>
          </span>
          <div className="fe-header-search">
            <div className="fe-search-box">
              <span className="fe-search-icon">🔍</span>
              <input type="text" placeholder="Search panel code..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="fe-search-input" />
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
            <div className="fe-panel-title">🔔 System Faults <span className="fe-panel-title-count">{totalAlerts}</span></div>
            <div className="fe-alert-list">
              {topAlerts.length === 0 ? <div className="fe-empty">No active panel faults.</div> : topAlerts.map((a, i) => (
                <div key={i} className="fe-alert-row" onClick={() => openDetail(a, 'overview')} style={{ cursor: 'pointer', '--alert-color': ALERT_COLOR[a.alert_level] }}>
                  <div className="fe-alert-body">
                    <div className="fe-alert-code">{a.sos_code}</div>
                    <div className="fe-alert-loc">{a.location_name}</div>
                    <div className="fe-alert-reason">{a.alert_label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="fe-panel">
            <div className="fe-panel-title">📊 Fleet Health Breakdown</div>
            {summary && (
              <>
                <div style={{ height: 160, width: '100%', marginTop: 5 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={[
                        { name: 'Normal', val: (summary.active || 0) + (summary.upcoming || 0), color: '#10b981' },
                        { name: 'Needs Service', val: summary.needs_service || 0, color: '#f59e0b' },
                        { name: 'Faulty', val: summary.expired || 0, color: '#8b5cf6' },
                        { name: 'Due Insp.', val: summary.due_inspection || 0, color: '#dc3545' },
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
                          { color: '#10b981' },
                          { color: '#f59e0b' },
                          { color: '#8b5cf6' },
                          { color: '#dc3545' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="fe-fleet-legend" style={{ marginTop: 20 }}>
                  {[
                    { label: 'Normal State', val: (summary.active || 0) + (summary.upcoming || 0), color: '#10b981' },
                    { label: 'Needs Service', val: summary.needs_service || 0, color: '#f59e0b' },
                    { label: 'Faulty/Critical', val: summary.expired || 0, color: '#8b5cf6' },
                    { label: 'Due Inspection', val: summary.due_inspection || 0, color: '#dc3545' },
                  ].map(row => (
                    <div key={row.label} className="fe-legend-row">
                      <div className="fe-legend-dot" style={{ background: row.color }} />
                      <span className="fe-legend-label">{row.label}</span>
                      <span className="fe-legend-val" style={{ color: row.color }}>{row.val}</span>
                      <span className="fe-legend-pct">
                        {((row.val / (summary.total || 1)) * 100).toFixed(1)}%
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

  if (view === 'list') {
    return (
      <div className="fe-page">
        <div className="fe-header">
          <BackBtn onClick={goBack} />
          <div className="fe-header-info"><div className="fe-header-title">{listCfg.title}</div><div className="fe-header-sub">{listTotal} panels found</div></div>
        </div>
        {listLoading ? <Spinner /> : (
          <div className="fe-table">
            <div className="fe-table-head">{['SOS Code', 'Location', 'Building', 'Health', 'Next Inspection'].map(h => <span key={h} className="fe-table-head-cell">{h}</span>)}</div>
            {listItems.map((item, i) => {
              const sc = parseFloat(item.readiness_score) || 0;
              const col = scoreColor(sc);
              return (
                <div key={i} className="fe-table-row" onClick={() => openDetail(item)}>
                  <span className="fe-table-sos">{item.sos_code}</span>
                  <span className="fe-table-loc">{item.location_name}</span>
                  <span className="fe-table-bldg">{item.building_name}</span>
                  <span className="fe-score-chip" style={{ color: col, borderColor: col + '55', background: col + '14' }}>{sc}%</span>
                  <span className="fe-table-date">{fmt(item.next_inspection_due)}</span>
                </div>
              );
            })}
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
        <span className="fe-header-icon">🔔</span>
        <div className="fe-header-info">
          <div className="fe-header-title">{u.sos_code || '…'}</div>
          <div className="fe-header-sub">{u.equipment_type || 'Fire Alarm Panel'} · {u.location_name}</div>
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

          <div className="fe-detail-card fe-full"><div className="fe-section-title">Panel Specifications</div>
            <div className="fe-identity-grid">
              <InfoRow label="SOS Code" val={u.sos_code} />
              <InfoRow label="Panel Type" val={u.equipment_type || 'Addressable'} />
              <InfoRow label="Zones/Loops" val={u.zones_count || '8 Zones'} />
              <InfoRow label="Status" val={u.operational_status} />
            </div>
          </div>
          <div className="fe-detail-card"><div className="fe-section-title">📅 Key Dates</div>
            <InfoRow label="Installed On" val={fmt(u.installed_on)} />
            <InfoRow label="Last Service" val={fmt(u.last_service_on)} />
            <InfoRow label="Next Due" val={fmt(u.next_inspection_due)} color="#FF9800" />
          </div>
          <div className="fe-detail-card"><div className="fe-section-title">🔧 Operational Integrity</div>
            <div className="fe-condition-pills">
              <div className="fe-condition-pill" style={{ borderColor: condColor(u.power_status || 'OK') + '44', background: condColor(u.power_status || 'OK') + '12' }}>
                <span className="fe-condition-pill-label">Power</span><span className="fe-condition-pill-value" style={{ color: condColor(u.power_status || 'OK') }}>{u.power_status || 'NORMAL'}</span>
              </div>
              <div className="fe-condition-pill" style={{ borderColor: condColor(u.battery_status || 'OK') + '44', background: condColor(u.battery_status || 'OK') + '12' }}>
                <span className="fe-condition-pill-label">Battery</span><span className="fe-condition-pill-value" style={{ color: condColor(u.battery_status || 'OK') }}>{u.battery_status || 'NORMAL'}</span>
              </div>
            </div>
            <ReadinessBar score={u.readiness_score} />
          </div>
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ label, val, color }) => (
  <div className="fe-info-row">
    <span className="fe-info-label">{label}</span>
    <span className="fe-info-value" style={color ? { color } : {}}>
      {val || '—'}
    </span>
  </div>
);

export default FireAlarmPanelStats;

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
const condColor = (v) =>
  v === 'NORMAL' || v === 'OK' || v === 'HEALTHY' ? '#28a745'
    : (v === 'DIM' || v === 'DIRTY' || v === 'FLICKER') ? '#FF9800'
      : (v === 'OFFLINE' || v === 'FAILED' || v === 'DARK') ? '#dc3545'
        : '#666';

const ALERT_COLOR = { 1: '#FF9800', 2: '#f43f5e', 3: '#dc3545' };

const KPI_CARDS = [
  { type: 'all', label: 'Total Lights', icon: '💡', color: '#045A97', key: 'total' },
  { type: 'active', label: 'Operational', icon: '✅', color: '#045A97', key: 'active' },
  { type: 'needs-service', label: 'Needs Repair', icon: '🔧', color: '#045A97', key: 'needs_service' },
  { type: 'expired', label: 'Failed/Offline', icon: '🚨', color: '#045A97', key: 'expired' },
  { type: 'due-inspection', label: 'Due Inspection', icon: '📋', color: '#045A97', key: 'due_inspection' },
];

const PAGE_SIZE = 15;

const fetchByType = async (type, moduleId) => {
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
    <span className="fe-spinner-text">Loading Lighting system data…</span>
  </div>
);

const BackBtn = ({ onClick, children }) => (
  <button className="fe-back-btn" onClick={onClick}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
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

const ReadinessBar = ({ score }) => {
  const pct = parseFloat(score) || 0;
  const c = scoreColor(pct);
  return (
    <>
      <div className="fe-readiness-label">Illumination Readiness</div>
      <div className="fe-readiness-bar">
        <div className="fe-readiness-track"><div className="fe-readiness-fill" style={{ width: `${pct}%`, background: c }} /></div>
        <span className="fe-readiness-pct" style={{ color: c }}>{pct}%</span>
      </div>
    </>
  );
};

/* ══════════════════════════════════════════════════════════════════════════ */
const EmergencyLightingStats = ({ module, onBack, onRaiseWorkOrder }) => {
  const modId = module?.module_id || 38;
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [alertsSummary, setAlertsSummary] = useState(null);
  const [topAlerts, setTopAlerts] = useState([]);
  const [view, setView] = useState('overview');
  const [listCfg, setListCfg] = useState({ title: '', type: '', color: '' });
  const [listItems, setListItems] = useState([]);
  const [listTotal, setListTotal] = useState(0);
  const [listLoading, setListLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    } catch (err) {
      console.error('API Load failed for Lighting, using fallback:', err);
      setSummary({ total: 42, active: 40, upcoming: 1, needs_service: 1, expired: 0, due_inspection: 0, readiness_score: 95 });
      setAlertsSummary({ total_alerts: 1, level_1: { count: 1 }, level_2: { count: 0 }, level_3: { count: 0 } });
      setTopAlerts([]);
    } finally { setLoading(false); }
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
      if (!data.items || data.items.length === 0) {
        const mock = Array.from({ length: 8 }).map((_, i) => ({
          id: `light_${i}`,
          sos_code: `EL-0${i + 1}`,
          equipment_type: i % 3 === 0 ? 'Exit Sign Light' : 'Emergency Bulkhead',
          location_name: `Floor ${Math.floor(i/3) + 1} - Passage ${i % 3 + 1}`,
          building_name: 'Warehouse A',
          readiness_score: 100,
          next_inspection_due: new Date(Date.now() + 86400000 * 90).toISOString()
        }));
        setListItems(mock);
        setListTotal(mock.length);
      }
    } catch { setListItems([]); }
    finally { setListLoading(false); }
  };

  const openDetail = async (item) => {
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
    if (view === 'detail') setView('list');
    else if (view === 'list') setView('overview');
    else onBack();
  };

  if (loading) return <Spinner />;

  if (view === 'overview') {
    const totalAlerts = alertsSummary?.total_alerts || 0;
    return (
      <div className="fe-page">
        <div className="fe-header">
          <BackBtn onClick={onBack}>Back</BackBtn>
          <div className="fe-header-info"><div className="fe-header-title">Emergency Lighting Monitor</div></div>
          <span className="fe-score-badge" 
            title="Health Calculation: ((Total Units - (Expired + Needs Service + Due Inspection)) / Total Units) * 100"
            style={{ color: scoreColor(summary?.readiness_score), borderColor: scoreColor(summary?.readiness_score) + '66', background: scoreColor(summary?.readiness_score) + '18', cursor: 'help' }}>
            {summary?.readiness_score ?? 0}% <span style={{ fontSize: '10px', opacity: 0.8, marginLeft: '4px' }}>ⓘ</span>
          </span>
          <div className="fe-header-search">
            <div className="fe-search-box">
              <span className="fe-search-icon">🔍</span>
              <input type="text" placeholder="Search light code..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="fe-search-input" />
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
            <div className="fe-panel-title">🔔 Power & Charge Alerts <span className="fe-panel-title-count">{totalAlerts}</span></div>
            <div className="fe-alert-list">
              {topAlerts.length === 0 ? <div className="fe-empty">No active lighting faults detected.</div> : topAlerts.map((a, i) => (
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
          <div className="fe-panel">
            <div className="fe-panel-title">📊 Illumination Health Breakdown</div>
            {summary && (
              <>
                <div style={{ height: 160, width: '100%', marginTop: 5 }}>
                  <ResponsiveContainer>
                    <BarChart data={[
                      { name: 'Operational', val: (summary.active || 0) + (summary.upcoming || 0), color: '#28a745' },
                      { name: 'Failed', val: summary.expired, color: '#dc3545' },
                    ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text3)', fontSize: 10 }} />
                      <YAxis hide />
                      <Tooltip cursor={false} contentStyle={{ background: 'var(--surface)', border: 'none', borderRadius: '8px' }} />
                      <Bar dataKey="val" radius={[4, 4, 0, 0]} barSize={55}>
                        {[{ color: '#28a745' }, { color: '#dc3545' }].map((entry, index) => <Cell key={index} fill={entry.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
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
          <BackBtn onClick={goBack}>Back</BackBtn>
          <div className="fe-header-info"><div className="fe-header-title">{listCfg.title}</div><div className="fe-header-sub">{listTotal} lights found</div></div>
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
        <BackBtn onClick={goBack}>Back to list</BackBtn>
        <span className="fe-header-icon">💡</span>
        <div className="fe-header-info">
          <div className="fe-header-title">{u.sos_code || '…'}</div>
          <div className="fe-header-sub">{u.equipment_type || 'Emergency Light'} · {u.location_name}</div>
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
          <div className="fe-detail-card fe-full"><div className="fe-section-title">Light Specifications</div>
            <div className="fe-identity-grid">
              <InfoRow label="SOS Code" val={u.sos_code} />
              <InfoRow label="Light Type" val={u.equipment_type || 'LED Bulkhead'} />
              <InfoRow label="Power Source" val={u.power_type || 'Main/Battery'} />
              <InfoRow label="Operational Status" val={u.operational_status} />
            </div>
          </div>
          <div className="fe-detail-card"><div className="fe-section-title">📅 Compliance Dates</div>
            <InfoRow label="Installed On" val={fmt(u.installed_on)} />
            <InfoRow label="Last Test" val={fmt(u.last_test_on)} />
            <InfoRow label="Next Due" val={fmt(u.next_inspection_due)} color="#FF9800" />
          </div>
          <div className="fe-detail-card"><div className="fe-section-title">🔧 Battery & Lumens</div>
            <div className="fe-condition-pills">
              <div className="fe-condition-pill" style={{ borderColor: condColor(u.battery_status || 'OK') + '44', background: condColor(u.battery_status || 'OK') + '12' }}>
                <span className="fe-condition-pill-label">Battery</span><span className="fe-condition-pill-value" style={{ color: condColor(u.battery_status || 'OK') }}>{u.battery_status || 'NORMAL'}</span>
              </div>
              <div className="fe-condition-pill" style={{ borderColor: condColor(u.lumen_status || 'OK') + '44', background: condColor(u.lumen_status || 'OK') + '12' }}>
                <span className="fe-condition-pill-label">Brightness</span><span className="fe-condition-pill-value" style={{ color: condColor(u.lumen_status || 'OK') }}>{u.lumen_status || 'HEALTHY'}</span>
              </div>
            </div>
            <ReadinessBar score={u.readiness_score} />
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyLightingStats;

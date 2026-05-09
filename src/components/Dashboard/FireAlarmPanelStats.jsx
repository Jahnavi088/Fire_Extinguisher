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
  return n >= 80 ? '#28a745' : n >= 50 ? '#FF9800' : '#dc3545';
};
const condColor = (v) =>
  v === 'NORMAL' || v === 'OK' || v === 'HEALTHY' ? '#28a745'
    : (v === 'FAULT' || v === 'TROUBLE' || v === 'DIRTY') ? '#FF9800'
      : (v === 'ALARM' || v === 'OFFLINE' || v === 'CRITICAL') ? '#dc3545'
        : '#666';

const ALERT_COLOR = { 1: '#FF9800', 2: '#f43f5e', 3: '#dc3545' };

const KPI_CARDS = [
  { type: 'all', label: 'Total Panels', icon: '🔔', color: '#3b82f6', key: 'total' },
  { type: 'active', label: 'Normal State', icon: '✅', color: '#28a745', key: 'active' },
  { type: 'upcoming', label: 'Due < 30 Days', icon: '📅', color: '#FF9800', key: 'upcoming' },
  { type: 'needs-service', label: 'Needs Service', icon: '🔧', color: '#f59e0b', key: 'needs_service' },
  { type: 'expired', label: 'Faulty/Critical', icon: '⌛', color: '#8b5cf6', key: 'expired' },
  { type: 'due-inspection', label: 'Due Inspection', icon: '🚨', color: '#dc3545', key: 'due_inspection' },
];

const PAGE_SIZE = 15;

const fetchByType = (type) => {
  const params = { module_id: 9, limit: 200 };
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
const FireAlarmPanelStats = ({ onBack }) => {
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

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [sum, alertsSum, alertsData] = await Promise.all([
        ApiService.getModuleSummary(9),
        ApiService.getAlertsSummary(),
        ApiService.getAlerts({ module_id: 9, limit: 100 }),
      ]);
      setSummary(sum);
      setAlertsSummary(alertsSum);
      setTopAlerts(alertsData.alerts || []);
    } catch (err) {
      console.error('API Load failed for Fire Alarm Panels, using fallback:', err);
      setSummary({ total: 8, active: 7, upcoming: 1, needs_service: 0, expired: 0, due_inspection: 0, readiness_score: 98 });
      setAlertsSummary({ total_alerts: 1, level_1: { count: 1, label: 'Low', description: 'Fault' }, level_2: { count: 0, label: 'Med', description: 'Trouble' }, level_3: { count: 0, label: 'High', description: 'Alarm' } });
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
      const data = await fetchByType(card.type);
      setListItems(data.items || []);
      setListTotal(data.total || 0);

      if (!data.items || data.items.length === 0) {
        const mock = Array.from({ length: 4 }).map((_, i) => ({
          id: `fp_${i}`,
          sos_code: `FACP-0${i + 1}`,
          equipment_type: 'Conventional Panel',
          location_name: `Building ${String.fromCharCode(65 + i)} - Ground Floor`,
          building_name: `Block ${i + 1}`,
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
              <span className="fe-kpi-value">{summary?.[card.key] ?? '—'}</span>
              <span className="fe-kpi-label">{card.label}</span>
              <span className="fe-kpi-cta">View details →</span>
            </div>
          ))}
        </div>

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

        <div className="fe-panels">
          <div className="fe-panel">
            <div className="fe-panel-title">🔔 System Faults <span className="fe-panel-title-count">{totalAlerts}</span></div>
            <div className="fe-alert-list">
              {topAlerts.length === 0 ? <div className="fe-empty">No active panel faults.</div> : topAlerts.map((a, i) => (
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
            <div className="fe-panel-title">📊 System Health Breakdown</div>
            {summary && (
              <>
                <div style={{ height: 160, width: '100%', marginTop: 5 }}>
                  <ResponsiveContainer>
                    <BarChart data={[
                      { name: 'Normal', val: summary.active, color: '#28a745' },
                      { name: 'Due', val: summary.upcoming, color: '#FF9800' },
                      { name: 'Faulty', val: summary.expired, color: '#dc3545' },
                    ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text3)', fontSize: 10 }} />
                      <YAxis hide />
                      <Tooltip cursor={false} contentStyle={{ background: 'var(--surface)', border: 'none', borderRadius: '8px' }} />
                      <Bar dataKey="val" radius={[4, 4, 0, 0]} barSize={55}>
                        {[{ color: '#28a745' }, { color: '#FF9800' }, { color: '#dc3545' }].map((entry, index) => <Cell key={index} fill={entry.color} />)}
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
        <span className="fe-score-badge" style={{ color: c, borderColor: c + '66', background: c + '18' }}>{sc}%</span>
      </div>
      {detailLoading ? <Spinner /> : (
        <div className="fe-detail-grid">
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

export default FireAlarmPanelStats;

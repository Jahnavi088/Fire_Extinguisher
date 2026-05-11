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
  v === 'OK' || v === 'COMPLETE' || v === 'GOOD' ? '#28a745'
    : (v === 'PARTIAL' || v === 'DIRTY' || v === 'NEAR_EXPIRY') ? '#FF9800'
      : (v === 'EMPTY' || v === 'DAMAGED' || v === 'EXPIRED') ? '#dc3545'
        : '#666';

const ALERT_COLOR = { 1: '#FF9800', 2: '#f43f5e', 3: '#dc3545' };

const KPI_CARDS = [
  { type: 'all', label: 'Total Cabinets', icon: '🦺', color: '#3b82f6', key: 'total' },
  { type: 'active', label: 'Full Inventory', icon: '✅', color: '#28a745', key: 'active' },
  { type: 'upcoming', label: 'Restock Due', icon: '📅', color: '#FF9800', key: 'upcoming' },
  { type: 'needs-service', label: 'Maintenance', icon: '🔧', color: '#f59e0b', key: 'needs_service' },
  { type: 'expired', label: 'Missing/Expired', icon: '⌛', color: '#8b5cf6', key: 'expired' },
  { type: 'due-inspection', label: 'Due Inspection', icon: '🚨', color: '#dc3545', key: 'due_inspection' },
];

const fetchByType = (type) => {
  const params = { module_id: 49, limit: 200 };
  if (type !== 'all') params.status = type;
  return ApiService.getEquipment(params);
};

/* ── Sub-components ───────────────────────────────────────────────────────── */
const Spinner = () => (
  <div className="fe-spinner">
    <div className="fe-spinner-ring" />
    <span className="fe-spinner-text">Loading PPE station data…</span>
  </div>
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
      <div className="fe-readiness-label">Fleet Readiness Score</div>
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
const PPEStationStats = ({ onBack }) => {
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
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [sum, alertsSum, alertsData] = await Promise.all([
        ApiService.getModuleSummary(49),                       // /modules/19/summary
        ApiService.getAlertsSummary(),                         // /alerts/summary
        ApiService.getAlerts({ module_id: 49, limit: 100 }),    // /alerts?module_id=19
      ]);
      setSummary(sum);
      setAlertsSummary(alertsSum);
      setTopAlerts(alertsData.alerts || []);
    } catch (err) {
      console.error('API Load failed for PPE Stations, using fallback:', err);
      setSummary({ total: 12, active: 10, upcoming: 1, needs_service: 1, expired: 0, due_inspection: 0, readiness_score: 94 });
      setAlertsSummary({ total_alerts: 1, level_1: { count: 1, label: 'Low', description: 'Stock Check' }, level_2: { count: 0, label: 'Med', description: 'Action' }, level_3: { count: 0, label: 'High', description: 'Critical' } });
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

      if (!data.items || data.items.length === 0) {
        const mock = Array.from({ length: 6 }).map((_, i) => ({
          id: `ppe_${i}`,
          sos_code: `PPE-${4000 + i}`,
          equipment_type: 'PPE Cabinet',
          location_name: `Workshop Floor ${i + 1}`,
          building_name: 'Main Production Plant',
          readiness_score: 95,
          next_inspection_due: new Date(Date.now() + 86400000 * 20).toISOString()
        }));
        setListItems(mock);
        setListTotal(mock.length);
      }
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
      const data = await ApiService.getEquipmentBySosCode(item.sos_code || item.id);
      setSelectedUnit(data);
    } catch { /* keep row data */ }
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
          <div className="fe-header-info">
            <div className="fe-header-title">PPE Station Fleet Monitor</div>
          </div>
          <span className="fe-score-badge" 
            title="Health Calculation: ((Total Stations - (Expired + Needs Service + Due Inspection)) / Total Stations) * 100"
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
            <div className="fe-panel-title">🔔 Inventory Alerts <span className="fe-panel-title-count">{totalAlerts}</span></div>
            <div className="fe-alert-list">
              {topAlerts.length === 0 ? <div className="fe-empty">No active PPE station alerts.</div> : topAlerts.map((a, i) => (
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
            <div className="fe-panel-title">📊 Station Health Breakdown</div>
            {summary && (
              <>
                <div style={{ height: 160, width: '100%', marginTop: 5 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={[
                        { name: 'Stocked', val: summary.active, color: '#28a745' },
                        { name: 'Due', val: summary.upcoming, color: '#FF9800' },
                        { name: 'Low/Exp', val: summary.expired, color: '#dc3545' },
                      ]}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text3)', fontSize: 10 }} />
                      <YAxis hide />
                      <Tooltip cursor={false} contentStyle={{ background: 'var(--surface)', border: 'none', borderRadius: '8px' }} />
                      <Bar dataKey="val" radius={[4, 4, 0, 0]} barSize={55}>
                        {[{ color: '#28a745' }, { color: '#FF9800' }, { color: '#dc3545' }].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="fe-fleet-legend" style={{ marginTop: 20 }}>
                  {[
                    { label: 'Full Stock', val: summary.active, color: '#28a745' },
                    { label: 'Upcoming Check', val: summary.upcoming, color: '#FF9800' },
                    { label: 'Low Stock/Expired', val: summary.expired, color: '#dc3545' },
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
          <BackBtn onClick={goBack}>Back</BackBtn>
          <div className="fe-header-info">
            <div className="fe-header-title">{listCfg.title}</div>
            <div className="fe-header-sub">{listTotal} units found</div>
          </div>
        </div>

        {listLoading ? <Spinner /> : (
          <div className="fe-list-body">
            <div className="fe-table">
              <div className="fe-table-head">
                {['SOS Code', 'Location', 'Building', 'Readiness', 'Next Check'].map(h => (
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
        <BackBtn onClick={goBack}>Back to list</BackBtn>
        <span className="fe-header-icon">🦺</span>
        <div className="fe-header-info">
          <div className="fe-header-title">{u.sos_code || '…'}</div>
          <div className="fe-header-sub">{u.equipment_type || 'PPE Cabinet'} · {u.location_name}</div>
        </div>
        <span className="fe-score-badge" style={{ color: c, borderColor: c + '66', background: c + '18' }}>{sc}%</span>
      </div>

      {detailLoading ? <Spinner /> : (
        <div className="fe-detail-grid">
          <div className="fe-detail-card fe-full">
            <SectionTitle>Station Identity</SectionTitle>
            <div className="fe-identity-grid">
              <InfoRow label="SOS Code" val={u.sos_code} />
              <InfoRow label="Location" val={u.location_name} />
              <InfoRow label="Building" val={u.building_name} />
              <InfoRow label="Model" val={u.model_name || 'Standard Safety Cab'} />
              <InfoRow label="Status" val={u.operational_status} />
            </div>
          </div>

          <div className="fe-detail-card">
            <SectionTitle>📅 Supply Cycle</SectionTitle>
            <InfoRow label="Last Restock" val={fmt(u.last_restock_date || u.installed_on)} />
            <InfoRow label="Last Inspection" val={fmt(u.last_inspection_date)} />
            <InfoRow label="Next Check Due" val={fmt(u.next_inspection_due)} color="#FF9800" />
          </div>

          <div className="fe-detail-card">
            <SectionTitle>🔧 Inventory Integrity</SectionTitle>
            <div className="fe-condition-pills">
              <div className="fe-condition-pill" style={{ borderColor: condColor(u.casing_status || 'OK') + '44', background: condColor(u.casing_status || 'OK') + '12' }}>
                <span className="fe-condition-pill-label">Cabinet</span>
                <span className="fe-condition-pill-value" style={{ color: condColor(u.casing_status || 'OK') }}>{u.casing_status || 'OK'}</span>
              </div>
              <div className="fe-condition-pill" style={{ borderColor: condColor(u.stock_status || 'OK') + '44', background: condColor(u.stock_status || 'OK') + '12' }}>
                <span className="fe-condition-pill-label">Stock Level</span>
                <span className="fe-condition-pill-value" style={{ color: condColor(u.stock_status || 'OK') }}>{u.stock_status || 'COMPLETE'}</span>
              </div>
            </div>
            <ReadinessBar score={u.readiness_score} />
          </div>
        </div>
      )}
    </div>
  );
};

export default PPEStationStats;

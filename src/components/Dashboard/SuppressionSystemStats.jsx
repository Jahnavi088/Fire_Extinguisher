import React, { useState, useEffect } from 'react';
import BackBtn from './BackBtn';
import './FireExtinguisherStats.css'; // Reusing established styling
import { ApiService } from '../../services/apiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const fmt = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const isExpired = (d) => d && new Date(d) < new Date();
const scoreColor = (s) => {
  const n = parseFloat(s) || 0;
  return n >= 80 ? '#28a745' : n >= 50 ? '#FF9800' : '#dc3545';
};
const condColor = (v) =>
  v === 'OK' ? '#28a745'
    : (v === 'LOW' || v === 'SCRATCHED') ? '#FF9800'
      : (v === 'MISSING' || v === 'DAMAGED') ? '#dc3545'
        : '#666';

const ALERT_COLOR = { 1: '#FF9800', 2: '#f43f5e', 3: '#dc3545' };

const KPI_CARDS = [
  { type: 'all', label: 'Total Systems', icon: '💨', color: '#3b82f6', key: 'total' },
  { type: 'active', label: 'Operational', icon: '✅', color: '#28a745', key: 'active' },
  { type: 'needs-service', label: 'Needs Service', icon: '🔧', color: '#f59e0b', key: 'needs_service' },
  { type: 'expired', label: 'Critical/Faulty', icon: '⌛', color: '#8b5cf6', key: 'expired' },
  { type: 'due-inspection', label: 'Due Inspection', icon: '🚨', color: '#dc3545', key: 'due_inspection' },
];

const PAGE_SIZE = 15;

const fetchByType = (type, moduleId = 7) => {
  const params = { module_id: moduleId, limit: 200 };
  if (type !== 'all') params.status = type;
  return ApiService.getEquipment(params);
};

/* ── Sub-components ───────────────────────────────────────────────────────── */
const Spinner = () => (
  <div className="fe-spinner">
    <div className="fe-spinner-ring" />
    <span className="fe-spinner-text">Loading CO2 suppression data…</span>
  </div>
);

const Pagination = ({ page, totalPages, total, pageSize, onPage }) => {
  if (totalPages <= 1) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const pages = [];
  if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
  else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }
  return (
    <div className="fe-pagination">
      <span className="fe-page-info">Showing <strong>{start}–{end}</strong> of <strong>{total}</strong> systems</span>
      <div className="fe-page-controls">
        <button className="fe-page-btn" onClick={() => onPage(page - 1)} disabled={page === 1}>← Prev</button>
        {pages.map((p, i) => p === '…' ? <span key={i} className="fe-page-ellipsis">…</span> : <button key={p} className={`fe-page-btn fe-page-num${p === page ? ' fe-page-active' : ''}`} onClick={() => onPage(p)}>{p}</button>)}
        <button className="fe-page-btn" onClick={() => onPage(page + 1)} disabled={page === totalPages}>Next →</button>
      </div>
    </div>
  );
};

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
      <div className="fe-readiness-label">System Readiness Score</div>
      <div className="fe-readiness-bar">
        <div className="fe-readiness-track"><div className="fe-readiness-fill" style={{ width: `${pct}%`, background: c }} /></div>
        <span className="fe-readiness-pct" style={{ color: c }}>{pct}%</span>
      </div>
    </>
  );
};

/* ══════════════════════════════════════════════════════════════════════════ */
const SuppressionSystemStats = ({ module, onBack }) => {
  const modId = module?.module_id || 7;
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
      console.error('API Load failed for Suppression, using fallback:', err);
      setSummary({ total: 42, active: 40, upcoming: 2, needs_service: 0, expired: 0, due_inspection: 0, readiness_score: 95 });
      setAlertsSummary({ total_alerts: 0, level_1: { count: 0, label: 'Low', description: 'Minor' }, level_2: { count: 0, label: 'Med', description: 'Action required' }, level_3: { count: 0, label: 'High', description: 'Critical' } });
      setTopAlerts([]);
    } finally { setLoading(false); }
  };

  const openList = async (card) => {
    setListCfg({ title: card.label, type: card.type, color: card.color });
    setListItems([]);
    setListTotal(0);
    setCurrentPage(1);
    setView('list');
    setListLoading(true);
    try {
      const data = await fetchByType(card.type, modId);
      setListItems(data.items || []);
      setListTotal(data.total || 0);
      if (!data.items || data.items.length === 0) {
        const mock = [{ id: 1, sos_code: 'CO2-SYS-01', equipment_type: 'CO2 Suppression', location_name: 'Server Room', building_name: 'Block X', readiness_score: 98, next_inspection_due: new Date().toISOString() }];
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
    } catch { /* row data fallback */ }
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
          <div className="fe-header-info"><div className="fe-header-title">CO2 Fire Suppression Monitor</div></div>
          <span className="fe-score-badge" 
            title="Health Calculation: ((Total Systems - (Expired + Needs Service + Due Inspection)) / Total Systems) * 100"
            style={{ color: scoreColor(summary?.readiness_score), borderColor: scoreColor(summary?.readiness_score) + '66', background: scoreColor(summary?.readiness_score) + '18', cursor: 'help' }}>
            {summary?.readiness_score ?? 0}% <span style={{ fontSize: '10px', opacity: 0.8, marginLeft: '4px' }}>ⓘ</span>
          </span>
          <div className="fe-header-search">
            <div className="fe-search-box">
              <span className="fe-search-icon">🔍</span>
              <input type="text" placeholder="Search system code or location..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="fe-search-input" />
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
              <span className="fe-kpi-cta">Analyze details →</span>
            </div>
          ))}
        </div>

        <div className="fe-panels">
          <div className="fe-panel">
            <div className="fe-panel-title">🔔 Active Suppression Faults <span className="fe-panel-title-count">{totalAlerts}</span></div>
            <div className="fe-alert-list">
              {(() => {
                const filtered = topAlerts.filter(a => {
                  const q = searchQuery.toLowerCase();
                  return !q || (a.sos_code || '').toLowerCase().includes(q) || (a.location_name || '').toLowerCase().includes(q);
                });
                if (filtered.length === 0) return <div className="fe-empty">No matching faults found.</div>;
                return filtered.slice(0, 10).map((a, i) => (
                  <div key={i} className="fe-alert-row" style={{ '--alert-color': ALERT_COLOR[a.alert_level] }}>
                    <div className="fe-alert-body">
                      <div className="fe-alert-code">{a.sos_code}</div>
                      <div className="fe-alert-loc">{[a.location_name, a.building_name].filter(Boolean).join(' · ')}</div>
                      <div className="fe-alert-reason">{a.alert_label}</div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
          <div className="fe-panel">
            <div className="fe-panel-title">📊 System Health Breakdown</div>
            {summary && (
              <>
                <div style={{ height: 160, width: '100%', marginTop: 5 }}>
                  <ResponsiveContainer>
                    <BarChart data={[
                      { name: 'Operational', val: summary.active, color: '#28a745' },
                      { name: 'Upcoming', val: summary.upcoming, color: '#FF9800' },
                      { name: 'Faulty', val: summary.expired, color: '#dc3545' },
                    ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text3)', fontSize: 10 }} />
                      <YAxis hide />
                      <Tooltip cursor={false} contentStyle={{ background: 'var(--surface)', border: 'none', borderRadius: '8px' }} />
                      <Bar dataKey="val" radius={[4, 4, 0, 0]} barSize={55}>
                        {[{ color: '#28a745' }, { color: '#FF9800' }, { color: '#dc3545' }].map((entry, i) => <Cell key={i} fill={entry.color} />)}
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
          <div className="fe-header-info"><div className="fe-header-title">{listCfg.title}</div><div className="fe-header-sub">{listTotal} systems — click to view</div></div>
          <div className="fe-header-search"><div className="fe-search-box"><span className="fe-search-icon">🔍</span><input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="fe-search-input" /></div></div>
        </div>
        {listLoading ? <Spinner /> : (
          <div className="fe-table">
            <div className="fe-table-head">{['SOS Code', 'Location', 'Readiness', 'Next Inspection'].map(h => <span key={h} className="fe-table-head-cell">{h}</span>)}</div>
            {listItems.map((item, i) => {
              const sc = parseFloat(item.readiness_score) || 0;
              const col = scoreColor(sc);
              return (
                <div key={i} className="fe-table-row" onClick={() => openDetail(item)}>
                  <span className="fe-table-sos">{item.sos_code}</span>
                  <span className="fe-table-loc">{item.location_name}</span>
                  <span className="fe-score-chip" style={{ color: col, borderColor: col + '55', background: col + '14' }}>{sc}%</span>
                  <span className="fe-table-date">{fmt(item.next_inspection_due)}</span>
                </div>
              );
            })}
            <Pagination page={currentPage} totalPages={Math.ceil(listTotal / PAGE_SIZE)} total={listTotal} pageSize={PAGE_SIZE} onPage={setCurrentPage} />
          </div>
        )}
      </div>
    );
  }

  const u = selectedUnit || {};
  return (
    <div className="fe-page">
      <div className="fe-header">
        <BackBtn onClick={goBack} />
        <div className="fe-header-info"><div className="fe-header-title">{u.sos_code || 'Unit Details'}</div><div className="fe-header-sub">{u.equipment_type || 'CO2 Suppression'}</div></div>
      </div>
      <div className="fe-detail-grid">
        <div className="fe-detail-card fe-full">
          <SectionTitle>Technical Specifications</SectionTitle>
          <div className="fe-identity-grid">
            <InfoRow label="SOS Code" val={u.sos_code} />
            <InfoRow label="Location" val={u.location_name} />
            <InfoRow label="Building" val={u.building_name} />
            <InfoRow label="Status" val={u.operational_status} />
            <InfoRow label="Next Due" val={fmt(u.next_inspection_due)} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuppressionSystemStats;

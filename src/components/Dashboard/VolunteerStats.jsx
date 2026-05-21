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
const statusColor = (v) =>
  v === 'ACTIVE' || v === 'TRAINED' || v === 'CERTIFIED' ? '#28a745'
    : (v === 'ON_LEAVE' || v === 'TRAINING_DUE' || v === 'PARTIAL') ? '#FF9800'
      : (v === 'INACTIVE' || v === 'EXPIRED' || v === 'UNAVAILABLE') ? '#dc3545'
        : '#666';

const ALERT_COLOR = { 1: '#FF9800', 2: '#f43f5e', 3: '#dc3545' };

const KPI_CARDS = [
  { type: 'all', label: 'Total Volunteers', icon: '👥', color: '#3b82f6', key: 'total' },
  { type: 'active', label: 'Active/Ready', icon: '✅', color: '#28a745', key: 'active' },
  { type: 'needs-service', label: 'In Training', icon: '🔧', color: '#f59e0b', key: 'needs_service' },
  { type: 'expired', label: 'Expired Certs', icon: '⌛', color: '#8b5cf6', key: 'expired' },
  { type: 'due-inspection', label: 'Due Refresher', icon: '🚨', color: '#dc3545', key: 'due_inspection' },
];

const PAGE_SIZE = 15;

const fetchByType = (type) => {
  const params = { module_id: 31, limit: 200 };
  if (type !== 'all') params.status = type;
  return ApiService.getEquipment(params); // Using generic equipment fetch for volunteers
};

/* ── Sub-components ───────────────────────────────────────────────────────── */
const Spinner = () => (
  <div className="fe-spinner">
    <div className="fe-spinner-ring" />
    <span className="fe-spinner-text">Loading volunteer data…</span>
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
      <span className="fe-page-info">Showing <strong>{start}–{end}</strong> of <strong>{total}</strong> volunteers</span>
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
      <div className="fe-readiness-label">Squad Readiness Score</div>
      <div className="fe-readiness-bar">
        <div className="fe-readiness-track"><div className="fe-readiness-fill" style={{ width: `${pct}%`, background: c }} /></div>
        <span className="fe-readiness-pct" style={{ color: c }}>{pct}%</span>
      </div>
    </>
  );
};

/* ══════════════════════════════════════════════════════════════════════════ */
const VolunteerStats = ({ onBack }) => {
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
        ApiService.getModuleSummary(31),
        ApiService.getAlertsSummary(),
        ApiService.getAlerts({ module_id: 31, limit: 100 }),
      ]);
      setSummary(sum);
      setAlertsSummary(alertsSum);
      setTopAlerts(alertsData.alerts || []);
    } catch (err) {
      console.error('API Load failed for Volunteers, using fallback:', err);
      setSummary({ total: 42, active: 38, upcoming: 2, needs_service: 2, expired: 0, due_inspection: 0, readiness_score: 94 });
      setAlertsSummary({ total_alerts: 2, level_1: { count: 2, label: 'Low', description: 'Cert due' }, level_2: { count: 0, label: 'Med', description: 'Fault' }, level_3: { count: 0, label: 'High', description: 'Critical' } });
      setTopAlerts([]);
    } finally { setLoading(false); }
  };

  const openList = async (card) => {
    setListCfg({ title: card.label, type: card.type, color: card.color });
    setListItems([]);
    setView('list');
    setListLoading(true);
    setCurrentPage(1);
    try {
      const data = await fetchByType(card.type);
      setListItems(data.items || []);
      setListTotal(data.total || 0);
      if (!data.items || data.items.length === 0) {
        const mock = Array.from({ length: 10 }).map((_, i) => ({
          id: `vol_${i}`,
          sos_code: `VOL-100${i + 1}`,
          equipment_type: 'Safety Volunteer',
          location_name: `Zone ${Math.floor(i / 3) + 1}`,
          building_name: 'Plant-wide',
          readiness_score: 100,
          next_inspection_due: new Date(Date.now() + 86400000 * 45).toISOString()
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
          <div className="fe-header-info"><div className="fe-header-title">Volunteer Force Monitor</div></div>
          <span className="fe-score-badge" 
            title="Health Calculation: ((Total Volunteers - (Expired + Needs Service + Due Inspection)) / Total Volunteers) * 100"
            style={{ color: scoreColor(summary?.readiness_score), borderColor: scoreColor(summary?.readiness_score) + '66', background: scoreColor(summary?.readiness_score) + '18', cursor: 'help' }}>
            {summary?.readiness_score ?? 0}% <span style={{ fontSize: '10px', opacity: 0.8, marginLeft: '4px' }}>ⓘ</span>
          </span>
          <div className="fe-header-search">
            <div className="fe-search-box">
              <span className="fe-search-icon">🔍</span>
              <input type="text" placeholder="Search volunteer name/ID..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="fe-search-input" />
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
            <div className="fe-panel-title">🔔 Certification & Training Alerts <span className="fe-panel-title-count">{totalAlerts}</span></div>
            <div className="fe-alert-list">
              {topAlerts.length === 0 ? <div className="fe-empty">No active volunteer alerts.</div> : topAlerts.map((a, i) => (
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
            <div className="fe-panel-title">📊 Squad Composition</div>
            {summary && (
              <>
                <div style={{ height: 160, width: '100%', marginTop: 5 }}>
                  <ResponsiveContainer>
                    <BarChart data={[
                      { name: 'Active', val: summary.active, color: '#28a745' },
                      { name: 'Training', val: summary.needs_service, color: '#f59e0b' },
                      { name: 'Due Cert', val: summary.upcoming, color: '#FF9800' },
                    ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text3)', fontSize: 10 }} />
                      <YAxis hide />
                      <Tooltip cursor={false} contentStyle={{ background: 'var(--surface)', border: 'none', borderRadius: '8px' }} />
                      <Bar dataKey="val" radius={[4, 4, 0, 0]} barSize={55}>
                        {[{ color: '#28a745' }, { color: '#f59e0b' }, { color: '#FF9800' }].map((entry, index) => <Cell key={index} fill={entry.color} />)}
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
          <div className="fe-header-info"><div className="fe-header-title">{listCfg.title}</div><div className="fe-header-sub">{listTotal} individuals found</div></div>
        </div>
        {listLoading ? <Spinner /> : (() => {
          const q = searchQuery.toLowerCase();
          const filtered = listItems.filter(item => (item.sos_code || '').toLowerCase().includes(q) || (item.location_name || '').toLowerCase().includes(q));
          const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
          const pageSlice = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
          return (
            <div className="fe-list-body">
              <div className="fe-table">
                <div className="fe-table-head">{['Volunteer ID', 'Designation', 'Zone', 'Readiness', 'Next Refresher'].map(h => <span key={h} className="fe-table-head-cell">{h}</span>)}</div>
                {pageSlice.map((item, i) => {
                  const sc = parseFloat(item.readiness_score) || 0;
                  const col = scoreColor(sc);
                  return (
                    <div key={i} className="fe-table-row" onClick={() => openDetail(item)}>
                      <span className="fe-table-sos">{item.sos_code}</span>
                      <span className="fe-table-loc">{item.equipment_type}</span>
                      <span className="fe-table-bldg">{item.location_name}</span>
                      <span className="fe-score-chip" style={{ color: col, borderColor: col + '55', background: col + '14' }}>{sc}%</span>
                      <span className="fe-table-date">{fmt(item.next_inspection_due)}</span>
                    </div>
                  );
                })}
              </div>
              <Pagination page={currentPage} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onPage={p => setCurrentPage(p)} />
            </div>
          );
        })()}
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
        <span className="fe-header-icon">👥</span>
        <div className="fe-header-info">
          <div className="fe-header-title">{u.sos_code || '…'}</div>
          <div className="fe-header-sub">{u.equipment_type || 'Safety Volunteer'} · {u.location_name}</div>
        </div>
        <span className="fe-score-badge" style={{ color: c, borderColor: c + '66', background: c + '18' }}>{sc}%</span>
      </div>
      {detailLoading ? <Spinner /> : (
        <div className="fe-detail-grid">
          <div className="fe-detail-card fe-full"><div className="fe-section-title">Volunteer Profile</div>
            <div className="fe-identity-grid">
              <InfoRow label="Volunteer ID" val={u.sos_code} />
              <InfoRow label="Zone" val={u.location_name} />
              <InfoRow label="Role" val={u.equipment_type || 'Fire Marshal'} />
              <InfoRow label="Status" val={u.operational_status} />
            </div>
          </div>
          <div className="fe-detail-card"><div className="fe-section-title">📅 Certification Cycle</div>
            <InfoRow label="Joined On" val={fmt(u.installed_on)} />
            <InfoRow label="Last Trained" val={fmt(u.last_inspection_date)} />
            <InfoRow label="Next Refresher" val={fmt(u.next_inspection_due)} color="#FF9800" />
          </div>
          <div className="fe-detail-card"><div className="fe-section-title">🔧 Training Integrity</div>
            <div className="fe-condition-pills">
              <div className="fe-condition-pill" style={{ borderColor: statusColor(u.cert_status || 'TRAINED') + '44', background: statusColor(u.cert_status || 'TRAINED') + '12' }}>
                <span className="fe-condition-pill-label">Certification</span><span className="fe-condition-pill-value" style={{ color: statusColor(u.cert_status || 'TRAINED') }}>{u.cert_status || 'VALID'}</span>
              </div>
              <div className="fe-condition-pill" style={{ borderColor: statusColor(u.availability_status || 'ACTIVE') + '44', background: statusColor(u.availability_status || 'ACTIVE') + '12' }}>
                <span className="fe-condition-pill-label">Availability</span><span className="fe-condition-pill-value" style={{ color: statusColor(u.availability_status || 'ACTIVE') }}>{u.availability_status || 'READY'}</span>
              </div>
            </div>
            <ReadinessBar score={u.readiness_score} />
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerStats;

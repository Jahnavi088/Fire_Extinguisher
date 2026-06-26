import React, { useEffect, useState, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { ApiService } from '../../services/apiService';
import './SuperAdminOverview.css';

const complianceColor = (pct) => {
  if (pct >= 90) return '#16a34a';
  if (pct >= 75) return '#d97706';
  return '#dc2626';
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="sao-chart-tooltip">
        <div className="sao-tooltip-label">{label}</div>
        <div className="sao-tooltip-val">{payload[0].value}%</div>
      </div>
    );
  }
  return null;
};

const AdminOverview = ({ onNavigate, allModules, user, moduleSummaries = {} }) => {
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [trendPeriod, setTrendPeriod] = useState('Last 7 Days');
  const [trendDropOpen, setTrendDropOpen] = useState(false);
  const carouselRef = useRef(null);

  const [kpis, setKpis] = useState({
    totalLocations: 0,
    totalAssets: 0,
    dueInspections: 0,
    expiredAssets: 0,
    overallCompliance: 100,
  });

  const [complianceTrend, setComplianceTrend] = useState([]);
  
  const [locationsList, setLocationsList] = useState([]);
  const [alertsSummary, setAlertsSummary] = useState({
    critical: 0,
    warning: 0,
    info: 0,
    total: 0
  });
  const [donutData, setDonutData] = useState([]);

  const updateTime = () => {
    const now = new Date();
    const h = now.getHours(), m = now.getMinutes();
    const suffix = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    setLastUpdated(`${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`);
  };

  useEffect(() => {
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async (isSilent = false) => {
      if (!isSilent) setLoading(true);
      try {
        const companyId = user?.company_id || user?.companyId || 21;

        const branchesRaw = await ApiService.getBranches({ company_id: companyId }).catch(() => []);
        const buildings = (Array.isArray(branchesRaw) ? branchesRaw : (branchesRaw?.branches || branchesRaw?.data || []))
          .filter(b => !companyId || String(b.company_id) === String(companyId));
        
        const dash = await ApiService.getDashboard().catch(() => ({}));
        const eqRaw = await ApiService.getEquipment({ limit: 1000 }).catch(() => []);
        const eqList = Array.isArray(eqRaw) ? eqRaw : (eqRaw?.items || eqRaw?.data || []);

        const alertsData = await ApiService.getAlertsSummary().catch(() => ({ critical: 0, warning: 0, info: 0, total: 0 }));

        const todayDate = new Date();
        const endDateStr = todayDate.toISOString().split('T')[0];
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(todayDate.getDate() - 30);
        const startDateStr = thirtyDaysAgo.toISOString().split('T')[0];

        const reportsRaw = await ApiService.getInspectionReports({
          start_date: startDateStr,
          end_date: endDateStr,
        }).catch(() => []);
        const reportsList = Array.isArray(reportsRaw)
          ? reportsRaw
          : (reportsRaw?.items || reportsRaw?.reports || reportsRaw?.inspections || reportsRaw?.data || []);

        if (cancelled) return;

        const totalLocations = buildings.length;

        // Count from the location-filtered equipment list so admin only sees
        // equipment that belongs to their assigned company/branches.
        let totalAssets = eqList.length;
        let dueInspections = 0;
        let expiredAssets = 0;
        eqList.forEach(eq => {
          if (eq.status === 'due-inspection' || eq.status === 'due' || eq.status === 'warning') dueInspections += 1;
          if (eq.status === 'expired' || eq.status === 'critical') expiredAssets += 1;
        });

        const locMap = {};
        buildings.forEach(b => {
          locMap[b.id] = { id: b.id, name: b.branch_name || b.name || b.building_name || `Location ${b.id}`, total: 0, due: 0, expired: 0, compliance: 100 };
        });

        eqList.forEach(eq => {

          // Prioritize branch_id since getOnboardingDropdowns populates buildings from branchesData
          const locId = eq.branch_id || eq.location_id || eq.building_id;
          if (locId && locMap[locId]) {
            locMap[locId].total += 1;
            if (eq.status === 'due-inspection' || eq.status === 'due') locMap[locId].due += 1;
            if (eq.status === 'expired') locMap[locId].expired += 1;
          }
        });

        const healthyAssets = Math.max(0, totalAssets - dueInspections - expiredAssets);
        const overallCompliance = totalAssets > 0 ? Math.round((healthyAssets / totalAssets) * 100) : 100;

        setKpis(prev => ({ 
          ...prev, 
          totalLocations,
          totalAssets,
          dueInspections,
          expiredAssets,
          overallCompliance
        }));

        setDonutData([
          { name: 'Healthy', value: healthyAssets, color: '#22c55e' },
          { name: 'Due', value: dueInspections, color: '#f59e0b' },
          { name: 'Expired', value: expiredAssets, color: '#ef4444' }
        ]);
        
        setAlertsSummary({
          critical: alertsData?.critical ?? alertsData?.total_critical ?? 0,
          warning: alertsData?.warning ?? alertsData?.total_warning ?? 0,
          info: alertsData?.info ?? alertsData?.total_info ?? 0,
          total: alertsData?.total ?? 0
        });

        const locationsArr = Object.values(locMap).map(loc => {
          if (loc.total > 0) {
            const issues = loc.due + loc.expired;
            loc.compliance = Math.round(((loc.total - issues) / loc.total) * 100);
          }
          return loc;
        }).sort((a, b) => b.total - a.total);

        setLocationsList(locationsArr);

        const today = new Date();
        const trendDays = trendPeriod === 'Last 30 Days' ? 30 : trendPeriod === 'Last 14 Days' ? 14 : 7;
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const trendData = [];

        for (let i = trendDays - 1; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const label = `${monthNames[d.getMonth()]} ${d.getDate()}`;
          const dayStr = d.toISOString().split('T')[0];

          const dayReports = reportsList.filter(r => {
            const rd = new Date(r.created_at || r.inspected_at);
            return rd.toISOString().split('T')[0] === dayStr;
          });
          const approved = dayReports.filter(r => {
            const st = (r.approval_status || r.status || '').toUpperCase();
            return st === 'APPROVED' || st === 'COMPLIANT';
          });

          let dayCompliance;
          if (dayReports.length > 0) {
            dayCompliance = Math.round((approved.length / dayReports.length) * 100);
          } else {
            dayCompliance = 100;
          }
          trendData.push({ date: label, compliance: dayCompliance });
        }
        setComplianceTrend(trendData);

      } catch (err) {
        console.error('AdminOverview fetchAll error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();
    const interval = setInterval(() => { fetchAll(true); }, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [trendPeriod, user]);




  const scrollCarousel = (dir) => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: dir * 280, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="sao-loading">
        <div className="sao-spinner" />
        <span>Loading Overview…</span>
      </div>
    );
  }

  return (
    <div className="sao-root">
      {/* ── Sub-header ────────────────────────────────────────────────────── */}
      <div className="sao-subheader" style={{ padding: '0 0 16px 0', borderBottom: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Admin Dashboard</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Location & Asset Overview</p>
        </div>
        <div className="sao-subheader-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

          <div className="sao-last-updated">
            <span className="sao-lu-label">Last Updated: {lastUpdated}</span>
            <button className="sao-refresh-btn" onClick={() => window.location.reload()} title="Refresh">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="sao-kpi-grid sao-kpi-grid--5cols">
        <div className="sao-kpi-card" onClick={() => onNavigate && onNavigate('setup-operator-mapping')}>
          <div className="sao-kpi-icon sao-kpi-icon--blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div className="sao-kpi-body">
            <div className="sao-kpi-label">Total Locations</div>
            <div className="sao-kpi-value">{kpis.totalLocations}</div>
            <div className="sao-kpi-sub sao-kpi-sub--green">Active</div>
          </div>
        </div>

        <div className="sao-kpi-card" onClick={() => onNavigate && onNavigate('equipment-grid', 'all')}>
          <div className="sao-kpi-icon sao-kpi-icon--green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div className="sao-kpi-body">
            <div className="sao-kpi-label">Total Assets</div>
            <div className="sao-kpi-value">{(kpis.totalAssets || 0).toLocaleString()}</div>
            <div className="sao-kpi-sub sao-kpi-sub--gray">Across all locations</div>
          </div>
        </div>

        <div className="sao-kpi-card" onClick={() => onNavigate && onNavigate('equipment-grid', 'warning')}>
          <div className="sao-kpi-icon sao-kpi-icon--amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div className="sao-kpi-body">
            <div className="sao-kpi-label">Due Inspections</div>
            <div className="sao-kpi-value">{(kpis.dueInspections || 0).toLocaleString()}</div>
            <div className="sao-kpi-sub sao-kpi-sub--amber">Needs attention</div>
          </div>
        </div>

        <div className="sao-kpi-card" onClick={() => onNavigate && onNavigate('equipment-grid', 'critical')}>
          <div className="sao-kpi-icon sao-kpi-icon--red">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="sao-kpi-body">
            <div className="sao-kpi-label">Expired Assets</div>
            <div className="sao-kpi-value">{(kpis.expiredAssets || 0).toLocaleString()}</div>
            <div className="sao-kpi-sub sao-kpi-sub--red">Immediate action</div>
          </div>
        </div>

        <div className="sao-kpi-card" onClick={() => onNavigate && onNavigate('equipment-grid', 'all')}>
          <div className="sao-kpi-icon sao-kpi-icon--pie">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
              <path d="M22 12A10 10 0 0 0 12 2v10z" />
            </svg>
          </div>
          <div className="sao-kpi-body">
            <div className="sao-kpi-label">Overall Compliance</div>
            <div className="sao-kpi-value" style={{ color: complianceColor(kpis.overallCompliance) }}>
              {kpis.overallCompliance}%
            </div>
            <div className="sao-kpi-sub" style={{ color: complianceColor(kpis.overallCompliance) }}>
              {kpis.overallCompliance >= 90 ? 'Good' : kpis.overallCompliance >= 75 ? 'Moderate' : 'Needs Improvement'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Middle Row: Equipment Status + Compliance Trend ───────────────── */}
      <div className="sao-middle-row">
        {/* Equipment Status Summary */}
        <div className="sao-section sao-equipment-section">
          <div className="sao-section-header">
            <span className="sao-section-title">EQUIPMENT STATUS SUMMARY</span>
            <button className="sao-view-all-btn" onClick={() => onNavigate && onNavigate('equipment-grid')}>
              View All Equipment
            </button>
          </div>
          <div className="sao-carousel-wrap">
            <button className="sao-carousel-btn sao-carousel-btn--left" onClick={() => scrollCarousel(-1)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <div className="sao-carousel" ref={carouselRef}>
              {(allModules || []).map((mod) => {
                const summary = moduleSummaries[mod.module_id] || {};
                const score = summary.compliance ?? mod.health_score ?? 0;
                const status = score < 80 ? 'critical' : score >= 90 ? 'healthy' : 'warning';
                return (
                  <div
                    key={mod.module_id}
                    className={`eq-card ${status}`}
                    style={{ minWidth: 160, maxWidth: 160, height: 200, flexShrink: 0 }}
                    onClick={() => onNavigate && onNavigate('equipment-grid', 'all', mod.code)}
                  >
                    <div className="eq-icon">
                      {mod.image
                        ? <img src={mod.image} alt={mod.name}
                          className={`eq-card-img eq-img-${mod.code}`}
                          onError={e => { e.target.style.display = 'none'; e.target.parentElement.textContent = '📦'; }} />
                        : '📦'}
                    </div>
                    <div className="eq-info-wrap">
                      <div className="eq-name">{mod.name}</div>
                      <div className="eq-pct">{score}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button className="sao-carousel-btn sao-carousel-btn--right" onClick={() => scrollCarousel(1)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
        </div>

        {/* Compliance Trend */}
        <div className="sao-section sao-trend-section">
          <div className="sao-section-header">
            <span className="sao-section-title">COMPLIANCE TREND</span>
            <div className="sao-trend-filter" onClick={() => setTrendDropOpen(v => !v)}>
              <span>{trendPeriod}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><path d="M6 9l6 6 6-6" /></svg>
              {trendDropOpen && (
                <div className="sao-dropdown-menu sao-dropdown-menu--right">
                  {['Last 7 Days', 'Last 14 Days', 'Last 30 Days'].map(p => (
                    <div key={p} className={`sao-dropdown-item ${trendPeriod === p ? 'active' : ''}`}
                      onClick={(e) => { e.stopPropagation(); setTrendPeriod(p); setTrendDropOpen(false); }}>
                      {p}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="sao-chart-wrap" style={{ width: '100%', paddingBottom: '16px' }}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={complianceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis domain={[70, 100]} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `${v}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="compliance" stroke="#3b82f6" strokeWidth={2.5}
                  dot={{ fill: '#3b82f6', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Bottom Row: Compliance Record + Recent Alerts ──────────────────── */}
      <div className="sao-bottom-row">
        
        {/* Compliance Record */}
        <div className="sao-section">
          <div className="sao-section-header">
            <span className="sao-section-title">LOCATION WISE SUMMARY</span>
          </div>
          <div style={{ display: 'flex', gap: '20px', padding: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            


            <div className="sao-table-wrap" style={{ flex: 1, minWidth: '300px' }}>
              <table className="sao-table">
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Assets</th>
                    <th>Due</th>
                    <th>Expired</th>
                    <th>Compliance</th>
                  </tr>
                </thead>
                <tbody>
                  {locationsList.length === 0 ? (
                    <tr><td colSpan="5" className="sao-table-empty">No locations found</td></tr>
                  ) : (
                    locationsList.slice(0, 5).map(loc => (
                      <tr key={loc.id}>
                        <td style={{ fontWeight: 600, color: '#111827' }}>{loc.name}</td>
                        <td>{loc.total}</td>
                        <td><span className="sao-due-val">{loc.due > 0 ? loc.due : '-'}</span></td>
                        <td><span className="sao-expired-val">{loc.expired > 0 ? loc.expired : '-'}</span></td>
                        <td>
                          <span className="sao-compliance-badge" style={{ 
                            background: loc.compliance >= 90 ? '#dcfce7' : loc.compliance >= 75 ? '#fef3c7' : '#fee2e2',
                            color: loc.compliance >= 90 ? '#16a34a' : loc.compliance >= 75 ? '#d97706' : '#dc2626'
                           }}>
                            {loc.compliance}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>

        {/* Recent Alerts */}
        <div className="sao-section">
          <div className="sao-section-header">
            <span className="sao-section-title">RECENT ALERTS</span>
            <button className="sao-view-all-btn" onClick={() => onNavigate && onNavigate('reports')}>
              View All
            </button>
          </div>
          <div className="sao-pending-list">
            <div className="sao-pending-item" onClick={() => onNavigate && onNavigate('equipment-grid', 'critical')}>
              <div className="sao-pending-icon sao-pending-icon--red">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="sao-pending-info">
                <div className="sao-pending-name">Critical Issues</div>
                <div className="sao-pending-desc">Immediate action required</div>
              </div>
              <div className="sao-pending-count" style={{ color: '#ef4444' }}>
                {alertsSummary.critical}
              </div>
              <svg className="sao-pending-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M9 18l6-6-6-6" /></svg>
            </div>

            <div className="sao-pending-item" onClick={() => onNavigate && onNavigate('equipment-grid', 'warning')}>
              <div className="sao-pending-icon sao-pending-icon--amber">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="sao-pending-info">
                <div className="sao-pending-name">Warnings</div>
                <div className="sao-pending-desc">Due inspections</div>
              </div>
              <div className="sao-pending-count" style={{ color: '#f59e0b' }}>
                {alertsSummary.warning}
              </div>
              <svg className="sao-pending-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M9 18l6-6-6-6" /></svg>
            </div>

            <div className="sao-pending-item" onClick={() => onNavigate && onNavigate('pending-updates')}>
              <div className="sao-pending-icon sao-pending-icon--blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <div className="sao-pending-info">
                <div className="sao-pending-name">Informational</div>
                <div className="sao-pending-desc">Pending approvals & updates</div>
              </div>
              <div className="sao-pending-count" style={{ color: '#3b82f6' }}>
                {alertsSummary.info}
              </div>
              <svg className="sao-pending-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M9 18l6-6-6-6" /></svg>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminOverview;

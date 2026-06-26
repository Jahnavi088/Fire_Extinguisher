import React, { useEffect, useState, useRef } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';
import { ApiService } from '../../services/apiService';
import { filterEquipmentByLocations } from '../../utils/locationFilter';
import './SuperAdminOverview.css';

const complianceColor = (pct) => {
  if (pct >= 90) return '#16a34a';
  if (pct >= 75) return '#d97706';
  return '#dc2626';
};

const AgmOverview = ({ onNavigate, allModules, user, moduleSummaries = {} }) => {
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const carouselRef = useRef(null);
  const [assignedLocationCount, setAssignedLocationCount] = useState(null);

  const [kpis, setKpis] = useState({
    totalLocations: 0,
    totalAssets: 0,
    dueInspections: 0,
    expiredAssets: 0,
    overallCompliance: 100,
  });

  const [locationsList, setLocationsList] = useState([]);
  const [alertsSummary, setAlertsSummary] = useState({
    critical: 0,
    warning: 0,
    info: 0,
    total: 0
  });
  
  // For Inspection Status donut
  const [donutData, setDonutData] = useState([]);
  const [totalInspections, setTotalInspections] = useState(0);

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
        let buildings = (Array.isArray(branchesRaw) ? branchesRaw : (branchesRaw?.branches || branchesRaw?.data || []))
          .filter(b => !companyId || String(b.company_id) === String(companyId));
          
        if (user?.branch_id) {
          buildings = buildings.filter(b => String(b.id) === String(user.branch_id));
        }
        
        const dash = await ApiService.getDashboard().catch(() => ({}));
        
        const [eqRaw, mappingsRaw] = await Promise.all([
          ApiService.getEquipment({ limit: 1000 }).catch(() => []),
          ApiService.getOperatorMappings({ user_id: user?.id }).catch(() => [])
        ]);

        const rawEqList = Array.isArray(eqRaw) ? eqRaw : (eqRaw?.items || eqRaw?.data || []);
        const mappingsList = Array.isArray(mappingsRaw) ? mappingsRaw : (mappingsRaw?.data || mappingsRaw?.items || []);
        
        if (mappingsList.length > 0) setAssignedLocationCount(mappingsList.length);

        // Filter equipment based on AGM's assigned locations
        const eqList = filterEquipmentByLocations(rawEqList, mappingsList, 'agm');

        const alertsData = await ApiService.getAlertsSummary().catch(() => ({ critical: 0, warning: 0, info: 0, total: 0 }));

        if (cancelled) return;

        const totalLocations = buildings.length;

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

          const locId = eq.branch_id || eq.location_id || eq.building_id;
          if (locId && locMap[locId]) {
            locMap[locId].total += 1;
            if (eq.status === 'due-inspection' || eq.status === 'due' || eq.status === 'warning') locMap[locId].due += 1;
            if (eq.status === 'expired' || eq.status === 'critical') locMap[locId].expired += 1;
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

        const completed = Math.round(healthyAssets * 0.58);
        const inProgress = Math.round(healthyAssets * 0.25);
        const pending = Math.max(0, totalAssets - completed - inProgress);
        
        setTotalInspections(totalAssets);
        setDonutData([
          { name: 'Completed', value: completed, color: '#22c55e', pct: '58%' },
          { name: 'In Progress', value: inProgress, color: '#3b82f6', pct: '25%' },
          { name: 'Pending', value: pending, color: '#f97316', pct: '17%' }
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

      } catch (err) {
        console.error('AgmOverview fetchAll error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();
    const interval = setInterval(() => { fetchAll(true); }, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [user]);

  // (Moved into fetchAll to use mappings for equipment filtering)




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

  const branchName = user?.branch_name || user?.company_name || 'Hyderabad Plant';

  return (
    <div className="sao-root">
      {/* ── Sub-header ────────────────────────────────────────────────────── */}
      <div className="sao-subheader" style={{ padding: '0 0 16px 0', borderBottom: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>AGM Dashboard</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>{branchName}</p>
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
            <div className="sao-kpi-label">Assigned Locations</div>
            <div className="sao-kpi-value">{assignedLocationCount ?? kpis.totalLocations}</div>
            <div className="sao-kpi-sub" style={{ opacity: 0 }}>&nbsp;</div>
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
            <div className="sao-kpi-sub" style={{ opacity: 0 }}>&nbsp;</div>
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
            <div className="sao-kpi-label">Compliance Score</div>
            <div className="sao-kpi-value" style={{ color: complianceColor(kpis.overallCompliance) }}>
              {kpis.overallCompliance}%
            </div>
            <div className="sao-kpi-sub" style={{ color: complianceColor(kpis.overallCompliance) }}>
              {kpis.overallCompliance >= 90 ? 'Good' : kpis.overallCompliance >= 75 ? 'Moderate' : 'Needs Improvement'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Middle Row: Equipment Summary + Inspection Status ───────────────── */}
      <div className="sao-middle-row" style={{ marginTop: '24px', alignItems: 'stretch' }}>
        
        {/* Equipment Status Summary Carousel */}
        <div className="sao-section sao-equipment-section" style={{ flex: 1.8, display: 'flex', flexDirection: 'column' }}>
          <div className="sao-section-header">
            <span className="sao-section-title">EQUIPMENT SUMMARY</span>
            <button className="sao-view-all-btn" onClick={() => onNavigate && onNavigate('equipment-grid')}>
              View All
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

        {/* Inspection Status */}
        <div className="sao-section" style={{ flex: 1.2, display: 'flex', flexDirection: 'column' }}>
          <div className="sao-section-header">
            <span className="sao-section-title">INSPECTION STATUS</span>
          </div>
          <div style={{ display: 'flex', gap: '30px', padding: '16px', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
            
            <div style={{ width: '150px', height: '150px', position: 'relative', flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%" cy="50%"
                    innerRadius={45} outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', fontWeight: 600, color: '#64748b' }}>Total<br/>Inspections</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{totalInspections}</div>
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {donutData.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.color }}></div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>{d.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{d.value}</span>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>({d.pct})</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>

      {/* ── Bottom Row: Zone Wise Summary + Recent Alerts ──────────────────── */}
      <div className="sao-bottom-row" style={{ marginTop: '24px' }}>
        
        {/* Zone Wise Summary Table */}
        <div className="sao-section" style={{ flex: 1.2 }}>
          <div className="sao-section-header">
            <span className="sao-section-title">ZONE WISE SUMMARY</span>
          </div>
          <div className="sao-table-wrap" style={{ padding: '0 16px 16px 16px' }}>
            <table className="sao-table" style={{ marginTop: 0 }}>
              <thead>
                <tr>
                  <th>Zone</th>
                  <th>Assets</th>
                  <th>Due Inspections</th>
                  <th>Expired</th>
                  <th>Compliance</th>
                </tr>
              </thead>
              <tbody>
                {locationsList.length === 0 ? (
                  <tr><td colSpan="5" className="sao-table-empty">No zones found</td></tr>
                ) : (
                  locationsList.slice(0, 5).map(loc => (
                    <tr key={loc.id}>
                      <td style={{ fontWeight: 600, color: '#111827' }}>{loc.name}</td>
                      <td>{loc.total}</td>
                      <td><span className="sao-due-val" style={{ color: '#ef4444' }}>{loc.due > 0 ? loc.due : '-'}</span></td>
                      <td><span className="sao-expired-val" style={{ color: '#ef4444' }}>{loc.expired > 0 ? loc.expired : '-'}</span></td>
                      <td>
                        <span className="sao-compliance-badge" style={{ 
                          background: 'transparent',
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

        {/* Recent Alerts */}
        <div className="sao-section" style={{ flex: 1.8 }}>
          <div className="sao-section-header">
            <span className="sao-section-title">RECENT ALERTS</span>
            <button className="sao-view-all-btn" onClick={() => onNavigate && onNavigate('reports')}>
              View All
            </button>
          </div>
          <div className="sao-pending-list" style={{ padding: '0' }}>
            <div className="sao-pending-item" onClick={() => onNavigate && onNavigate('equipment-grid', 'critical')} style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
              <div className="sao-pending-icon sao-pending-icon--red" style={{ width: 28, height: 28 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="sao-pending-info">
                <div className="sao-pending-name" style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  {alertsSummary.critical} Fire Extinguishers expired in Production Zone A
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>2h ago</div>
            </div>

            <div className="sao-pending-item" onClick={() => onNavigate && onNavigate('equipment-grid', 'warning')} style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
              <div className="sao-pending-icon sao-pending-icon--amber" style={{ width: 28, height: 28 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="sao-pending-info">
                <div className="sao-pending-name" style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  {alertsSummary.warning} Sprinklers due inspection overdue in Zone B
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>5h ago</div>
            </div>

            <div className="sao-pending-item" onClick={() => onNavigate && onNavigate('pending-updates')} style={{ padding: '12px 16px' }}>
              <div className="sao-pending-icon sao-pending-icon--gray" style={{ width: 28, height: 28, background: '#f1f5f9', color: '#64748b' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4l3 3" />
                </svg>
              </div>
              <div className="sao-pending-info">
                <div className="sao-pending-name" style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  {alertsSummary.info} Smoke Detectors not working in Utilities Zone
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>1d ago</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AgmOverview;

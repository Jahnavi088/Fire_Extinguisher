import React, { useEffect, useState, useRef, useMemo } from 'react';
import useSWR from 'swr';
import { ApiService } from '../../services/apiService';
import { filterEquipmentByLocations } from '../../utils/locationFilter';
import './SuperAdminOverview.css';

const complianceColor = (pct) => {
  if (pct >= 90) return '#16a34a';
  if (pct >= 75) return '#d97706';
  return '#dc2626';
};

const fetchSupervisorData = async ([_, userId]) => {
  const [reportsRaw, eqRaw, usersRaw, mappingsRaw] = await Promise.all([
    (async () => {
      const todayDate = new Date();
      const endDateStr = todayDate.toISOString().split('T')[0];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(todayDate.getDate() - 30);
      const startDateStr = thirtyDaysAgo.toISOString().split('T')[0];
      return ApiService.getInspectionReports({ start_date: startDateStr, end_date: endDateStr }).catch(() => []);
    })(),
    ApiService.getEquipment({ limit: 1000 }).catch(() => []),
    ApiService.getAdminUsers({ role: 'inspector', supervisor_id: userId }).catch(() => []),
    ApiService.getOperatorMappings({ user_id: userId }).catch(() => [])
  ]);

  const reportsList = Array.isArray(reportsRaw)
    ? reportsRaw
    : (reportsRaw?.items || reportsRaw?.reports || reportsRaw?.inspections || reportsRaw?.data || []);

  const rawEqList = Array.isArray(eqRaw) ? eqRaw : (eqRaw?.items || eqRaw?.data || []);
  const teamData = Array.isArray(usersRaw) ? usersRaw : (usersRaw?.users || usersRaw?.data || []);
  const mappingsList = Array.isArray(mappingsRaw) ? mappingsRaw : (mappingsRaw?.data || mappingsRaw?.items || []);

  // Filter equipment based on supervisor's assigned locations
  const eqList = filterEquipmentByLocations(rawEqList, mappingsList, 'supervisor');

  return { reportsList, eqList, teamData, rawEqList, mappingsList };
};

const SupervisorOverview = ({ onNavigate, allModules, user, moduleSummaries = {} }) => {
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [showAllAreas, setShowAllAreas] = useState(false);
  const [showAllTeam, setShowAllTeam] = useState(false);
  const [assignedLocationCount, setAssignedLocationCount] = useState(null);
  const carouselRef = useRef(null);

  const { data, error, isLoading } = useSWR(['supervisor-overview', user?.id], fetchSupervisorData, {
    refreshInterval: 15000,
    revalidateOnFocus: true,
  });

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
    if (!user?.id) return;
    ApiService.getOperatorMappings({ user_id: user.id })
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.data || res?.items || []);
        if (list.length > 0) setAssignedLocationCount(list.length);
      })
      .catch(() => {});
  }, [user]);

  const scrollCarousel = (dir) => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: dir * 280, behavior: 'smooth' });
    }
  };

  const areasList = useMemo(() => {
    if (!data) return [];
    const { eqList } = data;
    const map = {};
    eqList.forEach(eq => {
      const loc = eq.location_name || 'Unassigned Area';
      if (!map[loc]) {
        map[loc] = { id: loc, name: loc, assets: 0, todaysTasks: 0, pending: 0, overdue: 0, compliance: 100 };
      }
      map[loc].assets += 1;
      const st = (eq.status || '').toLowerCase();
      if (st === 'due-inspection' || st === 'due') map[loc].todaysTasks += 1;
      else if (st === 'warning' || st === 'pending') map[loc].pending += 1;
      else if (st === 'critical' || st === 'expired') map[loc].overdue += 1;
    });

    return Object.values(map).map(area => {
      const bad = area.pending + area.overdue;
      area.compliance = area.assets > 0 ? Math.round(((area.assets - bad) / area.assets) * 100) : 100;
      return area;
    });
  }, [data]);

  const kpis = useMemo(() => {
    if (!data) return { assignedAreas: 0, myInspectors: 0, totalAssets: 0, dueInspections: 0, expiredAssets: 0, overallCompliance: 100 };
    const { teamData } = data;
    
    let totalAssets = 0, dueInspections = 0, expiredAssets = 0;
    (allModules || []).forEach(mod => {
      const m = moduleSummaries[mod.module_id] || {};
      totalAssets += (m.total || 0);
      dueInspections += (m.due || 0);
      expiredAssets += (m.expired || 0);
    });

    const healthyAssets = Math.max(0, totalAssets - dueInspections - expiredAssets);
    const overallCompliance = totalAssets > 0 ? Math.round((healthyAssets / totalAssets) * 100) : 100;

    return {
      assignedAreas: areasList.length,
      myInspectors: teamData.length,
      totalAssets,
      dueInspections,
      expiredAssets,
      overallCompliance
    };
  }, [data, areasList, moduleSummaries]);

  const teamList = useMemo(() => {
    if (!data) return [];
    const { teamData, reportsList, rawEqList, mappingsList } = data;
    
    return teamData.map(inspector => {
      const inspectorId = String(inspector.id);
      let completed = 0;
      
      reportsList.forEach(r => {
        if (String(r.user_id) === inspectorId || String(r.inspector_id) === inspectorId || r.user_name === inspector.username) {
           const st = (r.status || r.approval_status || '').toLowerCase();
           if (st === 'approved' || st === 'completed' || st === 'done') completed += 1;
        }
      });
      
      // Calculate pending tasks based on location filter
      const inspectorMappings = (mappingsList || []).filter(m => String(m.user_id) === inspectorId);
      let pending = 0;
      
      if (inspectorMappings.length > 0 && rawEqList) {
        const myEq = filterEquipmentByLocations(rawEqList, inspectorMappings, 'inspector');
        myEq.forEach(eq => {
          const st = (eq.status || '').toLowerCase();
          if (st === 'warning' || st === 'critical' || st === 'expired' || st === 'pending' || st === 'due' || st === 'due-inspection') {
            pending += 1;
          }
        });
      }
      
      const assigned = completed + pending; 
      const compliance = assigned > 0 ? Math.round((completed / assigned) * 100) : 100;
      
      return {
        id: inspector.id,
        name: inspector.name || inspector.username,
        assigned,
        completed,
        pending,
        compliance
      };
    });
  }, [data]);

  const recentFindings = useMemo(() => {
    if (!data) return [];
    const { eqList } = data;
    const issues = eqList.filter(eq => {
      const st = (eq.status || '').toLowerCase();
      return st === 'warning' || st === 'critical' || st === 'expired' || st === 'pending';
    });
    
    // Sort to show critical first, then warning
    issues.sort((a, b) => {
      const aCrit = (a.status || '').toLowerCase() === 'critical' || (a.status || '').toLowerCase() === 'expired';
      const bCrit = (b.status || '').toLowerCase() === 'critical' || (b.status || '').toLowerCase() === 'expired';
      if (aCrit && !bCrit) return -1;
      if (!aCrit && bCrit) return 1;
      return 0;
    });

    return issues.slice(0, 3).map(eq => {
      const st = (eq.status || '').toLowerCase();
      const isCritical = st === 'critical' || st === 'expired';
      return {
        id: eq.id || eq.equipment_id || `eq-${Math.floor(Math.random()*10000)}`,
        isCritical,
        title: `${isCritical ? 'Critical issue' : 'Warning'} reported on ${eq.name || eq.equipment_name || eq.type || 'Equipment'} (${eq.location_name || eq.zone_name || eq.department_name || 'Unassigned'})`,
        time: 'Recently updated',
        filterType: isCritical ? 'critical' : 'warning'
      };
    });
  }, [data]);

  if (isLoading) {
    return (
      <div className="sao-loading">
        <div className="sao-spinner" />
        <span>Loading Overview…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sao-loading" style={{ color: '#ef4444' }}>
        <span>Failed to load dashboard. Retrying...</span>
      </div>
    );
  }

  const branchName = user?.branch_name || user?.company_name || 'Production Zone A';

  return (
    <div className="sao-root">
      {/* ── Sub-header ────────────────────────────────────────────────────── */}
      <div className="sao-subheader" style={{ padding: '0 0 16px 0', borderBottom: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Supervisor Dashboard</h2>
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
      <div className="sao-kpi-grid">
        <div className="sao-kpi-card" onClick={() => onNavigate && onNavigate('setup-operator-mapping')}>
          <div className="sao-kpi-icon sao-kpi-icon--blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div className="sao-kpi-body">
            <div className="sao-kpi-label">Assigned Locations</div>
            <div className="sao-kpi-value">{assignedLocationCount ?? kpis.assignedAreas}</div>
            <div className="sao-kpi-sub" style={{ opacity: 0 }}>&nbsp;</div>
          </div>
        </div>

        <div className="sao-kpi-card" onClick={() => onNavigate && onNavigate('reports')}>
          <div className="sao-kpi-icon sao-kpi-icon--purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="sao-kpi-body">
            <div className="sao-kpi-label">My Inspectors</div>
            <div className="sao-kpi-value">{kpis.myInspectors}</div>
            <div className="sao-kpi-sub" style={{ opacity: 0 }}>&nbsp;</div>
          </div>
        </div>

        <div className="sao-kpi-card" onClick={() => onNavigate && onNavigate('equipment-grid', 'all')}>
          <div className="sao-kpi-icon sao-kpi-icon--green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="sao-kpi-body">
            <div className="sao-kpi-label">Total Assets</div>
            <div className="sao-kpi-value">{kpis.totalAssets}</div>
            <div className="sao-kpi-sub" style={{ opacity: 0 }}>&nbsp;</div>
          </div>
        </div>

        <div className="sao-kpi-card" onClick={() => onNavigate && onNavigate('equipment-grid', 'warning')}>
          <div className="sao-kpi-icon sao-kpi-icon--amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="sao-kpi-body">
            <div className="sao-kpi-label">Due Inspections</div>
            <div className="sao-kpi-value">{kpis.dueInspections}</div>
            <div className="sao-kpi-sub sao-kpi-sub--amber">Needs attention</div>
          </div>
        </div>

        <div className="sao-kpi-card" onClick={() => onNavigate && onNavigate('equipment-grid', 'critical')}>
          <div className="sao-kpi-icon sao-kpi-icon--red">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="sao-kpi-body">
            <div className="sao-kpi-label">Expired Assets</div>
            <div className="sao-kpi-value">{kpis.expiredAssets}</div>
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


      {/* ── Middle Row: Area Wise Summary + Equipment Summary ───────────────── */}
      <div className="sao-middle-row" style={{ marginTop: '24px', alignItems: 'stretch' }}>
        
        {/* Area Wise Summary Table */}
        <div className="sao-section" style={{ flex: 1.2, display: 'flex', flexDirection: 'column' }}>
          <div className="sao-section-header">
            <span className="sao-section-title">AREA WISE SUMMARY</span>
            {areasList.length > 5 && (
              <button className="sao-view-all-btn" onClick={() => setShowAllAreas(!showAllAreas)}>
                {showAllAreas ? 'View Less' : 'View All'}
              </button>
            )}
          </div>
          <div className="sao-table-wrap" style={{ padding: '0 16px 16px 16px', flex: 1, maxHeight: '300px', overflowY: 'auto' }}>
            <table className="sao-table" style={{ marginTop: 0 }}>
              <thead>
                <tr>
                  <th>Area</th>
                  <th>Assets</th>
                  <th>Today's Tasks</th>
                  <th>Pending</th>
                  <th>Overdue</th>
                  <th>Compliance</th>
                </tr>
              </thead>
              <tbody>
                {areasList.length === 0 ? (
                  <tr><td colSpan="6" className="sao-table-empty">No areas found</td></tr>
                ) : (
                  (showAllAreas ? areasList : areasList.slice(0, 5)).map(loc => (
                    <tr key={loc.id}>
                      <td style={{ fontWeight: 600, color: '#111827' }}>{loc.name}</td>
                      <td>{loc.assets}</td>
                      <td>{loc.todaysTasks}</td>
                      <td><span className="sao-due-val" style={{ color: '#ef4444' }}>{loc.pending > 0 ? loc.pending : '0'}</span></td>
                      <td><span className="sao-expired-val" style={{ color: '#ef4444' }}>{loc.overdue > 0 ? loc.overdue : '0'}</span></td>
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

      </div>

      {/* ── Bottom Row: Team Performance + Recent Findings ──────────────────── */}
      <div className="sao-bottom-row" style={{ marginTop: '24px', alignItems: 'stretch' }}>
        
        {/* Team Performance Table */}
        <div className="sao-section" style={{ flex: 1.2, display: 'flex', flexDirection: 'column' }}>
          <div className="sao-section-header">
            <span className="sao-section-title">TEAM PERFORMANCE</span>
            {teamList.length > 5 && (
              <button className="sao-view-all-btn" onClick={() => setShowAllTeam(!showAllTeam)}>
                {showAllTeam ? 'View Less' : 'View All'}
              </button>
            )}
          </div>
          <div className="sao-table-wrap" style={{ padding: '0 16px 16px 16px', flex: 1, maxHeight: '300px', overflowY: 'auto' }}>
            <table className="sao-table" style={{ marginTop: 0 }}>
              <thead>
                <tr>
                  <th>Inspector</th>
                  <th>Assigned</th>
                  <th>Completed</th>
                  <th>Pending</th>
                  <th>Compliance</th>
                </tr>
              </thead>
              <tbody>
                {teamList.length === 0 ? (
                  <tr><td colSpan="5" className="sao-table-empty">No inspectors found</td></tr>
                ) : (
                  (showAllTeam ? teamList : teamList.slice(0, 5)).map(member => (
                    <tr key={member.id}>
                      <td style={{ fontWeight: 600, color: '#111827' }}>{member.name}</td>
                      <td>{member.assigned}</td>
                      <td>{member.completed}</td>
                      <td><span className="sao-due-val" style={{ color: '#ef4444' }}>{member.pending > 0 ? member.pending : '0'}</span></td>
                      <td>
                        <span className="sao-compliance-badge" style={{ 
                          background: 'transparent',
                          color: member.compliance >= 90 ? '#16a34a' : member.compliance >= 75 ? '#d97706' : '#dc2626'
                         }}>
                          {member.compliance}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Findings */}
        <div className="sao-section" style={{ flex: 1.8, display: 'flex', flexDirection: 'column' }}>
          <div className="sao-section-header">
            <span className="sao-section-title">RECENT FINDINGS</span>
            <button className="sao-view-all-btn" onClick={() => onNavigate && onNavigate('reports')}>
              View All
            </button>
          </div>
          <div className="sao-pending-list" style={{ padding: '0', flex: 1 }}>
            {recentFindings.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>No recent findings or issues.</div>
            ) : (
              recentFindings.map((finding, idx) => (
                <div key={finding.id} className="sao-pending-item" onClick={() => onNavigate && onNavigate('equipment-grid', finding.filterType)} style={{ padding: '12px 16px', borderBottom: idx < recentFindings.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <div className={`sao-pending-icon ${finding.isCritical ? 'sao-pending-icon--red' : 'sao-pending-icon--amber'}`} style={{ width: 28, height: 28 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                      {finding.isCritical ? (
                        <>
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                        </>
                      ) : (
                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      )}
                    </svg>
                  </div>
                  <div className="sao-pending-info">
                    <div className="sao-pending-name" style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                      {finding.title}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{finding.time}</div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default SupervisorOverview;

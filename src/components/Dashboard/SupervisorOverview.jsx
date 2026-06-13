import React, { useEffect, useState, useRef } from 'react';
import { ApiService } from '../../services/apiService';
import './SuperAdminOverview.css';

const complianceColor = (pct) => {
  if (pct >= 90) return '#16a34a';
  if (pct >= 75) return '#d97706';
  return '#dc2626';
};

const SupervisorOverview = ({ onNavigate, allModules, user, moduleSummaries = {} }) => {
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const carouselRef = useRef(null);

  const [kpis, setKpis] = useState({
    assignedAreas: 4,
    myInspectors: 5,
    todaysInspections: 25,
    pendingInspections: 5,
    overdueInspections: 2,
    overallCompliance: 93,
  });

  const [areasList, setAreasList] = useState([
    { id: 1, name: 'Granulation Area', assets: 150, todaysTasks: 8, pending: 1, overdue: 0, compliance: 94 },
    { id: 2, name: 'Compression Area', assets: 120, todaysTasks: 6, pending: 1, overdue: 1, compliance: 92 },
    { id: 3, name: 'Coating Area', assets: 100, todaysTasks: 5, pending: 1, overdue: 0, compliance: 95 },
    { id: 4, name: 'Packing Area', assets: 80, todaysTasks: 6, pending: 2, overdue: 1, compliance: 90 }
  ]);

  const [teamList, setTeamList] = useState([
    { id: 1, name: 'Ramesh', assigned: 5, completed: 4, pending: 1, compliance: 98 },
    { id: 2, name: 'Suresh', assigned: 5, completed: 3, pending: 2, compliance: 90 },
    { id: 3, name: 'Mahesh', assigned: 5, completed: 4, pending: 1, compliance: 94 },
    { id: 4, name: 'Karthik', assigned: 5, completed: 3, pending: 2, compliance: 90 },
    { id: 5, name: 'Prakash', assigned: 5, completed: 1, pending: 4, compliance: 70 }
  ]);

  const [alertsSummary, setAlertsSummary] = useState({
    critical: 0,
    warning: 0,
    info: 0,
    total: 0
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
    let cancelled = false;

    const fetchAll = async (isSilent = false) => {
      if (!isSilent) setLoading(true);
      try {
        const alertsData = await ApiService.getAlertsSummary().catch(() => ({ critical: 0, warning: 0, info: 0, total: 0 }));
        if (cancelled) return;

        setAlertsSummary({
          critical: alertsData?.critical ?? alertsData?.total_critical ?? 0,
          warning: alertsData?.warning ?? alertsData?.total_warning ?? 0,
          info: alertsData?.info ?? alertsData?.total_info ?? 0,
          total: alertsData?.total ?? 0
        });

      } catch (err) {
        console.error('SupervisorOverview fetchAll error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();
    const interval = setInterval(() => { fetchAll(true); }, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [user]);


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

  const branchName = user?.branch_name || user?.company_name || 'Production Zone A';

  return (
    <div className="sao-root">
      {/* ── Sub-header ────────────────────────────────────────────────────── */}
      <div className="sao-subheader" style={{ padding: '0 0 16px 0', borderBottom: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Supervisor Dashboard</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>{branchName}</p>
        </div>
        <div className="sao-subheader-right">
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
        <div className="sao-kpi-card" onClick={() => onNavigate && onNavigate('grid')}>
          <div className="sao-kpi-icon sao-kpi-icon--blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <line x1="9" y1="4" x2="9" y2="20" />
            </svg>
          </div>
          <div className="sao-kpi-body">
            <div className="sao-kpi-label">Assigned Areas</div>
            <div className="sao-kpi-value">{kpis.assignedAreas}</div>
            <div className="sao-kpi-sub" style={{ opacity: 0 }}>&nbsp;</div>
          </div>
        </div>

        <div className="sao-kpi-card" onClick={() => onNavigate && onNavigate('users-manage')}>
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
            <div className="sao-kpi-label">Today's Inspections</div>
            <div className="sao-kpi-value">{kpis.todaysInspections}</div>
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
            <div className="sao-kpi-label">Pending Inspections</div>
            <div className="sao-kpi-value">{kpis.pendingInspections}</div>
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
            <div className="sao-kpi-label">Overdue Inspections</div>
            <div className="sao-kpi-value">{kpis.overdueInspections}</div>
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
          </div>
          <div className="sao-table-wrap" style={{ padding: '0 16px 16px 16px', flex: 1 }}>
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
                  areasList.map(loc => (
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
          </div>
          <div className="sao-table-wrap" style={{ padding: '0 16px 16px 16px', flex: 1 }}>
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
                  teamList.map(member => (
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
            <div className="sao-pending-item" onClick={() => onNavigate && onNavigate('equipment-grid', 'critical')} style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
              <div className="sao-pending-icon sao-pending-icon--red" style={{ width: 28, height: 28 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="sao-pending-info">
                <div className="sao-pending-name" style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  Low pressure in Fire Extinguisher FE-102 (Granulation Area)
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>1h ago</div>
            </div>

            <div className="sao-pending-item" onClick={() => onNavigate && onNavigate('equipment-grid', 'warning')} style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
              <div className="sao-pending-icon sao-pending-icon--amber" style={{ width: 28, height: 28 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="sao-pending-info">
                <div className="sao-pending-name" style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  Hose Reel HR-45 seal damaged (Compression Area)
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>3h ago</div>
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
                  Emergency Light not working (Packing Area)
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>5h ago</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SupervisorOverview;

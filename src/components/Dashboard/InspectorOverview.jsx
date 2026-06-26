import React, { useEffect, useState, useMemo } from 'react';
import useSWR from 'swr';
import { ApiService } from '../../services/apiService';
import { filterEquipmentByLocations } from '../../utils/locationFilter';
import './SuperAdminOverview.css';

const complianceColor = (pct) => {
  if (pct >= 90) return '#16a34a';
  if (pct >= 75) return '#d97706';
  return '#dc2626';
};


const fetchInspectorData = async ([_, userId]) => {
  const [reportsRaw, eqRaw, statsRaw, mappingsRaw] = await Promise.all([
    (async () => {
      const todayDate = new Date();
      const endDateStr = todayDate.toISOString().split('T')[0];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(todayDate.getDate() - 30);
      const startDateStr = thirtyDaysAgo.toISOString().split('T')[0];
      return ApiService.getInspectionReports({ start_date: startDateStr, end_date: endDateStr, inspector_id: userId }).catch(() => []);
    })(),
    ApiService.getEquipment({ limit: 1000 }).catch(() => []),
    ApiService.getInspectorOverviewStats(userId).catch(() => null),
    ApiService.getOperatorMappings({ user_id: userId }).catch(() => [])
  ]);

  const reportsList = Array.isArray(reportsRaw)
    ? reportsRaw
    : (reportsRaw?.items || reportsRaw?.reports || reportsRaw?.inspections || reportsRaw?.data || []);

  const rawEqList = Array.isArray(eqRaw) ? eqRaw : (eqRaw?.items || eqRaw?.data || []);
  const mappingsList = Array.isArray(mappingsRaw) ? mappingsRaw : (mappingsRaw?.data || mappingsRaw?.items || []);

  const eqList = filterEquipmentByLocations(rawEqList, mappingsList, 'inspector');

  return { reportsList, eqList, statsData: statsRaw, mappingsList };
};

const InspectorOverview = ({ onNavigate, allModules, user, moduleSummaries = {} }) => {
  const [lastUpdated, setLastUpdated] = useState('');
  const [showAllInspections, setShowAllInspections] = useState(false);
  const [assignedLocationCount, setAssignedLocationCount] = useState(0);
  const { data, error, isLoading } = useSWR(['inspector-overview', user?.id], fetchInspectorData, {
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
    if (data?.mappingsList) {
      setAssignedLocationCount(data.mappingsList.length);
    }
  }, [data?.mappingsList]);



  const userName = user?.name || user?.username || 'Inspector';

  const equipmentSummary = React.useMemo(() => {
    if (!allModules || allModules.length === 0) {
      return { total: 0, normal: 0, attention: 0, critical: 0 };
    }
    return allModules.reduce(
      (acc, m) => {
        const summary = moduleSummaries[m.module_id] || {};
        const score = summary.compliance ?? m.health_score ?? 0;
        let status = 'warning';
        if (score < 80) status = 'critical';
        else if (score >= 90) status = 'healthy';

        acc.total += 1;
        if (status === 'healthy') acc.normal += 1;
        else if (status === 'warning') acc.attention += 1;
        else if (status === 'critical') acc.critical += 1;
        return acc;
      },
      { total: 0, normal: 0, attention: 0, critical: 0 }
    );
  }, [allModules, moduleSummaries]);

  // Calculate percentages for donut chart
  const totalSafe = equipmentSummary.total || 1;
  const normalPct = (equipmentSummary.normal / totalSafe) * 100;
  const attentionPct = (equipmentSummary.attention / totalSafe) * 100;
  const criticalPct = (equipmentSummary.critical / totalSafe) * 100;

  // SVG parameters for Donut Chart
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  
  const normalDash = (normalPct / 100) * circumference;
  const attentionDash = (attentionPct / 100) * circumference;
  const criticalDash = (criticalPct / 100) * circumference;

  const normalOffset = 0;
  const attentionOffset = -normalDash;
  const criticalOffset = -(normalDash + attentionDash);

  const kpis = useMemo(() => {
    if (!data) return { todaysTasks: 0, completed: 0, pending: 0, overdue: 0, myCompliance: 100 };
    const { eqList, reportsList, statsData } = data;
    
    let todaysTasks = 0, pending = 0, overdue = 0;
    eqList.forEach(eq => {
      if (!eq) return;
      const st = (eq.status || '').toLowerCase();
      if (st === 'due-inspection' || st === 'due') todaysTasks += 1;
      else if (st === 'warning' || st === 'pending') pending += 1;
      else if (st === 'critical' || st === 'expired') overdue += 1;
    });

    let completed = 0;
    const inspectorIdStr = String(user?.id);
    reportsList.forEach(r => {
      if (!r) return;
      if (String(r.user_id) === inspectorIdStr || String(r.inspector_id) === inspectorIdStr || r.user_name === user?.username) {
        const st = (r.status || r.approval_status || '').toLowerCase();
        if (st === 'approved' || st === 'completed' || st === 'done') completed += 1;
      }
    });

    const assigned = todaysTasks + pending + overdue + completed;
    const myCompliance = assigned > 0 ? Math.round((completed / assigned) * 100) : 100;

    const apiKpis = statsData?.kpis || statsData || {};

    return { 
      todaysTasks: apiKpis.todays_tasks ?? apiKpis.todaysTasks ?? apiKpis.due_inspections ?? todaysTasks, 
      completed: apiKpis.completed_tasks ?? apiKpis.completedTasks ?? apiKpis.completed ?? completed, 
      pending: apiKpis.pending_tasks ?? apiKpis.pendingTasks ?? apiKpis.pending ?? pending, 
      overdue: apiKpis.overdue_tasks ?? apiKpis.overdueTasks ?? apiKpis.expired_assets ?? overdue, 
      myCompliance: apiKpis.my_compliance ?? apiKpis.myCompliance ?? apiKpis.overall_compliance ?? myCompliance 
    };
  }, [data, user]);

  const todaysInspections = useMemo(() => {
    if (!data) return [];
    const { eqList } = data;
    const issues = eqList.filter(eq => {
      const st = (eq.status || '').toLowerCase();
      return st === 'due-inspection' || st === 'due' || st === 'warning' || st === 'pending' || st === 'critical' || st === 'expired';
    });
    
    return issues.map(eq => {
      const st = (eq.status || '').toLowerCase();
      let status = 'Pending';
      if (st === 'critical' || st === 'expired') status = 'Overdue';
      else if (st === 'due' || st === 'due-inspection') status = 'Due';
      
      return {
        id: eq.id || eq.equipment_id || `eq-${eq.type}-${Math.floor(Math.random()*10000)}`,
        name: eq.name || eq.equipment_id || eq.type || 'Equipment',
        area: eq.location_name || 'Unassigned Area',
        time: 'Today',
        status,
        icon: null
      };
    });
  }, [data]);


  const recentActivity = useMemo(() => {
    if (!data) return [];
    const { reportsList } = data;
    
    const inspectorIdStr = String(user?.id);
    const myReports = reportsList.filter(r => String(r.user_id) === inspectorIdStr || String(r.inspector_id) === inspectorIdStr || r.user_name === user?.username);
    
    return myReports.slice(0, 5).map(r => {
      let type = 'inspection';
      let text = `Inspection completed for ${r.equipment_id || 'Equipment'}`;
      if ((r.status || '').toLowerCase() === 'warning' || (r.status || '').toLowerCase() === 'critical') {
        type = 'alert';
        text = `Flagged issue on ${r.equipment_id || 'Equipment'}`;
      }
      return {
        id: r.id || `report-${r.equipment_id || Math.floor(Math.random()*10000)}`,
        type,
        text,
        time: 'Recently'
      };
    });
  }, [data, user]);

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

  return (
    <div className="sao-root">
      {/* ── Sub-header ────────────────────────────────────────────────────── */}
      <div className="sao-subheader" style={{ padding: '0 0 16px 0', borderBottom: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Inspector Dashboard</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>{userName}</p>
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
        <div className="sao-kpi-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate && onNavigate('assigned-locations')}>
          <div className="sao-kpi-icon sao-kpi-icon--blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div className="sao-kpi-body">
            <div className="sao-kpi-label">Assigned Locations</div>
            <div className="sao-kpi-value">{assignedLocationCount}</div>
            <div className="sao-kpi-sub" style={{ color: '#2563eb', fontSize: '11px' }}>View →</div>
          </div>
        </div>

        <div className="sao-kpi-card" onClick={() => onNavigate && onNavigate('equipment-grid', 'all')}>
          <div className="sao-kpi-icon sao-kpi-icon--blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          </div>
          <div className="sao-kpi-body">
            <div className="sao-kpi-label">Today's Tasks</div>
            <div className="sao-kpi-value">{kpis.todaysTasks}</div>
            <div className="sao-kpi-sub" style={{ opacity: 0 }}>&nbsp;</div>
          </div>
        </div>

        <div className="sao-kpi-card" onClick={() => onNavigate && onNavigate('equipment-grid', 'healthy')}>
          <div className="sao-kpi-icon sao-kpi-icon--green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="sao-kpi-body">
            <div className="sao-kpi-label">Completed</div>
            <div className="sao-kpi-value">{kpis.completed}</div>
            <div className="sao-kpi-sub" style={{ opacity: 0 }}>&nbsp;</div>
          </div>
        </div>

        <div className="sao-kpi-card" onClick={() => onNavigate && onNavigate('equipment-grid', 'warning')}>
          <div className="sao-kpi-icon sao-kpi-icon--amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className="sao-kpi-body">
            <div className="sao-kpi-label">Pending</div>
            <div className="sao-kpi-value">{kpis.pending}</div>
            <div className="sao-kpi-sub" style={{ opacity: 0 }}>&nbsp;</div>
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
            <div className="sao-kpi-label">Overdue</div>
            <div className="sao-kpi-value">{kpis.overdue}</div>
            <div className="sao-kpi-sub" style={{ opacity: 0 }}>&nbsp;</div>
          </div>
        </div>

        <div className="sao-kpi-card" onClick={() => onNavigate && onNavigate('reports')}>
          <div className="sao-kpi-icon sao-kpi-icon--pie">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
              <path d="M22 12A10 10 0 0 0 12 2v10z" />
            </svg>
          </div>
          <div className="sao-kpi-body">
            <div className="sao-kpi-label">My Compliance</div>
            <div className="sao-kpi-value" style={{ color: complianceColor(kpis.myCompliance) }}>
              {kpis.myCompliance}%
            </div>
            <div className="sao-kpi-sub" style={{ color: complianceColor(kpis.myCompliance) }}>
              {kpis.myCompliance >= 90 ? 'Good' : kpis.myCompliance >= 75 ? 'Moderate' : 'Needs Improvement'}
            </div>
          </div>
        </div>
      </div>


      {/* ── Main Layout: 2 Columns ─────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '24px', marginTop: '24px', alignItems: 'flex-start' }}>
        
        {/* Left Column: Today's Inspections */}
        <div className="sao-section" style={{ flex: 1.2, display: 'flex', flexDirection: 'column' }}>
          <div className="sao-section-header">
            <span className="sao-section-title">TODAY'S INSPECTIONS</span>
          </div>
          <div style={{ padding: '0 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {todaysInspections.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>No inspections for today.</div>
            ) : (
            (showAllInspections ? todaysInspections : todaysInspections.slice(0, 5)).map((item, index) => {
              const isCompleted = item.status === 'Completed';
              const isPending = item.status === 'Pending';
              const isOverdue = item.status === 'Overdue';

              let statusBg = '#e2e8f0';
              let statusColor = '#64748b';
              if (isCompleted) { statusBg = '#dcfce7'; statusColor = '#16a34a'; }
              if (isPending) { statusBg = '#fef3c7'; statusColor = '#d97706'; }
              if (isOverdue) { statusBg = '#fee2e2'; statusColor = '#dc2626'; }

              return (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: index < todaysInspections.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', background: '#f8fafc', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={item.icon} alt={item.name} style={{ width: '24px', height: '24px', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '📦'; }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>{item.name}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item.area}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{item.time}</div>
                    <div style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', background: statusBg, color: statusColor, minWidth: '70px', textAlign: 'center' }}>
                      {item.status}
                    </div>
                  </div>
                </div>
              );
            }))}
            
            {todaysInspections.length > 5 && (
              <div style={{ marginTop: '8px', textAlign: 'center' }}>
                <button 
                  onClick={() => setShowAllInspections(!showAllInspections)}
                  style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  {showAllInspections ? 'View Less' : 'View All My Inspections'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Equipment Summary & Recent Activity */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Equipment Summary */}
          <div className="sao-section" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="sao-section-header">
              <span className="sao-section-title">MY EQUIPMENT SUMMARY</span>
            </div>
            <div style={{ padding: '24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '40px' }}>
              
              <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                <svg width="120" height="120" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                  
                  {/* Normal segment */}
                  {equipmentSummary.normal > 0 && (
                    <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#16a34a" strokeWidth="12"
                      strokeDasharray={`${normalDash} ${circumference}`}
                      strokeDashoffset={normalOffset} />
                  )}
                  
                  {/* Attention segment */}
                  {equipmentSummary.attention > 0 && (
                    <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#f59e0b" strokeWidth="12"
                      strokeDasharray={`${attentionDash} ${circumference}`}
                      strokeDashoffset={attentionOffset} />
                  )}
                  
                  {/* Critical segment */}
                  {equipmentSummary.critical > 0 && (
                    <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#ef4444" strokeWidth="12"
                      strokeDasharray={`${criticalDash} ${circumference}`}
                      strokeDashoffset={criticalOffset} />
                  )}
                </svg>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
                  {equipmentSummary.total}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '150px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }}></div>
                    <span style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>Normal</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#16a34a' }}>
                    {equipmentSummary.normal} <span style={{ color: '#94a3b8', fontWeight: '400', marginLeft: '4px' }}>({Math.round(normalPct)}%)</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></div>
                    <span style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>Attention</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#f59e0b' }}>
                    {equipmentSummary.attention} <span style={{ color: '#94a3b8', fontWeight: '400', marginLeft: '4px' }}>({Math.round(attentionPct)}%)</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></div>
                    <span style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>Critical</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#ef4444' }}>
                    {equipmentSummary.critical} <span style={{ color: '#94a3b8', fontWeight: '400', marginLeft: '4px' }}>({Math.round(criticalPct)}%)</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Recent Activity */}
          <div className="sao-section" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="sao-section-header">
              <span className="sao-section-title">RECENT ACTIVITY</span>
            </div>
            <div style={{ padding: '0 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              {recentActivity.map((activity) => (
                <div key={activity.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', background: '#f8fafc', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                      {activity.type === 'inspection' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>}
                      {activity.type === 'alert' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>}
                      {activity.type === 'photo' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>}
                    </div>
                    <div style={{ fontSize: '13px', color: '#334155', fontWeight: '500' }}>
                      {activity.text}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>


    </div>
  );
};

export default InspectorOverview;

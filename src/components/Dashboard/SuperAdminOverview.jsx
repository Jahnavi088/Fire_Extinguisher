import { useEffect, useState, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { ApiService } from '../../services/apiService';
import './SuperAdminOverview.css';
import './SafetyDashboard.css';


const companyLogoUrl = (logo) => {
  if (!logo) return null;
  if (logo.startsWith('http')) return logo;
  if (logo.startsWith('/uploads/logos/')) return `http://ehs.garrev.com${logo}`;
  if (logo.startsWith('uploads/logos/')) return `http://ehs.garrev.com/${logo}`;
  return `http://ehs.garrev.com/uploads/logos/${logo}`;
};

const complianceColor = (pct) => {
  if (pct >= 90) return '#16a34a';
  if (pct >= 75) return '#d97706';
  return '#dc2626';
};

const complianceBg = (pct) => {
  if (pct >= 90) return '#dcfce7';
  if (pct >= 75) return '#fef3c7';
  return '#fee2e2';
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

const SuperAdminOverview = ({ onNavigate, allModules, moduleSummaries = {} }) => {
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [trendPeriod, setTrendPeriod] = useState('Last 7 Days');
  const [trendDropOpen, setTrendDropOpen] = useState(false);
  const carouselRef = useRef(null);

  const [kpis, setKpis] = useState({
    totalCompanies: 0,
    totalUsers: 0,
    totalAssets: 0,
    dueInspections: 0,
    expiredAssets: 0,
    overallCompliance: 0,
  });

  const [complianceTrend, setComplianceTrend] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [pendingActions, setPendingActions] = useState({
    pendingInspections: 0,
    pendingApprovals: 0,
    overdueInspections: 0,
    criticalIssues: 0,
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
        // 1. Fetch companies
        const companiesRaw = await ApiService.getAdminCompanies().catch(() => []);
        const companiesList = Array.isArray(companiesRaw)
          ? companiesRaw
          : (companiesRaw?.companies || companiesRaw?.data || []);

        // 2. Fetch users
        const usersRaw = await ApiService.getAdminUsers().catch(() => []);
        const usersList = Array.isArray(usersRaw)
          ? usersRaw
          : (usersRaw?.users || usersRaw?.data || []);

        // 3. Fetch dashboard summary
        const dash = await ApiService.getDashboard().catch(() => ({}));

        // 4. Fetch inspection reports (last 30 days) for stats + trend
        const today = new Date();
        const endDateStr = today.toISOString().split('T')[0];
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        const startDateStr = thirtyDaysAgo.toISOString().split('T')[0];

        const reportsRaw = await ApiService.getInspectionReports({
          start_date: startDateStr,
          end_date: endDateStr,
        }).catch(() => []);
        const reportsList = Array.isArray(reportsRaw)
          ? reportsRaw
          : (reportsRaw?.items || reportsRaw?.reports || reportsRaw?.inspections || reportsRaw?.data || []);

        // 5. Fetch equipment status report for totals
        const eqStatusRaw = await ApiService.getEquipmentStatusReports().catch(() => ({}));
        const eqStatusList = Array.isArray(eqStatusRaw)
          ? eqStatusRaw
          : (eqStatusRaw?.items || eqStatusRaw?.data || []);

        if (cancelled) return;

        // ── Aggregate KPIs ──────────────────────────────────────────────────
        const totalCompanies = companiesList.length;
        const totalUsers = usersList.length;

        // Instead of pulling these from dash/eqStatusList, we initialize them.
        // The real-time sync with moduleSummaries will keep them perfectly matched.
        setKpis(prev => ({
          ...prev,
          totalCompanies,
          totalUsers,
        }));

        // ── Compliance Trend (last 7 days from reports) ─────────────────────
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
            // No data for that day - display overall compliance stably
            dayCompliance = overallCompliance;
          }
          trendData.push({ date: label, compliance: dayCompliance });
        }
        setComplianceTrend(trendData);

        // ── Company Health Overview ─────────────────────────────────────────
        const enrichedCompanies = companiesList.slice(0, 10).map((c, idx) => {
          const logoUrl = companyLogoUrl(c.logo_url || c.logo);

          // Count users belonging to this company dynamically
          const companyUsersCount = usersList.filter(u =>
            String(u.company_id || u.companyId) === String(c.id || c.company_id)
          ).length;

          // Retrieve locations from local storage onboarding configuration
          let localLocationsCount = 0;
          try {
            const localLocs = JSON.parse(localStorage.getItem('local_onboarding_locations') || '{}');
            const ref = c.comapany_ref || c.company_ref || '';
            const match = localLocs[ref];
            if (match && Array.isArray(match.buildings)) {
              localLocationsCount = match.buildings.length;
            }
          } catch (e) { }

          return {
            id: c.id,
            name: c.name || c.company_name || `Company ${idx + 1}`,
            logo: logoUrl,
            locations: c.locations_count ?? c.branches_count ?? c.locations ?? localLocationsCount,
            users: c.users_count ?? c.user_count ?? companyUsersCount,
            assets: c.assets_count ?? c.equipment_count ?? 0,
            compliance: c.compliance_rate ?? c.health_score ?? 100,
            dueInspections: c.due_inspections ?? c.due_inspection_count ?? 0,
            expired: c.expired_count ?? c.expired ?? 0,
          };
        });
        setCompanies(enrichedCompanies);

        // ── Pending Actions ─────────────────────────────────────────────────
        let approvedLocally = [];
        try {
          approvedLocally = JSON.parse(localStorage.getItem('approved_inspections') || '[]');
        } catch (e) { }
        const safeLocallyApproved = Array.isArray(approvedLocally) ? approvedLocally.filter(Boolean).map(String) : [];

        const pendingInspCount = reportsList.filter(r => {
          const st = (r.status || '').toUpperCase();
          const ap = (r.approval_status || '').toUpperCase();
          if (ap === 'APPROVED' || st === 'APPROVED') return false;
          if (r.id && safeLocallyApproved.includes(String(r.id))) return false;
          return true;
        }).length;

        const overdueCount = reportsList.filter(r => {
          const st = (r.status || '').toUpperCase();
          const ap = (r.approval_status || '').toUpperCase();
          if (ap === 'APPROVED' || st === 'APPROVED') return false;
          if (r.id && safeLocallyApproved.includes(String(r.id))) return false;
          
          if (!r.created_at && !r.inspected_at) return false;
          const submitDate = new Date(r.created_at || r.inspected_at);
          if (isNaN(submitDate)) return false;
          
          const diffDays = (today - submitDate) / (1000 * 60 * 60 * 24);
          return diffDays > 3;
        }).length;

        const pendingUpdatesRaw = await ApiService.getPendingUpdates().catch(() => []);
        const uList = Array.isArray(pendingUpdatesRaw) ? pendingUpdatesRaw : (pendingUpdatesRaw?.items || pendingUpdatesRaw?.updates || pendingUpdatesRaw?.data || []);
        const pendingApprovalsCount = uList.filter(u => {
          if (safeLocallyApproved.includes(String(u.id))) return false;
          const st = (u.status || '').toUpperCase();
          const ap = (u.approval_status || '').toUpperCase();
          return st === 'PENDING' || ap === 'PENDING' || ap !== 'APPROVED';
        }).length;

        const criticalAlerts = await ApiService.getAlertsSummary()
          .then(d => d?.critical ?? d?.total_critical ?? 0)
          .catch(() => 0);

        setPendingActions({
          pendingInspections: pendingInspCount,
          pendingApprovals: pendingApprovalsCount,
          overdueInspections: overdueCount,
          criticalIssues: criticalAlerts,
        });

      } catch (err) {
        console.error('SuperAdminOverview fetchAll error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();
    const interval = setInterval(() => {
      fetchAll(true);
    }, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [trendPeriod]);

  // Sync KPIs perfectly with moduleSummaries real-time data
  useEffect(() => {
    const modulesArr = (allModules || []).map(mod => moduleSummaries[mod.module_id] || {});
    if (modulesArr.length > 0) {
      const due = modulesArr.reduce((s, m) => s + (m.due || 0), 0);
      const expired = modulesArr.reduce((s, m) => s + (m.expired || 0), 0);
      const totalAssets = modulesArr.reduce((s, m) => s + (m.total || 0), 0);
      const healthyAssets = Math.max(0, totalAssets - due - expired);
      const overallCompliance = totalAssets > 0 ? Math.round((healthyAssets / totalAssets) * 100) : 100;

      setKpis(prev => ({
        ...prev,
        totalAssets: totalAssets > 0 ? totalAssets : prev.totalAssets,
        dueInspections: due,
        expiredAssets: expired,
        overallCompliance
      }));
    }
  }, [moduleSummaries, allModules]);


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
      <div className="sao-subheader">
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

      {(() => {
        const activeSummaries = (allModules || []).map(mod => moduleSummaries[mod.module_id] || {});
        
        let liveAssets = activeSummaries.reduce((s, m) => s + (m.total || 0), 0);
        let liveDue = activeSummaries.reduce((s, m) => s + (m.due || 0), 0);
        let liveExpired = activeSummaries.reduce((s, m) => s + (m.expired || 0), 0);

        let liveCompliance = kpis.overallCompliance;
        if (liveAssets > 0) {
          const issues = liveExpired + liveDue;
          liveCompliance = Math.round(((liveAssets - issues) / liveAssets) * 100);
        } else {
          liveCompliance = 100;
        }

        return (
          <div className="sao-kpi-grid">
            <div className="sao-kpi-card" onClick={() => onNavigate && onNavigate('setup-company')}>
          <div className="sao-kpi-icon sao-kpi-icon--blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
              <path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" />
            </svg>
          </div>
          <div className="sao-kpi-body">
            <div className="sao-kpi-label">Total Companies</div>
            <div className="sao-kpi-value">{kpis.totalCompanies}</div>
            <div className="sao-kpi-sub sao-kpi-sub--green">Active</div>
          </div>
        </div>

        <div className="sao-kpi-card" onClick={() => onNavigate && onNavigate('users-manage')}>
          <div className="sao-kpi-icon sao-kpi-icon--purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="sao-kpi-body">
            <div className="sao-kpi-label">Total Users</div>
            <div className="sao-kpi-value">{kpis.totalUsers.toLocaleString()}</div>
            <div className="sao-kpi-sub sao-kpi-sub--green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="11" height="11"><polyline points="18 15 12 9 6 15" /></svg>
              12 this week
            </div>
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
            <div className="sao-kpi-value">{liveAssets.toLocaleString()}</div>
            <div className="sao-kpi-sub sao-kpi-sub--gray">Across all companies</div>
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
            <div className="sao-kpi-value">{liveDue.toLocaleString()}</div>
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
            <div className="sao-kpi-value">{liveExpired.toLocaleString()}</div>
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
            <div className="sao-kpi-value" style={{ color: complianceColor(liveCompliance) }}>
              {liveCompliance}%
            </div>
            <div className="sao-kpi-sub" style={{ color: complianceColor(liveCompliance) }}>
              {liveCompliance >= 90 ? 'Good' : liveCompliance >= 75 ? 'Moderate' : 'Needs Improvement'}
            </div>
          </div>
        </div>
      </div>
      );})()}

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
            <span className="sao-section-title">COMPLIANCE TREND (Overall)</span>
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
          <div className="sao-chart-wrap">
            <ResponsiveContainer width="100%" height={200}>
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
          <div className="sao-chart-legend">
            <span className="sao-chart-legend-dot" />
            <span className="sao-chart-legend-label">Compliance %</span>
          </div>
        </div>
      </div>

      {/* ── Bottom Row: Company Health + Pending Actions ──────────────────── */}
      <div className="sao-bottom-row">
        {/* Company Health Overview */}
        <div className="sao-section sao-company-section">
          <div className="sao-section-header">
            <span className="sao-section-title">COMPANY HEALTH OVERVIEW</span>
            <button className="sao-view-all-btn" onClick={() => onNavigate && onNavigate('setup-company')}>
              View All Companies
            </button>
          </div>
          <div className="sao-table-wrap">
            <table className="sao-table">
              <thead>
                <tr>
                  <th>Company Name</th>
                  <th>Locations</th>
                  <th>Users</th>
                  <th>Assets</th>
                  <th>Compliance</th>
                  <th>Due Inspections</th>
                  <th>Expired</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {companies.length === 0 ? (
                  <tr><td colSpan="8" className="sao-table-empty">No companies found</td></tr>
                ) : (
                  companies.map((c, idx) => (
                    <tr key={c.id || idx}>
                      <td>
                        <div className="sao-company-name-cell">
                          {c.logo ? (
                            <img src={c.logo} alt={c.name} className="sao-company-logo"
                              onError={e => { e.target.style.display = 'none'; }} />
                          ) : (
                            <div className="sao-company-logo-placeholder">{c.name.charAt(0)}</div>
                          )}
                          <span className="sao-company-name">{c.name}</span>
                        </div>
                      </td>
                      <td>{c.locations}</td>
                      <td>{c.users}</td>
                      <td>{c.assets.toLocaleString()}</td>
                      <td>
                        <span className="sao-compliance-badge"
                          style={{ background: complianceBg(c.compliance), color: complianceColor(c.compliance) }}>
                          {c.compliance}%
                        </span>
                      </td>
                      <td><span className="sao-due-val">{c.dueInspections}</span></td>
                      <td><span className="sao-expired-val">{c.expired}</span></td>
                      <td>
                        <button className="sao-action-btn" title="View Company"
                          onClick={() => onNavigate && onNavigate('setup-company')}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="sao-table-footer">
            Showing 1 to {Math.min(companies.length, 10)} of {companies.length} companies
          </div>
        </div>

        {/* Pending Actions Summary */}
        <div className="sao-section sao-pending-section">
          <div className="sao-section-header">
            <span className="sao-section-title">PENDING ACTIONS SUMMARY</span>
            <button className="sao-view-all-btn" onClick={() => onNavigate && onNavigate('pending-updates')}>
              View All
            </button>
          </div>
          <div className="sao-pending-list">
            <div className="sao-pending-item" onClick={() => onNavigate && onNavigate('pending-updates')}>
              <div className="sao-pending-icon sao-pending-icon--amber">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className="sao-pending-info">
                <div className="sao-pending-name">Pending Approvals</div>
                <div className="sao-pending-desc">Requires admin review</div>
              </div>
              <div className="sao-pending-count">{(pendingActions.pendingApprovals || 0) + (pendingActions.pendingInspections || 0)}</div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" className="sao-pending-arrow">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>

            <div className="sao-pending-item" onClick={() => onNavigate && onNavigate('pending-updates')}>
              <div className="sao-pending-icon sao-pending-icon--red">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="sao-pending-info">
                <div className="sao-pending-name">Overdue Inspections</div>
                <div className="sao-pending-desc">Past due date</div>
              </div>
              <div className="sao-pending-count">{pendingActions.overdueInspections}</div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" className="sao-pending-arrow">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>

            <div className="sao-pending-item" onClick={() => onNavigate && onNavigate('equipment-grid', 'critical')}>
              <div className="sao-pending-icon sao-pending-icon--purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <div className="sao-pending-info">
                <div className="sao-pending-name">Critical Issues</div>
                <div className="sao-pending-desc">Requires immediate attention</div>
              </div>
              <div className="sao-pending-count">{pendingActions.criticalIssues}</div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" className="sao-pending-arrow">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminOverview;

import React, { useEffect, useMemo, useState } from 'react';
import './SafetyDashboard.css';
import { ApiService } from '../../services/apiService';
import FireExtinguisherStats from './FireExtinguisherStats';
import SprinklerStats from './SprinklerStats';
import HoseReelStats from './HoseReelStats';
import DrumHoseStats from './DrumHoseStats';
import HydrantStats from './HydrantStats';
import FireTrolleyStats from './FireTrolleyStats';
import SuppressionSystemStats from './SuppressionSystemStats';
import RightPanel from './RightPanel';

const STATIC_MODULES = [
  { module_id: 1, name: 'Fire extinguishers', code: 'fire_extinguisher', health_score: 95, category: 'fire' },
  { module_id: 2, name: 'Hose reels', code: 'hose_reel', health_score: 98, category: 'fire' },
  { module_id: 3, name: 'Drum hose reels', code: 'drum_hose', health_score: 100, category: 'fire' },
  { module_id: 4, name: 'Hydrant points', code: 'hydrant', health_score: 100, category: 'fire' },
  { module_id: 5, name: 'Sprinkler system', code: 'sprinkler', health_score: 100, category: 'fire' },
  { module_id: 6, name: 'Fire trolley', code: 'fire_trolley', health_score: 100, category: 'fire' },
  { module_id: 7, name: 'Fire suppress. CO2', code: 'suppression_system', health_score: 100, category: 'fire' },
  { module_id: 8, name: 'Fire blankets', code: 'fire_blanket', health_score: 100, category: 'fire' },
  { module_id: 9, name: 'Fire alarm panels', code: 'fpca', health_score: 100, category: 'fire' },
  { module_id: 10, name: 'Smoke detectors', code: 'smoke_detector', health_score: 95, category: 'fire' },
  { module_id: 11, name: 'PA / siren system', code: 'pa_system', health_score: 100, category: 'fire' },
  { module_id: 12, name: 'Wind sock', code: 'wind_sock', health_score: 100, category: 'chemical' },
  { module_id: 13, name: 'SCBA units', code: 'scba', health_score: 66, category: 'chemical' },
  { module_id: 14, name: 'Ambulance vehicle', code: 'ambulance', health_score: 50, category: 'chemical' },
  { module_id: 15, name: 'First aid boxes', code: 'first_aid_kit', health_score: 93, category: 'chemical' },
  { module_id: 16, name: 'Emergency shower', code: 'safety_shower', health_score: 100, category: 'chemical' },
  { module_id: 17, name: 'Eye wash stations', code: 'eyewash_station', health_score: 87, category: 'chemical' },
  { module_id: 18, name: 'Chemical shower', code: 'chemical_shower', health_score: 100, category: 'chemical' },
  { module_id: 19, name: 'PPE cabinets', code: 'ppe_station', health_score: 91, category: 'chemical' },
  { module_id: 20, name: 'Fire Brigade Team', code: 'fire_brigade', health_score: 90, category: 'fire' },
  { module_id: 21, name: 'Volunteers', code: 'volunteers', health_score: 78, category: 'permit' },
  { module_id: 22, name: 'Shift Volunteers', code: 'shift_volunteers', health_score: 72, category: 'permit' },
  { module_id: 23, name: 'Trained / Shift', code: 'trained_shift', health_score: 85, category: 'permit' },
  { module_id: 24, name: 'Emergency Door', code: 'emergency_door', health_score: 97, category: 'fire' },
  { module_id: 25, name: 'Emergency lighting', code: 'emergency_light', health_score: 97, category: 'fire' },
  { module_id: 26, name: 'Spill control kits', code: 'spill_kit', health_score: 90, category: 'chemical' },
  { module_id: 27, name: 'Safety signage', code: 'safety_signage', health_score: 96, category: 'permit' },
  { module_id: 28, name: 'Muster point signs', code: 'muster_point', health_score: 100, category: 'permit' },
  { module_id: 29, name: 'Fire NOC', code: 'fire_noc', health_score: 100, category: 'permit' },
  { module_id: 30, name: 'Fire suppress. CO2', code: 'suppression_system', health_score: 100, category: 'fire' },
];

const CHECKLIST_MODULES = [
  { id: 30, name: 'Fire Extinguisher', code: 'fire_extinguisher', icon: '🧯' },
  { id: 31, name: 'Sprinkler System', code: 'sprinkler', icon: '🚿' },
  { id: 32, name: 'FPCA', code: 'fpca', icon: '🔔' },
  { id: 33, name: 'Hose Reel', code: 'hose_reel', icon: '🧵' },
  { id: 34, name: 'Fire Hydrant', code: 'hydrant', icon: '🚒' },
  { id: 35, name: 'Fire Alarm Panel', code: 'fire_alarm_panel', icon: '🚨' },
  { id: 36, name: 'Smoke Detector', code: 'smoke_detector', icon: '🌫️' },
  { id: 37, name: 'Heat Detector', code: 'heat_detector', icon: '🔥' },
  { id: 38, name: 'Emergency Light', code: 'emergency_light', icon: '🔦' },
  { id: 39, name: 'Exit Sign', code: 'exit_sign', icon: '🚪' },
  { id: 40, name: 'CO Detector', code: 'co_detector', icon: '⚠️' },
  { id: 41, name: 'Fire Blanket', code: 'fire_blanket', icon: '🧲' },
  { id: 42, name: 'Suppression System', code: 'suppression_system', icon: '💨' },
  { id: 43, name: 'Fire Door', code: 'fire_door', icon: '🚪' },
  { id: 44, name: 'PA System', code: 'pa_system', icon: '📢' },
  { id: 45, name: 'First Aid Kit', code: 'first_aid_kit', icon: '🏥' },
  { id: 46, name: 'Eyewash Station', code: 'eyewash_station', icon: '👀' },
  { id: 47, name: 'Safety Shower', code: 'safety_shower', icon: '🚿' },
  { id: 48, name: 'Chemical Spill Kit', code: 'spill_kit', icon: '⚗️' },
  { id: 49, name: 'PPE Station', code: 'ppe_station', icon: '🦺' },
];

const MODULE_EMOJI = {
  fire_extinguisher: '🧯',
  sprinkler: '🚿',
  fpca: '🔔',
  hose_reel: '🧵',
  hydrant: '🚒',
  drum_hose: '🛢️',
  fire_trolley: '🛒',
  suppression_system: '💨',
  fire_blanket: '🧲',
  smoke_detector: '🌫️',
  pa_system: '📢',
  emergency_comm: '📞',
  scba: '🫁',
  ambulance: '🚑',
  first_aid_kit: '🏥',
  safety_shower: '🚰',
  eyewash_station: '👀',
  chemical_shower: '🚿',
  ppe_station: '🦺',
  fire_brigade: '👨‍🚒',
  volunteers: '🙋',
  shift_volunteers: '👥',
  trained_shift: '🎓',
  emergency_door: '🚪',
  emergency_light: '🔦',
  wind_sock: '📍',
  spill_kit: '⚗️',
  safety_signage: '⚠️',
  muster_point: '📌',
  fire_noc: '📜',
};

const SafetyDashboard = ({ user, onLogout }) => {
  const [activePage, setActivePage] = useState('grid');
  const [selectedEq, setSelectedEq] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});
  const [panelVisible, setPanelVisible] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [drillTime, setDrillTime] = useState('');
  const [shiftData, setShiftData] = useState({ icon: '🌅', name: 'Day Shift', time: '06:00 - 14:00', staff: 12 });
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [searchFilter, setSearchFilter] = useState('All');
  const [filterOpen, setFilterOpen] = useState(false);
  const [checklists, setChecklists] = useState([]);
  const [activeChecklistItems, setActiveChecklistItems] = useState([]);
  const [clLoading, setClLoading] = useState(false);
  const [checklistsDropdownOpen, setChecklistsDropdownOpen] = useState(false);
  const [topbarVisible, setTopbarVisible] = useState(true);
  const lastScrollY = React.useRef(0);

  const filterOptions = [
    { label: 'All', icon: '🔍' },
    { label: 'Fire', icon: '🔥' },
    { label: 'Chemical', icon: '⚗️' },
    { label: 'Medical', icon: '🏥' },
    { label: 'Permits', icon: '📋' },
  ];

  const modules = STATIC_MODULES;
  const preparednessScore = 92;

  useEffect(() => {
    // Dynamic checklist loading when a module is selected for the checklist page
    if (activePage === 'checklist' && selectedEq?.id) {
      setClLoading(true);
      ApiService.getModuleChecklists(selectedEq.id)
        .then(d => {
          const list = Array.isArray(d) ? d : (d?.items || d?.data || d?.checklists || []);
          setActiveChecklistItems(list);
        })
        .catch(() => setActiveChecklistItems([]))
        .finally(() => setClLoading(false));
    }
  }, [activePage, selectedEq]);

  useEffect(() => {
    ApiService.getAlertsSummary()
      .then((d) => setAlertCount(d.total_alerts || 0))
      .catch(() => setAlertCount(0));
  }, []);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const hours24 = now.getHours();
      const suffix = hours24 >= 12 ? 'PM' : 'AM';
      const hours12 = hours24 % 12 || 12;
      const pad = (n) => String(n).padStart(2, '0');
      setCurrentTime(`${pad(hours12)}:${pad(now.getMinutes())}:${pad(now.getSeconds())} ${suffix}`);
    };
    tick();
    const timer = setInterval(tick, 1000);

    const updateShift = () => {
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 14) setShiftData({ icon: '🌅', name: 'Day Shift', time: '06:00 - 14:00', staff: 14 });
      else if (hour >= 14 && hour < 22) setShiftData({ icon: '☀️', name: 'Afternoon Shift', time: '14:00 - 22:00', staff: 11 });
      else setShiftData({ icon: '🌙', name: 'Night Shift', time: '22:00 - 06:00', staff: 8 });
    };
    updateShift();
    const shiftTimer = setInterval(updateShift, 60000);

    const drillDate = new Date('2026-05-15T09:00:00');
    const updateDrill = () => {
      const diff = drillDate - new Date();
      if (diff <= 0) {
        setDrillTime('🚨 DRILL NOW');
        return;
      }
      const d = Math.floor(diff / 86400000);
      const hr = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setDrillTime(`${d}d ${hr}h ${m}m ${s}s`);
    };
    updateDrill();
    const drillTimer = setInterval(updateDrill, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(shiftTimer);
      clearInterval(drillTimer);
    };
  }, []);

  const filteredModules = useMemo(() => modules, [modules]);

  const checklistData = [
    { sec: 'Physical Integrity', items: ['No visible corrosion or dents', 'Mounting brackets secure', 'Pressure gauge in green zone'] },
    { sec: 'Operational Readiness', items: ['Safety pin and seal intact', 'Nozzle/hose clear of blockages', 'Instruction label legible'] },
  ];

  const totalItems = useMemo(() => {
    return activeChecklistItems.length;
  }, [activeChecklistItems]);

  const checkedCount = useMemo(() => {
    return Object.values(checkedItems).filter(Boolean).length;
  }, [checkedItems]);
  
  const progressPct = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;

  const getStatus = (score) => (score >= 90 ? 'healthy' : score >= 70 ? 'warning' : 'critical');
  const getStatusTxt = (score) => (score >= 90 ? 'HEALTHY' : score >= 70 ? 'WARNING' : 'CRITICAL');

  const toggleCheck = (id) => setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleOpenModule = (mod) => {
    setSelectedEq(mod);
    if (mod.code === 'fire_extinguisher') setActivePage('fire-stats');
    else if (mod.code === 'sprinkler') setActivePage('sprinkler-stats');
    else if (mod.code === 'hose_reel') setActivePage('hose-stats');
    else if (mod.code === 'drum_hose') setActivePage('drum-stats');
    else if (mod.code === 'hydrant') setActivePage('hydrant-stats');
    else if (mod.code === 'fire_trolley') setActivePage('fire-trolley-stats');
    else if (mod.code === 'suppression_system') setActivePage('suppression-system-stats');
    else setActivePage('checklist');
  };

  const handleScroll = (e) => {
    const currentScrollY = e.target.scrollTop;
    if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
      setTopbarVisible(false);
    } else {
      setTopbarVisible(true);
    }
    lastScrollY.current = currentScrollY;
  };

  const handleLogout = async () => {
    if (!window.confirm('Are you sure you want to logout?')) return;
    try { await ApiService.logout(); } catch { }
    onLogout();
  };

  const saveCo = () => alert(companyName.trim() ? `Company saved: ${companyName}` : 'Enter a company name first');

  const isSuperAdmin = user?.role === 'superadmin';

  const navGroups = [
    {
      label: 'MAIN',
      items: [
        { icon: '📊', label: 'Overview', active: activePage === 'grid', onClick: () => setActivePage('grid') },
        { icon: '📁', label: 'Reports' },
      ],
    },
    {
      label: 'OPERATIONS',
      items: [
        { icon: '🚨', label: 'Incidents', badge: 'NEW' },
        { icon: '🔎', label: 'Inspections' },
        { icon: '🗓️', label: 'Planning' },
        { icon: '📈', label: 'Analytics' },
        { icon: '📚', label: 'Training', badge: 'NEW' },
        { icon: '⚠️', label: 'Risk Register' },
      ],
    },
    {
      label: 'SYSTEM',
      items: [
        { icon: '⚙️', label: 'Settings' },
      ],
    },
  ];

  return (
    <div className={`dash ${navCollapsed ? 'sidebar-collapsed' : ''} ${!isDarkMode ? 'light-mode' : ''} ${!topbarVisible ? 'topbar-hidden' : ''}`}>
      {/* ── TOPBAR (HEADER AT TOP) ────────────────────────────────────────── */}
      <header className="topbar">
        <div className="topbar-left">
          <div className="topbar-brand">
            <div className="topbar-logo-pill">
              <img src="/apitoria-logo.png" alt="Apitoria" className="topbar-logo" />
            </div>
            <div className="topbar-copy">
              <div className="tb-title">
                <span className="tb-brand-icon">🚨
</span>
                Emergency Safety Dashboard
              </div>
              <div className="tb-subtitle">Real-time fire &amp; safety monitoring</div>
            </div>
          </div>
        </div>

        <div className="topbar-search">
          <div className="search-group">
            <div className="custom-select-wrap">
              <div className="custom-select-trigger" onClick={() => setFilterOpen(!filterOpen)}>
                <span className="select-label">{searchFilter}</span>
                <svg className={`select-chevron ${filterOpen ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
              {filterOpen && (
                <>
                  <div className="dropdown-overlay" onClick={() => setFilterOpen(false)} />
                  <div className="custom-select-options">
                    {filterOptions.map((opt) => (
                      <div
                        key={opt.label}
                        className={`custom-option ${searchFilter === opt.label ? 'selected' : ''}`}
                        onClick={() => { setSearchFilter(opt.label); setFilterOpen(false); }}
                      >
                        <span className="opt-icon">{opt.icon}</span>
                        {opt.label}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="search-box">
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input className="search-input" placeholder="Search equipment..." />
            </div>
          </div>
        </div>

        <div className="tb-actions">
          <div className="tb-clock">
            <svg className="tb-clock-icon" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="tb-time-bold">{currentTime}</span>
          </div>
          <button className="theme-toggle-btn" onClick={() => setIsDarkMode(!isDarkMode)} aria-label="Toggle theme">
            {isDarkMode ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>          <div className="bell-wrap">
            <span className="bell-icon">🔔</span>
            <span className="bell-badge">{alertCount > 99 ? '99+' : alertCount || 0}</span>
          </div>
          <div className="status-badge">❤️ {preparednessScore}%</div>
          <button className="panel-toggle-topbar-btn" onClick={() => setPanelVisible(!panelVisible)} title="Toggle info panel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="15" y1="3" x2="15" y2="21" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── DASHBOARD SHELL (SIDEBAR + MAIN) ──────────────────────────────── */}
      <div className="dashboard-shell">
        {/* ── SIDEBAR (NAV BAR ON LEFT) ────────────────────────────────────── */}
        <aside className={`sidebar model-sidebar ${navCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-head">
            <div className="sidebar-head-top">
              <button
                className="sidebar-toggle-btn"
                onClick={() => setNavCollapsed(!navCollapsed)}
                title={navCollapsed ? 'Expand navigation' : 'Collapse navigation'}
              >
                <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg>
              </button>
            </div>
          </div>

          <nav className="sb-scroll">
            {navGroups.map((group) => (
              <React.Fragment key={group.label}>
                {!navCollapsed && <div className="nav-section-label">{group.label}</div>}
                {group.items.map((item) => (
                  <div key={item.label} className={`nav-item ${item.active ? 'active' : ''}`} onClick={item.onClick || (() => {})}>
                    <div className="nav-left">
                      <span className="nav-icon">{item.icon}</span>
                      {!navCollapsed && <span className="nav-label">{item.label}</span>}
                    </div>
                    {!navCollapsed && item.badge && <span className="nav-badge">{item.badge}</span>}
                  </div>
                ))}
              </React.Fragment>
            ))}

            {/* CHECKLISTS DROPDOWN */}
            <div className={`nav-item dropdown-toggle ${checklistsDropdownOpen ? 'open' : ''}`} onClick={(e) => { e.stopPropagation(); setChecklistsDropdownOpen(!checklistsDropdownOpen); }}>
              <div className="nav-left">
                <span className="nav-icon">📝</span>
                {!navCollapsed && <span className="nav-label">Checklists</span>}
              </div>
              {!navCollapsed && (
                <svg className="nav-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              )}
            </div>

            {checklistsDropdownOpen && !navCollapsed && (
              <div className="nav-submenu">
                {/* Module-based Checklist Dashboards */}
                {!navCollapsed && <div className="nav-submenu-label">EQUIPMENT DASHBOARDS</div>}
                {CHECKLIST_MODULES.map((mod) => (
                  <div 
                    key={mod.id} 
                    className={`nav-submenu-item ${selectedEq?.id === mod.id && activePage === 'checklist' ? 'active' : ''}`} 
                    onClick={() => { setSelectedEq(mod); setActivePage('checklist'); }}
                  >
                    <span className="nav-icon-small">{mod.icon}</span>
                    <span className="nav-label-small">{mod.name}</span>
                  </div>
                ))}
                {checklists.length > 0 && (
                  <>
                    <div className="nav-divider-small"></div>

                    {!navCollapsed && <div className="nav-submenu-label">GENERAL CHECKLISTS</div>}
                    {checklists.map((cl) => (
                      <div key={cl.id} className="nav-submenu-item" onClick={() => { setSelectedEq(cl); setActivePage('checklist'); }}>
                        <span className="nav-icon-small">📄</span>
                        <span className="nav-label-small">{cl.name || cl.title || 'Checklist'}</span>
                      </div>
                    ))}
                  </>
                )}
                {checklists.length === 0 && (
                  <div className="nav-submenu-empty">No additional checklists</div>
                )}
              </div>
            )}

            {isSuperAdmin && (
              <>
                {!navCollapsed && <div className="nav-section-label">ADMINISTRATION</div>}
                <div className={`nav-item ${activePage === 'admin-companies' ? 'active' : ''}`} onClick={() => setActivePage('admin-companies')}>
                  <div className="nav-left">
                    <span className="nav-icon">🏢</span>
                    {!navCollapsed && <span className="nav-label">Companies</span>}
                  </div>
                </div>
                <div className={`nav-item ${activePage === 'admin-users' ? 'active' : ''}`} onClick={() => setActivePage('admin-users')}>
                  <div className="nav-left">
                    <span className="nav-icon">👥</span>
                    {!navCollapsed && <span className="nav-label">User Access</span>}
                  </div>
                </div>
                <div className={`nav-item ${activePage === 'admin-modules' ? 'active' : ''}`} onClick={() => setActivePage('admin-modules')}>
                  <div className="nav-left">
                    <span className="nav-icon">🛠️</span>
                    {!navCollapsed && <span className="nav-label">Card Config</span>}
                  </div>
                </div>
              </>
            )}
          </nav>

          <div className="sb-footer">
            <div className="sb-user-section">
              <div className="sb-user-avatar">
                {(user?.name || user?.username || 'A').charAt(0).toUpperCase()}
              </div>
              {!navCollapsed && (
                <div className="sb-user-info">
                  <div className="sb-user-name">{user?.name || user?.username || 'Admin User'}</div>
                  <div className="sb-user-role">{user?.role || 'Safety Officer'}</div>
                </div>
              )}
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {!navCollapsed && 'Logout'}
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT AREA (MIDDLE + RIGHT PANEL) ─────────────────────── */}
        <main className={`main ${!panelVisible ? 'panel-hidden' : ''}`}>
          {/* MIDDLE COLUMN: PAGES */}
          <div className="content-area">
            <section className={`page ${activePage === 'grid' ? 'active' : ''}`}>
              <div className="grid-scroll" onScroll={handleScroll} style={{ overflowY: 'auto' }}>
                <div className="eq-grid">
                  {filteredModules.map((mod) => (
                    <div key={mod.module_id} className={`eq-card ${getStatus(mod.health_score)}`} onClick={() => handleOpenModule(mod)}>
                      <div className="eq-icon">{MODULE_EMOJI[mod.code] || '📦'}</div>
                      <div className="eq-name">{mod.name}</div>
                      <div className="eq-pct">{mod.health_score}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className={`page ${activePage === 'checklist' ? 'active' : ''}`}>
              <div className="cl-page">
                <div className="cl-header">
                  <button className="cl-back-btn" onClick={() => setActivePage('grid')}>← Back</button>
                  <div className="cl-title">{selectedEq?.name || 'Checklist'}</div>
                  <div className="cl-prog-row">
                    <div className="cl-prog-bar"><div className="cl-prog-fill" style={{ width: `${progressPct}%` }} /></div>
                    <div className="cl-prog-txt">{checkedCount} / {totalItems}</div>
                  </div>
                </div>
                <div className="cl-body" onScroll={handleScroll}>
                  {clLoading ? (
                    <div className="cl-loading">
                      <div className="cl-spinner" />
                      <span>Loading checklist items...</span>
                    </div>
                  ) : activeChecklistItems.length > 0 ? (
                    <div className="cl-items-list">
                      {(() => {
                        // Sort by item_order first
                        const sorted = [...activeChecklistItems].sort((a, b) => (a.item_order || 0) - (b.item_order || 0));
                        
                        // Group by category
                        const groups = sorted.reduce((acc, item) => {
                          const cat = item.category || 'General Inspection';
                          if (!acc[cat]) acc[cat] = [];
                          acc[cat].push(item);
                          return acc;
                        }, {});
                        
                        return Object.entries(groups).map(([cat, items], gi) => (
                          <div key={gi} className="cl-section">
                            <div className="cl-sec-head">{cat}</div>
                            {items.map((item, idx) => {
                              const itemId = item.id || `item_${gi}_${idx}`;
                              return (
                                <div key={itemId} className={`cl-item ${checkedItems[itemId] ? 'done' : ''} ${item.is_critical ? 'is-critical' : ''}`}>
                                  <div className="cl-item-main">
                                    <input 
                                      type="checkbox" 
                                      className="cl-cb" 
                                      id={`cl_${itemId}`} 
                                      checked={!!checkedItems[itemId]} 
                                      onChange={() => toggleCheck(itemId)} 
                                    />
                                    <label className="cl-item-text" htmlFor={`cl_${itemId}`}>
                                      {item.item_text || item.checklist_name || item.name || 'Checklist Item'}
                                      {item.is_critical && <span className="cl-critical-badge">CRITICAL</span>}
                                    </label>
                                  </div>
                                  {item.hints && <div className="cl-item-hint">{item.hints}</div>}
                                </div>
                              );
                            })}
                          </div>
                        ));
                      })()}
                    </div>
                  ) : (
                    <div className="cl-empty">
                      <span className="cl-empty-icon">📝</span>
                      <p>No checklist items found for this module.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className={`page ${activePage === 'fire-stats' ? 'active' : ''}`}>
              {activePage === 'fire-stats' && <FireExtinguisherStats onBack={() => setActivePage('grid')} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'sprinkler-stats' ? 'active' : ''}`}>
              {activePage === 'sprinkler-stats' && <SprinklerStats onBack={() => setActivePage('grid')} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'hose-stats' ? 'active' : ''}`}>
              {activePage === 'hose-stats' && <HoseReelStats onBack={() => setActivePage('grid')} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'drum-stats' ? 'active' : ''}`}>
              {activePage === 'drum-stats' && <DrumHoseStats onBack={() => setActivePage('grid')} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'hydrant-stats' ? 'active' : ''}`}>
              {activePage === 'hydrant-stats' && <HydrantStats onBack={() => setActivePage('grid')} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'fire-trolley-stats' ? 'active' : ''}`}>
              {activePage === 'fire-trolley-stats' && <FireTrolleyStats onBack={() => setActivePage('grid')} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'suppression-system-stats' ? 'active' : ''}`}>
              {activePage === 'suppression-system-stats' && <SuppressionSystemStats onBack={() => setActivePage('grid')} onScroll={handleScroll} />}
            </section>

            <section className={`page ${activePage === 'admin-companies' ? 'active' : ''}`}>
              <div className="fe-page">
                <div className="fe-header"><div className="fe-header-title">🏢 Company Management</div></div>
              </div>
            </section>
            <section className={`page ${activePage === 'admin-users' ? 'active' : ''}`}>
              <div className="fe-page"><div className="fe-header-title">👥 User Access Control</div></div>
            </section>
            <section className={`page ${activePage === 'admin-modules' ? 'active' : ''}`}>
              <div className="fe-page"><div className="fe-header-title">🛠️ Card Configuration</div></div>
            </section>
          </div>

          {/* RIGHT COLUMN: INFO PANEL */}
          <RightPanel
            panelVisible={panelVisible}
            setPanelVisible={setPanelVisible}
            currentTime={currentTime}
            companyName={companyName}
            setCompanyName={setCompanyName}
            saveCo={saveCo}
            shiftData={shiftData}
            drillTime={drillTime}
            handoverNotes={handoverNotes}
            setHandoverNotes={setHandoverNotes}
          />
        </main>
      </div>
    </div>
  );
};

export default SafetyDashboard;

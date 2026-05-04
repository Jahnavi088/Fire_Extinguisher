import React, { useState, useEffect, useMemo } from 'react';
import './SafetyDashboard.css';
import { ApiService } from '../../services/apiService';
import FireExtinguisherStats from './FireExtinguisherStats';

const ICONS = {
  'Fire extinguishers': '🧯',
  'Hose reels': '🧵',
  'Drum hose reels': '🛢️',
  'Hydrant points': '🚒',
  'Sprinkler system': '🚿',
  'Fire alarm panels': '🔔',
  'Smoke detectors': '🌫️',
  'Fire trolley': '🛒',
  'Emergency Door': '🚪',
  'Emergency lighting': '🔦',
  'PA / siren system': '📢',
  'Wind sock': '📡',
  'SCBA units': '🫁',
  'Ambulance vehicle': '🚑',
  'First aid boxes': '🏥',
  'Emergency shower': '🚰',
  'Eye wash stations': '👀',
  'Spill control kits': '⚗️',
  'Chemical shower': '🛁',
  'PPE cabinets': '🦺',
  'Fire suppress. CO₂': '☁️',
  'Safety signage': '⚠️',
  'Emergency comm.': '📞',
  'Fire blankets': '🧲',
  'Muster point signs': '📍',
  'Fire Brigade Team': '👨‍🚒',
  'Volunteers': '🙋',
  'Shift Volunteers': '👥',
  'Fire NOC': '📜',
  'Trained / Shift': '🎓'
};

const CATS = [
  { key: 'fire', label: 'Fire Fighting', emoji: '🔥', cls: 'ci-f', items: [
    { n: 'Fire extinguishers', p: 95 }, { n: 'Hose reels', p: 98 }, { n: 'Drum hose reels', p: 100 },
    { n: 'Hydrant points', p: 100 }, { n: 'Sprinkler system', p: 100 }, { n: 'Fire trolley', p: 100 },
    { n: 'Fire suppress. CO₂', p: 100 }, { n: 'Fire blankets', p: 100 }
  ]},
  { key: 'detection', label: 'Detection', emoji: '🔔', cls: 'ci-m', items: [
    { n: 'Fire alarm panels', p: 100 }, { n: 'Smoke detectors', p: 95 }, { n: 'PA / siren system', p: 100 },
    { n: 'Emergency comm.', p: 80 }
  ]},
  { key: 'medical', label: 'Medical & Life', emoji: '🚑', cls: 'ci-c', items: [
    { n: 'SCBA units', p: 66 }, { n: 'Ambulance vehicle', p: 50 }, { n: 'First aid boxes', p: 93 },
    { n: 'Emergency shower', p: 100 }, { n: 'Eye wash stations', p: 87 }, { n: 'Chemical shower', p: 100 },
    { n: 'PPE cabinets', p: 91 }, { n: 'Fire Brigade Team', p: 90 }, { n: 'Volunteers', p: 78 },
    { n: 'Shift Volunteers', p: 72 }, { n: 'Trained / Shift', p: 85 }
  ]},
  { key: 'safety', label: 'General Safety', emoji: '⚠️', cls: 'ci-s', items: [
    { n: 'Emergency Door', p: 97 }, { n: 'Emergency lighting', p: 97 }, { n: 'Wind sock', p: 100 },
    { n: 'Spill control kits', p: 90 }, { n: 'Safety signage', p: 96 }, { n: 'Muster point signs', p: 100 },
    { n: 'Fire NOC', p: 100 }
  ]}
];

const SafetyDashboard = ({ user, onLogout }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [activePage, setActivePage] = useState('grid');
  const [selectedEq, setSelectedEq] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});
  const [panelVisible, setPanelVisible] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [drillTime, setDrillTime] = useState('');
  const [shiftData, setShiftData] = useState({ icon: '🌅', name: 'Day Shift', time: '06:00 – 14:00', staff: 12 });
  const [catOpen, setCatOpen] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    ApiService.getAlertsSummary()
      .then(d => setAlertCount(d.total_alerts || 0))
      .catch(() => {});
  }, []);

  const allEquipment = useMemo(() => {
    return CATS.flatMap(cat => cat.items.map(item => ({ ...item, cat: cat.label, catKey: cat.key })));
  }, []);

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      let hours = n.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const p = (x) => String(x).padStart(2, '0');
      setCurrentTime(`${p(hours)}:${p(n.getMinutes())}:${p(n.getSeconds())} ${ampm}`);
    };
    tick();
    const timer = setInterval(tick, 1000);

    const updateShift = () => {
      const h = new Date().getHours();
      if (h >= 6 && h < 14) setShiftData({ icon: '🌅', name: 'Day Shift', time: '06:00 – 14:00', staff: 14 });
      else if (h >= 14 && h < 22) setShiftData({ icon: '☀️', name: 'Afternoon Shift', time: '14:00 – 22:00', staff: 11 });
      else setShiftData({ icon: '🌙', name: 'Night Shift', time: '22:00 – 06:00', staff: 8 });
    };
    updateShift();
    const shiftTimer = setInterval(updateShift, 60000);

    const _drillDate = new Date('2026-05-15T09:00:00');
    const updateDrill = () => {
      const diff = _drillDate - new Date();
      if (diff <= 0) return setDrillTime('🚨 DRILL NOW');
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setDrillTime(`${d}d ${h}h ${m}m ${s}s`);
    };
    updateDrill();
    const drillTimer = setInterval(updateDrill, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(shiftTimer);
      clearInterval(drillTimer);
    };
  }, []);

  const handleOpenChecklist = (item) => {
    setSelectedEq(item);
    if (item.n === 'Fire extinguishers') {
      setActivePage('fire-stats');
    } else {
      setActivePage('checklist');
    }
  };

  const toggleCheck = (id) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const saveCo = () => { if (companyName) { alert(`Company "${companyName}" saved!`); setCompanyName(''); } };
  
  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      try {
        await ApiService.logout();
        onLogout();
      } catch (err) {
        console.error('Logout failed', err);
      }
    }
  };

  const filteredEquipment = allEquipment.filter(item => {
    const matchSearch = item.n.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = filterCat === 'all' || item.catKey === filterCat;
    return matchSearch && matchCat;
  });

  const getStatus = (p) => p >= 90 ? 'healthy' : p >= 70 ? 'warning' : 'critical';
  const getStatusTxt = (p) => p >= 90 ? 'HEALTHY' : p >= 70 ? 'WARNING' : 'CRITICAL';

  const checklistData = [
    { sec: 'Physical Integrity', items: ['No visible corrosion or dents', 'Mounting brackets secure', 'Pressure gauge in green zone'] },
    { sec: 'Operational Readiness', items: ['Safety pin and seal intact', 'Nozzle/hose clear of blockages', 'Instruction label legible'] }
  ];
  const totalItems = checklistData.reduce((acc, s) => acc + s.items.length, 0);
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const progressPct = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;

  return (
    <div className={`dash ${!isDarkMode ? 'light-mode' : ''}`}>
      {/* SIDEBAR */}
      <div className={`sidebar ${navCollapsed ? 'collapsed' : ''}`}>
        <div className="sb-header" style={{ justifyContent: navCollapsed ? 'center' : 'space-between' }}>
          {!navCollapsed && (
            <div className="topbar-logo-pill" style={{ margin: '0' }}>
              <img 
                src="/apitoria-logo.png" 
                alt="Apitoria" 
                className="topbar-logo" 
              />
            </div>
          )}
          {navCollapsed && (
            <div className="topbar-logo-pill" style={{ width: '38px', height: '38px', padding: '4px' }}>
              <img 
                src="/apitoria-logo.png" 
                alt="Logo" 
                style={{ height: '26px', width: '26px', objectFit: 'contain', display: 'block', margin: 'auto' }}
              />
            </div>
          )}
          <button
            className="sidenav-toggle-btn"
            onClick={() => setNavCollapsed(!navCollapsed)}
            title={navCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{ marginLeft: navCollapsed ? '0' : '8px' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>

        <div className="sb-scroll">
          {!navCollapsed && <div className="sb-section-label">Main</div>}

          <div className={`cat-header ${activePage === 'grid' ? 'active' : ''}`} onClick={() => setActivePage('grid')}>
            <span className="sidenav-icon">📊</span>
            {!navCollapsed && <span className="cat-name">Overview</span>}
            {navCollapsed && <div className="sidenav-tip">Overview</div>}
          </div>

          <div className={`cat-header ${activePage === 'fire-stats' ? 'active' : ''}`} onClick={() => setActivePage('fire-stats')}>
            <span className="sidenav-icon">📋</span>
            {!navCollapsed && <span className="cat-name">Reports</span>}
            {navCollapsed && <div className="sidenav-tip">Reports</div>}
          </div>

          <div className="sidenav-divider"></div>
          {!navCollapsed && <div className="sb-section-label">Operations</div>}

          <div className="cat-header" onClick={() => { }}>
            <span className="sidenav-icon">🚨</span>
            {!navCollapsed && <span className="cat-name">Incidents</span>}
            {!navCollapsed && <span className="sidenav-badge">NEW</span>}
            {navCollapsed && <div className="sidenav-tip">Incidents</div>}
          </div>

          <div className="cat-header" onClick={() => { }}>
            <span className="sidenav-icon">🔍</span>
            {!navCollapsed && <span className="cat-name">Inspections</span>}
            {navCollapsed && <div className="sidenav-tip">Inspections</div>}
          </div>

          <div className="cat-header" onClick={() => { }}>
            <span className="sidenav-icon">📅</span>
            {!navCollapsed && <span className="cat-name">Planning</span>}
            {navCollapsed && <div className="sidenav-tip">Planning</div>}
          </div>

          <div className="cat-header" onClick={() => { }}>
            <span className="sidenav-icon">📈</span>
            {!navCollapsed && <span className="cat-name">Analytics</span>}
            {navCollapsed && <div className="sidenav-tip">Analytics</div>}
          </div>

          <div className="cat-header" onClick={() => { }}>
            <span className="sidenav-icon">📚</span>
            {!navCollapsed && <span className="cat-name">Training</span>}
            {!navCollapsed && <span className="sidenav-badge">NEW</span>}
            {navCollapsed && <div className="sidenav-tip">Training</div>}
          </div>

          <div className="cat-header" onClick={() => { }}>
            <span className="sidenav-icon">⚠️</span>
            {!navCollapsed && <span className="cat-name">Risk Register</span>}
            {navCollapsed && <div className="sidenav-tip">Risk Register</div>}
          </div>

          <div className="sidenav-divider"></div>
          {!navCollapsed && <div className="sb-section-label">System</div>}

          <div className="cat-header" onClick={() => { }}>
            <span className="sidenav-icon">⚙️</span>
            {!navCollapsed && <span className="cat-name">Settings</span>}
            {navCollapsed && <div className="sidenav-tip">Settings</div>}
          </div>
        </div>

        <div className="sb-footer">
          {!navCollapsed && user && (
            <div className="sb-user-row">
              <div className="sb-avatar">
                {(user.name || user.email || 'U')[0].toUpperCase()}
              </div>
              <div className="sb-user-info">
                <div className="sb-user-name">{user.name || user.email || 'User'}</div>
                <div className="sb-user-role">Safety Officer</div>
              </div>
            </div>
          )}
          <button className="logout-btn" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {!navCollapsed && "Logout"}
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div className="main">
        {/* TOPBAR */}
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-brand">
              <div className="tb-brand-icon">🚨</div>
              <div>
                <div className="tb-title">Emergency Safety Dashboard</div>
                <div className="tb-subtitle">Real-time fire &amp; safety monitoring</div>
              </div>
            </div>
          </div>

          <div className="search-wrap">
            <div className="search-group">
              <div className="custom-select-wrap">
                <div className="custom-select-trigger" onClick={() => setCatOpen(!catOpen)}>
                  <span className="select-emoji">
                    {filterCat === 'all' ? '' : CATS.find(c => c.key === filterCat)?.emoji}
                  </span>
                  <span className="select-label">
                    {filterCat === 'all' ? 'All' : CATS.find(c => c.key === filterCat)?.label.split(' ')[0]}
                  </span>
                  <svg className={`select-chevron ${catOpen ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
                {catOpen && (
                  <div className="custom-select-options">
                    <div className={`custom-option ${filterCat === 'all' ? 'selected' : ''}`}
                      onClick={() => { setFilterCat('all'); setCatOpen(false); }}>
                      <span className="opt-icon"></span>
                      <span>All Categories</span>
                    </div>
                    {CATS.map(cat => (
                      <div key={cat.key}
                        className={`custom-option ${filterCat === cat.key ? 'selected' : ''}`}
                        onClick={() => { setFilterCat(cat.key); setCatOpen(false); }}>
                        <span className="opt-icon">{cat.emoji}</span>
                        <span>{cat.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="search-box">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search equipment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="tb-actions">
            <div className="tb-clock">
              <svg className="tb-clock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span id="clock" className="tb-time-bold">{currentTime}</span>
            </div>

            <button
              className="theme-toggle-btn"
              onClick={() => setIsDarkMode(!isDarkMode)}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              )}
            </button>

            <div className="bell-wrap" title="Critical alerts">
              <span className="bell-icon">🔔</span>
              <span className="bell-badge" id="bellCount">{alertCount > 99 ? '99+' : alertCount || 0}</span>
            </div>

            <div className="status-badge" id="overallBadge">
              <span className="heart-icon">❤️</span> 94%
            </div>

            <button className="panel-btn-icon" onClick={() => setPanelVisible(!panelVisible)} title={panelVisible ? "Hide Panel" : "Show Panel"}>
              <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" fill="none" strokeWidth="2" /><path d="M15 3v18" stroke="currentColor" strokeWidth="2" /></svg>
            </button>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className={`content-area ${!panelVisible ? 'panel-hidden' : ''}`}>
          {/* GRID PAGE */}
          <div className={`page ${activePage === 'grid' ? 'active' : ''}`}>
            <div className="grid-scroll">
              <div className="eq-grid">
                {filteredEquipment.map(item => (
                  <div
                    key={item.n}
                    className={`eq-card ${getStatus(item.p)}`}
                    onClick={() => handleOpenChecklist(item)}
                  >
                    <div className="eq-icon">{ICONS[item.n] || '📦'}</div>
                    <div className="eq-name">{item.n}</div>
                    <div className="eq-status-label">{getStatusTxt(item.p)}</div>
                    <div className="eq-pct">{item.p}%</div>
                  </div>
                ))}
              </div>
              {filteredEquipment.length === 0 && (
                <div className="no-results">No equipment found matching your criteria.</div>
              )}
            </div>
          </div>

          {/* CHECKLIST PAGE */}
          <div className={`page ${activePage === 'checklist' ? 'active' : ''}`}>
            <div className="cl-page">
              <div className="cl-header">
                <button className="cl-back-btn" onClick={() => setActivePage('grid')}>
                  <svg viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
                  Back to dashboard
                </button>
                <div className="cl-title">{selectedEq?.n || 'Checklist'}</div>
                <div className="cl-subtitle">
                  Health: {selectedEq?.p}%  ·  Status: {selectedEq ? getStatusTxt(selectedEq.p) : ''}  ·  Equipment inspection checklist
                </div>
                <div className="cl-prog-row">
                  <div className="cl-prog-bar"><div className="cl-prog-fill" style={{ width: `${progressPct}%` }}></div></div>
                  <div className="cl-prog-txt">{checkedCount} / {totalItems}</div>
                </div>
              </div>
              <div className="cl-body">
                {checklistData.map((sec, si) => (
                  <div key={si} className="cl-section">
                    <div className="cl-sec-head">
                      <svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                      {sec.sec}
                    </div>
                    {sec.items.map((txt, ii) => {
                      const id = `cb_${si}_${ii}`;
                      return (
                        <div key={ii} className={`cl-item ${checkedItems[id] ? 'done' : ''}`}>
                          <input
                            type="checkbox"
                            className="cl-cb"
                            id={id}
                            checked={!!checkedItems[id]}
                            onChange={() => toggleCheck(id)}
                          />
                          <label className="cl-item-text" htmlFor={id}>{txt}</label>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* FIRE STATS PAGE */}
          <div className={`page ${activePage === 'fire-stats' ? 'active' : ''}`}>
            {activePage === 'fire-stats' && (
              <FireExtinguisherStats onBack={() => setActivePage('grid')} />
            )}
          </div>

          <div className="right-panel">
            {/* GAUGE */}
            <div className="rp-block">
              <div className="rp-label">📊 Readiness Score</div>
              <div className="gauge-wrap">
                <svg width="112" height="64" viewBox="0 0 112 64" fill="none" role="img" aria-label="94% readiness gauge">
                  <path d="M10 58 A46 46 0 0 1 102 58" stroke="rgba(255,255,255,0.1)" strokeWidth="10" strokeLinecap="round" fill="none" />
                  <path d="M10 58 A46 46 0 0 1 102 58" stroke="#16a34a" strokeWidth="10" strokeLinecap="round" fill="none" strokeDasharray="144.5" strokeDashoffset="8.7" />
                  <text className="gauge-text" x="56" y="55" textAnchor="middle">94%</text>
                </svg>
                <div className="gauge-sub">Current system health</div>
              </div>
            </div>

            {/* STATUS COUNTS */}
            <div className="rp-block">
              <div className="st-row"><span className="st-dot" style={{ background: '#28a745' }}></span><span className="st-name">Healthy</span><span className="st-num">21</span></div>
              <div className="st-row"><span className="st-dot" style={{ background: '#FF9800' }}></span><span className="st-name">Warning</span><span className="st-num">2</span></div>
              <div className="st-row"><span className="st-dot" style={{ background: '#dc3545' }}></span><span className="st-name">Critical</span><span className="st-num">1</span></div>
            </div>

            {/* INSPECTION FREQUENCY */}
            <div className="rp-block">
              <div className="rp-label">📅 Inspection Frequency</div>
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
                  <span>🟢 Monthly</span><strong>18</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
                  <span>🟠 Quarterly</span><strong>4</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span>🔵 Semi-annual</span><strong>2</strong>
                </div>
              </div>
            </div>

            {/* COMPANY SELECTOR */}
            <div className="rp-block">
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input
                  className="search-input"
                  style={{ padding: '6px 10px', height: '34px' }}
                  placeholder="Company name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
                <button className="export-btn" onClick={saveCo} style={{ padding: '6px 12px', height: '34px' }}>Save</button>
              </div>
              <div className="rp-label">🏢 Saved Companies</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.1)', padding: '3px 8px', borderRadius: '99px' }}>Acme Corp</span>
                <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.1)', padding: '3px 8px', borderRadius: '99px' }}>Global Tech</span>
              </div>
            </div>

            {/* CURRENT SHIFT */}
            <div className="rp-block">
              <div className="rp-label">🕐 Current Shift</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '8px 0 4px' }}>
                <span style={{ fontSize: '2rem' }}>{shiftData.icon}</span>
                <div>
                  <div style={{ fontWeight: '800' }}>{shiftData.name}</div>
                  <div style={{ fontSize: '11px', opacity: 0.7 }}>{shiftData.time}</div>
                </div>
              </div>
              <div style={{ fontSize: '12px' }}>👷 Staff on shift: <strong>{shiftData.staff}</strong></div>
            </div>

            {/* SITE CONDITIONS */}
            <div className="rp-block">
              <div className="rp-label">🌡️ Site Conditions</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '8px' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '6px', textAlign: 'center', fontSize: '11px' }}>
                  <strong style={{ display: 'block', fontSize: '13px' }}>31°C</strong>Temp
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '6px', textAlign: 'center', fontSize: '11px' }}>
                  <strong style={{ display: 'block', fontSize: '13px' }}>12km/h</strong>Wind
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '6px', textAlign: 'center', fontSize: '11px' }}>
                  <strong style={{ display: 'block', fontSize: '13px' }}>65%</strong>Humidity
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '6px', textAlign: 'center', fontSize: '11px' }}>
                  <strong style={{ display: 'block', fontSize: '13px' }}>Clear</strong>Sky
                </div>
              </div>
            </div>

            {/* ACTIVE PERMITS */}
            <div className="rp-block">
              <div className="rp-label">📝 Active Permits</div>
              <div style={{ marginTop: '8px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>🔥 Hot Work</span><strong>2</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>🕳️ Confined Space</span><strong>1</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>🪜 Height Work</span><strong>1</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px', marginTop: '4px' }}>
                  <strong>Total Active</strong><strong>4</strong>
                </div>
              </div>
            </div>

            {/* NEXT DRILL */}
            <div className="rp-block" style={{ background: drillTime.includes('🚨') ? 'rgba(220,53,69,0.2)' : '' }}>
              <div className="rp-label">⏱️ Next Drill</div>
              <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '4px' }}>15 May 2026 · 09:00 — Evacuation</div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--blue)', marginTop: '4px', fontFamily: 'monospace' }}>{drillTime}</div>
            </div>

            {/* SHIFT HANDOVER */}
            <div className="rp-block" style={{ border: 'none' }}>
              <div className="rp-label">💬 Shift Handover</div>
              <textarea
                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', padding: '8px', fontSize: '12px', marginTop: '8px', minHeight: '60px', resize: 'vertical' }}
                placeholder="Notes for next shift..."
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
              />
              <div style={{ fontSize: '10px', opacity: 0.4, marginTop: '4px' }}>✔ Auto-saved locally</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyDashboard;

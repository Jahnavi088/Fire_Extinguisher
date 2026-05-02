import React, { useState, useEffect, useMemo } from 'react';
import './SafetyDashboard.css';
import { ApiService } from '../../services/apiService';
const ICONS = {
  'Fire extinguishers': '🧯',
  'Hose reels': '🧵',
  'Drum hose reels': '🛢️',
  'Hydrant points': '🚒',
  'Sprinkler system': '🚿',
  'Fire alarm panels': '🔔',
  'Smoke detectors': '🌫️',
  'Fire trolley': '🛒',
  'Emergency exits': '🚪',
  'Emergency lighting': '💡',
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
  'Muster point signs': '📍'
};

const CATS = [
  { key: 'fire', label: 'Fire suppression & detection', cls: 'ci-f', emoji: '🔥', items: [{ n: 'Fire extinguishers', p: 98 }, { n: 'Hose reels', p: 100 }, { n: 'Hydrant points', p: 88 }, { n: 'Sprinkler system', p: 92 }, { n: 'Fire alarm panels', p: 100 }, { n: 'Smoke detectors', p: 97 }, { n: 'Fire suppress. CO₂', p: 100 }] },
  { key: 'medical', label: 'Medical & emergency', cls: 'ci-m', emoji: '🏥', items: [{ n: 'SCBA units', p: 95 }, { n: 'Ambulance vehicle', p: 50 }, { n: 'First aid boxes', p: 93 }, { n: 'Fire trolley', p: 90 }, { n: 'Emergency shower', p: 98 }, { n: 'Eye wash stations', p: 87 }, { n: 'Spill control kits', p: 100 }, { n: 'Chemical shower', p: 100 }, { n: 'PPE cabinets', p: 100 }] },
  { key: 'access', label: 'Emergency access & comm.', cls: 'ci-c', emoji: '📢', items: [{ n: 'Emergency exits', p: 100 }, { n: 'Emergency lighting', p: 96 }, { n: 'PA / siren system', p: 100 }, { n: 'Wind sock', p: 91 }, { n: 'Safety signage', p: 100 }, { n: 'Emergency comm.', p: 100 }, { n: 'Fire blankets', p: 100 }, { n: 'Muster point signs', p: 100 }] }
];

const CHECKLISTS = {
  'Hose reels': [
    { sec: 'Installation', items: ['Hose reel is permanently connected to a reliable water supply', 'Hose reel is securely mounted on a wall or structure', 'Installation height allows easy manual operation', 'Hose length does not exceed 30 meters', 'Hose diameter complies with standard (19mm or 25mm)'] },
    { sec: 'Accessibility', items: ['Hose reel is easily accessible at all times', 'Hose reel is not obstructed by any object', 'Clear identification signage is provided', 'Area around hose reel is adequately illuminated'] },
    { sec: 'Mechanical Design', items: ['Reel drum rotates freely without excessive resistance', 'Hose can be pulled out smoothly without jerks', 'Hose rewinds properly without twisting or kinks'] },
    { sec: 'Hose & Nozzle', items: ['Hose material is flexible and durable', 'Hose is free from cracks, cuts, or abrasion', 'Hose shows no signs of bulging or deformation', 'Nozzle is securely attached and free from blockage', 'Nozzle operates in both jet and spray modes', 'No leakage observed along hose length'] },
    { sec: 'System & Water Supply', items: ['Hose reel is connected to a continuous water supply', 'Adequate water pressure is maintained in the system', 'Water discharge starts immediately after valve opening', 'Water flow is continuous and stable during operation', 'No leakage occurs during operation'] },
    { sec: 'Monthly Inspection (NFPA)', items: ['Hose is free from cracks, cuts, and abrasions', 'No signs of leakage visible', 'Hose is properly rolled or wound on reel', 'Nozzle is present and undamaged', 'Valve is accessible and not obstructed', 'No corrosion present on metallic components'] },
    { sec: 'Annual Testing', items: ['Hydrostatic pressure testing conducted', 'Flow rate testing performed', 'System performance meets required standards', 'Defective components replaced immediately', 'All maintenance activities recorded'] },
    { sec: 'Compliance & Records', items: ['Monthly visual inspections are conducted', 'Functional testing is performed periodically', 'Inspection and maintenance records are maintained', 'System complies with applicable standards', 'Fire safety approvals and certifications are valid', 'Personnel are trained in hose reel operation'] }
  ],
  'Drum hose reels': [
    { sec: 'Installation & Mounting', items: ['Drum hose reel is securely fixed to wall or floor bracket', 'Installation is at appropriate height for easy operation', 'Water supply connection is secure and leak-free', 'Drum rotates freely on its axle without resistance'] },
    { sec: 'Hose Condition', items: ['Hose is free from cracks, cuts, or visible damage', 'Hose material remains flexible and not hardened', 'No bulging or deformation observed on hose', 'Hose length does not exceed 30 metres'] },
    { sec: 'Operational Check', items: ['Hose rewinds smoothly onto drum without kinks', 'Nozzle is present, clean, and fully functional', 'Valve opens and closes smoothly without stiffness', 'Water flow begins immediately upon valve opening', 'Discharge pressure is adequate for firefighting'] },
    { sec: 'Records', items: ['Last inspection date recorded and within required interval', 'No pending maintenance or repairs outstanding', 'Compliance certification is current and valid'] }
  ]
};

const GENERIC_CL = [
  { sec: 'Visual Inspection', items: ['Unit is in proper physical condition with no visible damage', 'Unit is accessible and not obstructed by any materials or equipment', 'Proper signage is displayed and clearly visible', 'Area around unit is adequately illuminated', 'Unit is securely mounted or positioned in place'] },
  { sec: 'Functional Check', items: ['All components operate as designed', 'No abnormal sounds or vibrations during operation', 'Controls respond correctly to input', 'System activates and deactivates as expected', 'Output or discharge is within normal operating range'] },
  { sec: 'Physical Condition', items: ['No corrosion or rust visible on metallic components', 'All fittings and joints are tight and secure', 'No loose bolts, nuts, or connections found', 'Moving parts are properly lubricated', 'Cabinet or enclosure (if applicable) is in good condition'] },
  { sec: 'Maintenance & Compliance', items: ['Maintenance schedule is current and up to date', 'Last inspection date is within required interval', 'Inspection records are maintained and signed off', 'No pending service or repairs identified', 'Certification or compliance tag is valid and current'] }
];

const getStatus = (p) => p >= 90 ? 'healthy' : p >= 70 ? 'warning' : 'critical';
const getSdotCls = (p) => p >= 90 ? 'sdot-g' : p >= 70 ? 'sdot-a' : 'sdot-r';
const getDotCls = (p) => p >= 90 ? 'dot-g' : p >= 70 ? 'dot-a' : 'dot-r';
const getStatusTxt = (p) => p >= 90 ? 'Healthy' : p >= 70 ? 'Warning' : 'Critical';

const SafetyDashboard = ({ user, onLogout }) => {
  const [panelVisible, setPanelVisible] = useState(true);
  const [activePage, setActivePage] = useState('grid');
  const [selectedEq, setSelectedEq] = useState(null);
  const [companyName, setCompanyName] = useState('Acme Industries');
  const [currentTime, setCurrentTime] = useState('--:--:--');
  const [openCats, setOpenCats] = useState({});
  const [checkedItems, setCheckedItems] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Flatten equipment data for the main grid
  const allEquipment = useMemo(() => {
    return CATS.flatMap(cat => cat.items.map(item => ({ ...item, cat: cat.label, catKey: cat.key })));
  }, []);

  const filteredEquipment = useMemo(() => {
    return allEquipment.filter(item => {
      const matchesSearch = item.n.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = filterCat === 'all' || item.catKey === filterCat;
      return matchesSearch && matchesCat;
    });
  }, [allEquipment, filterCat, searchTerm]);

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      let hours = n.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      const p = (x) => String(x).padStart(2, '0');
      setCurrentTime(`${p(hours)}:${p(n.getMinutes())}:${p(n.getSeconds())} ${ampm}`);
    };
    const timer = setInterval(tick, 1000);
    tick();
    return () => clearInterval(timer);
  }, []);

  const toggleCat = (key) => {
    setOpenCats(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleOpenChecklist = (item) => {
    setSelectedEq(item);
    setActivePage('checklist');
    setCheckedItems({});
  };

  const toggleCheck = (id) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const checklistData = useMemo(() => {
    if (!selectedEq) return [];
    return CHECKLISTS[selectedEq.n] || GENERIC_CL;
  }, [selectedEq]);

  const totalItems = useMemo(() => {
    return checklistData.reduce((acc, sec) => acc + sec.items.length, 0);
  }, [checklistData]);

  const checkedCount = useMemo(() => {
    return Object.values(checkedItems).filter(Boolean).length;
  }, [checkedItems]);

  const progressPct = totalItems ? Math.round((checkedCount / totalItems) * 100) : 0;

  const saveCo = () => {
    if (companyName.trim()) {
      alert('Company saved: ' + companyName);
    }
  };

  const handleLogout = async () => {
    const confirmLogout = window.confirm('Do you want to logout?');
    if (confirmLogout) {
      try {
        await ApiService.logout();
        onLogout();
      } catch (err) {
        console.error('Logout failed', err);
      }
    }
  };

  return (
    <div className={`dash ${!isDarkMode ? 'light-mode' : ''}`}>
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="sb-header">
          <div className="sb-logo-row">
            <div className="sb-icon-wrap">
              <svg viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 4l7.5 13h-15L12 6zm-1 5v4h2v-4h-2zm0 6v2h2v-2h-2z" /></svg>
            </div>
            <div>
              <div className="sb-brand">SafetyMonitor</div>
              <div className="sb-sub">Emergency Readiness System</div>
            </div>
          </div>
        </div>
        <div className="sb-scroll">
          <div className="sb-section-label">Equipment Categories</div>
          <div id="sb-cats">
            {CATS.map(cat => (
              <div key={cat.key} className="cat-group">
                <button
                  className={`cat-header ${openCats[cat.key] ? 'open' : ''}`}
                  onClick={() => toggleCat(cat.key)}
                >
                  <span className={`ci ${cat.cls}`}>{cat.emoji}</span>
                  <span className="cat-name">{cat.label}</span>
                  <span className="cat-arrow">▶</span>
                </button>
                <div className="eq-dropdown">
                  {cat.items.map(item => (
                    <button key={item.n} className="eq-btn" onClick={() => handleOpenChecklist(item)}>
                      <span className={`eq-btn-dot ${getDotCls(item.p)}`}></span>
                      <span className="eq-btn-label">{item.n}</span>
                      <span className="eq-btn-pct">{item.p}%</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="sb-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            Logout
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div className="main">
        {/* TOPBAR */}
        <div className="topbar">
          <span style={{ fontSize: '16px' }}>🚨</span>
          <span className="tb-title">Safety Dashboard</span>

          <div className="search-wrap">
            <div className="search-box">
              <svg className="search-icon" viewBox="0 0 24 24"><path d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35" /></svg>
              <input
                type="text"
                className="search-input"
                placeholder="Search equipment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="cat-select"
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
            >
              <option value="all">All Categories</option>
              {CATS.map(cat => (
                <option key={cat.key} value={cat.key}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="tb-actions">
            <button className="theme-toggle" onClick={() => setIsDarkMode(!isDarkMode)} title="Toggle Dark/Light Mode">
              {isDarkMode ? (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
              )}
            </button>

            <button className="panel-btn-icon" onClick={() => setPanelVisible(!panelVisible)} title={panelVisible ? "Hide Panel" : "Show Panel"}>
              <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" fill="none" strokeWidth="2" /><path d="M15 3v18" stroke="currentColor" strokeWidth="2" /></svg>
            </button>
            <div className="tb-time-bold">{currentTime}</div>
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

          {/* RIGHT PANEL */}
          <div className="right-panel">
            <div className="rp-block">
              <div className="rp-label">Overall readiness</div>
              <div className="gauge-wrap">
                <svg width="112" height="64" viewBox="0 0 112 64" fill="none" role="img" aria-label="94% readiness gauge">
                  <path d="M10 58 A46 46 0 0 1 102 58" stroke="#f1f5f9" stroke-width="10" stroke-linecap="round" fill="none" />
                  <path d="M10 58 A46 46 0 0 1 102 58" stroke="#16a34a" stroke-width="10" stroke-linecap="round" fill="none" stroke-dasharray="144.5" stroke-dashoffset="8.7" />
                  <path d="M10 58 A46 46 0 0 1 102 58" stroke="#dc2626" stroke-width="10" stroke-linecap="round" fill="none" stroke-dasharray="144.5" stroke-dashoffset="135.8" />
                  <text x="56" y="55" textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--text)" fontFamily="Rajdhani,system-ui">94%</text>
                </svg>
                <div className="gauge-sub">Readiness score</div>
              </div>
            </div>
            <div className="rp-block">
              <div className="rp-label">Device status</div>
              <div className="st-row"><span className="st-dot" style={{ background: '#16a34a' }}></span><span className="st-name">Healthy</span><span className="st-num">21</span><span className="st-arr">›</span></div>
              <div className="st-row"><span className="st-dot" style={{ background: '#d97706' }}></span><span className="st-name">Warning</span><span className="st-num">2</span><span className="st-arr">›</span></div>
              <div className="st-row"><span className="st-dot" style={{ background: '#dc2626' }}></span><span className="st-name">Critical</span><span className="st-num">1</span><span className="st-arr">›</span></div>
            </div>

            <div className="rp-block" style={{ border: 'none', paddingBottom: '4px' }}><div className="rp-label">Active alerts</div></div>
            <div className="alerts-wrap">
              <div className="alert-row"><span className="adot" style={{ background: '#dc2626' }}></span><span className="atext"><strong>Ambulance vehicle</strong> — 50%. Immediate inspection needed.</span></div>
              <div className="alert-row"><span className="adot" style={{ background: '#d97706' }}></span><span className="atext"><strong>Eye wash stations</strong> — 87%. 2 units need servicing.</span></div>
              <div className="alert-row"><span className="adot" style={{ background: '#d97706' }}></span><span className="atext"><strong>Hydrant points</strong> — 88%. Check water pressure.</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyDashboard;

import React from 'react';

const RightPanel = ({ 
  panelVisible, 
  setPanelVisible, 
  currentTime, 
  companyName, 
  setCompanyName, 
  saveCo, 
  shiftData, 
  drillTime, 
  handoverNotes, 
  setHandoverNotes 
}) => {
  return (
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
  );
};

export default RightPanel;

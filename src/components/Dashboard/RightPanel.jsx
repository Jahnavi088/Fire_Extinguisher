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
          <svg width="100" height="58" viewBox="0 0 112 64" fill="none" role="img" aria-label="94% readiness gauge">
            <path d="M10 58 A46 46 0 0 1 102 58" stroke="rgba(0,0,0,0.05)" strokeWidth="10" strokeLinecap="round" fill="none" />
            <path d="M10 58 A46 46 0 0 1 102 58" stroke="#16a34a" strokeWidth="10" strokeLinecap="round" fill="none" strokeDasharray="144.5" strokeDashoffset="8.7" />
            <text className="gauge-text" x="56" y="55" textAnchor="middle" style={{ fill: '#000', fontWeight: '900', fontSize: '20px' }}>94%</text>
          </svg>
          <div className="gauge-sub" style={{ color: '#666', fontSize: '9px' }}>Current system health</div>
        </div>
      </div>

      {/* STATUS COUNTS */}
      <div className="rp-block">
        <div className="st-row" style={{ color: '#000', fontSize: '10px' }}><span className="st-dot" style={{ background: '#28a745' }}></span><span className="st-name">Healthy</span><span className="st-num" style={{ color: '#000' }}>21</span></div>
        <div className="st-row" style={{ color: '#000', fontSize: '10px' }}><span className="st-dot" style={{ background: '#FF9800' }}></span><span className="st-name">Warning</span><span className="st-num" style={{ color: '#000' }}>2</span></div>
        <div className="st-row" style={{ color: '#000', fontSize: '10px' }}><span className="st-dot" style={{ background: '#dc3545' }}></span><span className="st-name">Critical</span><span className="st-num" style={{ color: '#000' }}>1</span></div>
      </div>

      {/* INSPECTION FREQUENCY */}
      <div className="rp-block">
        <div className="rp-label">📅 Inspection Frequency</div>
        <div style={{ marginTop: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '10px', color: '#000' }}>
            <span>🟢 Monthly</span><strong style={{ color: '#000' }}>18</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '10px', color: '#000' }}>
            <span>🟠 Quarterly</span><strong style={{ color: '#000' }}>4</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#000' }}>
            <span>🔵 Semi-annual</span><strong style={{ color: '#000' }}>2</strong>
          </div>
        </div>
      </div>

      {/* COMPANY SELECTOR */}
      <div className="rp-block">
        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
          <input
            className="search-input"
            style={{ padding: '4px 8px', height: '30px', fontSize: '11px', color: '#000', background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.1)' }}
            placeholder="Company name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
          <button className="export-btn" onClick={saveCo} style={{ padding: '4px 10px', height: '30px', fontSize: '11px' }}>Save</button>
        </div>
        <div className="rp-label">🏢 Saved Companies</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '6px' }}>
          <span style={{ fontSize: '9px', background: 'rgba(0,0,0,0.05)', color: '#000', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>Acme Corp</span>
          <span style={{ fontSize: '9px', background: 'rgba(0,0,0,0.05)', color: '#000', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>Global Tech</span>
        </div>
      </div>

      {/* CURRENT SHIFT */}
      <div className="rp-block">
        <div className="rp-label">🕐 Current Shift</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '6px 0 4px' }}>
          <span style={{ fontSize: '1.5rem' }}>{shiftData.icon}</span>
          <div>
            <div style={{ fontWeight: '800', fontSize: '11px', color: '#000' }}>{shiftData.name}</div>
            <div style={{ fontSize: '9px', opacity: 0.7, color: '#333' }}>{shiftData.time}</div>
          </div>
        </div>
        <div style={{ fontSize: '10px', color: '#000' }}>👷 Staff: <strong style={{ color: '#000' }}>{shiftData.staff}</strong></div>
      </div>

      {/* SITE CONDITIONS */}
      <div className="rp-block">
        <div className="rp-label">🌡️ Site Conditions</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginTop: '6px' }}>
          <div style={{ background: 'rgba(0,0,0,0.04)', padding: '5px', borderRadius: '4px', textAlign: 'center', fontSize: '9px', color: '#000' }}>
            <strong style={{ display: 'block', fontSize: '11px', color: '#000' }}>31°C</strong>Temp
          </div>
          <div style={{ background: 'rgba(0,0,0,0.04)', padding: '5px', borderRadius: '4px', textAlign: 'center', fontSize: '9px', color: '#000' }}>
            <strong style={{ display: 'block', fontSize: '11px', color: '#000' }}>12km/h</strong>Wind
          </div>
          <div style={{ background: 'rgba(0,0,0,0.04)', padding: '5px', borderRadius: '4px', textAlign: 'center', fontSize: '9px', color: '#000' }}>
            <strong style={{ display: 'block', fontSize: '11px', color: '#000' }}>65%</strong>Humid.
          </div>
          <div style={{ background: 'rgba(0,0,0,0.04)', padding: '5px', borderRadius: '4px', textAlign: 'center', fontSize: '9px', color: '#000' }}>
            <strong style={{ display: 'block', fontSize: '11px', color: '#000' }}>Clear</strong>Sky
          </div>
        </div>
      </div>

      {/* ACTIVE PERMITS */}
      <div className="rp-block">
        <div className="rp-label">📝 Active Permits</div>
        <div style={{ marginTop: '6px', fontSize: '10px', color: '#000' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}><span>🔥 Hot Work</span><strong>2</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}><span>🕳️ Confined Space</span><strong>1</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}><span>🪜 Height Work</span><strong>1</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '3px', marginTop: '3px' }}>
            <strong style={{ color: '#000' }}>Total Active</strong><strong style={{ color: '#000' }}>4</strong>
          </div>
        </div>
      </div>

      {/* NEXT DRILL */}
      <div className="rp-block" style={{ background: drillTime.includes('🚨') ? 'rgba(220,53,69,0.08)' : 'rgba(0,0,0,0.02)' }}>
        <div className="rp-label">⏱️ Next Drill</div>
        <div style={{ fontSize: '9px', opacity: 0.6, marginTop: '2px', color: '#333' }}>15 May 2026 · 09:00 — Evacuation</div>
        <div style={{ fontSize: '16px', fontWeight: '900', color: '#000', marginTop: '4px', fontFamily: 'monospace' }}>{drillTime}</div>
      </div>

      {/* SHIFT HANDOVER */}
      <div className="rp-block" style={{ border: 'none' }}>
        <div className="rp-label">💬 Shift Handover</div>
        <textarea
          style={{ width: '100%', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '6px', color: '#000', padding: '6px', fontSize: '10px', marginTop: '6px', minHeight: '50px', resize: 'vertical' }}
          placeholder="Notes for next shift..."
          value={handoverNotes}
          onChange={(e) => setHandoverNotes(e.target.value)}
        />
        <div style={{ fontSize: '9px', opacity: 0.4, marginTop: '3px', color: '#333' }}>✔ Auto-saved locally</div>
      </div>
    </div>
  );
};

export default RightPanel;

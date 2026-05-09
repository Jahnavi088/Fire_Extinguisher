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
        <div className="rp-label" title="Health Calculation: ((Total Assets - (Expired + Needs Service + Due Inspection)) / Total Assets) * 100">
          📊 Readiness Score <span style={{ fontSize: '10px', opacity: 0.6, cursor: 'help' }}>ⓘ</span>
        </div>
        <div className="gauge-wrap">
          <svg width="100" height="58" viewBox="0 0 112 64" fill="none" role="img" aria-label="94% readiness gauge">
            <path d="M10 58 A46 46 0 0 1 102 58" stroke="rgba(255,255,255,0.1)" strokeWidth="10" strokeLinecap="round" fill="none" />
            <path d="M10 58 A46 46 0 0 1 102 58" stroke="var(--header-accent)" strokeWidth="10" strokeLinecap="round" fill="none" strokeDasharray="144.5" strokeDashoffset="8.7" />
            <text className="gauge-text" x="56" y="55" textAnchor="middle" style={{ fill: 'var(--text)', fontWeight: '900', fontSize: '20px' }}>94%</text>
          </svg>
          <div className="gauge-sub" style={{ color: 'var(--text3)', fontSize: '9px' }}>Current system health</div>
        </div>
      </div>

      {/* STATUS COUNTS */}
      <div className="rp-block">
        <div className="st-row" style={{ color: 'var(--text)', fontSize: '10px' }}><span className="st-dot" style={{ background: 'var(--green)' }}></span><span className="st-name">Healthy</span><span className="st-num">21</span></div>
        <div className="st-row" style={{ color: 'var(--text)', fontSize: '10px' }}><span className="st-dot" style={{ background: 'var(--amber)' }}></span><span className="st-name">Warning</span><span className="st-num">2</span></div>
        <div className="st-row" style={{ color: 'var(--text)', fontSize: '10px' }}><span className="st-dot" style={{ background: 'var(--red)' }}></span><span className="st-name">Critical</span><span className="st-num">1</span></div>
      </div>

      {/* CURRENT SHIFT */}
      <div className="rp-block">
        <div className="rp-label">🕐 Current Shift</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '6px 0 4px' }}>
          <span style={{ fontSize: '1.5rem' }}>{shiftData.icon}</span>
          <div>
            <div style={{ fontWeight: '800', fontSize: '11px', color: 'var(--text)' }}>{shiftData.name}</div>
            <div style={{ fontSize: '9px', opacity: 0.7, color: 'var(--text2)' }}>{shiftData.time}</div>
          </div>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text)' }}>👷 Staff: <strong style={{ color: 'var(--text)' }}>{shiftData.staff}</strong></div>
      </div>

      {/* ACTIVE PERMITS */}
      <div className="rp-block">
        <div className="rp-label">📝 Active Permits</div>
        <div style={{ marginTop: '6px', fontSize: '10px', color: 'var(--text)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}><span>🔥 Hot Work</span><strong>2</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}><span>🕳️ Confined Space</span><strong>1</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}><span>🪜 Height Work</span><strong>1</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '3px', marginTop: '3px' }}>
            <strong style={{ color: 'var(--text)' }}>Total Active</strong><strong style={{ color: 'var(--text)' }}>4</strong>
          </div>
        </div>
      </div>

      {/* NEXT DRILL */}
      <div className="rp-block" style={{ background: drillTime.includes('🚨') ? 'var(--red-bg)' : 'rgba(255,255,255,0.02)' }}>
        <div className="rp-label">⏱️ Next Drill</div>
        <div style={{ fontSize: '9px', opacity: 0.6, marginTop: '2px', color: 'var(--text2)' }}>15 May 2026 · 09:00 — Evacuation</div>
        <div style={{ fontSize: '16px', fontWeight: '900', color: 'var(--text)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>{drillTime}</div>
      </div>

    </div>
  );
};

export default RightPanel;

import React from 'react';

const RightPanel = ({
  panelVisible,
  setPanelVisible,
  currentTime,
  preparednessScore = 0,
  statusCounts = { healthy: 0, warning: 0, critical: 0 }
}) => {
  const dashOffset = 144.5 * (1 - preparednessScore / 100);
  const statusTxt = preparednessScore >= 80 ? 'System Healthy' : preparednessScore >= 50 ? 'System Warning' : 'System Critical';

  return (
    <div className={`right-panel ${panelVisible ? 'visible' : 'hidden'}`}>
      <div className="rp-header">
        <div className="rp-header-info">
          <div className="rp-header-title">Health Panel</div>
          <div className="rp-header-time">{currentTime}</div>
        </div>
        <button className="rp-close-btn" onClick={() => setPanelVisible(false)} title="Close panel">×</button>
      </div>

      <div className="rp-scroll">
        {/* GAUGE */}
        <div className="rp-card">
          <div className="rp-card-label" title="Health Calculation: ((Total Assets - (Expired + Needs Service + Due Inspection)) / Total Assets) * 100">
            📊 Readiness Score <span style={{ fontSize: '10px', opacity: 0.6, cursor: 'help' }}>ⓘ</span>
          </div>
          <div className="gauge-container">
            <svg width="100" height="58" viewBox="0 0 112 64" fill="none" role="img" aria-label={`${preparednessScore}% readiness gauge`}>
              <path d="M10 58 A46 46 0 0 1 102 58" stroke="rgba(255,255,255,0.1)" strokeWidth="10" strokeLinecap="round" fill="none" />
              <path d="M10 58 A46 46 0 0 1 102 58" stroke="var(--header-accent)" strokeWidth="10" strokeLinecap="round" fill="none" strokeDasharray="144.5" strokeDashoffset={dashOffset} />
              <text className="gauge-value" x="56" y="55" textAnchor="middle" style={{ fill: '#ffffff', fontWeight: '900', fontSize: '20px' }}>{preparednessScore}%</text>
            </svg>
            <div className="gauge-status">{statusTxt}</div>
          </div>
        </div>

        {/* STATUS COUNTS */}
        <div className="rp-card condensed">
          <div className="status-row healthy">
            <span className="status-dot"></span>
            <span className="status-name">Healthy</span>
            <span className="status-count">{statusCounts.healthy}</span>
          </div>
          <div className="status-row warning">
            <span className="status-dot"></span>
            <span className="status-name">Warning</span>
            <span className="status-count">{statusCounts.warning}</span>
          </div>
          <div className="status-row critical">
            <span className="status-dot"></span>
            <span className="status-name">Critical</span>
            <span className="status-count">{statusCounts.critical}</span>
          </div>
        </div>

        {/* ACTIVE PERMITS */}
        <div className="rp-card">
          <div className="rp-card-label">📝 Active Permits</div>
          <div className="permit-item"><span>🔥 Hot Work</span><strong>2</strong></div>
          <div className="permit-item"><span>🕳️ Confined Space</span><strong>1</strong></div>
          <div className="permit-item"><span>🪜 Height Work</span><strong>1</strong></div>
          <div className="permit-total">
            <span>Total Active</span><span>4</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightPanel;

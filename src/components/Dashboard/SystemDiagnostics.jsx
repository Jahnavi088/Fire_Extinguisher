import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/apiService';
import './SystemDiagnostics.css';

const SystemDiagnostics = ({ onBack, modules = [] }) => {
  const [results, setResults] = useState([]);
  const [testing, setTesting] = useState(false);

  const runAudit = async () => {
    if (!modules.length) return;
    setTesting(true);
    setResults([]);
    
    const auditResults = [];

    for (const mod of modules) {
      const start = performance.now();
      try {
        const res = await ApiService.getModuleSummary(mod.module_id);
        const end = performance.now();
        auditResults.push({
          id: mod.module_id,
          name: mod.name,
          status: 'Online',
          latency: Math.round(end - start) + 'ms',
          data: res,
          healthy: true
        });
      } catch (err) {
        auditResults.push({
          id: mod.module_id,
          name: mod.name,
          status: 'Offline',
          error: 'Connection Timeout',
          healthy: false
        });
      }
      setResults([...auditResults]);
    }
    setTesting(false);
  };

  useEffect(() => {
    runAudit();
  }, []);

  return (
    <div className="diag-page">
      <div className="diag-header">
        <button className="diag-back" onClick={onBack}>← Back</button>
        <div className="diag-title">System Connectivity Audit</div>
        <button className="diag-run" onClick={runAudit} disabled={testing}>
          {testing ? 'Scanning...' : 'Run New Scan'}
        </button>
      </div>

      <div className="diag-scroll-container">
        <div className="diag-grid">
          {results.map(res => (
            <div key={res.id} className={`diag-card ${res.healthy ? 'pass' : 'fail'}`}>
              <div className="diag-card-head">
                <span className="diag-mod-name">{res.name}</span>
                <span className="diag-badge">{res.status}</span>
              </div>
              {res.healthy ? (
                <div className="diag-card-body">
                  <div className="diag-stat"><span>{res.data.total_units ?? res.data.total ?? 0}</span> records</div>
                  <div className="diag-stat"><span>{res.latency}</span></div>
                </div>
              ) : (
                <div className="diag-card-error">
                  {res.error}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemDiagnostics;

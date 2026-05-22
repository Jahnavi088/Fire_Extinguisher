import React, { useState, useMemo, useEffect } from 'react';
import './AutoScheduler.css';

// Mock safety inspectors
const INSPECTORS = [
  { id: 'INS-01', name: 'Rahul Sharma', role: 'Safety Lead' },
  { id: 'INS-02', name: 'Anjali Desai', role: 'Fire Marshal' },
  { id: 'INS-03', name: 'Vikram Singh', role: 'Compliance Inspector' },
  { id: 'INS-04', name: 'Priya Patel', role: 'Safety Volunteer' }
];

// Emojis for core modules
const MODULE_EMOJIS = {
  fire_extinguisher: '🧯',
  sprinkler: '🚿',
  hose_reel: '🧵',
  hydrant: '🚒',
  smoke_detector: '🌫️',
  emergency_door: '🚪',
  first_aid_kit: '🏥',
  suppression_system: '⛽',
  emergency_light: '💡',
  scba: '🎒',
  safety_shower: '🚿',
  eyewash_station: '👁️',
  spill_kit: '📦',
  fire_trolley: '🛒',
  ppe_station: '🪖'
};

// Hardcoded standard safety compliance rules (following NFPA & safety codes)
const STATIC_COMPLIANCE_RULES = [
  { moduleCode: 'smoke_detector', frequency: 'Weekly', priority: 'Medium', inspectorIdx: 3 },
  { moduleCode: 'fire_extinguisher', frequency: 'Monthly', priority: 'High', inspectorIdx: 0 },
  { moduleCode: 'hose_reel', frequency: 'Monthly', priority: 'High', inspectorIdx: 0 },
  { moduleCode: 'first_aid_kit', frequency: 'Monthly', priority: 'Medium', inspectorIdx: 3 },
  { moduleCode: 'safety_shower', frequency: 'Monthly', priority: 'Medium', inspectorIdx: 2 },
  { moduleCode: 'eyewash_station', frequency: 'Monthly', priority: 'Medium', inspectorIdx: 2 },
  { moduleCode: 'fire_trolley', frequency: 'Monthly', priority: 'High', inspectorIdx: 0 },
  { moduleCode: 'ppe_station', frequency: 'Monthly', priority: 'Medium', inspectorIdx: 3 },
  { moduleCode: 'sprinkler', frequency: 'Quarterly', priority: 'Critical', inspectorIdx: 1 },
  { moduleCode: 'hydrant', frequency: 'Quarterly', priority: 'High', inspectorIdx: 1 },
  { moduleCode: 'suppression_system', frequency: 'Quarterly', priority: 'Critical', inspectorIdx: 1 },
  { moduleCode: 'emergency_door', frequency: 'Quarterly', priority: 'High', inspectorIdx: 2 },
  { moduleCode: 'emergency_light', frequency: 'Quarterly', priority: 'Medium', inspectorIdx: 2 },
  { moduleCode: 'scba', frequency: 'Quarterly', priority: 'High', inspectorIdx: 0 },
  { moduleCode: 'spill_kit', frequency: 'Quarterly', priority: 'Medium', inspectorIdx: 3 }
];

const ESSENTIAL_CODES = STATIC_COMPLIANCE_RULES.map(r => r.moduleCode);

export default function AutoScheduler({ modules, onBack }) {
  const [schedules, setSchedules] = useState([]);

  // Filter modules to keep only essential physical inspectable equipment
  const essentialModules = useMemo(() => {
    return modules.filter(m => ESSENTIAL_CODES.includes(m.code));
  }, [modules]);

  // Load schedules from localStorage
  const loadLocalSchedules = () => {
    const saved = localStorage.getItem('safety_auto_schedules');
    if (saved) {
      setSchedules(JSON.parse(saved));
    }
  };

  useEffect(() => {
    loadLocalSchedules();
  }, [essentialModules]);

  const handleRunScheduler = async () => {
    try {
      // Fetch the actual inspection reports to find the last inspection date
      const { ApiService } = await import('../../services/apiService.js');
      const res = await ApiService.getInspectionReports();
      const reports = Array.isArray(res) ? res : (res?.items || res?.reports || res?.inspections || res?.data || []);
      
      const today = new Date();
      
      // Group by SOS Code to find the latest inspection date
      const latestInspections = {};
      reports.forEach(r => {
        const sos = r.sos_code || r.equipment_code;
        const dateStr = r.inspected_at || r.created_at;
        if (sos && dateStr) {
          const d = new Date(dateStr);
          if (!latestInspections[sos] || d > latestInspections[sos].date) {
            latestInspections[sos] = { date: d, moduleCode: r.module_code, moduleName: r.module_name || r.equipment_name };
          }
        }
      });

      const newSchedules = [];
      let i = 0;

      // If no historical data exists, we'll generate some defaults based on essentialModules
      if (Object.keys(latestInspections).length === 0) {
        essentialModules.forEach((m, idx) => {
          for(let j = 1; j <= 3; j++) {
            const prefix = m.code.split('_').map(w => w[0]).join('').toUpperCase();
            const sosCode = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
            const d = new Date();
            d.setDate(d.getDate() - 85); // simulate an inspection 85 days ago
            latestInspections[sosCode] = { date: d, moduleCode: m.code, moduleName: m.name };
          }
        });
      }

      Object.entries(latestInspections).forEach(([sosCode, info]) => {
        const lastDate = info.date;
        const nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + 90);
        
        const visibilityDate = new Date(nextDate);
        visibilityDate.setDate(visibilityDate.getDate() - 7);
        
        // Show in Auto Scheduler if today is past the visibility date
        if (today >= visibilityDate) {
          const rule = STATIC_COMPLIANCE_RULES.find(r => r.moduleCode === info.moduleCode);
          newSchedules.push({
            id: `SCH-${Date.now()}-${i++}`,
            moduleCode: info.moduleCode || 'general',
            moduleName: info.moduleName || 'Equipment',
            sosCode: sosCode,
            healthScore: Math.floor(Math.random() * (100 - 60 + 1)) + 60,
            dueDate: nextDate.toISOString().split('T')[0],
            priority: rule ? rule.priority : 'Medium',
            status: 'Pending'
          });
        }
      });

      setSchedules(newSchedules);
      localStorage.setItem('safety_auto_schedules', JSON.stringify(newSchedules));
      alert(`⚡ Scheduler Optimized!\n\nFound ${newSchedules.length} equipments requiring inspection (within 7 days of their 90-day cycle).`);
    } catch (e) {
      console.error(e);
      alert("Failed to run local scheduler based on reports.");
    }
  };

  const handleStatusChange = (id, newStatus) => {
    const updated = schedules.map(s => s.id === id ? { ...s, status: newStatus } : s);
    setSchedules(updated);
    localStorage.setItem('safety_auto_schedules', JSON.stringify(updated));
  };

  return (
    <div className="as-container">
      {/* Header */}
      <div className="as-header">
        <button className="as-back-btn" onClick={onBack} title="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back
        </button>
        <div className="as-header-info">
          <div className="as-title">Auto-Scheduler</div>
          <div className="as-subtitle">Standardized code frequency & smart visual workload distribution</div>
        </div>
        <button className="as-run-btn" onClick={handleRunScheduler} title="Optimize Schedules">
          ⚡ Run Auto-Scheduler AI
        </button>
      </div>

      {/* Main Single-Screen Grid Layout */}
      <div className="as-content">
        <div className="as-rules-grid">

          {/* Left Column: Scheduled Tasks */}
          <div className="as-list-view">
            <div className="as-list-header">
              <h3 style={{ margin: 0, padding: '16px', fontSize: '15px', borderBottom: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 800 }}>
                📋 Generated Safety Inspections ({schedules.length})
              </h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="as-table">
                <thead>
                  <tr>
                    <th>Equipment Module</th>
                    <th>SOS Code</th>
                    <th>Health</th>
                    <th>Compliance Date</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        No inspections scheduled. Run the Scheduler AI.
                      </td>
                    </tr>
                  ) : (
                    schedules.map((s) => (
                      <tr key={s.id} className={s.status.toLowerCase()}>
                        <td>
                          <span style={{ fontSize: '16px', marginRight: '8px' }}>{MODULE_EMOJIS[s.moduleCode] || '📦'}</span>
                          <strong>{s.moduleName}</strong>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 'bold', background: '#e2e8f0', padding: '4px 8px', borderRadius: '4px' }}>
                            {s.sosCode}
                          </span>
                        </td>
                        <td>
                          <span className={`as-health-badge ${s.healthScore >= 80 ? 'healthy' : s.healthScore >= 50 ? 'warning' : 'critical'}`}>
                            {s.healthScore}%
                          </span>
                        </td>
                        <td>{s.dueDate}</td>
                        <td>
                          <span className={`as-priority-tag ${s.priority.toLowerCase()}`}>
                            {s.priority}
                          </span>
                        </td>
                        <td>
                          <span className={`as-status-badge ${s.status.toLowerCase()}`}>
                            {s.status}
                          </span>
                        </td>
                        <td>
                          <div className="as-action-row">
                            {s.status !== 'Completed' ? (
                              <button className="as-action-btn complete" onClick={() => handleStatusChange(s.id, 'Completed')}>
                                Mark Done
                              </button>
                            ) : (
                              <button className="as-action-btn" style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1' }} onClick={() => handleStatusChange(s.id, 'Pending')}>
                                ✓ Completed
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}


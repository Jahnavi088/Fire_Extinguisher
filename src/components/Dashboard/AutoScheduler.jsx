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

  // Load or generate schedules based on static rules
  useEffect(() => {
    const savedSchedules = localStorage.getItem('safety_auto_schedules');

    if (savedSchedules) {
      const filteredSchedules = JSON.parse(savedSchedules).filter(s => ESSENTIAL_CODES.includes(s.moduleCode));
      setSchedules(filteredSchedules);
    } else {
      generateDefaultSchedule();
    }
  }, [essentialModules]);

  const generateDefaultSchedule = () => {
    const initialList = [];
    const today = new Date();

    essentialModules.forEach((mod, idx) => {
      const rule = STATIC_COMPLIANCE_RULES.find(r => r.moduleCode === mod.code);
      const inspector = rule ? INSPECTORS[rule.inspectorIdx] : INSPECTORS[idx % INSPECTORS.length];

      // Schedule offset helper based on health status (Critical assets first!)
      const offsetDays = mod.health_score < 50 ? 2 : mod.health_score < 80 ? 7 : 14 + (idx * 2);
      const dueDate = new Date();
      dueDate.setDate(today.getDate() + offsetDays);

      initialList.push({
        id: `SCH-${mod.code}-${idx}`,
        moduleCode: mod.code,
        moduleName: mod.name,
        healthScore: mod.health_score,
        dueDate: dueDate.toISOString().split('T')[0],
        inspectorId: inspector.id,
        inspectorName: inspector.name,
        priority: mod.health_score < 50 ? 'Critical' : mod.health_score < 80 ? 'High' : (rule?.priority || 'Medium'),
        status: mod.health_score < 50 ? 'Overdue' : 'Scheduled'
      });
    });

    setSchedules(initialList);
    localStorage.setItem('safety_auto_schedules', JSON.stringify(initialList));
  };

  const handleRunScheduler = () => {
    const today = new Date();
    const newSchedules = [];

    essentialModules.forEach((mod, idx) => {
      const rule = STATIC_COMPLIANCE_RULES.find(r => r.moduleCode === mod.code);
      const inspector = rule ? INSPECTORS[rule.inspectorIdx] : INSPECTORS[idx % INSPECTORS.length];

      let intervalDays = 30; // standard monthly
      if (rule) {
        if (rule.frequency === 'Weekly') intervalDays = 7;
        if (rule.frequency === 'Quarterly') intervalDays = 90;
      }

      let finalPriority = rule ? rule.priority : 'Medium';
      let daysOffset = intervalDays;

      // Smart health-based overrides
      if (mod.health_score < 50) {
        daysOffset = 2;
        finalPriority = 'Critical';
      } else if (mod.health_score < 80) {
        daysOffset = Math.min(daysOffset, 7);
        finalPriority = 'High';
      }

      const scheduledDate = new Date();
      scheduledDate.setDate(today.getDate() + daysOffset);

      newSchedules.push({
        id: `SCH-${mod.code}-${Date.now()}-${idx}`,
        moduleCode: mod.code,
        moduleName: mod.name,
        healthScore: mod.health_score,
        dueDate: scheduledDate.toISOString().split('T')[0],
        inspectorId: inspector.id,
        inspectorName: inspector.name,
        priority: finalPriority,
        status: mod.health_score < 50 ? 'Overdue' : 'Scheduled'
      });
    });

    setSchedules(newSchedules);
    localStorage.setItem('safety_auto_schedules', JSON.stringify(newSchedules));
    alert(`⚡ AI Scheduler Optimized!\n\nRecalculated compliance dates for all ${essentialModules.length} physical equipment units based on core health scores.`);
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
                    <th>Health</th>
                    <th>Compliance Date</th>
                    <th>Assigned Inspector</th>
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
                          <span className={`as-health-badge ${s.healthScore >= 80 ? 'healthy' : s.healthScore >= 50 ? 'warning' : 'critical'}`}>
                            {s.healthScore}%
                          </span>
                        </td>
                        <td>{s.dueDate}</td>
                        <td>{s.inspectorName}</td>
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
                            {s.status !== 'Completed' && (
                              <>
                                <button className="as-action-btn complete" onClick={() => handleStatusChange(s.id, 'Completed')}>
                                  Mark Done
                                </button>
                                {s.status !== 'In Progress' && (
                                  <button className="as-action-btn start" onClick={() => handleStatusChange(s.id, 'In Progress')}>
                                    Inspect
                                  </button>
                                )}
                              </>
                            )}
                            {s.status === 'Completed' && (
                              <span style={{ color: '#22c55e', fontWeight: 700, fontSize: '12px' }}>✓ Logged</span>
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


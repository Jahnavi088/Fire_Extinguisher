import React, { useState, useMemo, useEffect } from 'react';
import './AutoScheduler.css';

const INSPECTORS = [
  { id: 'INS-01', name: 'Rahul Sharma', role: 'Safety Lead', shift: 'G', primaryBuilding: 'Block A' },
  { id: 'INS-02', name: 'Anjali Desai', role: 'Fire Marshal', shift: 'A', primaryBuilding: 'Block B' },
  { id: 'INS-03', name: 'Vikram Singh', role: 'Compliance Inspector', shift: 'B', primaryBuilding: 'Utility' },
  { id: 'INS-04', name: 'Priya Patel', role: 'Safety Volunteer', shift: 'C', primaryBuilding: 'Block C' }
];

const BUILDINGS = ['Block A', 'Block B', 'Block C', 'Utility', 'Lab Wing'];
const ZONES = ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4'];
const SHIFTS = ['G', 'A', 'B', 'C'];

const MODULE_EMOJIS = {
  fire_extinguisher: '🧯', sprinkler: '🚿', hose_reel: '🧵',
  hydrant: '🚒', smoke_detector: '🌫️', emergency_door: '🚪',
  first_aid_kit: '🏥', suppression_system: '⛽', emergency_light: '💡',
  scba: '🎒', safety_shower: '🚿', eyewash_station: '👁️',
  spill_kit: '📦', fire_trolley: '🛒', ppe_station: '🪖'
};

const MODULE_TYPES = {
  fire_extinguisher: 'Fire Suppression', sprinkler: 'Fire Suppression',
  hose_reel: 'Fire Suppression', hydrant: 'Fire Suppression',
  smoke_detector: 'Detection', emergency_door: 'Egress',
  first_aid_kit: 'Medical', suppression_system: 'Fire Suppression',
  emergency_light: 'Emergency', scba: 'Respiratory',
  safety_shower: 'Safety', eyewash_station: 'Safety',
  spill_kit: 'Spill Control', fire_trolley: 'Fire Suppression', ppe_station: 'Safety'
};

const FAILURE_REASONS = {
  fire_extinguisher: 'Low pressure', sprinkler: 'Valve failure',
  hose_reel: 'Hose damage', hydrant: 'Water flow issue',
  smoke_detector: 'Sensor fault', emergency_door: 'Door not closing',
  first_aid_kit: 'Supplies depleted', suppression_system: 'Agent level low',
  emergency_light: 'Battery failure', scba: 'Low pressure',
  safety_shower: 'Flow insufficient', eyewash_station: 'Blocked nozzle',
  spill_kit: 'Kit incomplete', fire_trolley: 'Wheel damage', ppe_station: 'Equipment missing'
};

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
const STATUS_PATTERNS = [
  'Pending', 'Pending', 'In Progress', 'Completed', 'Completed',
  'Completed', 'Pending', 'In Progress', 'Overdue', 'Failed',
  'Pending', 'Completed', 'Pending', 'In Progress', 'Completed'
];

function getDaysOverdue(dueDate) {
  const diff = Math.floor((new Date() - new Date(dueDate)) / 86400000);
  return diff > 0 ? diff : 0;
}

const LS_KEY = 'safety_auto_schedules_v2';

export default function AutoScheduler({ modules, onBack }) {
  const [schedules, setSchedules] = useState([]);
  const [activeTab, setActiveTab] = useState('today');
  const [selectedTask, setSelectedTask] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [filters, setFilters] = useState({
    shift: '', building: '', zone: '', equipmentType: '', operator: '', status: '', search: ''
  });

  const essentialModules = useMemo(
    () => modules.filter(m => ESSENTIAL_CODES.includes(m.code)),
    [modules]
  );

  const loadLocalSchedules = () => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) setSchedules(JSON.parse(saved));
  };

  useEffect(() => { loadLocalSchedules(); }, [essentialModules]);

  const saveSchedules = (data) => {
    setSchedules(data);
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  };

  const handleRunScheduler = async () => {
    setIsRunning(true);
    try {
      const { ApiService } = await import('../../services/apiService.js');
      const res = await ApiService.getInspectionReports();
      const reports = Array.isArray(res) ? res : (res?.items || res?.reports || res?.inspections || res?.data || []);

      const today = new Date();
      const latestInspections = {};

      reports.forEach(r => {
        const sos = r.sos_code || r.equipment_code;
        const dateStr = r.inspected_at || r.created_at;
        if (sos && dateStr) {
          const d = new Date(dateStr);
          if (!latestInspections[sos] || d > latestInspections[sos].date)
            latestInspections[sos] = { date: d, moduleCode: r.module_code, moduleName: r.module_name || r.equipment_name };
        }
      });

      if (Object.keys(latestInspections).length === 0) {
        essentialModules.forEach(m => {
          for (let j = 1; j <= 3; j++) {
            const prefix = m.code.split('_').map(w => w[0]).join('').toUpperCase();
            const sosCode = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
            const d = new Date();
            d.setDate(d.getDate() - (75 + Math.floor(Math.random() * 30)));
            latestInspections[sosCode] = { date: d, moduleCode: m.code, moduleName: m.name };
          }
        });
      }

      const newSchedules = [];
      let i = 0;

      Object.entries(latestInspections).forEach(([sosCode, info]) => {
        const nextDate = new Date(info.date);
        nextDate.setDate(nextDate.getDate() + 90);

        const visDate = new Date(nextDate);
        visDate.setDate(visDate.getDate() - 7);

        if (today >= visDate) {
          const rule = STATIC_COMPLIANCE_RULES.find(r => r.moduleCode === info.moduleCode);
          const inspector = INSPECTORS[rule ? rule.inspectorIdx : i % INSPECTORS.length];
          const building = BUILDINGS[i % BUILDINGS.length];
          const zone = ZONES[i % ZONES.length];
          const shift = SHIFTS[i % SHIFTS.length];
          const status = STATUS_PATTERNS[i % STATUS_PATTERNS.length];

          const dueDate = status === 'Overdue'
            ? new Date(today.getTime() - (2 + (i % 5)) * 86400000).toISOString().split('T')[0]
            : nextDate.toISOString().split('T')[0];

          newSchedules.push({
            id: `SCH-${Date.now()}-${i}`,
            taskId: `T-${1001 + i}`,
            moduleCode: info.moduleCode || 'general',
            moduleName: info.moduleName || 'Equipment',
            equipmentType: MODULE_TYPES[info.moduleCode] || 'General',
            sosCode,
            building,
            zone,
            shift,
            assignedOperator: inspector.name,
            assignedOperatorId: inspector.id,
            inspectorRole: inspector.role,
            healthScore: Math.floor(Math.random() * 40) + 60,
            dueDate,
            dueTime: `${String(8 + (i % 8)).padStart(2, '0')}:00`,
            priority: rule ? rule.priority : 'Medium',
            frequency: rule ? rule.frequency : 'Monthly',
            status,
            failureReason: status === 'Failed' ? (FAILURE_REASONS[info.moduleCode] || 'Inspection failed') : null,
            whyAssigned: {
              shiftMatch: inspector.shift === shift,
              lowestWorkload: rule ? rule.inspectorIdx < 2 : i % 2 === 0,
              nearbyLocation: inspector.primaryBuilding === building
            }
          });
          i++;
        }
      });

      saveSchedules(newSchedules);
      alert(`⚡ Schedule Generated!\n\n${newSchedules.length} inspection tasks created.`);
    } catch (e) {
      console.error(e);
      alert('Failed to run scheduler. Please try again.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleStatusChange = (id, newStatus) => {
    const updated = schedules.map(s => s.id === id ? { ...s, status: newStatus } : s);
    saveSchedules(updated);
    if (selectedTask?.id === id) setSelectedTask(prev => ({ ...prev, status: newStatus }));
  };

  const handleExport = () => {
    const headers = ['Task ID', 'Equipment', 'Type', 'SOS Code', 'Building', 'Zone', 'Shift', 'Operator', 'Due Date', 'Due Time', 'Priority', 'Status'];
    const rows = schedules.map(s => [
      s.taskId, s.moduleName, s.equipmentType, s.sosCode,
      s.building, s.zone, s.shift, s.assignedOperator,
      s.dueDate, s.dueTime, s.priority, s.status
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedule_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── computed ─────────────────────────────────────────────────────────────

  const summary = useMemo(() => ({
    total: schedules.length,
    pending: schedules.filter(s => s.status === 'Pending').length,
    inProgress: schedules.filter(s => s.status === 'In Progress').length,
    completed: schedules.filter(s => s.status === 'Completed').length,
    overdue: schedules.filter(s => s.status === 'Overdue').length,
    failed: schedules.filter(s => s.status === 'Failed').length,
  }), [schedules]);

  const filteredSchedules = useMemo(() => {
    let r = schedules;
    if (filters.shift) r = r.filter(s => s.shift === filters.shift);
    if (filters.building) r = r.filter(s => s.building === filters.building);
    if (filters.zone) r = r.filter(s => s.zone === filters.zone);
    if (filters.equipmentType) r = r.filter(s => s.equipmentType === filters.equipmentType);
    if (filters.operator) r = r.filter(s => s.assignedOperator === filters.operator);
    if (filters.status) r = r.filter(s => s.status === filters.status);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      r = r.filter(s =>
        s.moduleName?.toLowerCase().includes(q) ||
        s.sosCode?.toLowerCase().includes(q) ||
        s.taskId?.toLowerCase().includes(q) ||
        s.assignedOperator?.toLowerCase().includes(q)
      );
    }
    return r;
  }, [schedules, filters]);

  const todayStr = new Date().toISOString().split('T')[0];

  const tabSchedules = useMemo(() => {
    switch (activeTab) {
      case 'overdue': return filteredSchedules.filter(s => s.status === 'Overdue');
      case 'completed': return filteredSchedules.filter(s => s.status === 'Completed');
      case 'failed': return filteredSchedules.filter(s => s.status === 'Failed');
      case 'upcoming': return filteredSchedules.filter(s => s.dueDate > todayStr && s.status === 'Pending');
      default: return filteredSchedules;
    }
  }, [filteredSchedules, activeTab, todayStr]);

  const workload = useMemo(() =>
    INSPECTORS.map(ins => {
      const tasks = schedules.filter(s => s.assignedOperator === ins.name);
      const completed = tasks.filter(s => s.status === 'Completed').length;
      return { ...ins, total: tasks.length, completed, pct: tasks.length ? Math.round((completed / tasks.length) * 100) : 0 };
    }).filter(w => w.total > 0),
    [schedules]
  );

  const locationDist = useMemo(() => {
    const counts = {};
    schedules.forEach(s => { if (s.building) counts[s.building] = (counts[s.building] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [schedules]);

  const overdueItems = useMemo(() => schedules.filter(s => s.status === 'Overdue').slice(0, 6), [schedules]);
  const failedItems = useMemo(() => schedules.filter(s => s.status === 'Failed').slice(0, 6), [schedules]);
  const uniqueTypes = useMemo(() => [...new Set(schedules.map(s => s.equipmentType).filter(Boolean))], [schedules]);

  const TABS = [
    { key: 'today', label: "Today's Tasks", count: filteredSchedules.length },
    { key: 'upcoming', label: 'Upcoming', count: filteredSchedules.filter(s => s.dueDate > todayStr && s.status === 'Pending').length },
    { key: 'overdue', label: 'Overdue', count: summary.overdue, accent: 'red' },
    { key: 'completed', label: 'Completed', count: summary.completed },
    { key: 'failed', label: 'Failed', count: summary.failed, accent: 'orange' },
  ];

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }));
  const clearFilters = () => setFilters({ shift: '', building: '', zone: '', equipmentType: '', operator: '', status: '', search: '' });
  const hasFilters = Object.values(filters).some(Boolean);

  const statusClass = (status) => `status-${(status || '').toLowerCase().replace(/\s+/g, '-')}`;

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="as-container">

      {/* ── Header ── */}
      <div className="as-header">
        <button className="as-back-btn" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back
        </button>
        <div className="as-header-info">
          <div className="as-title">Auto-Scheduler</div>
          <div className="as-subtitle">Inspection Control Center — smart workload distribution &amp; compliance tracking</div>
        </div>
        <div className="as-header-actions">
          <button className="as-btn-secondary" onClick={handleExport} disabled={schedules.length === 0}>
            ↓ Export CSV
          </button>
          <button className="as-btn-secondary" onClick={loadLocalSchedules}>
            ↻ Refresh
          </button>
          <button className="as-run-btn" onClick={handleRunScheduler} disabled={isRunning}>
            {isRunning ? '⏳ Running…' : '⚡ Generate Schedule'}
          </button>
        </div>
      </div>


      {/* ── Tabs ── */}
      <div className="as-tabs-bar">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`as-tab ${activeTab === tab.key ? 'active' : ''} ${tab.accent ? `tab-${tab.accent}` : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.count > 0 && <span className="as-tab-badge">{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* ── Scrollable Content ── */}
      <div className="as-content">

        {/* ── Filter Bar ── */}
        <div className="as-filter-bar">
          <select className="as-filter-select" value={filters.shift} onChange={e => setFilter('shift', e.target.value)}>
            <option value="">Shift ▼</option>
            {SHIFTS.map(s => <option key={s} value={s}>Shift {s}</option>)}
          </select>
          <select className="as-filter-select" value={filters.building} onChange={e => setFilter('building', e.target.value)}>
            <option value="">Building ▼</option>
            {BUILDINGS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select className="as-filter-select" value={filters.zone} onChange={e => setFilter('zone', e.target.value)}>
            <option value="">Zone ▼</option>
            {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
          <select className="as-filter-select" value={filters.equipmentType} onChange={e => setFilter('equipmentType', e.target.value)}>
            <option value="">Equipment Type ▼</option>
            {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="as-filter-select" value={filters.operator} onChange={e => setFilter('operator', e.target.value)}>
            <option value="">Operator ▼</option>
            {INSPECTORS.map(ins => <option key={ins.id} value={ins.name}>{ins.name}</option>)}
          </select>
          <select className="as-filter-select" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
            <option value="">Status ▼</option>
            {['Pending', 'In Progress', 'Completed', 'Overdue', 'Failed'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input
            className="as-filter-search"
            type="text"
            placeholder="Search task, equipment, SOS…"
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
          />
          {hasFilters && <button className="as-clear-filters" onClick={clearFilters}>Clear</button>}
        </div>

        {/* ── Task Table ── */}
        <div className="as-list-view">
          <div className="as-list-header">
            <span>Auto-Generated Inspection Tasks</span>
            <span className="as-list-count">{tabSchedules.length} tasks</span>
          </div>
          <div className="as-table-wrap">
            <table className="as-table">
              <thead>
                <tr>
                  <th>Task ID</th>
                  <th>Equipment</th>
                  <th>Type</th>
                  <th>Building / Zone</th>
                  <th>Shift</th>
                  <th>Operator</th>
                  <th>Due</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tabSchedules.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="as-empty-row">
                      {schedules.length === 0
                        ? 'No inspections yet. Click "Generate Schedule" to start.'
                        : 'No tasks match the current filters.'}
                    </td>
                  </tr>
                ) : (
                  tabSchedules.map(s => (
                    <tr key={s.id}>
                      <td><span className="as-task-id">{s.taskId}</span></td>
                      <td>
                        <div className="as-equip-cell">
                          <span className="as-equip-emoji">{MODULE_EMOJIS[s.moduleCode] || '📦'}</span>
                          <div>
                            <div className="as-equip-name">{s.moduleName}</div>
                            <div className="as-sos-code">{s.sosCode}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="as-type-tag">{s.equipmentType || '—'}</span></td>
                      <td>
                        <div className="as-loc-cell">
                          <span>{s.building || '—'}</span>
                          <span className="as-zone-tag">{s.zone || '—'}</span>
                        </div>
                      </td>
                      <td><span className="as-shift-badge">Shift {s.shift || '—'}</span></td>
                      <td>
                        <div className="as-operator-cell">
                          <div className="as-operator-avatar">{(s.assignedOperator || 'U')[0]}</div>
                          <span>{s.assignedOperator || '—'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="as-due-cell">
                          <div>{s.dueDate}</div>
                          <div className="as-due-time">{s.dueTime}</div>
                        </div>
                      </td>
                      <td>
                        <span className={`as-priority-tag ${(s.priority || '').toLowerCase()}`}>{s.priority}</span>
                      </td>
                      <td>
                        <span className={`as-status-badge ${statusClass(s.status)}`}>{s.status}</span>
                      </td>
                      <td>
                        <div className="as-action-row">
                          <button className="as-btn-view" onClick={() => setSelectedTask(s)}>View Details</button>
                          {s.status === 'Pending' && (
                            <button className="as-action-btn start" onClick={() => handleStatusChange(s.id, 'In Progress')}>Start</button>
                          )}
                          {s.status === 'In Progress' && (
                            <button className="as-action-btn complete" onClick={() => handleStatusChange(s.id, 'Completed')}>Done</button>
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

        {/* ── Bottom Panels ── */}
        {schedules.length > 0 && (
          <div className="as-bottom-panels">

            {/* Shift Workload */}
            <div className="as-panel">
              <div className="as-panel-title">Shift Workload</div>
              <table className="as-workload-table">
                <thead>
                  <tr><th>Operator</th><th>Shift</th><th>Tasks</th><th>Done</th><th>Progress</th></tr>
                </thead>
                <tbody>
                  {workload.map(w => (
                    <tr key={w.id}>
                      <td>
                        <div className="as-operator-cell">
                          <div className="as-operator-avatar">{w.name[0]}</div>
                          <div>
                            <div className="as-op-name">{w.name}</div>
                            <div className="as-op-role">{w.role}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="as-shift-badge">Shift {w.shift}</span></td>
                      <td className="as-num-cell">{w.total}</td>
                      <td className="as-num-cell as-done-num">{w.completed}</td>
                      <td>
                        <div className="as-workload-bar-wrap">
                          <div className="as-workload-bar">
                            <div
                              className="as-workload-fill"
                              style={{
                                width: `${w.pct}%`,
                                background: w.pct >= 80 ? '#22c55e' : w.pct >= 50 ? '#3b82f6' : '#f59e0b'
                              }}
                            />
                          </div>
                          <span className="as-workload-pct">{w.pct}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Location Distribution */}
            <div className="as-panel">
              <div className="as-panel-title">Location Distribution</div>
              <div className="as-location-list">
                {locationDist.map(([building, count]) => {
                  const max = locationDist[0]?.[1] || 1;
                  return (
                    <div key={building} className="as-location-row">
                      <span className="as-location-name">{building}</span>
                      <div className="as-workload-bar" style={{ flex: 1 }}>
                        <div className="as-workload-fill" style={{ width: `${Math.round((count / max) * 100)}%`, background: '#6366f1' }} />
                      </div>
                      <span className="as-location-count">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Alerts */}
            <div className="as-panel">
              <div className="as-panel-title as-title-red">Overdue Alerts</div>
              {overdueItems.length === 0 ? (
                <div className="as-no-alerts">No overdue inspections</div>
              ) : (
                <div className="as-alert-list">
                  {overdueItems.map(s => (
                    <div key={s.id} className="as-alert-row alert-overdue" onClick={() => setSelectedTask(s)}>
                      <span className="as-equip-emoji">{MODULE_EMOJIS[s.moduleCode] || '📦'}</span>
                      <div className="as-alert-info">
                        <div className="as-alert-name">{s.moduleName} — {s.sosCode}</div>
                        <div className="as-alert-sub">{s.building} · {s.assignedOperator}</div>
                      </div>
                      <span className="as-alert-delay">{getDaysOverdue(s.dueDate)}d overdue</span>
                    </div>
                  ))}
                </div>
              )}

              {failedItems.length > 0 && (
                <>
                  <div className="as-panel-title as-title-orange" style={{ marginTop: 16 }}>Failed Inspections</div>
                  <div className="as-alert-list">
                    {failedItems.map(s => (
                      <div key={s.id} className="as-alert-row alert-failed" onClick={() => setSelectedTask(s)}>
                        <span className="as-equip-emoji">{MODULE_EMOJIS[s.moduleCode] || '📦'}</span>
                        <div className="as-alert-info">
                          <div className="as-alert-name">{s.moduleName} — {s.sosCode}</div>
                          <div className="as-alert-sub">{s.failureReason || 'Inspection failed'}</div>
                        </div>
                        <span className="as-alert-delay failed-delay">{s.building}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

          </div>
        )}

      </div>{/* end as-content */}

      {/* ── Task Details Modal ── */}
      {selectedTask && (
        <div className="as-modal-overlay" onClick={() => setSelectedTask(null)}>
          <div className="as-modal" onClick={e => e.stopPropagation()}>

            <div className="as-modal-header">
              <div>
                <div className="as-modal-title">
                  {MODULE_EMOJIS[selectedTask.moduleCode] || '📦'} {selectedTask.moduleName}
                </div>
                <div className="as-modal-sub">{selectedTask.taskId} · {selectedTask.sosCode}</div>
              </div>
              <button className="as-modal-close" onClick={() => setSelectedTask(null)}>✕</button>
            </div>

            <div className="as-modal-body">

              {/* Equipment Info */}
              <div className="as-modal-section">
                <div className="as-modal-section-title">Equipment Info</div>
                <div className="as-modal-grid">
                  <div className="as-modal-field">
                    <span className="as-mf-label">Type</span>
                    <span>{selectedTask.equipmentType}</span>
                  </div>
                  <div className="as-modal-field">
                    <span className="as-mf-label">SOS Code</span>
                    <span className="as-sos-code">{selectedTask.sosCode}</span>
                  </div>
                  <div className="as-modal-field">
                    <span className="as-mf-label">Health</span>
                    <span className={`as-health-badge ${selectedTask.healthScore >= 80 ? 'healthy' : selectedTask.healthScore >= 50 ? 'warning' : 'critical'}`}>
                      {selectedTask.healthScore}%
                    </span>
                  </div>
                  <div className="as-modal-field">
                    <span className="as-mf-label">Priority</span>
                    <span className={`as-priority-tag ${(selectedTask.priority || '').toLowerCase()}`}>{selectedTask.priority}</span>
                  </div>
                </div>
              </div>

              {/* Schedule Info */}
              <div className="as-modal-section">
                <div className="as-modal-section-title">Schedule Info</div>
                <div className="as-modal-grid">
                  <div className="as-modal-field">
                    <span className="as-mf-label">Building</span><span>{selectedTask.building}</span>
                  </div>
                  <div className="as-modal-field">
                    <span className="as-mf-label">Zone</span><span>{selectedTask.zone}</span>
                  </div>
                  <div className="as-modal-field">
                    <span className="as-mf-label">Shift</span>
                    <span className="as-shift-badge">Shift {selectedTask.shift}</span>
                  </div>
                  <div className="as-modal-field">
                    <span className="as-mf-label">Frequency</span><span>{selectedTask.frequency}</span>
                  </div>
                  <div className="as-modal-field">
                    <span className="as-mf-label">Due Date</span>
                    <span style={{ fontWeight: 700 }}>{selectedTask.dueDate}</span>
                  </div>
                  <div className="as-modal-field">
                    <span className="as-mf-label">Due Time</span><span>{selectedTask.dueTime}</span>
                  </div>
                  <div className="as-modal-field">
                    <span className="as-mf-label">Status</span>
                    <span className={`as-status-badge ${statusClass(selectedTask.status)}`}>{selectedTask.status}</span>
                  </div>
                  {selectedTask.failureReason && (
                    <div className="as-modal-field">
                      <span className="as-mf-label">Failure Reason</span>
                      <span className="as-failure-text">{selectedTask.failureReason}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Assignment Info */}
              <div className="as-modal-section">
                <div className="as-modal-section-title">Assignment Info</div>
                <div className="as-operator-cell" style={{ marginBottom: 14 }}>
                  <div className="as-operator-avatar">{(selectedTask.assignedOperator || 'U')[0]}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{selectedTask.assignedOperator}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{selectedTask.inspectorRole}</div>
                  </div>
                </div>

                <div className="as-why-assigned">
                  <div className="as-why-title">Why Assigned?</div>
                  <table className="as-why-table">
                    <thead><tr><th>Rule</th><th>Result</th></tr></thead>
                    <tbody>
                      {[
                        ['Shift Match', selectedTask.whyAssigned?.shiftMatch],
                        ['Lowest Workload', selectedTask.whyAssigned?.lowestWorkload],
                        ['Nearby Location', selectedTask.whyAssigned?.nearbyLocation],
                      ].map(([rule, val]) => (
                        <tr key={rule}>
                          <td>{rule}</td>
                          <td><span className={`as-why-badge ${val ? 'yes' : 'no'}`}>{val ? '✓ Yes' : '✗ No'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="as-modal-actions">
                {selectedTask.status === 'Pending' && (
                  <button className="as-action-btn start" onClick={() => handleStatusChange(selectedTask.id, 'In Progress')}>
                    Mark In Progress
                  </button>
                )}
                {selectedTask.status === 'In Progress' && (<>
                  <button className="as-action-btn complete" onClick={() => handleStatusChange(selectedTask.id, 'Completed')}>
                    Mark Completed
                  </button>
                  <button className="as-action-btn fail" onClick={() => handleStatusChange(selectedTask.id, 'Failed')}>
                    Mark Failed
                  </button>
                </>)}
                {(selectedTask.status === 'Completed' || selectedTask.status === 'Failed') && (
                  <button className="as-action-btn start" onClick={() => handleStatusChange(selectedTask.id, 'Pending')}>
                    Reset to Pending
                  </button>
                )}
                <button className="as-btn-secondary" onClick={() => setSelectedTask(null)}>Close</button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

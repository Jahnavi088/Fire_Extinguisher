import { useState, useMemo, useEffect } from 'react';
import './AutoScheduler.css';

// ── Module-level constants ──────────────────────────────────────────────────

const INSPECTORS = [
  { id: 'INS-01', name: 'Rahul Sharma', role: 'Safety Lead', shift: 'G', primaryBuilding: 'Block A' },
  { id: 'INS-02', name: 'Anjali Desai', role: 'Fire Marshal', shift: 'A', primaryBuilding: 'Block B' },
  { id: 'INS-03', name: 'Vikram Singh', role: 'Compliance Inspector', shift: 'B', primaryBuilding: 'Utility' },
  { id: 'INS-04', name: 'Priya Patel', role: 'Safety Volunteer', shift: 'C', primaryBuilding: 'Block C' }
];

// Locations will be fetched dynamically

const INSPECTOR_COLORS = {
  'INS-01': 'linear-gradient(135deg, #2563eb, #7c3aed)',
  'INS-02': 'linear-gradient(135deg, #dc2626, #ea580c)',
  'INS-03': 'linear-gradient(135deg, #059669, #0d9488)',
  'INS-04': 'linear-gradient(135deg, #d97706, #b45309)',
};

const MODULE_EMOJIS = {
  fire_extinguisher: '🧯', sprinkler: '🚿', hose_reel: '🧵',
  hydrant: '🚒', smoke_detector: '🌫️', emergency_door: '🚪',
  first_aid_kit: '🏥', suppression_system: '⛽', emergency_light: '💡',
  scba: '🎒', safety_shower: '🚿', eyewash_station: '👁️',
  spill_kit: '📦', fire_trolley: '🛒', ppe_station: '🪖', sand_bucket: '🪣'
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
const PRIORITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };
const PRIORITY_EMOJI = { Critical: '🔴', High: '🟠', Medium: '🟡', Low: '⚪' };
const STATUS_EMOJI = { 'Assigned': '🟡', 'In Progress': '🔵', 'Completed': '🟢', 'Overdue': '🔴', 'Failed': '🟠', 'Unassigned': '⚠️' };


const LS_KEY = 'safety_auto_schedules_v2';
const LS_LAST_RUN = 'safety_scheduler_last_run';

// ── Pure helpers ────────────────────────────────────────────────────────────

function getDaysOverdue(dueDate) {
  const diff = Math.floor((new Date() - new Date(dueDate)) / 86400000);
  return diff > 0 ? diff : 0;
}

function formatDueDate(dateStr) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr); due.setHours(0, 0, 0, 0);
  const diff = Math.round((due - today) / 86400000);
  if (diff === 0) return { label: 'Today', cls: 'due-today', dot: 'dot-red' };
  if (diff === -1) return { label: 'Yesterday', cls: 'due-late', dot: 'dot-red' };
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, cls: 'due-late', dot: 'dot-red' };
  if (diff === 1) return { label: 'Tomorrow', cls: 'due-soon', dot: 'dot-orange' };
  if (diff === 2) return { label: `In ${diff}d`, cls: 'due-soon', dot: 'dot-orange' };
  if (diff <= 7) return { label: `In ${diff}d`, cls: 'due-soon', dot: 'dot-green' };
  return { label: dateStr, cls: 'due-future', dot: 'dot-gray' };
}

function formatLastRun(isoStr) {
  if (!isoStr) return null;
  const d = new Date(isoStr);
  const now = new Date();
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  if (d.toDateString() === now.toDateString()) return `Today, ${time}`;
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}, ${time}`;
}

// ── Component ───────────────────────────────────────────────────────────────

export default function AutoScheduler({ modules, onBack }) {
  const [schedules, setSchedules] = useState([]);
  const [activeTab, setActiveTab] = useState('scheduled');
  const [selectedTask, setSelectedTask] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'dueDate', dir: 'asc' });
  const [filters, setFilters] = useState({ company: '', branch: '', building: '', floor: '', zone: '', equipmentType: '', status: '', search: '' });
  const [currentPage, setCurrentPage] = useState(1);

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('auth_user') || '{}'); }
    catch { return {}; }
  }, []);
  const isSuperAdmin = user?.role === 'superadmin';

  // ── Location Filter States ──
  const [companiesList, setCompaniesList] = useState([]);
  const [branchesList, setBranchesList] = useState([]);
  const [buildingsList, setBuildingsList] = useState([]);
  const [floorsList, setFloorsList] = useState([]);
  const [zonesList, setZonesList] = useState([]);

  useEffect(() => {
    import('../../services/apiService.js').then(({ ApiService }) => {
      ApiService.getAdminCompanies().then(res => {
        setCompaniesList(Array.isArray(res) ? res : (res?.companies || res?.data || []));
      }).catch(console.error);
    });
  }, []);

  useEffect(() => {
    if (!isSuperAdmin) {
      import('../../services/apiService.js').then(({ ApiService }) => {
        ApiService.getBranches().then(res => {
          setBranchesList(Array.isArray(res) ? res : (res?.data || res?.items || []));
        }).catch(console.error);
      });
      return;
    }

    const sel = companiesList.find(c => (c.company_name || c.name) === filters.company);
    if (sel?.id) {
      import('../../services/apiService.js').then(({ ApiService }) => {
        ApiService.getBranches({ company_id: sel.id }).then(res => {
          setBranchesList(Array.isArray(res) ? res : (res?.data || res?.items || []));
        }).catch(console.error);
      });
    } else {
      setBranchesList([]);
    }
  }, [filters.company, companiesList, isSuperAdmin]);

  useEffect(() => {
    const sel = branchesList.find(b => (b.branch_name || b.name) === filters.branch);
    if (sel?.id) {
      import('../../services/apiService.js').then(({ ApiService }) => {
        ApiService.getBranchBuildings(sel.id).then(res => {
          setBuildingsList(Array.isArray(res) ? res : (res?.data || res?.items || []));
        }).catch(console.error);
      });
    } else {
      setBuildingsList([]);
    }
  }, [filters.branch, branchesList]);

  useEffect(() => {
    const sel = buildingsList.find(b => (b.building_name || b.name) === filters.building);
    if (sel?.id) {
      import('../../services/apiService.js').then(({ ApiService }) => {
        ApiService.getBuildingFloors(sel.id).then(res => {
          setFloorsList(Array.isArray(res) ? res : (res?.data || res?.items || []));
        }).catch(console.error);
      });
    } else {
      setFloorsList([]);
    }
  }, [filters.building, buildingsList]);

  useEffect(() => {
    const sel = floorsList.find(b => (b.floor_name || b.name) === filters.floor);
    if (sel?.id) {
      import('../../services/apiService.js').then(({ ApiService }) => {
        ApiService.getFloorZones(sel.id).then(res => {
          setZonesList(Array.isArray(res) ? res : (res?.data || res?.items || []));
        }).catch(console.error);
      });
    } else {
      setZonesList([]);
    }
  }, [filters.floor, floorsList]);

  // ── New states ──
  const [generationResults, setGenerationResults] = useState(null);
  const [autoAssign, setAutoAssign] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [lastRunTime, setLastRunTime] = useState(() => localStorage.getItem(LS_LAST_RUN) || null);

  const todayStr = new Date().toISOString().split('T')[0];
  const sevenDaysLater = new Date(); sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
  const sevenDaysStr = sevenDaysLater.toISOString().split('T')[0];

  const showToast = (msg, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const essentialModules = useMemo(
    () => modules.filter(m => ESSENTIAL_CODES.includes(m.code)),
    [modules]
  );

  const loadLocalSchedules = async () => {
    try {
      const { ApiService } = await import('../../services/apiService.js');
      const [resAll, resOverdue, resCompleted] = await Promise.all([
        ApiService.getScheduledTasks(),
        ApiService.getOverdueTasks().catch(() => ({ items: [] })),
        ApiService.getCompletedTasks().catch(() => ({ items: [] }))
      ]);
      
      const list = Array.isArray(resAll) ? resAll : (resAll?.data || resAll?.items || []);
      const overdueList = Array.isArray(resOverdue) ? resOverdue : (resOverdue?.data || resOverdue?.items || []);
      const completedList = Array.isArray(resCompleted) ? resCompleted : (resCompleted?.data || resCompleted?.items || []);
      
      const overdueMap = new Map(overdueList.map(o => [o.task_id, o]));
      const listIds = new Set(list.map(l => l.task_id));
      
      for (const o of overdueList) {
        if (!listIds.has(o.task_id)) {
          list.push(o);
          listIds.add(o.task_id);
        }
      }
      
      for (const c of completedList) {
        if (!listIds.has(c.task_id)) {
          list.push(c);
          listIds.add(c.task_id);
        }
      }

      if (list.length > 0) {
        // Map backend response format to the UI's expected format
        const mappedList = list.map((item, i) => {
          const overdueInfo = overdueMap.get(item.task_id) || {};
          return {
            ...item,
            daysOverdue: overdueInfo.days_overdue || item.days_overdue || null,
            id: item.task_id || `SCH-${Date.now()}-${i}`,
            taskId: item.task_id || `T-${1001 + i}`,
            moduleName: item.module_name || item.moduleName || 'Equipment',
            sosCode: item.sos_code || item.sosCode,
            company: item.company_name || item.company || item.equipment_details?.company_name || item.equipment?.company_name || null,
            building: item.building_name || item.location_name || item.building || item.equipment_details?.building_name || item.equipment?.building_name || 'Facility',
            branch: item.branch_name || item.branch || item.equipment_details?.branch_name || item.equipment?.branch_name || null,
            floor: item.floor_name || item.floor || item.equipment_details?.floor_name || item.equipment?.floor_name || null,
            zone: item.zone_name || item.zone || item.equipment_details?.zone_name || item.equipment?.zone_name || null,
            assignedOperator: item.assigned_user_name || item.assignedOperator || null,
            dueDate: item.scheduled_date ? item.scheduled_date.split('T')[0] : (item.dueDate || new Date().toISOString().split('T')[0]),
            dueTime: item.scheduled_date && item.scheduled_date.includes('T') ? item.scheduled_date.split('T')[1].substring(0, 5) : (item.dueTime || '09:00'),
            status: item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase() : 'Assigned',
            priority: item.priority || 'Medium',
            equipmentType: item.equipmentType || 'General',
            frequency: item.frequency || 'Monthly'
          };
        });
        
        const filterSchedules = (listToFilter) => {
          if (!modules || modules.length === 0) return [];
          return listToFilter.filter(item => {
            return modules.some(m => {
              const mCode = m.code?.toLowerCase();
              const mName = m.name?.toLowerCase();
              const iEquipType = item.equipmentType?.toLowerCase();
              const iModName = item.moduleName?.toLowerCase();
              const iModCode = item.module_code?.toLowerCase() || item.sosCode?.toLowerCase();
              const iModNameOrig = item.module_name?.toLowerCase();
              
              return (mCode && (mCode === iEquipType || mCode === iModCode || mCode === iModNameOrig)) ||
                     (mName && (mName === iEquipType || mName === iModName || mName === iModNameOrig));
            });
          });
        };

        setSchedules(filterSchedules(mappedList));
        localStorage.setItem(LS_KEY, JSON.stringify(mappedList));
        return;
      }
    } catch (e) {
      console.warn("Failed to fetch schedules from backend, falling back to local storage");
    }
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const filterSchedules = (listToFilter) => {
        if (!modules || modules.length === 0) return [];
        return listToFilter.filter(item => {
          return modules.some(m => {
            const mCode = m.code?.toLowerCase();
            const mName = m.name?.toLowerCase();
            const iEquipType = item.equipmentType?.toLowerCase();
            const iModName = item.moduleName?.toLowerCase();
            const iModCode = item.module_code?.toLowerCase() || item.sosCode?.toLowerCase();
            const iModNameOrig = item.module_name?.toLowerCase();
            
            return (mCode && (mCode === iEquipType || mCode === iModCode || mCode === iModNameOrig)) ||
                   (mName && (mName === iEquipType || mName === iModName || mName === iModNameOrig));
          });
        });
      };
      setSchedules(filterSchedules(parsed));
    }
  };

  const modulesJson = JSON.stringify(modules);
  useEffect(() => { loadLocalSchedules(); }, [modulesJson]);
  useEffect(() => { setSelectedIds(new Set()); }, [activeTab, filters]);

  const saveSchedules = (data) => {
    setSchedules(data);
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  };

  // ── Schedule generation ─────────────────────────────────────────────────

  const handleRunScheduler = async () => {
    setIsRunning(true);
    try {
      const { ApiService } = await import('../../services/apiService.js');
      
      const payload = { days_ahead: 30 };
      if (autoAssign) {
        payload.assigned_user_id = 5; 
      }
      
      const res = await ApiService.generateSchedule(payload);
      
      const createdCount = res?.tasks_created || 0;
      const dueCount = res?.due_equipment || 0;
      const alreadyGen = res?.already_generated || 0;

      const runTime = new Date().toISOString();
      setLastRunTime(runTime);
      localStorage.setItem(LS_LAST_RUN, runTime);
      
      setGenerationResults({ dueCount, createdCount, alreadyGen });
      
      // Refresh list from backend
      await loadLocalSchedules();
    } catch (e) {
      console.error(e);
      showToast('Failed to generate schedules from API. Please try again.', 'error');
    } finally {
      setIsRunning(false);
    }
  };

  // ── CRUD ────────────────────────────────────────────────────────────────

  const handleViewTask = async (taskRow) => {
    setSelectedTask(taskRow);
    try {
      const { ApiService } = await import('../../services/apiService.js');
      const details = await ApiService.getScheduledTaskById(taskRow.id);
      if (details) {
        setSelectedTask(prev => {
          if (!prev || prev.id !== taskRow.id) return prev;
          return {
            ...prev,
            ...details,
            assignedOperator: details.assigned_user_name || prev.assignedOperator,
            moduleName: details.equipment_details?.name || details.module_name || prev.moduleName,
            building: details.location_name || prev.building,
            failureReason: details.linked_inspection?.result || details.failureReason || prev.failureReason,
            planInfo: details.plan_info || prev.planInfo,
            linkedInspection: details.linked_inspection || prev.linkedInspection,
          };
        });
      }
    } catch (e) {
      console.warn("Could not fetch detailed task info", e);
    }
  };

  const handleStatusChange = (id, newStatus) => {
    const updated = schedules.map(s => s.id === id ? { ...s, status: newStatus } : s);
    saveSchedules(updated);
    if (selectedTask?.id === id) setSelectedTask(prev => ({ ...prev, status: newStatus }));
  };

  const handleAssign = async (id) => {
    try {
      const { ApiService } = await import('../../services/apiService.js');
      // Use user ID 5 as requested or a random active ID
      const userId = 5; 
      const res = await ApiService.assignSchedule(id, userId);
      
      if (res?.success || res?.assigned_user_name) {
        const opName = res.assigned_user_name || 'Assigned User';
        const opId = res.assigned_user_id || userId;
        
        const updated = schedules.map(s => s.id === id ? {
          ...s,
          assignedOperator: opName,
          assignedOperatorId: opId,
          status: s.status === 'Unassigned' ? 'Assigned' : s.status,
          whyAssigned: { floorMatch: true, lowestWorkload: true, nearbyLocation: false }
        } : s);
        saveSchedules(updated);
        if (selectedTask?.id === id) setSelectedTask(updated.find(s => s.id === id));
        showToast(`Task assigned to ${opName}`, 'success');
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to assign task via API.', 'error');
    }
  };

  // ── Bulk actions ─────────────────────────────────────────────────────────

  const toggleSelectAll = () => {
    setSelectedIds(prev =>
      prev.size === sortedDisplaySchedules.length
        ? new Set()
        : new Set(sortedDisplaySchedules.map(s => s.id))
    );
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkAssign = async () => {
    try {
      const { ApiService } = await import('../../services/apiService.js');
      const userId = 5;
      
      const taskIds = Array.from(selectedIds);
      const res = await ApiService.bulkAssignSchedules(taskIds, userId);
      
      const opName = res?.assigned_user_name || 'Assigned User';
      const opId = res?.assigned_user_id || userId;
      
      setSchedules(prev => {
        const updated = prev.map(s => selectedIds.has(s.id) ? {
          ...s,
          assignedOperator: opName,
          assignedOperatorId: opId,
          status: s.status === 'Unassigned' ? 'Assigned' : s.status,
          whyAssigned: { floorMatch: true, lowestWorkload: true, nearbyLocation: false }
        } : s);
        localStorage.setItem(LS_KEY, JSON.stringify(updated));
        return updated;
      });
      
      setSelectedIds(new Set());
      showToast(`${taskIds.length} task${taskIds.length > 1 ? 's' : ''} assigned to ${opName}`, 'success');
    } catch (e) {
      console.error(e);
      showToast('Assignment error', 'error');
    }
  };

  const handleExport = (idsToExport = null) => {
    const headers = ['Task ID', 'Equipment', 'Type', 'SOS Code', 'Building', 'Floor', 'Zone', 'Operator', 'Due Date', 'Due Time', 'Priority', 'Status'];
    const src = idsToExport ? schedules.filter(s => idsToExport.has(s.id)) : schedules;
    const rows = src.map(s => [
      s.taskId, s.moduleName, s.equipmentType, s.sosCode,
      s.building, s.floor, s.zone, s.assignedOperator || 'Unassigned',
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
    if (idsToExport) { setSelectedIds(new Set()); showToast(`${idsToExport.size} tasks exported.`, 'info'); }
    else showToast('Schedule exported as CSV.', 'info');
  };

  // ── Computed ─────────────────────────────────────────────────────────────

  const summary = useMemo(() => ({
    scheduled: schedules.length,
    dueToday: schedules.filter(s => s.dueDate === todayStr).length,
    upcoming7: schedules.filter(s => s.dueDate > todayStr && s.dueDate <= sevenDaysStr && s.status === 'Assigned').length,
    overdue: schedules.filter(s => s.status === 'Overdue').length,
    completed: schedules.filter(s => s.status === 'Completed').length,
    unassigned: schedules.filter(s => !s.assignedOperator).length,
  }), [schedules, todayStr, sevenDaysStr]);

  const insights = useMemo(() => {
    if (!schedules.length) return [];
    const items = [];
    if (summary.dueToday > 0)
      items.push({ icon: '⚠', text: `${summary.dueToday} inspection${summary.dueToday > 1 ? 's' : ''} due today`, cls: 'insight-warning' });
    const critOverdue = schedules.filter(s => s.status === 'Overdue' && s.priority === 'Critical').length;
    if (critOverdue > 0)
      items.push({ icon: '🔴', text: `${critOverdue} critical inspection${critOverdue > 1 ? 's' : ''} overdue`, cls: 'insight-critical' });
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];
    const completedWeek = schedules.filter(s => s.status === 'Completed' && s.dueDate >= weekAgoStr).length;
    if (completedWeek > 0)
      items.push({ icon: '🟢', text: `${completedWeek} inspection${completedWeek > 1 ? 's' : ''} completed this week`, cls: 'insight-success' });
    return items;
  }, [schedules, summary]);



  const filteredSchedules = useMemo(() => {
    let r = schedules;
    if (filters.company) r = r.filter(s => s.company === filters.company);
    if (filters.branch) r = r.filter(s => s.branch === filters.branch);
    if (filters.building) r = r.filter(s => s.building === filters.building);
    if (filters.floor) r = r.filter(s => s.floor === filters.floor);
    if (filters.zone) r = r.filter(s => s.zone === filters.zone);
    if (filters.equipmentType) r = r.filter(s => s.equipmentType === filters.equipmentType);
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

  const tabSchedules = useMemo(() => {
    switch (activeTab) {
      case 'upcoming': return filteredSchedules.filter(s => s.dueDate > todayStr && !['Completed', 'Overdue'].includes(s.status));
      case 'overdue': return filteredSchedules.filter(s => s.status === 'Overdue');
      case 'completed': return filteredSchedules.filter(s => s.status === 'Completed');
      default: return filteredSchedules;
    }
  }, [filteredSchedules, activeTab, todayStr]);

  const sortedDisplaySchedules = useMemo(() => {
    const arr = [...tabSchedules];
    arr.sort((a, b) => {
      let av = sortConfig.key === 'priority' ? (PRIORITY_ORDER[a.priority] ?? 99) : (a[sortConfig.key] ?? '');
      let bv = sortConfig.key === 'priority' ? (PRIORITY_ORDER[b.priority] ?? 99) : (b[sortConfig.key] ?? '');
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      return sortConfig.dir === 'asc' ? (av < bv ? -1 : av > bv ? 1 : 0) : (av > bv ? -1 : av < bv ? 1 : 0);
    });
    return arr;
  }, [tabSchedules, sortConfig]);

  const workload = useMemo(() =>
    INSPECTORS.map(ins => {
      const tasks = schedules.filter(s => s.assignedOperator === ins.name);
      const completed = tasks.filter(s => s.status === 'Completed').length;
      return { ...ins, total: tasks.length, completed, pct: tasks.length ? Math.round((completed / tasks.length) * 100) : 0 };
    }).filter(w => w.total > 0),
    [schedules]
  );

  const overdueItems = useMemo(() => schedules.filter(s => s.status === 'Overdue').slice(0, 6), [schedules]);
  const failedItems = useMemo(() => schedules.filter(s => s.status === 'Failed').slice(0, 6), [schedules]);
  const uniqueTypes = useMemo(() => [...new Set(schedules.map(s => s.equipmentType).filter(Boolean))], [schedules]);

  const TABS = [
    { key: 'scheduled', label: 'Scheduled Inspections', count: filteredSchedules.length },
    { key: 'upcoming', label: 'Next 7 Days', count: filteredSchedules.filter(s => s.dueDate > todayStr && !['Completed', 'Overdue'].includes(s.status)).length },
    { key: 'overdue', label: 'Overdue', count: summary.overdue, accent: 'red' },
    { key: 'completed', label: 'Completed', count: summary.completed },
  ];

  const someSelected = selectedIds.size > 0;
  const allSelected = someSelected && selectedIds.size === sortedDisplaySchedules.length;

  const setCompanyFilter = (val) => setFilters(f => ({ ...f, company: val, branch: '', building: '', floor: '', zone: '' }));
  const setBranchFilter = (val) => setFilters(f => ({ ...f, branch: val, building: '', floor: '', zone: '' }));
  const setBuildingFilter = (val) => setFilters(f => ({ ...f, building: val, floor: '', zone: '' }));
  const setFloorFilter = (val) => setFilters(f => ({ ...f, floor: val, zone: '' }));
  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }));

  // ── Pagination ──
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(sortedDisplaySchedules.length / ITEMS_PER_PAGE) || 1;
  
  // Reset to page 1 if current page is out of bounds due to filter changes
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  // Reset to page 1 when filters, activeTab, or sortConfig change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, activeTab, sortConfig]);

  const paginatedSchedules = sortedDisplaySchedules.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const clearFilters = () => setFilters({ company: '', branch: '', building: '', floor: '', zone: '', equipmentType: '', status: '', search: '' });
  const hasFilters = Object.values(filters).some(Boolean);
  const statusClass = (s) => `status-${(s || '').toLowerCase().replace(/\s+/g, '-')}`;

  const toggleSort = (key) => setSortConfig(prev => ({
    key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc'
  }));

  const SortIcon = ({ col }) => {
    const active = sortConfig.key === col;
    return <span className={`as-sort-icon ${active ? 'active' : ''}`}>{active && sortConfig.dir === 'desc' ? '↓' : '↑'}</span>;
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="as-container">

      {/* ── Page Header ── */}
      <div className="as-page-header">
        <div className="as-page-header-left">
          <button className="as-back-btn" onClick={onBack} title="Back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>

          <div>
            <div className="as-page-title">Auto Scheduler</div>
            <div className="as-page-subtitle">Automated inspection planning &amp; operator assignment</div>
          </div>
        </div>


        <div className="as-page-header-right" style={{ alignItems: 'center' }}>
          {lastRunTime && (
            <div className="as-last-run" style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px', fontWeight: '600', marginRight: '8px' }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Last generated:</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0f172a' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                {new Date(lastRunTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} • {new Date(lastRunTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
          )}
          <button className="as-btn-secondary" onClick={loadLocalSchedules}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Sync Data
          </button>
        </div>
      </div>

      {/* ── Layout Wrapper ── */}
      <div style={{ display: 'flex', gap: '20px', padding: '0 24px 20px', alignItems: 'flex-start' }}>

      {/* ── Main Unified Card ── */}
      <div className="as-main-card" style={{ flex: '1', minWidth: 0, margin: 0 }}>
        
        {/* ── KPI Strip + Actions ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: '#fff', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '16px' }}>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '14px', fontWeight: 600 }}>
            <span style={{ cursor: 'pointer', color: activeTab === 'upcoming' ? '#2563eb' : '#64748b' }} onClick={() => setActiveTab('upcoming')}>Due Today <span style={{ color: '#0f172a' }}>{summary.dueToday}</span></span>
            <span style={{ color: '#cbd5e1' }}>|</span>
            <span style={{ cursor: 'pointer', color: activeTab === 'scheduled' ? '#2563eb' : '#64748b' }} onClick={() => setActiveTab('scheduled')}>Scheduled <span style={{ color: '#0f172a' }}>{summary.scheduled}</span></span>
            <span style={{ color: '#cbd5e1' }}>|</span>
            <span style={{ cursor: 'pointer', color: activeTab === 'scheduled' ? '#ea580c' : '#64748b' }} onClick={() => { setActiveTab('scheduled'); setFilter('status', 'Unassigned'); }}>Unassigned <span style={{ color: '#c2410c' }}>{summary.unassigned}</span></span>
            <span style={{ color: '#cbd5e1' }}>|</span>
            <span style={{ cursor: 'pointer', color: activeTab === 'overdue' ? '#dc2626' : '#64748b' }} onClick={() => setActiveTab('overdue')}>Overdue <span style={{ color: '#dc2626' }}>{summary.overdue}</span></span>
            <span style={{ color: '#cbd5e1' }}>|</span>
            <span style={{ cursor: 'pointer', color: activeTab === 'completed' ? '#16a34a' : '#64748b' }} onClick={() => setActiveTab('completed')}>Completed <span style={{ color: '#16a34a' }}>{summary.completed}</span></span>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {summary.unassigned > 0 && (
              <button className="as-action-btn" onClick={() => { setActiveTab('scheduled'); setFilter('status', 'Unassigned'); }} style={{ background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                Assign Operators
              </button>
            )}
            <button className="as-run-btn" onClick={handleRunScheduler} disabled={isRunning} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}>
              {isRunning ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" style={{ animation: 'as-spin 1s linear infinite' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Running…
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  Generate Schedule
                </>
              )}
            </button>
            <button className="as-btn-secondary" onClick={() => handleExport()} disabled={schedules.length === 0} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export
            </button>
          </div>
        </div>

        {/* ── Scrollable Content ── */}
        <div className="as-content">

          {/* Filter Bar */}
          <div className="as-filter-bar" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              
              {/* Location Group */}
              <div className="as-filter-section" style={{ flex: '1', minWidth: '300px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  Location
                </div>
                <div style={{ background: 'white', padding: '6px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {isSuperAdmin && (
                    <select className="as-filter-select" value={filters.company} onChange={e => setCompanyFilter(e.target.value)}>
                      <option value="">All Companies</option>
                      {companiesList.map(c => { const n = c.company_name || c.name; return <option key={c.id} value={n}>{n}</option>; })}
                    </select>
                  )}
                  <select className="as-filter-select" value={filters.branch} onChange={e => setBranchFilter(e.target.value)} disabled={isSuperAdmin && !filters.company}>
                    <option value="">All Branches</option>
                    {branchesList.map(b => { const n = b.branch_name || b.name; return <option key={b.id} value={n}>{n}</option>; })}
                  </select>
                  <select className="as-filter-select" value={filters.building} onChange={e => setBuildingFilter(e.target.value)} disabled={!filters.branch}>
                    <option value="">All Buildings</option>
                    {buildingsList.map(b => { const n = b.building_name || b.name; return <option key={b.id} value={n}>{n}</option>; })}
                  </select>
                  <select className="as-filter-select" value={filters.floor} onChange={e => setFloorFilter(e.target.value)} disabled={!filters.building}>
                    <option value="">All Floors</option>
                    {floorsList.map(f => { const n = f.floor_name || f.name; return <option key={f.id} value={n}>{n}</option>; })}
                  </select>
                  <select className="as-filter-select" value={filters.zone} onChange={e => setFilter('zone', e.target.value)} disabled={!filters.floor}>
                    <option value="">All Zones</option>
                    {zonesList.map(z => { const n = z.zone_name || z.name; return <option key={z.id} value={n}>{n}</option>; })}
                  </select>
                </div>
              </div>

              {/* Inspection Group */}
              <div className="as-filter-section" style={{ flex: '1', minWidth: '300px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                  Inspection
                </div>
                <div style={{ background: 'white', padding: '6px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <select className="as-filter-select" value={filters.equipmentType} onChange={e => setFilter('equipmentType', e.target.value)}>
                    <option value="">All Types</option>
                    {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select className="as-filter-select" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
                    <option value="">All Statuses</option>
                    {['Assigned', 'In Progress', 'Completed', 'Overdue', 'Unassigned'].map(s =>
                      <option key={s} value={s}>{s}</option>
                    )}
                  </select>
                  <div className="as-search-input-wrap" style={{ flex: 1, minWidth: '160px' }}>
                    <svg className="as-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input className="as-filter-search" type="text" placeholder="Search..." value={filters.search} onChange={e => setFilter('search', e.target.value)} />
                  </div>
                  {hasFilters && <button className="as-clear-filters" style={{ padding: '7px 12px', alignSelf: 'auto', margin: 0 }} onClick={clearFilters}>✕ Clear</button>}
                </div>
              </div>

            </div>
          </div>

          {/* Bulk Action Toolbar */}
          {someSelected && (
            <div className="as-bulk-toolbar">
              <div className="as-bulk-selected">
                <span className="as-bulk-count">{selectedIds.size}</span>
                <span>task{selectedIds.size > 1 ? 's' : ''} selected</span>
              </div>
              <div className="as-bulk-actions">
                <button className="as-bulk-btn" onClick={handleBulkAssign}>
                  Assign Inspector
                </button>
                <button className="as-bulk-btn" onClick={() => handleExport(selectedIds)}>
                  Export Selected
                </button>
                <button className="as-bulk-btn as-bulk-deselect" onClick={() => setSelectedIds(new Set())}>
                  Deselect All
                </button>
              </div>
            </div>
          )}

          {/* Task Table */}
          <div className="as-list-view">

            <div className="as-table-wrap">
              <table className="as-table">
                <thead>
                  <tr>
                    <th className="as-th-check">
                      <input type="checkbox" className="as-row-checkbox"
                        checked={allSelected} onChange={toggleSelectAll}
                        title="Select all" />
                    </th>
                    <th><button className="as-sort-btn" onClick={() => toggleSort('moduleName')}>Equipment <SortIcon col="moduleName" /></button></th>
                    <th><button className="as-sort-btn" onClick={() => toggleSort('building')}>Location <SortIcon col="building" /></button></th>
                    <th><button className="as-sort-btn" onClick={() => toggleSort('assignedOperator')}>Operator <SortIcon col="assignedOperator" /></button></th>
                    <th><button className="as-sort-btn" onClick={() => toggleSort('dueDate')}>Due Date <SortIcon col="dueDate" /></button></th>
                    <th><button className="as-sort-btn" onClick={() => toggleSort('priority')}>Priority <SortIcon col="priority" /></button></th>
                    <th><button className="as-sort-btn" onClick={() => toggleSort('status')}>Status <SortIcon col="status" /></button></th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSchedules.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="as-empty-row">
                        <div className="as-empty-state">
                          <div className="as-empty-icon-wrap">
                            <svg viewBox="0 0 64 64" fill="none" width="52" height="52">
                              <rect x="8" y="10" width="48" height="48" rx="6" stroke="#cbd5e1" strokeWidth="3" fill="#f8fafc" />
                              <line x1="20" y1="24" x2="44" y2="24" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" />
                              <line x1="20" y1="32" x2="44" y2="32" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" />
                              <line x1="20" y1="40" x2="34" y2="40" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" />
                              <line x1="20" y1="8" x2="20" y2="16" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
                              <line x1="44" y1="8" x2="44" y2="16" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
                              {schedules.length === 0 && (
                                <>
                                  <circle cx="46" cy="46" r="12" fill="#2563eb" />
                                  <line x1="46" y1="40" x2="46" y2="52" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                                  <line x1="40" y1="46" x2="52" y2="46" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                                </>
                              )}
                            </svg>
                          </div>
                          <div className="as-empty-title">
                            {schedules.length === 0 ? (
                              'No scheduled inspections found'
                            ) : activeTab === 'completed' ? (
                              'No completed tasks yet'
                            ) : (
                              'No tasks match the current filters'
                            )}
                          </div>
                          <div className="as-empty-sub">
                            {schedules.length === 0
                              ? 'Generate a schedule to create inspection tasks for upcoming equipment inspections.'
                              : activeTab === 'completed'
                                ? 'Tasks will appear here once they are marked as Done by the operator.'
                                : 'Try adjusting your filters or clearing them to see all tasks.'}
                          </div>
                          {schedules.length === 0 ? (
                            <button className="as-run-btn" style={{ marginTop: 14 }} onClick={handleRunScheduler} disabled={isRunning}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                              </svg>
                              Generate Schedule
                            </button>
                          ) : activeTab === 'completed' && !hasFilters ? null : (
                            <button className="as-clear-filters" style={{ marginTop: 10 }} onClick={clearFilters}>Clear Filters</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedSchedules.map(s => {
                      const due = formatDueDate(s.dueDate);
                      const avatarGradient = INSPECTOR_COLORS[s.assignedOperatorId] || 'linear-gradient(135deg, #2563eb, #7c3aed)';
                      const rowCls = [
                        s.status === 'Overdue' ? 'as-row-overdue' : '',
                        s.status === 'Unassigned' ? 'as-row-unassigned' : '',
                        selectedIds.has(s.id) ? 'as-row-selected' : '',
                      ].filter(Boolean).join(' ');

                      return (
                        <tr key={s.id} className={rowCls}>
                          <td className="as-td-check">
                            <input type="checkbox" className="as-row-checkbox"
                              checked={selectedIds.has(s.id)} onChange={() => toggleSelect(s.id)} />
                          </td>
                          <td>
                            <div className="as-equip-cell" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span style={{ fontSize: '18px' }}>{MODULE_EMOJIS[s.moduleCode] || '📦'}</span>
                              <div>
                                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>{s.moduleName}</div>
                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>ID: {s.sosCode}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="as-loc-cell">
                              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>{s.building || 'Facility'}</div>
                              <div style={{ color: '#64748b', fontSize: '11.5px', marginTop: '2px' }}>
                                {s.zone || '—'} <span style={{ opacity: 0.5, margin: '0 4px' }}>•</span> {s.floor || '—'}
                              </div>
                            </div>
                          </td>
                          <td>
                            {s.assignedOperator ? (
                              <div className="as-operator-cell" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <div className="as-operator-avatar" style={{ background: avatarGradient }}>{s.assignedOperator[0]}</div>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: '12.5px', color: '#334155' }}>{s.assignedOperator}</div>
                                  <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>{s.inspectorRole || ''}</div>
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fffbeb', color: '#d97706', padding: '4px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 700 }}>
                                <span>⚠</span><span>Unassigned</span>
                              </div>
                            )}
                          </td>
                          <td>
                            {s.status === 'Overdue' ? (
                              <>
                                <div style={{ color: '#dc2626', fontWeight: 700, fontSize: '13px' }}>Overdue by {s.daysOverdue ?? getDaysOverdue(s.dueDate)} days</div>
                                <div style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '2px', fontWeight: 500 }}>{s.dueTime}</div>
                              </>
                            ) : (
                              <>
                                <div className="as-due-row" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span className={`as-due-dot ${due.dot}`} />
                                  <span className={`as-due-label ${due.cls}`} style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>{due.label}</span>
                                </div>
                                <div className="as-due-time" style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>{s.dueTime}</div>
                              </>
                            )}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontSize: '12px' }}>{PRIORITY_EMOJI[s.priority]}</span> {s.priority} Priority
                            </div>
                            <div style={{ color: '#64748b', fontSize: '11.5px', marginTop: '2px' }}>
                              {s.frequency} Inspection
                            </div>
                          </td>
                          <td>
                            <span className={`as-status-badge ${statusClass(s.status)}`}>
                              {STATUS_EMOJI[s.status]} {s.status}
                            </span>
                          </td>
                          <td>
                            <div className="as-action-row" style={{ justifyContent: 'flex-end', display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <button className="as-btn-view" style={{ background: '#2563eb', color: 'white', padding: '6px 14px', borderRadius: '6px', fontWeight: 600, border: 'none', cursor: 'pointer' }} onClick={() => handleViewTask(s)}>Inspect</button>
                              <button style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b', padding: '0 4px', display: 'flex', alignItems: 'center' }} title="More actions">⋮</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="as-pagination-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '16px', gap: '16px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, sortedDisplaySchedules.length)} of {sortedDisplaySchedules.length}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="as-btn-secondary" 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                    disabled={currentPage === 1}
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    Previous
                  </button>
                  <button 
                    className="as-btn-secondary" 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                    disabled={currentPage === totalPages}
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>{/* end as-main-card */}



      </div>{/* end Layout Wrapper */}

      </div>{/* end as-container */}

      {/* ── Task Detail Drawer ── */}
      {selectedTask && (
        <div className="as-drawer-overlay" onClick={() => setSelectedTask(null)}>
          <div className="as-drawer" onClick={e => e.stopPropagation()}>

            <div className="as-drawer-header">
              <div style={{ minWidth: 0 }}>
                <div className="as-drawer-title">
                  {MODULE_EMOJIS[selectedTask.moduleCode] || '📦'} {selectedTask.moduleName}
                </div>
                <div className="as-drawer-sub">{selectedTask.taskId} · {selectedTask.sosCode}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span className={`as-priority-tag ${(selectedTask.priority || '').toLowerCase()}`}>
                  {PRIORITY_EMOJI[selectedTask.priority]} {selectedTask.priority}
                </span>
                <button className="as-drawer-close" onClick={() => setSelectedTask(null)}>✕</button>
              </div>
            </div>

            {/* Status banner */}
            <div className={`as-drawer-status-banner status-banner-${selectedTask.status?.toLowerCase().replace(/\s+/, '-')}`}>
              <span>{STATUS_EMOJI[selectedTask.status]} {selectedTask.status}</span>
              {selectedTask.status === 'Overdue' && (
                <span className="as-drawer-overdue-days">{selectedTask.daysOverdue ?? getDaysOverdue(selectedTask.dueDate)}d overdue</span>
              )}
            </div>

            <div className="as-drawer-body">

              <div className="as-drawer-section">
                <div className="as-drawer-section-title">Equipment</div>
                <div className="as-drawer-detail-grid">
                  <div className="as-drawer-field"><span>Type</span><strong>{selectedTask.equipmentType}</strong></div>
                  <div className="as-drawer-field"><span>Frequency</span><strong>{selectedTask.frequency}</strong></div>
                  <div className="as-drawer-field">
                    <span>Health Score</span>
                    <strong>
                      {selectedTask.healthScore != null ? (
                        <span className={`as-health-badge ${selectedTask.healthScore >= 80 ? 'healthy' : selectedTask.healthScore >= 50 ? 'warning' : 'critical'}`}>
                          {selectedTask.healthScore}%
                        </span>
                      ) : <span style={{ color: '#94a3b8' }}>—</span>}
                    </strong>
                  </div>
                  <div className="as-drawer-field"><span>SOS Code</span><strong><span className="as-sos-code">{selectedTask.sosCode}</span></strong></div>
                </div>
              </div>

              <div className="as-drawer-section">
                <div className="as-drawer-section-title">Location</div>
                <div className="as-drawer-location-path">
                  <span>{selectedTask.building}</span>
                  <span className="as-drawer-path-sep">/</span>
                  <span>{selectedTask.floor}</span>
                  <span className="as-drawer-path-sep">/</span>
                  <span>{selectedTask.zone}</span>
                </div>
              </div>

              <div className="as-drawer-section">
                <div className="as-drawer-section-title">Schedule</div>
                <div className="as-drawer-detail-grid">
                  <div className="as-drawer-field">
                    <span>Due Date</span>
                    <strong>
                      <div className="as-due-row">
                        <span className={`as-due-dot ${formatDueDate(selectedTask.dueDate).dot}`} />
                        <span className={`as-due-label ${formatDueDate(selectedTask.dueDate).cls}`}>
                          {formatDueDate(selectedTask.dueDate).label}
                        </span>
                      </div>
                    </strong>
                  </div>
                  <div className="as-drawer-field"><span>Due Time</span><strong>{selectedTask.dueTime}</strong></div>
                </div>
                {selectedTask.failureReason && (
                  <div style={{ marginTop: 10, padding: '8px 12px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#c2410c', marginBottom: 3 }}>Failure Reason</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#c2410c' }}>{selectedTask.failureReason}</div>
                  </div>
                )}
              </div>
              
              {selectedTask.planInfo && (
                <div className="as-drawer-section">
                  <div className="as-drawer-section-title">Plan Information</div>
                  <div className="as-drawer-detail-grid">
                    <div className="as-drawer-field" style={{ gridColumn: 'span 2' }}><span>Plan Name</span><strong>{selectedTask.planInfo.name || '—'}</strong></div>
                    <div className="as-drawer-field"><span>Type</span><strong>{selectedTask.planInfo.type || '—'}</strong></div>
                    <div className="as-drawer-field"><span>Status</span><strong>{selectedTask.planInfo.status || '—'}</strong></div>
                  </div>
                </div>
              )}

              {selectedTask.linkedInspection && (
                <div className="as-drawer-section">
                  <div className="as-drawer-section-title">Linked Inspection Result</div>
                  <div className="as-drawer-detail-grid">
                    <div className="as-drawer-field"><span>Inspected On</span><strong>{selectedTask.linkedInspection.date ? new Date(selectedTask.linkedInspection.date).toLocaleDateString() : '—'}</strong></div>
                    <div className="as-drawer-field"><span>Result</span><strong>{selectedTask.linkedInspection.result || '—'}</strong></div>
                    {selectedTask.linkedInspection.remarks && (
                       <div className="as-drawer-field" style={{ gridColumn: 'span 2' }}><span>Remarks</span><strong>{selectedTask.linkedInspection.remarks}</strong></div>
                    )}
                  </div>
                </div>
              )}

              <div className="as-drawer-section">
                <div className="as-drawer-section-title">Assigned To</div>
                {selectedTask.assignedOperator ? (
                  <>
                    <div className="as-operator-cell" style={{ marginBottom: 12 }}>
                      <div className="as-operator-avatar" style={{ background: INSPECTOR_COLORS[selectedTask.assignedOperatorId] || 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>
                        {selectedTask.assignedOperator[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{selectedTask.assignedOperator}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{selectedTask.inspectorRole}</div>
                      </div>
                    </div>
                    {selectedTask.whyAssigned && (
                      <div className="as-why-assigned">
                        <div className="as-why-title">Why Assigned?</div>
                        <table className="as-why-table">
                          <thead><tr><th>Rule</th><th>Result</th></tr></thead>
                          <tbody>
                            {[['Shift Match', selectedTask.whyAssigned?.shiftMatch],
                            ['Lowest Workload', selectedTask.whyAssigned?.lowestWorkload],
                            ['Nearby Location', selectedTask.whyAssigned?.nearbyLocation]
                            ].map(([rule, val]) => (
                              <tr key={rule}>
                                <td>{rule}</td>
                                <td><span className={`as-why-badge ${val ? 'yes' : 'no'}`}>{val ? '✓ Yes' : '✗ No'}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="as-unassigned-banner">
                    <span className="as-unassigned-banner-icon">⚠</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#c2410c' }}>No operator assigned</div>
                      <div style={{ fontSize: 11.5, color: '#92400e', marginTop: 2 }}>Requires assignment before work can begin.</div>
                    </div>
                  </div>
                )}
              </div>

            </div>

            <div className="as-drawer-footer">
              {selectedTask.status === 'Unassigned' && (
                <button className="as-action-btn assign" onClick={() => handleAssign(selectedTask.id)}>Auto-Assign</button>
              )}
              {selectedTask.status === 'Assigned' && (
                <button className="as-action-btn start" onClick={() => handleStatusChange(selectedTask.id, 'In Progress')}>Mark In Progress</button>
              )}
              {selectedTask.status === 'In Progress' && (<>
                <button className="as-action-btn complete" onClick={() => handleStatusChange(selectedTask.id, 'Completed')}>Mark Completed</button>
                <button className="as-action-btn fail" onClick={() => handleStatusChange(selectedTask.id, 'Failed')}>Mark Failed</button>
              </>)}
              {(selectedTask.status === 'Completed' || selectedTask.status === 'Failed') && (
                <button className="as-action-btn start" onClick={() => handleStatusChange(selectedTask.id, 'Assigned')}>Reset to Pending</button>
              )}
              <button className="as-btn-secondary" onClick={() => setSelectedTask(null)}>Close</button>
            </div>

          </div>
        </div>
      )}

      {/* ── Generation Results Modal ── */}
      {generationResults && (
        <div className="as-modal-overlay" onClick={() => setGenerationResults(null)}>
          <div className="as-preview-modal" onClick={e => e.stopPropagation()}>

            <div className="as-modal-header">
              <div>
                <div className="as-modal-title">Generation Complete</div>
                <div className="as-modal-sub">Schedule tasks have been successfully generated</div>
              </div>
              <button className="as-modal-close" onClick={() => setGenerationResults(null)}>✕</button>
            </div>

            <div className="as-preview-body">
              <div className="as-preview-stats" style={{ marginTop: '10px', marginBottom: '20px' }}>
                <div className="as-preview-stat">
                  <div className="as-preview-stat-value">{generationResults.dueCount}</div>
                  <div className="as-preview-stat-label">Equipment Due</div>
                </div>
                <div className="as-preview-stat">
                  <div className="as-preview-stat-value as-stat-blue">{generationResults.createdCount}</div>
                  <div className="as-preview-stat-label">Tasks Created</div>
                </div>
                <div className="as-preview-stat">
                  <div className="as-preview-stat-value as-stat-green">{generationResults.alreadyGen}</div>
                  <div className="as-preview-stat-label">Already Scheduled</div>
                </div>
              </div>

              <div className="as-preview-actions" style={{ justifyContent: 'center' }}>
                <button className="as-btn-secondary" onClick={() => setGenerationResults(null)} style={{ width: '100%', padding: '10px', fontSize: '14px' }}>Close</button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Toast Notifications ── */}
      <div className="as-toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`as-toast as-toast-${t.type}`}>
            <span className="as-toast-icon">{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}</span>
            <span className="as-toast-msg">{t.msg}</span>
            <button className="as-toast-close" onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}>✕</button>
          </div>
        ))}
      </div>

    </div>
  );
}

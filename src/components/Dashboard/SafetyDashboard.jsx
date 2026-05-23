import React, { useEffect, useMemo, useReducer, useState } from 'react';
import './SafetyDashboard.css';
import { ApiService } from '../../services/apiService';
import FireExtinguisherStats from './FireExtinguisherStats';
import SprinklerStats from './SprinklerStats';
import HoseReelStats from './HoseReelStats';
import DrumHoseStats from './DrumHoseStats';
import HydrantStats from './HydrantStats';
import FireTrolleyStats from './FireTrolleyStats';
import SuppressionSystemStats from './SuppressionSystemStats';
import FireBlanketStats from './FireBlanketStats';
import FireAlarmPanelStats from './FireAlarmPanelStats';
import SmokeDetectorStats from './SmokeDetectorStats';
import HeatDetectorStats from './HeatDetectorStats';
import PASirenStats from './PASirenStats';
import WindSockStats from './WindSockStats';
import SCBAStats from './SCBAStats';
import AmbulanceStats from './AmbulanceStats';
import FirstAidBoxStats from './FirstAidBoxStats';
import EmergencyShowerStats from './EmergencyShowerStats';
import EyewashStationStats from './EyewashStationStats';
import ChemicalShowerStats from './ChemicalShowerStats';
import EquipmentAccess from './EquipmentAccess';
import UserManagement from './UserManagement';
import RightPanel from './RightPanel';
import FireExtinguisherChecklist from './FireExtinguisherChecklist';
import CompanyManagement from './CompanyManagement';
import SpillKitStats from './SpillKitStats';
import PPEStationStats from './PPEStationStats';
import SafetySignageStats from './SafetySignageStats';
import EmergencyCommStats from './EmergencyCommStats';
import MusterPointStats from './MusterPointStats';
import FireBrigadeStats from './FireBrigadeStats';
import VolunteerStats from './VolunteerStats';
import ShiftVolunteerStats from './ShiftVolunteerStats';
import TrainedShiftStats from './TrainedShiftStats';
import FireNocStats from './FireNocStats';
import EmergencyExitStats from './EmergencyExitStats';
import EmergencyLightingStats from './EmergencyLightingStats';
import Reports from './Reports';
import ChecklistConfig from './ChecklistConfig';
import WorkOrders from './WorkOrders';
import AuditLog from './AuditLog';
import DeviceManagement from './DeviceManagement';
import PendingApprovals from './PendingApprovals';
import Onboarding from './Onboarding';
import EquipmentOnboarding from './EquipmentOnboarding';
import ModuleManagement from './ModuleManagement';
import AutoScheduler from './AutoScheduler';



const STATIC_MODULES = [
  { module_id: 30, name: 'Fire Extinguishers', code: 'fire_extinguisher', health_score: 100, category: 'fire', image: '/images/fire_extinguisher1.png' },
  { module_id: 33, name: 'Hose Reels', code: 'hose_reel', health_score: 92, category: 'fire', image: '/images/hosereels1.png' },
  { module_id: 31, name: 'Sprinklers', code: 'sprinkler', health_score: 93, category: 'fire', image: '/images/sprinkler1.png' },
  { module_id: 34, name: 'Fire Hydrants', code: 'hydrant', health_score: 92, category: 'fire', image: '/images/hydrant1.png' },
  { module_id: 35, name: 'Alarm Panels', code: 'fpca', health_score: 92, category: 'fire', image: '/images/firealarm_panel1.png' },
  { module_id: 36, name: 'Smoke Detectors', code: 'smoke_detector', health_score: 92, category: 'fire', image: '/images/smoke_detector1.png' },
  { module_id: 37, name: 'Heat Detectors', code: 'heat_detector', health_score: 92, category: 'fire', image: '/images/heatdetector1.png' },
  { module_id: 55, name: 'Fire Trolleys', code: 'fire_trolley', health_score: 100, category: 'fire', image: '/images/fire_trolley1.png' },
  { module_id: 39, name: 'Emergency Exits', code: 'emergency_door', health_score: 92, category: 'fire', image: '/images/emergency_exitdoor1.png' },
  { module_id: 38, name: 'Emergency Lighting', code: 'emergency_light', health_score: 92, category: 'fire', image: '/images/emergencylight1.png' },
  { module_id: 44, name: 'PA Systems', code: 'pa_system', health_score: 100, category: 'fire', image: '/images/pa_system1.png' },
  { module_id: 56, name: 'Wind Socks', code: 'wind_sock', health_score: 100, category: 'chemical', image: '/images/wind_sock1.png' },
  { module_id: 57, name: 'SCBA Units', code: 'scba', health_score: 100, category: 'chemical', image: '/images/scba_unit1.png' },
  { module_id: 58, name: 'Ambulances', code: 'ambulance', health_score: 100, category: 'chemical', image: '/images/ambulance1.png' },
  { module_id: 45, name: 'First Aid Kits', code: 'first_aid_kit', health_score: 93, category: 'chemical', image: '/images/Firstaid1.png' },
  { module_id: 46, name: 'Eye Wash Stations', code: 'eyewash_station', health_score: 92, category: 'chemical', image: '/images/eye_wash1.png' },
  { module_id: 48, name: 'Spill Kits', code: 'spill_kit', health_score: 92, category: 'chemical', image: '/images/spill_kit1.png' },
  { module_id: 60, name: 'Chemical Showers', code: 'chemical_shower', health_score: 100, category: 'chemical', image: '/images/chemicalshower1.png' },
  { module_id: 49, name: 'PPE Stations', code: 'ppe_station', health_score: 94, category: 'chemical', image: '/images/ppe_station1.png' },
  { module_id: 42, name: 'CO2 Systems', code: 'suppression_system', health_score: 94, category: 'fire', image: '/images/suppression_system.png' },
  { module_id: 62, name: 'Safety Signage', code: 'safety_signage', health_score: 100, category: 'permit', image: '/images/signage1.png' },
  { module_id: 61, name: 'Emergency Comms', code: 'emergency_comm', health_score: 100, category: 'permit', image: '/images/Emergency_call1.png' },
  { module_id: 41, name: 'Fire Blankets', code: 'fire_blanket', health_score: 93, category: 'fire', image: '/images/fireblanket1.png' },
  { module_id: 59, name: 'Muster Points', code: 'muster_point', health_score: 100, category: 'permit', image: '/images/muster_point1.png' },
];

const CHECKLIST_GENERIC_ICON = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>;

const CHECKLIST_MODULES = [
  { id: 30, name: 'Fire Extinguisher', code: 'fire_extinguisher', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4V2" /><path d="M15 7v2" /><path d="M8 10h8" /><path d="M8 14h8" /><path d="M7 18h10" /><path d="M9 2v3" /><path d="M11 2v3" /><rect x="5" y="5" width="14" height="17" rx="2" /></svg> },
  { id: 31, name: 'Sprinkler System', code: 'sprinkler', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4" /><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" /><path d="M12 16v6" /><path d="M8 12H2" /><path d="M22 12h-6" /></svg> },
  { id: 35, name: 'FPCA / Alarm Panel', code: 'fpca', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg> },
  { id: 33, name: 'Hose Reel', code: 'hose_reel', icon: CHECKLIST_GENERIC_ICON },
  { id: 34, name: 'Fire Hydrant', code: 'hydrant', icon: CHECKLIST_GENERIC_ICON },
  { id: 36, name: 'Smoke Detector', code: 'smoke_detector', icon: CHECKLIST_GENERIC_ICON },
  { id: 37, name: 'Heat Detector', code: 'heat_detector', icon: CHECKLIST_GENERIC_ICON },
  { id: 57, name: 'SCBA Units', code: 'scba', icon: CHECKLIST_GENERIC_ICON },
  { id: 38, name: 'Emergency Light', code: 'emergency_light', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 12h5" /><path d="M4 12h5" /><path d="M12 4v5" /><path d="M12 15v5" /><path d="m17 7 3-3" /><path d="m4 20 3-3" /><path d="m17 17 3 3" /><path d="m4 4 3 3" /></svg> },
  { id: 39, name: 'Exit Sign', code: 'emergency_door', icon: CHECKLIST_GENERIC_ICON },
  { id: 41, name: 'Fire Blanket', code: 'fire_blanket', icon: CHECKLIST_GENERIC_ICON },
  { id: 42, name: 'Suppression System', code: 'suppression_system', icon: CHECKLIST_GENERIC_ICON },
  { id: 45, name: 'First Aid Kit', code: 'first_aid_kit', icon: CHECKLIST_GENERIC_ICON },
  { id: 48, name: 'Spill Kit', code: 'spill_kit', icon: CHECKLIST_GENERIC_ICON },
  { id: 55, name: 'Fire Trolley', code: 'fire_trolley', icon: CHECKLIST_GENERIC_ICON },
  { id: 44, name: 'PA System', code: 'pa_system', icon: CHECKLIST_GENERIC_ICON },
  { id: 56, name: 'Wind Sock', code: 'wind_sock', icon: CHECKLIST_GENERIC_ICON },
  { id: 58, name: 'Ambulance', code: 'ambulance', icon: CHECKLIST_GENERIC_ICON },
  { id: 47, name: 'Safety Shower', code: 'safety_shower', icon: CHECKLIST_GENERIC_ICON },
  { id: 46, name: 'Eye Wash', code: 'eyewash_station', icon: CHECKLIST_GENERIC_ICON },
  { id: 60, name: 'Chemical Shower', code: 'chemical_shower', icon: CHECKLIST_GENERIC_ICON },
  { id: 49, name: 'PPE Station', code: 'ppe_station', icon: CHECKLIST_GENERIC_ICON },
  { id: 62, name: 'Safety Signage', code: 'safety_signage', icon: CHECKLIST_GENERIC_ICON },
  { id: 61, name: 'Emergency Comm', code: 'emergency_comm', icon: CHECKLIST_GENERIC_ICON },
  { id: 59, name: 'Muster Point', code: 'muster_point', icon: CHECKLIST_GENERIC_ICON },
  { id: 20, name: 'Fire Brigade', code: 'fire_brigade', icon: CHECKLIST_GENERIC_ICON },
  { id: 3, name: 'Volunteers', code: 'volunteers', icon: CHECKLIST_GENERIC_ICON },
  { id: 22, name: 'Shift Volunteers', code: 'shift_volunteers', icon: CHECKLIST_GENERIC_ICON },
  { id: 23, name: 'Trained/Shift', code: 'trained_shift', icon: CHECKLIST_GENERIC_ICON },
  { id: 29, name: 'Fire NOC', code: 'fire_noc', icon: CHECKLIST_GENERIC_ICON },
];

const MODULE_EMOJI = {
  fire_extinguisher: '🧯',
  sprinkler: '🚿',
  fpca: '🔔',
  hose_reel: '🧵',
  hydrant: '🚒',
  drum_hose: '🛢️',
  fire_trolley: '🛒',
  suppression_system: '💨',
  fire_blanket: '🧲',
  smoke_detector: '🌫️',
  heat_detector: '🌡️',
  pa_system: '📢',
  emergency_comm: '📞',
  scba: '🫁',
  ambulance: '🚑',
  first_aid_kit: '🏥',
  safety_shower: '🚰',
  eyewash_station: '👀',
  chemical_shower: '🚿',
  ppe_station: '🦺',
  fire_brigade: '👨‍🚒',
  volunteers: '🙋',
  shift_volunteers: '👥',
  trained_shift: '🎓',
  emergency_door: '🚪',
  emergency_light: '🔦',
  wind_sock: '📍',
  spill_kit: '⚗️',
  safety_signage: '⚠️',
  muster_point: '📌',
  fire_noc: '📜',
};

const CHECKLIST_TYPE_LABELS = {
  ambulance: { label: 'Ambulance', icon: '🚑' },
  chemical_shower: { label: 'Chemical Shower', icon: '🚿' },
  co_detector: { label: 'CO Detector', icon: '🌫️' },
  emergency_comm: { label: 'Emergency Comm', icon: '📞' },
  emergency_light: { label: 'Emergency Lighting', icon: '🔦' },
  exit_sign: { label: 'Exit Sign', icon: '🚪' },
  eyewash_station: { label: 'Eye Wash Station', icon: '👀' },
  fire_alarm: { label: 'Fire Alarm', icon: '🔔' },
  fire_blanket: { label: 'Fire Blanket', icon: '🧲' },
  fire_door: { label: 'Fire Door', icon: '🚪' },
  fire_extinguisher: { label: 'Fire Extinguisher', icon: '🧯' },
  fire_trolley: { label: 'Fire Trolley', icon: '🛒' },
  first_aid_kit: { label: 'First Aid Kit', icon: '🏥' },
  fpca: { label: 'FPCA / Alarm Panel', icon: '🔔' },
  heat_detector: { label: 'Heat Detector', icon: '🌡️' },
  hose_reel: { label: 'Hose Reel', icon: '🧵' },
  hydrant: { label: 'Fire Hydrant', icon: '🚒' },
  muster_point: { label: 'Muster Point', icon: '📌' },
  pa_system: { label: 'PA System', icon: '📢' },
  ppe_station: { label: 'PPE Station', icon: '🦺' },
  safety_shower: { label: 'Safety Shower', icon: '🚰' },
  scba_unit: { label: 'SCBA Unit', icon: '🫁' },
  signage: { label: 'Safety Signage', icon: '⚠️' },
  smoke_detector: { label: 'Smoke Detector', icon: '🌫️' },
  spill_kit: { label: 'Spill Kit', icon: '⚗️' },
  sprinkler: { label: 'Sprinkler System', icon: '🚿' },
  suppression_system: { label: 'Suppression System', icon: '💨' },
  wind_sock: { label: 'Wind Sock', icon: '📍' },
};

const SafetyDashboard = ({ user, onLogout, navAccess }) => {
  const isAdmin = user?.role === 'superadmin' || user?.role === 'admin';
  const [activePage, setActivePage] = useState(() => {
    return sessionStorage.getItem('sd_activePage') || 'grid';
  });
  const [selectedEq, setSelectedEq] = useState(() => {
    try {
      const s = sessionStorage.getItem('sd_selectedEq');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [appLoading, setAppLoading] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = React.useRef(null);
  const [checkedItems, setCheckedItems] = useState({});
  const [panelVisible, setPanelVisible] = useState(true);
  const [bgColor, setBgColor] = useState('rgb(144,194,244)');
  const [currentTime, setCurrentTime] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [drillTime, setDrillTime] = useState('');
  const [shiftData, setShiftData] = useState({ icon: '🌅', name: 'Day Shift', time: '06:00 - 14:00', staff: 12 });
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [checklistTypes, setChecklistTypes] = useState([]);
  const [selectedChecklistType, setSelectedChecklistType] = useState(
    () => sessionStorage.getItem('sd_checklistType') || null
  );
  const [searchFilter, setSearchFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [modules, setModules] = useState(STATIC_MODULES);
  // Nav access: array of module codes the user is allowed to see (null = unrestricted)
  const [navAccessList, setNavAccessList] = useState(navAccess ?? null);
  const checklists = [];
  const [clState, dispatchCl] = useReducer(
    (s, a) => {
      if (a.type === 'loading') return { loading: true, items: s.items };
      if (a.type === 'success') return { loading: false, items: a.items };
      if (a.type === 'error') return { loading: false, items: [] };
      return s;
    },
    { loading: false, items: [] }
  );
  const activeChecklistItems = clState.items;
  const clLoading = clState.loading;
  const [checklistsDropdownOpen, setChecklistsDropdownOpen] = useState(false);
  const [setupDropdownOpen, setSetupDropdownOpen] = useState(false);
  const [usersDropdownOpen, setUsersDropdownOpen] = useState(false);
  const [topbarVisible, setTopbarVisible] = useState(true);
  const [adminCompanies, setAdminCompanies] = useState([]);
  const lastScrollY = React.useRef(0);
  const [workOrderPrefill, setWorkOrderPrefill] = useState(null);
  const handleRaiseWorkOrder = (sosCode) => {
    setWorkOrderPrefill(sosCode);
    setActivePage('work-orders');
  };

  const fetchNotifications = async () => {
    setNotifLoading(true);
    try {
      const d = await ApiService.getNotifications({ limit: 20 });
      const list = Array.isArray(d) ? d : (d?.notifications || d?.items || d?.data || []);
      setNotifications(list);
    } catch {
      setNotifications([]);
    } finally {
      setNotifLoading(false);
    }
  };

  const openNotifPanel = () => {
    setNotifOpen(v => {
      if (!v) fetchNotifications();
      return !v;
    });
  };

  const handleMarkRead = async (id) => {
    try {
      await ApiService.markNotificationRead([id]);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true, is_read: true } : n));
      setAlertCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.read && !n.is_read).map(n => n.id);
    if (!unreadIds.length) return;
    try {
      await ApiService.markNotificationRead(unreadIds);
      setNotifications(prev => prev.map(n => ({ ...n, read: true, is_read: true })));
      setAlertCount(0);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  const filterOptions = [
    { label: 'All', icon: '🔍' },
    { label: 'Fire', icon: '🔥' },
    { label: 'Chemical', icon: '⚗️' },
    { label: 'Medical', icon: '🏥' },
    { label: 'Permits', icon: '📋' },
  ];

  const preparednessScore = useMemo(() => {
    const total = modules.reduce((sum, m) => sum + (m.health_score || 0), 0);
    return modules.length > 0 ? Math.round(total / modules.length) : 0;
  }, [modules]);

  const statusCounts = useMemo(() => {
    return modules.reduce(
      (acc, m) => {
        if (m.health_colour === 'green') { acc.healthy++; }
        else if (m.health_colour === 'amber') { acc.warning++; }
        else if (m.health_colour === 'red' || m.health_colour === 'critical') { acc.critical++; }
        else {
          const score = m.health_score || 0;
          if (score >= 80) acc.healthy++;
          else if (score >= 50) acc.warning++;
          else acc.critical++;
        }
        return acc;
      },
      { healthy: 0, warning: 0, critical: 0 }
    );
  }, [modules]);

  // Sync navAccessList whenever the prop changes (e.g. after admin updates access)
  useEffect(() => {
    const role = (user?.role || '').toLowerCase();
    let modules = Array.isArray(navAccess) && navAccess.length > 0 ? navAccess : null;
    // superadmin/admin with no explicit list get unrestricted access
    if ((role === 'superadmin' || role === 'admin') && !modules) modules = null;
    setNavAccessList(modules);
  }, [navAccess, user]);

  useEffect(() => {
    if (activePage !== 'checklist' || !(selectedEq?.module_id || selectedEq?.id)) return;
    ApiService.getModuleChecklists(selectedEq.module_id || selectedEq.id)
      .then(d => {
        const list = Array.isArray(d) ? d : (d?.items || d?.data || d?.checklists || []);
        dispatchCl({ type: 'success', items: list });
      })
      .catch(() => dispatchCl({ type: 'error' }));
    dispatchCl({ type: 'loading' });
  }, [activePage, selectedEq]);

  useEffect(() => {
    sessionStorage.setItem('sd_activePage', activePage);
  }, [activePage]);

  useEffect(() => {
    if (selectedEq) {
      sessionStorage.setItem('sd_selectedEq', JSON.stringify(selectedEq));
    } else {
      sessionStorage.removeItem('sd_selectedEq');
    }
  }, [selectedEq]);

  useEffect(() => {
    if (selectedChecklistType) {
      sessionStorage.setItem('sd_checklistType', selectedChecklistType);
    } else {
      sessionStorage.removeItem('sd_checklistType');
    }
  }, [selectedChecklistType]);

  useEffect(() => {
    ApiService.getAlertsSummary()
      .then((d) => setAlertCount(d.total_alerts || 0))
      .catch(() => setAlertCount(0));

    ApiService.getChecklists()
      .then(d => {
        const types = Array.isArray(d) ? d : (d?.types || d?.data || []);
        setChecklistTypes(types);
      })
      .catch(() => setChecklistTypes([]));

    ApiService.getAdminCompanies()
      .then(d => {
        const list = Array.isArray(d) ? d : (d?.companies || d?.data || []);
        setAdminCompanies(list);
      })
      .catch(() => setAdminCompanies([]));

    // Fetch real-time health scores for all modules
    const fetchSummaries = async () => {
      try {
        const results = await Promise.allSettled(
          STATIC_MODULES.map(m => ApiService.getModuleSummary(m.module_id).then(res => {
            let score = res.readiness_score ?? res.health_score ?? res.score;

            // If the backend didn't calculate it, we do it here using the standard safety formula:
            if (score === undefined || score === null) {
              const total = res.total ?? res.total_units ?? 0;
              const expired = res.expired ?? 0;
              const needsService = res.needs_service ?? 0;
              const dueInspection = res.due_inspection ?? 0;

              const issues = expired + needsService + dueInspection;
              score = total > 0 ? Math.round(((total - issues) / total) * 100) : 100;
            }

            return { id: m.module_id, score, health_colour: res.health_colour };
          }))
        );

        setModules(current => current.map(m => {
          const match = results.find(r => r.status === 'fulfilled' && r.value.id === m.module_id);
          return match ? { ...m, health_score: match.value.score, health_colour: match.value.health_colour } : m;
        }));
      } catch (err) {
        console.error('Failed to fetch module summaries:', err);
      } finally {
        setAppLoading(false);
      }
    };
    fetchSummaries();
  }, []);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const hours24 = now.getHours();
      const suffix = hours24 >= 12 ? 'PM' : 'AM';
      const hours12 = hours24 % 12 || 12;
      const pad = (n) => String(n).padStart(2, '0');
      setCurrentTime(`${pad(hours12)}:${pad(now.getMinutes())}:${pad(now.getSeconds())} ${suffix}`);
    };
    tick();
    const timer = setInterval(tick, 1000);

    const updateShift = () => {
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 14) setShiftData({ icon: '🌅', name: 'Day Shift', time: '06:00 - 14:00', staff: 14 });
      else if (hour >= 14 && hour < 22) setShiftData({ icon: '☀️', name: 'Afternoon Shift', time: '14:00 - 22:00', staff: 11 });
      else setShiftData({ icon: '🌙', name: 'Night Shift', time: '22:00 - 06:00', staff: 8 });
    };
    updateShift();
    const shiftTimer = setInterval(updateShift, 60000);

    const drillDate = new Date('2026-05-15T09:00:00');
    const updateDrill = () => {
      const diff = drillDate - new Date();
      if (diff <= 0) {
        setDrillTime('🚨 DRILL NOW');
        return;
      }
      const d = Math.floor(diff / 86400000);
      const hr = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setDrillTime(`${d}d ${hr}h ${m}m ${s}s`);
    };
    updateDrill();
    const drillTimer = setInterval(updateDrill, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(shiftTimer);
      clearInterval(drillTimer);
    };
  }, []);

  // Filter the grid cards by nav-access module codes when user is restricted
  const filteredModules = useMemo(() => {
    if (!navAccessList) return modules; // admins see all
    // Map nav-access module codes to STATIC_MODULES codes
    // The API returns codes like "fire_extinguisher", "fire_trolley", "overview", "work_orders"
    // STATIC_MODULES use the same codes, so we just filter by presence
    return modules.filter(m => navAccessList.includes(m.code));
  }, [modules, navAccessList]);

  const totalItems = useMemo(() => {
    return activeChecklistItems.length;
  }, [activeChecklistItems]);

  const checkedCount = useMemo(() => {
    return Object.values(checkedItems).filter(Boolean).length;
  }, [checkedItems]);

  const progressPct = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;

  const getStatus = (mod) => {
    if (mod.health_colour === 'green') return 'healthy';
    if (mod.health_colour === 'amber') return 'warning';
    if (mod.health_colour === 'red' || mod.health_colour === 'critical') return 'critical';
    const score = mod.health_score || 0;
    return score >= 80 ? 'healthy' : score >= 50 ? 'warning' : 'critical';
  };

  const toggleCheck = (id) => setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleOpenModule = (mod) => {
    setSelectedEq(mod);
    if (mod.code === 'fire_extinguisher') setActivePage('fire-stats');
    else if (mod.code === 'sprinkler') setActivePage('sprinkler-stats');
    else if (mod.code === 'hose_reel') setActivePage('hose-stats');
    else if (mod.code === 'drum_hose') setActivePage('drum-stats');
    else if (mod.code === 'hydrant') setActivePage('hydrant-stats');
    else if (mod.code === 'fire_trolley') setActivePage('fire-trolley-stats');
    else if (mod.code === 'suppression_system') setActivePage('suppression-system-stats');
    else if (mod.code === 'fire_blanket') setActivePage('fire-blanket-stats');
    else if (mod.code === 'fpca') setActivePage('fire-alarm-panel-stats');
    else if (mod.code === 'smoke_detector') setActivePage('smoke-detector-stats');
    else if (mod.code === 'heat_detector') setActivePage('heat-detector-stats');
    else if (mod.code === 'emergency_door') setActivePage('emergency-exit-stats');
    else if (mod.code === 'emergency_light') setActivePage('emergency-lighting-stats');
    else if (mod.code === 'pa_system') setActivePage('pa-siren-stats');
    else if (mod.code === 'wind_sock') setActivePage('wind-sock-stats');
    else if (mod.code === 'scba') setActivePage('scba-stats');
    else if (mod.code === 'ambulance') setActivePage('ambulance-stats');
    else if (mod.code === 'first_aid_kit') setActivePage('first-aid-stats');
    else if (mod.code === 'safety_shower') setActivePage('emergency-shower-stats');
    else if (mod.code === 'eyewash_station') setActivePage('eyewash-station-stats');
    else if (mod.code === 'chemical_shower') setActivePage('chemical-shower-stats');
    else if (mod.code === 'spill_kit') setActivePage('spill-kit-stats');
    else if (mod.code === 'ppe_station') setActivePage('ppe-station-stats');
    else if (mod.code === 'safety_signage') setActivePage('safety-signage-stats');
    else if (mod.code === 'emergency_comm') setActivePage('emergency-comm-stats');
    else if (mod.code === 'muster_point') setActivePage('muster-point-stats');
    else if (mod.code === 'fire_brigade') setActivePage('fire-brigade-stats');
    else if (mod.code === 'volunteers') setActivePage('volunteer-stats');
    else if (mod.code === 'shift_volunteers') setActivePage('shift-volunteer-stats');
    else if (mod.code === 'trained_shift') setActivePage('trained-shift-stats');
    else if (mod.code === 'fire_noc') setActivePage('fire-noc-stats');
    else setActivePage('checklist');
  };

  const handleScroll = (e) => {
    const currentScrollY = e.target.scrollTop;
    if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
      setTopbarVisible(false);
    } else {
      setTopbarVisible(true);
    }
    lastScrollY.current = currentScrollY;
  };

  const handleLogout = async () => {
    console.log('Logout initiated');
    try {
      await ApiService.logout();
      console.log('Logout successful');
    } catch (err) {
      console.error('Logout error:', err);
    }
    sessionStorage.removeItem('sd_activePage');
    sessionStorage.removeItem('sd_selectedEq');
    sessionStorage.removeItem('sd_checklistType');
    onLogout();
  };

  const saveCo = () => alert(companyName.trim() ? `Company saved: ${companyName}` : 'Enter a company name first');

  // navAccess: null = unrestricted (admin/superadmin), array = allowed module codes
  const isNavAllowed = (code) => {
    if (!navAccessList) return true; // admins see everything
    return navAccessList.includes(code);
  };

  const navGroups = [
    {
      label: 'Main Dashboard',
      items: [
        {
          icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>,
          label: 'Overview', code: 'overview',
          active: activePage === 'grid',
          onClick: () => setActivePage('grid')
        },
      ],
    },
    {
      label: 'Field Operations',
      items: [
        { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>, label: 'Service Reports', code: 'reports', active: activePage === 'reports', onClick: () => setActivePage('reports') },
        { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>, label: 'Work Orders', code: 'work_orders', active: activePage === 'work-orders', onClick: () => setActivePage('work-orders') },
        { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>, label: 'Pending Approvals', code: 'pending_updates', active: activePage === 'pending-updates', onClick: () => setActivePage('pending-updates') },
        { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>, label: 'Auto-Scheduler', code: 'auto_scheduler', active: activePage === 'auto-scheduler', onClick: () => setActivePage('auto-scheduler') },
      ],
    },
    {
      label: 'System & Security',
      items: [
        { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>, label: 'Audit Logs', code: 'audit_logs', active: activePage === 'audit-logs', onClick: () => setActivePage('audit-logs') },
        { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" /><path d="M9 6h6" /></svg>, label: 'Device Monitoring', code: 'device_monitoring', active: activePage === 'device-monitoring', onClick: () => setActivePage('device-monitoring') },
      ],
    },
  ];

  return (
    <div className={`dash ${navCollapsed ? 'sidebar-collapsed' : ''} ${!topbarVisible ? 'topbar-hidden' : ''}`} style={{ '--bg': bgColor }}>
      {appLoading && (
        <div className="app-loader-overlay">
          <div className="app-loader-box">
            <img src="/apitoria-logo.png" alt="Apitoria" className="app-loader-logo" />
            <span className="app-loader-text">Loading Safety Dashboard…</span>
          </div>
        </div>
      )}
      {/* ── TOPBAR (HEADER AT TOP) ────────────────────────────────────────── */}
      <header className="topbar">
        <div className="topbar-left">
          <div className="topbar-brand">
            <div className="topbar-logo-pill">
              <img src="/apitoria-logo.png" alt="Apitoria" className="topbar-logo" />
            </div>
            <div className="topbar-copy">
              <div className="tb-title">
                <span className="tb-brand-icon">🚨</span>
                Emergency Safety Dashboard
              </div>
              <div className="tb-subtitle">
                Real-time fire &amp; safety monitoring
                <span className="health-info-link" title="Health Calculation: ((Total Assets - (Expired + Needs Service + Due Inspection)) / Total Assets) * 100" style={{ marginLeft: '8px', opacity: 0.7, cursor: 'help', fontSize: '9px', textDecoration: 'underline' }}>
                  Health Logic ⓘ
                </span>
              </div>
            </div>
          </div>
        </div>


        <div className="tb-actions">
          {activePage === 'grid' && (
            <div className="topbar-search">
              <div className="search-group">
                <div className="custom-select-wrap">
                  <div className="custom-select-trigger" onClick={() => setFilterOpen(!filterOpen)}>
                    <span className="select-label">{searchFilter}</span>
                    <svg className={`select-chevron ${filterOpen ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                  {filterOpen && (
                    <>
                      <div className="dropdown-overlay" onClick={() => setFilterOpen(false)} />
                      <div className="custom-select-options">
                        {filterOptions.map((opt) => (
                          <div
                            key={opt.label}
                            className={`custom-option ${searchFilter === opt.label ? 'selected' : ''}`}
                            onClick={() => { setSearchFilter(opt.label); setFilterOpen(false); }}
                          >
                            <span className="opt-icon">{opt.icon}</span>
                            {opt.label}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div className="search-box">
                  <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                  </svg>
                  <input className="search-input" placeholder="Search equipment..." />
                </div>
              </div>
            </div>
          )}

          <div className={`tb-clock ${panelVisible ? 'hidden' : ''}`}>
            <span className="tb-time-bold">{currentTime}</span>
          </div>
          <div className="bell-wrap" ref={notifRef} onClick={openNotifPanel} title="Notifications">
            <span className="bell-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </span>
            <span className="bell-badge">{alertCount > 99 ? '99+' : alertCount || 0}</span>
            {notifOpen && (
              <div className="notif-panel" onClick={e => e.stopPropagation()}>
                <div className="notif-panel-header">
                  <span className="notif-panel-title">Notifications</span>
                  <button className="notif-mark-all-btn" onClick={handleMarkAllRead}>Mark all read</button>
                </div>
                <div className="notif-panel-body">
                  {notifLoading ? (
                    <div className="notif-loading"><div className="notif-spinner" /><span>Loading…</span></div>
                  ) : notifications.length === 0 ? (
                    <div className="notif-empty">No notifications</div>
                  ) : notifications.map(n => {
                    const isRead = n.read || n.is_read;
                    return (
                      <div key={n.id} className={`notif-item ${isRead ? 'read' : 'unread'}`} onClick={() => !isRead && handleMarkRead(n.id)}>
                        <div className="notif-item-dot" />
                        <div className="notif-item-content">
                          <div className="notif-item-msg">{n.message || n.title || n.body || 'Notification'}</div>
                          {n.created_at && <div className="notif-item-time">{new Date(n.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div className={`status-badge ${panelVisible ? 'hidden' : ''}`}>❤️ {preparednessScore}%</div>
          <button
            className="panel-toggle-topbar-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPanelVisible(!panelVisible);
            }}
            title={panelVisible ? "Hide info panel" : "Show info panel"}
            aria-label="Toggle Panel"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="15" y1="3" x2="15" y2="21" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── DASHBOARD SHELL (SIDEBAR + MAIN) ──────────────────────────────── */}
      <div className="dashboard-shell">
        {/* ── SIDEBAR (NAV BAR ON LEFT) ────────────────────────────────────── */}
        <aside className={`sidebar model-sidebar ${navCollapsed ? 'collapsed' : ''}`}>
          <div className="sb-header" style={{ justifyContent: 'flex-start' }}>
            <button className="sidenav-toggle-btn" onClick={() => setNavCollapsed(!navCollapsed)} title={navCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          </div>

          <nav className="sb-scroll">
            {navGroups.map((group) => (
              <div className="sb-nav-group" key={group.label}>
                {!navCollapsed && <div className="nav-section-label">{group.label}</div>}
                {group.items.filter(item => isNavAllowed(item.code || '')).map((item) => (
                  <div key={item.label} className={`nav-item ${item.active ? 'active' : ''}`} onClick={item.onClick || (() => { })}>
                    <div className="nav-left">
                      <span className="nav-icon">{item.icon}</span>
                      {!navCollapsed && <span className="nav-label">{item.label}</span>}
                    </div>
                    {!navCollapsed && item.badge && <span className="nav-badge">{item.badge}</span>}
                    {navCollapsed && <div className="sidenav-tip">{item.label}</div>}
                  </div>
                ))}
              </div>
            ))}

            {/* MANAGEMENT section */}
            {!navCollapsed && <div className="nav-section-label">Management</div>}


            {/* SETUP DROPDOWN */}
            {(isNavAllowed('add_company') || isNavAllowed('add_equipment')) && (
              <>
                <div className={`nav-item dropdown-toggle ${setupDropdownOpen ? 'open' : ''}`} onClick={(e) => { e.stopPropagation(); setSetupDropdownOpen(!setupDropdownOpen); }}>
                  <div className="nav-left">
                    <span className="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg></span>
                    {!navCollapsed && <span className="nav-label">Setup</span>}
                  </div>
                  {!navCollapsed && (
                    <svg className={`nav-chevron ${setupDropdownOpen ? 'rotated' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  )}
                </div>
                <div className={`nav-submenu ${setupDropdownOpen && !navCollapsed ? 'open' : ''}`}>
                  {isNavAllowed('add_company') && (
                    <div className={`nav-submenu-item ${activePage === 'setup-company' ? 'active' : ''}`} onClick={() => setActivePage('setup-company')}>
                      <span className="nav-icon-small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" /></svg></span>
                      <span className="nav-label-small">Add Company</span>
                    </div>
                  )}
                  {isNavAllowed('add_equipment') && (
                    <div className={`nav-submenu-item ${activePage === 'equipment-onboarding' ? 'active' : ''}`} onClick={() => setActivePage('equipment-onboarding')}>
                      <span className="nav-icon-small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /><rect x="3" y="3" width="18" height="18" rx="3" /></svg></span>
                      <span className="nav-label-small">Add Equipment</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* USERS DROPDOWN — hidden if none of its items are accessible */}
            {(isNavAllowed('user_manage') || isNavAllowed('equipment_access')) && (
              <>
                <div className={`nav-item dropdown-toggle ${usersDropdownOpen ? 'open' : ''}`} onClick={(e) => { e.stopPropagation(); setUsersDropdownOpen(!usersDropdownOpen); }}>
                  <div className="nav-left">
                    <span className="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg></span>
                    {!navCollapsed && <span className="nav-label">Users</span>}
                  </div>
                  {!navCollapsed && (
                    <svg className={`nav-chevron ${usersDropdownOpen ? 'rotated' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  )}
                </div>
                <div className={`nav-submenu ${usersDropdownOpen && !navCollapsed ? 'open' : ''}`}>
                  {isNavAllowed('user_manage') && (
                    <div className={`nav-submenu-item ${activePage === 'users-manage' ? 'active' : ''}`} onClick={() => setActivePage('users-manage')}>
                      <span className="nav-icon-small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="16" y1="11" x2="22" y2="11" /></svg></span>
                      <span className="nav-label-small">Manage</span>
                    </div>
                  )}
                  {isNavAllowed('equipment_access') && (
                    <div className={`nav-submenu-item ${activePage === 'users-equipment-access' ? 'active' : ''}`} onClick={() => setActivePage('users-equipment-access')}>
                      <span className="nav-icon-small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg></span>
                      <span className="nav-label-small">Equipment Access</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </nav>

          <div className="sb-footer">
            <div className="sb-user-section">
              <div className="sb-user-avatar">
                {(user?.name || user?.username || 'A').charAt(0).toUpperCase()}
              </div>
              {!navCollapsed && (
                <div className="sb-user-info">
                  <div className="sb-user-name">{user?.name || user?.username || 'Admin User'}</div>
                  <div className="sb-user-role">{user?.role === 'superadmin' ? ' ' : (user?.role || 'Safety Officer')}</div>
                </div>
              )}
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {!navCollapsed && 'Logout'}
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT AREA (MIDDLE + RIGHT PANEL) ─────────────────────── */}
        <main className={`main ${!panelVisible ? 'panel-hidden' : ''}`}>
          {/* MIDDLE COLUMN: PAGES */}
          <div className="content-area">
            <section className={`page ${activePage === 'grid' ? 'active' : ''}`}>
              <div className="grid-scroll" onScroll={handleScroll} style={{ overflowY: 'auto' }}>
                {/* Onboarding setup banner — admin only, shown while companies are still being set up */}
                {isAdmin && adminCompanies.length === 0 && !appLoading && (
                  <div className="onboarding-banner" onClick={() => setActivePage('setup-onboarding')}>
                    <div className="ob-banner-icon">🚀</div>
                    <div className="ob-banner-body">
                      <div className="ob-banner-title">Complete Your Setup</div>
                      <div className="ob-banner-desc">Configure your company, users and equipment access to get started.</div>
                    </div>
                    <button className="ob-banner-btn">Start Onboarding →</button>
                  </div>
                )}
                
                {/* Summary White Card */}
                <div className="overview-summary-card">
                   <div className="osc-section" style={{ flex: 1, alignItems: 'flex-start' }}>
                      <span className="osc-label">Equipment Status:</span>
                      <div className="osc-cards-wrapper">
                        <button className={`osc-small-card healthy ${statusFilter === 'healthy' ? 'active' : ''}`} onClick={() => setStatusFilter(statusFilter === 'healthy' ? 'all' : 'healthy')}>
                          <span className="osc-symbol">✅</span> 
                          <span className="osc-text">Healthy</span>
                          <span className="osc-count">{statusCounts.healthy}</span>
                        </button>
                        <button className={`osc-small-card warning ${statusFilter === 'warning' ? 'active' : ''}`} onClick={() => setStatusFilter(statusFilter === 'warning' ? 'all' : 'warning')}>
                          <span className="osc-symbol">⚠️</span> 
                          <span className="osc-text">Warning</span>
                          <span className="osc-count">{statusCounts.warning}</span>
                        </button>
                        <button className={`osc-small-card critical ${statusFilter === 'critical' ? 'active' : ''}`} onClick={() => setStatusFilter(statusFilter === 'critical' ? 'all' : 'critical')}>
                          <span className="osc-symbol">🚨</span> 
                          <span className="osc-text">Critical</span>
                          <span className="osc-count">{statusCounts.critical}</span>
                        </button>
                      </div>
                   </div>

                   <div className="osc-divider"></div>
                   
                   <div className="osc-section" style={{ flex: 1, alignItems: 'center' }}>
                      <span className="osc-label">Readiness Score:</span>
                      <div className="osc-sys-health" style={{ minWidth: '120px', flexDirection: 'column', gap: '4px', paddingTop: '4px' }}>
                        <svg width="140" height="80" viewBox="0 0 112 64" fill="none" role="img">
                          <path d="M10 58 A46 46 0 0 1 102 58" stroke="rgba(0,0,0,0.1)" strokeWidth="10" strokeLinecap="round" fill="none" />
                          <path d="M10 58 A46 46 0 0 1 102 58" 
                                stroke={preparednessScore >= 80 ? '#2ecc71' : preparednessScore >= 50 ? '#f39c12' : '#e74c3c'} 
                                strokeWidth="10" strokeLinecap="round" fill="none" 
                                strokeDasharray="144.5" strokeDashoffset={144.5 * (1 - preparednessScore / 100)} />
                          <text x="56" y="55" textAnchor="middle" style={{ fill: '#111827', fontWeight: '900', fontSize: '22px' }}>{preparednessScore}%</text>
                        </svg>
                        <div style={{ 
                            fontSize: '13px', 
                            fontWeight: '800', 
                            marginTop: '2px',
                            color: preparednessScore >= 80 ? '#2ecc71' : preparednessScore >= 50 ? '#f39c12' : '#e74c3c' 
                        }}>
                            {preparednessScore >= 80 ? 'System Healthy' : preparednessScore >= 50 ? 'System Warning' : 'System Critical'}
                        </div>
                      </div>
                   </div>

                   <div className="osc-divider"></div>
                   
                   <div className="osc-section" style={{ flex: 1, alignItems: 'center' }}>
                      <span className="osc-label">Pending Approvals:</span>
                      <div className="osc-info-text" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '32px', fontWeight: '900', color: '#f39c12', marginTop: '12px' }}>
                        <span className="osc-symbol" style={{ fontSize: '36px' }}>📋</span>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0px' }}>
                          <span style={{ lineHeight: '1' }}>5</span>
                          <span style={{ fontSize: '12px', color: '#6c757d', fontWeight: '800', textTransform: 'uppercase', marginTop: '2px', letterSpacing: '0.5px' }}>Approvals</span>
                        </div>
                      </div>
                   </div>
                </div>

                <div className="eq-grid">
                  {filteredModules.filter(m => statusFilter === 'all' || getStatus(m) === statusFilter).map((mod) => (
                    <div key={mod.module_id} className={`eq-card ${getStatus(mod)}`} onClick={() => handleOpenModule(mod)}>
                      <div className="eq-icon">
                        {mod.image
                          ? <img src={mod.image} alt={mod.name} className={`eq-card-img eq-img-${mod.code}`}
                            onError={e => { e.target.style.display = 'none'; e.target.parentElement.textContent = MODULE_EMOJI[mod.code] || '📦'; }} />
                          : (MODULE_EMOJI[mod.code] || '📦')}
                      </div>
                      <div className="eq-info-wrap">
                        <div className="eq-name">{mod.name}</div>
                        <div className="eq-pct">{mod.health_score}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className={`page ${activePage === 'checklist' ? 'active' : ''}`}>
              <div className="cl-page">
                <div className="cm-header">
                  <button className="cm-back-btn" onClick={() => setActivePage('grid')} title="Back">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                      <path d="M19 12H5M12 5l-7 7 7 7" />
                    </svg>
                  </button>
                  <div className="cl-title">{selectedEq?.name || 'Checklist'}</div>
                  <div className="cl-prog-row">
                    <div className="cl-prog-bar"><div className="cl-prog-fill" style={{ width: `${progressPct}%` }} /></div>
                    <div className="cl-prog-txt">{checkedCount} / {totalItems}</div>
                  </div>
                </div>
                <div className="cl-body" onScroll={handleScroll}>
                  {clLoading ? (
                    <div className="cl-loading">
                      <div className="cl-spinner" />
                      <span>Loading checklist items...</span>
                    </div>
                  ) : activeChecklistItems.length > 0 ? (
                    <div className="cl-items-list">
                      {[...activeChecklistItems]
                        .sort((a, b) => (a.item_order || 0) - (b.item_order || 0))
                        .map((item, idx) => {
                          const itemId = item.id || `item_${idx}`;
                          return (
                            <div key={itemId} className={`cl-item ${checkedItems[itemId] ? 'done' : ''}`}>
                              <div className="cl-item-main">
                                <input
                                  type="checkbox"
                                  className="cl-cb"
                                  id={`cl_${itemId}`}
                                  checked={!!checkedItems[itemId]}
                                  onChange={() => toggleCheck(itemId)}
                                />
                                <label className="cl-item-text" htmlFor={`cl_${itemId}`}>
                                  {item.item_text || item.checklist_name || item.name || 'Checklist Item'}
                                </label>
                              </div>
                              {item.hints && <div className="cl-item-hint">{item.hints}</div>}
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="cl-empty">
                      <span className="cl-empty-icon">📝</span>
                      <p>No checklist items found for this module.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>



            <section className={`page ${activePage === 'fire-stats' ? 'active' : ''}`}>
              {activePage === 'fire-stats' && <FireExtinguisherStats module={selectedEq} onBack={() => setActivePage('grid')} onScroll={handleScroll} onRaiseWorkOrder={handleRaiseWorkOrder} />}
            </section>
            <section className={`page ${activePage === 'sprinkler-stats' ? 'active' : ''}`}>
              {activePage === 'sprinkler-stats' && <SprinklerStats module={selectedEq} onBack={() => setActivePage('grid')} onScroll={handleScroll} onRaiseWorkOrder={handleRaiseWorkOrder} />}
            </section>
            <section className={`page ${activePage === 'hose-stats' ? 'active' : ''}`}>
              {activePage === 'hose-stats' && <HoseReelStats module={selectedEq} onBack={() => setActivePage('grid')} onScroll={handleScroll} onRaiseWorkOrder={handleRaiseWorkOrder} />}
            </section>
            <section className={`page ${activePage === 'drum-stats' ? 'active' : ''}`}>
              {activePage === 'drum-stats' && <DrumHoseStats module={selectedEq} onBack={() => setActivePage('grid')} onScroll={handleScroll} onRaiseWorkOrder={handleRaiseWorkOrder} />}
            </section>
            <section className={`page ${activePage === 'hydrant-stats' ? 'active' : ''}`}>
              {activePage === 'hydrant-stats' && <HydrantStats module={selectedEq} onBack={() => setActivePage('grid')} onScroll={handleScroll} onRaiseWorkOrder={handleRaiseWorkOrder} />}
            </section>
            <section className={`page ${activePage === 'fire-trolley-stats' ? 'active' : ''}`}>
              {activePage === 'fire-trolley-stats' && <FireTrolleyStats module={selectedEq} onBack={() => setActivePage('grid')} onScroll={handleScroll} onRaiseWorkOrder={handleRaiseWorkOrder} />}
            </section>
            <section className={`page ${activePage === 'suppression-system-stats' ? 'active' : ''}`}>
              {activePage === 'suppression-system-stats' && <SuppressionSystemStats module={selectedEq} onBack={() => setActivePage('grid')} onScroll={handleScroll} onRaiseWorkOrder={handleRaiseWorkOrder} />}
            </section>
            <section className={`page ${activePage === 'fire-blanket-stats' ? 'active' : ''}`}>
              {activePage === 'fire-blanket-stats' && <FireBlanketStats module={selectedEq} onBack={() => setActivePage('grid')} onScroll={handleScroll} onRaiseWorkOrder={handleRaiseWorkOrder} />}
            </section>
            <section className={`page ${activePage === 'fire-alarm-panel-stats' ? 'active' : ''}`}>
              {activePage === 'fire-alarm-panel-stats' && <FireAlarmPanelStats module={selectedEq} onBack={() => setActivePage('grid')} onScroll={handleScroll} onRaiseWorkOrder={handleRaiseWorkOrder} />}
            </section>
            <section className={`page ${activePage === 'smoke-detector-stats' ? 'active' : ''}`}>
              {activePage === 'smoke-detector-stats' && <SmokeDetectorStats module={selectedEq} onBack={() => setActivePage('grid')} onScroll={handleScroll} onRaiseWorkOrder={handleRaiseWorkOrder} />}
            </section>
            <section className={`page ${activePage === 'heat-detector-stats' ? 'active' : ''}`}>
              {activePage === 'heat-detector-stats' && <HeatDetectorStats module={selectedEq} onBack={() => setActivePage('grid')} onScroll={handleScroll} onRaiseWorkOrder={handleRaiseWorkOrder} />}
            </section>
            <section className={`page ${activePage === 'emergency-exit-stats' ? 'active' : ''}`}>
              {activePage === 'emergency-exit-stats' && <EmergencyExitStats module={selectedEq} onBack={() => setActivePage('grid')} onScroll={handleScroll} onRaiseWorkOrder={handleRaiseWorkOrder} />}
            </section>
            <section className={`page ${activePage === 'emergency-lighting-stats' ? 'active' : ''}`}>
              {activePage === 'emergency-lighting-stats' && <EmergencyLightingStats module={selectedEq} onBack={() => setActivePage('grid')} onScroll={handleScroll} onRaiseWorkOrder={handleRaiseWorkOrder} />}
            </section>
            <section className={`page ${activePage === 'pa-siren-stats' ? 'active' : ''}`}>
              {activePage === 'pa-siren-stats' && <PASirenStats module={selectedEq} onBack={() => setActivePage('grid')} onScroll={handleScroll} onRaiseWorkOrder={handleRaiseWorkOrder} />}
            </section>
            <section className={`page ${activePage === 'wind-sock-stats' ? 'active' : ''}`}>
              {activePage === 'wind-sock-stats' && <WindSockStats module={selectedEq} onBack={() => setActivePage('grid')} onScroll={handleScroll} onRaiseWorkOrder={handleRaiseWorkOrder} />}
            </section>
            <section className={`page ${activePage === 'scba-stats' ? 'active' : ''}`}>
              {activePage === 'scba-stats' && <SCBAStats module={selectedEq} onBack={() => setActivePage('grid')} onScroll={handleScroll} onRaiseWorkOrder={handleRaiseWorkOrder} />}
            </section>
            <section className={`page ${activePage === 'ambulance-stats' ? 'active' : ''}`}>
              {activePage === 'ambulance-stats' && <AmbulanceStats module={selectedEq} onBack={() => setActivePage('grid')} onScroll={handleScroll} onRaiseWorkOrder={handleRaiseWorkOrder} />}
            </section>
            <section className={`page ${activePage === 'first-aid-stats' ? 'active' : ''}`}>
              {activePage === 'first-aid-stats' && <FirstAidBoxStats module={selectedEq} onBack={() => setActivePage('grid')} onScroll={handleScroll} onRaiseWorkOrder={handleRaiseWorkOrder} />}
            </section>
            <section className={`page ${activePage === 'emergency-shower-stats' ? 'active' : ''}`}>
              {activePage === 'emergency-shower-stats' && <EmergencyShowerStats module={selectedEq} onBack={() => setActivePage('grid')} onScroll={handleScroll} onRaiseWorkOrder={handleRaiseWorkOrder} />}
            </section>
            <section className={`page ${activePage === 'eyewash-station-stats' ? 'active' : ''}`}>
              {activePage === 'eyewash-station-stats' && <EyewashStationStats module={selectedEq} onBack={() => setActivePage('grid')} onScroll={handleScroll} onRaiseWorkOrder={handleRaiseWorkOrder} />}
            </section>
            <section className={`page ${activePage === 'chemical-shower-stats' ? 'active' : ''}`}>
              {activePage === 'chemical-shower-stats' && <ChemicalShowerStats module={selectedEq} onBack={() => setActivePage('grid')} onScroll={handleScroll} onRaiseWorkOrder={handleRaiseWorkOrder} />}
            </section>
            <section className={`page ${activePage === 'spill-kit-stats' ? 'active' : ''}`}>
              {activePage === 'spill-kit-stats' && <SpillKitStats module={selectedEq} onBack={() => setActivePage('grid')} onScroll={handleScroll} onRaiseWorkOrder={handleRaiseWorkOrder} />}
            </section>
            <section className={`page ${activePage === 'ppe-station-stats' ? 'active' : ''}`}>
              {activePage === 'ppe-station-stats' && <PPEStationStats module={selectedEq} onBack={() => setActivePage('grid')} onScroll={handleScroll} onRaiseWorkOrder={handleRaiseWorkOrder} />}
            </section>
            <section className={`page ${activePage === 'safety-signage-stats' ? 'active' : ''}`}>
              {activePage === 'safety-signage-stats' && <SafetySignageStats module={selectedEq} onBack={() => setActivePage('grid')} onScroll={handleScroll} onRaiseWorkOrder={handleRaiseWorkOrder} />}
            </section>
            <section className={`page ${activePage === 'emergency-comm-stats' ? 'active' : ''}`}>
              {activePage === 'emergency-comm-stats' && <EmergencyCommStats module={selectedEq} onBack={() => setActivePage('grid')} onScroll={handleScroll} onRaiseWorkOrder={handleRaiseWorkOrder} />}
            </section>
            <section className={`page ${activePage === 'muster-point-stats' ? 'active' : ''}`}>
              {activePage === 'muster-point-stats' && <MusterPointStats module={selectedEq} onBack={() => setActivePage('grid')} onScroll={handleScroll} onRaiseWorkOrder={handleRaiseWorkOrder} />}
            </section>
            <section className={`page ${activePage === 'fire-brigade-stats' ? 'active' : ''}`}>
              {activePage === 'fire-brigade-stats' && <FireBrigadeStats module={selectedEq} onBack={() => setActivePage('grid')} onScroll={handleScroll} onRaiseWorkOrder={handleRaiseWorkOrder} />}
            </section>
            <section className={`page ${activePage === 'volunteer-stats' ? 'active' : ''}`}>
              {activePage === 'volunteer-stats' && <VolunteerStats module={selectedEq} onBack={() => setActivePage('grid')} onScroll={handleScroll} onRaiseWorkOrder={handleRaiseWorkOrder} />}
            </section>
            <section className={`page ${activePage === 'shift-volunteer-stats' ? 'active' : ''}`}>
              {activePage === 'shift-volunteer-stats' && <ShiftVolunteerStats module={selectedEq} onBack={() => setActivePage('grid')} onScroll={handleScroll} onRaiseWorkOrder={handleRaiseWorkOrder} />}
            </section>
            <section className={`page ${activePage === 'trained-shift-stats' ? 'active' : ''}`}>
              {activePage === 'trained-shift-stats' && <TrainedShiftStats module={selectedEq} onBack={() => setActivePage('grid')} onScroll={handleScroll} onRaiseWorkOrder={handleRaiseWorkOrder} />}
            </section>
            <section className={`page ${activePage === 'fire-noc-stats' ? 'active' : ''}`}>
              {activePage === 'fire-noc-stats' && <FireNocStats module={selectedEq} onBack={() => setActivePage('grid')} onScroll={handleScroll} onRaiseWorkOrder={handleRaiseWorkOrder} />}
            </section>

            {/* ── REPORTS ── */}
            <section className={`page ${activePage === 'reports' ? 'active' : ''}`}>
              {activePage === 'reports' && <Reports onBack={() => setActivePage('grid')} />}
            </section>

            {/* ── WORK ORDERS ── */}
            <section className={`page ${activePage === 'work-orders' ? 'active' : ''}`}>
              {activePage === 'work-orders' && (
                <WorkOrders
                  onBack={() => {
                    setActivePage('grid');
                    setWorkOrderPrefill(null);
                  }}
                  prefill={workOrderPrefill}
                  clearPrefill={() => setWorkOrderPrefill(null)}
                />
              )}
            </section>

            {/* ── PENDING APPROVALS ── */}
            <section className={`page ${activePage === 'pending-updates' ? 'active' : ''}`}>
              {activePage === 'pending-updates' && (
                <PendingApprovals onBack={() => setActivePage('grid')} />
              )}
            </section>

            {/* ── AUTO-SCHEDULER ── */}
            <section className={`page ${activePage === 'auto-scheduler' ? 'active' : ''}`}>
              {activePage === 'auto-scheduler' && (
                <AutoScheduler modules={modules} onBack={() => setActivePage('grid')} />
              )}
            </section>

            {/* ── MODULE MANAGEMENT ── */}
            <section className={`page ${activePage === 'setup-modules' ? 'active' : ''}`}>
              {activePage === 'setup-modules' && <ModuleManagement onBack={() => setActivePage('grid')} />}
            </section>

            {/* ── AUDIT LOGS ── */}
            <section className={`page ${activePage === 'audit-logs' ? 'active' : ''}`}>
              {activePage === 'audit-logs' && <AuditLog onBack={() => setActivePage('grid')} />}
            </section>

            {/* ── DEVICE MONITORING ── */}
            <section className={`page ${activePage === 'device-monitoring' ? 'active' : ''}`}>
              {activePage === 'device-monitoring' && <DeviceManagement onBack={() => setActivePage('grid')} />}
            </section>

            {/* ── FIRE EXTINGUISHER CHECKLIST (legacy) ── */}
            <section className={`page ${activePage === 'fe-checklist' ? 'active' : ''}`}>
              {activePage === 'fe-checklist' && <FireExtinguisherChecklist onBack={() => setActivePage('grid')} />}
            </section>

            {/* ── EQUIPMENT CHECKLIST (sidebar — all types via /checklists/:type) ── */}
            <section className={`page ${activePage === 'equipment-checklist' ? 'active' : ''}`}>
              {activePage === 'equipment-checklist' && selectedChecklistType && (
                <FireExtinguisherChecklist
                  key={selectedChecklistType}
                  equipmentType={selectedChecklistType}
                  displayName={(CHECKLIST_TYPE_LABELS[selectedChecklistType] || {}).label || selectedChecklistType}
                  onBack={() => setActivePage('grid')}
                />
              )}
            </section>

            {/* ── SETUP: ONBOARDING ── */}
            <section className={`page ${activePage === 'setup-onboarding' ? 'active' : ''}`}>
              {activePage === 'setup-onboarding' && (
                <Onboarding onBack={() => setActivePage('grid')} onNavigate={setActivePage} />
              )}
            </section>

            {/* ── EQUIPMENT ONBOARDING ── */}
            <section className={`page ${activePage === 'equipment-onboarding' ? 'active' : ''}`}>
              {activePage === 'equipment-onboarding' && (
                <EquipmentOnboarding
                  onBack={() => setActivePage('grid')}
                  onSuccess={() => setActivePage('grid')}
                />
              )}
            </section>

            {/* ── SETUP: COMPANY MANAGEMENT ── */}
            <section className={`page ${activePage === 'setup-company' ? 'active' : ''}`}>
              {activePage === 'setup-company' && (
                <CompanyManagement onBack={() => setActivePage('grid')} />
              )}
            </section>

            {/* ── USERS: MANAGE ── */}
            <section className={`page ${activePage === 'users-manage' ? 'active' : ''}`}>
              {activePage === 'users-manage' && (
                <UserManagement onBack={() => setActivePage('grid')} />
              )}
            </section>

            <section className={`page ${activePage === 'users-equipment-access' ? 'active' : ''}`}>
              {activePage === 'users-equipment-access' && (
                <EquipmentAccess
                  onBack={() => setActivePage('grid')}
                  availableModules={STATIC_MODULES}
                />
              )}
            </section>

          </div>

          {/* RIGHT COLUMN: INFO PANEL */}
          <RightPanel
            panelVisible={panelVisible}
            setPanelVisible={setPanelVisible}
            currentTime={currentTime}
            preparednessScore={preparednessScore}
            statusCounts={statusCounts}
          />
        </main>
      </div>
    </div>
  );
};

export default SafetyDashboard;

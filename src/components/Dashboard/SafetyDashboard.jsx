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
import LocationsTable from './LocationsTable';
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
import AuditLog from './AuditLog';
import DeviceManagement from './DeviceManagement';
import PendingApprovals from './PendingApprovals';
import Onboarding from './Onboarding';
import EquipmentOnboarding from './EquipmentOnboarding';
import ModuleManagement from './ModuleManagement';
import EmailDomains from './EmailDomains';
import ShiftManagement from './ShiftManagement';
import AutoScheduler from './AutoScheduler';
import CODetectorStats from './CODetectorStats';
import FireDoorStats from './FireDoorStats';
import SuperAdminOverview from './SuperAdminOverview';
import AdminOverview from './AdminOverview';
import AgmOverview from './AgmOverview';
import SupervisorOverview from './SupervisorOverview';
import InspectorOverview from './InspectorOverview';
import OperatorMapping from './OperatorMapping';



const STATIC_MODULES = [
  { module_id: 30, name: 'Fire Extinguishers', code: 'fire_extinguisher', category: 'fire', image: '/images/fire_extinguisher1.png' },
  { module_id: 33, name: 'Hose Reels', code: 'hose_reel', category: 'fire', image: '/images/hosereels1.png' },
  { module_id: 31, name: 'Sprinklers', code: 'sprinkler', category: 'fire', image: '/images/sprinkler1.png' },
  { module_id: 34, name: 'Fire Hydrants', code: 'hydrant', category: 'fire', image: '/images/hydrant1.png' },
  { module_id: 35, name: 'Alarm Panels', code: 'fpca', category: 'fire', image: '/images/firealarm_panel1.png' },
  { module_id: 36, name: 'Smoke Detectors', code: 'smoke_detector', category: 'fire', image: '/images/smoke_detector1.png' },
  { module_id: 37, name: 'Heat Detectors', code: 'heat_detector', category: 'fire', image: '/images/heatdetector1.png' },
  { module_id: 55, name: 'Fire Trolleys', code: 'fire_trolley', category: 'fire', image: '/images/fire_trolley1.png' },
  { module_id: 39, name: 'Emergency Exits', code: 'emergency_exit', category: 'fire', image: '/images/emergency_exitdoor1.png' },
  { module_id: 38, name: 'Emergency Lighting', code: 'emergency_light', category: 'fire', image: '/images/emergencylight1.png' },
  { module_id: 44, name: 'PA Systems', code: 'pa_system', category: 'fire', image: '/images/pa_system1.png' },
  { module_id: 56, name: 'Wind Socks', code: 'wind_sock', category: 'chemical', image: '/images/wind_sock1.png' },
  { module_id: 57, name: 'SCBA', code: 'scba', category: 'chemical', image: '/images/scba_unit1.png' },
  { module_id: 58, name: 'Ambulances', code: 'ambulance', category: 'chemical', image: '/images/ambulance1.png' },
  { module_id: 45, name: 'First Aid Kits', code: 'first_aid_kit', category: 'chemical', image: '/images/Firstaid1.png' },
  { module_id: 46, name: 'Eye Wash Stations', code: 'eyewash_station', category: 'chemical', image: '/images/eye_wash1.png' },
  { module_id: 48, name: 'Spill Kits', code: 'spill_kit', category: 'chemical', image: '/images/spill_kit1.png' },
  { module_id: 47, name: 'Emergency Showers', code: 'safety_shower', category: 'chemical', image: '/images/chemicalshower1.png' },
  { module_id: 49, name: 'PPE Stations', code: 'ppe_station', category: 'chemical', image: '/images/ppe_station1.png' },
  { module_id: 42, name: 'CO2 Systems', code: 'suppression_system', category: 'fire', image: '/images/suppression_system.png' },
  { module_id: 62, name: 'Safety Signage', code: 'safety_signage', category: 'permit', image: '/images/signage1.png' },
  { module_id: 61, name: 'Emergency Comms', code: 'emergency_comm', category: 'permit', image: '/images/Emergency_call1.png' },
  { module_id: 41, name: 'Fire Blankets', code: 'fire_blanket', category: 'fire', image: '/images/fireblanket1.png' },
  { module_id: 59, name: 'Muster Points', code: 'muster_point', category: 'permit', image: '/images/muster_point1.png' },
  { module_id: 40, name: 'CO Detectors', code: 'co_detector', category: 'fire', image: '/images/smoke_detector1.png' },
  { module_id: 43, name: 'Fire Doors', code: 'fire_door', category: 'fire', image: '/images/fire_door1.png' },
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
  { id: 57, name: 'SCBA', code: 'scba', icon: CHECKLIST_GENERIC_ICON },
  { id: 38, name: 'Emergency Light', code: 'emergency_light', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 12h5" /><path d="M4 12h5" /><path d="M12 4v5" /><path d="M12 15v5" /><path d="m17 7 3-3" /><path d="m4 20 3-3" /><path d="m17 17 3 3" /><path d="m4 4 3 3" /></svg> },
  { id: 39, name: 'Emergency Exits', code: 'emergency_exit', icon: CHECKLIST_GENERIC_ICON },
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
  { id: 23, name: 'Trained/Shift', code: 'trained_shift', icon: CHECKLIST_GENERIC_ICON },
  { id: 29, name: 'Fire NOC', code: 'fire_noc', icon: CHECKLIST_GENERIC_ICON },
  { id: 40, name: 'CO Detector', code: 'co_detector', icon: CHECKLIST_GENERIC_ICON },
  { id: 43, name: 'Fire Door', code: 'fire_door', icon: CHECKLIST_GENERIC_ICON },
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
  co_detector: '🌫️',
  fire_door: '🚪',
  emergency_door: '🚪',
  emergency_exit: '🚪',
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

const PAGE_TO_MODULE_MAP = {
  'fire-stats': 'fire_extinguisher',
  'sprinkler-stats': 'sprinkler',
  'hose-stats': 'hose_reel',
  'drum-stats': 'drum_hose',
  'hydrant-stats': 'hydrant',
  'fire-trolley-stats': 'fire_trolley',
  'suppression-system-stats': 'suppression_system',
  'fire-blanket-stats': 'fire_blanket',
  'fire-alarm-panel-stats': 'fpca',
  'smoke-detector-stats': 'smoke_detector',
  'heat-detector-stats': 'heat_detector',
  'emergency-exit-stats': 'emergency_exit',
  'emergency-door-stats': 'emergency_door',
  'co-detector-stats': 'co_detector',
  'fire-door-stats': 'fire_door',
  'emergency-lighting-stats': 'emergency_light',
  'pa-siren-stats': 'pa_system',
  'wind-sock-stats': 'wind_sock',
  'scba-stats': 'scba',
  'ambulance-stats': 'ambulance',
  'first-aid-stats': 'first_aid_kit',
  'emergency-shower-stats': 'safety_shower',
  'eyewash-station-stats': 'eyewash_station',
  'chemical-shower-stats': 'chemical_shower',
  'spill-kit-stats': 'spill_kit',
  'ppe-station-stats': 'ppe_station',
  'safety-signage-stats': 'safety_signage',
  'emergency-comm-stats': 'emergency_comm',
  'muster-point-stats': 'muster_point',
  'fire-brigade-stats': 'fire_brigade',
  'volunteer-stats': 'volunteers',
  'shift-volunteer-stats': 'shift_volunteers',
  'trained-shift-stats': 'trained_shift',
  'fire-noc-stats': 'fire_noc'
};

const SafetyDashboard = ({ user, onLogout, navAccess, equipmentAccess }) => {
  const getCompanyLogo = () => {
    const logo = user?.logo_url || user?.company_logo || user?.company?.logo || user?.logo || user?.company?.logo_url;
    if (!logo) return '/images/eltrive.png';
    if (logo.startsWith('http')) return logo;
    if (logo.startsWith('/uploads/logos/')) return `http://ehs.garrev.com${logo}`;
    if (logo.startsWith('uploads/logos/')) return `http://ehs.garrev.com/${logo}`;
    return `http://ehs.garrev.com/uploads/logos/${logo}`;
  };

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
  const [notifError, setNotifError] = useState(false);
  const notifRef = React.useRef(null);
  const [checkedItems, setCheckedItems] = useState({});
  const [statsBackPage, setStatsBackPage] = useState('grid');
  const [bgColor, setBgColor] = useState('rgb(144,194,244)');
  const [currentTime, setCurrentTime] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [drillTime, setDrillTime] = useState('');
  const [shiftData, setShiftData] = useState({ icon: '🌅', name: 'Day Shift', time: '06:00 - 14:00', staff: 12 });
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [pendingRawItems, setPendingRawItems] = useState([]);
  const [teamActivities, setTeamActivities] = useState([]);
  const [checklistTypes, setChecklistTypes] = useState([]);
  const [selectedChecklistType, setSelectedChecklistType] = useState(
    () => sessionStorage.getItem('sd_checklistType') || null
  );
  const [searchFilter, setSearchFilter] = useState('All');
  const [eqSearchQuery, setEqSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState('all');
  const [eaInitialSearchQuery, setEaInitialSearchQuery] = useState('');
  const [eaInitialSelectedUserId, setEaInitialSelectedUserId] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [modules, setModules] = useState(STATIC_MODULES);
  const [moduleSummariesMap, setModuleSummariesMap] = useState({});
  // Nav access: array of module codes the user is allowed to see (null = unrestricted)
  const [navAccessList, setNavAccessList] = useState(navAccess ?? null);
  const [equipmentAccessList, setEquipmentAccessList] = useState(equipmentAccess ?? null);
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
  const [supervisorStats, setSupervisorStats] = useState(null);
  const [agmStats, setAgmStats] = useState(null);

  useEffect(() => {
    if (user) {
      let name = user.company_name || user.company?.name || user.company?.company_name;
      if (!name && typeof user.company === 'string') name = user.company;
      if (typeof name !== 'string') name = null;

      const cid = String(user.company_id || user.companyId || user.company?.id || user.company?.company_id || '');

      if (!name && cid) {
        if (adminCompanies.length > 0) {
          const comp = adminCompanies.find(c => String(c.id) === cid || String(c.company_id) === cid);
          if (comp) name = comp.company_name || comp.name;
        }

        if (name) {
          setCompanyName(name);
        } else {
          import('../../services/apiService').then(({ ApiService }) => {
            ApiService.getAdminCompanyById(cid)
              .then(res => {
                const fetchedName = res?.company_name || res?.name || res?.data?.company_name || res?.data?.name;
                setCompanyName(fetchedName || 'Dashboard');
              })
              .catch(err => {
                console.warn("Could not fetch company name", err);
                setCompanyName('Dashboard');
              });
          });
        }
      } else {
        setCompanyName(name || 'Dashboard');
      }
    }
  }, [user, adminCompanies]);
  const lastScrollY = React.useRef(0);


  const fetchNotifications = async () => {
    setNotifLoading(true);
    setNotifError(false);
    try {
      const d = await ApiService.getNotifications({ limit: 50 });
      const list = Array.isArray(d) ? d : (d?.notifications || d?.items || d?.data || []);
      const unreadList = list.filter(n => !n.read && !n.is_read);
      setNotifications(unreadList);
      setAlertCount(unreadList.length);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setNotifError(true);
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
      setNotifications(prev => prev.filter(n => n.id !== id));
      setAlertCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await ApiService.markAllNotificationsRead();
      setNotifications([]);
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

  const getStatus = (mod, summaries = {}) => {
    const summary = summaries[mod.module_id] || {};
    const score = summary.compliance ?? mod.health_score ?? 0;
    if (score < 80) return 'critical'; // red (below 80 is critical)
    if (score >= 90) return 'healthy'; // green
    return 'warning'; // amber (80 to 90)
  };

  // Sync navAccessList whenever the prop changes (e.g. after admin updates access)
  useEffect(() => {
    const mods = Array.isArray(navAccess) ? navAccess : null;
    setNavAccessList(mods);
  }, [navAccess]);

  useEffect(() => {
    const eqMods = Array.isArray(equipmentAccess) ? equipmentAccess : null;
    setEquipmentAccessList(eqMods);
  }, [equipmentAccess]);

  useEffect(() => {
    if (!user) return;
    const isAllowed = (page) => {
      if (page === 'grid' || page === 'overview' || page === 'equipment-grid') return true;
      let code = page;
      if (PAGE_TO_MODULE_MAP[page]) {
        code = PAGE_TO_MODULE_MAP[page];
      }

      if (page === 'pending-updates') code = 'pending_updates';
      if (page === 'auto-scheduler') code = 'auto_scheduler';
      if (page === 'setup-shifts') code = 'shifts';
      if (page === 'audit-logs') code = 'audit_logs';
      if (page === 'device-monitoring') code = 'device_monitoring';
      if (page === 'setup-company') code = 'setup_company';
      if (page === 'setup-operator-mapping') code = 'setup_operator_mapping';
      if (page === 'setup-domains') code = 'setup_domains';
      if (page === 'equipment-onboarding') code = 'add_equipment';
      if (page === 'users-manage') code = 'user_manage';
      if (page === 'users-equipment-access') code = 'equipment_access';
      if (page === 'setup-modules') return false; // Completely disabled

      return isNavAllowed(code);
    };

    if (activePage !== 'grid' && !isAllowed(activePage)) {
      setActivePage('grid');
    }
  }, [activePage, user, navAccessList, equipmentAccessList]);

  useEffect(() => {
    if (!user) return;
    const role = (user.role || '').toLowerCase();
    const isGlobal = role === 'superadmin' || role === 'admin' || role === 'safety_manager';

    if (!isGlobal) {
      ApiService.getEquipment({ limit: 1000 })
        .then(res => {
          const eqList = Array.isArray(res) ? res : (res?.items || res?.data || []);
          const moduleIds = new Set();
          const moduleCodes = new Set();

          let extractedCompanyName = null;

          eqList.forEach(eq => {
            if (eq.module_id) moduleIds.add(Number(eq.module_id));
            if (eq.module_code) moduleCodes.add(eq.module_code);
            else if (eq.equipment_type) moduleCodes.add(eq.equipment_type);

            if (!extractedCompanyName && (eq.company_name || eq.company?.name || eq.company?.company_name)) {
              extractedCompanyName = eq.company_name || eq.company?.name || eq.company?.company_name;
            }
          });

          if (extractedCompanyName) {
            setCompanyName(prev => (!prev || prev === 'Dashboard') ? extractedCompanyName : prev);
          }

          const onboardedMods = STATIC_MODULES.filter(m =>
            moduleIds.has(m.module_id) || moduleCodes.has(m.code)
          );

          if (Array.isArray(equipmentAccess)) {
            const permittedCodes = new Set(equipmentAccess.map(m => m.code));
            const visibleModules = onboardedMods.filter(m => permittedCodes.has(m.code));
            setEquipmentAccessList(visibleModules);
          } else {
            setEquipmentAccessList(onboardedMods.length > 0 ? onboardedMods : []);
          }
        })
        .catch(err => {
          console.error("Failed to load equipment list for inheritance:", err);
        });
    }
  }, [user, equipmentAccess, refreshKey]);
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
    fetchNotifications();

    // Fetch pending approvals count
    const today = new Date();
    const endDateStr = today.toISOString().split('T')[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const startDateStr = thirtyDaysAgo.toISOString().split('T')[0];

    Promise.allSettled([
      ApiService.getInspectionReports({ start_date: startDateStr, end_date: endDateStr }),
      ApiService.getPendingUpdates().catch(() => []),
      ApiService.getAdminUsers().catch(() => [])
    ]).then(([inspectionsRes, updatesRes, usersRes]) => {
      const queuedInspections = ApiService.getQueuedInspections();
      let pendingItems = [...queuedInspections];
      const approvedLocally = JSON.parse(localStorage.getItem('approved_inspections') || '[]');

      if (inspectionsRes.status === 'fulfilled') {
        const raw = inspectionsRes.value;
        const iList = Array.isArray(raw) ? raw : (raw?.items || raw?.reports || raw?.inspections || raw?.data || []);
        pendingItems = pendingItems.concat(iList.filter(i => {
          const stStatus = (i.status || '').toUpperCase();
          const stApprov = (i.approval_status || '').toUpperCase();
          return !(stApprov === 'APPROVED' || stStatus === 'APPROVED' || approvedLocally.map(String).includes(String(i.id)));
        }).map(i => ({ ...i, _itemType: 'inspection' })));
      }

      if (updatesRes.status === 'fulfilled') {
        const raw = updatesRes.value;
        const uList = Array.isArray(raw) ? raw : (raw?.items || raw?.updates || raw?.data || []);
        pendingItems = pendingItems.concat(uList.filter(u => {
          if (approvedLocally.map(String).includes(String(u.id))) return false;
          const stStatus = (u.status || '').toUpperCase();
          const stApprov = (u.approval_status || '').toUpperCase();
          return stApprov === 'PENDING' || stStatus === 'PENDING' || stApprov !== 'APPROVED';
        }).map(u => ({ ...u, _itemType: 'update' })));
      }

      const rawUsers = usersRes.status === 'fulfilled' ? usersRes.value : [];
      const uListUsers = Array.isArray(rawUsers) ? rawUsers : (rawUsers?.users || rawUsers?.data || []);
      const role = (user?.role || '').toLowerCase();
      const currentUserId = String(user?.id || user?.user_id || '');
      const userCompanyId = user?.company_id || user?.companyId;

      if (role === 'supervisor') {
        const controlled = uListUsers.filter(u => String(u.supervisor_id || u.supervisorId) === currentUserId);
        const controlledIds = new Set(controlled.map(u => String(u.id)));
        let teamFiltered = pendingItems.filter(item => {
          const itemUserId = String(item.submitted_by_id || item.inspector_id || item.user_id || '');
          return itemUserId === currentUserId || controlledIds.has(itemUserId);
        });
        if (teamFiltered.length === 0 && userCompanyId) {
          const companyUsers = uListUsers.filter(u => String(u.company_id || u.companyId) === String(userCompanyId));
          const companyUserIds = new Set(companyUsers.map(u => String(u.id)));
          teamFiltered = pendingItems.filter(item => {
            const itemUserId = String(item.submitted_by_id || item.inspector_id || item.user_id || '');
            return companyUserIds.has(itemUserId);
          });
        }
        pendingItems = teamFiltered;
      } else if (role === 'agm') {
        const controlled = uListUsers.filter(u => String(u.agm_id || u.agmId) === currentUserId);
        const controlledIds = new Set(controlled.map(u => String(u.id)));
        let teamFiltered = pendingItems.filter(item => {
          const itemUserId = String(item.submitted_by_id || item.inspector_id || item.user_id || '');
          return itemUserId === currentUserId || controlledIds.has(itemUserId);
        });
        if (teamFiltered.length === 0 && userCompanyId) {
          const companyUsers = uListUsers.filter(u => String(u.company_id || u.companyId) === String(userCompanyId));
          const companyUserIds = new Set(companyUsers.map(u => String(u.id)));
          teamFiltered = pendingItems.filter(item => {
            const itemUserId = String(item.submitted_by_id || item.inspector_id || item.user_id || '');
            return companyUserIds.has(itemUserId);
          });
        }
        pendingItems = teamFiltered;
      } else if (role === 'admin' || role === 'superadmin') {
        if (userCompanyId) {
          const companyUsers = uListUsers.filter(u => String(u.company_id || u.companyId) === String(userCompanyId));
          const companyUserIds = new Set(companyUsers.map(u => String(u.id)));
          pendingItems = pendingItems.filter(item => {
            const itemUserId = String(item.submitted_by_id || item.inspector_id || item.user_id || '');
            return companyUserIds.has(itemUserId);
          });
        }
      }

      const backendUser = uListUsers.find(u => String(u.id) === currentUserId || String(u.user_id) === currentUserId);
      if (backendUser) {
        const bName = backendUser.company_name || backendUser.company?.name || backendUser.company?.company_name;
        if (bName) {
          setCompanyName(prev => (!prev || prev === 'Dashboard') ? bName : prev);
        }
      }

      setPendingRawItems(pendingItems);
    }).catch(() => setPendingRawItems([]));

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

    if (user?.role === 'supervisor') {
      ApiService.getSupervisorDashboard()
        .then(data => {
          setSupervisorStats(data);
        })
        .catch(err => {
          console.error("Failed to load supervisor dashboard stats:", err);
        });

      ApiService.getAdminUsers()
        .then(async (usersRes) => {
          const today = new Date();
          const endDateStr = today.toISOString().split('T')[0];
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(today.getDate() - 30);
          const startDateStr = thirtyDaysAgo.toISOString().split('T')[0];

          const reportsRes = await ApiService.getInspectionReports({ start_date: startDateStr, end_date: endDateStr }).catch(() => []);

          const usersList = Array.isArray(usersRes) ? usersRes : (usersRes?.users || usersRes?.data || []);
          const inspectors = usersList.filter(u => u.role === 'inspector' || u.role === 'user');
          const reportsList = Array.isArray(reportsRes) ? reportsRes : (reportsRes?.items || reportsRes?.reports || reportsRes?.inspections || reportsRes?.data || []);

          const todayStr = new Date().toISOString().split('T')[0];
          const activities = inspectors.map(inspector => {
            const inspectorReportsToday = reportsList.filter(r => {
              const repUserId = r.submitted_by_id || r.inspector_id || r.user_id;
              const repDateStr = new Date(r.created_at || r.inspected_at).toISOString().split('T')[0];
              return String(repUserId) === String(inspector.id) && repDateStr === todayStr;
            });

            const inspectorAllReports = reportsList.filter(r => {
              const repUserId = r.submitted_by_id || r.inspector_id || r.user_id;
              return String(repUserId) === String(inspector.id);
            });
            inspectorAllReports.sort((a, b) => new Date(b.created_at || b.inspected_at) - new Date(a.created_at || a.inspected_at));
            const lastReport = inspectorAllReports[0];

            return {
              id: inspector.id,
              name: inspector.name || inspector.username,
              role: inspector.role,
              inspectionsCount: inspectorReportsToday.length,
              lastActive: lastReport ? new Date(lastReport.created_at || lastReport.inspected_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Inactive',
              lastModule: lastReport ? (lastReport.equipment_name || lastReport.module_name || 'Inspection') : '—',
              status: inspectorReportsToday.length > 0 ? 'Active' : 'Pending'
            };
          });
          setTeamActivities(activities);
        })
        .catch(err => {
          console.error("Failed to load supervisor team activities:", err);
        });
    }

    if (user?.role === 'agm') {
      ApiService.getAgmDashboard()
        .then(data => {
          setAgmStats(data);
        })
        .catch(err => {
          console.error("Failed to load AGM dashboard stats:", err);
        });
    }

    // Fetch real-time health scores for all modules
    const fetchSummaries = async () => {
      try {
        const results = await Promise.allSettled(
          STATIC_MODULES.map(m => ApiService.getModuleSummary(m.module_id).then(res => {
            let score = res.readiness_score ?? res.health_score ?? res.score;
            const total = res.total ?? res.total_units ?? res.total_assets ?? res.total_equipment ?? 0;
            const expired = res.expired ?? res.expired_assets ?? res.expired_equipment ?? res.expired_count ?? 0;
            const due = res.due_inspection ?? res.due ?? res.pending_inspections ?? 0;

            // If the backend didn't calculate it, we do it here using the standard safety formula:
            if (score === undefined || score === null) {
              const needsService = res.needs_service ?? 0;
              const issues = expired + needsService + due;
              score = total > 0 ? Math.round(((total - issues) / total) * 100) : 100;
            }

            return { id: m.module_id, score, health_colour: res.health_colour, total, due, expired };
          }))
        );

        const summariesMap = {};
        results.forEach(r => {
          if (r.status !== 'fulfilled') return;
          const { id, score, total, due, expired } = r.value;
          summariesMap[id] = { compliance: score, total, due, expired };
        });
        setModuleSummariesMap(summariesMap);

        setModules(current => current.map(m => {
          const match = results.find(r => r.status === 'fulfilled' && r.value.id === m.module_id);
          return match ? {
            ...m,
            health_score: match.value.score,
            health_colour: match.value.health_colour,
            total: match.value.total,
            due: match.value.due,
            expired: match.value.expired
          } : m;
        }));
      } catch (err) {
        console.error('Failed to fetch module summaries:', err);
      } finally {
        setAppLoading(false);
      }
    };
    fetchSummaries();
    const summariesInterval = setInterval(fetchSummaries, 15000);
    // summariesInterval is cleaned up at the end of this effect's return

    // Check supervisor inactivity and notify AGM
    const checkSupervisorInactivity = async () => {
      try {
        const usersData = await ApiService.getAdminUsers();
        const usersList = Array.isArray(usersData) ? usersData : (usersData?.users || usersData?.data || []);
        const supervisorsList = usersList.filter(u => u.role === 'supervisor');
        const inspectorsList = usersList.filter(u => u.role === 'inspector' || u.role === 'user');

        const today = new Date();
        const approvedLocally = JSON.parse(localStorage.getItem('approved_inspections') || '[]');

        // Check supervisor review inactivity on inspections (older than 2 days)
        const startDateStr = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDateStr = today.toISOString().split('T')[0];
        const reportsRes = await ApiService.getInspectionReports({ start_date: startDateStr, end_date: endDateStr });
        const reportsList = Array.isArray(reportsRes) ? reportsRes : (reportsRes?.items || reportsRes?.reports || reportsRes?.inspections || []);

        reportsList.forEach(report => {
          const stStatus = (report.status || '').toUpperCase();
          const stApprov = (report.approval_status || '').toUpperCase();
          const isApproved = stApprov === 'APPROVED' || stStatus === 'APPROVED' || approvedLocally.map(String).includes(String(report.id));

          if (!isApproved) {
            const submitDate = new Date(report.created_at || report.inspected_at);
            const diffMs = today.getTime() - submitDate.getTime();
            const diffDays = diffMs / (24 * 60 * 60 * 1000);

            if (diffDays >= 2) {
              const inspectorId = report.submitted_by_id || report.inspector_id || report.user_id;
              const inspector = inspectorsList.find(u => String(u.id) === String(inspectorId));
              if (inspector) {
                const supervisorId = inspector.supervisor_id || inspector.supervisorId;
                const supervisor = supervisorsList.find(u => String(u.id) === String(supervisorId));
                if (supervisor) {
                  const targetAgmId = supervisor.agm_id || supervisor.agmId;
                  if (targetAgmId) {
                    const key = `notified_review_inactivity_${supervisor.id}_insp_${report.id}`;
                    const lastNotified = localStorage.getItem(key);
                    if (!lastNotified) {
                      ApiService.sendTargetedNotification({
                        user_id: targetAgmId,
                        title: 'Supervisor Review Inactivity Alert',
                        message: `Supervisor ${supervisor.name || supervisor.username} has not reviewed the pending inspection for ${report.sos_code || report.equipment_code} submitted by inspector ${inspector.name || inspector.username} for 2 days.`,
                        type: 'warning'
                      }).then(() => {
                        localStorage.setItem(key, String(Date.now()));
                      }).catch(console.error);
                    }
                  }
                }
              }
            }
          }
        });

        // Also check supervisor review inactivity on proposed updates (older than 2 days)
        const updatesRes = await ApiService.getPendingUpdates().catch(() => []);
        const updatesList = Array.isArray(updatesRes) ? updatesRes : (updatesRes?.items || updatesRes?.updates || updatesRes?.data || []);

        updatesList.forEach(update => {
          const stStatus = (update.status || '').toUpperCase();
          const stApprov = (update.approval_status || '').toUpperCase();
          const isApproved = stApprov === 'APPROVED' || stStatus === 'APPROVED' || approvedLocally.map(String).includes(String(update.id));

          if (!isApproved) {
            const submitDate = new Date(update.created_at || update.submitted_at);
            const diffMs = today.getTime() - submitDate.getTime();
            const diffDays = diffMs / (24 * 60 * 60 * 1000);

            if (diffDays >= 2) {
              const inspectorId = update.submitted_by_id || update.inspector_id || update.user_id;
              const inspector = inspectorsList.find(u => String(u.id) === String(inspectorId));
              if (inspector) {
                const supervisorId = inspector.supervisor_id || inspector.supervisorId;
                const supervisor = supervisorsList.find(u => String(u.id) === String(supervisorId));
                if (supervisor) {
                  const targetAgmId = supervisor.agm_id || supervisor.agmId;
                  if (targetAgmId) {
                    const key = `notified_review_inactivity_${supervisor.id}_upd_${update.id}`;
                    const lastNotified = localStorage.getItem(key);
                    if (!lastNotified) {
                      ApiService.sendTargetedNotification({
                        user_id: targetAgmId,
                        title: 'Supervisor Review Inactivity Alert',
                        message: `Supervisor ${supervisor.name || supervisor.username} has not reviewed the pending update for ${update.sos_code || update.equipment_code} submitted by inspector ${inspector.name || inspector.username} for 2 days.`,
                        type: 'warning'
                      }).then(() => {
                        localStorage.setItem(key, String(Date.now()));
                      }).catch(console.error);
                    }
                  }
                }
              }
            }
          }
        });

        // Fallback: Also check if supervisor has not submitted any reports in 24 hours
        supervisorsList.forEach(supervisor => {
          const targetAgmId = supervisor.agm_id || supervisor.agmId;
          if (!targetAgmId) return;

          const last24h = new Date(today.getTime() - 24 * 60 * 60 * 1000);
          const hasInspection = reportsList.some(report => {
            const reportDate = new Date(report.created_at || report.inspected_at);
            const isBySupervisor = String(report.submitted_by_id || report.inspector_id) === String(supervisor.id) ||
              String(report.user_id) === String(supervisor.id) ||
              report.inspector_name === supervisor.name ||
              report.submitted_by_name === supervisor.name;
            return isBySupervisor && reportDate >= last24h;
          });

          if (!hasInspection) {
            const key = `notified_inactivity_${supervisor.id}`;
            const lastNotified = localStorage.getItem(key);
            const oneDayMs = 24 * 60 * 60 * 1000;
            if (!lastNotified || (Date.now() - Number(lastNotified) > oneDayMs)) {
              ApiService.sendTargetedNotification({
                user_id: targetAgmId,
                title: 'Supervisor Inactivity Alert',
                message: `Supervisor ${supervisor.name || supervisor.username} has not performed any inspection in the last 24 hours.`,
                type: 'warning'
              }).then(() => {
                localStorage.setItem(key, String(Date.now()));
              }).catch(console.error);
            }
          }
        });
      } catch (err) {
        console.error("Failed to check supervisor inactivity:", err);
      }
    };

    // Run after a short delay
    setTimeout(checkSupervisorInactivity, 5000);

    return () => clearInterval(summariesInterval);
  }, [refreshKey]);

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

    const drillDate = new Date('2026-09-01T09:00:00');
    const updateDrill = () => {
      const diff = drillDate - new Date();
      if (diff <= 0) {
        setDrillTime('Not Scheduled');
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

  // Filter the grid cards by equipment-access module codes when user is restricted
  const filteredModules = useMemo(() => {
    let list = modules;
    const isGlobalUser = user?.role === 'superadmin' || user?.role === 'admin' || user?.role === 'safety_manager';
    const hasExplicitAccess = (Array.isArray(equipmentAccessList) && equipmentAccessList.length > 0) ||
      (Array.isArray(navAccessList) && navAccessList.length > 0);

    if (hasExplicitAccess || (!isGlobalUser && (equipmentAccessList || navAccessList))) {
      const allowedCodes = new Set();
      if (equipmentAccessList) {
        equipmentAccessList.forEach(m => {
          const code = typeof m === 'string' ? m : (m.code || m.module_code);
          if (code) {
            allowedCodes.add(code);
            if (code === 'scba_unit') allowedCodes.add('scba');
            if (code === 'scba') allowedCodes.add('scba_unit');
            if (code === 'fire_alarm') allowedCodes.add('fpca');
            if (code === 'fpca') allowedCodes.add('fire_alarm');
            if (code === 'exit_sign' || code === 'emergency_door') allowedCodes.add('emergency_exit');
            if (code === 'emergency_exit') {
              allowedCodes.add('exit_sign');
              allowedCodes.add('emergency_door');
            }
          }
        });
      }
      if (navAccessList) {
        navAccessList.forEach(code => {
          if (code) {
            allowedCodes.add(code);
            if (code === 'scba_unit') allowedCodes.add('scba');
            if (code === 'scba') allowedCodes.add('scba_unit');
            if (code === 'fire_alarm') allowedCodes.add('fpca');
            if (code === 'fpca') allowedCodes.add('fire_alarm');
            if (code === 'exit_sign' || code === 'emergency_door') allowedCodes.add('emergency_exit');
            if (code === 'emergency_exit') {
              allowedCodes.add('exit_sign');
              allowedCodes.add('emergency_door');
            }
          }
        });
      }
      if (allowedCodes.size > 0) {
        list = modules.filter(m => allowedCodes.has(m.code));
      } else if (!isGlobalUser) {
        list = [];
      }
    } else if (!isGlobalUser) {
      list = [];
    }

    if (eqSearchQuery.trim()) {
      const q = eqSearchQuery.toLowerCase();
      list = list.filter(m => (m.name || '').toLowerCase().includes(q) || (m.code || '').toLowerCase().includes(q));
    }
    return list;
  }, [modules, equipmentAccessList, navAccessList, eqSearchQuery, user]);

  const pendingApprovalsCount = useMemo(() => {
    if (!pendingRawItems) return 0;
    const allowedIds = new Set(filteredModules.map(m => String(m.module_id)));
    const finalItems = pendingRawItems.filter(r => !r.module_id || allowedIds.has(String(r.module_id)));
    return finalItems.length;
  }, [pendingRawItems, filteredModules]);

  const preparednessScore = useMemo(() => {
    if (user?.role === 'supervisor' && supervisorStats !== null && supervisorStats.compliance_rate > 0) {
      return supervisorStats.compliance_rate;
    }
    if (user?.role === 'agm' && agmStats !== null && agmStats.compliance_rate > 0) {
      return agmStats.compliance_rate;
    }
    const total = filteredModules.reduce((sum, m) => {
      const summary = moduleSummariesMap[m.module_id] || {};
      const score = summary.compliance ?? m.health_score ?? 0;
      return sum + score;
    }, 0);
    return filteredModules.length > 0 ? Math.round(total / filteredModules.length) : 0;
  }, [filteredModules, moduleSummariesMap, user, supervisorStats, agmStats]);

  const statusCounts = useMemo(() => {
    return filteredModules.reduce(
      (acc, m) => {
        const status = getStatus(m, moduleSummariesMap);
        if (status === 'healthy') acc.healthy += 1;
        else if (status === 'warning') acc.warning += 1;
        else if (status === 'critical') acc.critical += 1;
        return acc;
      },
      { healthy: 0, warning: 0, critical: 0 }
    );
  }, [filteredModules, moduleSummariesMap]);

  const totalItems = useMemo(() => {
    return activeChecklistItems.length;
  }, [activeChecklistItems]);

  const checkedCount = useMemo(() => {
    return Object.values(checkedItems).filter(Boolean).length;
  }, [checkedItems]);

  const progressPct = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;

  // getStatus helper is defined at the top of the component for hoisting safety.

  const toggleCheck = (id) => setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleOpenModule = (mod) => {
    setSelectedEq(mod);
    setStatsBackPage(activePage);
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
    else if (mod.code === 'emergency_exit') setActivePage('emergency-exit-stats');
    else if (mod.code === 'emergency_door') setActivePage('emergency-door-stats');
    else if (mod.code === 'co_detector') setActivePage('co-detector-stats');
    else if (mod.code === 'fire_door') setActivePage('fire-door-stats');
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

  const isNavAllowed = (code) => {
    if (!code) return false;
    if (code === 'location_explorer') return true;
    const role = (user?.role || '').toLowerCase();
    if (code === 'pending_updates') {
      if (role === 'supervisor' || role === 'agm' || role === 'admin' || role === 'superadmin') return true;
      return role !== 'user' && role !== 'inspector';
    }

    const isAdminOrSuper = role === 'superadmin' || role === 'admin';
    const isGlobal = isAdminOrSuper || role === 'safety_manager';

    // 1. Role-based hard boundaries (Security Overrides)
    if (code === 'locations_table' || code === 'user_manage' || code === 'add_equipment' || code === 'setup_domains') {
      if (!isAdminOrSuper) return false;
    }
    if (code === 'setup_company') {
      if (role !== 'superadmin') return false;
    }
    if (code === 'equipment_access') {
      if (!isAdminOrSuper && role !== 'agm' && role !== 'supervisor') return false;
    }
    if (code === 'audit_logs' || code === 'device_monitoring') {
      if (!isGlobal || role === 'admin') return false;
    }
    if (code === 'auto_scheduler') {
      if (role === 'user' || role === 'inspector') return false;
    }

    // 2. Global users see everything
    if (isGlobal) return true;

    const hasNavList = Array.isArray(navAccessList) && navAccessList.length > 0;
    const hasEqList = Array.isArray(equipmentAccessList) && equipmentAccessList.length > 0;
    const isStandardNav = ['overview', 'reports', 'auto_scheduler', 'audit_logs', 'device_monitoring'].includes(code);

    if (hasNavList || (hasEqList && !isStandardNav)) {
      const allowedNav = hasNavList ? navAccessList : [];
      const allowedEq = hasEqList && !isStandardNav ? equipmentAccessList.map(m => typeof m === 'string' ? m : (m.code || m.module_code)) : [];

      if (allowedNav.includes(code)) return true;
      if (code === 'scba' && allowedNav.includes('scba_unit')) return true;
      if (code === 'scba_unit' && allowedNav.includes('scba')) return true;
      if ((code === 'emergency_exit' || code === 'exit_sign' || code === 'emergency_door') &&
        (allowedNav.includes('emergency_exit') || allowedNav.includes('exit_sign') || allowedNav.includes('emergency_door'))) return true;

      if (allowedEq.includes(code)) return true;
      if (code === 'scba' && allowedEq.includes('scba_unit')) return true;
      if (code === 'scba_unit' && allowedEq.includes('scba')) return true;
      if ((code === 'emergency_exit' || code === 'exit_sign' || code === 'emergency_door') &&
        (allowedEq.includes('emergency_exit') || allowedEq.includes('exit_sign') || allowedEq.includes('emergency_door'))) return true;

      return false;
    }

    // 4. Default role fallback if list is entirely missing/null
    if (role === 'agm') {
      return !['user_manage', 'add_equipment', 'setup_company', 'audit_logs', 'device_monitoring'].includes(code);
    }
    if (role === 'supervisor') {
      return !['user_manage', 'add_equipment', 'setup_company', 'audit_logs', 'device_monitoring', 'auto_scheduler'].includes(code);
    }
    if (role === 'user' || role === 'inspector') {
      return ['overview', 'reports'].includes(code) || (!['pending_updates', 'auto_scheduler', 'audit_logs', 'device_monitoring', 'user_manage', 'equipment_access', 'add_equipment', 'setup_company'].includes(code));
    }

    return false;
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
        { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>, label: 'Pending Approvals', code: 'pending_updates', badge: pendingApprovalsCount, active: activePage === 'pending-updates', onClick: () => setActivePage('pending-updates') },
        { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>, label: 'Auto-Scheduler', code: 'auto_scheduler', active: activePage === 'auto-scheduler', onClick: () => setActivePage('auto-scheduler') },
        { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>, label: 'Shift Management', code: 'shifts', active: activePage === 'setup-shifts', onClick: () => setActivePage('setup-shifts') },
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

  const displayModules = (equipmentAccessList?.length > 0 ? equipmentAccessList : modules).map(mod => ({
    ...mod,
    image: mod.image || STATIC_MODULES.find(m => String(m.module_id) === String(mod.module_id || mod.id))?.image
  }));

  return (
    <div className={`dash ${navCollapsed ? 'sidebar-collapsed' : ''} ${!topbarVisible ? 'topbar-hidden' : ''}`} style={{ '--bg': bgColor }}>
      {appLoading && (
        <div className="refresher-loading-container" style={{ position: 'fixed', inset: 0, zIndex: 99999 }}>
          <div className="circular-loader-container">
            <div className="circular-spinner"></div>
            <div className="circular-logo-wrapper">
              <img src={getCompanyLogo()} alt="Company Logo" className="circular-logo" />
            </div>
          </div>
          <div className="refresher-text">Loading Safety Dashboard…</div>
        </div>
      )}
      <header className="topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div className="topbar-left" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
          {user?.role === 'superadmin' ? (
            <div className="topbar-logo-pill">
              <img src={getCompanyLogo()} alt="Company Logo" className="topbar-logo" />
            </div>
          ) : (
            <div className="topbar-company-name" style={{ padding: '0 20px', fontWeight: '900', fontSize: '1.1rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', height: '44px' }}>
              {companyName || 'Dashboard'}
            </div>
          )}
        </div>

        <div className="topbar-center" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div className="topbar-copy" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="tb-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span className="tb-brand-icon">🚨</span>
              Emergency Safety Dashboard
            </div>
            <div className="tb-subtitle">
              Real-time fire &amp; safety monitoring
            </div>
          </div>
        </div>

        <div className="tb-actions" style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          {activePage === 'grid' && modules.length > 10 && (
            <div className="topbar-search">

            </div>
          )}

          <div className="tb-clock">
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
                  ) : notifError ? (
                    <div className="notif-empty" style={{ color: '#ff6b6b', padding: '14px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                      <span>⚠️ Service temporarily unavailable</span>
                      <button onClick={fetchNotifications} style={{ background: 'rgba(255, 107, 107, 0.15)', border: '1px solid rgba(255, 107, 107, 0.3)', color: '#ff6b6b', borderRadius: '6px', padding: '5px 12px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>Retry Connection</button>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="notif-empty">No notifications</div>
                  ) : notifications.map(n => {
                    const isRead = n.read || n.is_read;
                    return (
                      <div key={n.id} className={`notif-item ${isRead ? 'read' : 'unread'}`} onClick={() => !isRead && handleMarkRead(n.id)}>
                        <div className="notif-item-dot" />
                        <div className="notif-item-content">
                          <div className="notif-item-title" style={{ fontWeight: '700', fontSize: '12.5px', color: '#fff', marginBottom: '3px' }}>{n.title || 'Notification'}</div>
                          <div className="notif-item-msg" style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.4' }}>{n.body || n.message || ''}</div>
                          {n.created_at && <div className="notif-item-time" style={{ marginTop: '4px' }}>{new Date(n.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="status-badge">❤️ {preparednessScore}%</div>
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
            {navGroups.map((group) => {
              const allowedItems = group.items.filter(item => isNavAllowed(item.code || ''));
              if (allowedItems.length === 0) return null;
              return (
                <div className="sb-nav-group" key={group.label}>
                  {!navCollapsed && <div className="nav-section-label">{group.label}</div>}
                  {allowedItems.map((item) => (
                    <div key={item.label} className={`nav-item ${item.active ? 'active' : ''}`} onClick={item.onClick || (() => { })}>
                      <div className="nav-left">
                        <span className="nav-icon">{item.icon}</span>
                        {!navCollapsed && (
                          <span className="nav-label" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                            {item.label}
                            {item.badge ? (
                              <span style={{
                                position: 'absolute',
                                top: '-8px',
                                right: '-18px',
                                background: '#dc2626',
                                color: 'white',
                                fontSize: '9px',
                                fontWeight: 'bold',
                                padding: '2px 5px',
                                borderRadius: '10px',
                                lineHeight: 1
                              }}>
                                {item.badge}
                              </span>
                            ) : null}
                          </span>
                        )}
                      </div>
                      {navCollapsed && <div className="sidenav-tip">{item.label}</div>}
                    </div>
                  ))}
                </div>
              );
            })}

            {/* MANAGEMENT section */}
            {!navCollapsed && ((user?.role === 'superadmin' || isNavAllowed('add_equipment') || isNavAllowed('user_manage') || isNavAllowed('equipment_access')) ? (
              <div className="nav-section-label">Management</div>
            ) : null)}


            {/* SETUP DROPDOWN */}
            {((user?.role === 'superadmin') || isNavAllowed('add_equipment')) && (
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
                  {user?.role === 'superadmin' && (
                    <div className={`nav-submenu-item ${activePage === 'setup-company' ? 'active' : ''}`} onClick={() => setActivePage('setup-company')}>
                      <span className="nav-icon-small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" /></svg></span>
                      <span className="nav-label-small">Add Company</span>
                    </div>
                  )}
                  {isNavAllowed('add_equipment') && (
                    <div className={`nav-submenu-item ${activePage === 'equipment-onboarding' ? 'active' : ''}`} onClick={() => setActivePage('equipment-onboarding')}>
                      <span className="nav-icon-small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /><rect x="3" y="3" width="18" height="18" rx="3" /></svg></span>
                      <span className="nav-label-small">Onboarding</span>
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
                  <div className="sb-user-role">
                    {user?.role === 'superadmin' ? 'Super Admin' :
                      (user?.role === 'user' || user?.role === 'inspector') ? 'Inspector' :
                        (user?.role || 'Safety Officer')}
                  </div>
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
        <main className="main">
          {/* MIDDLE COLUMN: PAGES */}
          <div className="content-area">
            <section className={`page ${activePage === 'grid' || activePage === 'equipment-grid' ? 'active' : ''}`}>
              <div
                className={`grid-scroll${user?.role === 'superadmin' && activePage !== 'equipment-grid' ? ' grid-scroll--overview' : ''}`}
                onScroll={handleScroll}
                style={{ overflowY: 'auto' }}
              >
                {/* ── SUPERADMIN OVERVIEW DASHBOARD ── */}
                {user?.role === 'superadmin' && activePage !== 'equipment-grid' ? (
                  <SuperAdminOverview
                    user={user}
                    allModules={filteredModules}
                    moduleSummaries={moduleSummariesMap}
                    onNavigate={(code, filter, moduleFilter) => {
                      const codeToPage = {
                        'grid': 'grid',
                        'equipment-grid': 'equipment-grid',
                        'setup-company': 'setup-company',
                        'users-manage': 'users-manage',
                        'pending-updates': 'pending-updates',
                        'reports': 'reports',
                        'fire_extinguisher': 'fire-stats',
                        'sprinkler': 'sprinkler-stats',
                        'hose_reel': 'hose-stats',
                        'smoke_detector': 'smoke-detector-stats',
                        'emergency_light': 'emergency-lighting-stats',
                        'hydrant': 'hydrant-stats',
                        'fpca': 'fire-alarm-panel-stats',
                        'locations-table': 'locations-table',
                      };
                      const page = codeToPage[code] || 'grid';
                      if (filter) {
                        setStatusFilter(filter);
                      } else {
                        setStatusFilter('all');
                      }
                      if (moduleFilter) {
                        setSelectedModuleFilter(moduleFilter);
                      } else {
                        setSelectedModuleFilter('all');
                      }
                      setActivePage(page);
                    }}
                  />
                ) : user?.role === 'admin' && activePage !== 'equipment-grid' ? (
                  <AdminOverview
                    user={user}
                    allModules={filteredModules}
                    moduleSummaries={moduleSummariesMap}
                    onNavigate={(code, filter, moduleFilter) => {
                      const codeToPage = {
                        'grid': 'grid',
                        'equipment-grid': 'equipment-grid',
                        'setup-company': 'setup-company',
                        'users-manage': 'users-manage',
                        'pending-updates': 'pending-updates',
                        'reports': 'reports',
                        'fire_extinguisher': 'fire-stats',
                        'sprinkler': 'sprinkler-stats',
                        'hose_reel': 'hose-stats',
                        'smoke_detector': 'smoke-detector-stats',
                        'emergency_light': 'emergency-lighting-stats',
                        'hydrant': 'hydrant-stats',
                        'fpca': 'fire-alarm-panel-stats',
                        'locations-table': 'locations-table',
                      };
                      const page = codeToPage[code] || 'grid';
                      if (filter) {
                        setStatusFilter(filter);
                      } else {
                        setStatusFilter('all');
                      }
                      if (moduleFilter) {
                        setSelectedModuleFilter(moduleFilter);
                      } else {
                        setSelectedModuleFilter('all');
                      }
                      setActivePage(page);
                    }}
                  />
                ) : user?.role === 'agm' && activePage !== 'equipment-grid' ? (
                  <AgmOverview
                    user={user}
                    allModules={filteredModules}
                    moduleSummaries={moduleSummariesMap}
                    onNavigate={(code, filter, moduleFilter) => {
                      const codeToPage = {
                        'grid': 'grid',
                        'equipment-grid': 'equipment-grid',
                        'setup-company': 'setup-company',
                        'users-manage': 'users-manage',
                        'pending-updates': 'pending-updates',
                        'reports': 'reports',
                        'fire_extinguisher': 'fire-stats',
                        'sprinkler': 'sprinkler-stats',
                        'hose_reel': 'hose-stats',
                        'smoke_detector': 'smoke-detector-stats',
                        'emergency_light': 'emergency-lighting-stats',
                        'hydrant': 'hydrant-stats',
                        'fpca': 'fire-alarm-panel-stats',
                      };
                      const page = codeToPage[code] || 'grid';
                      if (filter) {
                        setStatusFilter(filter);
                      } else {
                        setStatusFilter('all');
                      }
                      if (moduleFilter) {
                        setSelectedModuleFilter(moduleFilter);
                      } else {
                        setSelectedModuleFilter('all');
                      }
                      setActivePage(page);
                    }}
                  />
                ) : user?.role === 'supervisor' && activePage !== 'equipment-grid' ? (
                  <SupervisorOverview
                    user={user}
                    allModules={filteredModules}
                    moduleSummaries={moduleSummariesMap}
                    onNavigate={(code, filter, moduleFilter) => {
                      const codeToPage = {
                        'grid': 'grid',
                        'equipment-grid': 'equipment-grid',
                        'setup-company': 'setup-company',
                        'users-manage': 'users-manage',
                        'pending-updates': 'pending-updates',
                        'reports': 'reports',
                        'fire_extinguisher': 'fire-stats',
                        'sprinkler': 'sprinkler-stats',
                        'hose_reel': 'hose-stats',
                        'smoke_detector': 'smoke-detector-stats',
                        'emergency_light': 'emergency-lighting-stats',
                        'hydrant': 'hydrant-stats',
                        'fpca': 'fire-alarm-panel-stats',
                      };
                      const page = codeToPage[code] || 'grid';
                      if (filter) {
                        setStatusFilter(filter);
                      } else {
                        setStatusFilter('all');
                      }
                      if (moduleFilter) {
                        setSelectedModuleFilter(moduleFilter);
                      } else {
                        setSelectedModuleFilter('all');
                      }
                      setActivePage(page);
                    }}
                  />
                ) : (user?.role === 'inspector' || user?.role === 'user') && activePage !== 'equipment-grid' ? (
                  <InspectorOverview
                    user={user}
                    allModules={filteredModules}
                    moduleSummaries={moduleSummariesMap}
                    onNavigate={(code, filter, moduleFilter) => {
                      const codeToPage = {
                        'grid': 'grid',
                        'equipment-grid': 'equipment-grid',
                        'setup-company': 'setup-company',
                        'users-manage': 'users-manage',
                        'pending-updates': 'pending-updates',
                        'reports': 'reports',
                        'fire_extinguisher': 'fire-stats',
                        'sprinkler': 'sprinkler-stats',
                        'hose_reel': 'hose-stats',
                        'smoke_detector': 'smoke-detector-stats',
                        'emergency_light': 'emergency-lighting-stats',
                        'hydrant': 'hydrant-stats',
                        'fpca': 'fire-alarm-panel-stats',
                      };
                      const page = codeToPage[code] || 'grid';
                      if (filter) {
                        setStatusFilter(filter);
                      } else {
                        setStatusFilter('all');
                      }
                      if (moduleFilter) {
                        setSelectedModuleFilter(moduleFilter);
                      } else {
                        setSelectedModuleFilter('all');
                      }
                      setActivePage(page);
                    }}
                  />
                ) : (
                  <>
                    {activePage === 'equipment-grid' && (
                      <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 4px 8px', boxSizing: 'border-box' }}>
                        <button
                          onClick={() => {
                            setSelectedModuleFilter('all');
                            setStatusFilter('all');
                            setActivePage('grid');
                          }}
                          title="Back to Overview"
                          style={{
                            background: 'rgba(255, 255, 255, 0.25)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '26px',
                            height: '26px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#111827'
                          }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                            <path d="M19 12H5M12 5l-7 7 7 7" />
                          </svg>
                        </button>
                        <h1 className="sao-page-title" style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>Safety Equipments</h1>
                      </div>
                    )}

                    {/* Onboarding setup banner — admin only, shown while companies are still being set up */}
                    {activePage !== 'equipment-grid' && adminCompanies.length === 0 && !appLoading && (
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
                    <div className={`overview-summary-card ${(user?.role === 'user' || user?.role === 'inspector') ? 'inspector-mode' : ''}`}>
                      <div className="osc-section" style={{ flex: 1, alignItems: (user?.role === 'user' || user?.role === 'inspector') ? 'center' : 'flex-start' }}>
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
                        <div className="osc-sys-health" style={{ minWidth: '150px', flexDirection: 'column', gap: '6px', paddingTop: '4px' }}>
                          <svg width="190" height="110" viewBox="0 0 112 64" fill="none" role="img">
                            <path d="M10 58 A46 46 0 0 1 102 58" stroke="rgba(0,0,0,0.1)" strokeWidth="10" strokeLinecap="round" fill="none" />
                            <path d="M10 58 A46 46 0 0 1 102 58"
                              stroke={preparednessScore >= 90 ? '#2ecc71' : preparednessScore >= 80 ? '#f39c12' : '#e74c3c'}
                              strokeWidth="10" strokeLinecap="round" fill="none"
                              strokeDasharray="144.5" strokeDashoffset={144.5 * (1 - preparednessScore / 100)} />
                            <text x="56" y="55" textAnchor="middle" style={{ fill: '#111827', fontWeight: '900', fontSize: '26px' }}>{preparednessScore}%</text>
                          </svg>
                          <div style={{
                            fontSize: '15px',
                            fontWeight: '800',
                            marginTop: '2px',
                            color: preparednessScore >= 90 ? '#2ecc71' : preparednessScore >= 80 ? '#f39c12' : '#e74c3c'
                          }}>
                            {preparednessScore >= 90 ? 'System Healthy' : preparednessScore >= 80 ? 'System Warning' : 'System Critical'}
                          </div>
                        </div>
                      </div>

                      {!(user?.role === 'user' || user?.role === 'inspector') && (
                        <>
                          <div className="osc-divider"></div>
                          <div className="osc-section" style={{ flex: 1, alignItems: 'center' }}>
                            <span className="osc-label">Pending Approvals:</span>
                            <div className="osc-info-text" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '24px', fontWeight: '900', color: '#f39c12', marginTop: '8px' }}>
                              <span className="osc-symbol" style={{ fontSize: '28px' }}>📋</span>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0px' }}>
                                <span style={{ lineHeight: '1' }}>{pendingApprovalsCount}</span>
                                <span style={{ fontSize: '10px', color: '#6c757d', fontWeight: '800', textTransform: 'uppercase', marginTop: '2px', letterSpacing: '0.5px' }}>Approvals</span>
                              </div>
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ width: '14px', height: '14px', color: '#adb5bd', marginLeft: '2px', cursor: 'pointer', transition: 'color 0.2s' }}
                                onClick={() => setActivePage('pending-updates')}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#495057'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#adb5bd'}
                                title="View Pending Approvals"
                              >
                                <path d="M9 18l6-6-6-6" />
                              </svg>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Team Daily Activity Tracker — Supervisor Only */}
                    {activePage !== 'equipment-grid' && user?.role === 'supervisor' && teamActivities.length > 0 && (
                      <div className="supervisor-tracker-card">
                        <div className="stc-header">
                          <h3>👥 Team Daily Activity Tracker</h3>
                          <span className="stc-date">Today: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="stc-body">
                          {teamActivities.map(act => (
                            <div key={act.id} className={`stc-item ${act.status.toLowerCase()}`}>
                              <div className="stc-user-info">
                                <div className="stc-avatar">{(act.name).charAt(0).toUpperCase()}</div>
                                <div>
                                  <div className="stc-name">{act.name}</div>
                                  <div className="stc-role">{act.role.toUpperCase()}</div>
                                </div>
                              </div>

                              <div className="stc-stat">
                                <span className="stc-stat-label">Tasks Done Today</span>
                                <span className="stc-stat-val">{act.inspectionsCount}</span>
                              </div>

                              <div className="stc-stat">
                                <span className="stc-stat-label">Last Activity</span>
                                <span className="stc-stat-val">{act.lastActive}</span>
                              </div>

                              <div className="stc-stat">
                                <span className="stc-stat-label">Last Inspected</span>
                                <span className="stc-stat-val">{act.lastModule}</span>
                              </div>

                              <div className={`stc-badge ${act.status.toLowerCase()}`}>
                                {act.status === 'Active' ? '✓ COMPLETED' : '⏳ PENDING'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="eq-grid">
                      {filteredModules
                        .filter(m => selectedModuleFilter === 'all' || m.code === selectedModuleFilter)
                        .filter(m => statusFilter === 'all' || getStatus(m) === statusFilter)
                        .map((mod) => (
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
                  </>
                )}
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
              {activePage === 'fire-stats' && <FireExtinguisherStats module={selectedEq} onBack={() => setActivePage(statsBackPage)} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'sprinkler-stats' ? 'active' : ''}`}>
              {activePage === 'sprinkler-stats' && <SprinklerStats module={selectedEq} onBack={() => setActivePage(statsBackPage)} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'hose-stats' ? 'active' : ''}`}>
              {activePage === 'hose-stats' && <HoseReelStats module={selectedEq} onBack={() => setActivePage(statsBackPage)} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'drum-stats' ? 'active' : ''}`}>
              {activePage === 'drum-stats' && <DrumHoseStats module={selectedEq} onBack={() => setActivePage(statsBackPage)} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'hydrant-stats' ? 'active' : ''}`}>
              {activePage === 'hydrant-stats' && <HydrantStats module={selectedEq} onBack={() => setActivePage(statsBackPage)} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'fire-trolley-stats' ? 'active' : ''}`}>
              {activePage === 'fire-trolley-stats' && <FireTrolleyStats module={selectedEq} onBack={() => setActivePage(statsBackPage)} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'suppression-system-stats' ? 'active' : ''}`}>
              {activePage === 'suppression-system-stats' && <SuppressionSystemStats module={selectedEq} onBack={() => setActivePage(statsBackPage)} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'fire-blanket-stats' ? 'active' : ''}`}>
              {activePage === 'fire-blanket-stats' && <FireBlanketStats module={selectedEq} onBack={() => setActivePage(statsBackPage)} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'fire-alarm-panel-stats' ? 'active' : ''}`}>
              {activePage === 'fire-alarm-panel-stats' && <FireAlarmPanelStats module={selectedEq} onBack={() => setActivePage(statsBackPage)} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'smoke-detector-stats' ? 'active' : ''}`}>
              {activePage === 'smoke-detector-stats' && <SmokeDetectorStats module={selectedEq} onBack={() => setActivePage(statsBackPage)} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'heat-detector-stats' ? 'active' : ''}`}>
              {activePage === 'heat-detector-stats' && <HeatDetectorStats module={selectedEq} onBack={() => setActivePage(statsBackPage)} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'emergency-exit-stats' ? 'active' : ''}`}>
              {activePage === 'emergency-exit-stats' && <EmergencyExitStats module={selectedEq} onBack={() => setActivePage(statsBackPage)} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'co-detector-stats' ? 'active' : ''}`}>
              {activePage === 'co-detector-stats' && <CODetectorStats module={selectedEq} onBack={() => setActivePage(statsBackPage)} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'fire-door-stats' ? 'active' : ''}`}>
              {activePage === 'fire-door-stats' && <FireDoorStats module={selectedEq} onBack={() => setActivePage(statsBackPage)} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'emergency-lighting-stats' ? 'active' : ''}`}>
              {activePage === 'emergency-lighting-stats' && <EmergencyLightingStats module={selectedEq} onBack={() => setActivePage(statsBackPage)} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'pa-siren-stats' ? 'active' : ''}`}>
              {activePage === 'pa-siren-stats' && <PASirenStats module={selectedEq} onBack={() => setActivePage(statsBackPage)} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'wind-sock-stats' ? 'active' : ''}`}>
              {activePage === 'wind-sock-stats' && <WindSockStats module={selectedEq} onBack={() => setActivePage(statsBackPage)} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'scba-stats' ? 'active' : ''}`}>
              {activePage === 'scba-stats' && <SCBAStats module={selectedEq} onBack={() => setActivePage(statsBackPage)} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'ambulance-stats' ? 'active' : ''}`}>
              {activePage === 'ambulance-stats' && <AmbulanceStats module={selectedEq} onBack={() => setActivePage(statsBackPage)} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'first-aid-stats' ? 'active' : ''}`}>
              {activePage === 'first-aid-stats' && <FirstAidBoxStats module={selectedEq} onBack={() => setActivePage(statsBackPage)} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'emergency-shower-stats' ? 'active' : ''}`}>
              {activePage === 'emergency-shower-stats' && <EmergencyShowerStats module={selectedEq} onBack={() => setActivePage(statsBackPage)} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'eyewash-station-stats' ? 'active' : ''}`}>
              {activePage === 'eyewash-station-stats' && <EyewashStationStats module={selectedEq} onBack={() => setActivePage(statsBackPage)} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'chemical-shower-stats' ? 'active' : ''}`}>
              {activePage === 'chemical-shower-stats' && <ChemicalShowerStats module={selectedEq} onBack={() => setActivePage(statsBackPage)} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'spill-kit-stats' ? 'active' : ''}`}>
              {activePage === 'spill-kit-stats' && <SpillKitStats module={selectedEq} onBack={() => setActivePage(statsBackPage)} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'ppe-station-stats' ? 'active' : ''}`}>
              {activePage === 'ppe-station-stats' && <PPEStationStats module={selectedEq} onBack={() => setActivePage(statsBackPage)} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'safety-signage-stats' ? 'active' : ''}`}>
              {activePage === 'safety-signage-stats' && <SafetySignageStats module={selectedEq} onBack={() => setActivePage(statsBackPage)} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'emergency-comm-stats' ? 'active' : ''}`}>
              {activePage === 'emergency-comm-stats' && <EmergencyCommStats module={selectedEq} onBack={() => setActivePage(statsBackPage)} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'muster-point-stats' ? 'active' : ''}`}>
              {activePage === 'muster-point-stats' && <MusterPointStats module={selectedEq} onBack={() => setActivePage(statsBackPage)} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'fire-brigade-stats' ? 'active' : ''}`}>
              {activePage === 'fire-brigade-stats' && <FireBrigadeStats module={selectedEq} onBack={() => setActivePage(statsBackPage)} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'volunteer-stats' ? 'active' : ''}`}>
              {activePage === 'volunteer-stats' && <VolunteerStats module={selectedEq} onBack={() => setActivePage(statsBackPage)} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'shift-volunteer-stats' ? 'active' : ''}`}>
              {activePage === 'shift-volunteer-stats' && <ShiftVolunteerStats module={selectedEq} onBack={() => setActivePage(statsBackPage)} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'trained-shift-stats' ? 'active' : ''}`}>
              {activePage === 'trained-shift-stats' && <TrainedShiftStats module={selectedEq} onBack={() => setActivePage(statsBackPage)} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'fire-noc-stats' ? 'active' : ''}`}>
              {activePage === 'fire-noc-stats' && <FireNocStats module={selectedEq} onBack={() => setActivePage(statsBackPage)} onScroll={handleScroll} />}
            </section>

            {/* ── REPORTS ── */}
            <section className={`page ${activePage === 'reports' ? 'active' : ''}`}>
              {activePage === 'reports' && <Reports onBack={() => setActivePage('grid')} allowedModules={filteredModules} />}
            </section>



            {/* ── PENDING APPROVALS ── */}
            <section className={`page ${activePage === 'pending-updates' ? 'active' : ''}`}>
              {activePage === 'pending-updates' && user?.role !== 'user' && (
                <PendingApprovals user={user} onBack={() => setActivePage('grid')} allowedModules={filteredModules} />
              )}
            </section>

            {/* ── AUTO-SCHEDULER ── */}
            <section className={`page ${activePage === 'auto-scheduler' ? 'active' : ''}`}>
              {activePage === 'auto-scheduler' && (
                <AutoScheduler modules={filteredModules} onBack={() => setActivePage('grid')} />
              )}
            </section>

            {/* ── MODULE MANAGEMENT ── */}
            <section className={`page ${activePage === 'setup-modules' ? 'active' : ''}`}>
              {activePage === 'setup-modules' && <ModuleManagement onBack={() => setActivePage('grid')} />}
            </section>

            {/* ── AUDIT LOGS ── */}
            <section className={`page ${activePage === 'audit-logs' ? 'active' : ''}`}>
              {activePage === 'audit-logs' && <AuditLog onBack={() => setActivePage('grid')} allowedModules={filteredModules} />}
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
                  onSuccess={() => {
                    setActivePage('grid');
                    setRefreshKey(prev => prev + 1);
                  }}
                />
              )}
            </section>

            {/* ── SETUP: COMPANY MANAGEMENT ── */}
            <section className={`page ${activePage === 'setup-company' ? 'active' : ''}`}>
              {activePage === 'setup-company' && (
                <CompanyManagement onBack={() => setActivePage('grid')} onNavigate={setActivePage} />
              )}
            </section>

            {/* ── LOCATIONS TABLE ── */}
            <section className={`page ${activePage === 'locations-table' ? 'active' : ''}`}>
              {activePage === 'locations-table' && (
                <LocationsTable user={user} onBack={() => setActivePage('grid')} />
              )}
            </section>

            {/* ── SETUP: OPERATOR MAPPING ── */}
            <section className={`page ${activePage === 'setup-operator-mapping' ? 'active' : ''}`}>
              {activePage === 'setup-operator-mapping' && (
                <OperatorMapping onBack={() => setActivePage('grid')} />
              )}
            </section>

            {/* ── SETUP: EMAIL DOMAINS ── */}
            <section className={`page ${activePage === 'setup-domains' ? 'active' : ''}`}>
              {activePage === 'setup-domains' && (
                <EmailDomains onBack={() => setActivePage('setup-company')} />
              )}
            </section>

            {/* ── USERS: MANAGE ── */}
            <section className={`page ${activePage === 'users-manage' ? 'active' : ''}`}>
              {activePage === 'users-manage' && (
                <UserManagement
                  onBack={() => setActivePage('grid')}
                  allowedModules={filteredModules}
                  navAccess={navAccessList}
                  onViewEquipmentAccess={(userId) => {
                    setEaInitialSelectedUserId(userId);
                    setActivePage('users-equipment-access');
                  }}
                />
              )}
            </section>

            <section className={`page ${activePage === 'users-equipment-access' ? 'active' : ''}`}>
              {activePage === 'users-equipment-access' && (
                <EquipmentAccess
                  onBack={() => {
                    setEaInitialSelectedUserId(null);
                    setActivePage('users-manage');
                  }}
                  availableModules={filteredModules}
                  initialSelectedUserId={eaInitialSelectedUserId}
                  onOpenModule={(mod) => handleOpenModule(mod)}
                />
              )}
            </section>

            <section className={`page ${activePage === 'setup-shifts' ? 'active' : ''}`}>
              {activePage === 'setup-shifts' && (
                <ShiftManagement
                  onBack={() => setActivePage('grid')}
                />
              )}
            </section>


          </div>
        </main>
      </div>
    </div>
  );
};

export default SafetyDashboard;

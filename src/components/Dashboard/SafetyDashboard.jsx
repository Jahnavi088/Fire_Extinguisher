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
import Reports from './Reports';











const STATIC_MODULES = [
  { module_id: 1, name: 'Extinguishers', code: 'fire_extinguisher', health_score: 100, category: 'fire', image: '/images/fire_extinguisher.png' },
  { module_id: 2, name: 'Hose Reels', code: 'hose_reel', health_score: 92, category: 'fire', image: '/images/hose_reel.png' },
  { module_id: 3, name: 'Sprinklers', code: 'sprinkler', health_score: 93, category: 'fire', image: '/images/sprinkler.png' },
  { module_id: 4, name: 'Hydrants', code: 'hydrant', health_score: 92, category: 'fire', image: '/images/hydrant.png' },
  { module_id: 9, name: 'Alarm Panels', code: 'fpca', health_score: 92, category: 'fire', image: '/images/alarm_panel.png' },
  { module_id: 10, name: 'Smoke Det.', code: 'smoke_detector', health_score: 92, category: 'fire', image: '/images/smoke_detector.png' },
  { module_id: 6, name: 'Fire Trolley', code: 'fire_trolley', health_score: 100, category: 'fire', image: '/images/fire_trolley.png' },
  { module_id: 24, name: 'Exits', code: 'emergency_door', health_score: 92, category: 'fire', image: '/images/emergency_exit.png' },
  { module_id: 25, name: 'Lighting', code: 'emergency_light', health_score: 92, category: 'fire', image: '/images/emergency_lighting.png' },
  { module_id: 11, name: 'PA System', code: 'pa_system', health_score: 100, category: 'fire', image: '/images/pa_system.png' },
  { module_id: 12, name: 'Wind Sock', code: 'wind_sock', health_score: 100, category: 'chemical', image: '/images/wind_sock.png' },
  { module_id: 13, name: 'SCBA Units', code: 'scba', health_score: 100, category: 'chemical', image: '/images/scba.png' },
  { module_id: 14, name: 'Ambulance', code: 'ambulance', health_score: 100, category: 'chemical', image: '/images/ambulance.png' },
  { module_id: 15, name: 'First Aid', code: 'first_aid_kit', health_score: 93, category: 'chemical', image: '/images/first_aid.png' },
  { module_id: 16, name: 'Shower', code: 'safety_shower', health_score: 94, category: 'chemical', image: '/images/safety_shower.png' },
  { module_id: 17, name: 'Eye Wash', code: 'eyewash_station', health_score: 92, category: 'chemical', image: '/images/eye_wash.png' },
  { module_id: 26, name: 'Spill Kits', code: 'spill_kit', health_score: 92, category: 'chemical', image: '/images/spill_kit.png' },
  { module_id: 18, name: 'Chem Shower', code: 'chemical_shower', health_score: 100, category: 'chemical' },
  { module_id: 19, name: 'PPE Cabs', code: 'ppe_station', health_score: 94, category: 'chemical' },
  { module_id: 7, name: 'CO2 System', code: 'suppression_system', health_score: 94, category: 'fire' },
  { module_id: 27, name: 'Signage', code: 'safety_signage', health_score: 100, category: 'permit' },
  { module_id: 21, name: 'Comm.', code: 'emergency_comm', health_score: 100, category: 'permit' },
  { module_id: 8, name: 'Blankets', code: 'fire_blanket', health_score: 93, category: 'fire' },
  { module_id: 28, name: 'Muster Pt.', code: 'muster_point', health_score: 100, category: 'permit' },
  { module_id: 20, name: 'Fire Brigade', code: 'fire_brigade', health_score: 90, category: 'fire' },
  { module_id: 31, name: 'Volunteers', code: 'volunteers', health_score: 78, category: 'permit' },
  { module_id: 22, name: 'Shift Vol.', code: 'shift_volunteers', health_score: 72, category: 'permit' },
  { module_id: 23, name: 'Trained/Shift', code: 'trained_shift', health_score: 85, category: 'permit' },
  { module_id: 29, name: 'Fire NOC', code: 'fire_noc', health_score: 100, category: 'permit' },
  { module_id: 30, name: 'Suppression', code: 'suppression_system', health_score: 100, category: 'fire' },
];

const CHECKLIST_GENERIC_ICON = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>;

const CHECKLIST_MODULES = [
  { id: 30, name: 'Fire Extinguisher', code: 'fire_extinguisher', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4V2" /><path d="M15 7v2" /><path d="M8 10h8" /><path d="M8 14h8" /><path d="M7 18h10" /><path d="M9 2v3" /><path d="M11 2v3" /><rect x="5" y="5" width="14" height="17" rx="2" /></svg> },
  { id: 31, name: 'Sprinkler System', code: 'sprinkler', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4" /><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" /><path d="M12 16v6" /><path d="M8 12H2" /><path d="M22 12h-6" /></svg> },
  { id: 32, name: 'FPCA', code: 'fpca', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg> },
  { id: 33, name: 'Hose Reel', code: 'hose_reel', icon: CHECKLIST_GENERIC_ICON },
  { id: 34, name: 'Fire Hydrant', code: 'hydrant', icon: CHECKLIST_GENERIC_ICON },
  { id: 35, name: 'Fire Alarm Panel', code: 'fire_alarm_panel', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg> },
  { id: 36, name: 'Smoke Detector', code: 'smoke_detector', icon: CHECKLIST_GENERIC_ICON },
  { id: 37, name: 'Heat Detector', code: 'heat_detector', icon: CHECKLIST_GENERIC_ICON },
  { id: 38, name: 'Emergency Light', code: 'emergency_light', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 12h5" /><path d="M4 12h5" /><path d="M12 4v5" /><path d="M12 15v5" /><path d="m17 7 3-3" /><path d="m4 20 3-3" /><path d="m17 17 3 3" /><path d="m4 4 3 3" /></svg> },
  { id: 39, name: 'Exit Sign', code: 'exit_sign', icon: CHECKLIST_GENERIC_ICON },
  { id: 40, name: 'CO Detector', code: 'co_detector', icon: CHECKLIST_GENERIC_ICON },
  { id: 41, name: 'Fire Blanket', code: 'fire_blanket', icon: CHECKLIST_GENERIC_ICON },
  { id: 42, name: 'Suppression System', code: 'suppression_system', icon: CHECKLIST_GENERIC_ICON },
  { id: 43, name: 'Fire Door', code: 'fire_door', icon: CHECKLIST_GENERIC_ICON },
  { id: 44, name: 'PA System', code: 'pa_system', icon: CHECKLIST_GENERIC_ICON },
  { id: 45, name: 'First Aid Kit', code: 'first_aid_kit', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><line x1="12" y1="9" x2="12" y2="15" /><line x1="9" y1="12" x2="15" y2="12" /></svg> },
  { id: 46, name: 'Eyewash Station', code: 'eyewash_station', icon: CHECKLIST_GENERIC_ICON },
  { id: 47, name: 'Safety Shower', code: 'safety_shower', icon: CHECKLIST_GENERIC_ICON },
  { id: 48, name: 'Chemical Spill Kit', code: 'spill_kit', icon: CHECKLIST_GENERIC_ICON },
  { id: 49, name: 'PPE Station', code: 'ppe_station', icon: CHECKLIST_GENERIC_ICON },
  { id: 50, name: 'Chemical Shower', code: 'chemical_shower', icon: CHECKLIST_GENERIC_ICON },
  { id: 51, name: 'Safety Signage', code: 'safety_signage', icon: CHECKLIST_GENERIC_ICON },
  { id: 52, name: 'Emergency Comm.', code: 'emergency_comm', icon: CHECKLIST_GENERIC_ICON },
  { id: 53, name: 'Muster Point', code: 'muster_point', icon: CHECKLIST_GENERIC_ICON },
  { id: 54, name: 'Fire Brigade', code: 'fire_brigade', icon: CHECKLIST_GENERIC_ICON },
  { id: 55, name: 'Volunteers', code: 'volunteers', icon: CHECKLIST_GENERIC_ICON },
  { id: 56, name: 'Shift Vol.', code: 'shift_volunteers', icon: CHECKLIST_GENERIC_ICON },
  { id: 57, name: 'Trained/Shift', code: 'trained_shift', icon: CHECKLIST_GENERIC_ICON },
  { id: 58, name: 'Fire NOC', code: 'fire_noc', icon: CHECKLIST_GENERIC_ICON },
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

const SafetyDashboard = ({ user, onLogout }) => {
  const [activePage, setActivePage] = useState('grid');
  const [selectedEq, setSelectedEq] = useState(null);
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
  const [searchFilter, setSearchFilter] = useState('All');
  const [filterOpen, setFilterOpen] = useState(false);
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
  const lastScrollY = React.useRef(0);

  const filterOptions = [
    { label: 'All', icon: '🔍' },
    { label: 'Fire', icon: '🔥' },
    { label: 'Chemical', icon: '⚗️' },
    { label: 'Medical', icon: '🏥' },
    { label: 'Permits', icon: '📋' },
  ];

  const modules = STATIC_MODULES;
  const preparednessScore = 92;

  useEffect(() => {
    if (activePage !== 'checklist' || !selectedEq?.id) return;
    ApiService.getModuleChecklists(selectedEq.id)
      .then(d => {
        const list = Array.isArray(d) ? d : (d?.items || d?.data || d?.checklists || []);
        dispatchCl({ type: 'success', items: list });
      })
      .catch(() => dispatchCl({ type: 'error' }));
    dispatchCl({ type: 'loading' });
  }, [activePage, selectedEq]);

  useEffect(() => {
    ApiService.getAlertsSummary()
      .then((d) => setAlertCount(d.total_alerts || 0))
      .catch(() => setAlertCount(0));
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

  const filteredModules = useMemo(() => modules, [modules]);

  const totalItems = useMemo(() => {
    return activeChecklistItems.length;
  }, [activeChecklistItems]);

  const checkedCount = useMemo(() => {
    return Object.values(checkedItems).filter(Boolean).length;
  }, [checkedItems]);

  const progressPct = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;

  const getStatus = (score) => (score >= 90 ? 'healthy' : score >= 70 ? 'warning' : 'critical');

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
    if (!window.confirm('Are you sure you want to logout?')) return;
    try { await ApiService.logout(); } catch { /* logout failure is safe to ignore */ }
    onLogout();
  };

  const saveCo = () => alert(companyName.trim() ? `Company saved: ${companyName}` : 'Enter a company name first');

  const navGroups = [
    {
      label: 'MAIN',
      items: [
        {
          icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>,
          label: 'Overview',
          active: activePage === 'grid',
          onClick: () => setActivePage('grid')
        },
      ],
    },
    {
      label: 'OPERATIONS',
      items: [
        { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>, label: 'Incidents', badge: 'NEW' },
        { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>, label: 'Inspections' },
        { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>, label: 'Analytics' },
        { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>, label: 'Reports', active: activePage === 'reports', onClick: () => setActivePage('reports') },
      ],
    },
    {
      label: 'SYSTEM',
      items: [
        { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>, label: 'Settings' },
      ],
    },
  ];

  return (
    <div className={`dash ${navCollapsed ? 'sidebar-collapsed' : ''} ${!topbarVisible ? 'topbar-hidden' : ''}`} style={{ '--bg': bgColor }}>
      {/* ── TOPBAR (HEADER AT TOP) ────────────────────────────────────────── */}
      <header className="topbar">
        <div className="topbar-left">
          <div className="topbar-brand">
            <div className="topbar-logo-pill">
              <img src="/apitoria-logo.png" alt="Apitoria" className="topbar-logo" />
            </div>
            <div className="topbar-copy">
              <div className="tb-title">
                <span className="tb-brand-icon">🚨
                </span>
                Emergency Safety Dashboard
              </div>
              <div className="tb-subtitle">  Real-time fire &amp; safety monitoring</div>
            </div>
          </div>
        </div>

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

        <div className="tb-actions">
          <div className="tb-clock">
            <svg className="tb-clock-icon" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="tb-time-bold">{currentTime}</span>
          </div>
          <div className="bell-wrap">
            <span className="bell-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </span>
            <span className="bell-badge">{alertCount > 99 ? '99+' : alertCount || 0}</span>
          </div>
          <div className="status-badge">❤️ {preparednessScore}%</div>
<button className="panel-toggle-topbar-btn" onClick={() => setPanelVisible(!panelVisible)} title="Toggle info panel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          <div className="sidebar-head">
            <div className="sidebar-head-top">
              <button
                className="sidebar-toggle-btn"
                onClick={() => setNavCollapsed(!navCollapsed)}
                title={navCollapsed ? 'Expand navigation' : 'Collapse navigation'}
              >
                <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg>
              </button>
            </div>
          </div>

          <nav className="sb-scroll">
            {navGroups.map((group) => (
              <React.Fragment key={group.label}>
                {group.items.map((item) => (
                  <div key={item.label} className={`nav-item ${item.active ? 'active' : ''}`} onClick={item.onClick || (() => { })}>
                    <div className="nav-left">
                      <span className="nav-icon">{item.icon}</span>
                      {!navCollapsed && <span className="nav-label">{item.label}</span>}
                    </div>
                    {!navCollapsed && item.badge && <span className="nav-badge">{item.badge}</span>}
                  </div>
                ))}
              </React.Fragment>
            ))}

            {/* CHECKLISTS DROPDOWN */}
            <div className={`nav-item dropdown-toggle ${checklistsDropdownOpen ? 'open' : ''}`} onClick={(e) => { e.stopPropagation(); setChecklistsDropdownOpen(!checklistsDropdownOpen); }}>
              <div className="nav-left">
                <span className="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /><path d="M9 14l2 2 4-4" /></svg></span>
                {!navCollapsed && <span className="nav-label">Checklists</span>}
              </div>
              {!navCollapsed && (
                <svg className={`nav-chevron ${checklistsDropdownOpen ? 'rotated' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              )}
            </div>

            <div className={`nav-submenu ${checklistsDropdownOpen && !navCollapsed ? 'open' : ''}`}>

              {CHECKLIST_MODULES.map((mod) => (
                <div
                  key={mod.id}
                  className={`nav-submenu-item ${selectedEq?.id === mod.id && activePage === 'checklist' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedEq(mod);
                    setActivePage('checklist');
                  }}
                >
                  <span className="nav-icon-small">{mod.icon}</span>
                  <span className="nav-label-small">{mod.name}</span>
                </div>
              ))}
              {checklists.length > 0 && (
                <>
                  <div className="nav-divider-small" />
                  <div className="nav-submenu-label">GENERAL CHECKLISTS</div>
                  {checklists.map((cl) => (
                    <div key={cl.id} className="nav-submenu-item" onClick={() => { setSelectedEq(cl); setActivePage('checklist'); }}>
                      <span className="nav-icon-small">📄</span>
                      <span className="nav-label-small">{cl.name || cl.title || 'Checklist'}</span>
                    </div>
                  ))}
                </>
              )}
              {checklists.length === 0 && (
                <div className="nav-submenu-empty">No additional checklists</div>
              )}
            </div>

            {/* SETUP DROPDOWN */}
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
              <div
                className={`nav-submenu-item ${activePage === 'setup-company' ? 'active' : ''}`}
                onClick={() => setActivePage('setup-company')}
              >
                <span className="nav-icon-small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" /></svg></span>
                <span className="nav-label-small">Add Company</span>
              </div>
              <div
                className={`nav-submenu-item ${activePage === 'setup-equipment' ? 'active' : ''}`}
                onClick={() => setActivePage('setup-equipment')}
              >
                <span className="nav-icon-small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg></span>
                <span className="nav-label-small">Add Equipment</span>
              </div>
            </div>

            {/* USERS DROPDOWN */}
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
              <div
                className={`nav-submenu-item ${activePage === 'users-manage' ? 'active' : ''}`}
                onClick={() => setActivePage('users-manage')}
              >
                <span className="nav-icon-small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="16" y1="11" x2="22" y2="11" /></svg></span>
                <span className="nav-label-small">Manage</span>
              </div>
              <div
                className={`nav-submenu-item ${activePage === 'users-equipment-access' ? 'active' : ''}`}
                onClick={() => setActivePage('users-equipment-access')}
              >
                <span className="nav-icon-small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg></span>
                <span className="nav-label-small">Equipment Access</span>
              </div>
            </div>
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
                <div className="eq-grid">
                  {filteredModules.map((mod) => (
                    <div key={mod.module_id} className={`eq-card ${getStatus(mod.health_score)}`} onClick={() => handleOpenModule(mod)}>
                      <div className="eq-icon">
                        {MODULE_EMOJI[mod.code] || '📦'}
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
                <div className="cl-header">
                  <button className="cl-back-btn" onClick={() => setActivePage('grid')}>← Back</button>
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
              {activePage === 'fire-stats' && <FireExtinguisherStats onBack={() => setActivePage('grid')} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'sprinkler-stats' ? 'active' : ''}`}>
              {activePage === 'sprinkler-stats' && <SprinklerStats onBack={() => setActivePage('grid')} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'hose-stats' ? 'active' : ''}`}>
              {activePage === 'hose-stats' && <HoseReelStats onBack={() => setActivePage('grid')} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'drum-stats' ? 'active' : ''}`}>
              {activePage === 'drum-stats' && <DrumHoseStats onBack={() => setActivePage('grid')} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'hydrant-stats' ? 'active' : ''}`}>
              {activePage === 'hydrant-stats' && <HydrantStats onBack={() => setActivePage('grid')} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'fire-trolley-stats' ? 'active' : ''}`}>
              {activePage === 'fire-trolley-stats' && <FireTrolleyStats onBack={() => setActivePage('grid')} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'suppression-system-stats' ? 'active' : ''}`}>
              {activePage === 'suppression-system-stats' && <SuppressionSystemStats onBack={() => setActivePage('grid')} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'fire-blanket-stats' ? 'active' : ''}`}>
              {activePage === 'fire-blanket-stats' && <FireBlanketStats onBack={() => setActivePage('grid')} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'fire-alarm-panel-stats' ? 'active' : ''}`}>
              {activePage === 'fire-alarm-panel-stats' && <FireAlarmPanelStats onBack={() => setActivePage('grid')} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'smoke-detector-stats' ? 'active' : ''}`}>
              {activePage === 'smoke-detector-stats' && <SmokeDetectorStats onBack={() => setActivePage('grid')} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'pa-siren-stats' ? 'active' : ''}`}>
              {activePage === 'pa-siren-stats' && <PASirenStats onBack={() => setActivePage('grid')} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'wind-sock-stats' ? 'active' : ''}`}>
              {activePage === 'wind-sock-stats' && <WindSockStats onBack={() => setActivePage('grid')} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'scba-stats' ? 'active' : ''}`}>
              {activePage === 'scba-stats' && <SCBAStats onBack={() => setActivePage('grid')} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'ambulance-stats' ? 'active' : ''}`}>
              {activePage === 'ambulance-stats' && <AmbulanceStats onBack={() => setActivePage('grid')} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'first-aid-stats' ? 'active' : ''}`}>
              {activePage === 'first-aid-stats' && <FirstAidBoxStats onBack={() => setActivePage('grid')} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'emergency-shower-stats' ? 'active' : ''}`}>
              {activePage === 'emergency-shower-stats' && <EmergencyShowerStats onBack={() => setActivePage('grid')} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'eyewash-station-stats' ? 'active' : ''}`}>
              {activePage === 'eyewash-station-stats' && <EyewashStationStats onBack={() => setActivePage('grid')} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'chemical-shower-stats' ? 'active' : ''}`}>
              {activePage === 'chemical-shower-stats' && <ChemicalShowerStats onBack={() => setActivePage('grid')} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'spill-kit-stats' ? 'active' : ''}`}>
              {activePage === 'spill-kit-stats' && <SpillKitStats onBack={() => setActivePage('grid')} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'ppe-station-stats' ? 'active' : ''}`}>
              {activePage === 'ppe-station-stats' && <PPEStationStats onBack={() => setActivePage('grid')} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'safety-signage-stats' ? 'active' : ''}`}>
              {activePage === 'safety-signage-stats' && <SafetySignageStats onBack={() => setActivePage('grid')} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'emergency-comm-stats' ? 'active' : ''}`}>
              {activePage === 'emergency-comm-stats' && <EmergencyCommStats onBack={() => setActivePage('grid')} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'muster-point-stats' ? 'active' : ''}`}>
              {activePage === 'muster-point-stats' && <MusterPointStats onBack={() => setActivePage('grid')} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'fire-brigade-stats' ? 'active' : ''}`}>
              {activePage === 'fire-brigade-stats' && <FireBrigadeStats onBack={() => setActivePage('grid')} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'volunteer-stats' ? 'active' : ''}`}>
              {activePage === 'volunteer-stats' && <VolunteerStats onBack={() => setActivePage('grid')} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'shift-volunteer-stats' ? 'active' : ''}`}>
              {activePage === 'shift-volunteer-stats' && <ShiftVolunteerStats onBack={() => setActivePage('grid')} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'trained-shift-stats' ? 'active' : ''}`}>
              {activePage === 'trained-shift-stats' && <TrainedShiftStats onBack={() => setActivePage('grid')} onScroll={handleScroll} />}
            </section>
            <section className={`page ${activePage === 'fire-noc-stats' ? 'active' : ''}`}>
              {activePage === 'fire-noc-stats' && <FireNocStats onBack={() => setActivePage('grid')} onScroll={handleScroll} />}
            </section>

            {/* ── REPORTS ── */}
            <section className={`page ${activePage === 'reports' ? 'active' : ''}`}>
              {activePage === 'reports' && <Reports onBack={() => setActivePage('grid')} />}
            </section>

            {/* ── SETUP: COMPANY MANAGEMENT ── */}
            <section className={`page ${activePage === 'setup-company' ? 'active' : ''}`}>
              {activePage === 'setup-company' && (
                <CompanyManagement onBack={() => setActivePage('grid')} />
              )}
            </section>

            {/* ── SETUP: ADD EQUIPMENT ── */}
            <section className={`page ${activePage === 'setup-equipment' ? 'active' : ''}`}>
              <div className="setup-page" onScroll={handleScroll}>
                <div className="setup-header">
                  <button className="setup-back-btn" onClick={() => setActivePage('grid')}>← Back</button>
                  <div className="setup-header-info">
                    <div className="setup-header-icon">🔧</div>
                    <div>
                      <div className="setup-title">Add Equipment</div>
                      <div className="setup-subtitle">Register new safety equipment to the monitoring system</div>
                    </div>
                  </div>
                </div>
                <div className="setup-body">
                  <div className="setup-form-card">
                    <div className="setup-form-section-label">Equipment Details</div>
                    <div className="setup-form-grid">
                      <div className="setup-field">
                        <label className="setup-label">Equipment Name <span className="setup-required">*</span></label>
                        <input className="setup-input" type="text" placeholder="e.g. Fire Extinguisher – Unit 12" />
                      </div>
                      <div className="setup-field">
                        <label className="setup-label">Equipment Type <span className="setup-required">*</span></label>
                        <select className="setup-input setup-select">
                          <option value="">Select type</option>
                          <option>Fire Extinguisher</option>
                          <option>Hose Reel</option>
                          <option>Sprinkler System</option>
                          <option>Fire Hydrant</option>
                          <option>Fire Alarm Panel</option>
                          <option>Smoke Detector</option>
                          <option>SCBA Unit</option>
                          <option>First Aid Kit</option>
                          <option>Emergency Shower</option>
                          <option>Eye Wash Station</option>
                          <option>Chemical Shower</option>
                          <option>Ambulance</option>
                          <option>Fire Blanket</option>
                          <option>PA / Siren System</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div className="setup-field">
                        <label className="setup-label">Brand / Model</label>
                        <input className="setup-input" type="text" placeholder="e.g. Amerex B500" />
                      </div>
                      <div className="setup-field">
                        <label className="setup-label">Serial Number</label>
                        <input className="setup-input" type="text" placeholder="Manufacturer serial no." />
                      </div>
                    </div>
                    <div className="setup-form-section-label" style={{ marginTop: 24 }}>Location &amp; Schedule</div>
                    <div className="setup-form-grid">
                      <div className="setup-field">
                        <label className="setup-label">Zone / Location <span className="setup-required">*</span></label>
                        <input className="setup-input" type="text" placeholder="e.g. Building A – Floor 2" />
                      </div>
                      <div className="setup-field">
                        <label className="setup-label">Company / Site</label>
                        <select className="setup-input setup-select">
                          <option value="">Select company</option>
                        </select>
                      </div>
                      <div className="setup-field">
                        <label className="setup-label">Installation Date</label>
                        <input className="setup-input" type="date" />
                      </div>
                      <div className="setup-field">
                        <label className="setup-label">Next Inspection Date</label>
                        <input className="setup-input" type="date" />
                      </div>
                    </div>
                    <div className="setup-form-actions">
                      <button className="setup-cancel-btn" onClick={() => setActivePage('grid')}>Cancel</button>
                      <button className="setup-save-btn">
                        <span>💾</span> Save Equipment
                      </button>
                    </div>
                  </div>
                </div>
              </div>
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
            companyName={companyName}
            setCompanyName={setCompanyName}
            saveCo={saveCo}
            shiftData={shiftData}
            drillTime={drillTime}
            handoverNotes={handoverNotes}
            setHandoverNotes={setHandoverNotes}
          />
        </main>
      </div>
    </div>
  );
};

export default SafetyDashboard;

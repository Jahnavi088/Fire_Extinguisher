import { useState, useEffect, useReducer, useMemo } from 'react';
import { ApiService } from '../../services/apiService';
import './UserManagement.css';

export const NAV_MODULES = [
  // --- MAIN ---
  { code: 'overview', label: 'Overview', icon: '🏠', category: 'Main' },

  // --- OPERATIONS ---
  { code: 'reports', label: 'Service Reports', icon: '📄', category: 'Operations' },
  { code: 'pending_updates', label: 'Pending Approvals', icon: '⏳', category: 'Operations' },
  { code: 'auto_scheduler', label: 'Auto-Scheduler', icon: '📅', category: 'Operations' },
  { code: 'shifts', label: 'Shift Management', icon: '⏰', category: 'Operations' },

  // --- SYSTEM & SECURITY ---
  { code: 'audit_logs', label: 'Audit Logs', icon: '📝', category: 'System & Security' },
  { code: 'device_monitoring', label: 'Device Monitoring', icon: '🖥️', category: 'System & Security' },

  // --- EQUIPMENT MODULES ---
  { code: 'fire_extinguisher', label: 'Fire Extinguishers', icon: '🧯', category: 'Modules' },
  { code: 'hose_reel', label: 'Hose Reels', icon: '🧵', category: 'Modules' },
  { code: 'sprinkler', label: 'Sprinklers', icon: '🚿', category: 'Modules' },
  { code: 'hydrant', label: 'Fire Hydrants', icon: '🚒', category: 'Modules' },
  { code: 'fpca', label: 'Alarm Panels', icon: '🔔', category: 'Modules' },
  { code: 'smoke_detector', label: 'Smoke Detectors', icon: '🌫️', category: 'Modules' },
  { code: 'heat_detector', label: 'Heat Detectors', icon: '🌡️', category: 'Modules' },
  { code: 'fire_trolley', label: 'Fire Trolleys', icon: '🛒', category: 'Modules' },
  { code: 'emergency_door', label: 'Emergency Exits', icon: '🚪', category: 'Modules' },
  { code: 'emergency_light', label: 'Emergency Lighting', icon: '🔦', category: 'Modules' },
  { code: 'pa_system', label: 'PA Systems', icon: '📢', category: 'Modules' },
  { code: 'wind_sock', label: 'Wind Socks', icon: '📍', category: 'Modules' },
  { code: 'scba', label: 'SCBA Units', icon: '🫁', category: 'Modules' },
  { code: 'ambulance', label: 'Ambulances', icon: '🚑', category: 'Modules' },
  { code: 'first_aid_kit', label: 'First Aid Kits', icon: '🏥', category: 'Modules' },
  { code: 'eyewash_station', label: 'Eye Wash Stations', icon: '👀', category: 'Modules' },
  { code: 'spill_kit', label: 'Spill Kits', icon: '⚗️', category: 'Modules' },
  { code: 'chemical_shower', label: 'Chemical Showers', icon: '🚿', category: 'Modules' },
  { code: 'ppe_station', label: 'PPE Stations', icon: '🦺', category: 'Modules' },
  { code: 'suppression_system', label: 'CO2 Systems', icon: '💨', category: 'Modules' },
  { code: 'safety_signage', label: 'Safety Signage', icon: '⚠️', category: 'Modules' },
  { code: 'emergency_comm', label: 'Emergency Comms', icon: '📞', category: 'Modules' },
  { code: 'fire_blanket', label: 'Fire Blankets', icon: '🧲', category: 'Modules' },
  { code: 'muster_point', label: 'Muster Points', icon: '📌', category: 'Modules' },
  { code: 'sand_bucket', label: 'Sand Buckets', icon: '🪣', category: 'Modules' },

  // --- SETUP ---
  { code: 'add_company', label: 'Add Company', icon: '🏢', category: 'Setup' },
  { code: 'add_equipment', label: 'Onboarding', icon: '🚀', category: 'Setup' },

  // --- USERS ---
  { code: 'user_manage', label: 'User Management', icon: '👥', category: 'Users' },
  { code: 'equipment_access', label: 'Equipment Access', icon: '🔐', category: 'Users' },
];
export const NAV_CATEGORIES = ['Main', 'Operations', 'System & Security', 'Modules', 'Setup', 'Users'];

const ROLE_CONFIG = {
  superadmin: { label: 'Superadmin', color: '#5fd3f3', bg: 'rgba(95,211,243,0.18)' },
  admin: { label: 'Admin', color: '#FFD700', bg: 'rgba(255,215,0,0.18)' },
  agm: { label: 'Asst. General Manager', color: '#c084fc', bg: 'rgba(192,132,252,0.18)' },
  supervisor: { label: 'Supervisor', color: '#34d399', bg: 'rgba(52,211,153,0.18)' },
  inspector: { label: 'Inspector', color: '#a0cfe8', bg: 'rgba(160,207,232,0.14)' },
};

const getRoleConf = (role) => {
  const r = (role || '').toLowerCase();
  return ROLE_CONFIG[r === 'user' ? 'inspector' : r] || ROLE_CONFIG.inspector;
};

const CODE_TO_ID = {
  fire_extinguisher: 30,
  hose_reel: 33,
  sprinkler: 31,
  hydrant: 34,
  fpca: 35,
  smoke_detector: 36,
  heat_detector: 37,
  fire_trolley: 55,
  emergency_door: 39,
  emergency_light: 38,
  pa_system: 44,
  wind_sock: 56,
  scba: 57,
  ambulance: 58,
  first_aid_kit: 45,
  eyewash_station: 46,
  spill_kit: 48,
  chemical_shower: 60,
  ppe_station: 49,
  suppression_system: 42,
  safety_signage: 62,
  emergency_comm: 61,
  fire_blanket: 41,
  muster_point: 59,
  sand_bucket: 63
};

const EMPTY_FORM = { name: '', username: '', email: '', password: '', role: 'inspector', status: 'active', company_id: '', shift_id: '', supervisor_id: '', agm_id: '', availability_status: 'active', leave_start_at: '', leave_end_at: '', leave_reason: '', branch_id: '', building_id: '', floor_id: '', zone_id: '', department_id: '' };
const ROLE_ORDER = ['superadmin', 'admin', 'agm', 'supervisor', 'inspector'];
const PAGE_SIZE = 10;

const calculateSimilarity = (companyName, emailDomain) => {
  if (!companyName || !emailDomain) return 0;

  // Extract main domain part (before first dot)
  const mainDomain = emailDomain.split('.')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanCompany = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (!mainDomain || !cleanCompany) return 0;

  // Find Longest Common Subsequence (LCS) length
  const m = mainDomain.length;
  const n = cleanCompany.length;
  const dp = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (mainDomain[i - 1] === cleanCompany[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const lcsLength = dp[m][n];
  const maxLen = Math.max(mainDomain.length, cleanCompany.length);
  const similarity = Math.round((lcsLength / maxLen) * 100);
  return similarity;
};

const getDomainFromEmail = (email) => {
  if (!email || !email.includes('@')) return '';
  const parts = email.split('@');
  return parts[parts.length - 1] || '';
};

const ensureArray = (val) => {
  if (Array.isArray(val)) return val;
  if (val && Array.isArray(val.users)) return val.users;
  if (val && Array.isArray(val.companies)) return val.companies;
  if (val && Array.isArray(val.shifts)) return val.shifts;
  if (val && Array.isArray(val.data)) return val.data;
  if (val && val.data && Array.isArray(val.data.users)) return val.data.users;
  if (val && val.data && Array.isArray(val.data.companies)) return val.data.companies;
  if (val && val.data && Array.isArray(val.data.shifts)) return val.data.shifts;
  return [];
};

function fetchReducer(state, action) {
  switch (action.type) {
    case 'loading': return { ...state, loading: true, error: null };
    case 'success': return { loading: false, error: null, users: action.users };
    case 'error': return { loading: false, error: action.error, users: [] };
    default: return state;
  }
}

const UserManagement = ({ onBack, allowedModules, navAccess, onViewEquipmentAccess }) => {
  const [fetchState, dispatch] = useReducer(fetchReducer, { loading: true, error: null, users: [] });
  const { loading, error, users } = fetchState;

  const loggedInUserStr = localStorage.getItem('user');
  const loggedInUser = loggedInUserStr ? JSON.parse(loggedInUserStr) : null;
  const isAGM = loggedInUser?.role === 'agm';
  const [roleAllowedModules, setRoleAllowedModules] = useState(null);

  const displayModules = useMemo(() => {
    let list = NAV_MODULES;

    if (roleAllowedModules) {
      list = list.filter(m => roleAllowedModules.has(m.code));
    } else if (navAccess && navAccess.length > 0) {
      const allowedCodes = new Set(navAccess);
      list = list.filter(m => allowedCodes.has(m.code));
    } else if (allowedModules) {
      const allowedCodes = new Set(allowedModules.map(m => m.code));
      list = list.filter(m => {
        if (m.category !== 'Modules') return true;
        return allowedCodes.has(m.code);
      });
    }

    return list;
  }, [allowedModules, navAccess, roleAllowedModules]);

  const displayCategories = useMemo(() => {
    return NAV_CATEGORIES.filter(cat =>
      displayModules.some(m => m.category === cat)
    );
  }, [displayModules]);

  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [companies, setCompanies] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [agms, setAgms] = useState([]);

  // Location hierarchy for user assignment
  const [branches, setBranches] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [zones, setZones] = useState([]);
  const [departments, setDepartments] = useState([]);

  const similarityWarning = useMemo(() => {
    if (!form.email || !form.email.trim() || !form.company_id) return null;
    const company = companies.find(c => String(c.id || c.company_id) === String(form.company_id));
    if (!company) return null;

    const companyName = company.name || company.company_name;
    const emailDomain = getDomainFromEmail(form.email.trim());
    if (!emailDomain) return null;

    const similarity = calculateSimilarity(companyName, emailDomain);
    if (similarity < 50) {
      return `Company name and email domain must match at least 50%. Company name: '${companyName}', Email Domain: '${emailDomain}' (Similarity: ${similarity}%)`;
    }
    return null;
  }, [form.email, form.company_id, companies]);

  const [viewUser, setViewUser] = useState(null);
  const [modLoading, setModLoading] = useState(false);
  const [moduleChecks, setModuleChecks] = useState({});
  const [initialChecks, setInitialChecks] = useState({});
  const [userAssignments, setUserAssignments] = useState([]);
  const [modSaving, setModSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showPasswordText, setShowPasswordText] = useState(false);


  useEffect(() => {
    let active = true;
    dispatch({ type: 'loading' });

    ApiService.getAdminCompanies()
      .then(data => {
        if (active) setCompanies(ensureArray(data));
      })
      .catch(() => { if (active) setCompanies([]); });

    ApiService.getAdminShifts()
      .then(data => {
        if (active) setShifts(ensureArray(data));
      })
      .catch(() => { if (active) setShifts([]); });

    ApiService.getAdminUsers({ role: 'supervisor' })
      .then(data => {
        if (active) setSupervisors(ensureArray(data));
      })
      .catch(() => { if (active) setSupervisors([]); });

    ApiService.getAdminUsers({ role: 'agm' })
      .then(data => {
        if (active) setAgms(ensureArray(data));
      })
      .catch(() => { if (active) setAgms([]); });

    ApiService.getAdminUsers()
      .then(data => {
        if (!active) return;
        dispatch({ type: 'success', users: ensureArray(data) });
      })
      .catch(err => {
        if (!active) return;
        dispatch({ type: 'error', error: err.message || 'Failed to load users' });
      });
    return () => { active = false; };
  }, [refreshKey]);

  // Cascading location loads when form is open
  useEffect(() => {
    if (!showForm) return;
    const cId = form.company_id;
    if (!cId) { setBranches([]); setBuildings([]); setFloors([]); setZones([]); setDepartments([]); return; }
    ApiService.getBranches({ company_id: cId })
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.branches || res?.data || []);
        setBranches(list);
      })
      .catch(() => setBranches([]));
    setBuildings([]); setFloors([]); setZones([]); setDepartments([]);
  }, [form.company_id, showForm]);

  useEffect(() => {
    if (!showForm || !form.branch_id) { setBuildings([]); setFloors([]); setZones([]); setDepartments([]); return; }
    ApiService.getBranchBuildings(form.branch_id)
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.buildings || res?.data || []);
        setBuildings(list);
      })
      .catch(() => setBuildings([]));
    setFloors([]); setZones([]); setDepartments([]);
  }, [form.branch_id, showForm]);

  useEffect(() => {
    if (!showForm || !form.building_id) { setFloors([]); setZones([]); setDepartments([]); return; }
    ApiService.getBuildingFloors(form.building_id)
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.floors || res?.data || []);
        setFloors(list);
      })
      .catch(() => setFloors([]));
    setZones([]); setDepartments([]);
  }, [form.building_id, showForm]);

  useEffect(() => {
    if (!showForm || !form.floor_id) { setZones([]); setDepartments([]); return; }
    ApiService.getFloorZones(form.floor_id)
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.zones || res?.data || []);
        setZones(list);
      })
      .catch(() => setZones([]));
    setDepartments([]);
  }, [form.floor_id, showForm]);

  useEffect(() => {
    if (!showForm || !form.zone_id) { setDepartments([]); return; }
    ApiService.getZoneDepartments(form.zone_id)
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.departments || res?.data || []);
        setDepartments(list);
      })
      .catch(() => setDepartments([]));
  }, [form.zone_id, showForm]);

  const filteredUsers = useMemo(() => {
    const activeUsers = users.filter(u => u.status !== 'inactive');
    const q = search.trim().toLowerCase();
    if (!q) return activeUsers;
    return activeUsers.filter(u =>
      (u.name || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    );
  }, [users, search]);

  useEffect(() => { setPage(1); }, [search]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const pagedUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);


  const openAdd = () => {
    setShowPasswordText(false);
    setEditUser(null);
    setForm({
      ...EMPTY_FORM,
      company_id: isAGM && loggedInUser?.company_id ? loggedInUser.company_id : '',
      branch_id: isAGM && loggedInUser?.branch_id ? loggedInUser.branch_id : ''
    });
    setFormError('');
    setShowForm(true);
  };

  const confirmDeleteUser = (u) => {
    setDeleteConfirm(u);
  };

  const executeDeleteUser = async () => {
    if (!deleteConfirm) return;
    try {
      await ApiService.deleteAdminUser(deleteConfirm.id);
      setRefreshKey(k => k + 1);
      showToast('User deleted successfully.');
    } catch (err) {
      showToast(err.message || 'Failed to delete user.', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const openEdit = async (u) => {
    setShowPasswordText(false);
    setEditUser(u);
    setForm({
      name: u.name || '',
      username: u.username || '',
      email: u.email || '',
      password: '',
      role: u.role || 'user',
      status: u.status || 'active',
      company_id: u.company_id || (isAGM && loggedInUser?.company_id ? loggedInUser.company_id : ''),
      shift_id: u.shift_id || '',
      supervisor_id: u.supervisor_id || '',
      agm_id: u.agm_id || '',
      availability_status: u.availability_status || 'active',
      leave_start_at: u.leave_start_at ? u.leave_start_at.split('T')[0] : '',
      leave_end_at: u.leave_end_at ? u.leave_end_at.split('T')[0] : '',
      leave_reason: u.leave_reason || '',
      branch_id: u.branch_id || (isAGM && loggedInUser?.branch_id ? loggedInUser.branch_id : ''),
      building_id: u.building_id || '',
      floor_id: u.floor_id || '',
      zone_id: u.zone_id || '',
      department_id: u.department_id || '',
    });
    setFormError('');
    setShowForm(true);

    try {
      const fullUser = await ApiService.getAdminUserById(u.id);
      const actualUser = fullUser.user || fullUser.data || fullUser;
      setForm({
        name: actualUser.name || '',
        username: actualUser.username || '',
        email: actualUser.email || '',
        password: '',
        role: actualUser.role || 'user',
        status: actualUser.status || 'active',
        company_id: actualUser.company_id || (isAGM && loggedInUser?.company_id ? loggedInUser.company_id : ''),
        shift_id: actualUser.shift_id || '',
        supervisor_id: actualUser.supervisor_id || '',
        agm_id: actualUser.agm_id || '',
        availability_status: actualUser.availability_status || 'active',
        leave_start_at: actualUser.leave_start_at ? actualUser.leave_start_at.split('T')[0] : '',
        leave_end_at: actualUser.leave_end_at ? actualUser.leave_end_at.split('T')[0] : '',
        leave_reason: actualUser.leave_reason || '',
        branch_id: actualUser.branch_id || (isAGM && loggedInUser?.branch_id ? loggedInUser.branch_id : ''),
        building_id: actualUser.building_id || '',
        floor_id: actualUser.floor_id || '',
        zone_id: actualUser.zone_id || '',
        department_id: actualUser.department_id || '',
      });
    } catch (err) {
      console.error('Failed to fetch full user details:', err);
    }
  };

  const openViewModules = (u) => {
    setViewUser(u);
    setModLoading(true);
    setRoleAllowedModules(null);

    Promise.allSettled([
      ApiService.getAdminUserModules(u.id),
      ApiService.getAdminUserNavAccess(u.id),
      ApiService.getAdminRoles()
    ])
      .then(async ([modulesRes, navRes, rolesRes]) => {
        let allowedSet = null;
        if (rolesRes.status === 'fulfilled' && rolesRes.value) {
          const val = rolesRes.value;
          const rolesList = Array.isArray(val) ? val : (val?.roles || val?.data || []);
          const uRole = (u.role || '').toLowerCase();
          const matchingRole = rolesList.find(r => r.name && r.name.toLowerCase() === uRole);
          if (matchingRole) {
            try {
              const rModRes = await ApiService.getAdminRoleModules(matchingRole.id);
              let nList = [];
              if (rModRes && rModRes.data) nList = Array.isArray(rModRes.data) ? rModRes.data : (rModRes.data.modules || []);
              else if (rModRes && rModRes.modules) nList = rModRes.modules;
              else if (Array.isArray(rModRes)) nList = rModRes;
              allowedSet = new Set(nList);
            } catch (e) {
              console.error("Failed to fetch role allowed modules", e);
            }
          }
        }
        setRoleAllowedModules(allowedSet);

        const checks = {};
        let hasData = false;

        // 1. Process nav-access response
        let navList = [];
        if (navRes.status === 'fulfilled' && navRes.value) {
          const val = navRes.value;
          if (Array.isArray(val)) {
            navList = val;
          } else if (Array.isArray(val.modules)) {
            navList = val.modules;
          } else if (val.data) {
            if (Array.isArray(val.data)) {
              navList = val.data;
            } else if (Array.isArray(val.data.modules)) {
              navList = val.data.modules;
            }
          }
        }

        if (navList.length > 0) {
          hasData = true;
          navList.forEach(code => {
            if (code) checks[code] = true;
          });
        }

        // 2. Process equipment modules response (just in case)
        if (modulesRes.status === 'fulfilled' && modulesRes.value) {
          const eqList = Array.isArray(modulesRes.value) ? modulesRes.value : (modulesRes.value.modules || modulesRes.value.data || []);
          setUserAssignments(eqList);
          if (eqList.length > 0) {
            hasData = true;
            eqList.forEach(m => {
              const code = m.code || m.module_code;
              if (code) checks[code] = true;
            });
          }
        }

        // If neither endpoint returned data, fallback to localStorage
        if (!hasData) {
          const stored = localStorage.getItem(`nav_access_${u.id}`);
          try {
            const parsed = stored ? JSON.parse(stored) : null;
            if (Array.isArray(parsed) && parsed.length > 0) {
              parsed.forEach(code => { checks[code] = true; });
              hasData = true;
            }
          } catch { }
        }

        // Default based on role fallback if still no data
        if (!hasData) {
          const role = (u.role || '').toLowerCase();
          displayModules.forEach(m => {
            if (role === 'superadmin' || role === 'admin') {
              checks[m.code] = true;
              if ((m.code === 'audit_logs' || m.code === 'device_monitoring') && role === 'admin') {
                checks[m.code] = false;
              }
            } else if (role === 'agm') {
              checks[m.code] = !['user_manage', 'add_equipment', 'setup_company', 'audit_logs', 'device_monitoring'].includes(m.code);
            } else if (role === 'supervisor') {
              checks[m.code] = !['user_manage', 'add_equipment', 'setup_company', 'audit_logs', 'device_monitoring', 'auto_scheduler'].includes(m.code);
            } else { // inspector / user
              checks[m.code] = ['overview', 'reports'].includes(m.code) || (!['pending_updates', 'auto_scheduler', 'audit_logs', 'device_monitoring', 'user_manage', 'equipment_access', 'add_equipment', 'setup_company'].includes(m.code));
            }
          });
        } else {
          // Fill in false for any displayModules not present in checks
          displayModules.forEach(m => {
            if (checks[m.code] === undefined) {
              checks[m.code] = false;
            }
          });
        }

        setModuleChecks(checks);
        setInitialChecks(checks);
      })
      .catch(err => {
        console.error("Failed to load user access:", err);
      })
      .finally(() => setModLoading(false));
  };

  const handleModuleToggle = (code) => {
    setModuleChecks(prev => ({ ...prev, [code]: !prev[code] }));
  };

  const saveModuleAccess = async () => {
    if (!viewUser) return;
    setModSaving(true);
    try {
      const userId = viewUser.id || viewUser.user_id || viewUser.username;
      const enabledNavCodes = displayModules.filter(m => moduleChecks[m.code]).map(m => m.code);

      const promises = [];

      // Compare current moduleChecks with initialChecks to find additions and removals
      displayModules.forEach(m => {
        if (m.category === 'Modules') {
          const wasChecked = !!initialChecks[m.code];
          const isChecked = !!moduleChecks[m.code];
          const moduleId = CODE_TO_ID[m.code];

          if (isChecked && !wasChecked && moduleId !== undefined) {
            // Add access
            promises.push(
              ApiService.addAdminUserModule(userId, {
                module_id: moduleId,
                access_level: 'admin'
              })
            );
          } else if (!isChecked && wasChecked && moduleId !== undefined) {
            // Remove access: find corresponding assignment record ID
            const assignment = userAssignments.find(a =>
              String(a.module_id || a.id) === String(moduleId) ||
              (a.code === m.code || a.module_code === m.code)
            );
            if (assignment && assignment.id) {
              promises.push(
                ApiService.removeAdminUserModule(userId, assignment.id)
              );
            }
          }
        }
      });

      // Save navigation access and all module additions/removals in parallel
      await Promise.all([
        ApiService.updateAdminUserNavAccess(userId, enabledNavCodes),
        ...promises
      ]);

      const selectedModules = displayModules
        .filter(m => moduleChecks[m.code] && m.category === 'Modules')
        .map(m => ({
          module_id: CODE_TO_ID[m.code],
          id: CODE_TO_ID[m.code],
          module_code: m.code,
          code: m.code,
          module_name: m.label,
          name: m.label,
          access_level: 'admin',
          assigned_at: new Date().toISOString()
        }));

      // Save lists to local storage fallback
      localStorage.setItem(`nav_access_${userId}`, JSON.stringify(enabledNavCodes));
      localStorage.setItem(`eq_access_${userId}`, JSON.stringify(selectedModules));
    } catch (err) {
      console.error('Failed to save access via API, falling back to localStorage:', err);
      const userId = viewUser.id || viewUser.user_id || viewUser.username;
      const enabledNavCodes = displayModules.filter(m => moduleChecks[m.code]).map(m => m.code);
      localStorage.setItem(`nav_access_${userId}`, JSON.stringify(enabledNavCodes));
      showToast('Failed to save access on server. Changes saved locally in this browser.', 'error');
    } finally {
      setModSaving(false);
      setViewUser(null);
      setRefreshKey(k => k + 1); // Trigger refresh to sync the lists from server
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.username.trim()) { setFormError('Name and Username are required.'); return; }
    if (!editUser && !form.password.trim()) { setFormError('Password is required for new users.'); return; }
    setSaving(true); setFormError('');
    try {
      if (editUser) {
        const selectedSupervisor = supervisors.find(s => String(s.id) === String(form.supervisor_id));
        const supervisorAgmId = selectedSupervisor?.agm_id || selectedSupervisor?.agmId || null;

        const payload = {
          name: form.name,
          email: form.email,
          role: form.role,
          status: form.status,
          company_id: form.company_id ? Number(form.company_id) : null,
          shift_id: form.shift_id ? Number(form.shift_id) : null,
          supervisor_id: (form.role === 'inspector' || form.role === 'user') ? (form.supervisor_id ? Number(form.supervisor_id) : null) : null,
          agm_id: form.role === 'supervisor' ? (form.agm_id ? Number(form.agm_id) : null) : ((form.role === 'inspector' || form.role === 'user') ? (supervisorAgmId ? Number(supervisorAgmId) : null) : null),
          branch_id: form.branch_id ? Number(form.branch_id) : null,
          building_id: form.building_id ? Number(form.building_id) : null,
          floor_id: form.floor_id ? Number(form.floor_id) : null,
          zone_id: form.zone_id ? Number(form.zone_id) : null,
          department_id: form.department_id ? Number(form.department_id) : null,
        };
        if (form.password.trim()) payload.password = form.password;
        await ApiService.updateAdminUser(editUser.id, payload);

        if (form.role === 'supervisor') {
          await ApiService.updateUserAvailability(editUser.id, {
            availability_status: form.availability_status,
            leave_start_at: form.leave_start_at || null,
            leave_end_at: form.leave_end_at || null,
            leave_reason: form.leave_reason || null
          });
        }
        showToast('User updated successfully.');
      } else {
        const selectedSupervisor = supervisors.find(s => String(s.id) === String(form.supervisor_id));
        const supervisorAgmId = selectedSupervisor?.agm_id || selectedSupervisor?.agmId || null;

        await ApiService.createAdminUser({
          name: form.name,
          username: form.username,
          email: form.email,
          password: form.password,
          role: form.role,
          status: form.status,
          company_id: form.company_id ? Number(form.company_id) : null,
          shift_id: form.shift_id ? Number(form.shift_id) : null,
          supervisor_id: (form.role === 'inspector' || form.role === 'user') ? (form.supervisor_id ? Number(form.supervisor_id) : null) : null,
          agm_id: form.role === 'supervisor' ? (form.agm_id ? Number(form.agm_id) : null) : ((form.role === 'inspector' || form.role === 'user') ? (supervisorAgmId ? Number(supervisorAgmId) : null) : null),
          branch_id: form.branch_id ? Number(form.branch_id) : null,
          building_id: form.building_id ? Number(form.building_id) : null,
          floor_id: form.floor_id ? Number(form.floor_id) : null,
          zone_id: form.zone_id ? Number(form.zone_id) : null,
          department_id: form.department_id ? Number(form.department_id) : null,
        });
        showToast('User created successfully.');
      }
      setShowForm(false);
      setRefreshKey(k => k + 1);
    } catch (err) {
      setFormError(err.message || 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="setup-page">
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px',
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: '#fff', padding: '12px 20px', borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: '8px',
          fontWeight: '500', animation: 'fe-fade 0.3s ease-out'
        }}>
          <span>{toast.type === 'success' ? '✅' : '⚠️'}</span>
          {toast.message}
        </div>
      )}
      {deleteConfirm && (
        <div className="um-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="um-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="um-modal-head">
              <div className="um-modal-title">
                <span style={{ fontSize: 20, marginRight: '8px' }}>⚠️</span> Confirm Deletion
              </div>
              <button className="um-modal-close" onClick={() => setDeleteConfirm(null)}>×</button>
            </div>
            <div className="um-modal-body">
              <p style={{ margin: 0, color: '#e2e8f0', fontSize: '14px', lineHeight: '1.5' }}>
                Are you sure you want to delete the user <strong>"{deleteConfirm.name || deleteConfirm.username}"</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="um-modal-foot">
              <button className="um-btn-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="um-btn-save" style={{ background: '#ef4444', color: '#fff' }} onClick={executeDeleteUser}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="setup-header">
        <button className="setup-back-btn" onClick={onBack} title="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="setup-header-info" style={{ flex: 1 }}>
          <div>
            <div className="setup-title">User Management</div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
              Manage roles, hierarchies, and module access permissions
            </p>
          </div>
        </div>
        <div className="um-search-wrap">
          <svg className="um-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            className="um-search"
            placeholder="Search "
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="um-search-clear" onClick={() => setSearch('')}>×</button>}
        </div>
        <button className="um-add-btn" onClick={openAdd}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" /><line x1="16" y1="11" x2="22" y2="11" />
          </svg>
          Add User
        </button>
      </div>


      {/* Content */}
      <div className="um-content-wrap">
        {loading ? (
          <div className="um-state-block"><div className="um-spinner" /><span>Loading users...</span></div>
        ) : error ? (
          <div className="um-state-block um-error-block">
            <span>⚠️ {error}</span>
            <button className="um-retry-btn" onClick={() => setRefreshKey(k => k + 1)}>Retry</button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="um-state-block">
            <span className="um-empty-icon">👤</span>
            <p>{search ? 'No users match your search.' : 'No users found. Click "Add User" to get started.'}</p>
          </div>
        ) : (
          <>
            <table className="um-table">
              <thead>
                <tr>
                  <th className="um-th-num">#</th>
                  <th>User</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Hierarchy</th>
                  <th>Status</th>
                  <th className="um-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedUsers.map((u, idx) => {
                  const rc = getRoleConf(u.role);
                  return (
                    <tr key={u.id || idx}>
                      <td className="um-td-num">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                      <td>
                        <div className="um-user-cell">
                          <div className="um-avatar" style={{ background: rc.bg, color: rc.color }}>
                            {(u.name || u.username || '?').charAt(0).toUpperCase()}
                          </div>
                          <span className="um-name">{u.name || u.username || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="um-mono">{u.username || '—'}</td>
                      <td className="um-email">{u.email || '—'}</td>
                      <td>
                        <span className="um-role-badge" style={{ color: rc.color, background: rc.bg, borderColor: rc.color + '44' }}>
                          {rc.label}
                        </span>
                      </td>
                      <td>
                        {(u.role === 'inspector' || u.role === 'user') ? (
                          u.supervisor_name ? (
                            <span style={{ fontSize: '12.5px', color: '#16a34a', fontWeight: '600' }}>
                              Supervisor: {u.supervisor_name}
                            </span>
                          ) : (
                            <span style={{ fontSize: '11.5px', color: '#ef4444', fontStyle: 'italic', fontWeight: '500' }}>
                              ⚠️ Unassigned Supervisor
                            </span>
                          )
                        ) : u.role === 'supervisor' ? (
                          u.agm_name ? (
                            <span style={{ fontSize: '12.5px', color: '#c084fc', fontWeight: '600' }}>
                              AGM: {u.agm_name}
                            </span>
                          ) : (
                            <span style={{ fontSize: '11.5px', color: '#ef4444', fontStyle: 'italic', fontWeight: '500' }}>
                              ⚠️ Unassigned AGM
                            </span>
                          )
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span className={`um-status ${u.status === 'inactive' ? 'inactive' : 'active'}`}>
                            <span className="um-status-dot" />
                            {u.status === 'inactive' ? 'Inactive' : 'Active'}
                          </span>
                          {u.role === 'supervisor' && u.availability_status && u.availability_status !== 'active' && (
                            <span className="um-avail-status" style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 'bold' }}>
                              🗓️ {u.availability_status === 'on_leave' ? 'On Leave' : 'Unavailable'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="um-actions">
                          <button className="um-action-btn edit" onClick={() => openEdit(u)} title="Edit user">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button className="um-action-btn modules" onClick={() => openViewModules(u)} title="Manage access">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                          </button>
                          <button className="um-action-btn delete" onClick={() => confirmDeleteUser(u)} title="Delete user">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6" /><path d="M14 11v6" />
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="um-pagination">
                <button className="um-pg-btn" onClick={() => setPage(1)} disabled={page === 1}>«</button>
                <button className="um-pg-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
                <span className="um-pg-info">Page {page} of {totalPages}</span>
                <button className="um-pg-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
                <button className="um-pg-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="um-overlay" onClick={() => setShowForm(false)}>
          <div className="um-modal" onClick={e => e.stopPropagation()}>
            <div className="um-modal-head">
              <div className="um-modal-title">
                {editUser ? (
                  <>
                    <div className="um-avatar-sm" style={{ background: getRoleConf(editUser.role).bg, color: getRoleConf(editUser.role).color }}>
                      {(editUser.name || editUser.username || '?').charAt(0).toUpperCase()}
                    </div>
                    Edit User
                  </>
                ) : <><span style={{ fontSize: 20 }}>👤</span> Add New User</>}
              </div>
              <button className="um-modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <div className="um-modal-body">
              {formError && <div className="um-form-error">⚠️ {formError}</div>}
              <div className="um-form-grid">
                <div className="um-form-field">
                  <label>Full Name <span className="um-req">*</span></label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. John Doe" />
                </div>
                <div className="um-form-field">
                  <label>Username <span className="um-req">*</span></label>
                  <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="e.g. johndoe" disabled={!!editUser} style={editUser ? { opacity: 0.5, cursor: 'not-allowed' } : {}} />
                </div>
                <div className="um-form-field">
                  <label>Email Address</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@company.com" />
                </div>
                <div className="um-form-field">
                  <label>{editUser ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showPasswordText ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder={editUser ? '••••••••' : 'Enter password'}
                      style={{ paddingRight: '40px', width: '100%', boxSizing: 'border-box' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordText(!showPasswordText)}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255,255,255,0.6)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        outline: 'none'
                      }}
                    >
                      {showPasswordText ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="um-form-field">
                  <label>Role</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                    {ROLE_ORDER.map(r => (
                      <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
                    ))}
                  </select>
                </div>
                <div className="um-form-field">
                  <label>Assign Company</label>
                  <select value={form.company_id} disabled={isAGM} onChange={e => setForm(f => ({ ...f, company_id: e.target.value, branch_id: '', building_id: '', floor_id: '', zone_id: '', department_id: '' }))}>
                    <option value="">No Company</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                {branches.length > 0 && (
                  <div className="um-form-field">
                    <label>Assign Branch</label>
                    <select value={form.branch_id || ''} disabled={isAGM} onChange={e => setForm(f => ({ ...f, branch_id: e.target.value, building_id: '', floor_id: '', zone_id: '', department_id: '' }))}>
                      <option value="">All Branches</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name || b.branch_name || `Branch ${b.id}`}</option>
                      ))}
                    </select>
                  </div>
                )}
                {form.branch_id && buildings.length > 0 && (
                  <div className="um-form-field">
                    <label>Assign Building</label>
                    <select value={form.building_id || ''} onChange={e => setForm(f => ({ ...f, building_id: e.target.value, floor_id: '', zone_id: '', department_id: '' }))}>
                      <option value="">All Buildings</option>
                      {buildings.map(b => (
                        <option key={b.id} value={b.id}>{b.name || b.building_name || `Building ${b.id}`}</option>
                      ))}
                    </select>
                  </div>
                )}
                {form.building_id && floors.length > 0 && (
                  <div className="um-form-field">
                    <label>Assign Floor</label>
                    <select value={form.floor_id || ''} onChange={e => setForm(f => ({ ...f, floor_id: e.target.value, zone_id: '', department_id: '' }))}>
                      <option value="">All Floors</option>
                      {floors.map(fl => (
                        <option key={fl.id} value={fl.id}>{fl.name || fl.floor_name || `Floor ${fl.id}`}</option>
                      ))}
                    </select>
                  </div>
                )}
                {form.floor_id && zones.length > 0 && (
                  <div className="um-form-field">
                    <label>Assign Zone</label>
                    <select value={form.zone_id || ''} onChange={e => setForm(f => ({ ...f, zone_id: e.target.value, department_id: '' }))}>
                      <option value="">All Zones</option>
                      {zones.map(z => (
                        <option key={z.id} value={z.id}>{z.name || z.zone_name || `Zone ${z.id}`}</option>
                      ))}
                    </select>
                  </div>
                )}
                {form.zone_id && departments.length > 0 && (
                  <div className="um-form-field">
                    <label>Assign Department</label>
                    <select value={form.department_id || ''} onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))}>
                      <option value="">All Departments</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name || d.department_name || `Department ${d.id}`}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="um-form-field">
                  <label>Assign Shift</label>
                  <select value={form.shift_id || ''} onChange={e => setForm(f => ({ ...f, shift_id: e.target.value }))}>
                    <option value="">No Shift</option>
                    {shifts.map(s => (
                      <option key={s.id} value={s.id}>{s.shift_name || s.name} ({s.start_time} - {s.end_time})</option>
                    ))}
                  </select>
                </div>
                {similarityWarning && (
                  <div style={{
                    gridColumn: 'span 2',
                    marginTop: '4px',
                    padding: '10px 12px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '6px',
                    color: '#f59e0b',
                    fontSize: '12px',
                    lineHeight: '1.4',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px',
                    boxSizing: 'border-box'
                  }}>
                    <span style={{ fontSize: '14px' }}>⚠️</span>
                    <span>{similarityWarning}</span>
                  </div>
                )}
                {(form.role === 'inspector' || form.role === 'user') && (
                  <div className="um-form-field">
                    <label>Assign Supervisor</label>
                    <select value={form.supervisor_id || ''} onChange={e => setForm(f => ({ ...f, supervisor_id: e.target.value }))}>
                      <option value="">No Supervisor</option>
                      {supervisors.map(s => (
                        <option key={s.id} value={s.id}>{s.name || s.username}</option>
                      ))}
                    </select>
                  </div>
                )}
                {form.role === 'supervisor' && (
                  <>
                    <div className="um-form-field">
                      <label>Assign AGM</label>
                      <select value={form.agm_id || ''} onChange={e => setForm(f => ({ ...f, agm_id: e.target.value }))}>
                        <option value="">No AGM</option>
                        {agms.map(a => (
                          <option key={a.id} value={a.id}>{a.name || a.username}</option>
                        ))}
                      </select>
                    </div>
                    {editUser && (
                      <>
                        <div className="um-form-field">
                          <label>Availability Status</label>
                          <select value={form.availability_status} onChange={e => setForm(f => ({ ...f, availability_status: e.target.value }))}>
                            <option value="active">Active / On Duty</option>
                            <option value="on_leave">On Leave</option>
                            <option value="temporarily_unavailable">Temporarily Unavailable</option>
                          </select>
                        </div>
                        {form.availability_status !== 'active' && (
                          <>
                            <div className="um-form-field">
                              <label>Leave Start Date</label>
                              <input type="date" value={form.leave_start_at} onChange={e => setForm(f => ({ ...f, leave_start_at: e.target.value }))} />
                            </div>
                            <div className="um-form-field">
                              <label>Leave End Date</label>
                              <input type="date" value={form.leave_end_at} onChange={e => setForm(f => ({ ...f, leave_end_at: e.target.value }))} />
                            </div>
                            <div className="um-form-field um-full-width" style={{ gridColumn: 'span 2' }}>
                              <label>Leave/Unavailable Reason</label>
                              <textarea value={form.leave_reason} onChange={e => setForm(f => ({ ...f, leave_reason: e.target.value }))} placeholder="Explain reason (e.g. sick leave, training...)" rows={2} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(30,41,59,0.5)', color: '#fff', outline: 'none' }} />
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </>
                )}
                <div className="um-form-field">
                  <label>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="um-modal-foot">
              <button className="um-btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="um-btn-save" onClick={handleSave} disabled={saving}>
                {saving ? <><div className="um-btn-spinner" /> Saving...</> : (editUser ? 'Update User' : 'Create User')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modules Modal */}
      {viewUser && (
        <div className="um-overlay" onClick={() => setViewUser(null)}>
          <div className="um-modal um-modules-modal" onClick={e => e.stopPropagation()}>
            <div className="um-modal-head">
              <div className="um-modal-title">
                <div className="um-avatar-sm" style={{ background: getRoleConf(viewUser.role).bg, color: getRoleConf(viewUser.role).color }}>
                  {(viewUser.name || viewUser.username || '?').charAt(0).toUpperCase()}
                </div>
                {viewUser.name || viewUser.username} — Modules
              </div>
              <button className="um-modal-close" onClick={() => setViewUser(null)}>×</button>
            </div>
            <div className="um-modal-body">
              {modLoading ? (
                <div className="um-state-block"><div className="um-spinner" /><span>Loading modules...</span></div>
              ) : (
                <div className="um-modules-list">
                  {displayCategories.map(cat => (
                    <div key={cat} className="um-module-category">
                      <div className="um-module-cat-label">{cat}</div>
                      <div className={`um-module-items-wrapper ${cat === 'Modules' ? 'multi-col-grid' : 'single-col-list'}`}>
                        {displayModules.filter(m => m.category === cat).map(m => (
                          <label
                            key={m.code}
                            className={`um-module-item${moduleChecks[m.code] ? ' assigned' : ''}`}
                            onClick={() => handleModuleToggle(m.code)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="um-mod-check-wrap">
                              <input
                                type="checkbox"
                                className="um-mod-checkbox"
                                checked={moduleChecks[m.code] || false}
                                onChange={() => handleModuleToggle(m.code)}
                                onClick={e => e.stopPropagation()}
                              />
                              <div className="um-mod-label">
                                <span className="um-module-emoji">{m.icon}</span>
                                <span className="um-module-name">{m.label}</span>
                              </div>
                            </div>
                            {moduleChecks[m.code] && (
                              <span className="um-mod-status-tag">Enabled</span>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="um-modal-foot">
              <button className="um-btn-cancel" onClick={() => setViewUser(null)}>Cancel</button>
              <button className="um-btn-save" onClick={saveModuleAccess} disabled={modSaving}>
                {modSaving ? <><div className="um-btn-spinner" /> Saving...</> : 'Save Access'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

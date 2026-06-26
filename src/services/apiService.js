/**
 * ApiService for SOS Emergency Platform
 * Base URL: https://ehs.garrev.com/app1/v1/
 */

const BASE_URL = 'https://ehs.garrev.com/app1/v1';

import { filterEquipmentByLocations } from '../utils/locationFilter';

let cachedMappings = null;
let cachedMappingsTime = 0;
let cachedMappingsUserId = null;

const applyGlobalLocationFilter = async (items) => {
  if (!items || !Array.isArray(items)) return items;
  const userStr = localStorage.getItem('auth_user');
  if (!userStr) return items;
  try {
    const user = JSON.parse(userStr);
    const role = (user.role || '').toLowerCase();
    if (['superadmin', 'safety_manager'].includes(role)) return items;

    if (!user.id) return [];

    // Ensure fresh mappings (cache for 15 seconds in memory)
    if (!cachedMappings || cachedMappingsUserId !== String(user.id) || (Date.now() - cachedMappingsTime > 15000)) {
      try {
        // We can safely call getOperatorMappings because it doesn't call applyGlobalLocationFilter
        const res = await ApiService.getOperatorMappings({ user_id: user.id });
        cachedMappings = Array.isArray(res) ? res : (res?.data || res?.items || []);
        cachedMappingsTime = Date.now();
        cachedMappingsUserId = String(user.id);
        localStorage.setItem('user_operator_mappings', JSON.stringify(cachedMappings));
      } catch (e) {
        // Fallback to localStorage if API fails
        const str = localStorage.getItem('user_operator_mappings');
        cachedMappings = str ? JSON.parse(str) : [];
      }
    }

    if (!cachedMappings || cachedMappings.length === 0) return [];

    let filteredByLoc = filterEquipmentByLocations(items, cachedMappings, role);

    // Filter by module access
    try {
      // getMockUserModules is available in the same file
      const allowedModules = getMockUserModules(user.id);
      if (allowedModules && allowedModules.length > 0) {
        const allowedIds = new Set(allowedModules.map(m => String(m.module_id || m.id)));
        filteredByLoc = filteredByLoc.filter(eq => {
          const mId = String(eq.module_id || eq.moduleId);
          if (!mId) return true; // Allow equipment with no module specified
          return allowedIds.has(mId);
        });
      }
    } catch (e) {}

    return filteredByLoc;
  } catch (e) {
    return [];
  }
};

let _cachedUser = null;

let _pendingReportsCache = null;
let _pendingReportsCacheTime = 0;

const getPendingEquipmentSosCodes = async (moduleId) => {
  const codes = new Set();

  // 1. Get locally queued inspections
  try {
    const localQueue = JSON.parse(localStorage.getItem('pending_inspections_queue') || '[]');
    localQueue.forEach(item => {
      if (!moduleId || String(item.module_id) === String(moduleId)) {
        const code = item.sos_code || item.equipment_code;
        if (code) codes.add(code);
      }
    });
  } catch (e) {
    console.error(e);
  }

  // 2. Get backend pending inspections (cached for 5 seconds to avoid spamming)
  try {
    const now = Date.now();
    let iList = [];
    if (_pendingReportsCache && (now - _pendingReportsCacheTime < 5000)) {
      iList = _pendingReportsCache;
    } else {
      const today = new Date();
      const endDateStr = today.toISOString().split('T')[0];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      const startDateStr = thirtyDaysAgo.toISOString().split('T')[0];

      const rawInspections = await request(`/reports/inspections?start_date=${startDateStr}&end_date=${endDateStr}`).catch(() => []);
      iList = Array.isArray(rawInspections) ? rawInspections : (rawInspections?.items || rawInspections?.reports || rawInspections?.inspections || rawInspections?.data || []);
      _pendingReportsCache = iList;
      _pendingReportsCacheTime = now;
    }

    const approvedLocally = JSON.parse(localStorage.getItem('approved_inspections') || '[]');

    iList.forEach(i => {
      const stStatus = (i.status || '').toUpperCase();
      const stApprov = (i.approval_status || '').toUpperCase();
      const isApproved = stApprov === 'APPROVED' || stStatus === 'APPROVED' || approvedLocally.map(String).includes(String(i.id));

      if (!isApproved) {
        if (!moduleId || String(i.module_id) === String(moduleId)) {
          const code = i.sos_code || i.equipment_code;
          if (code) codes.add(code);
        }
      }
    });
  } catch (e) {
    console.error(e);
  }

  return codes;
};

let globalLocMap = null;
let globalLocMapTime = 0;

const enhanceLocation = async (item) => {
  if (!item) return item;
  
  const now = Date.now();
  if (!globalLocMap || (now - globalLocMapTime > 300000)) { // 5 minute cache
    try {
      const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
      const compId = user.company_id || user.companyId || 21;
      
      const bMap = {}; const fMap = {}; const zMap = {}; const dMap = {};
      
      // Fetch dropdowns as base
      try {
        const remoteData = await request(`/onboarding/dropdowns?company_id=${encodeURIComponent(compId)}`).catch(() => ({}));
        const data = remoteData?.data || remoteData || {};
        (data.buildings || data.branches || []).forEach(x => bMap[String(x.id)] = x.building_name || x.name);
        (data.floors || []).forEach(x => fMap[String(x.id)] = x.floor_name || x.name);
        (data.zones || []).forEach(x => zMap[String(x.id)] = x.zone_name || x.name);
        (data.departments || []).forEach(x => dMap[String(x.id)] = x.department_name || x.name);
      } catch (e) {}

      // Fetch recursively to ensure all nested structures are covered
      try {
        const branches = await request(`/branches?company_id=${compId}`).catch(() => []);
        const bList = Array.isArray(branches) ? branches : (branches?.data || branches?.branches || []);
        
        const depts = await request(`/departments?company_id=${compId}`).catch(() => []);
        const dList = Array.isArray(depts) ? depts : (depts?.data || depts?.departments || []);
        dList.forEach(dept => { dMap[String(dept.id)] = dept.department_name || dept.name; });

        for (const branch of bList) {
           bMap[String(branch.id)] = branch.branch_name || branch.name;
           
           const bldgs = await request(`/branches/${branch.id}/buildings`).catch(() => []);
           const blList = Array.isArray(bldgs) ? bldgs : (bldgs?.data || bldgs?.buildings || []);
           for (const bldg of blList) {
               bMap[String(bldg.id)] = bldg.building_name || bldg.name;
               const floors = await request(`/buildings/${bldg.id}/floors`).catch(() => []);
               const fList = Array.isArray(floors) ? floors : (floors?.data || floors?.floors || []);
               for (const floor of fList) {
                   fMap[String(floor.id)] = floor.floor_name || floor.name;
                   const zones = await request(`/floors/${floor.id}/zones`).catch(() => []);
                   const zList = Array.isArray(zones) ? zones : (zones?.data || zones?.zones || []);
                   for (const zone of zList) {
                       zMap[String(zone.id)] = zone.zone_name || zone.name;
                   }
               }
           }
        }
      } catch (e) {}
      
      globalLocMap = { bMap, fMap, zMap, dMap };
      globalLocMapTime = now;
    } catch(e) {
      if (!globalLocMap) globalLocMap = { bMap:{}, fMap:{}, zMap:{}, dMap:{} };
    }
  }

  const map = globalLocMap;
  
  const mapItem = (cloned) => {
    // Normalize: location_id in the DB is the branch_id — copy it so downstream code finds it
    if (!cloned.branch_id && cloned.location_id) {
      cloned.branch_id = cloned.location_id;
    }
    const br = map.bMap[String(cloned.branch_name)] || map.bMap[String(cloned.branch_id)] || map.bMap[String(cloned.location_id)];
    const b = map.bMap[String(cloned.building_name)] || map.bMap[String(cloned.building_id)];
    const f = map.fMap[String(cloned.floor_name)] || map.fMap[String(cloned.floor_id)];
    const z = map.zMap[String(cloned.zone_name)] || map.zMap[String(cloned.zone_id)];
    const d = map.dMap[String(cloned.department_name)] || map.dMap[String(cloned.department_id)];

    let changed = false;
    if (br && br !== String(cloned.branch_name)) { cloned.branch_name = br; cloned.branch = br; changed = true; }
    if (b && b !== String(cloned.building_name)) { cloned.building_name = b; cloned.building = b; changed = true; }
    if (f && f !== String(cloned.floor_name)) { cloned.floor_name = f; cloned.floor = f; changed = true; }
    if (z && z !== String(cloned.zone_name)) { cloned.zone_name = z; cloned.zone = z; changed = true; }
    if (d && d !== String(cloned.department_name)) { cloned.department_name = d; cloned.department = d; changed = true; }

    if (changed || (cloned.location_name && !isNaN(cloned.location_name.split(' / ')[0]))) {
       const newLoc = [
         cloned.building_name || cloned.building_id, 
         cloned.floor_name ? (String(cloned.floor_name).toLowerCase().includes('floor') ? cloned.floor_name : `Floor ${cloned.floor_name}`) : null, 
         cloned.zone_name ? (String(cloned.zone_name).toLowerCase().includes('zone') ? cloned.zone_name : `Zone ${cloned.zone_name}`) : null
       ].filter(Boolean).join(' / ');
       cloned.location_name = newLoc || cloned.location_name;
       changed = true;
    }
    return changed;
  };

  const cloned = { ...item };
  let itemChanged = mapItem(cloned);
  
  if (cloned.details) {
    const detailsCloned = { ...cloned.details };
    if (mapItem(detailsCloned)) {
      cloned.details = detailsCloned;
      itemChanged = true;
    }
  }

  return itemChanged ? cloned : item;
};

const getMockUsers = () => {
  let users = [];
  try {
    const stored = localStorage.getItem('mock_admin_users');
    if (stored) {
      users = JSON.parse(stored);
      if (!users.some(u => String(u.id) === '76')) {
        users = [];
        localStorage.removeItem('mock_user_modules');
      }
    }
  } catch (e) { }

  if (users.length === 0) {
    users = [
      { id: 71, username: 'agm_user', name: 'Jahnavi AGM', role: 'agm', company_id: 21, status: 'active' },
      { id: 72, username: 'supervisor_user', name: 'Suresh Supervisor', role: 'supervisor', company_id: 21, status: 'active', agm_id: 71 },
      { id: 73, username: 'inspector_user1', name: 'Rahul Inspector', role: 'inspector', company_id: 21, status: 'active', supervisor_id: 72, agm_id: 71 },
      { id: 75, username: 'inspector_user2', name: 'Amit Inspector', role: 'inspector', company_id: 21, status: 'active', supervisor_id: 72, agm_id: 71 },

      // Real environment users
      { id: 74, username: 'AGM1', name: 'AGM1', role: 'agm', company_id: 29, status: 'active' },
      { id: 76, username: 'SPV1', name: 'SPV1', role: 'supervisor', company_id: 29, status: 'active', agm_id: 74 },
      { id: 81, username: 'User1', name: 'User1', role: 'inspector', company_id: 29, status: 'active', supervisor_id: 76, agm_id: 74 },
      { id: 82, username: 'User2', name: 'User2', role: 'inspector', company_id: 29, status: 'active', supervisor_id: 76, agm_id: 74 }
    ];
  }

  try {
    const storedUser = localStorage.getItem('auth_user');
    const current = storedUser ? JSON.parse(storedUser) : null;
    if (current && current.id && !users.some(u => String(u.id) === String(current.id))) {
      users.push({
        id: current.id,
        username: current.username || 'current_user',
        name: current.name || 'Current User',
        role: current.role || 'user',
        company_id: current.company_id || 21,
        status: 'active',
        agm_id: current.agm_id || current.agmId || null,
        supervisor_id: current.supervisor_id || current.supervisorId || null
      });
    }
  } catch (e) { }

  localStorage.setItem('mock_admin_users', JSON.stringify(users));
  return users;
};

const getMockUserModules = (userId) => {
  let assignments = [];
  try {
    const stored = localStorage.getItem('mock_user_modules');
    if (stored) assignments = JSON.parse(stored);
  } catch (e) { }

  if (assignments.length === 0) {
    const defaultModules = [
      { module_id: 30, name: 'Fire Extinguisher', code: 'fire_extinguisher' },
      { module_id: 31, name: 'Sprinkler System', code: 'sprinkler' },
      { module_id: 32, name: 'Fire Alarm', code: 'fpca' },
      { module_id: 33, name: 'Hose Reel', code: 'hose_reel' },
      { module_id: 34, name: 'Fire Hydrant', code: 'hydrant' },
      { module_id: 35, name: 'Drum Hose', code: 'drum_hose' },
      { module_id: 36, name: 'Fire Trolley', code: 'fire_trolley' },
      { module_id: 37, name: 'Suppression System', code: 'suppression_system' },
      { module_id: 38, name: 'Fire Blanket', code: 'fire_blanket' },
      { module_id: 39, name: 'Smoke Detector', code: 'smoke_detector' },
      { module_id: 63, name: 'Sand Bucket', code: 'sand_bucket' }
    ];

    // AGM gets 5 modules
    defaultModules.slice(0, 5).forEach(m => {
      assignments.push({ userId: 71, module: m, access_level: 'admin' });
      assignments.push({ userId: 74, module: m, access_level: 'admin' });
    });

    // Supervisor gets 3 modules
    defaultModules.slice(0, 3).forEach(m => {
      assignments.push({ userId: 72, module: m, access_level: 'manage' });
      assignments.push({ userId: 76, module: m, access_level: 'manage' });
    });

    // Inspectors get 2 modules
    defaultModules.slice(0, 2).forEach(m => {
      assignments.push({ userId: 73, module: m, access_level: 'inspect' });
      assignments.push({ userId: 75, module: m, access_level: 'inspect' });
      assignments.push({ userId: 81, module: m, access_level: 'inspect' });
      assignments.push({ userId: 82, module: m, access_level: 'inspect' });
    });

    try {
      const storedUser = localStorage.getItem('auth_user');
      const current = storedUser ? JSON.parse(storedUser) : null;
      if (current && current.id && ![71, 72, 73, 74, 75, 76, 81, 82].includes(Number(current.id))) {
        if (['superadmin', 'admin', 'safety_manager'].includes((current.role || '').toLowerCase())) {
          defaultModules.forEach(m => {
            assignments.push({ userId: current.id, module: m, access_level: 'admin' });
          });
        } else if (current.role === 'supervisor') {
          defaultModules.slice(0, 3).forEach(m => {
            assignments.push({ userId: current.id, module: m, access_level: 'manage' });
          });
        } else if (current.role === 'agm') {
          defaultModules.slice(0, 5).forEach(m => {
            assignments.push({ userId: current.id, module: m, access_level: 'admin' });
          });
        } else {
          defaultModules.slice(0, 2).forEach(m => {
            assignments.push({ userId: current.id, module: m, access_level: 'inspect' });
          });
        }
      }
    } catch (e) { }

    localStorage.setItem('mock_user_modules', JSON.stringify(assignments));
  }

  const userAssignments = assignments.filter(a => String(a.userId) === String(userId));
  return userAssignments.map(a => ({
    id: a.module.module_id || a.module.id,
    module_id: a.module.module_id || a.module.id,
    name: a.module.name,
    code: a.module.code,
    access_level: a.access_level || 'user',
    created_at: new Date().toISOString()
  }));
};

const addMockUserModule = (userId, data) => {
  let assignments = [];
  try {
    const stored = localStorage.getItem('mock_user_modules');
    if (stored) assignments = JSON.parse(stored);
  } catch (e) { }

  const defaultModules = [
    { module_id: 30, name: 'Fire Extinguisher', code: 'fire_extinguisher' },
    { module_id: 31, name: 'Sprinkler System', code: 'sprinkler' },
    { module_id: 32, name: 'Fire Alarm', code: 'fpca' },
    { module_id: 33, name: 'Hose Reel', code: 'hose_reel' },
    { module_id: 34, name: 'Fire Hydrant', code: 'hydrant' },
    { module_id: 35, name: 'Drum Hose', code: 'drum_hose' },
    { module_id: 36, name: 'Fire Trolley', code: 'fire_trolley' },
    { module_id: 37, name: 'Suppression System', code: 'suppression_system' },
    { module_id: 38, name: 'Fire Blanket', code: 'fire_blanket' },
    { module_id: 39, name: 'Smoke Detector', code: 'smoke_detector' },
    { module_id: 63, name: 'Sand Bucket', code: 'sand_bucket' }
  ];

  const targetModule = defaultModules.find(m => String(m.module_id) === String(data.module_id)) || {
    module_id: data.module_id,
    name: `Module ${data.module_id}`,
    code: `module_${data.module_id}`
  };

  assignments = assignments.filter(a => !(String(a.userId) === String(userId) && String(a.module.module_id || a.module.id) === String(data.module_id)));

  assignments.push({
    userId,
    module: targetModule,
    access_level: data.access_level || 'user'
  });

  localStorage.setItem('mock_user_modules', JSON.stringify(assignments));
  return { success: true };
};

const removeMockUserModule = (userId, moduleId) => {
  let assignments = [];
  try {
    const stored = localStorage.getItem('mock_user_modules');
    if (stored) assignments = JSON.parse(stored);
  } catch (e) { }

  assignments = assignments.filter(a => !(String(a.userId) === String(userId) && String(a.module.module_id || a.module.id) === String(moduleId)));
  localStorage.setItem('mock_user_modules', JSON.stringify(assignments));
  return { success: true };
};


const qs = (params = {}) => {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
  const query = new URLSearchParams(cleaned).toString();
  return query ? `?${query}` : '';
};

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch (e) {
      // Not a JSON response
    }
    throw new Error(errorMessage);
  }
  if (response.status === 204) return { success: true };
  const text = await response.text();
  if (!text.trim()) return { success: true };
  try {
    return JSON.parse(text);
  } catch {
    return { success: true, raw: text };
  }
};

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('auth_token');
  const headers = {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };
  // Only set JSON content-type for non-FormData bodies
  if (options.body && typeof options.body.append !== 'function') {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return handleResponse(response);
};

export const ApiService = {
  // --- AUTH ---
  register: async (firstName, lastName, email, mobile, companyId = 21) => {
    return await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email,
        mobile,
        company_id: Number(companyId)
      }),
    });
  },

  verifyEmailOtp: async (registrationId, otp) => {
    return await request('/auth/verify-email-otp', {
      method: 'POST',
      body: JSON.stringify({
        registration_id: Number(registrationId),
        otp: String(otp)
      }),
    });
  },

  login: async (username, password) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (data && data.token) {
      localStorage.setItem('auth_token', data.token);
    }

    const user = data.user || { name: username, role: username === 'superadmin' ? 'superadmin' : 'admin' };
    _cachedUser = user;
    localStorage.setItem('auth_user', JSON.stringify(user));

    return { success: true, user, ...data };
  },

  // Synchronous — returns the cached user set at login time.
  // Used by checklist components that can't make async calls inline.
  getUser: () => {
    if (_cachedUser) return _cachedUser;
    try {
      const stored = localStorage.getItem('auth_user');
      if (stored) { _cachedUser = JSON.parse(stored); return _cachedUser; }
    } catch { /* ignore */ }
    return null;
  },

  getMe: async () => {
    return await request('/auth/me');
  },

  getPermissions: async () => {
    return await request('/auth/me/permissions');
  },

  refreshToken: async (refreshToken) => {
    return await request('/auth/token/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  },

  logout: async () => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout API call failed:', e);
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('user_operator_mappings');
    _cachedUser = null;
    cachedMappings = null;
    cachedMappingsTime = 0;
    cachedMappingsUserId = null;
    return { success: true };
  },

  // --- SYSTEM ---
  getRoot: async () => {
    return await request('/');
  },

  getHealth: async () => {
    return await request('/health');
  },

  // --- OPERATOR MAPPING ---
  getOperatorMappings: async (params = {}) => {
    const injectedParams = ApiService._injectCompanyId({ ...params });
    const res = await request(`/operator-mappings${qs(injectedParams)}`);
    let arr = Array.isArray(res) ? res : (res?.items || res?.data || []);
    
    // The backend might not strictly filter by user_id, so enforce it on the frontend
    if (params.user_id) {
       arr = arr.filter(m => String(m.userId || m.user_id) === String(params.user_id));
    }

    for (let item of arr) {
      await enhanceLocation(item);
    }

    if (Array.isArray(res)) return arr;
    return { ...res, items: arr, data: arr };
  },

  createOperatorMapping: async (data) => {
    return await request('/operator-mappings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteOperatorMapping: async (id) => {
    return await request(`/operator-mappings/${id}`, { method: 'DELETE' });
  },

  // --- DASHBOARD ---
  getDashboard: async () => {
    return await request('/dashboard');
  },

  _injectCompanyId: (params = {}) => {
    try {
      const stored = localStorage.getItem('auth_user');
      if (stored) {
        const user = JSON.parse(stored);
        if (user && user.role !== 'superadmin') {
          if (user.company_id) params.company_id = user.company_id;

          // For sub-company roles, inject the narrowest location scope the user has
          if (['agm', 'supervisor', 'inspector', 'user'].includes(user.role)) {
            if (user.branch_id) params.branch_id = user.branch_id;
            if (user.building_id) params.building_id = user.building_id;
            if (user.floor_id) params.floor_id = user.floor_id;
            if (user.zone_id) params.zone_id = user.zone_id;
            if (user.department_id) params.department_id = user.department_id;
          }
        }
      }
    } catch (e) { }
    return params;
  },

  getEquipment: async (params = {}) => {
    params = ApiService._injectCompanyId(params);

    const status = params.status;
    const moduleId = params.module_id;

    if (status === 'due-inspection' || status === 'due_inspection') {
      // Fetch both due-inspection and active equipment
      const [dueRes, activeRes] = await Promise.all([
        request(`/equipment${qs({ ...params, status: 'due-inspection' })}`),
        request(`/equipment${qs({ ...params, status: 'active' })}`),
      ]);

      let dueItems = dueRes.items || dueRes.data || (Array.isArray(dueRes) ? dueRes : []);
      let activeItems = activeRes.items || activeRes.data || (Array.isArray(activeRes) ? activeRes : []);

      try {
        const pendingCodes = await getPendingEquipmentSosCodes(moduleId);
        if (pendingCodes.size > 0) {
          const dueCodes = new Set(dueItems.map(item => item.sos_code || item.equipment_code));

          activeItems.forEach(item => {
            const code = item.sos_code || item.equipment_code;
            if (pendingCodes.has(code) && !dueCodes.has(code)) {
              dueItems.push(item);
            }
          });
        }
      } catch (e) {
        console.error(e);
      }

      if (Array.isArray(dueRes)) {
        return await applyGlobalLocationFilter(dueItems);
      }
      const filteredDue = await applyGlobalLocationFilter(dueItems);
      return {
        ...dueRes,
        items: filteredDue,
        total: filteredDue.length,
        data: filteredDue
      };
    }

    if (status === 'active') {
      const res = await request(`/equipment${qs(params)}`);
      let items = res.items || res.data || (Array.isArray(res) ? res : []);

      try {
        const pendingCodes = await getPendingEquipmentSosCodes(moduleId);
        if (pendingCodes.size > 0 && items.length > 0) {
          items = items.filter(item => {
            const code = item.sos_code || item.equipment_code;
            return !pendingCodes.has(code);
          });
        }
      } catch (e) {
        console.error(e);
      }

      if (Array.isArray(res)) {
        return await applyGlobalLocationFilter(await Promise.all(items.map(i => enhanceLocation(i))));
      }
      const filteredActive = await applyGlobalLocationFilter(await Promise.all(items.map(i => enhanceLocation(i))));
      return {
        ...res,
        items: filteredActive,
        total: filteredActive.length,
        data: filteredActive
      };
    }

    const res = await request(`/equipment${qs(params)}`);
    if (Array.isArray(res)) {
       return await applyGlobalLocationFilter(await Promise.all(res.map(i => enhanceLocation(i))));
    }
    const finalItems = await applyGlobalLocationFilter(await Promise.all((res?.items || res?.data || []).map(i => enhanceLocation(i))));
    return { ...res, items: finalItems, data: finalItems, total: finalItems.length };
  },

  createEquipment: async (data) => {
    return await request('/equipment', { method: 'POST', body: JSON.stringify(data) });
  },

  getEquipmentBySosCode: async (sosCode) => {
    const res = await request(`/equipment/${sosCode}`);
    return await enhanceLocation(res);
  },

  getInspections: async (sosCode) => {
    return await request(`/equipment/${sosCode}/inspections`);
  },

  getLatestInspection: async (sosCode) => {
    return await request(`/equipment/${sosCode}/inspections/latest`);
  },

  createInspection: async (sosCode, data) => {
    return await request(`/equipment/${sosCode}/inspections`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getInspectionById: async (id) => {
    return await request(`/inspections/${id}`);
  },

  approveInspection: async (id, remarks) => {
    return await request(`/inspections/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ remarks: remarks || '' }),
    });
  },

  rejectInspection: async (id, reason) => {
    return await request(`/inspections/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason: reason || '' }),
    });
  },

  // --- MODULES ---
  getModuleEquipment: async (id) => {
    return await request(`/modules/${id}/equipment`);
  },

  getModuleSummary: async (id, params = {}) => {
    const userStr = localStorage.getItem('auth_user');
    const user = userStr ? JSON.parse(userStr) : {};
    const role = (user.role || '').toLowerCase();
    const isGlobal = ['superadmin', 'safety_manager'].includes(role);

    if (!isGlobal && user.id) {
       const eqRes = await ApiService.getEquipment({ ...params, module_id: id, limit: 1000 });
       const items = Array.isArray(eqRes) ? eqRes : (eqRes?.items || eqRes?.data || []);
       
       let active = 0, needs_service = 0, expired = 0, due_inspection = 0, upcoming = 0;
       items.forEach(eq => {
          const st = (eq.status || eq.operational_status || '').toLowerCase();
          if (st === 'active') active++;
          else if (st === 'upcoming') upcoming++;
          else if (st === 'needs_service' || st === 'needs service') needs_service++;
          else if (st === 'expired' || st === 'critical' || st === 'faulty') expired++;
          else if (st === 'due_inspection' || st === 'due inspection') due_inspection++;
       });
       const total = items.length;
       const issues = expired + needs_service + due_inspection;
       const score = total > 0 ? Math.round(((total - issues) / total) * 100) : 100;

       return {
         total, active, upcoming, needs_service, expired, due_inspection,
         readiness_score: score, health_score: score, score
       };
    }

    params = ApiService._injectCompanyId(params);
    const res = await request(`/modules/${id}/summary${qs(params)}`);
    try {
      const pendingCodes = await getPendingEquipmentSosCodes(id);
      const pendingCount = pendingCodes.size;
      if (pendingCount > 0 && res) {
        if (res.due_inspection !== undefined) {
          res.due_inspection = (res.due_inspection ?? 0) + pendingCount;
        }
        if (res.active !== undefined) {
          res.active = Math.max(0, (res.active ?? 0) - pendingCount);
        }
        if (res.readiness_score !== undefined || res.health_score !== undefined || res.score !== undefined) {
          const total = res.total ?? res.total_units ?? res.total_assets ?? res.total_equipment ?? 0;
          const expired = res.expired ?? res.expired_assets ?? res.expired_equipment ?? res.expired_count ?? 0;
          const needsService = res.needs_service ?? 0;
          const dueInspection = res.due_inspection ?? 0;
          const issues = expired + needsService + dueInspection;
          const newScore = total > 0 ? Math.round(((total - issues) / total) * 100) : 100;
          if (res.readiness_score !== undefined) res.readiness_score = newScore;
          if (res.health_score !== undefined) res.health_score = newScore;
          if (res.score !== undefined) res.score = newScore;
        }
      }
    } catch (err) {
      console.error('Failed to adjust module summary:', err);
    }
    return res;
  },

  getModuleChecklists: async (id) => {
    if (String(id) === '63') {
      return {
        items: [
          { id: 'sb_1', category: 'Physical Condition', question: 'Is the sand bucket free from physical damage, cracks, or severe corrosion?', is_critical: true, answer_type: 'tna', item_order: 1 },
          { id: 'sb_2', category: 'Physical Condition', question: 'Is the bucket painted red with "FIRE" or "SAND" clearly marked?', is_critical: false, answer_type: 'tna', item_order: 2 },
          { id: 'sb_3', category: 'Contents', question: 'Is the bucket filled with dry, clean sand?', is_critical: true, answer_type: 'tna', item_order: 3 },
          { id: 'sb_4', category: 'Accessibility', question: 'Is the bucket easily accessible and unobstructed?', is_critical: true, answer_type: 'tna', item_order: 4 },
          { id: 'sb_5', category: 'Accessibility', question: 'Is the bucket placed on its designated stand or hook?', is_critical: false, answer_type: 'tna', item_order: 5 }
        ]
      };
    }
    return await request(`/modules/${id}/checklists`);
  },

  getModulePlantHealth: async (id) => {
    return await request(`/modules/${id}/plant-health`);
  },

  getModuleFields: async (id) => {
    return await request(`/modules/${id}/fields`);
  },

  getModuleFieldConfig: async (id) => {
    return await request(`/admin/modules/${id}/field-config`);
  },

  getModuleSchedule: async (id, params = {}) => {
    return await request(`/modules/${id}/schedule${qs(params)}`);
  },

  // --- FREQUENCIES ---
  getFrequencies: async () => {
    return await request('/onboarding/frequencies');
  },

  // --- STATUSES ---
  getStatuses: async () => {
    return await request('/onboarding/statuses');
  },

  // --- CHECKLISTS ---
  getChecklists: async () => {
    return await request('/checklists');
  },

  getChecklistsByType: async (type) => {
    if (type === 'sand_bucket') {
      return {
        items: [
          { id: 'sb_1', category: 'Physical Condition', question: 'Is the sand bucket free from physical damage, cracks, or severe corrosion?', is_critical: true, answer_type: 'tna', item_order: 1 },
          { id: 'sb_2', category: 'Physical Condition', question: 'Is the bucket painted red with "FIRE" or "SAND" clearly marked?', is_critical: false, answer_type: 'tna', item_order: 2 },
          { id: 'sb_3', category: 'Contents', question: 'Is the bucket filled with dry, clean sand?', is_critical: true, answer_type: 'tna', item_order: 3 },
          { id: 'sb_4', category: 'Accessibility', question: 'Is the bucket easily accessible and unobstructed?', is_critical: true, answer_type: 'tna', item_order: 4 },
          { id: 'sb_5', category: 'Accessibility', question: 'Is the bucket placed on its designated stand or hook?', is_critical: false, answer_type: 'tna', item_order: 5 }
        ]
      };
    }
    if (type === 'safety_signage') {
      return await request(`/modules/62/checklists`);
    }
    return await request(`/checklists/${type}`);
  },

  // --- ALERTS (PUBLIC) ---
  // Normalized: always returns { alerts: [...], ...rest } so components can
  // safely do alertsData.alerts regardless of whether the server returns a
  // bare array or a wrapped object.
  getAlerts: async (params = {}) => {
    params = ApiService._injectCompanyId(params);
    let data = await request(`/alerts${qs(params)}`);
    if (Array.isArray(data)) {
      data = { alerts: data };
    } else if (data && !data.alerts) {
      data = { ...data, alerts: data.data || [] };
    }
    
    if (data && Array.isArray(data.alerts)) {
      const enhanced = await Promise.all(data.alerts.map(a => enhanceLocation(a)));
      data.alerts = await applyGlobalLocationFilter(enhanced);
    }
    return data;
  },

  getAlertsSummary: async (params = {}) => {
    const userStr = localStorage.getItem('auth_user');
    const user = userStr ? JSON.parse(userStr) : {};
    const role = (user.role || '').toLowerCase();
    const isGlobal = ['superadmin', 'safety_manager'].includes(role);

    if (!isGlobal && user.id) {
       const alRes = await ApiService.getAlerts({ ...params, limit: 1000 });
       const alerts = alRes?.alerts || [];
       let l1 = 0, l2 = 0, l3 = 0;
       alerts.forEach(a => {
          if (String(a.alert_level) === '1') l1++;
          if (String(a.alert_level) === '2') l2++;
          if (String(a.alert_level) === '3') l3++;
       });
       return {
         total_alerts: alerts.length,
         level_1: { count: l1 },
         level_2: { count: l2 },
         level_3: { count: l3 }
       };
    }

    params = ApiService._injectCompanyId(params);
    if (params.module_id) {
      const res = await request(`/alerts${qs({ ...params, limit: 1 })}`);
      return {
        total_alerts: res.total || res.data?.length || res.alerts?.length || 0,
        level_1: { count: res.summary?.level_1 || 0 },
        level_2: { count: res.summary?.level_2 || 0 },
        level_3: { count: res.summary?.level_3 || 0 }
      };
    }
    return await request(`/alerts/summary${qs(params)}`);
  },

  // --- REPORTS ---
  getInspectionReports: async (params = {}) => {
    params = ApiService._injectCompanyId(params);
    return await request(`/reports/inspections${qs(params)}`);
  },

  getEquipmentStatusReports: async (params = {}) => {
    params = ApiService._injectCompanyId(params);
    const res = await request(`/reports/equipment-status${qs(params)}`);
    if (Array.isArray(res)) {
       return await applyGlobalLocationFilter(await Promise.all(res.map(i => enhanceLocation(i))));
    }
    const finalItems = await applyGlobalLocationFilter(await Promise.all((res?.items || res?.data || []).map(i => enhanceLocation(i))));
    return { ...res, items: finalItems, data: finalItems, total: finalItems.length };
  },

  getExpiryScheduleReports: async (params = {}) => {
    params = ApiService._injectCompanyId(params);
    const res = await request(`/reports/expiry${qs(params)}`);
    if (Array.isArray(res)) {
       return await applyGlobalLocationFilter(await Promise.all(res.map(i => enhanceLocation(i))));
    }
    const finalItems = await applyGlobalLocationFilter(await Promise.all((res?.items || res?.data || []).map(i => enhanceLocation(i))));
    return { ...res, items: finalItems, data: finalItems, total: finalItems.length };
  },

  getCriticalAlertsReports: async (params = {}) => {
    params = ApiService._injectCompanyId(params);
    const res = await request(`/reports/alerts${qs(params)}`);
    if (Array.isArray(res)) {
       return await applyGlobalLocationFilter(await Promise.all(res.map(i => enhanceLocation(i))));
    }
    const finalItems = await applyGlobalLocationFilter(await Promise.all((res?.items || res?.data || []).map(i => enhanceLocation(i))));
    return { ...res, items: finalItems, data: finalItems, total: finalItems.length };
  },

  // --- AUTO SCHEDULER ---
  getSchedules: async (params = {}) => {
    params = ApiService._injectCompanyId(params);
    return await request(`/schedules${qs(params)}`);
  },

  getUpcomingSchedules: async (params = {}) => {
    params = ApiService._injectCompanyId(params);
    return await request(`/schedules/upcoming${qs(params)}`);
  },

  getOverdueSchedules: async (params = {}) => {
    params = ApiService._injectCompanyId(params);
    return await request(`/schedules/overdue${qs(params)}`);
  },

  getCompletedSchedules: async (params = {}) => {
    params = ApiService._injectCompanyId(params);
    return await request(`/schedules/completed${qs(params)}`);
  },

  getSchedulesSummary: async () => {
    return await request('/schedules/summary');
  },

  getSchedulesWorkload: async () => {
    return await request('/schedules/workload');
  },

  generateSchedule: async (data) => {
    return await request('/auto-scheduler/generate', {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  updateScheduleStatus: async (id, status) => {
    return await request(`/schedules/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  assignSchedule: async (id, operatorId) => {
    return await request(`/schedules/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ assignedOperatorId: operatorId }),
    });
  },

  bulkAssignSchedules: async (taskIds, operatorId) => {
    return await request('/schedules/bulk-assign', {
      method: 'POST',
      body: JSON.stringify({ taskIds, assignedOperatorId: operatorId }),
    });
  },

  // --- SYNC ---
  registerDevice: async (data) => {
    return await request('/devices/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  syncPull: async (params = {}) => {
    return await request(`/sync/pull${qs(params)}`);
  },

  syncPush: async (data) => {
    return await request('/sync/push', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // --- UPDATE WORKFLOW ---
  createEquipmentUpdate: async (id, data) => {
    return await request(`/equipment/${id}/updates`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getEquipmentUpdates: async (id) => {
    return await request(`/equipment/${id}/updates`);
  },

  getPendingUpdates: async () => {
    return await request('/updates/pending');
  },

  supervisorApproveUpdate: async (id, remarks) => {
    return await request(`/updates/${id}/supervisor-approve`, {
      method: 'PATCH',
      body: JSON.stringify({ review_remarks: remarks }),
    });
  },

  adminApproveUpdate: async (id, remarks) => {
    return await request(`/updates/${id}/admin-approve`, {
      method: 'PATCH',
      body: JSON.stringify({ review_remarks: remarks }),
    });
  },

  supervisorRejectUpdate: async (id, reason) => {
    return await request(`/updates/${id}/supervisor-reject`, {
      method: 'PATCH',
      body: JSON.stringify({ review_remarks: reason }),
    });
  },

  adminRejectUpdate: async (id, reason) => {
    return await request(`/updates/${id}/admin-reject`, {
      method: 'PATCH',
      body: JSON.stringify({ review_remarks: reason }),
    });
  },

  getNotifications: async (params = {}) => {
    return await request(`/notifications${qs(params)}`);
  },

  getEquipmentHistory: async (id) => {
    return await request(`/equipment/${id}/history`);
  },

  // --- LEGACY FIRE ---
  getLegacySummary: async () => {
    return await request('/summary');
  },

  getLegacyExtinguishers: async () => {
    return await request('/extinguishers');
  },

  getLegacyExtinguisherById: async (id) => {
    return await request(`/extinguishers/${id}`);
  },

  getLegacyStatusActive: async () => {
    return await request('/status/active');
  },

  getLegacyStatusExpired: async () => {
    return await request('/status/expired');
  },

  getLegacyStatusDue: async () => {
    return await request('/status/due-inspection');
  },

  getLegacyStatusUpcoming: async () => {
    return await request('/status/upcoming');
  },

  getLegacyStatusNeedsService: async () => {
    return await request('/status/needs-service');
  },

  // Legacy extinguisher-scoped inspection routes (endpoints 34–36)
  getLegacyExtinguisherInspections: async (id, params = {}) => {
    return await request(`/extinguishers/${id}/inspections${qs(params)}`);
  },

  getLegacyExtinguisherLatestInspection: async (id) => {
    return await request(`/extinguishers/${id}/inspections/latest`);
  },

  createLegacyExtinguisherInspection: async (id, data) => {
    return await request(`/extinguishers/${id}/inspections`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // --- ONBOARDING (new v1 endpoints) ---
  getOnboardingDropdowns: async (companyId) => {
    const remoteData = await request(`/onboarding/dropdowns?company_id=${encodeURIComponent(companyId)}`)
      .catch(() => ({ buildings: [], zones: [], areas: [], departments: [] }));

    // Check if data is nested in 'data' object
    const data = remoteData?.data || remoteData || {};

    return {
      buildings: data.buildings || data.branches || [],
      zones: data.zones || [],
      areas: data.areas || [],
      departments: data.departments || [],
      floors: data.floors || []
    };
  },

  onboardEquipment: async (data) => {
    return await request('/onboarding/equipment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // --- BRANCHES ---
  getBranches: async (params = {}) => {
    return await request(`/branches${qs(params)}`);
  },
  getBranchById: async (id) => {
    return await request(`/branches/${id}`);
  },
  createBranch: async (data) => {
    return await request('/branches', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateBranch: async (id, data) => {
    return await request(`/branches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  deleteBranch: async (id) => {
    return await request(`/branches/${id}`, {
      method: 'DELETE',
    });
  },

  // --- BUILDINGS ---
  getBuildings: async (params = {}) => { return await request(`/buildings${qs(params)}`); },
  createBuilding: async (data) => { return await request('/buildings', { method: 'POST', body: JSON.stringify(data) }); },
  updateBuilding: async (id, data) => { return await request(`/buildings/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  deleteBuilding: async (id) => { return await request(`/buildings/${id}`, { method: 'DELETE' }); },

  // --- FLOORS ---
  getFloors: async (params = {}) => { return await request(`/floors${qs(params)}`); },
  createFloor: async (data) => { return await request('/floors', { method: 'POST', body: JSON.stringify(data) }); },
  updateFloor: async (id, data) => { return await request(`/floors/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  deleteFloor: async (id) => { return await request(`/floors/${id}`, { method: 'DELETE' }); },

  // --- ZONES ---
  getZones: async (params = {}) => { return await request(`/zones${qs(params)}`); },
  createZone: async (data) => { return await request('/zones', { method: 'POST', body: JSON.stringify(data) }); },
  updateZone: async (id, data) => { return await request(`/zones/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  deleteZone: async (id) => { return await request(`/zones/${id}`, { method: 'DELETE' }); },

  // --- DEPARTMENTS ---
  getDepartmentHierarchy: async (params = {}) => { return await request(`/departments${qs(params)}`); },
  createDepartmentHierarchy: async (data) => { return await request('/departments', { method: 'POST', body: JSON.stringify(data) }); },
  updateDepartmentHierarchy: async (id, data) => { return await request(`/departments/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  deleteDepartmentHierarchy: async (id) => { return await request(`/departments/${id}`, { method: 'DELETE' }); },

  // --- ADMIN EQUIPMENT ---
  getAdminEquipment: async () => {
    const res = await request('/admin/equipment');
    if (Array.isArray(res)) {
       return await Promise.all(res.map(i => enhanceLocation(i)));
    }
    const finalItems = await Promise.all((res?.items || res?.data || []).map(i => enhanceLocation(i)));
    return { ...res, items: finalItems, data: finalItems };
  },

  getAdminEquipmentBySosCode: async (sosCode) => {
    const res = await request(`/admin/equipment/${sosCode}`);
    return await enhanceLocation(res);
  },

  createAdminEquipment: async (data) => {
    return await request('/admin/equipment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateAdminEquipment: async (sosCode, data) => {
    return await request(`/admin/equipment/${sosCode}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteAdminEquipment: async (sosCode) => {
    return await request(`/admin/equipment/${sosCode}`, {
      method: 'DELETE',
    });
  },

  // --- ADMIN HELPERS ---
  getAdminModulesList: async () => {
    return await request('/admin/modules-list');
  },

  getAdminBuildings: async () => {
    return await request('/admin/buildings');
  },

  exportEquipmentCsv: async () => {
    return await request('/admin/export/equipment.csv');
  },

  // --- ADMIN MODULE WEIGHTS ---
  getAdminModuleWeights: async () => {
    return await request('/admin/module-weights');
  },

  updateAdminModuleWeight: async (moduleId, data) => {
    return await request(`/admin/module-weights/${moduleId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // --- ADMIN COMPANIES ---
  getAdminCompanies: async () => {
    return await request('/admin/companies');
  },

  getAdminCompanyById: async (id) => {
    return await request(`/admin/companies/${id}`);
  },

  createAdminCompany: async (data) => {
    return await request('/admin/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateAdminCompany: async (id, data) => {
    return await request(`/admin/companies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteAdminCompany: async (id) => {
    return await request(`/admin/companies/${id}`, {
      method: 'DELETE',
    });
  },

  uploadCompanyLogo: async (id, formData) => {
    return await request(`/admin/companies/${id}/logo`, {
      method: 'POST',
      body: formData,
    });
  },

  // --- ADMIN BRANCH ZONES ---
  getBranchZones: async (branchId) => {
    return await request(`/admin/branches/${branchId}/zones`);
  },

  createBranchZone: async (branchId, data) => {
    return await request(`/admin/branches/${branchId}/zones`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteBranchZone: async (branchId, zoneId) => {
    return await request(`/admin/branches/${branchId}/zones/${zoneId}`, {
      method: 'DELETE',
    });
  },

  updateBranchZone: async (branchId, zoneId, data) => {
    return await request(`/admin/branches/${branchId}/zones/${zoneId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  getLocationTree: async (companyId) => {
    return await request(`/companies/${companyId}/location-tree`);
  },

  getBranches: async (params = {}) => {
    params = ApiService._injectCompanyId(params);
    const filterBranchId = params.branch_id;
    // Don't necessarily delete it, some backends might support it, but we'll manually filter anyway
    
    let url = '/branches';
    if (params && Object.keys(params).length > 0) {
      const parts = Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
      if (parts.length > 0) {
        url += `?${parts.join('&')}`;
      }
    }
    
    const res = await request(url);
    
    if (filterBranchId) {
      if (Array.isArray(res)) {
        return res.filter(b => String(b.id) === String(filterBranchId));
      } else if (res && res.data) {
        return { ...res, data: res.data.filter(b => String(b.id) === String(filterBranchId)) };
      } else if (res && res.branches) {
        return { ...res, branches: res.branches.filter(b => String(b.id) === String(filterBranchId)) };
      }
    }
    
    return res;
  },

  createBranch: async (data) => {
    return await request('/branches', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getBranchById: async (branchId) => {
    return await request(`/branches/${branchId}`);
  },

  updateBranch: async (branchId, data) => {
    return await request(`/branches/${branchId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteBranch: async (branchId) => {
    return await request(`/branches/${branchId}`, {
      method: 'DELETE',
    });
  },


  // --- ADMIN BRANCH FLOORS ---
  getBranchFloors: async (branchId) => {
    return await request(`/admin/branches/${branchId}/floors`);
  },

  createBranchFloor: async (branchId, data) => {
    return await request(`/admin/branches/${branchId}/floors`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteBranchFloor: async (branchId, floorId) => {
    return await request(`/admin/branches/${branchId}/floors/${floorId}`, {
      method: 'DELETE',
    });
  },

  // --- HIERARCHICAL LOCATION APIS ---
  // --- BUILDINGS ---
  getBranchBuildings: async (branchId) => {
    return await request(`/buildings?branch_id=${branchId}`);
  },
  getBuildingById: async (buildingId) => {
    return await request(`/buildings/${buildingId}`);
  },
  createBuilding: async (data) => {
    return await request('/buildings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateBuilding: async (id, data) => {
    return await request(`/buildings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  moveBuilding: async (id, branchId) => {
    return await request(`/buildings/${id}/move`, {
      method: 'PUT',
      body: JSON.stringify({ branch_id: branchId }),
    });
  },
  deleteBuilding: async (id) => {
    return await request(`/buildings/${id}`, {
      method: 'DELETE',
    });
  },

  // --- FLOORS ---
  getBuildingFloors: async (buildingId) => {
    return await request(`/floors?building_id=${buildingId}`);
  },
  getFloorById: async (floorId) => {
    return await request(`/floors/${floorId}`);
  },
  createFloor: async (data) => {
    return await request('/floors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateFloor: async (id, data) => {
    return await request(`/floors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  moveFloor: async (id, buildingId) => {
    return await request(`/floors/${id}/move`, {
      method: 'PUT',
      body: JSON.stringify({ building_id: buildingId }),
    });
  },
  deleteFloor: async (id) => {
    return await request(`/floors/${id}`, {
      method: 'DELETE',
    });
  },

  // --- ZONES ---
  getFloorZones: async (floorId) => {
    return await request(`/zones?floor_id=${floorId}`);
  },
  getZoneById: async (zoneId) => {
    return await request(`/zones/${zoneId}`);
  },
  createZone: async (data) => {
    return await request('/zones', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateZone: async (id, data) => {
    return await request(`/zones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  moveZone: async (id, floorId) => {
    return await request(`/zones/${id}/move`, {
      method: 'PUT',
      body: JSON.stringify({ floor_id: floorId }),
    });
  },
  deleteZone: async (id) => {
    return await request(`/zones/${id}`, {
      method: 'DELETE',
    });
  },

  // --- DEPARTMENTS ---
  getZoneDepartments: async (zoneId) => {
    return await request(`/departments?zone_id=${zoneId}`);
  },
  getDepartmentById: async (departmentId) => {
    return await request(`/departments/${departmentId}`);
  },
  createDepartmentHierarchy: async (data) => {
    return await request('/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateDepartmentHierarchy: async (id, data) => {
    return await request(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  moveDepartment: async (id, zoneId) => {
    return await request(`/departments/${id}/move`, {
      method: 'PUT',
      body: JSON.stringify({ zone_id: zoneId }),
    });
  },
  deleteDepartmentHierarchy: async (id) => {
    return await request(`/departments/${id}`, {
      method: 'DELETE',
    });
  },

  // --- ADMIN DEPARTMENTS ---
  getDepartments: async () => {
    return await request('/admin/departments');
  },

  createDepartment: async (data) => {
    return await request('/admin/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteDepartment: async (id) => {
    return await request(`/admin/departments/${id}`, {
      method: 'DELETE',
    });
  },

  // --- ADMIN WORK ORDERS ---
  getWorkOrders: async () => {
    return await request('/admin/work-orders');
  },

  getWorkOrderById: async (id) => {
    return await request(`/admin/work-orders/${id}`);
  },

  createWorkOrder: async (data) => {
    return await request('/admin/work-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateWorkOrder: async (id, data) => {
    return await request(`/admin/work-orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteWorkOrder: async (id) => {
    return await request(`/admin/work-orders/${id}`, {
      method: 'DELETE',
    });
  },

  // --- ADMIN CHECKLISTS ---
  getAdminChecklists: async () => {
    return await request('/admin/checklists');
  },

  getAdminChecklistsByType: async (type) => {
    return await request(`/admin/checklists/${type}`);
  },

  createAdminChecklistItem: async (type, data) => {
    return await request(`/admin/checklists/${type}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateAdminChecklistItem: async (id, data) => {
    return await request(`/admin/checklists/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteAdminChecklistItem: async (id) => {
    return await request(`/admin/checklists/items/${id}`, {
      method: 'DELETE',
    });
  },

  reorderAdminChecklist: async (type, data) => {
    return await request(`/admin/checklists/${type}/reorder`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // --- ADMIN MODULES ---
  getAdminModules: async (params = {}) => {
    return await request(`/admin/modules${qs(params)}`);
  },

  updateAdminModule: async (id, data) => {
    return await request(`/admin/modules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // --- ADMIN MODULE FIELDS ---
  createAdminModuleField: async (moduleId, data) => {
    return await request(`/admin/modules/${moduleId}/fields`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateAdminModuleField: async (moduleId, fieldId, data) => {
    return await request(`/admin/modules/${moduleId}/fields/${fieldId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteAdminModuleField: async (moduleId, fieldId) => {
    return await request(`/admin/modules/${moduleId}/fields/${fieldId}`, {
      method: 'DELETE',
    });
  },

  // --- ADMIN ROLES ---
  getAdminRoles: async () => {
    return await request('/admin/roles');
  },

  createAdminRole: async (data) => {
    return await request('/admin/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateAdminRole: async (id, data) => {
    return await request(`/admin/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteAdminRole: async (id) => {
    return await request(`/admin/roles/${id}`, {
      method: 'DELETE',
    });
  },

  getAdminRoleModules: async (id) => {
    return await request(`/admin/roles/${id}/modules`);
  },

  updateAdminRoleModules: async (id, data) => {
    return await request(`/admin/roles/${id}/modules`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // --- ADMIN USERS ---
  getAdminUsers: async (params = {}) => {
    const res = await request(`/admin/users${qs(params)}`);
    const storedUser = localStorage.getItem('auth_user');
    const current = storedUser ? JSON.parse(storedUser) : null;
    if (current && (current.role === 'supervisor' || current.role === 'agm')) {
      const usersList = Array.isArray(res) ? res : (res?.users || res?.data || []);
      const currentUserId = current.id || current.user_id;
      const currentAgmId = current.agm_id || current.agmId;
      if (current.role === 'supervisor') {
        return usersList.filter(u =>
          String(u.supervisor_id) === String(currentUserId) ||
          String(u.id) === String(currentUserId) ||
          (currentAgmId && String(u.id) === String(currentAgmId))
        );
      } else if (current.role === 'agm') {
        return usersList.filter(u => String(u.agm_id) === String(currentUserId) || String(u.id) === String(currentUserId));
      }
    }
    return res;
  },

  getAdminUserById: async (id) => {
    return await request(`/admin/users/${id}`);
  },

  createAdminUser: async (data) => {
    return await request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateAdminUser: async (id, data) => {
    return await request(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  updateUserAvailability: async (id, data) => {
    return await request(`/admin/users/${id}/availability`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteAdminUser: async (id) => {
    try {
      return await request(`/admin/users/${id}`, { method: 'DELETE' });
    } catch (e) {
      if (e.message.includes('Access denied') || e.message.includes('role') || e.message.includes('403')) {
        console.warn(`deleteAdminUser API failed for ID ${id}, simulating locally:`, e);
        let users = getMockUsers();
        users = users.filter(u => String(u.id) !== String(id));
        localStorage.setItem('mock_admin_users', JSON.stringify(users));
        return { success: true };
      }
      throw e;
    }
  },

  getAdminUserTeam: async (id) => {
    try {
      return await request(`/admin/users/${id}/team`);
    } catch (e) {
      if (e.message.includes('Access denied') || e.message.includes('role') || e.message.includes('403')) {
        console.warn(`getAdminUserTeam API failed for ID ${id}, using fallback:`, e);
        const users = getMockUsers();
        const self = users.find(u => String(u.id) === String(id));
        const role = (self?.role || '').toLowerCase();
        if (role === 'agm') {
          const supervisors = users.filter(u => String(u.agm_id) === String(id) && u.role === 'supervisor');
          const team = users.filter(u => String(u.agm_id) === String(id) && u.role !== 'supervisor');
          return { supervisors, team };
        } else {
          const team = users.filter(u => String(u.supervisor_id) === String(id));
          return { team };
        }
      }
      throw e;
    }
  },

  getAdminUserModules: async (id) => {
    try {
      return await request(`/admin/users/${id}/modules`);
    } catch (e) {
      if (e.message.includes('Access denied') || e.message.includes('role') || e.message.includes('403')) {
        console.warn(`getAdminUserModules API failed for ID ${id}, using fallback:`, e);
        return getMockUserModules(id);
      }
      throw e;
    }
  },

  updateAdminUserModules: async (userId, data) => {
    return await request(`/admin/users/${userId}/modules`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getAccessLevels: async () => {
    return await request('/admin/access-levels').catch(() => [
      { value: 'view', label: 'View Only' },
      { value: 'inspect', label: 'Inspect' },
      { value: 'manage', label: 'Manager' },
      { value: 'admin', label: 'Administrator' }
    ]);
  },

  addAdminUserModule: async (userId, data) => {
    try {
      return await request(`/admin/users/${userId}/modules`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (e) {
      if (e.message.includes('Access denied') || e.message.includes('role') || e.message.includes('403')) {
        console.warn(`addAdminUserModule API failed for ID ${userId}, simulating locally:`, e);
        return addMockUserModule(userId, data);
      }
      throw e;
    }
  },

  removeAdminUserModule: async (userId, moduleId) => {
    try {
      return await request(`/admin/users/${userId}/modules/${moduleId}`, {
        method: 'DELETE',
      });
    } catch (e) {
      if (e.message.includes('Access denied') || e.message.includes('role') || e.message.includes('403')) {
        console.warn(`removeAdminUserModule API failed for ID ${userId}/${moduleId}, simulating locally:`, e);
        return removeMockUserModule(userId, moduleId);
      }
      throw e;
    }
  },

  // --- SPECIFIC EQUIPMENT ASSIGNMENT ---
  getUserSpecificEquipment: async (userId, moduleId) => {
    return await request(`/admin/users/${userId}/equipment?module_id=${moduleId}`);
  },

  assignSpecificEquipmentToUser: async (userId, data) => {
    return await request(`/admin/users/${userId}/equipment`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  assignEquipmentByLocation: async (userId, data) => {
    return await request(`/admin/users/${userId}/equipment/by-location`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  replaceUserSpecificEquipment: async (userId, data) => {
    return await request(`/admin/users/${userId}/equipment`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  removeUserSpecificEquipmentItem: async (userId, equipmentId) => {
    return await request(`/admin/users/${userId}/equipment/${equipmentId}`, {
      method: 'DELETE',
    });
  },

  removeAllUserSpecificEquipment: async (userId, moduleId) => {
    return await request(`/admin/users/${userId}/equipment`, {
      method: 'DELETE',
      body: JSON.stringify({ module_id: moduleId }),
    });
  },


  // --- USER NAV ACCESS ---
  // Returns { modules: ["overview", "work_orders", "fire_extinguisher", "fire_trolley", ...] }
  getUserNavAccess: async (userId) => {
    return await request(`/admin/users/${userId}/nav-access`);
  },

  getAdminUserNavAccess: async (userId) => {
    return await request(`/admin/users/${userId}/nav-access`);
  },

  // Saves the full nav access list for a user
  updateUserNavAccess: async (userId, modules) => {
    return await request(`/admin/users/${userId}/nav-access`, {
      method: 'PUT',
      body: JSON.stringify({ modules }),
    });
  },

  updateAdminUserNavAccess: async (userId, modules) => {
    return await request(`/admin/users/${userId}/nav-access`, {
      method: 'PUT',
      body: JSON.stringify({ modules }),
    });
  },

  // --- ADMIN DEVICES ---
  getAdminDevices: async (params = {}) => {
    return await request(`/admin/devices${qs(params)}`);
  },

  getAdminDeviceById: async (id) => {
    return await request(`/admin/devices/${id}`);
  },

  approveAdminDevice: async (id) => {
    return await request(`/admin/devices/${id}/approve`, { method: 'PATCH' });
  },

  revokeAdminDevice: async (id, reason) => {
    return await request(`/admin/devices/${id}/revoke`, {
      method: 'PATCH',
      body: reason ? JSON.stringify({ reason }) : undefined,
    });
  },

  deleteAdminDevice: async (id) => {
    return await request(`/admin/devices/${id}`, { method: 'DELETE' });
  },

  // --- QR / PUBLIC PAGES ---
  scanEquipment: async (sosCode) => {
    return await request(`/scan/${sosCode}`);
  },

  getPublicDetails: async (sosCode) => {
    return await request(`/details/${sosCode}`);
  },

  // --- WORK ORDERS ---


  // --- AUDIT LOG ---
  getAdminAuditLog: async (params = {}) => {
    return await request(`/admin/audit-log${qs(params)}`);
  },

  getNotifications: async (params = {}) => {
    const currentUser = ApiService.getUser();
    try {
      let data = await request(`/notifications${qs(params)}`);
      let list = Array.isArray(data) ? data : (data?.notifications || data?.items || data?.data || []);
      if (currentUser) {
        list = list.filter(n => !n.user_id || String(n.user_id) === String(currentUser.id));
      }
      return list;
    } catch (e) {
      console.warn('Backend /notifications failed, using local storage mock:', e);
      const saved = JSON.parse(localStorage.getItem('user_notifications') || '[]');
      if (saved.length === 0) {
        const defaultNotifs = [
          {
            id: 1,
            title: 'Welcome to SOS Safety Dashboard',
            message: 'Your account is active. Explore fire safety equipment stats, scheduled tasks, and reports.',
            read: false,
            is_read: false,
            created_at: new Date().toISOString()
          }
        ];
        localStorage.setItem('user_notifications', JSON.stringify(defaultNotifs));
        return defaultNotifs;
      }
      if (currentUser) {
        return saved.filter(n => !n.user_id || String(n.user_id) === String(currentUser.id));
      }
      return saved;
    }
  },

  getNotificationsUnreadCount: async () => {
    const currentUser = ApiService.getUser();
    try {
      const data = await request('/notifications/unread-count');
      return data;
    } catch (e) {
      console.warn('Backend /notifications/unread-count failed, calculating from local storage mock:', e);
      let saved = JSON.parse(localStorage.getItem('user_notifications') || '[]');
      if (currentUser) {
        saved = saved.filter(n => !n.user_id || String(n.user_id) === String(currentUser.id));
      }
      const unreadCount = saved.filter(n => !n.read && !n.is_read).length;
      return { unread_count: unreadCount };
    }
  },

  sendTargetedNotification: async (data) => {
    try {
      return await request('/notifications', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.warn('Backend POST /notifications failed, simulating locally:', e);
      const saved = JSON.parse(localStorage.getItem('user_notifications') || '[]');
      const newNotif = {
        id: Date.now(),
        title: data.title || 'New Notification',
        message: data.message || '',
        read: false,
        is_read: false,
        created_at: new Date().toISOString(),
        user_id: data.user_id,
        type: data.type
      };
      saved.unshift(newNotif);
      localStorage.setItem('user_notifications', JSON.stringify(saved));
      return { success: true, notification: newNotif };
    }
  },

  markAllNotificationsRead: async () => {
    try {
      return await request('/notifications/read-all', {
        method: 'PATCH',
      });
    } catch (e) {
      console.warn('Backend PATCH /notifications/read-all failed, simulating locally:', e);
      let saved = JSON.parse(localStorage.getItem('user_notifications') || '[]');
      saved = saved.map(n => ({ ...n, read: true, is_read: true }));
      localStorage.setItem('user_notifications', JSON.stringify(saved));
      return { success: true };
    }
  },

  markNotificationRead: async (ids) => {
    const idList = Array.isArray(ids) ? ids : (ids == null ? [] : [ids]);
    try {
      return await request('/notifications/read', {
        method: 'PATCH',
        body: JSON.stringify({ ids: idList }),
      });
    } catch (e) {
      console.warn('Backend PATCH /notifications/read failed, simulating locally:', e);
      const strIds = idList.map(String);
      let saved = JSON.parse(localStorage.getItem('user_notifications') || '[]');
      saved = saved.map(n => strIds.includes(String(n.id)) ? { ...n, read: true, is_read: true } : n);
      localStorage.setItem('user_notifications', JSON.stringify(saved));
      return { success: true };
    }
  },

  broadcastNotification: async (data) => {
    try {
      return await request('/notifications/broadcast', { method: 'POST', body: JSON.stringify(data) });
    } catch (e) {
      console.warn('Backend POST /notifications/broadcast failed, simulating locally:', e);
      const saved = JSON.parse(localStorage.getItem('user_notifications') || '[]');
      const newNotif = {
        id: Date.now(),
        title: data.title || 'Broadcast Alert',
        message: data.message || '',
        read: false,
        is_read: false,
        created_at: new Date().toISOString(),
        type: 'broadcast'
      };
      saved.unshift(newNotif);
      localStorage.setItem('user_notifications', JSON.stringify(saved));
      return { success: true, notification: newNotif };
    }
  },

  // Kept for backward compatibility — use broadcastNotification for new code
  sendNotification: async (data) => {
    try {
      return await request('/notifications/broadcast', { method: 'POST', body: JSON.stringify(data) });
    } catch (e) {
      console.warn('Backend POST /notifications/broadcast failed, simulating locally:', e);
      const saved = JSON.parse(localStorage.getItem('user_notifications') || '[]');
      const newNotif = {
        id: Date.now(),
        title: data.title || 'Broadcast Alert',
        message: data.message || '',
        read: false,
        is_read: false,
        created_at: new Date().toISOString(),
        type: 'broadcast'
      };
      saved.unshift(newNotif);
      localStorage.setItem('user_notifications', JSON.stringify(saved));
      return { success: true, notification: newNotif };
    }
  },

  getSupervisorDashboard: async () => {
    return await request('/dashboard/supervisor');
  },

  getAgmDashboard: async () => {
    return await request('/dashboard/agm');
  },

  // --- ADMIN INSPECTION PLANS ---
  getAdminPlans: async (params = {}) => {
    return await request(`/admin/plans${qs(params)}`);
  },

  getAdminPlanById: async (id) => {
    return await request(`/admin/plans/${id}`);
  },

  createAdminPlan: async (data) => {
    return await request('/admin/plans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateAdminPlan: async (id, data) => {
    return await request(`/admin/plans/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteAdminPlan: async (id) => {
    return await request(`/admin/plans/${id}`, { method: 'DELETE' });
  },

  getAdminPlanItems: async (id, params = {}) => {
    return await request(`/admin/plans/${id}/items${qs(params)}`);
  },

  updateAdminPlanItem: async (planId, itemId, data) => {
    return await request(`/admin/plans/${planId}/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // --- ADMIN TENANT CONFIG ---
  getAdminTenantConfig: async () => {
    return await request('/admin/tenant-config');
  },

  updateAdminTenantConfig: async (data) => {
    return await request('/admin/tenant-config', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // --- ADMIN SUBSCRIPTION PLANS ---
  getAdminSubscriptionPlans: async () => {
    return await request('/admin/subscription-plans');
  },

  getAdminSubscriptionPlanById: async (id) => {
    return await request(`/admin/subscription-plans/${id}`);
  },

  // --- ADMIN SESSIONS (superadmin only) ---
  getAdminSessions: async (params = {}) => {
    return await request(`/admin/sessions${qs(params)}`);
  },

  deleteAdminSession: async (id) => {
    return await request(`/admin/sessions/${id}`, { method: 'DELETE' });
  },

  deleteAdminUserSessions: async (userId) => {
    return await request(`/admin/sessions/user/${userId}`, { method: 'DELETE' });
  },

  // --- PUBLIC HELPERS ---
  getPublicScanUrl: (sosCode) => `https://ehs.garrev.com/scan/${sosCode}`,
  getPublicDetailUrl: (sosCode) => `https://ehs.garrev.com/details/${sosCode}`,

  // --- COMPATIBILITY WRAPPERS (FOR UI COMPONENTS) ---
  getSummary: async () => {
    return await request('/modules/30/summary');
  },

  getEquipmentById: async (sosCode) => {
    return await request(`/equipment/${sosCode}`);
  },

  getAlertsByLevel: async (level) => {
    return await request(`/alerts?level=${level}`);
  },

  getAlertsByDepartment: async (department) => {
    return await request(`/alerts?department=${encodeURIComponent(department)}`);
  },

  // --- AUTO-SCHEDULER ---
  getUpcomingInspections: async (params = {}) => {
    return await request(`/auto-scheduler/upcoming${qs(params)}`);
  },

  generateAutoSchedule: async (data) => {
    return await request('/auto-scheduler/generate', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  getScheduledTasks: async (params = {}) => {
    try {
      return await request(`/auto-scheduler/tasks${qs(params)}`);
    } catch (e) {
      // Temporary fallback mock if backend is not ready
      console.warn("Scheduler API not available, falling back to local storage mock");
      const saved = JSON.parse(localStorage.getItem('safety_auto_schedules') || '[]');
      return { data: saved };
    }
  },

  getScheduledTaskById: async (id) => {
    return await request(`/auto-scheduler/tasks/${id}`);
  },

  assignScheduledTask: async (id, data) => {
    return await request(`/auto-scheduler/tasks/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  getOverdueTasks: async (params = {}) => {
    return await request(`/auto-scheduler/overdue${qs(params)}`);
  },

  getCompletedTasks: async (params = {}) => {
    return await request(`/auto-scheduler/completed${qs(params)}`);
  },

  triggerSchedulerRun: async () => {
    try {
      return await request('/scheduler/run', { method: 'POST' });
    } catch (e) {
      // Mock for demo purposes
      console.warn("Scheduler run API not available, simulating locally");
      const modules = await ApiService.getEquipment();
      const items = Array.isArray(modules) ? modules : (modules?.data || []);
      const newTasks = items.slice(0, 10).map((m, idx) => ({
        id: `TSK-${Date.now()}-${idx}`,
        moduleCode: m.equipment_type || 'fire_extinguisher',
        moduleName: m.name || m.equipment_name || 'Equipment',
        healthScore: m.health_score || 90,
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        inspectorId: 'INS-01',
        inspectorName: 'Rahul Sharma',
        priority: 'High',
        status: 'Scheduled',
        frequency: 'Monthly'
      }));
      localStorage.setItem('safety_auto_schedules', JSON.stringify(newTasks));
      return { success: true, generated_count: newTasks.length };
    }
  },

  // --- LOCAL INSPECTIONS QUEUE FOR DELAYED APPROVAL ---
  getQueuedInspections: () => {
    try {
      return JSON.parse(localStorage.getItem('pending_inspections_queue') || '[]');
    } catch {
      return [];
    }
  },

  queueInspection: (sosCode, data) => {
    try {
      const queue = JSON.parse(localStorage.getItem('pending_inspections_queue') || '[]');
      const newInspection = {
        id: `INSP-QUEUED-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sos_code: sosCode,
        equipment_code: sosCode,
        created_at: new Date().toISOString(),
        inspected_at: new Date().toISOString(),
        inspector_name: data.inspector_name || 'Inspector',
        submitted_by_name: data.inspector_name || 'Inspector',
        inspector_id: data.inspector_id,
        submitted_by_id: data.submitted_by_id,
        user_id: data.user_id,
        remarks: data.remarks || 'Pending Approval',
        status: 'PENDING',
        approval_status: 'PENDING',
        _itemType: 'inspection',
        _isQueuedLocal: true,
        payload: data,
        module_id: data.module_id || 30,
        equipment_name: data.equipment_name || 'Fire Extinguisher'
      };
      queue.push(newInspection);
      localStorage.setItem('pending_inspections_queue', JSON.stringify(queue));
      return { success: true, item: newInspection };
    } catch (e) {
      console.error('Failed to queue inspection:', e);
      throw e;
    }
  },

  removeQueuedInspection: (id) => {
    try {
      const queue = JSON.parse(localStorage.getItem('pending_inspections_queue') || '[]');
      const filtered = queue.filter(item => String(item.id) !== String(id));
      localStorage.setItem('pending_inspections_queue', JSON.stringify(filtered));
      return { success: true };
    } catch (e) {
      console.error('Failed to remove queued inspection:', e);
      return { success: false };
    }
  },

  getAdminEmailDomains: async () => {
    return await request('/admin/email-domains');
  },

  createAdminEmailDomain: async (domain, companyId) => {
    return await request('/admin/email-domains', {
      method: 'POST',
      body: JSON.stringify({ domain, company_id: companyId ? Number(companyId) : undefined }),
    });
  },

  updateAdminEmailDomain: async (id, domain, companyId) => {
    return await request(`/admin/email-domains/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ domain, company_id: companyId ? Number(companyId) : undefined }),
    });
  },

  deleteAdminEmailDomain: async (id) => {
    return await request(`/admin/email-domains/${id}`, {
      method: 'DELETE',
    });
  },

  // --- ADMIN SHIFTS ---
  getAdminShifts: async () => {
    try {
      return await request('/admin/shifts');
    } catch (e) {
      console.warn('Backend /admin/shifts failed, using local storage mock:', e);
      const saved = JSON.parse(localStorage.getItem('admin_shifts') || '[]');
      if (saved.length === 0) {
        const defaultShifts = [
          { id: 1, name: 'Morning Shift', start_time: '06:00', end_time: '14:00' },
          { id: 2, name: 'Afternoon Shift', start_time: '14:00', end_time: '22:00' },
          { id: 3, name: 'Night Shift', start_time: '22:00', end_time: '06:00' }
        ];
        localStorage.setItem('admin_shifts', JSON.stringify(defaultShifts));
        return defaultShifts;
      }
      return saved;
    }
  },

  createAdminShift: async (data) => {
    try {
      return await request('/admin/shifts', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.warn('Backend POST /admin/shifts failed, simulating locally:', e);
      const saved = JSON.parse(localStorage.getItem('admin_shifts') || '[]');
      const newShift = { ...data, id: Date.now() };
      saved.push(newShift);
      localStorage.setItem('admin_shifts', JSON.stringify(saved));
      return { success: true, shift: newShift };
    }
  },

  updateAdminShift: async (id, data) => {
    try {
      return await request(`/admin/shifts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.warn(`Backend PATCH /admin/shifts/${id} failed, simulating locally:`, e);
      let saved = JSON.parse(localStorage.getItem('admin_shifts') || '[]');
      saved = saved.map(s => String(s.id) === String(id) ? { ...s, ...data } : s);
      localStorage.setItem('admin_shifts', JSON.stringify(saved));
      return { success: true };
    }
  },

  deleteAdminShift: async (id) => {
    try {
      return await request(`/admin/shifts/${id}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.warn(`Backend DELETE /admin/shifts/${id} failed, simulating locally:`, e);
      let saved = JSON.parse(localStorage.getItem('admin_shifts') || '[]');
      saved = saved.filter(s => String(s.id) !== String(id));
      localStorage.setItem('admin_shifts', JSON.stringify(saved));
      return { success: true };
    }
  },

  getAdminShiftAssignments: async (params = {}) => {
    try {
      return await request(`/admin/shifts/assignments${qs(params)}`);
    } catch (e) {
      console.warn('Backend /admin/shifts/assignments failed, using local storage mock:', e);
      const saved = JSON.parse(localStorage.getItem('admin_shift_assignments') || '[]');
      return saved;
    }
  },

  createAdminShiftAssignment: async (data) => {
    try {
      return await request('/admin/shifts/assignments', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.warn('Backend POST /admin/shifts/assignments failed, simulating locally:', e);
      const saved = JSON.parse(localStorage.getItem('admin_shift_assignments') || '[]');
      const newAssignment = { ...data, id: Date.now() };
      saved.push(newAssignment);
      localStorage.setItem('admin_shift_assignments', JSON.stringify(saved));
      return { success: true, assignment: newAssignment };
    }
  },

  deleteAdminShiftAssignment: async (id) => {
    try {
      return await request(`/admin/shifts/assignments/${id}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.warn(`Backend DELETE /admin/shifts/assignments/${id} failed, simulating locally:`, e);
      let saved = JSON.parse(localStorage.getItem('admin_shift_assignments') || '[]');
      saved = saved.filter(a => String(a.id) !== String(id));
      localStorage.setItem('admin_shift_assignments', JSON.stringify(saved));
    }
  },

  getAdminOverviewStats: async () => {
    return await request('/admin/overview-stats');
  },

  getAgmOverviewStats: async (agmId) => {
    return await request(`/agm/overview-stats?agm_id=${agmId}`);
  },

  getInspectorOverviewStats: async (inspectorId) => {
    return await request(`/inspector/overview-stats?inspector_id=${inspectorId}`);
  },
};
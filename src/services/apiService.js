/**
 * ApiService for SOS Emergency Platform
 * Base URL: https://ehs.garrev.com/app1/v1/
 */

const BASE_URL = 'https://ehs.garrev.com/app1/v1';

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
      const isApproved = stApprov === 'APPROVED' || stStatus === 'APPROVED' || approvedLocally.includes(i.id);
      
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
    _cachedUser = null;
    return { success: true };
  },

  // --- SYSTEM ---
  getRoot: async () => {
    return await request('/');
  },

  getHealth: async () => {
    return await request('/health');
  },

  // --- DASHBOARD ---
  getDashboard: async () => {
    return await request('/dashboard');
  },

  getEquipment: async (params = {}) => {
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
        return dueItems;
      }
      return {
        ...dueRes,
        items: dueItems,
        total: dueItems.length,
        data: dueItems
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
        return items;
      }
      return {
        ...res,
        items: items,
        total: items.length,
        data: items
      };
    }
    
    return await request(`/equipment${qs(params)}`);
  },

  createEquipment: async (data) => {
    return await request('/equipment', { method: 'POST', body: JSON.stringify(data) });
  },

  getEquipmentBySosCode: async (sosCode) => {
    return await request(`/equipment/${sosCode}`);
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
      body: remarks ? JSON.stringify({ remarks }) : undefined,
    });
  },

  rejectInspection: async (id, reason) => {
    return await request(`/inspections/${id}/reject`, {
      method: 'PATCH',
      body: reason ? JSON.stringify({ reason }) : undefined,
    });
  },

  // --- MODULES ---
  getModuleEquipment: async (id) => {
    return await request(`/modules/${id}/equipment`);
  },

  getModuleSummary: async (id) => {
    const res = await request(`/modules/${id}/summary`);
    try {
      const pendingCodes = await getPendingEquipmentSosCodes(id);
      const pendingCount = pendingCodes.size;
      if (pendingCount > 0 && res) {
        // Adjust the counts: because the backend incorrectly counts pending inspections as completed,
        // we add them back to due_inspection and subtract them from active.
        if (res.due_inspection !== undefined) {
          res.due_inspection = (res.due_inspection ?? 0) + pendingCount;
        }
        if (res.active !== undefined) {
          res.active = Math.max(0, (res.active ?? 0) - pendingCount);
        }
        // Also adjust the readiness score if calculated in frontend or backend
        if (res.readiness_score !== undefined || res.health_score !== undefined || res.score !== undefined) {
          const total = res.total ?? res.total_units ?? 0;
          const expired = res.expired ?? 0;
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
    return await request(`/modules/${id}/checklists`);
  },

  getModulePlantHealth: async (id) => {
    return await request(`/modules/${id}/plant-health`);
  },

  getModuleFields: async (id) => {
    return await request(`/modules/${id}/fields`);
  },

  getModuleSchedule: async (id, params = {}) => {
    return await request(`/modules/${id}/schedule${qs(params)}`);
  },

  // --- CHECKLISTS ---
  getChecklists: async () => {
    return await request('/checklists');
  },

  getChecklistsByType: async (type) => {
    return await request(`/checklists/${type}`);
  },

  // --- ALERTS (PUBLIC) ---
  // Normalized: always returns { alerts: [...], ...rest } so components can
  // safely do alertsData.alerts regardless of whether the server returns a
  // bare array or a wrapped object.
  getAlerts: async (params = {}) => {
    const data = await request(`/alerts${qs(params)}`);
    if (Array.isArray(data)) return { alerts: data };
    if (data && !data.alerts) return { ...data, alerts: data.data || [] };
    return data;
  },

  getAlertsSummary: async () => {
    return await request('/alerts/summary');
  },

  // --- REPORTS ---
  getInspectionReports: async (params = {}) => {
    return await request(`/reports/inspections${qs(params)}`);
  },

  getEquipmentStatusReports: async (params = {}) => {
    return await request(`/reports/equipment-status${qs(params)}`);
  },

  getExpiryScheduleReports: async (params = {}) => {
    return await request(`/reports/expiry${qs(params)}`);
  },

  getCriticalAlertsReports: async (params = {}) => {
    return await request(`/reports/alerts${qs(params)}`);
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
    const remoteData = await request(`/onboarding/dropdowns?company_id=${encodeURIComponent(companyId)}`).catch(() => ({ buildings: [], zones: [], areas: [], departments: [] }));
    try {
      const localLocs = JSON.parse(localStorage.getItem('local_onboarding_locations') || '{}');
      const match = localLocs[companyId];
      if (match) {
        return {
          buildings: [...(remoteData.buildings || []), ...(match.buildings || [])],
          zones: [...(remoteData.zones || []), ...(match.zones || [])],
          areas: [...(remoteData.areas || []), ...(match.areas || [])],
          departments: [...(remoteData.departments || []), ...(match.departments || [])],
          floors: match.floors || []
        };
      }
    } catch (e) {
      console.error('Failed to merge local locations:', e);
    }
    return remoteData;
  },

  onboardEquipment: async (data) => {
    return await request('/onboarding/equipment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // --- ADMIN EQUIPMENT ---
  getAdminEquipment: async () => {
    return await request('/admin/equipment');
  },

  getAdminEquipmentBySosCode: async (sosCode) => {
    return await request(`/admin/equipment/${sosCode}`);
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

  getBranchById: async (branchId) => {
    return await request(`/admin/branches/${branchId}`);
  },

  updateBranch: async (branchId, data) => {
    return await request(`/admin/branches/${branchId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
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
  getAdminModules: async () => {
    return await request('/admin/modules');
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

  // --- ADMIN USERS ---
  getAdminUsers: async () => {
    return await request('/admin/users');
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

  deleteAdminUser: async (id) => {
    return await request(`/admin/users/${id}`, { method: 'DELETE' });
  },

  getAdminUserModules: async (id) => {
    return await request(`/admin/users/${id}/modules`);
  },

  addAdminUserModule: async (userId, data) => {
    return await request(`/admin/users/${userId}/modules`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  removeAdminUserModule: async (userId, moduleId) => {
    return await request(`/admin/users/${userId}/modules/${moduleId}`, {
      method: 'DELETE',
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
  getWorkOrders: async (params = {}) => {
    return await request(`/admin/work-orders${qs(params)}`);
  },

  getWorkOrderById: async (id) => {
    return await request(`/admin/work-orders/${id}`);
  },

  createWorkOrder: async (data) => {
    return await request('/admin/work-orders', { method: 'POST', body: JSON.stringify(data) });
  },

  updateWorkOrder: async (id, data) => {
    return await request(`/admin/work-orders/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },

  deleteWorkOrder: async (id) => {
    return await request(`/admin/work-orders/${id}`, { method: 'DELETE' });
  },

  // --- AUDIT LOG ---
  getAdminAuditLog: async (params = {}) => {
    return await request(`/admin/audit-log${qs(params)}`);
  },

  // --- NOTIFICATIONS ---
  getNotifications: async (params = {}) => {
    return await request(`/notifications${qs(params)}`);
  },

  markNotificationRead: async (ids) => {
    const idList = Array.isArray(ids) ? ids : (ids == null ? [] : [ids]);
    return await request('/notifications/read', {
      method: 'PATCH',
      body: JSON.stringify({ ids: idList }),
    });
  },

  broadcastNotification: async (data) => {
    return await request('/notifications/broadcast', { method: 'POST', body: JSON.stringify(data) });
  },

  // Kept for backward compatibility — use broadcastNotification for new code
  sendNotification: async (data) => {
    return await request('/notifications/broadcast', { method: 'POST', body: JSON.stringify(data) });
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
  getScheduledTasks: async (params = {}) => {
    try {
      return await request(`/tasks${qs(params)}`);
    } catch (e) {
      // Temporary fallback mock if backend is not ready
      console.warn("Scheduler API not available, falling back to local storage mock");
      const saved = JSON.parse(localStorage.getItem('safety_auto_schedules') || '[]');
      return { data: saved };
    }
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
};
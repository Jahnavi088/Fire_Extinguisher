/**
 * ApiService for SOS Emergency Platform
 * Base URL: https://ehs.garrev.com/app1/v1/
 */

const BASE_URL = 'https://ehs.garrev.com/app1/v1';

// Module-level user cache — populated on login, read by getUser()
let _cachedUser = null;

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

  // --- EQUIPMENT ---
  getEquipment: async (params = {}) => {
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
    return await request(`/modules/${id}/summary`);
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
};
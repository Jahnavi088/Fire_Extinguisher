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
  return await response.json();
};

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

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
    return await request(`/extinguishers/${id}/updates`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getEquipmentUpdates: async (id) => {
    return await request(`/extinguishers/${id}/updates`);
  },

  getPendingUpdates: async () => {
    return await request('/updates/pending');
  },

  approveUpdate: async (id) => {
    return await request(`/updates/${id}/approve`, {
      method: 'PATCH',
    });
  },

  rejectUpdate: async (id) => {
    return await request(`/updates/${id}/reject`, {
      method: 'PATCH',
    });
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

  // --- ADMIN COMPANIES ---
  getAdminCompanies: async () => {
    return await request('/admin/companies');
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
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${BASE_URL}/admin/companies/${id}/logo`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    return handleResponse(response);
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

  getAdminUserModules: async (id) => {
    return await request(`/admin/users/${id}/modules`);
  },

  addAdminUserModule: async (id, data) => {
    return await request(`/admin/users/${id}/modules`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  removeAdminUserModule: async (userId, moduleId) => {
    return await request(`/admin/users/${userId}/modules/${moduleId}`, {
      method: 'DELETE',
    });
  },

  // --- QR / PUBLIC PAGES ---
  scanEquipment: async (sosCode) => {
    return await request(`/scan/${sosCode}`);
  },

  getPublicDetails: async (sosCode) => {
    return await request(`/details/${sosCode}`);
  },

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
};
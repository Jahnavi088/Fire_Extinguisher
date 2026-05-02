/**
 * ApiService for SOS Emergency Platform
 * Base URL: https://ehs.garrev.com/app1/v1/
 */

const BASE_URL = 'https://ehs.garrev.com/app1/v1';

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

export const ApiService = {
  // 1. Auth Login (Dummy API)
  login: async (username, password) => {
    // We trigger a real fetch so it shows in the Network Tab
    // Even if it 404s, it will be visible to the user
    try {
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      }).catch(() => {}); // Catch network error so it doesn't break the dummy flow
    } catch (e) {}

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const demoRoles = ['superadmin', 'admin', 'user'];
        if (demoRoles.includes(username.toLowerCase())) {
          resolve({
            success: true,
            token: 'demo-token-' + Math.random().toString(36).substr(2),
            user: { username, role: username.toLowerCase() }
          });
        } else {
          reject(new Error('Invalid credentials. Try: superadmin, admin, or user'));
        }
      }, 1000);
    });
  },

  // 2. Auth Logout (Dummy API)
  logout: async () => {
    // Trigger a real fetch for the Network Tab
    try {
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    } catch (e) {}

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: 'Successfully logged out' });
      }, 800);
    });
  },

  // 2. Health Check
  getHealth: async () => {
    const response = await fetch(`${BASE_URL}/health`);
    return handleResponse(response);
  },

  // 3. Summary Count
  getSummary: async () => {
    const response = await fetch(`${BASE_URL}/summary`);
    return handleResponse(response);
  },

  // 4. All Extinguishers
  getAllExtinguishers: async () => {
    const response = await fetch(`${BASE_URL}/extinguishers`);
    return handleResponse(response);
  },

  // 5. Single Extinguisher by Numeric ID
  getExtinguisherById: async (id) => {
    const response = await fetch(`${BASE_URL}/extinguishers/${id}`);
    return handleResponse(response);
  },

  // 6. Single Extinguisher by SOS Code
  getExtinguisherByCode: async (code) => {
    const response = await fetch(`${BASE_URL}/extinguishers/${code}`);
    return handleResponse(response);
  },

  // 7. Active Units
  getActiveExtinguishers: async () => {
    const response = await fetch(`${BASE_URL}/status/active`);
    return handleResponse(response);
  },

  // 8. Upcoming Inspection (within 30 days)
  getUpcomingInspections: async () => {
    const response = await fetch(`${BASE_URL}/status/upcoming`);
    return handleResponse(response);
  },

  // 9. Needs Service (failed/flagged)
  getNeedsService: async () => {
    const response = await fetch(`${BASE_URL}/status/needs-service`);
    return handleResponse(response);
  },

  // 10. Expired Cylinders
  getExpiredCylinders: async () => {
    const response = await fetch(`${BASE_URL}/status/expired`);
    return handleResponse(response);
  },

  // 11. Overdue Inspection
  getOverdueInspections: async () => {
    const response = await fetch(`${BASE_URL}/status/due-inspection`);
    return handleResponse(response);
  },

  // 12. Alerts Summary (KPI)
  getAlertsSummary: async () => {
    const response = await fetch(`${BASE_URL}/alerts/summary`);
    return handleResponse(response);
  },

  // 13. Full Alerts List
  getAlerts: async (params = {}) => {
    let url = `${BASE_URL}/alerts`;
    const query = new URLSearchParams(params).toString();
    if (query) url += `?${query}`;
    
    const response = await fetch(url);
    return handleResponse(response);
  },

  // Helpers for common alert filters
  getAlertsByLevel: async (level) => {
    return ApiService.getAlerts({ level });
  },

  getAlertsByDepartment: async (department) => {
    return ApiService.getAlerts({ department });
  }
};

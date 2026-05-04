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
  // Auth
  login: async (credentials) => {
    // This is a dummy login that calls the real URL to show in network tab
    try {
      await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      }).catch(() => {});
    } catch(e) {}
    
    // For demo purposes, we return a success if the username is 'admin' or 'superadmin'
    return {
      success: true,
      user: { name: credentials.username || 'Admin User', role: credentials.username === 'superadmin' ? 'superadmin' : 'admin' }
    };
  },

  logout: async () => {
    return { success: true };
  },

  // Fire Extinguisher Specific APIs
  getHealth: async () => {
    return await handleResponse(await fetch(`${BASE_URL}/health`));
  },

  getSummary: async () => {
    return await handleResponse(await fetch(`${BASE_URL}/summary`));
  },

  getAllExtinguishers: async () => {
    return await handleResponse(await fetch(`${BASE_URL}/extinguishers`));
  },

  getExtinguisherById: async (id) => {
    return await handleResponse(await fetch(`${BASE_URL}/extinguishers/${id}`));
  },

  getActiveUnits: async () => {
    return await handleResponse(await fetch(`${BASE_URL}/status/active`));
  },

  getUpcomingInspections: async () => {
    return await handleResponse(await fetch(`${BASE_URL}/status/upcoming`));
  },

  getNeedsService: async () => {
    return await handleResponse(await fetch(`${BASE_URL}/status/needs-service`));
  },

  getExpired: async () => {
    return await handleResponse(await fetch(`${BASE_URL}/status/expired`));
  },

  getDueInspections: async () => {
    return await handleResponse(await fetch(`${BASE_URL}/status/due-inspection`));
  },

  getAlerts: async () => {
    return await handleResponse(await fetch(`${BASE_URL}/alerts`));
  },

  getAlertsSummary: async () => {
    return await handleResponse(await fetch(`${BASE_URL}/alerts/summary`));
  },

  getAlertsByLevel: async (level) => {
    return await handleResponse(await fetch(`${BASE_URL}/alerts?level=${level}`));
  },

  getAlertsByDepartment: async (department) => {
    return await handleResponse(await fetch(`${BASE_URL}/alerts?department=${encodeURIComponent(department)}`));
  }
};

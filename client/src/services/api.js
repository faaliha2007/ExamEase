const API_BASE_URL = '/api';

/**
 * Generic fetch wrapper with automatic JWT authorization and error normalization
 */
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('examease_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.errors = data.errors || [];
    throw error;
  }

  return data;
}

export const api = {
  // Auth API
  auth: {
    demoLogin: (email, password) =>
      apiRequest('/auth/demo-login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    getMe: () => apiRequest('/auth/me'),
    getDemoAccounts: () => apiRequest('/auth/demo-accounts'),
  },

  // Resources API
  resources: {
    getAll: (params = {}) => {
      const query = new URLSearchParams();
      if (params.search) query.append('search', params.search);
      if (params.category) query.append('category', params.category);
      if (params.status) query.append('status', params.status);
      if (params.minAvailability !== undefined) query.append('minAvailability', params.minAvailability);
      return apiRequest(`/resources?${query.toString()}`);
    },
    getById: (id) => apiRequest(`/resources/${id}`),
    updateRate: (id, rate) =>
      apiRequest(`/resources/${id}/rate`, {
        method: 'PATCH',
        body: JSON.stringify({ rate }),
      }),
  },

  // Reservations API
  reservations: {
    create: (payload) =>
      apiRequest('/reservations', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    getMy: () => apiRequest('/reservations/my'),
    getById: (id) => apiRequest(`/reservations/${id}`),
    cancel: (id) =>
      apiRequest(`/reservations/${id}/cancel`, {
        method: 'POST',
      }),
  },

  // Admin API
  admin: {
    getAllReservations: (params = {}) => {
      const query = new URLSearchParams();
      if (params.search) query.append('search', params.search);
      if (params.status) query.append('status', params.status);
      if (params.resourceId) query.append('resourceId', params.resourceId);
      if (params.page) query.append('page', params.page);
      if (params.limit) query.append('limit', params.limit);
      return apiRequest(`/admin/reservations?${query.toString()}`);
    },
    getReservationById: (id) => apiRequest(`/admin/reservations/${id}`),
    updateStatus: (id, status) =>
      apiRequest(`/admin/reservations/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    getStats: () => apiRequest('/admin/stats'),
    createSlot: (payload) =>
      apiRequest('/admin/slots', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    getNextSlotId: () => apiRequest('/admin/slots/next-id'),
  },

  // Health API
  health: {
    check: () => apiRequest('/health'),
  },
};

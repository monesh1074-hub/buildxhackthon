const API_BASE = '/api';

/**
 * Helper to handle fetch responses
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || data.message || `Request failed with status ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

export const api = {
  // Health
  checkHealth: () => request('/health'),

  // Scan & Masking
  scanData: (data) => request('/scan', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  simulateGateway: (payload) => request('/scan/simulate-api-gateway', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  // Dashboard Statistics
  fetchStats: () => request('/stats'),

  // History & Audit
  fetchHistory: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/history?${query}`);
  },
  fetchScanDetails: (id) => request(`/history/${id}`),
  deleteScan: (id) => request(`/history/${id}`, { method: 'DELETE' }),
  clearHistory: () => request('/history', { method: 'DELETE' }),
  verifyZeroStorage: () => request('/history/verify-zero-leakage'),

  // Detection Rules
  fetchRules: () => request('/rules'),
  toggleRule: (id) => request(`/rules/${id}/toggle`, { method: 'PATCH' }),
  createRule: (rule) => request('/rules', {
    method: 'POST',
    body: JSON.stringify(rule)
  }),
  deleteRule: (id) => request(`/rules/${id}`, { method: 'DELETE' }),

  // Samples
  fetchSamples: () => request('/samples'),

  // Supabase Online Database
  getDatabaseStatus: () => request('/database/status'),
  testSupabase: (params) => request('/database/test-supabase', {
    method: 'POST',
    body: JSON.stringify(typeof params === 'string' ? { connectionString: params } : params)
  }),
  configureSupabase: (params) => request('/database/configure-supabase', {
    method: 'POST',
    body: JSON.stringify(typeof params === 'string' ? { connectionString: params } : params)
  }),
  fetchSchemaSql: () => request('/database/schema-sql')
};

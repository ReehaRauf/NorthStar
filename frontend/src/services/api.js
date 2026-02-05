import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const spaceApi = {
  // Satellite endpoints
  getOverheadSatellites: async (lat, lon, alt = 0, hours = 24, minElevation = 10) => {
    const response = await api.get('/satellites/overhead', {
      params: { lat, lon, alt, hours, min_elevation: minElevation },
    });
    return response.data;
  },

  getNextISSPass: async (lat, lon, alt = 0, minElevation = 30) => {
    const response = await api.get('/satellites/iss/next-pass', {
      params: { lat, lon, alt, min_elevation: minElevation },
    });
    return response.data;
  },

  getSatelliteProfile: async (satelliteName) => {
    const response = await api.get(`/satellites/profile/${satelliteName}`);
    return response.data;
  },

  // Space Weather endpoints
  getSpaceWeather: async () => {
    const response = await api.get('/space-weather/status');
    return response.data;
  },

  getImpactExplanation: async () => {
    const response = await api.get('/space-weather/impact-explanation');
    return response.data;
  },

  // Agent endpoints
  query: async (query, location = null, includeLiveContext = true, mode = 'quick') => {
    const response = await api.post('/agent/query', {
      query,
      location,
      include_live_context: includeLiveContext,
      explanation_mode: mode,
    });
    return response.data;
  },

  explain: async (query, mode = 'quick', includeCitations = true) => {
    const response = await api.post('/agent/explain', {
      query,
      mode,
      include_citations: includeCitations,
    });
    return response.data;
  },

  // Activity Feed endpoints
  getTodayFeed: async () => {
    const response = await api.get('/feed/today');
    return response.data;
  },
};

export default api;

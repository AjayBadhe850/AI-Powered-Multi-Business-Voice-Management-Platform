import axios from 'axios';

/**
 * Resolves the backend API base URL:
 * 1. Reads import.meta.env.VITE_API_URL if provided (e.g. from Netlify environment variables).
 * 2. If VITE_API_URL is "https://ai-powered-multi-business-voice.onrender.com",
 *    normalizes it to "https://ai-powered-multi-business-voice.onrender.com/api"
 *    so endpoint calls like api.post('/auth/login') resolve to:
 *    "https://ai-powered-multi-business-voice.onrender.com/api/auth/login" without duplicate /api prefixes.
 * 3. If VITE_API_URL already contains "/api", preserves it without duplication.
 * 4. Production fallback defaults to the live Render backend URL.
 * 5. Local development fallback uses "/api" (proxied to localhost:5000 via Vite).
 */
export const getBaseURL = () => {
  const envUrl = (import.meta.env.VITE_API_URL || '').trim();
  if (envUrl) {
    const cleanUrl = envUrl.replace(/\/+$/, '');
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  }

  // Production fallback if VITE_API_URL wasn't set in Netlify dashboard
  if (import.meta.env.PROD) {
    return 'https://ai-powered-multi-business-voice.onrender.com/api';
  }

  // Local development fallback to Vite dev server proxy
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mbv_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses to handle 401 unauth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('mbv_auth_token');
      localStorage.removeItem('mbv_auth_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;


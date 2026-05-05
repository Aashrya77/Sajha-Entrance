import axios from 'axios';

const trimTrailingSlashes = (value = '') => value.replace(/\/+$/g, '');
const ensureLeadingSlash = (value = '') => (value.startsWith('/') ? value : `/${value}`);
const isAbsoluteUrl = (value = '') => /^https?:\/\//i.test(value);
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

export const ADMIN_ROOT_PATH = '/sajha-admin';

const configuredBaseUrl = trimTrailingSlashes(import.meta.env.VITE_API_BASE_URL || '');
export const baseURL = configuredBaseUrl || '/api';

export const backendBaseUrl = baseURL.endsWith('/api')
  ? baseURL.slice(0, -4) || '/'
  : baseURL;

export const resolveBackendPath = (path = '') => {
  const normalizedPath = ensureLeadingSlash(path);
  const cleanBackendBaseUrl = trimTrailingSlashes(backendBaseUrl);

  if (!cleanBackendBaseUrl || cleanBackendBaseUrl === '/') {
    return normalizedPath;
  }

  if (/^https?:\/\//i.test(cleanBackendBaseUrl)) {
    return `${cleanBackendBaseUrl}${normalizedPath}`;
  }

  return `${cleanBackendBaseUrl}${normalizedPath}`;
};

export const buildAdminUrl = (value = '') => {
  const cleanValue = trimTrailingSlashes(value);

  if (!cleanValue || !isAbsoluteUrl(cleanValue)) {
    return '';
  }

  return cleanValue.endsWith(ADMIN_ROOT_PATH)
    ? cleanValue
    : `${cleanValue}${ADMIN_ROOT_PATH}`;
};

export const resolveAdminRouteUrl = (rootPath = ADMIN_ROOT_PATH) => {
  if (typeof window === 'undefined') {
    return '';
  }

  return trimTrailingSlashes(`${window.location.origin}${ensureLeadingSlash(rootPath)}`);
};

export const isLocalUrl = (value = '') => {
  if (!isAbsoluteUrl(value)) {
    return false;
  }

  try {
    const hostname = new URL(value).hostname.replace(/^\[|\]$/g, '').toLowerCase();
    return LOCAL_HOSTNAMES.has(hostname) || hostname.endsWith('.local');
  } catch (_error) {
    return false;
  }
};

export const resolveAdminUrl = () => {
  const configuredAdminUrl = trimTrailingSlashes(import.meta.env.VITE_ADMIN_URL || '');

  if (configuredAdminUrl) {
    return configuredAdminUrl;
  }

  return buildAdminUrl(backendBaseUrl) || resolveAdminRouteUrl();
};

// Create axios instance with base configuration
const API = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — just clear it silently, don't redirect
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export default API;

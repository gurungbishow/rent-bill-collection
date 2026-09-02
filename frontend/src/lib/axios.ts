import axios from 'axios';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const configuredUrl = process.env.NEXT_PUBLIC_API_URL;
    if (configuredUrl) {
      const url = configuredUrl.replace(/\/$/, '');
      try {
        const parsed = new URL(url);
        if (
          (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') &&
          window.location.hostname &&
          window.location.hostname !== 'localhost' &&
          window.location.hostname !== '127.0.0.1'
        ) {
          parsed.hostname = window.location.hostname;
          return `${parsed.origin}/api`;
        }
      } catch {}
      return `${url}/api`;
    }
    return '/api';
  }
  return process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/api` : 'http://127.0.0.1:5000/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    config.baseURL = getBaseUrl();
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;

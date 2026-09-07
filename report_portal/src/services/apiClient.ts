import axios from 'axios';
import { getBaseUrl } from './baseUrl';

const getApiUrl = () => {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    if (process.env.NEXT_PUBLIC_INTEGRATION_API_URL) return process.env.NEXT_PUBLIC_INTEGRATION_API_URL;
    if (process.env.INTEGRATION_API_URL) return process.env.INTEGRATION_API_URL;
  }
  return getBaseUrl();
};

export const apiClient = axios.create();

apiClient.interceptors.request.use(
  (config) => {
    if (!config.baseURL) {
      config.baseURL = getApiUrl();
    }
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;

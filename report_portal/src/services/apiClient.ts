import axios from 'axios';
import { baseUrl } from './baseUrl';

const API_URL = process.env.INTEGRATION_API_URL || baseUrl;

export const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use(
  (config) => {
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

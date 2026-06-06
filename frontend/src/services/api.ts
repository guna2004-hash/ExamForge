import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT token into header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('aegis_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Global response error interceptor (e.g. redirect on 401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear storage
      localStorage.removeItem('aegis_token');
      localStorage.removeItem('aegis_role');
      localStorage.removeItem('aegis_name');
    }
    return Promise.reject(error);
  }
);

export default api;

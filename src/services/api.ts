import axios from 'axios';
import { notifySessionExpired } from '@/services/sessionExpiry';
import { useAuthStore } from '@/store/useAuthStore';

/** 401 karena isian salah (mis. password), bukan karena token ditolak. */
const NON_SESSION_401_CODES = ['INVALID_CREDENTIALS', 'INVALID_GOOGLE_TOKEN', 'PASSWORD_NOT_SET'];

export const api = axios.create({
  // EXPO_PUBLIC_ prefix wajib agar terbaca oleh Expo
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5073/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer Token if available
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: token ditolak server → akhiri sesi dan arahkan ke layar login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !NON_SESSION_401_CODES.includes(error.response.data?.errorCode)) {
      const auth = useAuthStore.getState();
      const sentHeader = String(error.config?.headers?.Authorization ?? '');
      // Hanya untuk token yang masih dipakai: balasan terlambat dari sesi lama tidak mengeluarkan sesi baru,
      // dan beberapa 401 bersamaan cukup ditangani sekali. Logout punya alur pengalihan sendiri.
      const isCurrentToken = !!auth.token && sentHeader === `Bearer ${auth.token}`;
      const isLogoutRequest = /\/auth\/logout$/i.test(error.config?.url ?? '');
      if (isCurrentToken && !isLogoutRequest) {
        auth.logout();
        notifySessionExpired();
      }
    }
    return Promise.reject(error);
  }
);

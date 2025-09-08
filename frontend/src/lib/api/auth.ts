// src/lib/api/auth.ts
import axios from 'axios';
import type { User } from '../types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await axios.get(`${API_BASE_URL}/auth/me`);
    return response.data.user;
  },

  logout: async () => {
    await axios.post(`${API_BASE_URL}/auth/logout`);
  },

  refreshToken: async () => {
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`);
    return response.data;
  },
};

export { authApi };
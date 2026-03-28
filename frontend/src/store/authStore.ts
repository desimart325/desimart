import { create } from 'zustand';
import api from '../lib/api';
import type { User } from '../lib/types';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>;
  loginAsGuest: (name: string, phone?: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    set({ token: data.token, user: data.user });
  },

  register: async (body) => {
    const { data } = await api.post('/auth/register', body);
    localStorage.setItem('token', data.token);
    set({ token: data.token, user: data.user });
  },

  loginAsGuest: async (name, phone) => {
    const { data } = await api.post('/auth/guest', { name, phone });
    localStorage.setItem('token', data.token);
    set({ token: data.token, user: data.user });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  loadUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data, token });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null });
    }
  },
}));

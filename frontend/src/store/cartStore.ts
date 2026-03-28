import { create } from 'zustand';
import api from '../lib/api';
import type { CartItem } from '../lib/types';

interface CartState {
  items: CartItem[];
  open: boolean;
  loading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (productId: number, quantity?: number) => Promise<void>;
  updateItem: (id: number, quantity: number) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
  clearCart: () => Promise<void>;
  openCart: () => void;
  closeCart: () => void;
  total: () => number;
  count: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  open: false,
  loading: false,

  fetchCart: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const { data } = await api.get('/cart');
      set({ items: data });
    } catch { /* not logged in */ }
  },

  addItem: async (productId, quantity = 1) => {
    const { data } = await api.post('/cart/items', { productId, quantity });
    set({ items: data, open: true });
  },

  updateItem: async (id, quantity) => {
    const { data } = await api.put(`/cart/items/${id}`, { quantity });
    set({ items: data });
  },

  removeItem: async (id) => {
    const { data } = await api.delete(`/cart/items/${id}`);
    set({ items: data });
  },

  clearCart: async () => {
    await api.delete('/cart');
    set({ items: [] });
  },

  openCart: () => set({ open: true }),
  closeCart: () => set({ open: false }),
  total: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
  count: () => get().items.reduce((s, i) => s + i.quantity, 0),
}));

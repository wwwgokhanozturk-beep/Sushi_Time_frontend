import { create } from 'zustand';
import httpClient from '../api/httpClient';
import { saveTrackingToken } from '../utils/trackingTokens';

const STORAGE_KEY = 'sushi_time_order_ids';

const getSavedIds = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
};
const saveId = (id) => {
  const ids = getSavedIds();
  if (!ids.includes(id)) localStorage.setItem(STORAGE_KEY, JSON.stringify([id, ...ids]));
};

export const useOrderStore = create((set) => ({
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,
  orderPlaced: null,

  placeOrder: async (payload) => {
    set({ loading: true, error: null, orderPlaced: null });
    try {
      const res = await httpClient.post('/orders', payload);
      const order = res.data?.data?.order;
      set({ loading: false, orderPlaced: order });
      if (order?._id) saveId(order._id);
      // Ключ к живому отслеживанию — выдаётся один раз, только здесь.
      if (order?._id && order?.trackingToken) saveTrackingToken(order._id, order.trackingToken);
      return order;
    } catch (e) {
      set({ loading: false, error: e.response?.data?.message || 'Failed to place order' });
      return null;
    }
  },

  loadOrders: async (phone) => {
    set({ loading: true, error: null });
    try {
      const savedIds = getSavedIds();
      const [byIdResults, byPhoneResults] = await Promise.all([
        savedIds.length > 0
          ? Promise.all(
              savedIds.map((id) =>
                httpClient.get(`/orders/${id}`).then((r) => r.data?.data?.order).catch(() => null)
              )
            )
          : Promise.resolve([]),
        phone
          ? httpClient.get('/orders/my', { params: { phone } }).then((r) => r.data?.data?.orders || []).catch(() => [])
          : Promise.resolve([]),
      ]);

      const seen = new Set();
      const merged = [...byIdResults, ...byPhoneResults]
        .filter(Boolean)
        .filter((o) => { if (seen.has(o._id)) return false; seen.add(o._id); return true; })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      merged.forEach((o) => {
        saveId(o._id);
        if (o.trackingToken) saveTrackingToken(o._id, o.trackingToken);
      });
      set({ orders: merged, loading: false });
    } catch (e) {
      set({ loading: false, error: e.response?.data?.message || 'Failed to load orders' });
    }
  },

  loadOrderById: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await httpClient.get(`/orders/${id}`);
      set({ currentOrder: res.data?.data?.order, loading: false });
    } catch (e) {
      set({ loading: false, error: e.response?.data?.message || 'Failed to load order' });
    }
  },

  clearPlaced: () => set({ orderPlaced: null }),
}));

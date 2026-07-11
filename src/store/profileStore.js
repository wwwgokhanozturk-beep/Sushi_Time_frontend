import { create } from 'zustand';
import httpClient from '../api/httpClient';
import { disconnectSocket } from '../api/socket';

const STORAGE_KEY = 'sushi_time_profile';

const load = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {}; } catch { return {}; }
};
const save = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

const defaults = { name: '', phone: '', address: '', district: '', buildingName: '', floor: '', apartment: '', doorCode: '', notes: '', latitude: null, longitude: null, email: '', token: null, refreshToken: null, userId: null, isLoggedIn: false, isGuest: false };

export const useProfileStore = create((set, get) => ({
  ...defaults,
  ...load(),
  loaded: true,

  updateProfile: (fields) => {
    const s = get();
    const patch = {
      name: fields.name ?? s.name,
      phone: fields.phone ?? s.phone,
      address: fields.address ?? s.address,
      district: fields.district ?? s.district,
      buildingName: fields.buildingName ?? s.buildingName,
      floor: fields.floor ?? s.floor,
      apartment: fields.apartment ?? s.apartment,
      doorCode: fields.doorCode ?? s.doorCode,
      notes: fields.notes ?? s.notes,
      latitude: fields.latitude ?? s.latitude,
      longitude: fields.longitude ?? s.longitude,
    };
    set(patch);
    save({ ...get() });
  },

  setAuth: (user, token, refreshToken) => {
    const s = get();
    const patch = { name: user.name || s.name, phone: user.phone || s.phone, email: user.email || '', token, refreshToken, userId: user._id, isLoggedIn: true, isGuest: false };
    set(patch);
    save({ ...get() });
  },

  // Stores a throwaway guest token so the support chat works without an account.
  // We keep isLoggedIn=false so the profile area still invites a real sign-in.
  setGuestAuth: (user, token, refreshToken) => {
    set({ token, refreshToken, userId: user._id, isGuest: true });
    save({ ...get() });
  },

  // Returns a usable token, transparently creating a guest session if needed.
  ensureGuest: async () => {
    const existing = get().token;
    if (existing) return existing;
    try {
      const res = await httpClient.post('/users/guest');
      const { user, token, refreshToken } = res.data?.data || {};
      if (!token) return null;
      get().setGuestAuth(user, token, refreshToken);
      return token;
    } catch {
      return null;
    }
  },

  logout: () => {
    disconnectSocket();
    set({ ...defaults, loaded: true });
    localStorage.removeItem(STORAGE_KEY);
  },
}));

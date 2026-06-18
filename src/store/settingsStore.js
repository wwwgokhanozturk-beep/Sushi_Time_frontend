import { create } from 'zustand';
import httpClient from '../api/httpClient';

// Глобальные настройки сайта (контактный номер и т.п.)
export const useSettingsStore = create((set, get) => ({
  contactType: null,      // 'whatsapp' | 'phone'
  contactNumber: '',
  loaded: false,

  loadSettings: async () => {
    if (get().loaded) return;
    try {
      const res = await httpClient.get('/settings/contact');
      const s = res.data?.data?.settings || {};
      set({ contactType: s.contactType || null, contactNumber: s.contactNumber || '', loaded: true });
    } catch {
      set({ loaded: true });
    }
  },
}));

// Ссылка для контакта: WhatsApp -> wa.me, телефон -> tel:
export function contactHref(type, number) {
  const digits = (number || '').replace(/[^\d]/g, '');
  if (!digits) return null;
  return type === 'whatsapp' ? `https://wa.me/${digits}` : `tel:${number.replace(/\s+/g, '')}`;
}

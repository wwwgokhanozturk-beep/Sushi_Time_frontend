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

  // Слайдшоу фото в карточках меню
  slideshowAutoplay: true,
  slideshowInterval: 5, // секунды
  slideshowLoaded: false,

  loadSlideshow: async () => {
    if (get().slideshowLoaded) return;
    set({ slideshowLoaded: true }); // оптимистично — чтобы не дёргать много раз
    try {
      const res = await httpClient.get('/settings/slideshow');
      const s = res.data?.data?.settings || {};
      set({
        slideshowAutoplay: s.autoplay !== false,
        slideshowInterval: Number(s.intervalSec) > 0 ? Number(s.intervalSec) : 5,
      });
    } catch {
      /* оставляем дефолты */
    }
  },
}));

// Ссылка для контакта: WhatsApp -> wa.me, телефон -> tel:
export function contactHref(type, number) {
  const digits = (number || '').replace(/[^\d]/g, '');
  if (!digits) return null;
  return type === 'whatsapp' ? `https://wa.me/${digits}` : `tel:${number.replace(/\s+/g, '')}`;
}

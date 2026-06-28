import { create } from 'zustand';
import httpClient from '../api/httpClient';
import { computeOpenState } from '../utils/businessHours';

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

  // Режим работы ресторана (часы/выходные)
  businessHours: null,
  businessHoursLoaded: false,

  loadBusinessHours: async () => {
    if (get().businessHoursLoaded) return;
    try {
      const res = await httpClient.get('/settings/business-hours');
      set({ businessHours: res.data?.data?.businessHours || null, businessHoursLoaded: true });
    } catch {
      set({ businessHoursLoaded: true });
    }
  },

  // Открыт ли ресторан сейчас (по часовому поясу заведения). До загрузки — открыт.
  isOpenNow: () => {
    const bh = get().businessHours;
    if (!bh) return true;
    return computeOpenState(bh).open;
  },

  // Полное состояние для UI (часы сегодня, причина закрытия и т.п.)
  openState: () => {
    const bh = get().businessHours;
    return computeOpenState(bh || { enabled: false });
  },
}));

// Ссылка для контакта: WhatsApp -> wa.me, телефон -> tel:
export function contactHref(type, number) {
  const digits = (number || '').replace(/[^\d]/g, '');
  if (!digits) return null;
  return type === 'whatsapp' ? `https://wa.me/${digits}` : `tel:${number.replace(/\s+/g, '')}`;
}

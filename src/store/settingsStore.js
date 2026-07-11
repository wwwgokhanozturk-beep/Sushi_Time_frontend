import { create } from 'zustand';
import httpClient from '../api/httpClient';
import { computeOpenState } from '../utils/businessHours';
import { MAPBOX_TOKEN } from '../theme';

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

  // Минимальная сумма заказа по районам Алании (задаётся в админке)
  districts: [],            // [{ name, minOrder }]
  districtsLoaded: false,

  loadDistrictMinimums: async () => {
    if (get().districtsLoaded) return;
    try {
      const res = await httpClient.get('/settings/district-minimums');
      set({ districts: res.data?.data?.districts || [], districtsLoaded: true });
    } catch {
      set({ districtsLoaded: true });
    }
  },

  // Минимум для района (0 = без минимума)
  districtMinFor: (name) => {
    if (!name) return 0;
    const d = get().districts.find((x) => x.name === name);
    return d ? Number(d.minOrder) || 0 : 0;
  },

  // Геолокация клиента → район доставки (чтобы показать минимум ещё до корзины)
  deliveryDistrict: '',
  deliveryLat: null,
  deliveryLng: null,
  locationAsked: false,
  setDeliveryDistrict: (name) => set({ deliveryDistrict: name || '' }),

  // Спрашиваем геолокацию один раз при входе. При согласии — обратное
  // геокодирование определяет район Алании. Отказ — не проблема (тихо игнорим).
  requestLocation: async () => {
    if (get().locationAsked) return;
    set({ locationAsked: true });
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    await get().loadDistrictMinimums();
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        set({ deliveryLat: latitude, deliveryLng: longitude });
        if (!MAPBOX_TOKEN) return;
        try {
          const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json` +
            `?access_token=${MAPBOX_TOKEN}&language=tr&limit=1`;
          const res = await fetch(url);
          const data = await res.json();
          const name = (data?.features?.[0]?.place_name || '').toLowerCase();
          const hit = get().districts.find((d) => name.includes(d.name.toLowerCase()));
          if (hit) set({ deliveryDistrict: hit.name });
        } catch { /* geocoding failed — no problem */ }
      },
      () => { /* permission denied — no problem */ },
      { enableHighAccuracy: true, timeout: 10000 },
    );
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

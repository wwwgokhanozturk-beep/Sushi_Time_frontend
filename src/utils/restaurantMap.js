import { RESTAURANT_LAT, RESTAURANT_LNG } from '../theme';

const LABEL = 'Sushi Time';
const LL = `${RESTAURANT_LAT},${RESTAURANT_LNG}`;

// Google Maps in the browser: for computers, and the fallback on a phone that
// has no map app.
export const GOOGLE_MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${LL}`;

// The restaurant in whatever map app the phone uses. Android offers its own
// chooser for a geo: link (Google Maps, Yandex Navigator, Waze…), an iPhone
// opens its maps app, a computer gets Google Maps in a new tab.
// `app` — the link leaves the browser, so it opens in the same tab.
export function restaurantMapLink() {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  if (/Android/i.test(ua)) {
    return { href: `geo:${LL}?q=${LL}(${encodeURIComponent(LABEL)})`, app: true };
  }
  // iPadOS reports itself as a Mac; touch points give it away.
  const iOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (iOS) return { href: `https://maps.apple.com/?q=${encodeURIComponent(LABEL)}&ll=${LL}`, app: true };
  return { href: GOOGLE_MAPS_URL, app: false };
}

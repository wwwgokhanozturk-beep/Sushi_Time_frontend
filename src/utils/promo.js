// Helpers shared by the promotion carousels (BannerCarousel, PromoCarousel).

// Badge label → accent colour.
export const BADGE_COLORS = {
  HOT: '#EF4444',
  NEW: '#10B981',
  SALE: '#F59E0B',
  LIMITED: '#8B5CF6',
};

// Pick a promotion field in the active language, falling back to the default.
export function pick(promo, field, lang) {
  return (
    (lang === 'ru' && promo[`${field}_ru`]) ||
    (lang === 'tr' && promo[`${field}_tr`]) ||
    promo[field] ||
    ''
  );
}

// A promotion's media lives in `imageUrl`, but it may actually be a video.
// True when the URL points to a video so the UI can render <video> not <img>.
const VIDEO_URL_RE = /\.(mp4|m4v|mov|webm|ogg|m3u8)(\?.*)?$/i;
export function isVideoUrl(url) {
  return typeof url === 'string' && VIDEO_URL_RE.test(url);
}

// How long one slide stays on screen, in milliseconds.
//
// Admins set `durationSec` per promotion in the panel; a short video used to
// restart while a long one got cut off, because every slide was pinned to the
// carousel's own fixed duration. Promotions saved before the field existed
// carry null, and each carousel has its own natural default, so the fallback
// stays per-carousel rather than being one shared constant.
//
// Bounds mirror the server (2–60s) so a value that somehow slipped past the
// admin form can't freeze the carousel or turn it into a strobe.
const MIN_SLIDE_SEC = 2;
const MAX_SLIDE_SEC = 60;
export function slideDurationMs(promo, fallbackMs) {
  const sec = Number(promo?.durationSec);
  if (!Number.isFinite(sec) || sec <= 0) return fallbackMs;
  return Math.min(Math.max(sec, MIN_SLIDE_SEC), MAX_SLIDE_SEC) * 1000;
}

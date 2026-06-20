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

// Shared helpers for menu categories — used by the sticky category chip bar on
// both HomePage and MenuPage so the two never drift apart.

// i18n key per category slug (falls back to the raw slug when missing).
export const CATEGORY_KEYS = {
  rolls: 'cat_rolls', nigiri: 'cat_nigiri', sashimi: 'cat_sashimi',
  sets: 'cat_sets', tempura: 'cat_tempura', soups: 'cat_soups', drinks: 'cat_drinks',
  desserts: 'cat_desserts', salads: 'cat_salads', maki: 'cat_maki', uramaki: 'cat_uramaki',
  gunkan: 'cat_gunkan', wok: 'cat_wok', appetizers: 'cat_appetizers',
};

// Default "photo" for a category until the admin uploads a real one — a themed
// emoji shown inside a gradient circle. Keyed by slug, with a sushi fallback.
export const CATEGORY_EMOJI = {
  sets: '🍱', rolls: '🍣', maki: '🍣', uramaki: '🍣', hosomaki: '🍙', temaki: '🌯',
  nigiri: '🍣', sashimi: '🐟', gunkan: '🍣', onigiri: '🍙',
  tempura: '🍤', appetizers: '🥢', salads: '🥗', soups: '🍲',
  wok: '🍜', noodles: '🍜', pizza: '🍕', fast_food: '🍔',
  desserts: '🍰', drinks: '🥤',
};

export const categoryEmoji = (cat) => CATEGORY_EMOJI[(cat || '').toLowerCase()] || '🍽️';

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

// Display label for a category: admin-set custom name (in the active language,
// with fallback to any set language), else the built-in i18n translation.
// `names` is the categoryNames map { slug: { en, ru, tr } }; `t` is i18next.
export function categoryLabel(cat, names, lang, t) {
  const l = (lang || 'en').slice(0, 2);
  const custom = names?.[cat];
  if (custom) {
    const picked = custom[l] || custom.en || custom.ru || custom.tr;
    if (picked) return picked;
  }
  return t(CATEGORY_KEYS[cat] || cat);
}

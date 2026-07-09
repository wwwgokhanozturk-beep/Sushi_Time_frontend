// Pick a translatable field (name / description / …) in the active language,
// falling back to the base (EN) value. Works for any object with the
// `field`, `field_ru`, `field_tr` convention used by menu items & promos.
export function pickLang(obj, field, lang) {
  if (!obj) return '';
  const l = (lang || 'en').slice(0, 2);
  return (
    (l === 'ru' && obj[`${field}_ru`]) ||
    (l === 'tr' && obj[`${field}_tr`]) ||
    obj[field] ||
    ''
  );
}

// Localized array field (ingredients / ingredients_ru / ingredients_tr).
export function pickLangArray(obj, field, lang) {
  if (!obj) return [];
  const l = (lang || 'en').slice(0, 2);
  const ru = obj[`${field}_ru`];
  const tr = obj[`${field}_tr`];
  if (l === 'ru' && Array.isArray(ru) && ru.length) return ru;
  if (l === 'tr' && Array.isArray(tr) && tr.length) return tr;
  return Array.isArray(obj[field]) ? obj[field] : [];
}

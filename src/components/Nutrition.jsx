import React from 'react';
import { useTranslation } from 'react-i18next';

// Calories and protein per serving — the restaurant types them into the admin
// panel. 0 means "not filled in", and such a value is not shown at all.
export const hasNutrition = (item) => item?.calories > 0 || item?.protein > 0;

// 12.46 → «12,5» in ru/tr, «12.5» in en; 18 → «18»
const grams = (v, lang) => Number(v).toLocaleString(lang, { maximumFractionDigits: 1 });

const TONES = {
  calories: { bg: '#FFF1E8', fg: '#C2410C' },
  protein:  { bg: '#E7F6EE', fg: '#047857' },
};

// Compact chips for the menu cards: «🔥 320 kcal  💪 18 g protein».
export function NutritionChips({ item }) {
  const { t, i18n } = useTranslation();
  if (!hasNutrition(item)) return null;
  return (
    <div style={styles.chips}>
      {item.calories > 0 && (
        <span style={{ ...styles.chip, background: TONES.calories.bg, color: TONES.calories.fg }}>
          🔥 {item.calories} {t('cal_label')}
        </span>
      )}
      {item.protein > 0 && (
        <span style={{ ...styles.chip, background: TONES.protein.bg, color: TONES.protein.fg }}>
          💪 {grams(item.protein, i18n.language)} {t('protein_short')}
        </span>
      )}
    </div>
  );
}

// Large tiles on the item page, right under the price.
export function NutritionPanel({ item }) {
  const { t, i18n } = useTranslation();
  if (!hasNutrition(item)) return null;
  const tiles = [
    item.calories > 0 && { key: 'calories', icon: '🔥', value: item.calories, unit: t('cal_label'), label: t('calories') },
    item.protein > 0 && { key: 'protein', icon: '💪', value: grams(item.protein, i18n.language), unit: t('gram_label'), label: t('protein') },
  ].filter(Boolean);
  return (
    <div>
      <div style={styles.title}>{t('nutrition_title')}</div>
      <div style={styles.tiles}>
        {tiles.map((tile) => (
          <div key={tile.key} style={{ ...styles.tile, background: TONES[tile.key].bg }}>
            <span style={styles.icon}>{tile.icon}</span>
            <div>
              <div style={{ ...styles.value, color: TONES[tile.key].fg }}>
                {tile.value} <span style={styles.unit}>{tile.unit}</span>
              </div>
              <div style={styles.label}>{tile.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  chips: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  // Sized so both chips fit one line in a phone-width menu row (~190px).
  chip: { padding: '2px 7px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, lineHeight: '17px', whiteSpace: 'nowrap' },
  title: { fontSize: 11, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 },
  tiles: { display: 'flex', gap: 10 },
  tile: { flex: '1 1 0', maxWidth: 240, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 'var(--radius-md)' },
  icon: { fontSize: 26, lineHeight: 1 },
  value: { fontSize: 22, fontWeight: 900, lineHeight: 1.1 },
  unit: { fontSize: 13, fontWeight: 700 },
  label: { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2 },
};

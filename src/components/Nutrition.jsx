import React from 'react';
import { useTranslation } from 'react-i18next';

// Calories, protein, fat and carbs per serving — the restaurant types them into
// the admin panel. 0 means "not filled in", and such a value is not shown at
// all; the nutrition block needs at least one of them.
export const hasNutritionFacts = (item) =>
  item?.calories > 0 || item?.protein > 0 || item?.fat > 0 || item?.carbs > 0;

// 12.46 → «12,5» in ru/tr, «12.5» in en; 18 → «18»
const grams = (v, lang) => Number(v).toLocaleString(lang, { maximumFractionDigits: 1 });

// The nutrition block needs tenths only for small numbers: 4,7 g, but 24 g, not 23,5.
const amount = (v, lang) => Number(v).toLocaleString(lang, { maximumFractionDigits: v < 10 ? 1 : 0 });

// «470 g · 18 pcs» — the serving's weight and piece count; '' when the
// restaurant has filled in neither.
export function servingLabel(item, t, lang) {
  return [
    item?.weight > 0 && `${grams(item.weight, lang)} ${t('gram_label')}`,
    item?.pieces > 0 && t('pieces_count', { pieces: item.pieces }),
  ].filter(Boolean).join(' · ');
}

// Each value's colour: the dot by its label and the stripe under its column.
const MACROS = ['protein', 'fat', 'carbs'];
const COLORS = { protein: '#10B981', fat: '#F59E0B', carbs: '#3B82F6', calories: '#EF4444' };

// Nutrition facts per serving, as the restaurant enters them: protein, fat,
// carbs and calories, each in its own colour.
// children — buttons at the bottom of the card ("More about this dish" in the
// dish window).
export function NutritionFacts({ item, style, children }) {
  const { t, i18n } = useTranslation();
  if (!hasNutritionFacts(item)) return null;

  const lang = i18n.language;
  const facts = [
    ...MACROS.map((key) => item[key] > 0 && {
      key,
      value: amount(item[key], lang),
      unit: t('gram_label'),
      label: t(key),
    }),
    item.calories > 0 && {
      key: 'calories',
      value: Math.round(item.calories).toLocaleString(lang),
      unit: t('cal_label'),
      label: t('calories'),
    },
  ].filter(Boolean);

  return (
    <div style={{ ...styles.factsCard, ...style }}>
      <div style={styles.basisCaption}>{t('per_serving')}</div>

      <div style={styles.factsRow}>
        {facts.map((fact) => (
          <div key={fact.key} style={styles.fact}>
            <div style={styles.factValue}>
              {fact.value}
              <span style={styles.factUnit}> {fact.unit}</span>
            </div>
            <div style={styles.factLabelRow}>
              <span style={{ ...styles.factDot, background: COLORS[fact.key] }} />
              <span style={styles.factLabel}>{fact.label}</span>
            </div>
            <div style={{ ...styles.factStripe, background: COLORS[fact.key] }} aria-hidden="true" />
          </div>
        ))}
      </div>

      {children}
    </div>
  );
}

const styles = {
  factsCard: { background: '#F4F4F6', borderRadius: 'var(--radius-lg)', padding: 14 },
  // No capitals: CSS uppercase would follow the page's lang="tr" and print
  // English text with a dotted İ.
  basisCaption: { fontSize: 13.5, fontWeight: 700, color: 'var(--text-secondary)', padding: '0 4px' },
  // Up to four columns across the card: each as wide as its text plus an equal
  // share of the rest, so the stripes under them fill the width. On a 360px
  // phone "Karbonhidrat" and "1.250 kcal" still fit, and if not, the label
  // ends with an ellipsis.
  factsRow: { display: 'flex', gap: 8, marginTop: 16, padding: '0 4px' },
  fact: { flex: '1 1 auto', minWidth: 0 },
  factValue: { fontSize: 20, fontWeight: 800, lineHeight: 1.2, color: 'var(--text-primary)', letterSpacing: -0.4, whiteSpace: 'nowrap' },
  factUnit: { fontSize: 13, fontWeight: 700, letterSpacing: 0 },
  factLabelRow: { display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 },
  factDot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
  factLabel: {
    minWidth: 0,
    fontSize: 12.5,
    fontWeight: 500,
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  factStripe: { height: 6, borderRadius: 3, marginTop: 14 },
};

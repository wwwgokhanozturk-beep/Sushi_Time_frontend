import React from 'react';
import { useTranslation } from 'react-i18next';

// Calories and protein per serving — the restaurant types them into the admin
// panel. 0 means "not filled in", and such a value is not shown at all.
export const hasNutrition = (item) => item?.calories > 0 || item?.protein > 0;

// Anything to show in the nutrition block: fat and carbs join calories and
// protein (also per serving, 0 = not filled in).
export const hasNutritionFacts = (item) => hasNutrition(item) || item?.fat > 0 || item?.carbs > 0;

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

// Protein, fat and carbs colours: the dots by the labels and the bar under the numbers.
const MACROS = ['protein', 'fat', 'carbs'];
const MACRO_COLORS = { protein: '#10B981', fat: '#F59E0B', carbs: '#3B82F6' };
// kcal per gram: protein and carbs 4, fat 9.
const KCAL_PER_GRAM = { protein: 4, fat: 9, carbs: 4 };

// Nutrition facts per serving, as the restaurant enters them: protein, fat,
// carbs, calories, and a bar showing how the calories split between protein,
// fat and carbs.
// children — buttons at the bottom of the card ("More about this dish" in the
// dish window).
export function NutritionFacts({ item, style, children }) {
  const { t, i18n } = useTranslation();
  if (!hasNutritionFacts(item)) return null;

  const lang = i18n.language;
  const facts = [
    ...MACROS.map((key) => item[key] > 0 && {
      key,
      color: MACRO_COLORS[key],
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

  // Only when all three are known — otherwise a single filled-in value would
  // look like "100% of the calories".
  const shares = MACROS.every((key) => item[key] > 0)
    ? MACROS.map((key) => ({ key, kcal: item[key] * KCAL_PER_GRAM[key] }))
    : null;

  return (
    <div style={{ ...styles.factsCard, ...style }}>
      <div style={styles.basisCaption}>{t('per_serving')}</div>

      <div style={{ ...styles.factsRow, ...(facts.length < 3 ? styles.factsRowLoose : null) }}>
        {facts.map((fact) => (
          <div key={fact.key} style={styles.fact}>
            <div style={styles.factValue}>
              {fact.value}
              <span style={styles.factUnit}> {fact.unit}</span>
            </div>
            <div style={styles.factLabelRow}>
              {fact.color && <span style={{ ...styles.factDot, background: fact.color }} />}
              <span style={styles.factLabel}>{fact.label}</span>
            </div>
          </div>
        ))}
      </div>

      {shares && (
        <div style={styles.sharesBar} aria-hidden="true">
          {shares.map((share) => (
            <span key={share.key} style={{ flex: share.kcal, background: MACRO_COLORS[share.key] }} />
          ))}
        </div>
      )}

      {children}
    </div>
  );
}

const styles = {
  chips: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  // Sized so both chips fit one line in a phone-width menu row (~190px).
  chip: { padding: '2px 7px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, lineHeight: '17px', whiteSpace: 'nowrap' },

  factsCard: { background: '#F4F4F6', borderRadius: 'var(--radius-lg)', padding: 14 },
  // No capitals: CSS uppercase would follow the page's lang="tr" and print
  // English text with a dotted İ.
  basisCaption: { fontSize: 13.5, fontWeight: 700, color: 'var(--text-secondary)', padding: '0 4px' },
  // Four columns across the card; on a 360px phone "Karbonhidrat" and
  // "1.250 kcal" still fit, and if not, the label ends with an ellipsis.
  factsRow: { display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 16, padding: '0 4px' },
  // One or two values sit side by side instead of drifting to the edges.
  factsRowLoose: { justifyContent: 'flex-start', gap: 32 },
  fact: { minWidth: 0 },
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
  sharesBar: { display: 'flex', gap: 2, height: 6, borderRadius: 3, overflow: 'hidden', margin: '14px 4px 0' },
};

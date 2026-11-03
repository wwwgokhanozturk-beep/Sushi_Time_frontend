import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ALLERGENS, ALLERGEN_ICONS } from '../utils/allergens';

// The dish's allergens in the regulation's order; codes the site doesn't know
// are skipped. An empty list means none are filled in, and nothing is shown.
export const dishAllergens = (item) => ALLERGENS.filter((code) => item?.allergens?.includes(code));

export function AllergenIcon({ code, size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      // Static markup from utils/allergens, never user input.
      dangerouslySetInnerHTML={{ __html: ALLERGEN_ICONS[code] }}
    />
  );
}

// Allergen card: a row of icons; a tap swaps them for the names, with a note
// about traces and the soy sauce that comes with sushi.
// showTitle={false} — where a section heading above already names it.
export function Allergens({ item, style, showTitle = true }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const list = dishAllergens(item);
  if (!list.length) return null;

  return (
    <div style={{ ...styles.card, ...style }}>
      <button
        type="button"
        className="allergens__toggle"
        style={styles.toggle}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span style={styles.head}>
          {showTitle && <span style={styles.title}>{t('allergens_title')}</span>}
          <span style={styles.hint}>
            {t(open ? 'allergens_hide' : 'allergens_show')}
            <span style={{ ...styles.chevron, transform: open ? 'rotate(-90deg)' : 'rotate(90deg)' }} aria-hidden="true">›</span>
          </span>
        </span>
        {open ? (
          <span style={styles.legend}>
            {list.map((code) => (
              <span key={code} style={styles.legendItem}>
                <span style={{ ...styles.chip, ...styles.chipSmall }}><AllergenIcon code={code} size={17} /></span>
                <span style={styles.legendName}>{t(`allergen_${code}`)}</span>
              </span>
            ))}
          </span>
        ) : (
          <span style={styles.chips}>
            {list.map((code) => (
              <span key={code} style={styles.chip} title={t(`allergen_${code}`)}>
                <AllergenIcon code={code} />
              </span>
            ))}
          </span>
        )}
      </button>
      {open && <p style={styles.note}>{t('allergens_note')}</p>}
    </div>
  );
}

const ACCENT = '#C2410C';

const styles = {
  // Warm tint next to the grey nutrition card: allergens are a warning.
  card: { background: '#FFF4EA', borderRadius: 'var(--radius-lg)', padding: 14 },
  toggle: { display: 'block', width: '100%', padding: 0, background: 'none', border: 'none', textAlign: 'left', color: 'inherit', cursor: 'pointer' },
  head: { display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px' },
  // No capitals: CSS uppercase would follow the page's lang="tr".
  title: { flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, color: 'var(--text-secondary)' },
  hint: { display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto', fontSize: 13, fontWeight: 700, color: ACCENT, whiteSpace: 'nowrap' },
  chevron: { display: 'inline-block', fontSize: 17, lineHeight: 1, transition: 'transform 0.2s ease' },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: {
    width: 38,
    height: 38,
    flexShrink: 0,
    borderRadius: '50%',
    background: '#fff',
    color: ACCENT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 3px rgba(194, 65, 12, 0.14)',
  },
  chipSmall: { width: 30, height: 30 },
  legend: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px 12px', marginTop: 12 },
  legendItem: { display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 },
  legendName: { minWidth: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflowWrap: 'anywhere' },
  note: { margin: '12px 4px 0', fontSize: 12.5, lineHeight: 1.45, color: 'var(--text-secondary)' },
};

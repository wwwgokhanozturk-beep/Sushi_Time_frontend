import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../store/settingsStore';
import { useCartStore, selectTotalPrice } from '../store/cartStore';

/**
 * DeliveryMinBanner — shows the minimum order for the customer's detected
 * district (from their location) BEFORE they reach the cart. Renders nothing
 * until a district with a minimum is known (e.g. location denied → no banner).
 */
export default function DeliveryMinBanner() {
  const { t } = useTranslation();
  const district = useSettingsStore((s) => s.deliveryDistrict);
  const districts = useSettingsStore((s) => s.districts);
  const subtotal = useCartStore(selectTotalPrice);

  if (!district) return null;
  const min = districts.find((d) => d.name === district)?.minOrder || 0;
  if (!min) return null; // no minimum for this district (sınırsız)

  const met = subtotal >= min;
  const short = Math.max(0, min - subtotal);

  return (
    <div style={{ ...styles.wrap, ...(met ? styles.ok : styles.warn) }}>
      <span style={styles.pin}>📍</span>
      <span>{t('delivery_min_banner', { district, min })}</span>
      {subtotal > 0 && (
        met
          ? <span style={styles.tag}>{t('min_reached')}</span>
          : <span style={styles.tag}>· {t('district_min_short', { short: short.toFixed(0) })}</span>
      )}
    </div>
  );
}

const styles = {
  wrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    fontSize: 13.5,
    fontWeight: 700,
    border: '1px solid',
    flexWrap: 'wrap',
  },
  warn: { background: '#FFF4E5', color: '#B45309', borderColor: '#FCD9A8' },
  ok: { background: '#ECFDF3', color: '#027A48', borderColor: '#A6F4C5' },
  pin: { fontSize: 15 },
  tag: { fontWeight: 800 },
};

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore, contactHref } from '../store/settingsStore';

/**
 * ContactButton — кликабельный контакт (WhatsApp / телефон) из настроек.
 * variant: 'card' (крупная карточка для главной) | 'compact' (строка для чата)
 */
export default function ContactButton({ variant = 'card' }) {
  const { t } = useTranslation();
  const { contactType, contactNumber, loaded, loadSettings } = useSettingsStore();

  useEffect(() => { loadSettings(); }, [loadSettings]);

  if (!loaded || !contactNumber) return null;

  const href = contactHref(contactType, contactNumber);
  if (!href) return null;

  const isWa = contactType === 'whatsapp';
  const icon = isWa ? '💬' : '📞';
  const label = isWa ? 'WhatsApp' : t('phone_number');
  const accent = isWa ? '#25D366' : 'var(--primary)';

  if (variant === 'compact') {
    return (
      <a href={href} target={isWa ? '_blank' : undefined} rel="noopener noreferrer" style={styles.compact}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontWeight: 700, color: accent }}>{label}:</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{contactNumber}</span>
      </a>
    );
  }

  return (
    <a href={href} target={isWa ? '_blank' : undefined} rel="noopener noreferrer" style={{ ...styles.card, borderColor: accent }}>
      <div style={{ ...styles.iconWrap, background: accent }}>{icon}</div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={styles.cardLabel}>{t('contact_us')}</span>
        <span style={{ ...styles.cardValue, color: accent }}>{label} · {contactNumber}</span>
      </div>
    </a>
  );
}

const styles = {
  card: {
    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
    background: '#fff', borderRadius: 'var(--radius-xl)', border: '1.5px solid',
    boxShadow: 'var(--shadow-sm)', textDecoration: 'none', cursor: 'pointer',
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 'var(--radius-full)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
  },
  cardLabel: { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardValue: { fontSize: 16, fontWeight: 800 },
  compact: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '10px 16px', background: '#fff', borderBottom: '1px solid var(--divider)',
    textDecoration: 'none', fontSize: 14,
  },
};

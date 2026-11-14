import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RESTAURANT_ADDRESS } from '../theme';
import { GOOGLE_MAPS_URL, restaurantMapLink } from '../utils/restaurantMap';

// «Мы на карте»: одно нажатие открывает ресторан в том приложении карт, которое
// выберет телефон (см. restaurantMapLink).
export default function RestaurantLocationCard() {
  const { t } = useTranslation();
  const link = useMemo(() => restaurantMapLink(), []);

  // На Android без приложения карт ссылка geo: молча не сработает — тогда
  // через полторы секунды открываем Google Maps в браузере. Если же телефон
  // открыл карты или показал окно выбора приложения, страница уходит в фон или
  // теряет фокус — запасной вариант не нужен, даже если человек выбирает долго.
  const onClick = () => {
    if (!link.href.startsWith('geo:')) return;
    let left = false;
    const leave = () => { left = true; };
    window.addEventListener('blur', leave);
    window.addEventListener('pagehide', leave);
    document.addEventListener('visibilitychange', leave);
    setTimeout(() => {
      window.removeEventListener('blur', leave);
      window.removeEventListener('pagehide', leave);
      document.removeEventListener('visibilitychange', leave);
      if (!left && !document.hidden && document.hasFocus()) window.location.href = GOOGLE_MAPS_URL;
    }, 1600);
  };

  return (
    <a
      href={link.href}
      target={link.app ? undefined : '_blank'}
      rel={link.app ? undefined : 'noopener noreferrer'}
      onClick={onClick}
      className="location-card"
      style={styles.card}
      aria-label={`${t('find_us_on_map')}: ${RESTAURANT_ADDRESS}`}
    >
      <span style={styles.pin} aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21.5s7-6.2 7-11.8A7 7 0 0 0 5 9.7c0 5.6 7 11.8 7 11.8z" fill="currentColor" fillOpacity="0.15" />
          <circle cx="12" cy="9.6" r="2.6" />
        </svg>
      </span>
      <span style={styles.text}>
        <span style={styles.title}>{t('find_us_on_map')}</span>
        <span style={styles.address}>{RESTAURANT_ADDRESS}</span>
      </span>
      <span style={styles.go} aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h13M13 6l6 6-6 6" />
        </svg>
      </span>
    </a>
  );
}

const styles = {
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px',
    background: '#fff',
    border: '1px solid var(--divider)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-sm)',
    color: 'inherit',
    textDecoration: 'none',
  },
  pin: {
    width: 42,
    height: 42,
    flexShrink: 0,
    borderRadius: '50%',
    background: 'var(--primary-light)',
    color: 'var(--primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 },
  title: { fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' },
  address: { fontSize: 13, lineHeight: 1.35, color: 'var(--text-secondary)' },
  go: {
    width: 36,
    height: 36,
    flexShrink: 0,
    borderRadius: '50%',
    background: 'var(--primary)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--shadow-glow)',
  },
};

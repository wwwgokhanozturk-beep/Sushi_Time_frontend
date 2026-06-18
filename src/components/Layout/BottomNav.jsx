import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// ── Clean line icons (no emoji) — professional tab bar, mirrors the mobile app ──
function TabIcon({ name, active }) {
  const common = {
    width: 25,
    height: 25,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: active ? 2.15 : 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };
  switch (name) {
    case 'home':
      return (
        <svg {...common}>
          <path d="M4 10.5 12 4l8 6.5" />
          <path d="M6 9.6V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9.6" />
          <path d="M10 20v-4.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V20" />
        </svg>
      );
    case 'menu':
      return (
        <svg {...common}>
          <line x1="9" y1="6" x2="20" y2="6" />
          <line x1="9" y1="12" x2="20" y2="12" />
          <line x1="9" y1="18" x2="20" y2="18" />
          <circle cx="4.5" cy="6" r="1.3" />
          <circle cx="4.5" cy="12" r="1.3" />
          <circle cx="4.5" cy="18" r="1.3" />
        </svg>
      );
    case 'orders':
      return (
        <svg {...common}>
          <rect x="5.5" y="3.5" width="13" height="17" rx="2.5" />
          <path d="M9 8.5h6M9 12.5h6M9 16.5h4" />
        </svg>
      );
    case 'account':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.8" />
          <path d="M4.8 20c0-3.7 3.4-5.6 7.2-5.6s7.2 1.9 7.2 5.6" />
        </svg>
      );
    default:
      return null;
  }
}

export default function BottomNav() {
  const { t } = useTranslation();

  const tabs = [
    { to: '/', icon: 'home', label: t('home') },
    { to: '/menu', icon: 'menu', label: t('menu') },
    { to: '/orders', icon: 'orders', label: t('orders') },
    { to: '/profile', icon: 'account', label: t('account') },
  ];

  return (
    <nav style={styles.nav}>
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          style={({ isActive }) => ({
            ...styles.tab,
            ...(isActive ? styles.tabActive : {}),
          })}
        >
          {({ isActive }) => (
            <>
              <span
                style={{
                  ...styles.iconWrap,
                  transform: isActive ? 'translateY(-1px)' : 'none',
                }}
              >
                <TabIcon name={tab.icon} active={isActive} />
                {isActive && <span style={styles.dot} />}
              </span>
              <span style={styles.label}>{tab.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

const styles = {
  nav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px))',
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    background: 'rgba(255,255,255,0.96)',
    backdropFilter: 'saturate(180%) blur(12px)',
    WebkitBackdropFilter: 'saturate(180%) blur(12px)',
    borderTop: '1px solid var(--divider)',
    display: 'flex',
    zIndex: 100,
    boxShadow: '0 -4px 16px rgba(0,0,0,0.05)',
  },
  tab: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    textDecoration: 'none',
    color: 'var(--text-light)',
    paddingTop: 6,
    paddingBottom: 4,
    transition: 'color 0.18s ease',
  },
  tabActive: { color: 'var(--primary)' },
  iconWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.18s ease',
  },
  dot: {
    position: 'absolute',
    bottom: -5,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 4,
    height: 4,
    borderRadius: 999,
    background: 'var(--primary)',
  },
  label: { fontSize: 10.5, fontWeight: 700, letterSpacing: 0.1 },
};

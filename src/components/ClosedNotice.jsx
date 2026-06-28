import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../store/settingsStore';

const SESSION_KEY = 'sushi_closed_notice_shown';

// Полноэкранное предупреждение «ресторан закрыт». Показывается один раз за сессию
// при входе на сайт, если заведение сейчас закрыто. Внутри — кнопка «Посмотреть меню».
export default function ClosedNotice() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const businessHoursLoaded = useSettingsStore((s) => s.businessHoursLoaded);
  const openState = useSettingsStore((s) => s.openState);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!businessHoursLoaded) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    if (!openState().open) setShow(true);
  }, [businessHoursLoaded, openState]);

  const dismiss = () => {
    sessionStorage.setItem(SESSION_KEY, '1');
    setShow(false);
  };

  const goToMenu = () => {
    dismiss();
    navigate('/menu');
  };

  if (!show) return null;

  const os = openState();
  const isDayOff = os.reason === 'holiday' || os.reason === 'day_off';

  return (
    <div style={styles.overlay} onClick={dismiss}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <button style={styles.close} onClick={dismiss} aria-label="close">✕</button>

        <div style={styles.iconWrap}>🌙</div>

        <h2 style={styles.title}>{t('closed_title')}</h2>
        <p style={styles.subtitle}>{t('closed_subtitle')}</p>

        <div style={styles.hoursBox}>
          {isDayOff ? (
            <span style={styles.hoursOff}>{t('closed_today_off')}</span>
          ) : (
            <>
              <span style={styles.hoursLabel}>{t('closed_today_hours')}</span>
              <span style={styles.hoursValue}>{os.today.open} – {os.today.close}</span>
            </>
          )}
        </div>

        <button style={styles.menuBtn} onClick={goToMenu}>{t('view_menu')}</button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 2000,
    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  card: {
    position: 'relative', width: '100%', maxWidth: 380,
    background: '#fff', borderRadius: 'var(--radius-xl, 24px)', padding: '32px 24px 24px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center',
    animation: 'page-enter 0.25s ease',
  },
  close: {
    position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: '50%',
    border: 'none', background: 'var(--background, #f3f3f3)', color: 'var(--text-secondary, #666)',
    fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },
  iconWrap: {
    width: 72, height: 72, borderRadius: '50%', margin: '0 auto 16px',
    background: 'linear-gradient(135deg, var(--primary, #E8181B) 0%, var(--secondary, #FF6B35) 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
  },
  title: { fontSize: 22, fontWeight: 900, color: 'var(--text-primary, #0D0D0D)', margin: '0 0 8px' },
  subtitle: { fontSize: 14, lineHeight: 1.5, color: 'var(--text-secondary, #666)', margin: '0 0 20px' },
  hoursBox: {
    display: 'flex', flexDirection: 'column', gap: 4, padding: '14px 16px', marginBottom: 20,
    background: 'var(--primary-light, #FDECEA)', borderRadius: 'var(--radius-md, 12px)',
  },
  hoursLabel: { fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-secondary, #666)' },
  hoursValue: { fontSize: 20, fontWeight: 900, color: 'var(--primary, #E8181B)' },
  hoursOff: { fontSize: 16, fontWeight: 800, color: 'var(--primary, #E8181B)' },
  menuBtn: {
    width: '100%', padding: '14px', border: 'none', borderRadius: 'var(--radius-full, 999px)',
    background: 'var(--primary, #E8181B)', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer',
    boxShadow: 'var(--shadow-glow, 0 6px 20px rgba(232,24,27,0.4))',
  },
};

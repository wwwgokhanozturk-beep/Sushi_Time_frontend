import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../store/settingsStore';

export default function OrderSuccessPage() {
  const { t } = useTranslation();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const order = state?.order;
  const { orderTimerMinutes, loadOrderTimer } = useSettingsStore();

  useEffect(() => {
    if (!order) { navigate('/'); return; }
    loadOrderTimer();
    setTimeout(() => setVisible(true), 50);
    const redirect = setTimeout(() => navigate(`/orders/${order._id}`, { replace: true }), 2500);
    return () => clearTimeout(redirect);
  }, []);

  if (!order) return null;

  const shortId = order._id?.slice(-6).toUpperCase();

  return (
    <div style={styles.page}>
      <div style={{ ...styles.card, opacity: visible ? 1 : 0, transform: visible ? 'scale(1)' : 'scale(0.9)', transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
        {/* Check icon */}
        <div style={styles.iconWrap}>
          <div style={{ ...styles.icon, transform: visible ? 'scale(1)' : 'scale(0)', transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.2s' }}>
            ✓
          </div>
        </div>

        <h1 style={styles.title}>{t('order_confirmed')}</h1>
        <div style={styles.orderId}>{t('order_number', { id: shortId })}</div>
        <div style={styles.desc}>{t('order_success_desc')}</div>

        <div style={styles.etaCard}>
          <div style={styles.etaLabel}>{order.scheduledFor ? t('preorder_for') : t('estimated_delivery')}</div>
          <div style={styles.etaTime}>
            {order.scheduledFor
              ? new Date(order.scheduledFor).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })
              : `~${orderTimerMinutes} min`}
          </div>
        </div>

        <div style={styles.btnGroup}>
          <Link to={`/orders/${order._id}`} style={styles.trackBtn}>
            📍 {t('track_order')}
          </Link>
          <Link to="/" style={styles.homeBtn}>
            {t('back_to_home')}
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, paddingBottom: 80, background: 'var(--background)', minHeight: '60vh' },
  card: { background: '#fff', borderRadius: 'var(--radius-xl)', padding: '40px 32px', maxWidth: 440, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, boxShadow: 'var(--shadow-lg)', textAlign: 'center' },
  iconWrap: { width: 96, height: 96, borderRadius: 999, background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 48, color: 'var(--success)', display: 'block', lineHeight: 1 },
  title: { fontSize: 26, fontWeight: 900, color: 'var(--text-primary)' },
  orderId: { fontSize: 15, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', padding: '6px 16px', borderRadius: 999 },
  desc: { fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 },
  etaCard: { background: 'var(--background)', borderRadius: 'var(--radius-lg)', padding: '16px 24px', width: '100%' },
  etaLabel: { fontSize: 12, color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 },
  etaTime: { fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', marginTop: 4 },
  btnGroup: { display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginTop: 8 },
  trackBtn: { display: 'block', padding: '13px', background: 'var(--primary)', color: '#fff', borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: 15, textDecoration: 'none', textAlign: 'center', boxShadow: 'var(--shadow-glow)' },
  homeBtn: { display: 'block', padding: '13px', background: 'var(--background)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: 15, textDecoration: 'none', textAlign: 'center' },
};

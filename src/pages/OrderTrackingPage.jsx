import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOrderStore } from '../store/orderStore';
import { useSettingsStore } from '../store/settingsStore';
import StatusBadge from '../components/StatusBadge';

const STEPS = [
  { status: 'pending',   icon: '📋', key: 'order_placed' },
  { status: 'confirmed', icon: '✅', key: 'confirmed' },
  { status: 'preparing', icon: '🍳', key: 'preparing' },
  { status: 'en_route',  icon: '🛵', key: 'on_the_way' },
  { status: 'delivered', icon: '🏠', key: 'delivered' },
];

const STATUS_ORDER = ['pending', 'confirmed', 'preparing', 'en_route', 'delivered'];

export default function OrderTrackingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentOrder: order, loading, loadOrderById } = useOrderStore();
  const { orderTimerMinutes, loadOrderTimer } = useSettingsStore();
  const [remainingMs, setRemainingMs] = useState(null);

  useEffect(() => {
    loadOrderById(id);
    loadOrderTimer();
    const interval = setInterval(() => loadOrderById(id), 15000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (!order?.createdAt) return;
    // Pre-orders (scheduledFor) count down to the chosen slot, not from placement time.
    const baseTime = order.scheduledFor ? new Date(order.scheduledFor).getTime() : new Date(order.createdAt).getTime();
    const endTime = order.scheduledFor ? baseTime : baseTime + orderTimerMinutes * 60000;
    const tick = () => setRemainingMs(Math.max(0, endTime - Date.now()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [order?.createdAt, order?.scheduledFor, orderTimerMinutes]);

  if (loading && !order) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <div style={{ fontSize: 48 }}>🍣</div>
      </div>
    );
  }

  if (!order) return null;

  const currentIdx = STATUS_ORDER.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';
  const shortId = order._id?.slice(-6).toUpperCase();

  return (
    <div className="page-enter" style={styles.page}>
      <div style={styles.container}>
        <button style={styles.backBtn} onClick={() => navigate('/orders')}>← {t('orders')}</button>

        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>{t('track_order')}</h1>
            <div style={styles.orderId}>#{shortId}</div>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {/* Countdown timer — mm:ss normally, or d/h for a far-future pre-order */}
        {!isCancelled && order.status !== 'delivered' && remainingMs != null && (
          <div style={styles.timerCard}>
            <div style={styles.timerLabel}>{order.scheduledFor ? t('preorder_for') : t('time_remaining')}</div>
            <div style={styles.timerValue}>
              {remainingMs >= 24 * 60 * 60000
                ? `${Math.floor(remainingMs / (24 * 60 * 60000))}g ${Math.floor((remainingMs / 3600000) % 24)}s`
                : remainingMs >= 3600000
                ? `${String(Math.floor(remainingMs / 3600000)).padStart(2, '0')}:${String(Math.floor((remainingMs % 3600000) / 60000)).padStart(2, '0')}`
                : `${String(Math.floor(remainingMs / 60000)).padStart(2, '0')}:${String(Math.floor((remainingMs % 60000) / 1000)).padStart(2, '0')}`}
            </div>
            {remainingMs === 0 && <div style={styles.timerDone}>{t('order_ready_soon')}</div>}
          </div>
        )}

        {/* Stepper */}
        {!isCancelled ? (
          <div style={styles.stepper}>
            {STEPS.map((step, i) => {
              const done = i <= currentIdx;
              const active = i === currentIdx;
              return (
                <div key={step.status} style={styles.stepRow}>
                  {/* Connector line */}
                  {i > 0 && (
                    <div style={{ ...styles.line, ...(i <= currentIdx ? styles.lineDone : {}) }} />
                  )}
                  <div style={styles.stepInner}>
                    <div style={{ ...styles.stepCircle, ...(done ? styles.stepCircleDone : {}), ...(active ? styles.stepCircleActive : {}) }}>
                      <span style={{ fontSize: active ? 20 : 16 }}>{step.icon}</span>
                    </div>
                    <div style={styles.stepLabel}>
                      <span style={{ ...styles.stepText, ...(done ? styles.stepTextDone : {}), ...(active ? { fontWeight: 800, fontSize: 15 } : {}) }}>
                        {t(step.key)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={styles.cancelledCard}>
            <div style={{ fontSize: 48 }}>❌</div>
            <div style={styles.cancelledText}>{t('order_cancelled')}</div>
          </div>
        )}

        {/* Order details */}
        <div style={styles.detailCard}>
          <div style={styles.detailTitle}>{t('order_summary')}</div>
          <div style={styles.itemsList}>
            {order.items?.map((item, i) => (
              <div key={i} style={styles.itemRow}>
                <span>{item.name} × {item.quantity}</span>
                <span style={{ fontWeight: 700 }}>{item.subtotal?.toFixed(0) ?? (item.price * item.quantity).toFixed(0)} ₺</span>
              </div>
            ))}
          </div>
          <div style={styles.divider} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 900 }}>
            <span>{t('total')}</span>
            <span style={{ color: 'var(--primary)' }}>{order.totalPrice?.toFixed(2)} ₺</span>
          </div>
        </div>

        {/* Delivery address */}
        {order.address && (
          <div style={styles.detailCard}>
            <div style={styles.detailTitle}>{t('delivery_address')}</div>
            <div style={styles.addressText}>
              📍 {order.address}
              {order.buildingName && `, ${order.buildingName}`}
              {order.floor && `, ${t('floor')} ${order.floor}`}
              {order.apartment && `, apt ${order.apartment}`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { flex: 1, paddingBottom: 80 },
  container: { maxWidth: 700, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 },
  backBtn: { alignSelf: 'flex-start', fontSize: 14, fontWeight: 600, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' },
  title: { fontSize: 26, fontWeight: 900, color: 'var(--text-primary)' },
  orderId: { fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', fontFamily: 'monospace', marginTop: 2 },
  timerCard: { background: 'var(--primary)', borderRadius: 'var(--radius-xl)', padding: '20px 24px', boxShadow: 'var(--shadow-glow)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  timerLabel: { fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: 1 },
  timerValue: { fontSize: 40, fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' },
  timerDone: { fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)' },
  stepper: { background: '#fff', borderRadius: 'var(--radius-xl)', padding: '24px', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' },
  stepRow: { display: 'flex', flexDirection: 'column' },
  line: { width: 2, height: 28, background: 'var(--divider)', margin: '0 0 0 22px', borderRadius: 1 },
  lineDone: { background: 'var(--success)' },
  stepInner: { display: 'flex', alignItems: 'center', gap: 14 },
  stepCircle: {
    width: 44, height: 44, borderRadius: 999,
    background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, border: '2px solid var(--divider)',
  },
  stepCircleDone: { background: '#E8F5E9', border: '2px solid var(--success)' },
  stepCircleActive: { background: 'var(--primary-light)', border: '2px solid var(--primary)', boxShadow: 'var(--shadow-glow)' },
  stepLabel: { flex: 1, paddingTop: 2 },
  stepText: { fontSize: 14, fontWeight: 500, color: 'var(--text-light)' },
  stepTextDone: { color: 'var(--text-primary)', fontWeight: 600 },
  cancelledCard: { background: '#fff', borderRadius: 'var(--radius-xl)', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow-sm)' },
  cancelledText: { fontSize: 16, fontWeight: 600, color: 'var(--error)' },
  detailCard: { background: '#fff', borderRadius: 'var(--radius-xl)', padding: '20px', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: 12 },
  detailTitle: { fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' },
  itemsList: { display: 'flex', flexDirection: 'column', gap: 8 },
  itemRow: { display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-secondary)' },
  divider: { height: 1, background: 'var(--divider)' },
  addressText: { fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 },
};

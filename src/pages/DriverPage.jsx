import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import httpClient from '../api/httpClient';
import { useProfileStore } from '../store/profileStore';
import { useLocationSharing } from '../hooks/useLocationSharing';
import StatusBadge from '../components/StatusBadge';

/**
 * Рабочий экран курьера.
 *
 * Открывается по ссылке на телефоне: список назначенных доставок и одна
 * кнопка, которая начинает передавать геопозицию клиентам. Пока вкладка
 * открыта, координаты уходят по сокету — фонового режима у браузера нет.
 */
export default function DriverPage() {
  const { t } = useTranslation();
  const role = useProfileStore((s) => s.role);
  const isLoggedIn = useProfileStore((s) => s.isLoggedIn);
  const name = useProfileStore((s) => s.name);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const { sharing, error, lastSentAt, currentPosition, start, stop } = useLocationSharing();

  const isDriver = isLoggedIn && role === 'driver';

  const loadOrders = useCallback(async () => {
    setLoadError('');
    try {
      const res = await httpClient.get('/drivers/me/orders');
      setOrders(res.data?.data?.orders || []);
    } catch (e) {
      setLoadError(e.response?.data?.message || 'Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isDriver) { setLoading(false); return undefined; }
    loadOrders();
    // Назначения приходят от админа — подтягиваем список периодически.
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, [isDriver, loadOrders]);

  const enRouteOrders = orders.filter((o) => o.status === 'en_route');

  // Заказ ушёл из «в пути» — передавать по нему координаты больше некому.
  useEffect(() => {
    if (sharing && enRouteOrders.length === 0) stop();
  }, [sharing, enRouteOrders.length, stop]);

  const markDelivered = async (orderId) => {
    try {
      await httpClient.patch(`/orders/${orderId}/delivered`);
      await loadOrders();
    } catch (e) {
      setLoadError(e.response?.data?.message || 'Failed to update order');
    }
  };

  if (!isDriver) {
    return (
      <div style={styles.page}>
        <div style={styles.centered}>
          <div style={{ fontSize: 48 }}>🛵</div>
          <p style={styles.hint}>{t('driver_login_required')}</p>
          <Link to="/login" style={styles.primaryBtn}>{t('sign_in')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter" style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>{t('my_deliveries')}</h1>
            <div style={styles.subtitle}>{name}</div>
          </div>
          <button style={styles.refreshBtn} onClick={loadOrders}>↻ {t('refresh')}</button>
        </div>

        {/* Передача геопозиции */}
        <div style={{ ...styles.shareCard, ...(sharing ? styles.shareCardActive : {}) }}>
          {sharing ? (
            <>
              <div style={styles.shareTitle}>📡 {t('sharing_location')}</div>
              <div style={styles.shareMeta}>
                {lastSentAt && <span>{t('last_sent')}: {new Date(lastSentAt).toLocaleTimeString()}</span>}
                {currentPosition && (
                  <span style={styles.coords}>
                    {currentPosition.lat.toFixed(5)}, {currentPosition.lng.toFixed(5)}
                  </span>
                )}
              </div>
              <div style={styles.warning}>⚠️ {t('keep_tab_open')}</div>
              <button style={styles.stopBtn} onClick={stop}>{t('stop_delivery')}</button>
            </>
          ) : (
            <>
              <div style={styles.shareTitle}>{t('start_delivery')}</div>
              <div style={styles.shareMeta}>{t('location_permission_needed')}</div>
              <button
                style={{ ...styles.startBtn, opacity: enRouteOrders.length === 0 ? 0.5 : 1 }}
                disabled={enRouteOrders.length === 0}
                onClick={() => start(enRouteOrders.map((o) => o._id))}
              >
                ▶ {t('start_delivery')}
              </button>
              {error && <div style={styles.error}>{t(errorKeyToLabel(error))}</div>}
            </>
          )}
        </div>

        {loadError && <div style={styles.error}>{loadError}</div>}

        {/* Список доставок */}
        {loading ? (
          <div style={styles.centered}><div style={{ fontSize: 40 }}>🍣</div></div>
        ) : orders.length === 0 ? (
          <div style={styles.centered}><p style={styles.hint}>{t('no_deliveries')}</p></div>
        ) : (
          orders.map((order) => (
            <div key={order._id} style={styles.orderCard}>
              <div style={styles.orderHeader}>
                <span style={styles.orderId}>#{order._id.slice(-6).toUpperCase()}</span>
                <StatusBadge status={order.status} />
              </div>

              <div style={styles.customer}>{order.customerName}</div>
              <div style={styles.address}>
                📍 {order.address}
                {order.buildingName && `, ${order.buildingName}`}
                {order.floor && `, ${t('floor')} ${order.floor}`}
                {order.apartment && `, ${order.apartment}`}
                {order.doorCode && ` (${t('door_code')}: ${order.doorCode})`}
              </div>
              {order.notes && <div style={styles.notes}>💬 {order.notes}</div>}

              <div style={styles.orderFooter}>
                <span style={styles.price}>{order.totalPrice?.toFixed(2)} ₺ · {t(order.paymentMethod === 'card' ? 'card' : 'cash')}</span>
                <div style={styles.actions}>
                  <a href={`tel:${order.phone}`} style={styles.actionLink}>📞</a>
                  <a
                    href={
                      order.latitude != null && order.longitude != null
                        ? `https://www.google.com/maps/dir/?api=1&destination=${order.latitude},${order.longitude}`
                        : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.address)}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    style={styles.actionLink}
                  >
                    🧭
                  </a>
                  {order.status === 'en_route' && (
                    <button style={styles.deliveredBtn} onClick={() => markDelivered(order._id)}>
                      ✓ {t('mark_delivered')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/** Коды ошибок геолокации -> ключи переводов. */
function errorKeyToLabel(code) {
  if (code === 'permission_denied') return 'location_denied';
  if (code === 'geolocation_unsupported') return 'location_unavailable';
  return 'location_unavailable';
}

const styles = {
  page: { flex: 1, paddingBottom: 80 },
  container: { maxWidth: 700, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  title: { fontSize: 24, fontWeight: 900, color: 'var(--text-primary)' },
  subtitle: { fontSize: 14, color: 'var(--text-secondary)', marginTop: 2 },
  refreshBtn: { background: 'none', border: '1.5px solid var(--divider)', borderRadius: 'var(--radius-full)', padding: '8px 14px', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', cursor: 'pointer' },
  shareCard: { background: '#fff', borderRadius: 'var(--radius-xl)', padding: 20, boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: 10 },
  shareCardActive: { border: '2px solid var(--success)' },
  shareTitle: { fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' },
  shareMeta: { fontSize: 13, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 2 },
  coords: { fontFamily: 'monospace', fontSize: 12 },
  warning: { fontSize: 12, color: 'var(--text-secondary)', background: 'var(--background)', padding: '8px 10px', borderRadius: 'var(--radius-md)', lineHeight: 1.4 },
  startBtn: { background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-full)', padding: '14px 20px', fontSize: 16, fontWeight: 800, cursor: 'pointer' },
  stopBtn: { background: 'var(--background)', color: 'var(--text-primary)', border: '1.5px solid var(--divider)', borderRadius: 'var(--radius-full)', padding: '12px 20px', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  orderCard: { background: '#fff', borderRadius: 'var(--radius-xl)', padding: 18, boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: 8 },
  orderHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  orderId: { fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' },
  customer: { fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' },
  address: { fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 },
  notes: { fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' },
  orderFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 4, flexWrap: 'wrap' },
  price: { fontSize: 15, fontWeight: 800, color: 'var(--primary)' },
  actions: { display: 'flex', alignItems: 'center', gap: 8 },
  actionLink: { fontSize: 20, textDecoration: 'none', padding: '6px 10px', borderRadius: 'var(--radius-md)', background: 'var(--background)' },
  deliveredBtn: { background: 'var(--success)', color: '#fff', border: 'none', borderRadius: 'var(--radius-full)', padding: '10px 16px', fontSize: 14, fontWeight: 800, cursor: 'pointer' },
  centered: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '60px 20px', textAlign: 'center' },
  hint: { fontSize: 15, color: 'var(--text-secondary)' },
  primaryBtn: { background: 'var(--primary)', color: '#fff', textDecoration: 'none', borderRadius: 'var(--radius-full)', padding: '12px 26px', fontSize: 15, fontWeight: 800 },
  error: { fontSize: 13, fontWeight: 600, color: 'var(--error)' },
};

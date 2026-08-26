import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOrderStore } from '../store/orderStore';
import { useProfileStore } from '../store/profileStore';
import { useCartStore } from '../store/cartStore';
import StatusBadge from '../components/StatusBadge';

export default function OrdersPage() {
  const { t } = useTranslation();
  const { orders, loading, loadOrders } = useOrderStore();
  const { phone } = useProfileStore();
  const addToCart = useCartStore((s) => s.addToCart);

  useEffect(() => { loadOrders(phone); }, [phone]);

  const handleReorder = (order) => {
    order.items?.forEach((item) => {
      if (item.menuItem) {
        for (let i = 0; i < item.quantity; i++) addToCart(item.menuItem);
      }
    });
  };

  if (loading && !orders.length) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <h1 style={styles.title}>{t('my_orders')}</h1>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter" style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>{t('my_orders')}</h1>

        {!orders.length ? (
          <div style={styles.empty}>
            <div style={{ fontSize: 64 }}>📋</div>
            <div style={styles.emptyTitle}>{t('no_orders_yet')}</div>
            <div style={styles.emptySubtitle}>{t('orders_appear_here')}</div>
            <Link to="/menu" style={styles.menuBtn}>🍣 {t('browse_menu')}</Link>
          </div>
        ) : (
          <div style={styles.list}>
            {orders.map((order) => (
              <div key={order._id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <div style={styles.orderId}>#{order._id?.slice(-6).toUpperCase()}</div>
                    <div style={styles.date}>{new Date(order.createdAt).toLocaleDateString()} · {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <div style={styles.itemsList}>
                  {order.items?.slice(0, 3).map((item, i) => (
                    <span key={i} style={styles.itemChip}>{item.name} ×{item.quantity}</span>
                  ))}
                  {order.items?.length > 3 && (
                    <span style={styles.itemChip}>+{order.items.length - 3} more</span>
                  )}
                </div>

                <div style={styles.cardFooter}>
                  <div style={styles.total}>{order.totalPrice?.toFixed(2)} ₺</div>
                  <div style={styles.actions}>
                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <Link to={`/orders/${order._id}`} style={styles.trackBtn}>
                        📍 {t('track_order')}
                      </Link>
                    )}
                    {order.status === 'delivered' && (
                      <button style={styles.reorderBtn} onClick={() => handleReorder(order)}>
                        🔄 {t('reorder')}
                      </button>
                    )}
                    <Link to={`/orders/${order._id}`} style={styles.viewBtn}>→</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { flex: 1, paddingBottom: 'var(--page-bottom-space)' },
  container: { maxWidth: 800, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 },
  title: { fontSize: 28, fontWeight: 900, color: 'var(--text-primary)' },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: { background: '#fff', borderRadius: 'var(--radius-xl)', padding: '20px', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: 14 },
  cardHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' },
  orderId: { fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' },
  date: { fontSize: 12, color: 'var(--text-light)', marginTop: 2 },
  itemsList: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  itemChip: { background: 'var(--background)', padding: '3px 10px', borderRadius: 999, fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 },
  cardFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  total: { fontSize: 20, fontWeight: 900, color: 'var(--primary)' },
  actions: { display: 'flex', gap: 8, alignItems: 'center' },
  trackBtn: { padding: '8px 14px', background: 'var(--primary)', color: '#fff', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 700, textDecoration: 'none' },
  reorderBtn: { padding: '8px 14px', background: 'var(--background)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' },
  viewBtn: { width: 32, height: 32, borderRadius: 999, background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--text-secondary)', textDecoration: 'none' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '60px 0', textAlign: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: 800 },
  emptySubtitle: { fontSize: 14, color: 'var(--text-secondary)' },
  menuBtn: { padding: '12px 24px', background: 'var(--primary)', color: '#fff', borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: 14, textDecoration: 'none', marginTop: 8 },
};

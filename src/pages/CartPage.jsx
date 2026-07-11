import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCartStore, selectTotalPrice } from '../store/cartStore';
import { FREE_DELIVERY_THRESHOLD, DELIVERY_FEE, SERVICE_FEE } from '../theme';
import DeliveryMinBanner from '../components/DeliveryMinBanner';
import useIsMobile from '../hooks/useIsMobile';

export default function CartPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { items, updateQuantity, removeFromCart, clearCart } = useCartStore();
  const subtotal = useCartStore(selectTotalPrice);
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryFee + SERVICE_FEE;
  const freeDeliveryLeft = FREE_DELIVERY_THRESHOLD - subtotal;

  if (!items.length) {
    return (
      <div className="page-enter" style={styles.emptyPage}>
        <div style={{ fontSize: 80 }}>🛒</div>
        <div style={styles.emptyTitle}>{t('cart_empty')}</div>
        <div style={styles.emptySubtitle}>{t('cart_empty_subtitle')}</div>
        <Link to="/menu" style={styles.browseBtn}>{t('browse_menu')}</Link>
      </div>
    );
  }

  return (
    <div className="page-enter" style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>{t('my_cart')}</h1>
          <button style={styles.clearBtn} onClick={clearCart}>{t('clear')}</button>
        </div>

        <div style={{ ...styles.layout, ...(isMobile ? styles.layoutMobile : {}) }}>
          {/* Items list */}
          <div style={styles.itemsList}>
            {items.map(({ menuItem, quantity }) => (
              <div key={menuItem._id} style={{ ...styles.item, ...(isMobile ? styles.itemMobile : {}) }}>
                <div style={styles.itemImg}>
                  {menuItem.imageUrl
                    ? <img src={menuItem.imageUrl} alt={menuItem.name} style={styles.img} />
                    : <div style={{ ...styles.img, background: 'var(--divider)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🍣</div>
                  }
                </div>
                <div style={styles.itemInfo}>
                  <div style={styles.itemName}>{menuItem.name}</div>
                  <div style={styles.itemPrice}>{menuItem.price} ₺ each</div>
                </div>
                <div style={{ ...styles.itemRight, ...(isMobile ? styles.itemRightMobile : {}) }}>
                  <div style={styles.qtyControl}>
                    <button style={styles.qtyBtn} onClick={() => updateQuantity(menuItem._id, quantity - 1)}>−</button>
                    <span style={styles.qtyVal}>{quantity}</span>
                    <button style={styles.qtyBtn} onClick={() => updateQuantity(menuItem._id, quantity + 1)}>+</button>
                  </div>
                  <div style={styles.itemSubtotal}>{(menuItem.price * quantity).toFixed(0)} ₺</div>
                  <button style={styles.removeBtn} onClick={() => removeFromCart(menuItem._id)}>🗑</button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div style={styles.summary}>
            <div style={styles.summaryTitle}>{t('order_summary')}</div>

            <DeliveryMinBanner />

            {freeDeliveryLeft > 0 && (
              <div style={styles.freeHint}>
                🚚 {t('free_delivery_hint', { amount: freeDeliveryLeft.toFixed(0) })}
              </div>
            )}

            <div style={styles.summaryRows}>
              <div style={styles.summaryRow}>
                <span>{t('subtotal')}</span>
                <span>{subtotal.toFixed(0)} ₺</span>
              </div>
              <div style={styles.summaryRow}>
                <span>{t('delivery_fee')}</span>
                <span style={deliveryFee === 0 ? { color: 'var(--success)', fontWeight: 700 } : {}}>
                  {deliveryFee === 0 ? t('free') : `${deliveryFee} ₺`}
                </span>
              </div>
              <div style={styles.summaryRow}>
                <span>{t('service_fee')}</span>
                <span>{SERVICE_FEE} ₺</span>
              </div>
              <div style={styles.divider} />
              <div style={{ ...styles.summaryRow, ...styles.totalRow }}>
                <span>{t('total')}</span>
                <span>{total.toFixed(2)} ₺</span>
              </div>
            </div>

            <button style={styles.checkoutBtn} onClick={() => navigate('/checkout')}>
              {t('proceed_to_checkout')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { flex: 1, paddingBottom: 80 },
  container: { maxWidth: 1100, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 24 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 28, fontWeight: 900, color: 'var(--text-primary)' },
  clearBtn: { fontSize: 13, fontWeight: 600, color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' },
  layoutMobile: { gridTemplateColumns: '1fr' },
  itemsList: { display: 'flex', flexDirection: 'column', gap: 12 },
  item: {
    display: 'flex', alignItems: 'center', gap: 16,
    background: '#fff', borderRadius: 'var(--radius-lg)', padding: '16px',
    boxShadow: 'var(--shadow-sm)',
  },
  itemMobile: { flexWrap: 'wrap' },
  itemRightMobile: { width: '100%', justifyContent: 'space-between', marginTop: 4 },
  itemImg: { width: 72, height: 72, borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0 },
  img: { width: '100%', height: '100%', objectFit: 'cover' },
  itemInfo: { flex: 1, minWidth: 0 },
  itemName: { fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' },
  itemPrice: { fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 },
  itemRight: { display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 },
  qtyControl: { display: 'flex', alignItems: 'center', background: 'var(--background)', borderRadius: 'var(--radius-full)' },
  qtyBtn: { width: 32, height: 36, fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 },
  qtyVal: { width: 28, textAlign: 'center', fontSize: 15, fontWeight: 700 },
  itemSubtotal: { fontSize: 16, fontWeight: 800, color: 'var(--primary)', minWidth: 48, textAlign: 'right' },
  removeBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, opacity: 0.5 },
  summary: {
    background: '#fff', borderRadius: 'var(--radius-xl)', padding: '24px',
    boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column', gap: 16,
    position: 'sticky', top: 80,
  },
  summaryTitle: { fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' },
  freeHint: {
    background: 'var(--primary-light)', color: 'var(--primary)',
    borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 13, fontWeight: 600,
  },
  summaryRows: { display: 'flex', flexDirection: 'column', gap: 10 },
  summaryRow: { display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-secondary)' },
  divider: { height: 1, background: 'var(--divider)' },
  totalRow: { fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' },
  checkoutBtn: {
    width: '100%', padding: '14px', background: 'var(--primary)', color: '#fff',
    border: 'none', borderRadius: 'var(--radius-full)', fontSize: 15, fontWeight: 700,
    cursor: 'pointer', boxShadow: 'var(--shadow-glow)',
  },
  emptyPage: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 12, padding: 40, paddingBottom: 80,
  },
  emptyTitle: { fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' },
  emptySubtitle: { fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center' },
  browseBtn: {
    marginTop: 8, padding: '12px 28px', background: 'var(--primary)', color: '#fff',
    borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: 15, textDecoration: 'none',
  },
};

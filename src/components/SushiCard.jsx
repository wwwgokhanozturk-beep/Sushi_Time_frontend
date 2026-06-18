import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '../store/cartStore';

// Кадрирование фото, заданное в админке (масштаб + смещение в % рамки)
export function imageFrameStyle(item) {
  const s = item?.imageScale ?? 1;
  const x = item?.imageOffsetX ?? 0;
  const y = item?.imageOffsetY ?? 0;
  if (s === 1 && x === 0 && y === 0) return null;
  return { transform: `translate(${x}%, ${y}%) scale(${s})`, transformOrigin: 'center' };
}

export default function SushiCard({ item, layout = 'grid' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const addToCart = useCartStore((s) => s.addToCart);

  if (!item) return null;

  const frame = imageFrameStyle(item);

  const handleAdd = (e) => {
    e.stopPropagation();
    if (item.isAvailable !== false) addToCart(item);
  };

  // ── LIST mode — same row layout as the mobile app (text left, image right) ──
  if (layout === 'list') {
    const hasDiscount = item.comparePrice && item.comparePrice > item.price;
    return (
      <div style={listStyles.row} onClick={() => navigate(`/menu/${item._id}`)}>
        {/* LEFT — text */}
        <div style={listStyles.content}>
          <div style={listStyles.name}>{item.name}</div>
          <div style={listStyles.priceRow}>
            <span style={listStyles.price}>{item.price} ₺</span>
            {hasDiscount && <span style={listStyles.compare}>{item.comparePrice} ₺</span>}
          </div>
          {item.description && <div style={listStyles.desc}>{item.description}</div>}
        </div>

        {/* RIGHT — image + add button */}
        <div style={listStyles.imgWrap}>
          {item.imageUrl ? (
            <img style={{ ...listStyles.img, ...frame }} src={item.imageUrl} alt={item.name} loading="lazy" />
          ) : (
            <div style={{ ...listStyles.img, ...listStyles.imgPlaceholder }}>🍣</div>
          )}
          {!item.isAvailable && <div style={listStyles.soldOut}>{t('unavailable')}</div>}
          <button
            className={'sushi-card__add' + (item.isAvailable === false ? ' sushi-card__add--disabled' : '')}
            style={listStyles.addBtn}
            onClick={handleAdd}
            disabled={item.isAvailable === false}
            aria-label={t('add_to_cart') || 'Add'}
          >
            +
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sushi-card" onClick={() => navigate(`/menu/${item._id}`)}>
      {/* Image */}
      <div className="sushi-card__img-wrap">
        {item.imageUrl ? (
          <img
            className="sushi-card__img"
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            style={frame || undefined}
          />
        ) : (
          <div
            className="sushi-card__img"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 48,
              background: 'var(--background)',
            }}
          >
            🍣
          </div>
        )}
        {!item.isAvailable && (
          <div style={styles.unavailableOverlay}>{t('unavailable')}</div>
        )}
      </div>

      {/* Info */}
      <div style={styles.info}>
        <div style={styles.name}>{item.name}</div>
        {item.description && (
          <div style={styles.desc}>{item.description}</div>
        )}
        <div style={styles.meta}>
          {item.preparationTime && (
            <span style={styles.metaItem}>⏱ {item.preparationTime} {t('min_label')}</span>
          )}
          {item.calories > 0 && (
            <span style={styles.metaItem}>🔥 {item.calories} {t('cal_label')}</span>
          )}
        </div>
        <div style={styles.footer}>
          <div style={styles.priceWrap}>
            <span style={styles.price}>{item.price} ₺</span>
            {item.comparePrice && (
              <span style={styles.comparePrice}>{item.comparePrice} ₺</span>
            )}
          </div>
          <button
            className={
              'sushi-card__add' +
              (item.isAvailable === false ? ' sushi-card__add--disabled' : '')
            }
            onClick={handleAdd}
            disabled={item.isAvailable === false}
            aria-label={t('add_to_cart') || 'Add'}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  unavailableOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 700,
    fontSize: 13,
  },
  info: {
    padding: '14px 16px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--text-primary)',
    lineHeight: 1.3,
  },
  desc: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  meta: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  metaItem: { fontSize: 11, color: 'var(--text-light)', fontWeight: 500 },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: 10,
  },
  priceWrap: { display: 'flex', alignItems: 'center', gap: 6 },
  price: { fontSize: 20, fontWeight: 800, color: 'var(--primary)' },
  comparePrice: {
    fontSize: 12,
    color: 'var(--text-light)',
    textDecoration: 'line-through',
  },
};

// ── List row styles — mirror of the mobile app's list-mode SushiCard ──────────
const listStyles = {
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '14px 16px',
    background: '#fff',
    borderBottom: '1px solid var(--divider)',
    cursor: 'pointer',
  },
  content: { flex: 1, display: 'flex', flexDirection: 'column', gap: 5, paddingRight: 4, minWidth: 0 },
  name: { fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.35, letterSpacing: -0.3 },
  priceRow: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  price: { fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' },
  compare: { fontSize: 13, fontWeight: 500, color: 'var(--text-light)', textDecoration: 'line-through' },
  desc: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
  },
  imgWrap: { position: 'relative', width: 116, height: 116, flexShrink: 0 },
  img: { width: 116, height: 116, borderRadius: 16, objectFit: 'cover', background: 'var(--background)', display: 'block' },
  imgPlaceholder: { display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 },
  soldOut: {
    position: 'absolute', inset: 0, borderRadius: 16,
    background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 700, fontSize: 12, textAlign: 'center',
  },
  addBtn: {
    position: 'absolute', bottom: -6, right: -6,
    width: 36, height: 36, borderRadius: '50%',
    border: '2.5px solid #fff',
  },
};

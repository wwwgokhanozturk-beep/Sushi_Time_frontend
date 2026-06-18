import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import httpClient from '../api/httpClient';
import { useCartStore } from '../store/cartStore';
import { imageFrameStyle } from '../components/SushiCard';
import useIsMobile from '../hooks/useIsMobile';

export default function ItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  const addToCart = useCartStore((s) => s.addToCart);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setLoading(true);
    httpClient.get(`/menu/${id}`)
      .then((r) => setItem(r.data?.data?.item || r.data?.data))
      .catch(() => navigate('/menu'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) addToCart(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const lang = i18n.language || 'en';
  const description = (lang === 'ru' && item?.description_ru) || (lang === 'tr' && item?.description_tr) || item?.description || '';
  const ingredients = (lang === 'ru' && item?.ingredients_ru?.length ? item.ingredients_ru : null) ||
    (lang === 'tr' && item?.ingredients_tr?.length ? item.ingredients_tr : null) ||
    item?.ingredients || [];

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <div style={{ fontSize: 48, animation: 'spin 1s linear infinite' }}>🍣</div>
    </div>
  );

  if (!item) return null;

  return (
    <div className="page-enter" style={styles.page}>
      <div style={styles.container}>
        {/* Back button */}
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          ← {t('menu')}
        </button>

        <div style={{ ...styles.layout, ...(isMobile ? styles.layoutMobile : {}) }}>
          {/* Image */}
          <div style={styles.imgWrap}>
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} style={{ ...styles.img, ...imageFrameStyle(item) }} />
            ) : (
              <div style={{ ...styles.img, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80, background: 'var(--divider)' }}>
                🍣
              </div>
            )}
            {!item.isAvailable && (
              <div style={styles.unavail}>{t('unavailable')}</div>
            )}
          </div>

          {/* Details */}
          <div style={styles.details}>
            {/* Badges */}
            <div style={styles.badges}>
              {item.preparationTime && (
                <span style={styles.badge}>⏱ {item.preparationTime} {t('min_label')}</span>
              )}
              {item.calories > 0 && (
                <span style={styles.badge}>🔥 {item.calories} {t('cal_label')}</span>
              )}
              <span style={{ ...styles.badge, background: 'var(--primary-light)', color: 'var(--primary)' }}>
                {item.category}
              </span>
            </div>

            <h1 style={styles.name}>{item.name}</h1>

            {/* Price */}
            <div style={styles.priceRow}>
              <span style={styles.price}>{item.price} ₺</span>
              {item.comparePrice && (
                <span style={styles.comparePrice}>{item.comparePrice} ₺</span>
              )}
            </div>

            {/* Description */}
            {description && (
              <div>
                <div style={styles.sectionLabel}>{t('description')}</div>
                <div style={styles.bodyText}>{description}</div>
              </div>
            )}

            {/* Ingredients */}
            {ingredients.length > 0 && (
              <div>
                <div style={styles.sectionLabel}>{t('ingredients')}</div>
                <div style={styles.ingList}>
                  {ingredients.map((ing, i) => (
                    <span key={i} style={styles.ingTag}>{ing}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Add */}
            {item.isAvailable !== false && (
              <div style={styles.addRow}>
                <div style={styles.qtyControl}>
                  <button style={styles.qtyBtn} onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                  <span style={styles.qtyVal}>{qty}</span>
                  <button style={styles.qtyBtn} onClick={() => setQty((q) => q + 1)}>+</button>
                </div>
                <button style={{ ...styles.addBtn, ...(added ? styles.addBtnDone : {}) }} onClick={handleAdd}>
                  {added ? '✓ Added!' : `${t('add_to_cart')} — ${(item.price * qty).toFixed(0)} ₺`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { flex: 1, paddingBottom: 80 },
  container: { maxWidth: 1000, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 },
  backBtn: { alignSelf: 'flex-start', fontSize: 14, fontWeight: 600, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 },
  layout: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' },
  layoutMobile: { gridTemplateColumns: '1fr', gap: 20 },
  imgWrap: { position: 'relative', borderRadius: 'var(--radius-xl)', overflow: 'hidden', aspectRatio: '1/1' },
  img: { width: '100%', height: '100%', objectFit: 'cover' },
  unavail: {
    position: 'absolute', inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 700, fontSize: 18,
  },
  details: { display: 'flex', flexDirection: 'column', gap: 20 },
  badges: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  badge: { padding: '4px 12px', borderRadius: 999, background: 'var(--background)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 },
  name: { fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: -0.5, lineHeight: 1.2 },
  priceRow: { display: 'flex', alignItems: 'center', gap: 10 },
  price: { fontSize: 28, fontWeight: 900, color: 'var(--primary)' },
  comparePrice: { fontSize: 16, color: 'var(--text-light)', textDecoration: 'line-through' },
  sectionLabel: { fontSize: 11, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 },
  bodyText: { fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6 },
  ingList: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  ingTag: { padding: '4px 12px', background: 'var(--primary-light)', color: 'var(--primary)', fontSize: 12, fontWeight: 600, borderRadius: 999 },
  addRow: { display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 },
  qtyControl: { display: 'flex', alignItems: 'center', gap: 0, background: 'var(--background)', borderRadius: 'var(--radius-full)', overflow: 'hidden' },
  qtyBtn: { width: 40, height: 44, fontSize: 20, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' },
  qtyVal: { width: 32, textAlign: 'center', fontSize: 17, fontWeight: 700 },
  addBtn: {
    flex: 1,
    padding: '12px 20px',
    background: 'var(--primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-full)',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: 'var(--shadow-glow)',
    transition: 'all 0.2s',
  },
  addBtnDone: { background: 'var(--success)', boxShadow: 'none' },
};

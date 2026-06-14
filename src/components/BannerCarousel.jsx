import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import httpClient from '../api/httpClient';

const SLIDE_DURATION = 6000;

const BADGE_COLORS = {
  HOT: '#EF4444',
  NEW: '#10B981',
  SALE: '#F59E0B',
  LIMITED: '#8B5CF6',
};

function pick(promo, field, lang) {
  return (
    (lang === 'ru' && promo[`${field}_ru`]) ||
    (lang === 'tr' && promo[`${field}_tr`]) ||
    promo[field] ||
    ''
  );
}

// Shown when there are no active promotions yet, so the carousel is never empty.
const FALLBACK_SLIDES = [
  {
    _id: '__fb1',
    title: 'Свежие суши с доставкой',
    title_ru: 'Свежие суши с доставкой',
    description: 'Готовим из охлаждённой рыбы и привозим за 30 минут',
    description_ru: 'Готовим из охлаждённой рыбы и привозим за 30 минут',
    badge: 'NEW',
    gradient: 'linear-gradient(120deg, #E8181B 0%, #FF6B35 100%)',
    emoji: '🍣',
  },
  {
    _id: '__fb2',
    title: 'Бесплатная доставка',
    title_ru: 'Бесплатная доставка',
    description: 'При заказе от 25 — доставим бесплатно по городу',
    description_ru: 'При заказе от 25 — доставим бесплатно по городу',
    badge: 'HOT',
    gradient: 'linear-gradient(120deg, #FF6B35 0%, #F59E0B 100%)',
    emoji: '🚚',
  },
  {
    _id: '__fb3',
    title: 'Популярный дуэт в подарок',
    title_ru: 'Популярный дуэт в подарок',
    description: 'Закажи сет и получи фирменный ролл бесплатно',
    description_ru: 'Закажи сет и получи фирменный ролл бесплатно',
    badge: 'SALE',
    discountPercent: 20,
    gradient: 'linear-gradient(120deg, #8B5CF6 0%, #E8181B 100%)',
    emoji: '🎁',
  },
];

export default function BannerCarousel() {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').slice(0, 2);
  const [promos, setPromos] = useState([]);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    httpClient
      .get('/promotions')
      .then((r) => setPromos(r.data?.data?.promotions || []))
      .catch(() => {});
  }, []);

  // Use real promotions if any exist, otherwise show the default banners.
  const slides = promos.length ? promos : FALLBACK_SLIDES;
  const count = slides.length;

  const goTo = useCallback((i) => {
    setIdx(((i % count) + count) % count);
  }, [count]);

  const next = useCallback(() => goTo(idx + 1), [goTo, idx]);
  const prev = useCallback(() => goTo(idx - 1), [goTo, idx]);

  // Auto-advance
  useEffect(() => {
    if (count <= 1 || paused) return;
    timerRef.current = setTimeout(() => {
      setIdx((p) => (p + 1) % count);
    }, SLIDE_DURATION);
    return () => clearTimeout(timerRef.current);
  }, [idx, count, paused]);

  if (!count) return null;

  return (
    <div
      style={styles.wrap}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div style={styles.viewport}>
        <div style={{ ...styles.track, transform: `translateX(-${idx * 100}%)` }}>
          {slides.map((promo) => {
            const title = pick(promo, 'title', lang);
            const desc = pick(promo, 'description', lang);
            const badgeColor = promo.badge ? BADGE_COLORS[promo.badge] : null;
            return (
              <div key={promo._id} style={styles.slide}>
                {promo.imageUrl ? (
                  <img src={promo.imageUrl} alt={title} style={styles.img} />
                ) : (
                  <div
                    style={{
                      ...styles.placeholder,
                      background: promo.gradient || styles.placeholder.background,
                    }}
                  >
                    {promo.emoji || '🍣'}
                  </div>
                )}
                <div style={styles.overlay} />
                <div style={styles.content}>
                  {promo.badge && (
                    <span style={{ ...styles.badge, background: badgeColor }}>
                      {promo.badge}
                    </span>
                  )}
                  {title && <div style={styles.title}>{title}</div>}
                  {desc && <div style={styles.desc}>{desc}</div>}
                  {promo.discountPercent != null && (
                    <span style={styles.chip}>−{promo.discountPercent}%</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {count > 1 && (
        <>
          <button
            style={{ ...styles.arrow, left: 16 }}
            onClick={prev}
            aria-label="Previous"
          >
            ‹
          </button>
          <button
            style={{ ...styles.arrow, right: 16 }}
            onClick={next}
            aria-label="Next"
          >
            ›
          </button>

          <div style={styles.dots}>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                style={{
                  ...styles.dot,
                  ...(i === idx ? styles.dotActive : {}),
                }}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  wrap: {
    position: 'relative',
    width: '100%',
    borderRadius: 'var(--radius-xl)',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-sm)',
  },
  viewport: { width: '100%', overflow: 'hidden' },
  track: {
    display: 'flex',
    transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    willChange: 'transform',
  },
  slide: {
    position: 'relative',
    flex: '0 0 100%',
    width: '100%',
    aspectRatio: '3 / 1',
    minHeight: 200,
    background: 'var(--primary-light, #FDECEA)',
  },
  img: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  placeholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 80,
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(90deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0) 70%)',
  },
  content: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '60%',
    padding: '0 6%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 10,
  },
  badge: {
    alignSelf: 'flex-start',
    padding: '5px 12px',
    borderRadius: 999,
    color: '#fff',
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 1,
  },
  title: {
    color: '#fff',
    fontSize: 'clamp(20px, 3.2vw, 36px)',
    fontWeight: 900,
    lineHeight: 1.1,
    letterSpacing: -0.5,
    textShadow: '0 2px 8px rgba(0,0,0,0.4)',
  },
  desc: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 'clamp(13px, 1.5vw, 16px)',
    fontWeight: 500,
    lineHeight: 1.3,
    textShadow: '0 1px 4px rgba(0,0,0,0.4)',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  chip: {
    alignSelf: 'flex-start',
    background: 'var(--primary)',
    color: '#fff',
    fontWeight: 900,
    fontSize: 16,
    padding: '6px 16px',
    borderRadius: 999,
    marginTop: 4,
  },
  arrow: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(255,255,255,0.85)',
    color: '#0D0D0D',
    fontSize: 24,
    fontWeight: 700,
    lineHeight: 1,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    zIndex: 5,
    paddingBottom: 3,
  },
  dots: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'center',
    gap: 8,
    zIndex: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(255,255,255,0.55)',
    cursor: 'pointer',
    padding: 0,
    transition: 'width 0.3s ease, background 0.3s ease',
  },
  dotActive: {
    width: 24,
    borderRadius: 999,
    background: '#fff',
  },
};

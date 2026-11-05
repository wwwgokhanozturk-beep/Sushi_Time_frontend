import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import httpClient from '../api/httpClient';
import { pick } from '../utils/promo';
import PromoMedia from './PromoMedia';
import ReelsViewer from './ReelsViewer';

// Акции в виде «рилсов», как в Facebook: ряд вертикальных карточек, который
// листается вбок. Играет одна карточка — первая видная целиком или та, которой
// коснулись (палец, мышь); остальные стоят обложкой. Нажатие открывает ролики
// на весь экран (ReelsViewer).
export default function PromoReels() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'en').slice(0, 2);
  const [promos, setPromos] = useState([]);
  const [focus, setFocus] = useState(0);
  const [onScreen, setOnScreen] = useState(true);
  const [viewerAt, setViewerAt] = useState(null);
  const sectionRef = useRef(null);
  const railRef = useRef(null);
  const cardRefs = useRef([]);
  // Кто просит не анимировать — карточки стоят обложками, пока их не откроют.
  const [calm] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    httpClient
      .get('/promotions')
      .then((r) => setPromos((r.data?.data?.promotions || []).filter((p) => p.imageUrl)))
      .catch(() => {});
  }, []);

  // Ряд ушёл с экрана — ролик в нём не играет.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [promos.length]);

  // Ряд пролистали — играет первая карточка, видная целиком.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return undefined;
    let timer = 0;
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const left = rail.getBoundingClientRect().left;
        const i = cardRefs.current.findIndex((card) => card && card.getBoundingClientRect().left >= left - 1);
        if (i >= 0) setFocus(i);
      }, 120);
    };
    rail.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      rail.removeEventListener('scroll', onScroll);
      clearTimeout(timer);
    };
  }, [promos.length]);

  if (!promos.length) return null;

  return (
    <section ref={sectionRef} style={styles.section} aria-label={t('promotions')}>
      <h2 style={styles.title}>{t('promotions')}</h2>
      <div ref={railRef} className="no-scrollbar" style={styles.rail}>
        {promos.map((promo, i) => {
          const title = pick(promo, 'title', lang);
          return (
            <button
              key={promo._id}
              ref={(el) => (cardRefs.current[i] = el)}
              type="button"
              className="reel-card"
              style={styles.card}
              onPointerEnter={() => setFocus(i)}
              onTouchStart={() => setFocus(i)}
              onClick={() => setViewerAt(i)}
              aria-label={title || `${t('promotions')} ${i + 1}`}
            >
              <PromoMedia
                src={promo.imageUrl}
                mediaType={promo.mediaType}
                poster={promo.thumbUrl}
                active={!calm && onScreen && viewerAt === null && focus === i}
                style={styles.media}
              />
              <span style={styles.shade} aria-hidden="true" />
              <span style={styles.bottom}>
                {promo.mediaType === 'video' && (
                  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" style={styles.play}>
                    <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.4-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z" fill="currentColor" />
                  </svg>
                )}
                {title && <span style={styles.cardTitle}>{title}</span>}
              </span>
              {promo.promoCode && <span style={styles.code}>{promo.promoCode}</span>}
            </button>
          );
        })}
      </div>
      {viewerAt !== null && <ReelsViewer promos={promos} start={viewerAt} onClose={() => setViewerAt(null)} />}
    </section>
  );
}

// Ряд — от края до края экрана, а карточки начинаются по линии страницы.
const GUTTER = 'clamp(16px, 3vw, 40px)';

const styles = {
  section: { display: 'flex', flexDirection: 'column', gap: 10 },
  title: { fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.3 },
  rail: {
    display: 'flex',
    gap: 10,
    overflowX: 'auto',
    scrollSnapType: 'x proximity',
    margin: `0 calc(-1 * ${GUTTER})`,
    padding: `2px ${GUTTER} 6px`,
    scrollPaddingInline: GUTTER,
  },
  card: {
    position: 'relative',
    flex: '0 0 auto',
    width: 'clamp(128px, 36vw, 180px)',
    aspectRatio: '9 / 16',
    padding: 0,
    border: 'none',
    borderRadius: 16,
    overflow: 'hidden',
    background: '#1c1c1f',
    boxShadow: 'var(--shadow-sm)',
    scrollSnapAlign: 'start',
    cursor: 'pointer',
  },
  media: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  shade: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)',
    pointerEvents: 'none',
  },
  bottom: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    display: 'flex',
    alignItems: 'flex-end',
    gap: 6,
    color: '#fff',
    textAlign: 'left',
  },
  play: { flexShrink: 0, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' },
  cardTitle: {
    minWidth: 0,
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1.25,
    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  code: {
    position: 'absolute',
    top: 8,
    left: 8,
    padding: '3px 8px',
    borderRadius: 999,
    background: 'var(--primary)',
    color: '#fff',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 0.4,
  },
};

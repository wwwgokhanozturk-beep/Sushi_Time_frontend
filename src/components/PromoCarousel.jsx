import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import httpClient from '../api/httpClient';
import { BADGE_COLORS, pick } from '../utils/promo';
import PromoMedia from './PromoMedia';

const STORY_DURATION = 5000;

function fmtDate(str) {
  if (!str) return null;
  const d = new Date(str);
  if (isNaN(d)) return null;
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ─── Full-screen story viewer ──────────────────────────────────────────────
function StoryViewer({ promotions, startIndex, lang, onClose }) {
  const { t } = useTranslation();
  const [idx, setIdx] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(0);
  const pausedRef = useRef(false);

  const goNext = useCallback(() => {
    setIdx((p) => {
      if (p < promotions.length - 1) return p + 1;
      onClose();
      return p;
    });
  }, [promotions.length, onClose]);

  const goPrev = useCallback(() => {
    setIdx((p) => (p > 0 ? p - 1 : p));
  }, []);

  // Auto-advance animation for the current story
  useEffect(() => {
    setProgress(0);
    startRef.current = performance.now();
    const tick = (now) => {
      if (pausedRef.current) {
        startRef.current = now - progress * STORY_DURATION;
      } else {
        const elapsed = now - startRef.current;
        const ratio = Math.min(elapsed / STORY_DURATION, 1);
        setProgress(ratio);
        if (ratio >= 1) {
          goNext();
          return;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, onClose]);

  const promo = promotions[idx];
  if (!promo) return null;

  const title = pick(promo, 'title', lang);
  const desc = pick(promo, 'description', lang);
  const validTo = fmtDate(promo.validTo);
  const badgeColor = promo.badge ? BADGE_COLORS[promo.badge] : null;

  return (
    <div style={sv.overlay} onClick={onClose}>
      <div style={sv.stage} onClick={(e) => e.stopPropagation()}>
        {/* Background */}
        {promo.imageUrl ? (
          <PromoMedia src={promo.imageUrl} alt={title} style={sv.bg}
            scale={promo.imageScale} offsetX={promo.imageOffsetX} offsetY={promo.imageOffsetY} />
        ) : (
          <div style={{ ...sv.bg, ...sv.placeholder }}>🎉</div>
        )}
        <div style={sv.dim} />

        {/* Progress bars */}
        <div style={sv.progressRow}>
          {promotions.map((_, i) => (
            <div key={i} style={sv.track}>
              <div
                style={{
                  ...sv.fill,
                  width: i < idx ? '100%' : i === idx ? `${progress * 100}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Tap zones */}
        <div
          style={sv.tapLeft}
          onClick={goPrev}
          onMouseDown={() => (pausedRef.current = true)}
          onMouseUp={() => (pausedRef.current = false)}
        />
        <div
          style={sv.tapRight}
          onClick={goNext}
          onMouseDown={() => (pausedRef.current = true)}
          onMouseUp={() => (pausedRef.current = false)}
        />

        {/* Close + counter */}
        <button style={sv.closeBtn} onClick={onClose}>✕</button>
        <div style={sv.counter}>{idx + 1} / {promotions.length}</div>

        {/* Content */}
        <div style={sv.content}>
          {promo.badge && (
            <span style={{ ...sv.badge, background: badgeColor }}>{promo.badge}</span>
          )}
          {title && <div style={sv.title}>{title}</div>}
          {desc && <div style={sv.desc}>{desc}</div>}
          <div style={sv.metaRow}>
            {promo.discountPercent != null && (
              <span style={sv.chip}>−{promo.discountPercent}%</span>
            )}
            {promo.promoCode && (
              <span style={sv.code}>{t('promo_code')}: <strong>{promo.promoCode}</strong></span>
            )}
            {validTo && <span style={sv.validTo}>{t('valid_until')} {validTo}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Promotions section (stories bubbles) ──────────────────────────────────
export default function PromoCarousel() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'en').slice(0, 2);
  const [promos, setPromos] = useState([]);
  const [openIdx, setOpenIdx] = useState(null);
  const [seen, setSeen] = useState(new Set());

  useEffect(() => {
    httpClient.get('/promotions')
      .then((r) => setPromos(r.data?.data?.promotions || []))
      .catch(() => {});
  }, []);

  if (!promos.length) return null;

  const openAt = (i) => {
    setOpenIdx(i);
    setSeen((prev) => new Set([...prev, i]));
  };

  return (
    <div style={styles.wrap}>
      <h2 style={styles.heading}>{t('promotions')}</h2>

      <div className="no-scrollbar" style={styles.row}>
        {promos.map((promo, i) => {
          const label = pick(promo, 'title', lang);
          const isSeen = seen.has(i);
          return (
            <button key={promo._id} style={styles.bubble} onClick={() => openAt(i)}>
              <span style={{ ...styles.ring, ...(isSeen ? styles.ringSeen : {}) }}>
                <span style={styles.inner}>
                  {promo.imageUrl ? (
                    <PromoMedia src={promo.imageUrl} alt={label} style={styles.img}
                      scale={promo.imageScale} offsetX={promo.imageOffsetX} offsetY={promo.imageOffsetY} />
                  ) : (
                    <span style={styles.fallback}>🎉</span>
                  )}
                </span>
              </span>
              {label && (
                <span style={{ ...styles.label, ...(isSeen ? styles.labelSeen : {}) }}>
                  {label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {openIdx !== null && (
        <StoryViewer
          promotions={promos}
          startIndex={openIdx}
          lang={lang}
          onClose={() => setOpenIdx(null)}
        />
      )}
    </div>
  );
}

const styles = {
  wrap: { width: '100%', display: 'flex', flexDirection: 'column', gap: 12 },
  heading: { fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.3 },
  row: { display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 4 },
  bubble: {
    flexShrink: 0,
    width: 80,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  },
  ring: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    padding: 3,
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
    display: 'flex',
  },
  ringSeen: { background: 'var(--divider)' },
  inner: {
    flex: 1,
    borderRadius: '50%',
    border: '2px solid #fff',
    overflow: 'hidden',
    background: 'var(--background)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  img: { width: '100%', height: '100%', objectFit: 'cover' },
  fallback: { fontSize: 28 },
  label: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--text-primary)',
    textAlign: 'center',
    lineHeight: 1.3,
    maxWidth: 80,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  labelSeen: { color: 'var(--text-light)' },
};

const sv = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    background: 'rgba(0,0,0,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    position: 'relative',
    width: 'min(420px, 100vw)',
    height: 'min(740px, 100vh)',
    background: '#000',
    overflow: 'hidden',
    borderRadius: 'min(20px, 0px)',
  },
  bg: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' },
  placeholder: { display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 100, background: '#1a1a2e' },
  dim: { position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 45%, rgba(0,0,0,0.25) 100%)' },
  progressRow: { position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', gap: 4, zIndex: 10 },
  track: { flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.35)', overflow: 'hidden' },
  fill: { height: '100%', background: '#fff', borderRadius: 2, transition: 'width 0.05s linear' },
  tapLeft: { position: 'absolute', left: 0, top: 0, width: '35%', height: '100%', zIndex: 5, cursor: 'pointer' },
  tapRight: { position: 'absolute', right: 0, top: 0, width: '65%', height: '100%', zIndex: 5, cursor: 'pointer' },
  closeBtn: {
    position: 'absolute', top: 24, right: 16, width: 36, height: 36, borderRadius: '50%',
    background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: 16, fontWeight: 700, border: 'none',
    cursor: 'pointer', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  counter: { position: 'absolute', top: 30, left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, zIndex: 15 },
  content: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px', zIndex: 10 },
  badge: { display: 'inline-block', padding: '5px 12px', borderRadius: 999, color: '#fff', fontSize: 12, fontWeight: 900, letterSpacing: 1, marginBottom: 10 },
  title: { color: '#fff', fontSize: 26, fontWeight: 900, letterSpacing: -0.5, marginBottom: 8, textShadow: '0 1px 6px rgba(0,0,0,0.5)' },
  desc: { color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 1.4, marginBottom: 12, textShadow: '0 1px 4px rgba(0,0,0,0.5)' },
  metaRow: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  chip: { background: 'var(--primary)', color: '#fff', fontWeight: 900, fontSize: 15, padding: '6px 14px', borderRadius: 999 },
  code: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 600 },
  validTo: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 600 },
};

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isVideoUrl, pick } from '../utils/promo';
import useIsMobile from '../hooks/useIsMobile';

// Акции на весь экран, как рилсы: ролики идут друг под другом и листаются
// вверх-вниз (на компьютере — ещё колесом, стрелками и кнопками ▲▼). Играет
// тот, что на экране; нажатие на ролик ставит его на паузу. «Назад» в
// браузере и Esc закрывают просмотр.
export default function ReelsViewer({ promos, start, onClose }) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'en').slice(0, 2);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const scrollerRef = useRef(null);
  const slideRefs = useRef([]);
  const closeRef = useRef(null);
  const historyEntry = useRef(false);
  const [current, setCurrent] = useState(start);
  const [muted, setMuted] = useState(false);

  // Открывается сразу на нажатом ролике, без прокрутки через предыдущие.
  useLayoutEffect(() => {
    const slide = slideRefs.current[start];
    if (slide && scrollerRef.current) scrollerRef.current.scrollTop = slide.offsetTop;
    closeRef.current?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // На экране — ролик, видный больше чем наполовину.
  useEffect(() => {
    const root = scrollerRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) setCurrent(Number(e.target.dataset.index));
      });
    }, { root, threshold: 0.6 });
    slideRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [promos.length]);

  // «Назад» закрывает просмотр, а не уводит со страницы: пока он открыт, в
  // истории лежит копия текущей записи (как у окна «i»).
  useEffect(() => {
    window.history.pushState({ ...window.history.state, reels: true }, '');
    historyEntry.current = true;
    const onPop = () => {
      historyEntry.current = false;
      onClose();
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    if (historyEntry.current) {
      historyEntry.current = false;
      window.history.back();
    }
    onClose();
  };

  const go = (step) => {
    const next = slideRefs.current[current + step];
    if (next) scrollerRef.current.scrollTo({ top: next.offsetTop, behavior: 'smooth' });
  };

  // Меню встаёт на место записи просмотра в истории: «Назад» с него ведёт на главную.
  const toMenu = () => {
    historyEntry.current = false;
    onClose();
    navigate('/menu', { replace: true });
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        go(1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        go(-1);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  // Страница под просмотром не прокручивается (overflow — у <html>, как в окне «i»).
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = prev;
    };
  }, []);

  return createPortal(
    <div style={styles.overlay} role="dialog" aria-modal="true" aria-label={t('promotions')}>
      <div ref={scrollerRef} className="no-scrollbar" style={styles.scroller}>
        {promos.map((promo, i) => (
          <ReelSlide
            key={promo._id}
            promo={promo}
            index={i}
            slideRef={(el) => (slideRefs.current[i] = el)}
            active={i === current}
            near={Math.abs(i - current) <= 1}
            muted={muted}
            onMuted={setMuted}
            onMenu={toMenu}
            lang={lang}
            t={t}
          />
        ))}
      </div>
      <button ref={closeRef} type="button" style={{ ...styles.round, ...styles.close }} onClick={close} aria-label={t('close')}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
      {promos.length > 1 && <div style={styles.counter}>{current + 1} / {promos.length}</div>}
      {!isMobile && promos.length > 1 && (
        <div style={styles.nav}>
          <button type="button" style={styles.round} onClick={() => go(-1)} disabled={current === 0} aria-label="↑">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6" /></svg>
          </button>
          <button type="button" style={styles.round} onClick={() => go(1)} disabled={current === promos.length - 1} aria-label="↓">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
          </button>
        </div>
      )}
    </div>,
    document.body,
  );
}

// Есть ли у ролика звук — у беззвучного кнопка звука не нужна.
const hasAudio = (v) => Boolean(v.mozHasAudio || v.webkitAudioDecodedByteCount > 0 || v.audioTracks?.length > 0);

function ReelSlide({ promo, index, slideRef, active, near, muted, onMuted, onMenu, lang, t }) {
  const videoRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audio, setAudio] = useState(false);
  const [copied, setCopied] = useState(false);
  const isVideo = promo.mediaType === 'video' || (promo.mediaType !== 'image' && isVideoUrl(promo.imageUrl));
  const title = pick(promo, 'title', lang);
  const desc = pick(promo, 'description', lang);

  // На экране — с начала, со звуком, если браузер разрешит; ушёл с экрана — стоп.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (!active) {
      v.pause();
      return;
    }
    v.currentTime = 0;
    v.muted = muted;
    setPaused(false);
    v.play().catch(() => {
      // Звук без нажатия браузер не пускает — играем без звука, кнопка его включит.
      v.muted = true;
      onMuted(true);
      v.play().catch(() => setPaused(true));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setPaused(false);
    } else {
      v.pause();
      setPaused(true);
    }
  };

  const onTime = (e) => {
    const v = e.currentTarget;
    if (v.duration) setProgress(v.currentTime / v.duration);
    if (!audio && hasAudio(v)) setAudio(true);
  };

  const copyCode = () => {
    navigator.clipboard?.writeText(promo.promoCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };

  const backdrop = isVideo ? promo.thumbUrl : promo.imageUrl;

  return (
    <div ref={slideRef} data-index={index} style={styles.slide}>
      {/* Размытая обложка заполняет поля вокруг горизонтального ролика */}
      {backdrop && <div style={{ ...styles.backdrop, backgroundImage: `url("${backdrop}")` }} aria-hidden="true" />}
      {isVideo ? (
        <video
          ref={videoRef}
          src={promo.imageUrl}
          poster={promo.thumbUrl || undefined}
          style={styles.media}
          playsInline
          loop
          muted={muted}
          preload={near ? 'auto' : 'none'}
          onClick={togglePlay}
          onTimeUpdate={onTime}
        />
      ) : (
        <img src={promo.imageUrl} alt={title} style={styles.media} />
      )}

      {isVideo && paused && (
        <button type="button" style={styles.bigPlay} onClick={togglePlay} aria-label="▶">
          <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.4-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z" fill="currentColor" />
          </svg>
        </button>
      )}

      {isVideo && audio && (
        <button type="button" style={{ ...styles.round, ...styles.sound }} onClick={() => onMuted(!muted)} aria-label={muted ? '🔇' : '🔊'}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
            {muted ? <path d="M16 9.5l5 5M21 9.5l-5 5" /> : <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />}
          </svg>
        </button>
      )}

      <div style={styles.info}>
        {title && <div style={styles.title}>{title}</div>}
        {desc && <div style={styles.desc}>{desc}</div>}
        <div style={styles.actions}>
          {promo.promoCode && (
            <button type="button" style={styles.codeChip} onClick={copyCode}>
              {t('promo_code')}: <b style={styles.code}>{promo.promoCode}</b>
              <span aria-hidden="true">{copied ? '✓' : '⧉'}</span>
            </button>
          )}
          <button type="button" style={styles.cta} onClick={onMenu}>{t('browse_menu')}</button>
        </div>
      </div>

      {isVideo && (
        <div style={styles.track} aria-hidden="true">
          <div style={{ ...styles.bar, transform: `scaleX(${progress})` }} />
        </div>
      )}
    </div>
  );
}

const SAFE_TOP = 'calc(14px + env(safe-area-inset-top, 0px))';

const styles = {
  // Над корзиной, чатом и окном «i» (1500), под «мы закрыты» (2000).
  overlay: { position: 'fixed', inset: 0, zIndex: 1600, background: '#000' },
  scroller: { height: '100%', overflowY: 'auto', scrollSnapType: 'y mandatory', overscrollBehavior: 'contain' },
  slide: { position: 'relative', height: '100%', overflow: 'hidden', scrollSnapAlign: 'start', scrollSnapStop: 'always' },
  backdrop: {
    position: 'absolute',
    inset: 0,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'blur(28px) brightness(0.55)',
    transform: 'scale(1.2)',
  },
  media: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', display: 'block' },
  round: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(0,0,0,0.45)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  close: { position: 'absolute', top: SAFE_TOP, left: 14, zIndex: 2 },
  // Звук — внизу справа, как в рилсах; верх ролика остаётся открытым.
  sound: { position: 'absolute', right: 16, bottom: 'calc(26px + env(safe-area-inset-bottom, 0px))', zIndex: 2 },
  // Счётчик в углу, а не по центру: там у роликов обычно логотип.
  counter: {
    position: 'absolute',
    top: `calc(${SAFE_TOP} + 9px)`,
    right: 14,
    padding: '4px 10px',
    borderRadius: 999,
    background: 'rgba(0,0,0,0.35)',
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: 700,
    pointerEvents: 'none',
  },
  nav: { position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 10 },
  bigPlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 72,
    height: 72,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(0,0,0,0.45)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
    cursor: 'pointer',
  },
  info: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 'calc(26px + env(safe-area-inset-bottom, 0px))',
    maxWidth: 560,
    margin: '0 auto',
    padding: '0 68px 0 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    color: '#fff',
    pointerEvents: 'none',
  },
  title: { fontSize: 20, fontWeight: 800, lineHeight: 1.2, textShadow: '0 1px 6px rgba(0,0,0,0.5)' },
  desc: { fontSize: 14.5, lineHeight: 1.4, opacity: 0.92, textShadow: '0 1px 4px rgba(0,0,0,0.5)' },
  actions: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, pointerEvents: 'auto' },
  codeChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '9px 14px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.35)',
    background: 'rgba(255,255,255,0.14)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    color: '#fff',
    fontSize: 14,
    cursor: 'pointer',
  },
  code: { letterSpacing: 0.6 },
  cta: {
    padding: '11px 22px',
    borderRadius: 999,
    border: 'none',
    background: 'var(--primary)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(232,24,27,0.35)',
  },
  track: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, background: 'rgba(255,255,255,0.25)' },
  bar: { height: '100%', background: '#fff', transformOrigin: 'left', transition: 'transform 0.25s linear' },
};

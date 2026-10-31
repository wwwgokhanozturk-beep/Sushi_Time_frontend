import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '../store/cartStore';
import { useDishInfoStore, closeDishInfo } from '../store/dishInfoStore';
import useIsMobile from '../hooks/useIsMobile';
import { pickLang, pickLangArray } from '../utils/localized';
import { imageFrameStyle } from './SushiCard';
import { NutritionFacts, hasNutritionFacts, servingLabel } from './Nutrition';

const SHEET_IN = 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)';
const SHEET_OUT = 'transform 0.22s cubic-bezier(0.4, 0, 1, 1)';
// Окно уходит за 0.22 с — чуть дольше ждём, прежде чем убрать его со страницы.
const LEAVE_MS = 240;

// Окно «о блюде»: вес и штуки, состав, БЖУ и калории, «Подробнее» и «В корзину».
// Открывают его кнопки «i» на карточках меню (openDishInfo). На телефоне это
// шторка снизу, её можно смахнуть вниз; на компьютере — окно по центру.
// Закрывается крестиком, кликом по фону, Esc и кнопкой «Назад» браузера.
export default function DishInfoSheet() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const item = useDishInfoStore((s) => s.item);
  // shown держится, пока окно уезжает; entered — окно на месте (для анимации).
  const [shown, setShown] = useState(null);
  const [entered, setEntered] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const panelRef = useRef(null);
  const drag = useRef(null);
  const historyEntry = useRef(false);

  useEffect(() => {
    if (item) {
      setShown(item);
      setDragY(0);
      return undefined;
    }
    setEntered(false);
    const id = setTimeout(() => setShown(null), LEAVE_MS);
    return () => clearTimeout(id);
  }, [item]);

  // Окно уже в странице, но за краем экрана: фиксируем это положение, чтобы
  // сработал переход, и пускаем его на место.
  useLayoutEffect(() => {
    if (!shown || !item) return;
    panelRef.current.getBoundingClientRect();
    setEntered(true);
    panelRef.current.focus({ preventScroll: true });
  }, [shown, item]);

  // «Назад» в браузере (и жест «назад» на телефоне) закрывает окно, а не уводит
  // со страницы: пока окно открыто, в истории лежит копия текущей записи.
  useEffect(() => {
    if (!item) return undefined;
    window.history.pushState({ ...window.history.state, dishInfo: true }, '');
    historyEntry.current = true;
    const onPop = () => {
      historyEntry.current = false;
      closeDishInfo();
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [item]);

  const close = () => {
    if (historyEntry.current) {
      historyEntry.current = false;
      window.history.back();
    }
    closeDishInfo();
  };

  // Esc закрывает; Tab ходит по кнопкам окна и не уходит на страницу под ним.
  // После закрытия фокус возвращается на кнопку «i», с которой окно открыли.
  useEffect(() => {
    if (!item) return undefined;
    const { opener } = useDishInfoStore.getState();
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      const panel = panelRef.current;
      if (e.key !== 'Tab' || !panel) return;
      const buttons = panel.querySelectorAll('button:not([disabled])');
      if (!buttons.length) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panel || !panel.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !panel.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  // Пока окно на экране, страница под ним не прокручивается. Блокировать нужно
  // <html>: у него overflow-x: clip, поэтому overflow у <body> на прокрутку не влияет.
  const visible = !!shown;
  useEffect(() => {
    if (!visible) return undefined;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = prev;
    };
  }, [visible]);

  const addToCart = () => {
    useCartStore.getState().addToCart(shown);
    close();
  };

  // Страница блюда встаёт на место записи окна в истории: «Назад» с неё
  // вернёт в меню, а не в окно.
  const openDetails = () => {
    const replace = historyEntry.current;
    historyEntry.current = false;
    closeDishInfo();
    navigate(`/menu/${shown._id}`, { replace });
  };

  // Смахнуть шторку вниз за верхнюю часть (полоску и заголовок) — закрыть.
  const dragHandlers = {
    onPointerDown: (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      drag.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, samples: [], active: false };
    },
    onPointerMove: (e) => {
      const d = drag.current;
      if (!d || d.id !== e.pointerId) return;
      const dy = e.clientY - d.y0;
      if (!d.active) {
        // Тянуть начинаем, только когда палец явно пошёл вниз: тап по крестику остаётся тапом.
        if (dy <= 6 || dy <= Math.abs(e.clientX - d.x0)) return;
        d.active = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
      }
      // Скорость — по последним 100 мс: к концу взмаха палец замедляется, и
      // последний шажок её занижает.
      d.samples.push([e.timeStamp, e.clientY]);
      while (d.samples.length > 2 && e.timeStamp - d.samples[0][0] > 100) d.samples.shift();
      setDragY(Math.max(0, dy));
    },
    onPointerUp: (e) => {
      const d = drag.current;
      drag.current = null;
      if (!d?.active) return;
      setDragging(false);
      const [t0, y0] = d.samples[0];
      const [t1, y1] = d.samples[d.samples.length - 1];
      // Палец остановился и только потом отпустил — это не взмах.
      const speed = t1 > t0 && e.timeStamp - t1 < 100 ? (y1 - y0) / (t1 - t0) : 0;
      const dy = e.clientY - d.y0;
      // Дальше 110 px или взмахом вниз (быстрее 0,6 px/мс) — закрыть, иначе вернуть.
      if (dy > 110 || (dy > 30 && speed > 0.6)) close();
      else setDragY(0);
    },
    onPointerCancel: () => {
      drag.current = null;
      setDragging(false);
      setDragY(0);
    },
  };

  if (!shown) return null;

  const panelStyle = isMobile
    ? {
        ...styles.sheet,
        transform: entered ? `translateY(${dragY}px)` : 'translateY(100%)',
        transition: dragging ? 'none' : entered ? SHEET_IN : SHEET_OUT,
      }
    : { ...styles.dialog, opacity: entered ? 1 : 0, transform: entered ? 'none' : 'translateY(16px) scale(0.97)' };

  return createPortal(
    <div style={{ ...styles.overlay, ...(isMobile ? styles.overlayMobile : styles.overlayDesktop) }}>
      <div style={{ ...styles.backdrop, opacity: entered ? 1 : 0 }} onClick={close} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dish-info-title"
        tabIndex={-1}
        style={panelStyle}
      >
        <SheetContent
          item={shown}
          isMobile={isMobile}
          dragHandlers={isMobile ? dragHandlers : undefined}
          onClose={close}
          onMore={openDetails}
          onAdd={addToCart}
        />
      </div>
    </div>,
    document.body,
  );
}

function SheetContent({ item, isMobile, dragHandlers, onClose, onMore, onAdd }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const name = pickLang(item, 'name', lang);
  // Состав ресторан пишет в описании; если его нет — список ингредиентов.
  const blurb = pickLang(item, 'description', lang) || pickLangArray(item, 'ingredients', lang).join(', ');
  const serving = servingLabel(item, t, lang);
  const photo = item.thumbUrl || item.imageUrl;
  const facts = hasNutritionFacts(item);
  const hasDiscount = item.comparePrice && item.comparePrice > item.price;
  // Без состава блок идёт сразу под заголовком — без лишнего отступа сверху.
  const flush = blurb ? null : { marginTop: 4 };

  const moreButton = (
    <button
      type="button"
      className="dish-info__more"
      style={{ ...styles.moreBtn, ...(facts ? null : { ...styles.moreBtnAlone, ...flush }) }}
      onClick={onMore}
    >
      <span style={styles.moreText}>{t('more_about_dish')}</span>
      <span style={styles.moreChevron} aria-hidden="true">›</span>
    </button>
  );

  return (
    <>
      <div style={isMobile ? styles.topDraggable : styles.top} {...dragHandlers}>
        {isMobile && <div style={styles.handle} />}
        <div style={styles.header}>
          {photo && (
            <div style={styles.thumb}>
              <img src={photo} alt="" style={{ ...styles.thumbImg, ...imageFrameStyle(item) }} />
            </div>
          )}
          <div style={styles.headerText}>
            <h2 id="dish-info-title" style={styles.name}>{name}</h2>
            {serving && <div style={styles.serving}>{serving}</div>}
          </div>
          <button
            type="button"
            className="dish-info__close"
            style={styles.closeBtn}
            onClick={onClose}
            aria-label={t('close')}
          >
            ✕
          </button>
        </div>
      </div>

      <div style={styles.body}>
        {blurb && <p style={styles.blurb}>{blurb}</p>}
        {facts ? (
          <>
            <h3 style={{ ...styles.sectionTitle, ...flush }}>{t('about_dish')}</h3>
            <NutritionFacts item={item}>{moreButton}</NutritionFacts>
          </>
        ) : (
          moreButton
        )}
      </div>

      <div style={{ ...styles.footer, ...(isMobile ? styles.footerMobile : null) }}>
        {item.isAvailable !== false ? (
          <button type="button" className="dish-info__add" style={styles.addBtn} onClick={onAdd}>
            <span style={styles.addLabel}>{t('add_to_cart')}</span>
            <span style={styles.addPriceRow}>
              {hasDiscount && <span style={styles.addOldPrice}>{item.comparePrice} ₺</span>}
              <span style={styles.addPrice}>{item.price} ₺</span>
            </span>
          </button>
        ) : (
          <div style={{ ...styles.addBtn, ...styles.addBtnOff }}>{t('unavailable')}</div>
        )}
      </div>
    </>
  );
}

const styles = {
  // Над корзиной (198), чатом (200) и окном акций (1000), под «мы закрыты» (2000).
  overlay: { position: 'fixed', inset: 0, zIndex: 1500, display: 'flex' },
  overlayMobile: { flexDirection: 'column', justifyContent: 'flex-end' },
  overlayDesktop: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  backdrop: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', transition: 'opacity 0.25s ease' },
  sheet: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxHeight: '90%',
    background: '#fff',
    borderRadius: '28px 28px 0 0',
    boxShadow: '0 -6px 24px rgba(0,0,0,0.16)',
    outline: 'none',
  },
  dialog: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: 460,
    maxHeight: 'min(760px, 100%)',
    background: '#fff',
    borderRadius: 'var(--radius-xl)',
    boxShadow: '0 24px 60px rgba(0,0,0,0.28)',
    outline: 'none',
    transition: 'opacity 0.2s ease, transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
  },
  top: { paddingTop: 22 },
  // touch-action: none — иначе браузер заберёт движение пальца себе и шторка не поедет.
  topDraggable: { touchAction: 'none', userSelect: 'none' },
  handle: { width: 40, height: 5, borderRadius: 3, background: '#DADADF', margin: '8px auto 12px' },
  header: { display: 'flex', alignItems: 'center', gap: 14, padding: '0 20px' },
  thumb: {
    position: 'relative',
    width: 64,
    height: 64,
    flexShrink: 0,
    borderRadius: 16,
    overflow: 'hidden',
    background: 'var(--background)',
  },
  thumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
  headerText: { flex: 1, minWidth: 0 },
  name: { fontSize: 22, fontWeight: 800, lineHeight: 1.25, letterSpacing: -0.4, color: 'var(--text-primary)', overflowWrap: 'anywhere' },
  serving: { fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginTop: 3 },
  closeBtn: {
    alignSelf: 'flex-start',
    flexShrink: 0,
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: '#F2F2F5',
    color: 'var(--text-secondary)',
    fontSize: 14,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Окно по высоте содержимого; длинный состав прокручивается внутри.
  body: { flex: '0 1 auto', minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', padding: '14px 20px 8px' },
  blurb: { fontSize: 15, lineHeight: 1.45, color: 'var(--text-secondary)' },
  sectionTitle: { fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: '22px 0 10px' },
  moreBtn: {
    width: '100%',
    height: 48,
    marginTop: 16,
    padding: '0 16px',
    borderRadius: 'var(--radius-full)',
    background: '#fff',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  // Без пищевой ценности кнопка стоит сама по себе, а не в серой карточке.
  moreBtnAlone: { background: '#F4F4F6', marginTop: 18 },
  moreText: { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 15, fontWeight: 700 },
  moreChevron: { fontSize: 22, fontWeight: 600, lineHeight: 1, color: 'var(--text-light)', marginTop: -2 },
  footer: { padding: '12px 20px 20px' },
  footerMobile: { paddingBottom: 'max(16px, env(safe-area-inset-bottom, 0px))' },
  addBtn: {
    width: '100%',
    height: 56,
    padding: '0 24px',
    borderRadius: 'var(--radius-full)',
    background: 'var(--primary)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    boxShadow: 'var(--shadow-glow)',
  },
  addLabel: { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 16, fontWeight: 800 },
  addPriceRow: { display: 'flex', alignItems: 'baseline', gap: 8, flexShrink: 0 },
  addOldPrice: { fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)', textDecoration: 'line-through' },
  addPrice: { fontSize: 17, fontWeight: 900 },
  addBtnOff: { justifyContent: 'center', background: '#EEEEF1', color: 'var(--text-light)', boxShadow: 'none', fontSize: 16, fontWeight: 700 },
};

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import CategoryChip from './CategoryChip';
import useScrolledPastTop from '../hooks/useScrolledPastTop';

// Высота полосы категорий на телефоне, когда она прилипла к верху: одни
// названия, без фото.
export const COMPACT_BAR_PX = 52;

// Полоса категорий над списком меню (главная и «Меню»). На телефоне, как только
// она прилипает к верху, фото пропадают и остаются одни названия — место
// уходит под блюда; у самого верха страницы фото возвращаются.
// categories — ключи категорий по порядку; labelOf / imageOf — подпись и фото.
export default function StickyCategoryBar({ categories, activeCat, onPick, labelOf, imageOf, isMobile }) {
  const headerHidden = useScrolledPastTop() && isMobile;
  const sentinelRef = useRef(null);
  const barRef = useRef(null);
  const railRef = useRef(null);
  const chipRefs = useRef({});
  const expandedHeight = useRef(0);
  const [compact, setCompact] = useState(false);

  // Высота полосы с фото: компактная оставляет в потоке столько же (отступом
  // снизу), иначе список под ней прыгал бы вверх при каждом переключении.
  useLayoutEffect(() => {
    if (!compact && barRef.current) expandedHeight.current = barRef.current.offsetHeight;
  });

  // Компактная — когда полоса прилипла: её место в потоке (метка над ней) ушло
  // выше верха экрана.
  useEffect(() => {
    if (!isMobile) {
      setCompact(false);
      return undefined;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      if (sentinelRef.current) setCompact(sentinelRef.current.getBoundingClientRect().top < 0);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [isMobile]);

  // Активная категория — в середине полосы, в том числе после смены вида.
  useEffect(() => {
    const chip = chipRefs.current[activeCat];
    const rail = railRef.current;
    if (!chip || !rail) return;
    const chipRect = chip.getBoundingClientRect();
    const railRect = rail.getBoundingClientRect();
    rail.scrollBy({ left: chipRect.left - railRect.left - railRect.width / 2 + chipRect.width / 2, behavior: 'smooth' });
  }, [activeCat, compact]);

  const barStyle = {
    ...styles.bar,
    top: headerHidden ? 0 : 'var(--navbar-height)',
    ...(compact ? { ...styles.barCompact, marginBottom: Math.max(0, expandedHeight.current - COMPACT_BAR_PX) } : null),
  };

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" />
      <div ref={barRef} style={barStyle}>
        <div style={compact ? styles.innerCompact : styles.inner}>
          <div ref={railRef} className="no-scrollbar" style={compact ? styles.railCompact : styles.rail}>
            {categories.map((cat) => (
              <CategoryChip
                key={cat}
                cat={cat}
                label={labelOf(cat)}
                image={imageOf(cat)}
                isActive={activeCat === cat}
                onClick={() => onPick(cat)}
                chipRef={(el) => (chipRefs.current[cat] = el)}
                compact={compact}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  bar: { position: 'sticky', zIndex: 50, background: 'transparent', transition: 'top 0.25s ease' },
  // Как шапка: полупрозрачный белый с размытием — список под полосой не мешает названиям.
  barCompact: {
    height: COMPACT_BAR_PX,
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'saturate(180%) blur(12px)',
    WebkitBackdropFilter: 'saturate(180%) blur(12px)',
    borderBottom: '1px solid var(--divider)',
    boxShadow: 'var(--shadow-sm)',
  },
  inner: { maxWidth: '100%', margin: '0 auto', padding: '4px clamp(16px, 3vw, 40px)' },
  innerCompact: { height: '100%', display: 'flex', alignItems: 'center', padding: '0 16px' },
  rail: { display: 'flex', gap: 8, overflowX: 'auto', scrollBehavior: 'smooth', alignItems: 'center', padding: '8px 0' },
  railCompact: { display: 'flex', gap: 8, overflowX: 'auto', scrollBehavior: 'smooth', alignItems: 'center', width: '100%' },
};

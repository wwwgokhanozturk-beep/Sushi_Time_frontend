import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMenuStore } from '../store/menuStore';
import SushiCard from '../components/SushiCard';
import useIsMobile from '../hooks/useIsMobile';

const CATEGORY_KEYS = {
  rolls: 'cat_rolls', nigiri: 'cat_nigiri', sashimi: 'cat_sashimi',
  sets: 'cat_sets', tempura: 'cat_tempura', soups: 'cat_soups', drinks: 'cat_drinks',
  desserts: 'cat_desserts', salads: 'cat_salads', maki: 'cat_maki', uramaki: 'cat_uramaki',
  gunkan: 'cat_gunkan', wok: 'cat_wok', appetizers: 'cat_appetizers',
};

// Sets → Rolls / Sushi → Snacks → Drinks
const categoryPriority = (cat) => {
  const c = (cat || '').toLowerCase();
  if (c === 'sets') return 0;
  if (['rolls', 'maki', 'uramaki', 'hosomaki'].includes(c)) return 1;
  if (['nigiri', 'sashimi', 'gunkan', 'onigiri'].includes(c)) return 2;
  if (c === 'tempura') return 3;
  if (['appetizers', 'salads'].includes(c)) return 4;
  if (c === 'soups') return 5;
  if (['wok', 'noodles'].includes(c)) return 6;
  if (['pizza', 'fast_food'].includes(c)) return 7;
  if (c === 'desserts') return 8;
  if (c === 'drinks') return 9;
  return 10;
};

const NAVBAR_PX = 64;
const CHIPBAR_PX = 64;
const SCROLL_OFFSET = NAVBAR_PX + CHIPBAR_PX + 12;

export default function MenuPage() {
  const { t } = useTranslation();
  const { items, loading, loadMenu } = useMenuStore();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState(null);
  const gridStyle = { ...styles.grid, ...(isMobile ? styles.gridMobile : {}) };

  const sectionRefs = useRef({});
  const chipRefs = useRef({});
  const chipBarRef = useRef(null);
  const isClickScrollingRef = useRef(false);
  const clickScrollTimeoutRef = useRef(null);

  useEffect(() => { loadMenu(); }, []);

  // Group items by category in the desired priority order.
  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filteredItems = q
      ? items.filter(
          (i) =>
            i.name.toLowerCase().includes(q) ||
            i.category?.toLowerCase().includes(q),
        )
      : items;

    const map = new Map();
    for (const it of filteredItems) {
      const key = (it.category || 'other').toLowerCase();
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(it);
    }
    return [...map.entries()].sort(
      ([a], [b]) => categoryPriority(a) - categoryPriority(b),
    );
  }, [items, search]);

  useEffect(() => {
    if (!activeCat && grouped.length) setActiveCat(grouped[0][0]);
  }, [grouped, activeCat]);

  // Scroll-spy: pick the section whose top has just crossed the chip bar.
  useEffect(() => {
    const onScroll = () => {
      if (isClickScrollingRef.current) return;
      const threshold = NAVBAR_PX + CHIPBAR_PX + 24;
      let current = null;
      for (const [cat] of grouped) {
        const el = sectionRefs.current[cat];
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top - threshold <= 0) current = cat;
        else break;
      }
      if (current && current !== activeCat) setActiveCat(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [grouped, activeCat]);

  // Keep the active chip visible inside the horizontal scroll rail.
  useEffect(() => {
    const chip = chipRefs.current[activeCat];
    const bar = chipBarRef.current;
    if (!chip || !bar) return;
    const chipRect = chip.getBoundingClientRect();
    const barRect = bar.getBoundingClientRect();
    const offset =
      chipRect.left - barRect.left - barRect.width / 2 + chipRect.width / 2;
    bar.scrollBy({ left: offset, behavior: 'smooth' });
  }, [activeCat]);

  const scrollToCategory = (cat) => {
    const el = sectionRefs.current[cat];
    if (!el) return;
    setActiveCat(cat);
    isClickScrollingRef.current = true;
    const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
    window.scrollTo({ top, behavior: 'smooth' });
    clearTimeout(clickScrollTimeoutRef.current);
    clickScrollTimeoutRef.current = setTimeout(() => {
      isClickScrollingRef.current = false;
    }, 700);
  };

  const totalItems = grouped.reduce((n, [, list]) => n + list.length, 0);

  return (
    <div className="page-enter" style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>🍽️ {t('menu')}</h1>

        {/* Search */}
        <div style={styles.searchWrap}>
          <span>🔍</span>
          <input
            style={styles.searchInput}
            placeholder={t('search_menu')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button style={styles.clearSearch} onClick={() => setSearch('')}>✕</button>
          )}
        </div>
      </div>

      {/* Sticky category bar */}
      {!loading && grouped.length > 0 && (
        <div style={styles.stickyBar}>
          <div style={styles.stickyInner}>
            <div ref={chipBarRef} className="no-scrollbar" style={styles.catScroll}>
              {grouped.map(([cat]) => {
                const isActive = activeCat === cat;
                return (
                  <button
                    key={cat}
                    ref={(el) => (chipRefs.current[cat] = el)}
                    style={{
                      ...styles.catBtn,
                      ...(isActive ? styles.catBtnActive : {}),
                    }}
                    onClick={() => scrollToCategory(cat)}
                  >
                    {t(CATEGORY_KEYS[cat] || cat)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div style={styles.container}>
        {!loading && (
          <div style={styles.count}>
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </div>
        )}

        {loading ? (
          <div style={gridStyle}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 280, borderRadius: 20 }} />
            ))}
          </div>
        ) : grouped.length > 0 ? (
          grouped.map(([cat, list]) => (
            <section
              key={cat}
              ref={(el) => (sectionRefs.current[cat] = el)}
              style={styles.section}
            >
              <h2 style={styles.sectionTitle}>{t(CATEGORY_KEYS[cat] || cat)}</h2>
              <div style={gridStyle}>
                {list.map((item) => (
                  <SushiCard key={item._id} item={item} />
                ))}
              </div>
            </section>
          ))
        ) : (
          <div style={styles.empty}>
            <div style={{ fontSize: 48 }}>🔍</div>
            <div style={styles.emptyText}>{t('no_items_found')}</div>
            <div style={styles.emptySubtext}>{t('try_different')}</div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { flex: 1, paddingBottom: 80 },
  container: { maxWidth: '100%', margin: '0 auto', padding: '20px clamp(16px, 3vw, 40px)', display: 'flex', flexDirection: 'column', gap: 20, width: '100%' },
  title: { fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: -0.5 },
  searchWrap: {
    background: '#fff',
    borderRadius: 'var(--radius-full)',
    padding: '12px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--divider)',
    fontSize: 15,
    color: 'var(--text-light)',
  },
  searchInput: { flex: 1, border: 'none', outline: 'none', fontSize: 15, color: 'var(--text-primary)', background: 'transparent' },
  clearSearch: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', fontSize: 14, padding: 0 },
  stickyBar: {
    position: 'sticky',
    top: 'var(--navbar-height)',
    zIndex: 50,
    background: 'rgba(245,245,247,0.92)',
    backdropFilter: 'saturate(180%) blur(12px)',
    WebkitBackdropFilter: 'saturate(180%) blur(12px)',
    borderBottom: '1px solid var(--divider)',
  },
  stickyInner: { maxWidth: '100%', margin: '0 auto', padding: '12px clamp(16px, 3vw, 40px)' },
  catScroll: { display: 'flex', gap: 8, overflowX: 'auto', scrollBehavior: 'smooth' },
  catBtn: {
    flexShrink: 0,
    padding: '8px 16px',
    borderRadius: 'var(--radius-full)',
    fontSize: 13,
    fontWeight: 600,
    border: '1.5px solid var(--divider)',
    background: '#fff',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background 0.2s ease, color 0.2s ease, border-color 0.2s ease',
  },
  catBtnActive: { background: 'var(--primary)', color: '#fff', border: '1.5px solid var(--primary)' },
  count: { fontSize: 13, color: 'var(--text-light)', fontWeight: 500 },
  section: { display: 'flex', flexDirection: 'column', gap: 14, scrollMarginTop: 140 },
  sectionTitle: { fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.3 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 },
  gridMobile: { gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '60px 0' },
  emptyText: { fontSize: 18, fontWeight: 700 },
  emptySubtext: { fontSize: 14, color: 'var(--text-secondary)' },
};

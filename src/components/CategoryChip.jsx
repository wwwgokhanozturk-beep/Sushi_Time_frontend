import React from 'react';
import { categoryEmoji } from '../utils/categories';

/**
 * CategoryChip — большой круглый аватар категории с подписью снизу (как сторис).
 * Фото кадрируется scale/offset из админки; без фото — тематический эмодзи
 * на мягком фоне. Активная категория выделяется красным кольцом и подписью.
 *
 * compact — без фото, одно название-«таблетка»: так полоса прилипает к верху
 * на телефоне.
 *
 * props: cat, label, image {imageUrl,scale,offsetX,offsetY}, isActive, onClick, chipRef, compact
 */
export default function CategoryChip({ cat, label, image, isActive, onClick, chipRef, compact }) {
  if (compact) {
    return (
      <button
        ref={chipRef}
        onClick={onClick}
        title={label}
        aria-pressed={isActive}
        style={{ ...st.pill, ...(isActive ? st.pillActive : {}) }}
      >
        {label}
      </button>
    );
  }

  const hasPhoto = !!image?.imageUrl;
  const imgStyle = hasPhoto
    ? {
        ...st.img,
        transform: `translate(${image.offsetX || 0}%, ${image.offsetY || 0}%) scale(${image.scale || 1})`,
      }
    : st.img;

  return (
    <button ref={chipRef} onClick={onClick} title={label} style={st.btn}>
      <span style={{ ...st.ring, ...(isActive ? st.ringActive : {}) }}>
        <span style={st.circle}>
          {hasPhoto ? (
            // Кружок ~70 px — хватает лёгкой копии; уступает очередь фото меню.
            <img
              src={image.thumbUrl || image.imageUrl}
              alt=""
              draggable={false}
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              style={imgStyle}
            />
          ) : (
            <span style={st.emoji}>{categoryEmoji(cat)}</span>
          )}
        </span>
      </span>
      <span style={{ ...st.label, ...(isActive ? st.labelActive : {}) }}>{label}</span>
    </button>
  );
}

const RING = 74; // диаметр внешнего кольца (px) — крупный круг-аватар

const st = {
  btn: {
    flexShrink: 0,
    width: 88,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 7,
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
  },
  ring: {
    width: RING,
    height: RING,
    borderRadius: '50%',
    padding: 3,
    display: 'flex',
    background: 'var(--divider)',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
    transition: 'background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
  },
  ringActive: {
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary, #FF6B35) 100%)',
    boxShadow: '0 3px 10px rgba(232,24,27,0.30)',
  },
  circle: {
    flex: 1,
    borderRadius: '50%',
    overflow: 'hidden',
    border: '2px solid #fff',
    background: 'var(--primary-light, #FDECEA)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  img: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transformOrigin: 'center',
    pointerEvents: 'none',
  },
  emoji: { fontSize: 34, lineHeight: 1 },
  label: {
    fontSize: 12.5,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textAlign: 'center',
    lineHeight: 1.2,
    maxWidth: 88,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    transition: 'color 0.2s ease',
  },
  labelActive: { color: 'var(--primary)', fontWeight: 800 },
  pill: {
    flexShrink: 0,
    height: 34,
    padding: '0 14px',
    borderRadius: 'var(--radius-full)',
    // Без сокращения border: у активной меняется только цвет рамки, а смесь
    // border и borderColor React при перерисовке сбрасывает.
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'var(--divider)',
    background: '#fff',
    color: 'var(--text-secondary)',
    fontSize: 13.5,
    fontWeight: 700,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    transition: 'background 0.2s ease, color 0.2s ease, border-color 0.2s ease',
  },
  pillActive: { background: 'var(--primary)', borderColor: 'var(--primary)', color: '#fff' },
};

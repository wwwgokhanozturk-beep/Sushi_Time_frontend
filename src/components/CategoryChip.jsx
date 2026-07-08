import React from 'react';
import { categoryEmoji } from '../utils/categories';

/**
 * CategoryChip — большой круглый аватар категории с подписью снизу (как сторис).
 * Фото кадрируется scale/offset из админки; без фото — тематический эмодзи
 * на мягком фоне. Активная категория выделяется красным кольцом и подписью.
 *
 * props: cat, label, image {imageUrl,scale,offsetX,offsetY}, isActive, onClick, chipRef
 */
export default function CategoryChip({ cat, label, image, isActive, onClick, chipRef }) {
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
            <img src={image.imageUrl} alt="" draggable={false} style={imgStyle} />
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
    boxShadow: '0 4px 14px rgba(232,24,27,0.32)',
    transform: 'scale(1.05)',
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
};

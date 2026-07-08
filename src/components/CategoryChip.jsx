import React from 'react';
import { categoryEmoji } from '../utils/categories';

/**
 * CategoryChip — pill in the sticky category bar: a round photo thumbnail
 * (framed with the admin's scale/offset) + label. Falls back to a themed
 * emoji in a gradient circle until a photo is uploaded in the admin panel.
 *
 * props: cat, label, image {imageUrl,scale,offsetX,offsetY}, isActive, onClick, chipRef
 */
export default function CategoryChip({ cat, label, image, isActive, onClick, chipRef }) {
  const hasPhoto = !!image?.imageUrl;
  const framed = hasPhoto
    ? {
        ...st.thumbImg,
        transform: `translate(${image.offsetX || 0}%, ${image.offsetY || 0}%) scale(${image.scale || 1})`,
      }
    : st.thumbImg;

  return (
    <button
      ref={chipRef}
      onClick={onClick}
      style={{ ...st.chip, ...(isActive ? st.chipActive : {}) }}
    >
      <span style={{ ...st.thumb, ...(isActive ? st.thumbActive : {}) }}>
        {hasPhoto ? (
          <img src={image.imageUrl} alt="" draggable={false} style={framed} />
        ) : (
          <span style={st.emoji}>{categoryEmoji(cat)}</span>
        )}
      </span>
      <span style={st.label}>{label}</span>
    </button>
  );
}

const st = {
  chip: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '5px 14px 5px 5px',
    borderRadius: 'var(--radius-full)',
    fontSize: 13,
    fontWeight: 600,
    border: '1.5px solid var(--divider)',
    background: '#fff',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background 0.2s ease, color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
  },
  chipActive: {
    background: 'var(--primary)',
    color: '#fff',
    border: '1.5px solid var(--primary)',
    boxShadow: '0 4px 12px rgba(232,24,27,0.28)',
  },
  thumb: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary, #FF6B35) 100%)',
    border: '2px solid #fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
  },
  thumbActive: {
    border: '2px solid rgba(255,255,255,0.9)',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transformOrigin: 'center',
    pointerEvents: 'none',
  },
  emoji: {
    fontSize: 16,
    lineHeight: 1,
  },
  label: { lineHeight: 1 },
};

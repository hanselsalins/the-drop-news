/**
 * Band-aware utility functions for The Drop — Design System B.
 */

// Category colors — shared across bands 1-3, band 4 uses gold-tinted variants
const CATEGORY_COLORS_DEFAULT = {
  world: '#3B82F6',
  science: '#10B981',
  sports: '#F97316',
  tech: '#8B5CF6',
  environment: '#14B8A6',
  'weird & wonderful': '#F59E0B',
  weird: '#F59E0B',
  entertainment: '#EC4899',
  money: '#F59E0B',
  history: '#F97316',
  local: '#14B8A6',
  power: '#EF4444',
};

// Band 4 (editorial) uses warm gold-adjacent category accents
const CATEGORY_COLORS_EDITORIAL = {
  world: '#C9A84C',
  science: '#6EE7B7',
  sports: '#F59E0B',
  tech: '#A78BFA',
  environment: '#34D399',
  'weird & wonderful': '#E8D5A3',
  weird: '#E8D5A3',
  entertainment: '#F9A8D4',
  money: '#C9A84C',
  history: '#D4B896',
  local: '#6EE7B7',
  power: '#F43F5E',
};

// Band 3 (sharp-aware) uses rose/indigo-tinted category accents
const CATEGORY_COLORS_SHARP = {
  world: '#60A5FA',
  science: '#34D399',
  sports: '#FB923C',
  tech: '#A78BFA',
  environment: '#2DD4BF',
  'weird & wonderful': '#FBBF24',
  weird: '#FBBF24',
  entertainment: '#F472B6',
  money: '#FBBF24',
  history: '#FB923C',
  local: '#2DD4BF',
  power: '#F43F5E',
};

export function getCategoryColor(category, band) {
  const map = band === 'editorial'
    ? CATEGORY_COLORS_EDITORIAL
    : band === 'sharp-aware'
      ? CATEGORY_COLORS_SHARP
      : CATEGORY_COLORS_DEFAULT;
  return map[category] || map.world;
}

export const CATEGORY_EMOJI = {
  world: '🌍',
  science: '🔬',
  sports: '⚽',
  tech: '💻',
  environment: '🌱',
  'weird & wonderful': '🦄',
  weird: '🦄',
  entertainment: '🎬',
  money: '💰',
  history: '📜',
  local: '📍',
  power: '⚡',
};

export const CATEGORY_LABELS = {
  world: 'World',
  science: 'Science',
  sports: 'Sports',
  tech: 'Tech',
  environment: 'Environment',
  'weird & wonderful': 'Weird & Wonderful',
  weird: 'Weird & Wonderful',
  entertainment: 'Entertainment',
  money: 'Money',
  history: 'History',
  local: 'Local',
  power: 'Power',
};

/**
 * Returns band-appropriate card style object (Design System B)
 */
export function getCardStyle(band, catColor) {
  switch (band) {
    case 'big-bold-bright':
      return {
        borderRadius: 32,
        background: 'var(--drop-surface)',
        border: '3px solid var(--drop-border)',
        borderTop: catColor ? `4px solid ${catColor}` : '4px solid var(--drop-border)',
        boxShadow: 'var(--drop-shadow-card)',
      };
    case 'cool-connected':
      return {
        borderRadius: 20,
        background: 'var(--drop-surface)',
        border: '1px solid var(--drop-border)',
        borderTop: catColor ? `3px solid ${catColor}` : undefined,
        boxShadow: 'var(--drop-shadow-card)',
      };
    case 'sharp-aware':
      return {
        borderRadius: 10,
        background: 'var(--drop-surface)',
        border: '1px solid var(--drop-border-solid, #2E2E3C)',
        borderLeft: catColor ? `3px solid ${catColor}` : undefined,
        boxShadow: 'var(--drop-shadow-card)',
      };
    case 'editorial':
      return {
        borderRadius: 12,
        background: 'var(--drop-surface)',
        border: '1px solid var(--drop-border)',
        borderTop: catColor ? `2px solid ${catColor}` : undefined,
        boxShadow: 'var(--drop-shadow-card)',
      };
    default:
      return {
        borderRadius: 18,
        background: '#FFFFFF',
        border: '1.5px solid #E2E8F0',
      };
  }
}

/**
 * Returns band-appropriate button style object (Design System B)
 */
export function getButtonStyle(band, variant = 'primary') {
  const base = {
    fontFamily: 'var(--drop-font-heading)',
    fontWeight: 700,
    borderRadius: 'var(--drop-radius-btn)',
    minHeight: 'var(--drop-min-touch)',
  };

  switch (band) {
    case 'big-bold-bright':
      return {
        ...base,
        background: 'var(--drop-primary)',
        color: '#FFFFFF',
        border: '3px solid var(--drop-primary)',
        boxShadow: 'var(--drop-shadow-btn)',
      };
    case 'cool-connected':
      return {
        ...base,
        background: 'var(--drop-primary)',
        color: '#FFFFFF',
        border: 'none',
        boxShadow: 'var(--drop-shadow-btn)',
      };
    case 'sharp-aware':
      return {
        ...base,
        fontFamily: 'var(--drop-font-heading)',
        background: 'var(--drop-primary)',
        color: '#FFFFFF',
        border: 'none',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        boxShadow: 'var(--drop-shadow-btn)',
      };
    case 'editorial':
      return {
        ...base,
        background: 'var(--drop-accent)',
        color: '#111118',
        border: 'none',
      };
    default:
      return base;
  }
}

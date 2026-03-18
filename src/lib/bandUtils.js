/**
 * Band-aware utility functions for The Drop design system.
 * Components use these to get the correct colors/fonts per band.
 */

// Category colors per band (editorial band overrides defaults)
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

const CATEGORY_COLORS_EDITORIAL = {
  world: '#00D4FF',
  science: '#39FF85',
  sports: '#FF9500',
  tech: '#A78BFA',
  environment: '#10B981',
  'weird & wonderful': '#F59E0B',
  weird: '#F59E0B',
  entertainment: '#EC4899',
  money: '#00D4AA',
  history: '#F97316',
  local: '#14B8A6',
  power: '#FF2D78',
};

export function getCategoryColor(category, band) {
  const map = band === 'editorial' ? CATEGORY_COLORS_EDITORIAL : CATEGORY_COLORS_DEFAULT;
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
 * Returns band-appropriate card style object
 */
export function getCardStyle(band, catColor) {
  switch (band) {
    case 'big-bold-bright':
      return {
        borderRadius: 28,
        background: 'var(--drop-surface)',
        border: 'none',
        borderTop: catColor ? `3px solid ${catColor}` : '3px solid var(--drop-border)',
        boxShadow: 'var(--drop-shadow-card)',
      };
    case 'cool-connected':
      return {
        borderRadius: 22,
        background: 'var(--drop-surface)',
        border: '1px solid var(--drop-border)',
        borderTop: catColor ? `3px solid ${catColor}` : undefined,
        boxShadow: 'var(--drop-shadow-card)',
      };
    case 'sharp-aware':
      return {
        borderRadius: 8,
        background: 'var(--drop-surface)',
        border: '1px solid var(--drop-border)',
        borderLeft: catColor ? `3px solid ${catColor}` : undefined,
        boxShadow: 'var(--drop-shadow-card)',
      };
    case 'editorial':
      return {
        borderRadius: 14,
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
 * Returns band-appropriate button style object
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
        background: 'var(--drop-accent)',
        color: '#FFFFFF',
        border: 'none',
        boxShadow: 'var(--drop-shadow-btn)',
      };
    case 'sharp-aware':
      return {
        ...base,
        background: 'var(--drop-primary)',
        color: '#FFFFFF',
        border: 'none',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      };
    case 'editorial':
      return {
        ...base,
        background: 'var(--drop-accent)',
        color: '#1A1A2E',
        border: 'none',
      };
    default:
      return base;
  }
}

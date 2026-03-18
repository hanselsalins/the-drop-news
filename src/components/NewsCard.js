import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { getCategoryColor, CATEGORY_EMOJI, CATEGORY_LABELS, getCardStyle } from '../lib/bandUtils';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { medium } from '../lib/haptic';

const CATEGORY_GRADIENTS = {
  world: 'linear-gradient(135deg, #60A5FA, #2563EB)',
  science: 'linear-gradient(135deg, #34D399, #059669)',
  sports: 'linear-gradient(135deg, #FB923C, #EA580C)',
  tech: 'linear-gradient(135deg, #A78BFA, #7C3AED)',
  environment: 'linear-gradient(135deg, #2DD4BF, #0D9488)',
  'weird & wonderful': 'linear-gradient(135deg, #FBBF24, #D97706)',
  weird: 'linear-gradient(135deg, #FBBF24, #D97706)',
  entertainment: 'linear-gradient(135deg, #F472B6, #DB2777)',
  money: 'linear-gradient(135deg, #FBBF24, #D97706)',
  history: 'linear-gradient(135deg, #FB923C, #EA580C)',
  local: 'linear-gradient(135deg, #2DD4BF, #0D9488)',
  power: 'linear-gradient(135deg, #F87171, #DC2626)',
};

export const NewsCard = ({ article }) => {
  const navigate = useNavigate();
  const { band } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const rw = article.rewrite || {};
  const title = rw.title || article.original_title || 'Untitled';
  const catColor = getCategoryColor(article.category, band);
  const gradient = CATEGORY_GRADIENTS[article.category] || CATEGORY_GRADIENTS.world;
  const emoji = CATEGORY_EMOJI[article.category] || '📰';
  const cardStyle = getCardStyle(band, catColor);
  const imageUrl = article.image_url;

  const isDark = band === 'sharp-aware' || band === 'editorial';

  // Band 1: bouncy clay press, Band 2: squishy spring
  const getWhileTap = () => {
    if (prefersReducedMotion) return undefined;
    if (band === 'big-bold-bright') return { scale: 0.95, y: 2 };
    if (band === 'cool-connected') return { scale: 0.95, scaleY: 0.92 };
    return { scale: 0.98 };
  };

  const getTransition = () => {
    if (band === 'big-bold-bright') return { type: 'spring', stiffness: 300, damping: 12 };
    if (band === 'cool-connected') return { type: 'spring', stiffness: 400, damping: 15 };
    return undefined;
  };

  const handleClick = () => {
    medium();
    navigate(`/article/${article.id}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  // Band 3 (sharp-aware): no emoji in UI chrome, category as uppercase + coloured dot
  // Band 4 (editorial): uppercase + coloured dot, Inter 500, 0.1em tracking
  const renderCategoryLabel = () => {
    if (band === 'sharp-aware') {
      return (
        <>
          <span
            className="inline-block shrink-0"
            style={{ width: 6, height: 6, borderRadius: '50%', background: catColor }}
          />
          <span
            className="text-[10px] font-semibold tracking-[0.06em] uppercase"
            style={{ fontFamily: 'var(--drop-font-heading)', color: catColor }}
          >
            {CATEGORY_LABELS[article.category] || article.category}
          </span>
        </>
      );
    }
    if (band === 'editorial') {
      return (
        <>
          <span
            className="inline-block shrink-0"
            style={{ width: 5, height: 5, borderRadius: '50%', background: catColor }}
          />
          <span
            className="text-[10px] font-medium"
            style={{
              fontFamily: 'var(--drop-font-body)',
              color: catColor,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            {CATEGORY_LABELS[article.category] || article.category}
          </span>
        </>
      );
    }
    return (
      <>
        <span
          className="inline-block shrink-0"
          style={{ width: 6, height: 6, borderRadius: '50%', background: catColor }}
        />
        <span
          className="text-[10px] font-bold tracking-wider uppercase"
          style={{ fontFamily: 'var(--drop-font-body)', color: catColor }}
        >
          {CATEGORY_LABELS[article.category] || article.category}
        </span>
      </>
    );
  };

  const renderReadingTime = () => {
    if (!rw?.reading_time) return null;
    if (band === 'big-bold-bright') {
      return (
        <span style={{ fontFamily: 'var(--drop-font-body)', color: 'var(--drop-text-muted)', fontSize: 12, fontWeight: 600 }}>
          ⏱ {rw.reading_time}
        </span>
      );
    }
    return (
      <span style={{ fontFamily: 'var(--drop-font-body)', color: 'var(--drop-text-muted)', fontSize: 11 }}>
        · {rw.reading_time}
      </span>
    );
  };

  return (
    <motion.article
      data-testid={`news-card-${article.id}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={title}
      whileTap={getWhileTap()}
      transition={getTransition()}
      className="w-full overflow-hidden cursor-pointer flex"
      style={cardStyle}
    >
      {/* Left content */}
      <div className="flex-1 flex flex-col justify-center" style={{ padding: '13px 12px 13px 14px' }}>
        {/* Category */}
        <div className="flex items-center gap-1.5 mb-2">
          {renderCategoryLabel()}
        </div>

        {/* Headline */}
        <h3
          className="font-bold leading-snug mb-2 line-clamp-3"
          style={{
            fontFamily: 'var(--drop-font-heading)',
            color: 'var(--drop-text)',
            fontSize: band === 'big-bold-bright' ? 16 : band === 'editorial' ? 15 : 14,
            lineHeight: 1.35,
            fontWeight: band === 'editorial' ? 600 : 700,
            fontStyle: band === 'editorial' ? 'normal' : undefined,
            letterSpacing: band === 'sharp-aware' ? '-0.03em' : band === 'editorial' ? '-0.02em' : undefined,
          }}
        >
          {title}
        </h3>

        {/* Source row */}
        <div className="flex items-center gap-1.5">
          <span style={{ fontFamily: 'var(--drop-font-body)', color: 'var(--drop-text-muted)', fontSize: 11 }}>
            {article.source}
          </span>
          {renderReadingTime()}
        </div>
      </div>

      {/* Right thumbnail — hidden for sharp-aware (no emoji in chrome) */}
      {band !== 'sharp-aware' && (
        <div
          className="flex items-center justify-center shrink-0 relative overflow-hidden"
          style={{
            width: 90,
            background: gradient,
            borderRadius: `0 ${cardStyle.borderRadius}px ${cardStyle.borderRadius}px 0`,
          }}
        >
          <span aria-hidden="true" style={{ fontSize: 40, position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{emoji}</span>
          {imageUrl && (
            <img
              src={imageUrl}
              alt=""
              loading="lazy"
              onError={(e) => { e.target.style.display = 'none'; }}
              style={{ position: 'absolute', inset: 0, objectFit: 'cover', width: '100%', height: '100%' }}
            />
          )}
        </div>
      )}
    </motion.article>
  );
};

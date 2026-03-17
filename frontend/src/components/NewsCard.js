import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { getCategoryColor, CATEGORY_EMOJI, CATEGORY_LABELS, getCardStyle } from '../lib/bandUtils';

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
  const rw = article.rewrite || {};
  const title = rw.title || article.original_title || 'Untitled';
  const catColor = getCategoryColor(article.category, band);
  const gradient = CATEGORY_GRADIENTS[article.category] || CATEGORY_GRADIENTS.world;
  const emoji = CATEGORY_EMOJI[article.category] || '📰';
  const cardStyle = getCardStyle(band, catColor);

  const isDark = band === 'sharp-aware' || band === 'editorial';

  // Band 3 (sharp-aware): no emoji in UI chrome, category as ALL CAPS dot separator
  const renderCategoryLabel = () => {
    if (band === 'sharp-aware') {
      return (
        <span
          className="text-[10px] font-semibold tracking-[0.08em] uppercase"
          style={{ fontFamily: 'var(--drop-font-heading)', color: catColor, letterSpacing: '0.08em' }}
        >
          {CATEGORY_LABELS[article.category] || article.category}
        </span>
      );
    }
    if (band === 'editorial') {
      return (
        <span
          className="text-[10px] font-semibold tracking-[0.08em] uppercase"
          style={{ fontFamily: 'var(--drop-font-heading)', color: catColor, letterSpacing: '0.08em' }}
        >
          {CATEGORY_LABELS[article.category] || article.category}
        </span>
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

  // Band 1: reading time as "⏱ X minutes"
  const renderReadingTime = () => {
    if (!rw?.reading_time) return null;
    if (band === 'big-bold-bright') {
      return (
        <span style={{ fontFamily: 'var(--drop-font-body)', color: 'var(--drop-text-muted)', fontSize: 12 }}>
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
    <motion.div
      data-testid={`news-card-${article.id}`}
      onClick={() => navigate(`/article/${article.id}`)}
      role="button"
      tabIndex={0}
      whileTap={{ scale: 0.98 }}
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
            fontSize: band === 'big-bold-bright' ? 16 : 14,
            lineHeight: 1.35,
            fontWeight: 700,
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

      {/* Right emoji thumbnail — hidden for sharp-aware (no emoji in chrome) */}
      {band !== 'sharp-aware' && (
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: 90,
            background: gradient,
            borderRadius: `0 ${cardStyle.borderRadius}px ${cardStyle.borderRadius}px 0`,
          }}
        >
          <span style={{ fontSize: 40 }}>{emoji}</span>
        </div>
      )}
    </motion.div>
  );
};

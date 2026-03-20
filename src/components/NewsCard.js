import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { CATEGORY_LABELS } from '../lib/bandUtils';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { medium } from '../lib/haptic';

export const NewsCard = ({ article }) => {
  const navigate = useNavigate();
  const { band } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const rw = article.rewrite || {};
  const title = rw.title || article.original_title || 'Untitled';
  const summary = rw.summary || rw.opening_line || article.description || '';
  const imageUrl = article.image_url;

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

  const getWhileTap = () => {
    if (prefersReducedMotion) return undefined;
    return { scale: 0.98 };
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
      className="w-full cursor-pointer flex"
      style={{
        height: 134,
        background: '#FFFFFF',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        padding: 0,
      }}
    >
      {/* Left image */}
      <div
        className="shrink-0 flex items-center justify-center"
        style={{ padding: 12 }}
      >
        <div
          style={{
            width: 110,
            height: 110,
            borderRadius: 8,
            background: '#D9D9D9',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {imageUrl && (
            <img
              src={imageUrl}
              alt=""
              loading="lazy"
              onError={(e) => { e.target.style.display = 'none'; }}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}
        </div>
      </div>

      {/* Right text column */}
      <div
        className="flex-1 flex flex-col justify-center min-w-0"
        style={{ padding: '12px 12px 12px 0' }}
      >
        {/* Category */}
        <span
          style={{
            fontSize: 11,
            textTransform: 'uppercase',
            color: '#E18B3D',
            fontWeight: 600,
            lineHeight: 1.2,
            marginBottom: 4,
          }}
        >
          {CATEGORY_LABELS[article.category] || article.category}
        </span>

        {/* Headline */}
        <h3
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: '#2E3746',
            lineHeight: 1.3,
            marginBottom: 4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </h3>

        {/* Summary */}
        {summary && (
          <p
            style={{
              fontSize: 13,
              color: '#5A6981',
              lineHeight: 1.4,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              margin: 0,
            }}
          >
            {summary}
          </p>
        )}
      </div>
    </motion.article>
  );
};

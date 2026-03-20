import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CATEGORY_LABELS } from '../lib/bandUtils';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { medium } from '../lib/haptic';

// List card variant (vertical feed)
export const NewsCard = ({ article }) => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const rw = article.rewrite || {};
  const title = rw.title || article.original_title || 'Untitled';
  const imageUrl = article.image_url;
  const timeAgo = article.published_at
    ? getTimeAgo(article.published_at)
    : '';

  const handleClick = () => {
    medium();
    navigate(`/article/${article.id}`);
  };

  return (
    <motion.article
      data-testid={`news-card-${article.id}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
      className="w-full cursor-pointer flex"
      style={{
        height: 113,
        background: '#1B202F',
        borderRadius: 14,
        overflow: 'hidden',
      }}
    >
      {/* Left image */}
      <div className="shrink-0 flex items-center justify-center" style={{ padding: 12 }}>
        <div style={{
          width: 100,
          height: 89,
          borderRadius: 10,
          background: '#252A3A',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
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
      <div className="flex-1 flex flex-col justify-center min-w-0" style={{ padding: '12px 12px 12px 0' }}>
        {/* Category + timestamp row */}
        <div className="flex items-center gap-2 mb-1">
          <span
            style={{
              fontSize: 11,
              fontWeight: 400,
              color: '#FFFFFF',
              fontFamily: "'Inter', sans-serif",
              background: '#151924',
              borderRadius: 6,
              padding: '2px 6px',
            }}
          >
            {CATEGORY_LABELS[article.category] || article.category}
          </span>
          {timeAgo && (
            <span style={{ fontSize: 11, fontWeight: 400, color: '#A2A2A2', fontFamily: "'Inter', sans-serif" }}>
              {timeAgo}
            </span>
          )}
        </div>

        {/* Headline */}
        <h3
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#FFFFFF',
            fontFamily: "'Inter', sans-serif",
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            margin: 0,
          }}
        >
          {title}
        </h3>
      </div>
    </motion.article>
  );
};

// Hero card variant (horizontal scroll)
export const HeroNewsCard = ({ article }) => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const rw = article.rewrite || {};
  const title = rw.title || article.original_title || 'Untitled';
  const imageUrl = article.image_url;
  const timeAgo = article.published_at ? getTimeAgo(article.published_at) : '';

  const handleClick = () => {
    medium();
    navigate(`/article/${article.id}`);
  };

  return (
    <motion.article
      data-testid={`hero-card-${article.id}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
      className="shrink-0 cursor-pointer relative overflow-hidden"
      style={{
        width: 252,
        height: 272,
        background: '#1B202F',
        borderRadius: 18,
      }}
    >
      {/* Image */}
      <div className="absolute inset-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            onError={(e) => { e.target.style.display = 'none'; }}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#252A3A' }} />
        )}
        {/* Gradient scrim */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, transparent 40%, #161A25 100%)' }}
        />
      </div>

      {/* Category badge */}
      <div className="absolute top-3 left-3">
        <span style={{
          fontSize: 11,
          fontWeight: 400,
          color: '#FFFFFF',
          fontFamily: "'Inter', sans-serif",
          background: '#151924',
          borderRadius: 6,
          padding: '4px 8px',
        }}>
          {CATEGORY_LABELS[article.category] || article.category}
        </span>
      </div>

      {/* Bottom text */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#FFFFFF',
            fontFamily: "'Inter', sans-serif",
            lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            margin: 0,
          }}
        >
          {title}
        </h3>
        {timeAgo && (
          <span style={{
            fontSize: 11,
            fontWeight: 400,
            color: '#A2A2A2',
            fontFamily: "'Inter', sans-serif",
            marginTop: 4,
            display: 'block',
          }}>
            {timeAgo}
          </span>
        )}
      </div>
    </motion.article>
  );
};

function getTimeAgo(dateStr) {
  try {
    const now = new Date();
    const then = new Date(dateStr);
    const diffMs = now - then;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return '';
  }
}

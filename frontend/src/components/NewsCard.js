import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CATEGORY_LABELS } from '../lib/bandUtils';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { medium } from '../lib/haptic';
import { F7Icon } from './F7Icon';

// Hero card — full width, image footer overlay style (Yui .card-image-footer)
export const HeroNewsCard = ({ article, badge }) => {
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
      whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
      className="w-full cursor-pointer relative overflow-hidden"
      style={{
        borderRadius: 18,
        boxShadow: 'var(--block-shadow)',
        aspectRatio: '16/10',
      }}
    >
      <div className="absolute inset-0">
        {imageUrl ? (
          <img src={imageUrl} alt="" loading="lazy"
            onError={(e) => { e.target.style.display = 'none'; }}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'var(--light-gray)' }} />
        )}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgb(24 24 24 / 95%) 100%)' }} />
      </div>

      {/* Bookmark */}
      <button className="absolute top-3 right-3 z-10" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
        <F7Icon name="bookmark" size={24} color="#FFFFFF" />
      </button>

      {/* Footer content */}
      <div className="absolute bottom-0 left-0 right-0" style={{ padding: '60px 18px 15px 18px' }}>
        {badge && (
          <span style={{
            fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500,
            padding: '2px 8px', borderRadius: 5,
            background: 'var(--accent)', color: '#FFFFFF',
            display: 'inline-block', marginBottom: 8,
          }}>
            {badge}
          </span>
        )}
        <h2 style={{
          fontFamily: 'var(--font)', fontSize: 19, fontWeight: 500,
          color: '#FFFFFF', lineHeight: '24px', margin: 0,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {title}
        </h2>
        <span style={{
          fontFamily: 'var(--font)', fontSize: 14, fontWeight: 400,
          color: 'rgba(255,255,255,0.7)', marginTop: 4, display: 'block',
        }}>
          {article.source}{timeAgo ? ` · ${timeAgo}` : ''}
        </span>
      </div>
    </motion.article>
  );
};

// Today's Drop card — horizontal slider variant (200×260)
export const TodayDropCard = ({ article, isRead }) => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const rw = article.rewrite || {};
  const title = rw.title || article.original_title || 'Untitled';
  const imageUrl = article.image_url;

  const handleClick = () => {
    medium();
    navigate(`/article/${article.id}`);
  };

  return (
    <motion.article
      data-testid={`today-card-${article.id}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
      className="shrink-0 cursor-pointer relative overflow-hidden"
      style={{
        width: 200, height: 260, borderRadius: 18,
        background: 'var(--surface)', boxShadow: 'var(--block-shadow)',
        border: 'var(--card-border, none)',
      }}
    >
      {/* Image top 55% */}
      <div className="relative" style={{ height: '55%', overflow: 'hidden', borderRadius: '18px 18px 0 0' }}>
        {imageUrl ? (
          <img src={imageUrl} alt="" loading="lazy"
            onError={(e) => { e.target.style.display = 'none'; }}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'var(--light-gray)' }} />
        )}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgb(24 24 24 / 95%) 100%)' }} />
      </div>

      {/* Read badge */}
      {isRead && (
        <div className="absolute top-2 right-2 z-10" style={{
          width: 20, height: 20, borderRadius: '50%', background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, color: '#FFFFFF',
        }}>✓</div>
      )}

      {/* Bottom content */}
      <div style={{ padding: '10px 12px' }}>
        <span style={{
          fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500,
          padding: '2px 8px', borderRadius: 5,
          background: 'var(--light-gray)', color: 'var(--title-color)',
          display: 'inline-block', marginBottom: 6,
        }}>
          {CATEGORY_LABELS[article.category] || article.category}
        </span>
        <h3 style={{
          fontFamily: 'var(--font)', fontSize: 14, fontWeight: 500,
          color: 'var(--title-color)', lineHeight: '18px', margin: 0,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {title}
        </h3>
        <span style={{
          fontFamily: 'var(--font)', fontSize: 14, fontWeight: 400,
          color: 'var(--text-color)', marginTop: 2, display: 'block',
        }}>
          {article.source}
        </span>
      </div>
    </motion.article>
  );
};

// List card — horizontal layout for category sections (180×200)
export const CategoryCard = ({ article }) => {
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
      onClick={handleClick}
      role="button"
      tabIndex={0}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
      className="shrink-0 cursor-pointer relative overflow-hidden"
      style={{
        width: 180, height: 200, borderRadius: 18,
        boxShadow: 'var(--block-shadow)',
        border: 'var(--card-border, none)',
      }}
    >
      <div className="absolute inset-0">
        {imageUrl ? (
          <img src={imageUrl} alt="" loading="lazy"
            onError={(e) => { e.target.style.display = 'none'; }}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'var(--light-gray)' }} />
        )}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgb(24 24 24 / 95%) 100%)' }} />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 style={{
          fontFamily: 'var(--font)', fontSize: 14, fontWeight: 500,
          color: '#FFFFFF', lineHeight: '18px', margin: 0,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {title}
        </h3>
        {timeAgo && (
          <span style={{ fontFamily: 'var(--font)', fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.7)', marginTop: 2, display: 'block' }}>
            {timeAgo}
          </span>
        )}
      </div>
    </motion.article>
  );
};

// Post list item — vertical feed card (image left, text right, divider between)
export const PostListCard = ({ article, isLast, ageGroup }) => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const rw = article.rewrite || {};
  const title = rw.title || article.original_title || 'Untitled';
  const imageUrl = article.image_url;
  const isCompact = ageGroup === '14-16' || ageGroup === '17-20';

  const handleClick = () => {
    medium();
    navigate(`/article/${article.id}`);
  };

  if (isCompact) {
    return (
      <>
        <motion.article
          data-testid={`post-list-card-${article.id}`}
          onClick={handleClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
          className="w-full cursor-pointer"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            padding: '15px 0',
            borderBottom: isLast ? 'none' : '1px solid var(--light-gray)',
          }}
        >
          <div style={{ width: 84, height: 84, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
            {imageUrl ? (
              <img src={imageUrl} alt="" loading="lazy"
                onError={(e) => { e.target.style.display = 'none'; }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'var(--light-gray)' }} />
            )}
          </div>
          <div style={{ marginLeft: 12, paddingTop: 8, flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{
              fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500,
              color: 'var(--accent)', marginBottom: 4,
            }}>
              {CATEGORY_LABELS[article.category] || article.category}
            </span>
            <h3 style={{
              fontFamily: 'var(--font)', fontSize: 14, fontWeight: 500,
              color: 'var(--title-color)', lineHeight: '22px',
              margin: 0,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {title}
            </h3>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <F7Icon name="bookmark" size={18} color="var(--accent)" />
            </div>
          </div>
        </motion.article>
      </>
    );
  }

  return (
    <>
      <motion.article
        data-testid={`post-list-card-${article.id}`}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } }}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
        className="w-full cursor-pointer relative"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          background: 'var(--surface)',
          padding: 15,
          minHeight: 130,
          boxShadow: 'var(--block-shadow)',
        }}
      >
        <div style={{ width: 110, height: 110, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
          {imageUrl ? (
            <img src={imageUrl} alt="" loading="lazy"
              onError={(e) => { e.target.style.display = 'none'; }}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'var(--light-gray)' }} />
          )}
        </div>
        <div style={{ marginLeft: 14, paddingTop: 16, flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{
            fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500,
            color: 'var(--accent)', marginBottom: 8,
          }}>
            {CATEGORY_LABELS[article.category] || article.category}
          </span>
          <h3 style={{
            fontFamily: 'var(--font)', fontSize: 15, fontWeight: 600,
            color: 'var(--title-color)', lineHeight: '22px',
            margin: 0,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {title}
          </h3>
        </div>
        <div style={{ position: 'absolute', right: 15, bottom: 15 }}>
          <F7Icon name="bookmark" size={20} color="var(--accent)" />
        </div>
      </motion.article>
      {!isLast && (
        <div style={{ height: 1, background: 'var(--light-gray)' }} />
      )}
    </>
  );
};

// Legacy list card name kept for backward compat
export const NewsCard = TodayDropCard;

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

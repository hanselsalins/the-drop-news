import { motion } from 'framer-motion';
import { ProfileButton } from './ProfileButton';
import { getCategoryColor } from '../lib/bandUtils';

export function EditorialHeader({ articles, topCategory, onProfileOpen }) {
  const topArticle = articles[0];
  const headline = topArticle?.headline || topArticle?.title || topArticle?.rewrite?.title || topArticle?.original_title || '';
  const category = (topCategory || 'world').toLowerCase();
  const accentColor = getCategoryColor(category, 'editorial');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{ background: 'var(--drop-bg)' }}
    >
      {/* Minimal top bar */}
      <div className="flex items-center justify-between" style={{ padding: '14px 20px 0' }}>
        <span
          style={{
            fontFamily: 'var(--drop-font-body)',
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--drop-text-muted)',
          }}
        >
          the drop
        </span>
        <ProfileButton onClick={onProfileOpen} size={34} />
      </div>

      {/* Hero headline — serif italic for Band 4 */}
      <div style={{ padding: '24px 20px 20px' }}>
        <h1
          style={{
            fontFamily: 'var(--drop-font-heading)',
            fontSize: 28,
            fontWeight: 700,
            fontStyle: 'italic',
            color: 'var(--drop-text)',
            lineHeight: 1.3,
            margin: 0,
            letterSpacing: 'var(--drop-letter-space-heading, -0.02em)',
          }}
        >
          {headline}
        </h1>

        {/* Gold accent line */}
        <div
          style={{
            width: 40,
            height: 2,
            background: accentColor,
            marginTop: 16,
            borderRadius: 1,
          }}
        />

        {/* Signal text */}
        <p
          style={{
            fontFamily: 'var(--drop-font-body)',
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--drop-text-muted)',
            marginTop: 12,
          }}
        >
          Today's Drop ↓
        </p>
      </div>
    </motion.div>
  );
}

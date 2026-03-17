import { motion } from 'framer-motion';
import { ProfileButton } from './ProfileButton';

const CATEGORY_COLORS = {
  world: '#3B82F6',
  science: '#10B981',
  sports: '#F97316',
  tech: '#00D4FF',
  environment: '#14B8A6',
  'weird & wonderful': '#F59E0B',
  weird: '#F59E0B',
  entertainment: '#EC4899',
  money: '#F59E0B',
  history: '#F97316',
  local: '#14B8A6',
  power: '#FF2D78',
};

export function EditorialHeader({ articles, topCategory, onProfileOpen }) {
  const topArticle = articles[0];
  const headline = topArticle?.headline || topArticle?.title || '';
  const category = (topCategory || 'world').toLowerCase();
  const accentColor = CATEGORY_COLORS[category] || '#00D4FF';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{ background: '#1A1A2E' }}
    >
      {/* Minimal top bar */}
      <div
        className="flex items-center justify-between"
        style={{ padding: '14px 20px 0' }}
      >
        <span
          style={{
            fontFamily: 'Urbanist, sans-serif',
            fontSize: 13,
            fontWeight: 400,
            letterSpacing: 1,
            color: '#64748B',
          }}
        >
          the drop
        </span>
        <ProfileButton onClick={onProfileOpen} size={34} />
      </div>

      {/* Hero headline */}
      <div style={{ padding: '24px 20px 20px' }}>
        <h1
          style={{
            fontFamily: 'Urbanist, sans-serif',
            fontSize: 26,
            fontWeight: 700,
            color: '#FFFFFF',
            lineHeight: 1.3,
            margin: 0,
          }}
        >
          {headline}
        </h1>

        {/* Accent line */}
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
            fontFamily: 'Urbanist, sans-serif',
            fontSize: 12,
            color: '#64748B',
            marginTop: 12,
          }}
        >
          Today's Drop ↓
        </p>
      </div>
    </motion.div>
  );
}

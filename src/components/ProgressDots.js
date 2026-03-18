import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { useReducedMotion } from '../hooks/useReducedMotion';

const BAND_GRADIENTS = {
  'big-bold-bright': ['#FF4B4B', '#FFD93D'],
  'cool-connected': ['#1E90FF', '#00D4AA'],
  'sharp-aware': ['#5C4EFA', '#22D3EE'],
  'editorial': ['#00D4FF', '#FF2D78'],
};

export const ProgressDots = ({ articleIds, readArticleIds }) => {
  const { band } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const total = 5;
  const dots = Array.from({ length: total }, (_, i) => {
    const articleId = articleIds[i];
    return articleId ? readArticleIds.has(String(articleId)) : false;
  });
  const allRead = dots.every(Boolean) && articleIds.length === total;
  const isDark = band === 'sharp-aware' || band === 'editorial';
  const colors = BAND_GRADIENTS[band] || BAND_GRADIENTS['cool-connected'];
  const gradient = `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`;

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div className="flex items-center gap-2.5">
        {dots.map((filled, i) => (
          <motion.div
            key={i}
            initial={prefersReducedMotion ? undefined : { scale: 0.8, opacity: 0 }}
            animate={prefersReducedMotion ? undefined : { scale: 1, opacity: 1 }}
            transition={prefersReducedMotion ? undefined : { delay: i * 0.06, duration: 0.3 }}
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: filled ? gradient : (isDark ? 'rgba(255,255,255,0.15)' : '#E2E8F0'),
              boxShadow: filled ? `0 2px 8px ${colors[0]}55` : 'none',
              transition: 'background 0.3s, box-shadow 0.3s',
            }}
          />
        ))}
      </div>

      {allRead && (
        <motion.div
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? undefined : { duration: 0.5, delay: 0.2 }}
          className="text-center px-4"
        >
          <p
            className="text-sm font-semibold"
            style={{
              fontFamily: 'var(--drop-font-heading)',
              background: gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            You're all caught up for today 🎉
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ fontFamily: 'var(--drop-font-body)', color: 'var(--drop-text-muted)' }}
          >
            See you tomorrow
          </p>
        </motion.div>
      )}
    </div>
  );
};

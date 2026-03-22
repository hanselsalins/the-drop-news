import { motion } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';

export const ProgressDots = ({ articleIds, readArticleIds }) => {
  const prefersReducedMotion = useReducedMotion();
  const total = 5;
  const dots = Array.from({ length: total }, (_, i) => {
    const articleId = articleIds[i];
    return articleId ? readArticleIds.has(String(articleId)) : false;
  });
  const allRead = dots.every(Boolean) && articleIds.length === total;

  return (
    <div style={{ padding: '16px', background: 'var(--light-gray)', borderRadius: 16, margin: '0 16px' }}>
      <div className="flex items-center justify-between mb-3">
        <span style={{
          fontFamily: "'Rubik', sans-serif",
          fontSize: 15,
          fontWeight: 700,
          color: 'var(--title-color)',
        }}>
          Today's Mission
        </span>
      </div>
      <div className="flex items-center gap-2">
        {dots.map((filled, i) => (
          <motion.div
            key={i}
            initial={prefersReducedMotion ? undefined : { scale: 0.8, opacity: 0 }}
            animate={prefersReducedMotion ? undefined : { scale: 1, opacity: 1 }}
            transition={prefersReducedMotion ? undefined : { delay: i * 0.06, duration: 0.3 }}
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: filled ? 'var(--accent)' : 'var(--bg)',
              border: '2px solid var(--accent)',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>

      {allRead && (
        <motion.p
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? undefined : { duration: 0.5, delay: 0.2 }}
          style={{
            fontFamily: "'Rubik', sans-serif",
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--accent)',
            marginTop: 8,
          }}
        >
          You're all caught up for today 🎉
        </motion.p>
      )}
    </div>
  );
};

import { motion } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useTheme } from '../contexts/ThemeContext';

const MISSION_METERS = {
  '8-10': 'stars',
  '11-13': 'dots',
  '14-16': 'bar',
  '17-20': 'text',
};

export const ProgressDots = ({ articleIds, readArticleIds }) => {
  const prefersReducedMotion = useReducedMotion();
  const { ageGroup } = useTheme();
  const total = 5;
  const dots = Array.from({ length: total }, (_, i) => {
    const articleId = articleIds[i];
    return articleId ? readArticleIds.has(String(articleId)) : false;
  });
  const readCount = dots.filter(Boolean).length;
  const allRead = dots.every(Boolean) && articleIds.length === total;
  const meter = MISSION_METERS[ageGroup] || 'dots';

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Title + meter on same line */}
      <div className="flex items-start justify-between">
        <div>
          <span style={{
            fontFamily: 'var(--font)',
            fontSize: 28,
            fontWeight: 600,
            color: 'var(--title-color)',
          }}>
            Today's Drop
          </span>
          <span style={{
            fontFamily: 'var(--font)',
            fontSize: 14,
            fontWeight: 400,
            color: 'var(--text-color)',
            display: 'block',
            marginTop: 2,
          }}>
            5 stories shaping the world today
          </span>
        </div>

        <div className="flex flex-col items-end" style={{ marginTop: 4 }}>
          {meter === 'stars' && (
            <div className="flex items-center gap-1">
              {dots.map((filled, i) => (
                <motion.span
                  key={i}
                  animate={!prefersReducedMotion && filled ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  style={{ fontSize: 24, filter: filled ? 'none' : 'grayscale(1) opacity(0.3)' }}
                >⭐</motion.span>
              ))}
            </div>
          )}

          {meter === 'dots' && (
            <div className="flex items-center gap-2">
              {dots.map((filled, i) => (
                <motion.div
                  key={i}
                  initial={prefersReducedMotion ? undefined : { scale: 0.8, opacity: 0 }}
                  animate={prefersReducedMotion ? undefined : { scale: 1, opacity: 1 }}
                  transition={prefersReducedMotion ? undefined : { delay: i * 0.06, duration: 0.3 }}
                  style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: filled ? 'var(--accent)' : 'transparent',
                    border: '2px solid var(--accent)',
                  }}
                />
              ))}
            </div>
          )}

          {meter === 'bar' && (
            <div className="flex items-center gap-2">
              <div style={{ width: 120, height: 4, background: 'var(--light-gray)', borderRadius: 999, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(readCount / total) * 100}%` }}
                  style={{ height: '100%', background: 'var(--accent)', borderRadius: 999 }}
                />
              </div>
            </div>
          )}

          {meter === 'text' && (
            <span style={{ fontFamily: 'var(--font)', fontSize: 12, fontWeight: 400, color: 'var(--text-color)' }}>
              {readCount} of {total} read
            </span>
          )}
        </div>
      </div>

      {/* Counter below, right-aligned */}
      <div style={{ textAlign: 'right', marginTop: 4, paddingRight: 2 }}>
        <span style={{ fontFamily: 'var(--font)', fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>
          {readCount} of {total}
        </span>
      </div>
    </div>
  );
};

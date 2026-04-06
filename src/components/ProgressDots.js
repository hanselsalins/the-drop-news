import { motion } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useTheme } from '../contexts/ThemeContext';

const MISSION_METERS = {
  '8-10': 'stars',
  '11-13': 'dots',
  '14-16': 'bar',
  '17-20': 'bar',
};

const BAND_SUBTITLE = {
  '8-10': (n) => `Your ${n} stories for today`,
  '11-13': (n) => `Your ${n} stories for today`,
  '14-16': (n) => `${n} stories shaping the world today`,
  '17-20': (n) => `${n} stories shaping the world today`,
};

export const ProgressDots = ({ articleIds, readArticleIds }) => {
  const prefersReducedMotion = useReducedMotion();
  const { ageGroup } = useTheme();
  const total = articleIds.length;
  const dots = articleIds.map((id) => readArticleIds.has(String(id)));
  const readCount = dots.filter(Boolean).length;
  const allRead = total > 0 && dots.every(Boolean);
  const meter = MISSION_METERS[ageGroup] || 'dots';
  const subtitleFn = BAND_SUBTITLE[ageGroup] || BAND_SUBTITLE['14-16'];

  if (total === 0) return null;

  return (
    <div style={{ marginBottom: 12 }}>
      {/* Row 1: Title + meter */}
      <div className="flex items-center justify-between">
        <span style={{
          fontFamily: 'var(--font)',
          fontSize: 28,
          fontWeight: 600,
          color: 'var(--title-color)',
        }}>
          Today's <span style={{ color: '#FF6B00' }}>Drop</span>
        </span>

        <div>
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

      {/* Row 2: Subtitle + count */}
      <div className="flex items-center justify-between" style={{ marginTop: 2 }}>
        <span style={{
          fontFamily: 'var(--font)',
          fontSize: 15,
          fontWeight: 400,
          color: 'var(--text-color)',
          paddingLeft: 2,
        }}>
          {subtitleFn(total)}
        </span>
        <span style={{ fontFamily: 'var(--font)', fontSize: 14, fontWeight: 700, color: 'var(--accent)', whiteSpace: 'nowrap', paddingRight: 2 }}>
          {readCount} of {total}
        </span>
      </div>

    </div>
  );
};

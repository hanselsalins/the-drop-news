import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

const CATEGORY_COLORS = {
  world: '#3B82F6',
  science: '#10B981',
  sports: '#F97316',
  tech: '#8B5CF6',
  environment: '#14B8A6',
  'weird & wonderful': '#F59E0B',
  weird: '#F59E0B',
  entertainment: '#EC4899',
  money: '#F59E0B',
  history: '#F97316',
  local: '#14B8A6',
  power: '#EF4444',
};

export function BriefingHeader({ articles, readArticleIds, streak, topCategory }) {
  const [showYesterday, setShowYesterday] = useState(false);
  const containerRef = useRef(null);
  const dragX = useMotionValue(0);
  const mainOpacity = useTransform(dragX, [-120, 0], [0, 1]);
  const yesterdayOpacity = useTransform(dragX, [-120, -40, 0], [1, 0.5, 0]);
  const yesterdayX = useTransform(dragX, [-120, 0], [0, 60]);

  const category = (topCategory || 'world').toLowerCase();
  const borderColor = CATEGORY_COLORS[category] || '#3B82F6';

  const total = 5;
  const articleIds = articles.slice(0, total).map(a => String(a.id));
  const readCount = articleIds.filter(id => readArticleIds.has(id)).length;
  const progress = articleIds.length > 0 ? (readCount / total) * 100 : 0;

  // Pull-quote: use summary of first article, fallback to headline
  const topArticle = articles[0];
  const pullQuote = topArticle?.summary || topArticle?.headline || topArticle?.title || '';

  // Yesterday placeholder — we don't have yesterday's data, show a hint
  const yesterdayHint = "Swipe back for yesterday's top story";

  const handleDragEnd = (_, info) => {
    if (info.offset.x < -60) {
      setShowYesterday(true);
      animate(dragX, -120, { duration: 0.2, ease: 'easeOut' });
    } else {
      setShowYesterday(false);
      animate(dragX, 0, { duration: 0.2, ease: 'easeOut' });
    }
  };

  const handleBack = () => {
    setShowYesterday(false);
    animate(dragX, 0, { duration: 0.2, ease: 'easeOut' });
  };

  return (
    <div className="px-4 pt-4" ref={containerRef}>
      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: 8,
          background: '#FFFFFF',
          borderLeft: `3px solid ${borderColor}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        }}
      >
        <motion.div
          drag="x"
          dragConstraints={{ left: -120, right: 0 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          style={{ x: dragX }}
          className="relative"
        >
          {/* Main briefing content */}
          <motion.div
            style={{ opacity: mainOpacity, padding: '20px 20px 16px' }}
          >
            {/* Label */}
            <p
              style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: borderColor,
                marginBottom: 10,
              }}
            >
              Today's Briefing
            </p>

            {/* Pull-quote */}
            <p
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: 18,
                fontWeight: 500,
                color: '#1E293B',
                lineHeight: 1.45,
                marginBottom: 16,
              }}
            >
              {pullQuote}
            </p>

            {/* Stat chips */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className="inline-flex items-center px-3 py-1.5"
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#64748B',
                  background: '#F1F5F9',
                  borderRadius: 20,
                }}
              >
                {readCount}/{total} stories
              </span>
              <span
                className="inline-flex items-center px-3 py-1.5"
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#64748B',
                  background: '#F1F5F9',
                  borderRadius: 20,
                }}
              >
                🔥 Day {streak.current_streak || 0}
              </span>
            </div>

            {/* Progress bar */}
            <div
              style={{
                height: 3,
                background: '#F1F5F9',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  background: borderColor,
                  borderRadius: 2,
                }}
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Yesterday overlay — positioned behind the draggable */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            opacity: yesterdayOpacity,
            x: yesterdayX,
            pointerEvents: showYesterday ? 'auto' : 'none',
            padding: '20px',
          }}
        >
          <div className="text-center">
            <p
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: 13,
                color: '#94A3B8',
                marginBottom: 8,
              }}
            >
              {yesterdayHint}
            </p>
            {showYesterday && (
              <button
                onClick={handleBack}
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: 13,
                  fontWeight: 500,
                  color: borderColor,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px 16px',
                }}
              >
                ← back
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

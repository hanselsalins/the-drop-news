import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { getCategoryColor } from '../lib/bandUtils';

export function BriefingHeader({ articles, readArticleIds, streak, topCategory }) {
  const { band } = useTheme();
  const [showYesterday, setShowYesterday] = useState(false);
  const containerRef = useRef(null);
  const dragX = useMotionValue(0);
  const mainOpacity = useTransform(dragX, [-120, 0], [0, 1]);
  const yesterdayOpacity = useTransform(dragX, [-120, -40, 0], [1, 0.5, 0]);
  const yesterdayX = useTransform(dragX, [-120, 0], [0, 60]);

  const category = (topCategory || 'world').toLowerCase();
  const borderColor = getCategoryColor(category, band);

  const total = 5;
  const articleIds = articles.slice(0, total).map(a => String(a.id));
  const readCount = articleIds.filter(id => readArticleIds.has(id)).length;
  const progress = articleIds.length > 0 ? (readCount / total) * 100 : 0;

  const topArticle = articles[0];
  const pullQuote = topArticle?.summary || topArticle?.headline || topArticle?.title || '';
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
          borderRadius: 'var(--drop-radius-card, 8px)',
          background: 'var(--drop-surface)',
          borderLeft: `3px solid ${borderColor}`,
          boxShadow: 'var(--drop-shadow-card)',
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
          <motion.div style={{ opacity: mainOpacity, padding: '20px 20px 16px' }}>
            <p
              style={{
                fontFamily: 'var(--drop-font-heading)',
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

            <p
              style={{
                fontFamily: 'var(--drop-font-body)',
                fontSize: 18,
                fontWeight: 500,
                color: 'var(--drop-text)',
                lineHeight: 1.45,
                marginBottom: 16,
              }}
            >
              {pullQuote}
            </p>

            <div className="flex items-center gap-2 mb-3">
              <span
                className="inline-flex items-center px-3 py-1.5"
                style={{
                  fontFamily: 'var(--drop-font-body)',
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--drop-text-muted)',
                  background: band === 'sharp-aware' ? 'var(--drop-surface-hover, rgba(255,255,255,0.06))' : '#F1F5F9',
                  borderRadius: 20,
                }}
              >
                {readCount}/{total} stories
              </span>
              <span
                className="inline-flex items-center px-3 py-1.5"
                style={{
                  fontFamily: 'var(--drop-font-body)',
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--drop-text-muted)',
                  background: band === 'sharp-aware' ? 'var(--drop-surface-hover, rgba(255,255,255,0.06))' : '#F1F5F9',
                  borderRadius: 20,
                }}
              >
                🔥 Day {streak.current_streak || 0}
              </span>
            </div>

            <div style={{ height: 3, background: band === 'sharp-aware' ? 'rgba(255,255,255,0.1)' : '#F1F5F9', borderRadius: 2, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{ height: '100%', background: borderColor, borderRadius: 2 }}
              />
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          style={{ opacity: yesterdayOpacity, x: yesterdayX, pointerEvents: showYesterday ? 'auto' : 'none', padding: '20px' }}
        >
          <div className="text-center">
            <p style={{ fontFamily: 'var(--drop-font-body)', fontSize: 13, color: 'var(--drop-text-muted)', marginBottom: 8 }}>
              {yesterdayHint}
            </p>
            {showYesterday && (
              <button onClick={handleBack}
                style={{ fontFamily: 'var(--drop-font-body)', fontSize: 13, fontWeight: 500, color: borderColor, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 16px' }}>
                ← back
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

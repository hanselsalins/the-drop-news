import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

const CATEGORY_GRADIENTS = {
  world: ['#3B82F6', '#60A5FA', '#93C5FD'],
  science: ['#10B981', '#34D399', '#6EE7B7'],
  sports: ['#F97316', '#FB923C', '#FDBA74'],
  tech: ['#8B5CF6', '#A78BFA', '#C4B5FD'],
  environment: ['#14B8A6', '#2DD4BF', '#5EEAD4'],
  'weird & wonderful': ['#F59E0B', '#FBBF24', '#FCD34D'],
  weird: ['#F59E0B', '#FBBF24', '#FCD34D'],
  entertainment: ['#EC4899', '#F472B6', '#F9A8D4'],
  money: ['#F59E0B', '#FBBF24', '#FCD34D'],
  history: ['#F97316', '#FB923C', '#FDBA74'],
  local: ['#14B8A6', '#2DD4BF', '#5EEAD4'],
  power: ['#EF4444', '#F87171', '#FCA5A5'],
};

const CATEGORY_EMOJIS = {
  world: '🌍',
  science: '🔬',
  sports: '⚽',
  tech: '🤖',
  environment: '🌱',
  'weird & wonderful': '🤪',
  weird: '🤪',
  entertainment: '🎬',
  money: '💰',
  history: '📜',
  local: '📍',
  power: '⚡',
};

// Tiny confetti particles
function ConfettiBurst({ color, active }) {
  if (!active) return null;
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * 360;
    const rad = (angle * Math.PI) / 180;
    const dist = 30 + Math.random() * 20;
    return { x: Math.cos(rad) * dist, y: Math.sin(rad) * dist, rot: Math.random() * 360, delay: Math.random() * 0.15 };
  });

  return (
    <div className="absolute inset-0 pointer-events-none">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={{ x: p.x, y: p.y, scale: 0, opacity: 0, rotate: p.rot }}
          transition={{ duration: 0.6, delay: p.delay, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: color,
          }}
        />
      ))}
    </div>
  );
}

// Big celebration confetti
function CelebrationConfetti({ active }) {
  if (!active) return null;
  const colors = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#F97316'];
  const particles = Array.from({ length: 40 }, (_, i) => ({
    x: (Math.random() - 0.5) * 300,
    y: -(80 + Math.random() * 120),
    rot: Math.random() * 720,
    color: colors[i % colors.length],
    delay: Math.random() * 0.3,
    w: 6 + Math.random() * 6,
    h: 4 + Math.random() * 4,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 10 }}>
      {particles.map((p, i) => (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rot }}
          transition={{ duration: 1.2, delay: p.delay, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            width: p.w,
            height: p.h,
            borderRadius: 2,
            background: p.color,
          }}
        />
      ))}
    </div>
  );
}

// Single progress ring
function ProgressRing({ filled, color, index, justFilled }) {
  const size = 56;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.3 + index * 0.1, type: 'spring', stiffness: 300, damping: 15 }}
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={stroke}
        />
        {/* Filled ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={filled ? '#FFFFFF' : 'transparent'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: filled ? 0 : circumference }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: justFilled ? 0 : 0.1 }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence>
          {filled ? (
            <motion.span
              key="check"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10, delay: 0.3 }}
              style={{ fontSize: 22 }}
            >
              ✓
            </motion.span>
          ) : (
            <motion.span
              key="num"
              style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}
            >
              {index + 1}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      {/* Confetti burst on fill */}
      <ConfettiBurst color={color} active={justFilled} />
    </motion.div>
  );
}

export function MissionHeader({ articles, readArticleIds, streak, topCategory }) {
  const [prevReadCount, setPrevReadCount] = useState(0);
  const [justFilledIndex, setJustFilledIndex] = useState(-1);
  const [celebrationDone, setCelebrationDone] = useState(false);

  const category = (topCategory || 'world').toLowerCase();
  const gradientColors = CATEGORY_GRADIENTS[category] || CATEGORY_GRADIENTS.world;
  const categoryColor = CATEGORY_COLORS[category] || '#3B82F6';
  const emoji = CATEGORY_EMOJIS[category] || '📰';

  const total = 5;
  const articleIds = articles.slice(0, total).map(a => String(a.id));
  const readStatus = articleIds.map(id => readArticleIds.has(id));
  const readCount = readStatus.filter(Boolean).length;
  const allComplete = readCount === total && articleIds.length === total;

  // Detect newly read article for confetti burst
  useEffect(() => {
    if (readCount > prevReadCount && prevReadCount > 0) {
      // Find the newly filled index
      const newIndex = readStatus.findIndex((filled, i) => {
        return filled && i === readCount - 1;
      });
      if (newIndex >= 0) {
        setJustFilledIndex(newIndex);
        setTimeout(() => setJustFilledIndex(-1), 800);
      }
    }
    setPrevReadCount(readCount);
  }, [readCount]);

  // Celebration trigger
  useEffect(() => {
    if (allComplete && !celebrationDone) {
      setCelebrationDone(true);
    }
  }, [allComplete]);

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative mx-4 mt-4 overflow-hidden"
      style={{
        borderRadius: 24,
        background: `linear-gradient(145deg, ${gradientColors[0]}, ${gradientColors[1]} 60%, ${gradientColors[2]})`,
        boxShadow: `0 8px 32px -4px ${categoryColor}40, 0 4px 16px -2px ${categoryColor}30, inset 0 1px 0 rgba(255,255,255,0.2)`,
        padding: '24px 20px',
      }}
    >
      {/* Claymorphism overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: 24,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 50%)',
        }}
      />

      {/* Celebration confetti */}
      <CelebrationConfetti active={allComplete && celebrationDone} />

      {/* Top row: emoji + streak */}
      <div className="relative flex items-center justify-between mb-3">
        {/* Animated emoji */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 12, delay: 0.1 }}
          style={{ fontSize: 48, lineHeight: 1 }}
        >
          {emoji}
        </motion.div>

        {/* Streak badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}
          className="flex items-center gap-2 px-4 py-2"
          style={{
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 20,
            backdropFilter: 'blur(8px)',
          }}
        >
          <span style={{ fontSize: 28 }}>🔥</span>
          <span
            style={{
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 24,
              fontWeight: 700,
              color: '#FFFFFF',
            }}
          >
            {streak.current_streak || 0}
          </span>
        </motion.div>
      </div>

      {/* Mission text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="relative mb-5"
      >
        <AnimatePresence mode="wait">
          {allComplete ? (
            <motion.p
              key="complete"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12 }}
              style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 24,
                fontWeight: 700,
                color: '#FFFFFF',
                lineHeight: 1.3,
              }}
            >
              Mission Complete! 🎉
            </motion.p>
          ) : (
            <motion.p
              key="challenge"
              style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 22,
                fontWeight: 700,
                color: '#FFFFFF',
                lineHeight: 1.3,
              }}
            >
              5 stories. Can you crack them all?
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Progress rings */}
      <div className="relative flex items-center justify-between px-2">
        {Array.from({ length: total }, (_, i) => {
          const filled = i < articleIds.length ? readStatus[i] : false;
          return (
            <ProgressRing
              key={i}
              filled={filled}
              color={categoryColor}
              index={i}
              justFilled={justFilledIndex === i}
            />
          );
        })}
      </div>

      {/* Pulsing rings when all complete */}
      {allComplete && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ borderRadius: 24, border: '3px solid rgba(255,255,255,0.4)' }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}

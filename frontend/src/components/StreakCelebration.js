import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { heavy } from '../lib/haptic';

const MILESTONES = [7, 14, 30, 60, 100];
const PARTICLE_COLORS = ['#FF6B00', '#FFD93D', '#FF8C00', '#F59E0B', '#EF4444', '#FBBF24'];

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

export function StreakCelebration({ streakCount, onComplete }) {
  const [visible, setVisible] = useState(false);
  const isMilestone = MILESTONES.includes(streakCount);
  const sessionKey = `celebrated_streak_${streakCount}`;

  useEffect(() => {
    if (!isMilestone) return;
    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, 'true');
    setVisible(true);
    heavy();
    const timer = setTimeout(() => setVisible(false), 2500);
    return () => clearTimeout(timer);
  }, [isMilestone, sessionKey]);

  const particles = useMemo(() => {
    if (!isMilestone) return [];
    return Array.from({ length: 25 }, (_, i) => ({
      id: i, x: randomBetween(-120, 120), y: randomBetween(-250, -400),
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      size: randomBetween(6, 12), duration: randomBetween(0.8, 1.6), delay: randomBetween(0, 0.3),
    }));
  }, [isMilestone]);

  if (!isMilestone) return null;

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {visible && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center" aria-hidden="true">
          {particles.map((p) => (
            <motion.div key={p.id}
              initial={{ y: 0, x: 0, opacity: 1, scale: 1 }}
              animate={{ y: p.y, x: p.x, opacity: 0, scale: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
              style={{ position: 'absolute', width: p.size, height: p.size, borderRadius: '50%', background: p.color }}
            />
          ))}
          <motion.div
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
            className="text-center">
            <p className="text-4xl font-black" style={{ fontFamily: 'var(--font)', color: '#FFD93D' }}>
              {streakCount} Days!
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

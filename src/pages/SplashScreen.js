import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

const LETTERS = ['T', 'h', 'e', ' ', 'D', 'r', 'o', 'p'];

export default function SplashScreen() {
  const navigate = useNavigate();
  const { isAuthenticated } = useTheme();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), 1400);
    const t3 = setTimeout(() => {
      if (isAuthenticated) {
        navigate('/feed');
      } else {
        navigate('/auth');
      }
    }, 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [navigate, isAuthenticated]);

  return (
    <div
      data-testid="splash-screen"
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#0A0E1A' }}
    >
      {/* Radial gradient glow */}
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 50% 45%, rgba(59,130,246,0.15) 0%, transparent 50%), radial-gradient(circle at 55% 50%, rgba(139,92,246,0.1) 0%, transparent 45%)`
      }} />

      {/* Letter-by-letter drop animation */}
      <div className="relative z-10 flex items-baseline justify-center">
        {LETTERS.map((letter, i) => (
          <motion.span
            key={i}
            initial={{ y: -80, opacity: 0 }}
            animate={phase >= 1 ? { y: 0, opacity: 1 } : {}}
            transition={{
              delay: i * 0.07,
              duration: 0.5,
              ease: [0.16, 1, 0.3, 1],
              type: 'spring',
              stiffness: 200,
              damping: 15,
            }}
            style={{
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 'clamp(3.5rem, 14vw, 5.5rem)',
              fontWeight: 700,
              color: '#FAFAFA',
              lineHeight: 1,
              display: letter === ' ' ? 'inline-block' : undefined,
              width: letter === ' ' ? '0.3em' : undefined,
            }}
          >
            {letter}
          </motion.span>
        ))}
      </div>

      {/* Tagline */}
      <AnimatePresence>
        {phase >= 2 && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.5, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 mt-4 text-base tracking-wide"
            style={{ fontFamily: 'Outfit, sans-serif', color: '#94A3B8' }}
          >
            News that hits different
          </motion.p>
        )}
      </AnimatePresence>

      {/* Pulsing dot */}
      <motion.div
        className="absolute bottom-14 left-1/2 -translate-x-1/2"
        animate={{ opacity: [0.2, 0.8, 0.2] }}
        transition={{ duration: 1.8, repeat: Infinity }}
      >
        <div className="w-3 h-3 rounded-full" style={{ background: '#3B82F6' }} />
      </motion.div>
    </div>
  );
}

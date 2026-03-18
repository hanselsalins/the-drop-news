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
      style={{
        background: 'linear-gradient(145deg, #4F46E5, #8B5CF6 50%, #EC4899)',
      }}
    >
      {/* Letter-by-letter drop animation */}
      <div className="relative z-10 flex items-baseline justify-center">
        {LETTERS.map((letter, i) => (
          <motion.span
            key={i}
            initial={{ y: -80, opacity: 0 }}
            animate={phase >= 1 ? { y: 0, opacity: 1 } : {}}
            transition={{
              delay: i * 0.08,
              duration: 0.5,
              type: 'spring',
              stiffness: 200,
              damping: 15,
            }}
            style={{
              fontFamily: "'Baloo 2', 'Fredoka', cursive",
              fontSize: 52,
              fontWeight: 800,
              color: '#FFFFFF',
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
            animate={{ opacity: 0.8, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 mt-4"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 16,
              color: 'rgba(255,255,255,0.8)',
            }}
          >
            News that hits different
          </motion.p>
        )}
      </AnimatePresence>

      {/* Pulsing dot */}
      <motion.div
        className="absolute bottom-14 left-1/2 -translate-x-1/2"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.8, repeat: Infinity }}
      >
        <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(255,255,255,0.6)' }} />
      </motion.div>
    </div>
  );
}

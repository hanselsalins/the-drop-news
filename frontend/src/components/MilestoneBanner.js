import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X } from 'lucide-react';
import { useReducedMotion } from '../hooks/useReducedMotion';

export const MilestoneBanner = ({ milestone, onDismiss }) => {
  const prefersReducedMotion = useReducedMotion();
  if (!milestone) return null;

  return (
    <AnimatePresence>
      <motion.div
        data-testid="milestone-banner"
        role="alert"
        initial={prefersReducedMotion ? { opacity: 0 } : { y: -100, opacity: 0 }}
        animate={prefersReducedMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
        exit={prefersReducedMotion ? { opacity: 0 } : { y: -100, opacity: 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 25 }}
        className="fixed top-0 left-0 right-0 z-[100] px-4 pt-4"
        style={{ maxWidth: '430px', margin: '0 auto' }}
      >
        <div className="p-4 flex items-start gap-3"
          style={{ background: 'var(--accent)', boxShadow: 'var(--block-shadow)', borderRadius: 18 }}>
          <div className="w-12 h-12 flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 14 }}>
            <Trophy size={24} color="#fff" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold tracking-wider uppercase opacity-80"
              style={{ fontFamily: 'var(--font)', color: '#fff' }}>MILESTONE REACHED</p>
            <p className="text-base font-bold mt-0.5 leading-snug"
              style={{ fontFamily: 'var(--font)', color: '#fff' }}>
              {milestone.emoji} {milestone.message}
            </p>
          </div>
          <button data-testid="milestone-dismiss" aria-label="Dismiss milestone" onClick={onDismiss}
            className="p-1 rounded-full shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <X size={16} color="#fff" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

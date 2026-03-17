import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const BAND_GRADIENTS = {
  'big-bold-bright': 'linear-gradient(135deg, #FF4B4B, #FFD93D)',
  'cool-connected': 'linear-gradient(135deg, #1E90FF, #00D4AA)',
  'sharp-aware': 'linear-gradient(135deg, #5C4EFA, #22D3EE)',
  'editorial': 'linear-gradient(135deg, #00D4FF, #FF2D78)',
};

export const MilestoneBanner = ({ milestone, onDismiss }) => {
  const { band } = useTheme();
  if (!milestone) return null;

  const gradient = BAND_GRADIENTS[band] || BAND_GRADIENTS['cool-connected'];

  return (
    <AnimatePresence>
      <motion.div
        data-testid="milestone-banner"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="fixed top-0 left-0 right-0 z-[100] px-4 pt-4"
        style={{ maxWidth: '430px', margin: '0 auto' }}
      >
        <div
          className="p-4 flex items-start gap-3"
          style={{
            background: gradient,
            boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
            borderRadius: 'var(--drop-radius-card, 18px)',
          }}
        >
          <div className="w-12 h-12 flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 'var(--drop-radius-card, 14px)' }}>
            <Trophy size={24} color="#fff" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold tracking-wider uppercase opacity-80"
              style={{ fontFamily: 'var(--drop-font-body)', color: '#fff' }}>
              MILESTONE REACHED
            </p>
            <p className="text-base font-bold mt-0.5 leading-snug"
              style={{ fontFamily: 'var(--drop-font-heading)', color: '#fff' }}>
              {milestone.emoji} {milestone.message}
            </p>
          </div>
          <button
            data-testid="milestone-dismiss"
            onClick={onDismiss}
            className="p-1 rounded-full shrink-0"
            style={{ background: 'rgba(255,255,255,0.2)' }}
          >
            <X size={16} color="#fff" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
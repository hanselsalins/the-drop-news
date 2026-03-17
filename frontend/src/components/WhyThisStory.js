import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export const WhyThisStory = ({ reason }) => {
  const { band } = useTheme();
  const [open, setOpen] = useState(false);
  const isDark = band === 'sharp-aware' || band === 'editorial';

  return (
    <div className="relative inline-block">
      <button
        data-testid="why-this-story-btn"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-1.5 rounded-full"
        style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
      >
        <Info size={13} style={{ color: 'var(--drop-text-muted)' }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-full left-0 mb-2 p-4 z-50 w-60"
            style={{
              background: isDark ? 'var(--drop-surface)' : '#FFFFFF',
              border: `1px solid var(--drop-border)`,
              borderRadius: 'var(--drop-radius-card, 16px)',
              boxShadow: isDark ? '0 8px 30px rgba(0,0,0,0.4)' : '0 8px 30px rgba(0,0,0,0.12)',
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold tracking-wider uppercase mb-1.5"
                  style={{ fontFamily: 'var(--drop-font-body)', color: 'var(--drop-text-muted)' }}>
                  WHY THIS STORY?
                </p>
                <p className="text-xs leading-relaxed"
                  style={{ fontFamily: 'var(--drop-font-body)', color: 'var(--drop-text-muted)' }}>
                  {reason}
                </p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setOpen(false); }} className="shrink-0 mt-0.5">
                <X size={12} style={{ color: 'var(--drop-text-muted)' }} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
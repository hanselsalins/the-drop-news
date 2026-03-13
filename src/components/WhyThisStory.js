import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, X } from 'lucide-react';

export const WhyThisStory = ({ reason }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        data-testid="why-this-story-btn"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-1.5 rounded-full"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <Info size={13} style={{ color: '#64748B' }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-full left-0 mb-2 p-4 rounded-2xl z-50 w-60"
            style={{
              background: '#111827',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold tracking-wider uppercase mb-1.5"
                  style={{ fontFamily: 'Outfit, sans-serif', color: '#64748B' }}>
                  WHY THIS STORY?
                </p>
                <p className="text-xs leading-relaxed"
                  style={{ fontFamily: 'Outfit, sans-serif', color: '#94A3B8' }}>
                  {reason}
                </p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setOpen(false); }} className="shrink-0 mt-0.5">
                <X size={12} style={{ color: '#475569' }} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

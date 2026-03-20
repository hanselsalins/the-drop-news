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
        className="p-1.5 rounded-full cursor-pointer"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <Info size={13} style={{ color: '#828693' }} />
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
              background: '#1B202F',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14,
              boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#828693',
                  marginBottom: 6,
                }}>
                  WHY THIS STORY?
                </p>
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 12,
                  fontWeight: 400,
                  color: '#D4D4D4',
                  lineHeight: '16px',
                }}>
                  {reason}
                </p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setOpen(false); }} className="shrink-0 mt-0.5 cursor-pointer" style={{ background: 'none', border: 'none' }}>
                <X size={12} style={{ color: '#828693' }} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

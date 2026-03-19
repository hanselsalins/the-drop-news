import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useReducedMotion } from '../hooks/useReducedMotion';

export const MicroFactCard = ({ fact }) => {
  const { band } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const isBand1 = band === 'big-bold-bright';

  return (
    <motion.div
      data-testid="micro-fact-card"
      initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.96 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
      className="p-4 relative overflow-hidden"
      style={{
        background: 'var(--drop-surface)',
        border: '1px solid var(--drop-border)',
        borderLeft: `${isBand1 ? 5 : 3}px solid var(--drop-accent)`,
        borderRadius: 'var(--drop-radius-card)',
        boxShadow: isBand1 ? 'var(--drop-shadow-card)' : 'var(--drop-shadow-card)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        {band !== 'sharp-aware' && <Lightbulb size={18} style={{ color: 'var(--drop-accent)' }} aria-hidden="true" />}
        <span
          className="text-[10px] font-bold tracking-wider uppercase"
          style={{
            fontFamily: band === 'sharp-aware' ? 'var(--drop-font-heading)' : 'var(--drop-font-body)',
            color: 'var(--drop-accent)',
            letterSpacing: band === 'sharp-aware' ? '0.08em' : undefined,
          }}
        >
          Quick Fact
        </span>
      </div>
      <p
        className="text-xs leading-relaxed"
        style={{
          fontFamily: 'var(--drop-font-body)',
          color: 'var(--drop-text)',
          fontSize: isBand1 ? 14 : 12,
          fontStyle: band === 'sharp-aware' ? 'normal' : 'italic',
        }}
      >
        {fact.fact}
      </p>
    </motion.div>
  );
};

import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { useReducedMotion } from '../hooks/useReducedMotion';

export const MicroFactCard = ({ fact }) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      data-testid="micro-fact-card"
      initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.96 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
      className="p-4 relative overflow-hidden"
      style={{
        background: 'var(--light-gray)',
        borderLeft: '3px solid var(--accent)',
        borderRadius: 14,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb size={16} style={{ color: 'var(--accent)' }} aria-hidden="true" />
        <span style={{
          fontFamily: 'var(--font)', fontSize: 11, fontWeight: 600,
          letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--accent)',
        }}>
          Quick Fact
        </span>
      </div>
      <p style={{
        fontFamily: 'var(--font)', fontSize: 13, fontWeight: 400,
        color: 'var(--text-color)', lineHeight: '18px', margin: 0,
      }}>
        {fact.fact}
      </p>
    </motion.div>
  );
};

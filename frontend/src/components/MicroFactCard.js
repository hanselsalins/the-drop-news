import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

export const MicroFactCard = ({ fact }) => {
  const { band } = useTheme();
  const isDark = band === 'sharp-aware' || band === 'editorial';

  return (
    <motion.div
      data-testid="micro-fact-card"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 relative overflow-hidden"
      style={{
        background: isDark ? 'var(--drop-surface)' : '#F0FDF4',
        border: isDark ? '1px solid var(--drop-border)' : '1.5px solid #BBF7D0',
        borderLeft: isDark ? '3px solid #10B981' : '5px solid #10B981',
        borderRadius: 'var(--drop-radius-card, 18px)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span style={{ fontSize: 18 }}>💡</span>
        <span
          className="text-[10px] font-bold tracking-wider uppercase"
          style={{ fontFamily: 'var(--drop-font-body)', color: '#10B981' }}
        >
          Quick Fact
        </span>
      </div>
      <p
        className="text-xs leading-relaxed italic"
        style={{
          fontFamily: 'var(--drop-font-body)',
          color: isDark ? 'var(--drop-text)' : '#065F46',
        }}
      >
        {fact.fact}
      </p>
    </motion.div>
  );
};

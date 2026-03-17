import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

export const MicroFactCard = ({ fact }) => {
  const { band } = useTheme();
  const isDark = band === 'sharp-aware' || band === 'editorial';
  const isBand1 = band === 'big-bold-bright';

  const accentColor = '#10B981';

  return (
    <motion.div
      data-testid="micro-fact-card"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 relative overflow-hidden"
      style={{
        background: isDark ? 'var(--drop-surface)' : (isBand1 ? '#F0FFF4' : '#F0FDF4'),
        border: isDark ? `1px solid var(--drop-border)` : '1.5px solid #BBF7D0',
        borderLeft: `${isBand1 ? 5 : 3}px solid ${accentColor}`,
        borderRadius: 'var(--drop-radius-card, 18px)',
        boxShadow: isBand1 ? '4px 4px 0px 0px #A7F3D0' : 'var(--drop-shadow-card)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        {band !== 'sharp-aware' && <span style={{ fontSize: 18 }}>💡</span>}
        <span
          className="text-[10px] font-bold tracking-wider uppercase"
          style={{
            fontFamily: band === 'sharp-aware' ? 'var(--drop-font-heading)' : 'var(--drop-font-body)',
            color: accentColor,
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
          color: isDark ? 'var(--drop-text)' : '#065F46',
          fontSize: isBand1 ? 14 : 12,
          fontStyle: band === 'sharp-aware' ? 'normal' : 'italic',
        }}
      >
        {fact.fact}
      </p>
    </motion.div>
  );
};
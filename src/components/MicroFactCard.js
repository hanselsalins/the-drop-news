import { motion } from 'framer-motion';

const CATEGORY_COLORS = {
  world: '#3B82F6',
  science: '#10B981',
  sports: '#F97316',
  tech: '#8B5CF6',
  environment: '#14B8A6',
  weird: '#F59E0B',
  entertainment: '#EC4899',
};

export const MicroFactCard = ({ fact }) => {
  const borderColor = CATEGORY_COLORS[fact.category] || '#3B82F6';

  return (
    <motion.div
      data-testid="micro-fact-card"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-5 rounded-2xl relative overflow-hidden"
      style={{
        background: '#111827',
        borderLeft: `4px solid ${borderColor}`,
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      }}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <span className="text-lg">💡</span>
        <span
          className="text-[11px] font-semibold tracking-wider uppercase"
          style={{
            fontFamily: 'Outfit, sans-serif',
            color: borderColor,
          }}
        >
          Did You Know?
        </span>
      </div>
      <p
        className="text-sm leading-relaxed italic"
        style={{ fontFamily: 'Outfit, sans-serif', color: '#CBD5E1' }}
      >
        {fact.fact}
      </p>
    </motion.div>
  );
};

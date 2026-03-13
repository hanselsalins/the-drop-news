import { motion } from 'framer-motion';

export const MicroFactCard = ({ fact }) => {
  return (
    <motion.div
      data-testid="micro-fact-card"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 relative overflow-hidden"
      style={{
        background: '#F0FDF4',
        border: '1.5px solid #BBF7D0',
        borderLeft: '5px solid #10B981',
        borderRadius: '18px',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span style={{ fontSize: 18 }}>💡</span>
        <span
          className="text-[10px] font-bold tracking-wider uppercase"
          style={{ fontFamily: 'Outfit, sans-serif', color: '#10B981' }}
        >
          Quick Fact
        </span>
      </div>
      <p
        className="text-xs leading-relaxed italic"
        style={{ fontFamily: 'Outfit, sans-serif', color: '#065F46' }}
      >
        {fact.fact}
      </p>
    </motion.div>
  );
};

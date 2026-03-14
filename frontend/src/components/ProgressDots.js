import { motion } from 'framer-motion';

export const ProgressDots = ({ articleIds, readArticleIds }) => {
  const total = 5;
  const dots = Array.from({ length: total }, (_, i) => {
    const articleId = articleIds[i];
    return articleId ? readArticleIds.has(String(articleId)) : false;
  });
  const allRead = dots.every(Boolean) && articleIds.length === total;

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div className="flex items-center gap-2.5">
        {dots.map((filled, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: filled
                ? 'linear-gradient(135deg, #3B82F6, #8B5CF6)'
                : '#E2E8F0',
              boxShadow: filled
                ? '0 2px 8px rgba(99,102,241,0.35)'
                : 'none',
              transition: 'background 0.3s, box-shadow 0.3s',
            }}
          />
        ))}
      </div>

      {allRead && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center px-4"
        >
          <p
            className="text-sm font-semibold"
            style={{
              fontFamily: 'Fredoka, sans-serif',
              background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            You're all caught up for today 🎉
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ fontFamily: 'Outfit, sans-serif', color: '#94A3B8' }}
          >
            See you tomorrow
          </p>
        </motion.div>
      )}
    </div>
  );
};

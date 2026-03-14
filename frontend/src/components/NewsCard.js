import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const CATEGORY_COLORS = {
  world: '#3B82F6',
  science: '#10B981',
  sports: '#F97316',
  tech: '#8B5CF6',
  environment: '#14B8A6',
  'weird & wonderful': '#F59E0B',
  weird: '#F59E0B',
  entertainment: '#EC4899',
  money: '#F59E0B',
  history: '#F97316',
  local: '#14B8A6',
};

const CATEGORY_LIGHT_BG = {
  world: '#EFF6FF',
  science: '#ECFDF5',
  sports: '#FFF7ED',
  tech: '#F5F3FF',
  environment: '#F0FDFA',
  'weird & wonderful': '#FFFBEB',
  weird: '#FFFBEB',
  entertainment: '#FDF2F8',
  money: '#FFFBEB',
  history: '#FFF7ED',
  local: '#F0FDFA',
};

const CATEGORY_GRADIENTS = {
  world: 'linear-gradient(135deg, #60A5FA, #2563EB)',
  science: 'linear-gradient(135deg, #34D399, #059669)',
  sports: 'linear-gradient(135deg, #FB923C, #EA580C)',
  tech: 'linear-gradient(135deg, #A78BFA, #7C3AED)',
  environment: 'linear-gradient(135deg, #2DD4BF, #0D9488)',
  'weird & wonderful': 'linear-gradient(135deg, #FBBF24, #D97706)',
  weird: 'linear-gradient(135deg, #FBBF24, #D97706)',
  entertainment: 'linear-gradient(135deg, #F472B6, #DB2777)',
  money: 'linear-gradient(135deg, #FBBF24, #D97706)',
  history: 'linear-gradient(135deg, #FB923C, #EA580C)',
  local: 'linear-gradient(135deg, #2DD4BF, #0D9488)',
};

const CATEGORY_EMOJI = {
  world: '🌍',
  science: '🔬',
  sports: '⚽',
  tech: '💻',
  environment: '🌱',
  'weird & wonderful': '🦄',
  weird: '🦄',
  entertainment: '🎬',
  money: '💰',
  history: '📜',
  local: '📍',
};

const CATEGORY_LABELS = {
  world: 'World',
  science: 'Science',
  sports: 'Sports',
  tech: 'Tech',
  environment: 'Environment',
  'weird & wonderful': 'Weird & Wonderful',
  weird: 'Weird & Wonderful',
  entertainment: 'Entertainment',
  money: 'Money',
  history: 'History',
  local: 'Local',
};

export const NewsCard = ({ article }) => {
  const navigate = useNavigate();
  const rw = article.rewrite;
  const title = rw?.title || article.original_title;
  const catColor = CATEGORY_COLORS[article.category] || '#3B82F6';
  const lightBg = CATEGORY_LIGHT_BG[article.category] || '#EFF6FF';
  const gradient = CATEGORY_GRADIENTS[article.category] || CATEGORY_GRADIENTS.world;
  const emoji = CATEGORY_EMOJI[article.category] || '📰';

  return (
    <motion.div
      data-testid={`news-card-${article.id}`}
      onClick={() => navigate(`/article/${article.id}`)}
      role="button"
      tabIndex={0}
      whileTap={{ scale: 0.98 }}
      className="w-full overflow-hidden cursor-pointer flex"
      style={{
        borderRadius: '18px',
        background: '#FFFFFF',
        border: '1.5px solid #E2E8F0',
        boxShadow: `0 2px 8px ${catColor}14`,
      }}
    >
      {/* Left content */}
      <div className="flex-1 flex flex-col justify-center" style={{ padding: '13px 12px 13px 14px' }}>
        {/* Category pill */}
        <div className="flex items-center gap-1.5 mb-2">
          <span
            className="inline-block shrink-0"
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: catColor,
            }}
          />
          <span
            className="text-[10px] font-bold tracking-wider uppercase"
            style={{ fontFamily: 'Outfit, sans-serif', color: catColor }}
          >
            {CATEGORY_LABELS[article.category] || article.category}
          </span>
        </div>

        {/* Headline */}
        <h3
          className="font-bold leading-snug mb-2 line-clamp-3"
          style={{
            fontFamily: 'Fredoka, sans-serif',
            color: '#0F172A',
            fontSize: '14px',
            lineHeight: 1.35,
            fontWeight: 700,
          }}
        >
          {title}
        </h3>

        {/* Source row */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px]" style={{ fontFamily: 'Outfit, sans-serif', color: '#94A3B8' }}>
            {article.source}
          </span>
          {rw?.reading_time && (
            <span className="text-[11px]" style={{ fontFamily: 'Outfit, sans-serif', color: '#94A3B8' }}>
              · {rw.reading_time}
            </span>
          )}
        </div>
      </div>

      {/* Right emoji thumbnail */}
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          width: 90,
          background: gradient,
          borderRadius: '0 16px 16px 0',
        }}
      >
        <span style={{ fontSize: 40 }}>{emoji}</span>
      </div>
    </motion.div>
  );
};

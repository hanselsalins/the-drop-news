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

  return (
    <motion.div
      data-testid={`news-card-${article.id}`}
      onClick={() => navigate(`/article/${article.id}`)}
      role="button"
      tabIndex={0}
      whileTap={{ scale: 0.98 }}
      className="w-full text-left overflow-hidden cursor-pointer"
      style={{
        borderRadius: '20px',
        background: '#111827',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03)',
      }}
    >
      {/* Image - large top half */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={article.image_url}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => { e.target.style.background = catColor + '22'; e.target.src = ''; }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, #111827 0%, rgba(17,24,39,0.4) 40%, transparent 70%)',
          }}
        />
        {/* Category pill */}
        <span
          className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase"
          style={{
            fontFamily: 'Outfit, sans-serif',
            background: catColor,
            color: ['#F59E0B', '#10B981', '#14B8A6'].includes(catColor) ? '#0A0E1A' : '#fff',
            boxShadow: `0 2px 12px ${catColor}44`,
          }}
        >
          {CATEGORY_LABELS[article.category] || article.category}
        </span>
      </div>

      {/* Content */}
      <div className="px-5 pb-5 -mt-4 relative z-10">
        <h3
          className="font-bold leading-snug mb-3"
          style={{
            fontFamily: 'Fredoka, sans-serif',
            color: '#F1F5F9',
            fontSize: '1.35rem',
            lineHeight: 1.3,
          }}
        >
          {title}
        </h3>

        {/* Source row */}
        <div className="flex items-center gap-2.5">
          {article.source_logo && (
            <img
              src={article.source_logo}
              alt={article.source}
              className="w-4 h-4 rounded object-contain opacity-60"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
          <span className="text-xs" style={{ fontFamily: 'Outfit, sans-serif', color: '#64748B' }}>
            {article.source}
          </span>
          {rw?.reading_time && (
            <span className="text-xs" style={{ fontFamily: 'Outfit, sans-serif', color: '#475569' }}>
              · {rw.reading_time}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

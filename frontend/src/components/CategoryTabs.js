import { light } from '../lib/haptic';

const CATEGORY_EMOJIS = {
  today: '📰',
  world: '🌍',
  power: '⚡',
  money: '💰',
  tech: '💻',
  sports: '🏆',
  entertainment: '🎬',
  environment: '🌿',
};

export const CategoryTabs = ({ categories, activeCategory, setActiveCategory }) => {
  const handleTabClick = (catId) => {
    light();
    setActiveCategory(catId);
  };

  return (
    <div
      className="w-full overflow-x-auto scrollbar-hide"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div className="flex gap-2 px-4 py-3 min-w-max">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          const emoji = CATEGORY_EMOJIS[cat.id] || '';

          return (
            <button
              key={cat.id}
              data-testid={`category-tab-${cat.id}`}
              onClick={() => handleTabClick(cat.id)}
              className="shrink-0 whitespace-nowrap cursor-pointer transition-all duration-200"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                padding: '6px 14px',
                borderRadius: 8,
                background: isActive ? 'var(--accent-blue)' : 'var(--card-dark)',
                color: isActive ? '#FFFFFF' : 'var(--body-light)',
                border: 'none',
              }}
            >
              {emoji ? `${emoji} ` : ''}{cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};

import { light } from '../lib/haptic';

const CATEGORY_IMAGES = {
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
      className="w-full overflow-x-auto"
      style={{ WebkitOverflowScrolling: 'touch', padding: '15px 0' }}
    >
      <div className="flex gap-5 px-4 min-w-max items-start">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          const emoji = CATEGORY_IMAGES[cat.id] || '📰';

          return (
            <button
              key={cat.id}
              data-testid={`category-tab-${cat.id}`}
              onClick={() => handleTabClick(cat.id)}
              className="flex flex-col items-center gap-1.5 cursor-pointer"
              style={{ background: 'none', border: 'none', minWidth: 56 }}
            >
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                border: isActive ? '2px solid var(--accent)' : '2px solid var(--light-gray)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                background: 'var(--category-circle-bg, var(--surface))',
                transition: 'border-color 0.2s',
              }}>
                {emoji}
              </div>
              <span style={{
                fontFamily: 'var(--font)',
                fontSize: 12,
                fontWeight: 500,
                color: isActive ? 'var(--accent)' : 'var(--title-color)',
                textAlign: 'center',
              }}>
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const CATEGORY_COLORS = {
  today: '#3B82F6',
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
  all: '#EFF6FF',
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

export const CategoryTabs = ({ categories, activeCategory, setActiveCategory }) => {
  return (
    <div
      className="w-full overflow-x-auto scrollbar-hide"
      style={{
        background: '#FFFFFF',
        borderBottom: '1.5px solid #F1F5F9',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div className="flex gap-2 px-4 py-3 min-w-max">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          const color = CATEGORY_COLORS[cat.id] || '#3B82F6';
          const lightBg = CATEGORY_LIGHT_BG[cat.id] || '#EFF6FF';
          return (
            <button
              key={cat.id}
              data-testid={`category-tab-${cat.id}`}
              onClick={() => setActiveCategory(cat.id)}
              className="shrink-0 px-4 py-2 text-xs font-semibold tracking-wide uppercase whitespace-nowrap transition-all duration-200"
              style={{
                fontFamily: 'Outfit, sans-serif',
                borderRadius: '20px',
                background: isActive ? color : lightBg,
                color: isActive ? '#FFFFFF' : color,
                fontWeight: isActive ? 700 : 600,
                border: 'none',
              }}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};

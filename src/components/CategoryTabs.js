const CATEGORY_COLORS = {
  all: '#3B82F6',
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

export const CategoryTabs = ({ categories, activeCategory, setActiveCategory }) => {
  const allCategories = [{ id: 'all', name: 'For You' }, ...categories];

  return (
    <div className="w-full overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="flex gap-2.5 pb-1 min-w-max pr-4">
        {allCategories.map((cat) => {
          const isActive = activeCategory === cat.id;
          const color = CATEGORY_COLORS[cat.id] || '#3B82F6';
          return (
            <button
              key={cat.id}
              data-testid={`category-tab-${cat.id}`}
              onClick={() => setActiveCategory(cat.id)}
              className="shrink-0 px-4 py-2 text-xs font-semibold tracking-wide uppercase whitespace-nowrap transition-all duration-200"
              style={{
                fontFamily: 'Outfit, sans-serif',
                borderRadius: '999px',
                background: isActive ? color : 'rgba(255,255,255,0.04)',
                color: isActive
                  ? (['#F59E0B', '#10B981', '#14B8A6'].includes(color) ? '#0A0E1A' : '#fff')
                  : '#64748B',
                border: isActive ? 'none' : '1px solid rgba(255,255,255,0.08)',
                boxShadow: isActive ? `0 2px 16px ${color}33` : 'none',
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

import { useTheme } from '../contexts/ThemeContext';
import { getCategoryColor } from '../lib/bandUtils';
import { motion } from 'framer-motion';
import { light } from '../lib/haptic';

export const CategoryTabs = ({ categories, activeCategory, setActiveCategory }) => {
  const { band } = useTheme();
  const isDark = band === 'sharp-aware' || band === 'editorial';
  const isBand2 = band === 'cool-connected';

  const handleTabClick = (catId) => {
    light();
    setActiveCategory(catId);
  };

  return (
    <div
      className="w-full overflow-x-auto scrollbar-hide"
      style={{
        background: isDark ? 'var(--drop-surface)' : 'var(--drop-surface)',
        borderBottom: `1.5px solid var(--drop-border)`,
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div className="flex gap-2 px-4 py-3 min-w-max">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          const color = getCategoryColor(cat.id, band);

          // Band 3: no pill badges, ALL CAPS dot separators
          if (band === 'sharp-aware') {
            return (
              <button
                key={cat.id}
                data-testid={`category-tab-${cat.id}`}
                onClick={() => handleTabClick(cat.id)}
                className="shrink-0 px-3 py-2 text-[11px] font-semibold tracking-[0.08em] uppercase whitespace-nowrap transition-all duration-200"
                style={{
                  fontFamily: 'var(--drop-font-heading)',
                  borderRadius: 6,
                  background: isActive ? 'var(--drop-surface-hover, #352F80)' : 'transparent',
                  color: isActive ? 'var(--drop-text)' : 'var(--drop-text-muted)',
                  border: isActive ? '1px solid var(--drop-border)' : '1px solid transparent',
                }}
              >
                {cat.name}
              </button>
            );
          }

          // Band 4: minimal rectangular tabs
          if (band === 'editorial') {
            return (
              <button
                key={cat.id}
                data-testid={`category-tab-${cat.id}`}
                onClick={() => handleTabClick(cat.id)}
                className="shrink-0 px-3 py-2 text-[11px] font-medium tracking-wide uppercase whitespace-nowrap transition-all duration-200"
                style={{
                  fontFamily: 'var(--drop-font-heading)',
                  borderRadius: 6,
                  background: isActive ? `${color}20` : 'transparent',
                  color: isActive ? color : 'var(--drop-text-muted)',
                  borderBottom: isActive ? `2px solid ${color}` : '2px solid transparent',
                }}
              >
                {cat.name}
              </button>
            );
          }

          // Bands 1 & 2: pill badges — Band 2 gets squishy motion
          if (isBand2) {
            return (
              <motion.button
                key={cat.id}
                data-testid={`category-tab-${cat.id}`}
                onClick={() => handleTabClick(cat.id)}
                whileTap={{ scale: 0.93, scaleY: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className="shrink-0 px-4 py-2 text-xs font-semibold tracking-wide uppercase whitespace-nowrap transition-colors duration-200"
                style={{
                  fontFamily: 'var(--drop-font-body)',
                  borderRadius: 20,
                  background: isActive ? color : `${color}12`,
                  color: isActive ? '#FFFFFF' : color,
                  fontWeight: isActive ? 700 : 600,
                }}
              >
                {cat.name}
              </motion.button>
            );
          }

          // Band 1: pill badges (no motion tap)
          return (
            <button
              key={cat.id}
              data-testid={`category-tab-${cat.id}`}
              onClick={() => handleTabClick(cat.id)}
              className="shrink-0 px-4 py-2 text-xs font-semibold tracking-wide uppercase whitespace-nowrap transition-all duration-200"
              style={{
                fontFamily: 'var(--drop-font-heading)',
                borderRadius: 999,
                background: isActive ? color : `${color}12`,
                color: isActive ? '#FFFFFF' : color,
                fontWeight: isActive ? 700 : 600,
                border: !isActive ? `2px solid ${color}40` : 'none',
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

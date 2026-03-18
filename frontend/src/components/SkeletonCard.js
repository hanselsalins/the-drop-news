import { useTheme } from '../contexts/ThemeContext';

const BAND_CONFIG = {
  'big-bold-bright': { radius: 28, barHeight: 16, bars: 3, showThumb: true, border: '3px solid var(--drop-border)' },
  'cool-connected': { radius: 22, barHeight: 12, bars: 3, showThumb: true, border: '1.5px solid var(--drop-border)' },
  'sharp-aware': { radius: 8, barHeight: 10, bars: 3, showThumb: false, border: '1px solid var(--drop-border)' },
  'editorial': { radius: 14, barHeight: 10, bars: 3, showThumb: true, border: '1px solid var(--drop-border)' },
};

export function SkeletonCard() {
  const { band } = useTheme();
  const config = BAND_CONFIG[band] || BAND_CONFIG['editorial'];

  return (
    <div
      className="w-full overflow-hidden flex"
      style={{
        background: 'var(--drop-surface)',
        borderRadius: config.radius,
        border: config.border,
        boxShadow: 'var(--drop-shadow-card, none)',
        minHeight: 100,
      }}
    >
      {/* Text area */}
      <div className="flex-1 flex flex-col justify-center gap-2" style={{ padding: '13px 12px 13px 14px' }}>
        {/* Category shimmer */}
        <div className="skeleton-shimmer" style={{ width: 60, height: 8, borderRadius: 4 }} />
        {/* Title bars */}
        {Array.from({ length: config.bars }).map((_, i) => (
          <div
            key={i}
            className="skeleton-shimmer"
            style={{
              width: i === config.bars - 1 ? '60%' : '100%',
              height: config.barHeight,
              borderRadius: config.barHeight / 2,
            }}
          />
        ))}
        {/* Source shimmer */}
        <div className="skeleton-shimmer" style={{ width: 80, height: 8, borderRadius: 4, marginTop: 4 }} />
      </div>

      {/* Thumbnail shimmer */}
      {config.showThumb && (
        <div
          className="skeleton-shimmer shrink-0"
          style={{
            width: 90,
            borderRadius: `0 ${config.radius}px ${config.radius}px 0`,
          }}
        />
      )}
    </div>
  );
}

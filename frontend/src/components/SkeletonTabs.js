import { useTheme } from '../contexts/ThemeContext';

export function SkeletonTabs() {
  const { band } = useTheme();
  const pillRadius = (band === 'big-bold-bright' || band === 'cool-connected') ? 999 : 6;
  const widths = [48, 64, 56, 72, 52, 60];

  return (
    <div
      className="flex gap-2 overflow-hidden px-4 py-3"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {widths.map((w, i) => (
        <div
          key={i}
          className="skeleton-shimmer shrink-0"
          style={{
            width: w,
            height: 32,
            borderRadius: pillRadius,
          }}
        />
      ))}
    </div>
  );
}

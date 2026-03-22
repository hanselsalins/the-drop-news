export function SkeletonTabs() {
  const items = [64, 64, 64, 64, 64, 64];

  return (
    <div className="flex gap-5 overflow-hidden px-4 py-4" style={{ WebkitOverflowScrolling: 'touch' }}>
      {items.map((w, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5">
          <div className="skeleton-shimmer" style={{ width: w, height: w, borderRadius: '50%' }} />
          <div className="skeleton-shimmer" style={{ width: 40, height: 8, borderRadius: 4 }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="shrink-0 overflow-hidden relative"
      style={{ width: 200, height: 260, background: 'var(--light-gray)', borderRadius: 18 }}>
      <div className="skeleton-shimmer" style={{ width: '100%', height: '55%' }} />
      <div style={{ padding: '10px 12px' }}>
        <div className="skeleton-shimmer" style={{ width: 60, height: 10, borderRadius: 5 }} />
        <div className="skeleton-shimmer" style={{ width: '90%', height: 12, borderRadius: 6, marginTop: 8 }} />
        <div className="skeleton-shimmer" style={{ width: '60%', height: 12, borderRadius: 6, marginTop: 6 }} />
      </div>
    </div>
  );
}

export function HeroSkeletonCard() {
  return (
    <div className="w-full overflow-hidden relative"
      style={{ borderRadius: 18, background: 'var(--light-gray)', aspectRatio: '16/10' }}>
      <div className="skeleton-shimmer absolute inset-0" />
      <div className="absolute bottom-4 left-4 right-4">
        <div className="skeleton-shimmer" style={{ width: 60, height: 10, borderRadius: 5 }} />
        <div className="skeleton-shimmer" style={{ width: '80%', height: 16, borderRadius: 6, marginTop: 8 }} />
        <div className="skeleton-shimmer" style={{ width: '50%', height: 12, borderRadius: 6, marginTop: 6 }} />
      </div>
    </div>
  );
}

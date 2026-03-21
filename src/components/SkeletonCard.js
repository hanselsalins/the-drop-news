export function SkeletonCard() {
  return (
    <div
      className="w-full overflow-hidden flex"
      style={{
        height: 113,
        background: 'var(--card-dark)',
        borderRadius: 14,
      }}
    >
      <div className="shrink-0 flex items-center justify-center" style={{ padding: 12 }}>
        <div className="skeleton-shimmer" style={{ width: 100, height: 89, borderRadius: 10, flexShrink: 0 }} />
      </div>
      <div className="flex-1 flex flex-col justify-center min-w-0" style={{ padding: '12px 12px 12px 0' }}>
        <div className="skeleton-shimmer" style={{ width: 60, height: 8, borderRadius: 4 }} />
        <div className="skeleton-shimmer" style={{ width: '100%', height: 12, borderRadius: 6, marginTop: 8 }} />
        <div className="skeleton-shimmer" style={{ width: '80%', height: 12, borderRadius: 6, marginTop: 6 }} />
      </div>
    </div>
  );
}

export function HeroSkeletonCard() {
  return (
    <div
      className="shrink-0 overflow-hidden relative"
      style={{ width: 252, height: 272, background: 'var(--card-dark)', borderRadius: 18 }}
    >
      <div className="skeleton-shimmer absolute inset-0" />
      <div className="absolute bottom-4 left-4 right-4">
        <div className="skeleton-shimmer" style={{ width: '80%', height: 14, borderRadius: 6 }} />
        <div className="skeleton-shimmer" style={{ width: '50%', height: 14, borderRadius: 6, marginTop: 6 }} />
      </div>
    </div>
  );
}

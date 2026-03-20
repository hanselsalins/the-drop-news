export function SkeletonCard() {
  return (
    <div
      className="w-full overflow-hidden flex"
      style={{
        height: 134,
        background: '#FFFFFF',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        padding: 0,
      }}
    >
      {/* Left image placeholder */}
      <div className="shrink-0 flex items-center justify-center" style={{ padding: 12 }}>
        <div
          className="skeleton-shimmer"
          style={{ width: 110, height: 110, borderRadius: 8, flexShrink: 0 }}
        />
      </div>

      {/* Right text column */}
      <div className="flex-1 flex flex-col justify-center min-w-0" style={{ padding: '12px 12px 12px 0' }}>
        <div className="skeleton-shimmer" style={{ width: 60, height: 8, borderRadius: 4 }} />
        <div className="skeleton-shimmer" style={{ width: '100%', height: 12, borderRadius: 6, marginTop: 8 }} />
        <div className="skeleton-shimmer" style={{ width: '80%', height: 12, borderRadius: 6, marginTop: 6 }} />
        <div className="skeleton-shimmer" style={{ width: '50%', height: 10, borderRadius: 5, marginTop: 8 }} />
      </div>
    </div>
  );
}

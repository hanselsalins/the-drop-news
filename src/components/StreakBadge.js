import { Trophy } from 'lucide-react';

export const StreakBadge = ({ currentStreak, longestStreak, readToday, variant = 'compact' }) => {
  if (variant === 'compact') {
    return (
      <div
        data-testid="streak-badge"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
        style={{
          background: 'rgba(245,158,11,0.12)',
          border: readToday
            ? '1.5px solid rgba(245,158,11,0.3)'
            : '1px dashed rgba(245,158,11,0.2)',
          boxShadow: readToday ? '0 0 12px rgba(245,158,11,0.15)' : 'none',
        }}
      >
        <span className="text-sm">🔥</span>
        <span
          className="text-xs font-bold"
          style={{
            fontFamily: 'Outfit, sans-serif',
            color: '#F59E0B',
          }}
        >
          {currentStreak > 0 ? currentStreak : 'Start!'}
        </span>
      </div>
    );
  }

  return (
    <div
      data-testid="streak-badge-full"
      className="p-5 rounded-2xl"
      style={{
        background: '#111827',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: 'rgba(245,158,11,0.12)' }}
          >
            🔥
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-wider uppercase"
              style={{ fontFamily: 'Outfit, sans-serif', color: '#64748B' }}>
              READING STREAK
            </p>
            <p className="text-2xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif', color: '#F59E0B' }}>
              {currentStreak} day{currentStreak !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
          style={{ background: 'rgba(139,92,246,0.1)' }}>
          <Trophy size={12} style={{ color: '#8B5CF6' }} />
          <span className="text-[10px] font-bold"
            style={{ fontFamily: 'Outfit, sans-serif', color: '#8B5CF6' }}>
            Best: {longestStreak}
          </span>
        </div>
      </div>
      {!readToday && currentStreak > 0 && (
        <p className="text-xs mt-3"
          style={{ fontFamily: 'Outfit, sans-serif', color: '#64748B' }}>
          Read a story today to keep your streak going!
        </p>
      )}
    </div>
  );
};

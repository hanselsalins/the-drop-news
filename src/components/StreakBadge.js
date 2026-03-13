import { Trophy } from 'lucide-react';

export const StreakBadge = ({ currentStreak, longestStreak, readToday, variant = 'compact' }) => {
  if (variant === 'compact') {
    return (
      <div
        data-testid="streak-badge"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
        style={{
          background: 'rgba(255,255,255,0.2)',
        }}
      >
        <span className="text-sm">🔥</span>
        <span
          className="text-xs font-bold"
          style={{
            fontFamily: 'Outfit, sans-serif',
            color: '#FFFFFF',
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
      className="p-5"
      style={{
        borderRadius: 18,
        background: '#FFFFFF',
        border: '1.5px solid #E2E8F0',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 flex items-center justify-center text-2xl"
            style={{ background: '#FFFBEB', borderRadius: 14 }}
          >
            🔥
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-wider uppercase"
              style={{ fontFamily: 'Outfit, sans-serif', color: '#94A3B8' }}>
              READING STREAK
            </p>
            <p className="text-2xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif', color: '#F59E0B' }}>
              {currentStreak} day{currentStreak !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5"
          style={{ background: '#F5F3FF', borderRadius: 12 }}>
          <Trophy size={12} style={{ color: '#8B5CF6' }} />
          <span className="text-[10px] font-bold"
            style={{ fontFamily: 'Outfit, sans-serif', color: '#8B5CF6' }}>
            Best: {longestStreak}
          </span>
        </div>
      </div>
      {!readToday && currentStreak > 0 && (
        <p className="text-xs mt-3"
          style={{ fontFamily: 'Outfit, sans-serif', color: '#94A3B8' }}>
          Read a story today to keep your streak going!
        </p>
      )}
    </div>
  );
};

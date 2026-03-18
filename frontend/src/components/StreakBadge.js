import { Trophy, Flame } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export const StreakBadge = ({ currentStreak, longestStreak, readToday, variant = 'compact' }) => {
  const { band } = useTheme();
  const isDark = band === 'sharp-aware' || band === 'editorial';

  if (variant === 'compact') {
    return (
      <div
        data-testid="streak-badge"
        aria-label={`Reading streak: ${currentStreak} days`}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
        style={{ background: 'rgba(255,255,255,0.2)' }}
      >
        <Flame size={14} color="#F59E0B" />
        <span className="text-xs font-bold"
          style={{ fontFamily: 'var(--drop-font-body)', color: '#FFFFFF' }}>
          {currentStreak > 0 ? currentStreak : 'Start!'}
        </span>
      </div>
    );
  }

  return (
    <div
      data-testid="streak-badge-full"
      aria-label={`Reading streak: ${currentStreak} days, best: ${longestStreak} days`}
      className="p-5"
      style={{
        borderRadius: 'var(--drop-radius-card, 18px)',
        background: 'var(--drop-surface)',
        border: `1px solid var(--drop-border)`,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 flex items-center justify-center"
            style={{ background: isDark ? 'rgba(245,158,11,0.1)' : '#FFFBEB', borderRadius: 14 }}>
            <Flame size={24} color="#F59E0B" />
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-wider uppercase"
              style={{ fontFamily: 'var(--drop-font-body)', color: 'var(--drop-text-muted)' }}>
              READING STREAK
            </p>
            <p className="text-2xl font-bold" style={{ fontFamily: 'var(--drop-font-heading)', color: '#F59E0B' }}>
              {currentStreak} day{currentStreak !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5"
          style={{ background: isDark ? 'rgba(139,92,246,0.1)' : '#F5F3FF', borderRadius: 12 }}>
          <Trophy size={12} style={{ color: '#8B5CF6' }} />
          <span className="text-[10px] font-bold"
            style={{ fontFamily: 'var(--drop-font-body)', color: '#8B5CF6' }}>
            Best: {longestStreak}
          </span>
        </div>
      </div>
      {!readToday && currentStreak > 0 && (
        <p className="text-xs mt-3"
          style={{ fontFamily: 'var(--drop-font-body)', color: 'var(--drop-text-muted)' }}>
          Read a story today to keep your streak going!
        </p>
      )}
    </div>
  );
};

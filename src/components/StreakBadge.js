import { F7Icon } from './F7Icon';

export const StreakBadge = ({ currentStreak, longestStreak, readToday, variant = 'compact' }) => {
  if (variant === 'compact') {
    return (
      <div
        data-testid="streak-badge"
        aria-label={`Reading streak: ${currentStreak} days`}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
        style={{ background: 'var(--light-gray)' }}
      >
        <F7Icon name="flame_fill" size={14} color="var(--accent)" />
        <span style={{ fontFamily: 'var(--font)', fontSize: 12, fontWeight: 700, color: 'var(--title-color)' }}>
          {currentStreak > 0 ? currentStreak : 'Start!'}
        </span>
      </div>
    );
  }

  return (
    <div data-testid="streak-badge-full" aria-label={`Reading streak: ${currentStreak} days, best: ${longestStreak} days`}
      className="p-5" style={{ borderRadius: 14, background: 'var(--light-gray)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 flex items-center justify-center"
            style={{ background: 'rgba(255,107,0,0.1)', borderRadius: 12 }}>
            <F7Icon name="flame_fill" size={24} color="var(--accent)" />
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font)', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-color)' }}>
              READING STREAK
            </p>
            <p style={{ fontFamily: 'var(--font)', fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>
              {currentStreak} day{currentStreak !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5" style={{ background: 'rgba(255,107,0,0.06)', borderRadius: 10 }}>
          <F7Icon name="rosette" size={12} color="var(--accent)" />
          <span style={{ fontFamily: 'var(--font)', fontSize: 11, fontWeight: 600, color: 'var(--accent)' }}>
            Best: {longestStreak}
          </span>
        </div>
      </div>
      {!readToday && currentStreak > 0 && (
        <p style={{ fontFamily: 'var(--font)', fontSize: 12, fontWeight: 400, color: 'var(--text-color)', marginTop: 12 }}>
          Read a story today to keep your streak going!
        </p>
      )}
    </div>
  );
};

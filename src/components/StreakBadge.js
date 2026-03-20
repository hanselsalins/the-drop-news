import { Trophy, Flame } from 'lucide-react';

export const StreakBadge = ({ currentStreak, longestStreak, readToday, variant = 'compact' }) => {
  if (variant === 'compact') {
    return (
      <div
        data-testid="streak-badge"
        aria-label={`Reading streak: ${currentStreak} days`}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
        style={{ background: '#1B202F' }}
      >
        <Flame size={14} style={{ color: '#507AF9' }} />
        <span style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 12,
          fontWeight: 700,
          color: '#FFFFFF',
        }}>
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
        borderRadius: 14,
        background: '#1B202F',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 flex items-center justify-center"
            style={{ background: 'rgba(80,122,249,0.1)', borderRadius: 12 }}>
            <Flame size={24} style={{ color: '#507AF9' }} />
          </div>
          <div>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#828693',
            }}>
              READING STREAK
            </p>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 22,
              fontWeight: 700,
              color: '#507AF9',
            }}>
              {currentStreak} day{currentStreak !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5"
          style={{ background: 'rgba(116,201,235,0.1)', borderRadius: 10 }}>
          <Trophy size={12} style={{ color: '#74C9EB' }} />
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 11,
            fontWeight: 600,
            color: '#74C9EB',
          }}>
            Best: {longestStreak}
          </span>
        </div>
      </div>
      {!readToday && currentStreak > 0 && (
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 12,
          fontWeight: 400,
          color: '#828693',
          marginTop: 12,
        }}>
          Read a story today to keep your streak going!
        </p>
      )}
    </div>
  );
};

import { getMemojiById } from '../lib/memojis';

const AVATAR_COLORS = ['#FF6B00', '#4C35E8', '#19b48e', '#e2206e', '#0091de', '#9146da', '#e5b32d'];

function getColorForName(name) {
  if (!name) return AVATAR_COLORS[0];
  const index = (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/**
 * Reusable avatar component.
 * Shows memoji if avatarId is set, otherwise shows coloured initials circle.
 *
 * @param {string} name - user's display name (for initials + colour)
 * @param {string|null} avatarId - memoji id from localStorage/profile
 * @param {number} size - diameter in px (default 64)
 * @param {boolean} bordered - show orange border (default true)
 * @param {function} onClick - optional click handler
 * @param {object} style - additional styles
 */
export function AvatarCircle({ name, avatarId, size = 64, bordered = true, onClick, style = {} }) {
  const hasMemoji = !!avatarId;
  const memojiSrc = hasMemoji ? getMemojiById(avatarId) : null;
  const bg = getColorForName(name);
  const initials = getInitials(name);
  const fontSize = Math.round(size * 0.4);

  const circleStyle = {
    width: size,
    height: size,
    borderRadius: '50%',
    overflow: 'hidden',
    border: 'none',
    flexShrink: 0,
    padding: 0,
    background: hasMemoji ? 'var(--light-gray)' : bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: onClick ? 'pointer' : 'default',
    ...style,
  };

  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag onClick={onClick} style={circleStyle}>
      {hasMemoji ? (
        <img src={memojiSrc} alt={name || 'Avatar'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{
          fontFamily: 'Rubik, var(--font), sans-serif',
          fontWeight: 700,
          fontSize,
          color: '#ffffff',
          textTransform: 'uppercase',
          lineHeight: 1,
        }}>
          {initials}
        </span>
      )}
    </Tag>
  );
}

/** Helper to get avatarId from localStorage for a user */
export function getSavedAvatarId(userId) {
  return localStorage.getItem(`memoji_${userId || 'default'}`) || null;
}

import { useTheme } from '../contexts/ThemeContext';

export const ProfileButton = ({ onClick, size = 36 }) => {
  const { user } = useTheme();

  return (
    <button
      data-testid="profile-btn"
      onClick={onClick}
      className="flex-shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        padding: 2,
        background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          overflow: 'hidden',
          background: '#FFFFFF',
        }}
      >
        {user?.avatar_url ? (
          <img
            src={user.avatar_url}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
              color: '#FFFFFF',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: size * 0.4,
              fontWeight: 700,
            }}
          >
            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        )}
      </div>
    </button>
  );
};

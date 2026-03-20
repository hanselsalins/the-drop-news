import { useTheme } from '../contexts/ThemeContext';

export const ProfileButton = ({ onClick, size = 46 }) => {
  const { user } = useTheme();

  return (
    <button
      data-testid="profile-btn"
      onClick={onClick}
      className="flex-shrink-0 cursor-pointer"
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        background: '#1B202F',
        border: 'none',
        overflow: 'hidden',
      }}
    >
      {user?.avatar_url ? (
        <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            background: '#1B202F',
            color: '#507AF9',
            fontFamily: "'Inter', sans-serif",
            fontSize: size * 0.38,
            fontWeight: 700,
          }}
        >
          {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
      )}
    </button>
  );
};

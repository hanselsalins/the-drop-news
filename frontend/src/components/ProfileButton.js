import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

export const ProfileButton = ({ onClick, size = 30 }) => {
  const { user } = useTheme();
  const navigate = useNavigate();

  const handleClick = onClick || (() => navigate('/profile'));

  return (
    <button
      data-testid="profile-btn"
      onClick={handleClick}
      className="flex-shrink-0 cursor-pointer"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--surface)',
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
            background: 'var(--surface)',
            color: 'var(--accent)',
            fontFamily: 'var(--font)',
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

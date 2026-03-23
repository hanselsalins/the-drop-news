import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { getMemoji } from '../lib/memojis';

export const ProfileButton = ({ onClick, size = 40, bordered = false }) => {
  const { user } = useTheme();
  const navigate = useNavigate();

  const handleClick = onClick || (() => navigate('/profile'));
  const avatarSrc = user?.avatar_url || getMemoji(user?.full_name || user?.username);

  return (
    <button
      data-testid="profile-btn"
      onClick={handleClick}
      className="flex-shrink-0 cursor-pointer"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--light-gray)',
        border: bordered ? '2px solid var(--accent)' : 'none',
        overflow: 'hidden',
        padding: 0,
      }}
    >
      <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
    </button>
  );
};

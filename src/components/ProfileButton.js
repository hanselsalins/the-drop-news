import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { AvatarCircle, getSavedAvatarId } from './AvatarCircle';

export const ProfileButton = ({ onClick, size = 36, bordered = false }) => {
  const { user } = useTheme();
  const navigate = useNavigate();
  const handleClick = onClick || (() => navigate('/profile'));
  const avatarId = getSavedAvatarId(user?.id);

  return (
    <AvatarCircle
      name={user?.full_name || user?.username || ''}
      avatarId={avatarId}
      size={size}
      bordered={bordered}
      onClick={handleClick}
    />
  );
};

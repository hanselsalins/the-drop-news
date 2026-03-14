import { useNavigate } from 'react-router-dom';
import { Home, Compass, User } from 'lucide-react';

export const BottomNav = ({ active = 'home' }) => {
  const navigate = useNavigate();

  const items = [
    { id: 'home', icon: Home, label: 'Feed', path: '/feed' },
    { id: 'explore', icon: Compass, label: 'Explore', path: '/feed' },
    { id: 'streak', icon: null, label: 'Streak', path: '/feed', emoji: '🔥' },
    { id: 'profile', icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <nav
      data-testid="bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: '#FFFFFF',
        borderTop: '1.5px solid #F1F5F9',
      }}
    >
      <div className="max-w-md mx-auto flex items-center justify-around px-2 pt-2.5 pb-5">
        {items.map(({ id, icon: Icon, label, path, emoji }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              data-testid={`nav-${id}`}
              onClick={() => navigate(path)}
              className="flex flex-col items-center gap-1 py-1 px-3 transition-all duration-200"
            >
              <div
                className="flex items-center justify-center"
                style={{
                  background: isActive ? '#EFF6FF' : 'transparent',
                  borderRadius: 12,
                  padding: 6,
                }}
              >
                {emoji ? (
                  <span style={{ fontSize: 22 }}>{emoji}</span>
                ) : (
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    style={{ color: isActive ? '#3B82F6' : '#CBD5E1' }}
                  />
                )}
              </div>
              <span
                className="text-[10px]"
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  color: isActive ? '#3B82F6' : '#CBD5E1',
                  fontWeight: isActive ? 700 : 400,
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

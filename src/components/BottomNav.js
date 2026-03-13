import { useNavigate } from 'react-router-dom';
import { Home, Compass, Flame, User } from 'lucide-react';

export const BottomNav = ({ active = 'home' }) => {
  const navigate = useNavigate();

  const items = [
    { id: 'home', icon: Home, label: 'Feed', path: '/feed' },
    { id: 'explore', icon: Compass, label: 'Explore', path: '/feed' },
    { id: 'streak', icon: Flame, label: 'Streak', path: '/feed' },
    { id: 'profile', icon: User, label: 'Profile', path: '/profile' },
  ];

  const activeColor = '#3B82F6';
  const inactiveColor = '#475569';

  return (
    <nav
      data-testid="bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: '#0F1629',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 -4px 30px rgba(59,130,246,0.06)',
      }}
    >
      <div className="max-w-md mx-auto flex items-center justify-around px-2 pb-6 pt-3">
        {items.map(({ id, icon: Icon, label, path }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              data-testid={`nav-${id}`}
              onClick={() => navigate(path)}
              className="flex flex-col items-center gap-1 py-1 px-4 transition-all duration-200"
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.5}
                style={{ color: isActive ? activeColor : inactiveColor }}
              />
              {isActive && (
                <span
                  className="text-[10px] font-bold tracking-wide"
                  style={{
                    fontFamily: 'Outfit, sans-serif',
                    color: activeColor,
                  }}
                >
                  {label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

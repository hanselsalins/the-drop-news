import { useNavigate } from 'react-router-dom';
import { Home, Compass, User, Flame } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { light } from '../lib/haptic';

export const BottomNav = ({ active = 'home' }) => {
  const navigate = useNavigate();
  const { band } = useTheme();

  const items = [
    { id: 'home', icon: Home, label: 'Feed', path: '/feed' },
    { id: 'explore', icon: Compass, label: 'Explore', path: '/feed' },
    { id: 'streak', icon: Flame, label: 'Streak', path: '/feed' },
    { id: 'profile', icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <nav
      data-testid="bottom-nav"
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        height: 84,
        background: 'var(--bg-deeper)',
      }}
    >
      <div className="max-w-md mx-auto flex items-center justify-around h-full px-2">
        {items.map(({ id, icon: Icon, label, path }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              data-testid={`nav-${id}`}
              aria-label={label}
              onClick={() => { light(); navigate(path); }}
              className="flex flex-col items-center gap-1 transition-all duration-200"
              style={{ minWidth: 56 }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  background: isActive ? 'var(--card-dark)' : 'transparent',
                  borderRadius: 12,
                  padding: '8px 20px',
                }}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  style={{ color: isActive ? 'var(--accent-blue)' : 'var(--muted)' }}
                />
              </div>
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 11,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--accent-blue)' : 'var(--muted)',
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

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
        background: 'var(--drop-surface)',
        borderTop: '1px solid var(--drop-border)',
      }}
    >
      <div className="max-w-md mx-auto flex items-center justify-around px-2 pt-2.5 pb-5">
        {items.map(({ id, icon: Icon, label, path }) => {
          const isActive = active === id;
          const isStreak = id === 'streak';
          return (
            <button
              key={id}
              data-testid={`nav-${id}`}
              aria-label={label}
              onClick={() => { light(); navigate(path); }}
              className="flex flex-col items-center gap-1 py-1 px-3 transition-all duration-200"
            >
              <div
                className="flex items-center justify-center"
                style={{
                  background: isActive ? 'color-mix(in srgb, var(--drop-primary) 10%, transparent)' : 'transparent',
                  borderRadius: 12,
                  padding: 6,
                }}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  style={{ color: isStreak ? 'var(--drop-accent2, #F59E0B)' : (isActive ? 'var(--drop-primary)' : 'var(--drop-text-muted)') }}
                />
              </div>
              <span
                className="text-[10px]"
                style={{
                  fontFamily: 'var(--drop-font-body)',
                  color: isActive ? 'var(--drop-primary)' : 'var(--drop-text-muted)',
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

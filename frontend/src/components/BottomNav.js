import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { F7Icon } from './F7Icon';
import { light } from '../lib/haptic';
import { motion, AnimatePresence } from 'framer-motion';
import { DidYouKnowSheet } from './DidYouKnowSheet';

export const BottomNav = ({ active = 'home' }) => {
  const navigate = useNavigate();
  const { darkMode, band } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [didYouKnowOpen, setDidYouKnowOpen] = useState(false);

  const isYounger = band === 'big-bold-bright' || band === 'cool-connected';

  const handleDropTap = useCallback(() => {
    if (isYounger) {
      setDidYouKnowOpen(true);
    }
  }, [isYounger]);

  const items = [
    { id: 'home', icon: 'house_fill', action: () => navigate('/feed') },
    { id: 'search', icon: 'search', action: () => setSearchOpen(true) },
    { id: 'settings', icon: 'gear_alt_fill', action: () => navigate('/settings') },
    { id: 'drop-logo', action: handleDropTap },
  ];



  return (
    <>
      <nav
        data-testid="bottom-nav"
        aria-label="Main navigation"
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          height: 68,
          background: 'var(--toolbar-bg, var(--surface))',
          borderTop: '1px solid var(--light-gray)',
          boxShadow: 'none',
          transition: 'background-color 0.4s',
        }}
      >
        <div className="max-w-md mx-auto flex items-center justify-around h-full px-2">
          {items.map(({ id, icon, action }) => {
            const isActive = active === id;

            if (id === 'drop-logo') {
              return (
                <button
                  key={id}
                  aria-label="The Drop"
                  onClick={() => { light(); action(); }}
                  className="flex flex-col items-center justify-center"
                  style={{ minWidth: 56, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <img
                    src={darkMode ? '/darklogo.png' : '/lightlogo.png'}
                    alt="The Drop"
                    style={{ width: 32, height: 32, objectFit: 'contain' }}
                  />
                </button>
              );
            }

            return (
              <button
                key={id}
                data-testid={`nav-${id}`}
                aria-label={id}
                onClick={() => { light(); action(); }}
                className="flex flex-col items-center justify-center"
                style={{ minWidth: 56, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <F7Icon name={icon} size={24} color={isActive ? 'var(--accent)' : '#c4c4c5'} />
              </button>
            );
          })}
        </div>
      </nav>

      {/* Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSearchOpen(false)}
              className="fixed inset-0 z-[60]"
              style={{ background: 'var(--overlay-backdrop)' }}
            />
            <div className="fixed inset-0 z-[70] flex justify-center pointer-events-none">
              <motion.div
                initial={{ y: '-100%' }} animate={{ y: 0 }} exit={{ y: '-100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="px-4 pt-12 pb-5 w-full max-w-[430px] pointer-events-auto"
                style={{ background: 'var(--surface)', borderRadius: '0 0 20px 20px', alignSelf: 'flex-start' }}
              >
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ fontFamily: 'var(--font)', fontSize: 18, fontWeight: 600, color: 'var(--title-color)' }}>Search</h3>
                <button onClick={() => setSearchOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <F7Icon name="xmark" size={20} color="var(--text-color)" />
                </button>
              </div>
              <div className="relative">
                <F7Icon name="search" size={16} color="var(--text-color)" className="absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search news..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full outline-none"
                  style={{
                    fontFamily: 'var(--font)',
                    fontSize: 15,
                    fontWeight: 500,
                    height: 44,
                    borderRadius: 10,
                    background: 'var(--light-gray)',
                    border: 'none',
                    padding: '0 15px 0 40px',
                    color: 'var(--title-color)',
                  }}
                />
              </div>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Did You Know sheet for younger bands */}
      <DidYouKnowSheet open={didYouKnowOpen} onClose={() => setDidYouKnowOpen(false)} />
    </>
  );
};

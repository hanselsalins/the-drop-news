import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { F7Icon } from './F7Icon';
import { light } from '../lib/haptic';
import { motion, AnimatePresence } from 'framer-motion';

const SOCIAL_LINKS = [
  { label: 'WhatsApp', color: '#25D366', icon: '💬', url: 'https://wa.me/?text=Check+out+The+Drop!' },
  { label: 'Twitter', color: '#1DA1F2', icon: '🐦', url: 'https://twitter.com/intent/tweet?text=Check+out+The+Drop!' },
  { label: 'Instagram', color: '#E1306C', icon: '📷', url: '#' },
  { label: 'Copy Link', color: 'var(--light-gray)', icon: '🔗', action: 'copy' },
];

export const BottomNav = ({ active = 'home' }) => {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const items = [
    { id: 'home', icon: 'house_fill', action: () => navigate('/feed') },
    { id: 'search', icon: 'search', action: () => setSearchOpen(true) },
    { id: 'settings', icon: 'gear_alt_fill', action: () => navigate('/profile') },
    { id: 'profile', icon: 'person_fill', action: () => navigate('/profile') },
  ];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

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
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[70] px-4 pt-5 pb-8"
              style={{ background: 'var(--surface)', borderRadius: '20px 20px 0 0' }}
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
          </>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {shareOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShareOpen(false)}
              className="fixed inset-0 z-[60]"
              style={{ background: 'var(--overlay-backdrop)' }}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[70] px-4 pt-5 pb-8"
              style={{ background: 'var(--surface)', borderRadius: '20px 20px 0 0' }}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 style={{ fontFamily: 'var(--font)', fontSize: 18, fontWeight: 600, color: 'var(--title-color)' }}>Share The Drop</h3>
                <button onClick={() => setShareOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <F7Icon name="xmark" size={20} color="var(--text-color)" />
                </button>
              </div>
              <div className="flex items-center justify-around">
                {SOCIAL_LINKS.map(s => (
                  <button
                    key={s.label}
                    onClick={() => {
                      if (s.action === 'copy') { handleCopyLink(); }
                      else if (s.url !== '#') { window.open(s.url, '_blank'); }
                    }}
                    className="flex flex-col items-center gap-2"
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <div className="flex items-center justify-center" style={{
                      width: 56, height: 56, borderRadius: '50%',
                      background: s.action === 'copy' ? 'var(--light-gray)' : s.color,
                    }}>
                      <span style={{ fontSize: 24 }}>{s.icon}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font)', fontSize: 12, fontWeight: 400, color: 'var(--text-color)' }}>
                      {s.action === 'copy' && copied ? 'Copied!' : s.label}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

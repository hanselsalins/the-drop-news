import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { F7Icon } from './F7Icon';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const SECTIONS = [
  { key: 'who', emoji: '👤', label: 'WHO' },
  { key: 'what', emoji: '📰', label: 'WHAT' },
  { key: 'why', emoji: '💡', label: 'WHY' },
];

export default function ArticleBreakdown({ articleId }) {
  const { ageGroup, token } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hidden, setHidden] = useState(false);

  const showBreakdown = ageGroup === '8-10' || ageGroup === '11-13';
  if (!showBreakdown || hidden) return null;

  const handleToggle = () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    // Lazy load on first expand
    if (!data && !loading) {
      setLoading(true);
      const hdrs = token ? { Authorization: `Bearer ${token}` } : {};
      fetch(`${BACKEND_URL}/api/article-context/${articleId}`, { headers: hdrs })
        .then(r => {
          if (!r.ok) throw new Error(r.status);
          return r.json();
        })
        .then(res => {
          console.log('[ArticleContext] response:', res);
          if (res.who || res.what || res.why) {
            setData(res);
            setExpanded(true);
          } else {
            setHidden(true);
          }
          setLoading(false);
        })
        .catch(err => {
          console.log('[ArticleContext] error:', err);
          setHidden(true);
          setLoading(false);
        });
    } else if (data) {
      setExpanded(true);
    }
  };

  return (
    <div style={{ margin: '20px 0' }}>
      {/* Toggle button */}
      <button
        onClick={handleToggle}
        className="cursor-pointer"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          background: expanded ? '#FF6B00' : 'var(--surface)',
          border: `1.5px solid ${expanded ? '#FF6B00' : 'var(--border, var(--light-gray))'}`,
          borderRadius: 14,
          fontFamily: 'var(--font)',
          fontSize: 15,
          fontWeight: 700,
          color: expanded ? '#FFFFFF' : '#FF6B00',
          transition: 'all 0.2s ease',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          🧠 Understand this story
        </span>
        {loading ? (
          <span className="animate-spin" style={{
            width: 18, height: 18, border: '2px solid currentColor',
            borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block',
          }} />
        ) : (
          <F7Icon name={expanded ? 'chevron.up' : 'chevron.down'} size={14} color={expanded ? '#FFFFFF' : '#FF6B00'} />
        )}
      </button>

      {/* Expanded cards */}
      <AnimatePresence>
        {expanded && data && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
              {SECTIONS.map(({ key, emoji, label }) => {
                const content = data[key];
                if (!content) return null;
                return (
                  <div key={key} style={{
                    padding: '16px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border, var(--light-gray))',
                    borderRadius: 14,
                    borderTop: '3px solid #FF6B00',
                  }}>
                    <div style={{
                      fontFamily: 'var(--font)',
                      fontSize: 13,
                      fontWeight: 800,
                      color: '#FF6B00',
                      letterSpacing: '0.05em',
                      marginBottom: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                      {emoji} {label}
                    </div>
                    <p style={{
                      fontFamily: 'var(--font)',
                      fontSize: 'inherit',
                      fontWeight: 400,
                      color: 'var(--text-color)',
                      lineHeight: 1.65,
                      margin: 0,
                    }}>
                      {content}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

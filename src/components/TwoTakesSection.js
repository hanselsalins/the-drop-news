import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { F7Icon } from './F7Icon';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const FORMAT_COLORS = {
  agree_disagree: ['#3A86FF', '#FF6B00'],
  pro_con: ['#10B981', '#EF4444'],
  then_now: ['#8B5CF6', '#F59E0B'],
  local_global: ['#06B6D4', '#EC4899'],
  simple_complex: ['#3B82F6', '#6366F1'],
  emotional_logical: ['#F43F5E', '#0EA5E9'],
};

export default function TwoTakesSection({ articleId }) {
  const { ageGroup, token, countryCode } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [hidden, setHidden] = useState(false);

  const isOlder = ageGroup === '14-16' || ageGroup === '17-20';
  if (!isOlder || hidden) return null;

  const handleToggle = () => {
    if (expanded) { setExpanded(false); return; }
    if (!data && !loading) {
      setLoading(true);
      const hdrs = token ? { Authorization: `Bearer ${token}` } : {};
      fetch(`${BACKEND_URL}/api/two-takes?country_code=${countryCode || 'IN'}&age_group=${ageGroup || '17-20'}&article_id=${articleId}&_t=${Date.now()}`, { headers: hdrs })
        .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(res => {
          console.log('[TwoTakes] response:', res);
          const articles = res.articles || [];
          const match = articles.find(a => a.id === articleId);
          if (match?.two_takes) {
            setData(match.two_takes);
            setExpanded(true);
          } else {
            setHidden(true);
          }
          setLoading(false);
        })
        .catch(err => {
          console.log('[TwoTakes] error:', err);
          setHidden(true);
          setLoading(false);
        });
    } else if (data) {
      setExpanded(true);
    }
  };

  const colors = data ? (FORMAT_COLORS[data.format] || ['#3A86FF', '#FF6B00']) : [];

  return (
    <div style={{ margin: '24px 0' }}>
      {/* Toggle */}
      <button
        onClick={handleToggle}
        className="cursor-pointer"
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px',
          background: expanded ? '#FF6B00' : 'var(--surface)',
          border: `1.5px solid ${expanded ? '#FF6B00' : 'var(--border, var(--light-gray))'}`,
          borderRadius: 14,
          fontFamily: 'var(--font)', fontSize: 15, fontWeight: 700,
          color: expanded ? '#FFFFFF' : '#FF6B00',
          transition: 'all 0.2s ease',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          ⚖️ Two Takes
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

      <AnimatePresence>
        {expanded && data && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ marginTop: 12 }}>
              {/* Format label */}
              {data.label && (
                <p style={{
                  fontFamily: 'var(--font)', fontSize: 12, fontWeight: 700,
                  color: '#FF6B00', textTransform: 'uppercase', letterSpacing: '0.08em',
                  margin: '0 0 10px',
                }}>
                  {data.label}
                </p>
              )}

              {/* Two perspective cards */}
              <div style={{ display: 'flex', gap: 10 }}>
                {/* Card A */}
                <div style={{
                  flex: 1, padding: 14, borderRadius: 14,
                  background: `${colors[0]}12`,
                  border: `1px solid ${colors[0]}30`,
                  borderTop: `3px solid ${colors[0]}`,
                }}>
                  <p style={{
                    fontFamily: 'var(--font)', fontSize: 'inherit', fontWeight: 400,
                    color: 'var(--text-color)', lineHeight: 1.65, margin: 0,
                  }}>
                    {data.card_a}
                  </p>
                </div>

                {/* Card B */}
                <div style={{
                  flex: 1, padding: 14, borderRadius: 14,
                  background: `${colors[1]}12`,
                  border: `1px solid ${colors[1]}30`,
                  borderTop: `3px solid ${colors[1]}`,
                }}>
                  <p style={{
                    fontFamily: 'var(--font)', fontSize: 'inherit', fontWeight: 400,
                    color: 'var(--text-color)', lineHeight: 1.65, margin: 0,
                  }}>
                    {data.card_b}
                  </p>
                </div>
              </div>

              {/* Think prompt */}
              {data.think_prompt && (
                <div style={{
                  marginTop: 14, padding: 14, borderRadius: 12,
                  background: 'var(--surface)',
                  border: '1px solid var(--border, var(--light-gray))',
                }}>
                  <p style={{
                    fontFamily: 'var(--font)', fontSize: 11, fontVariant: 'small-caps',
                    color: 'var(--text-color)', opacity: 0.5, margin: '0 0 6px',
                  }}>
                    💭 Think about it
                  </p>
                  <p style={{
                    fontFamily: 'var(--font)', fontSize: 15, fontStyle: 'italic',
                    fontWeight: 500, color: 'var(--title-color)', lineHeight: 1.55, margin: 0,
                  }}>
                    {data.think_prompt}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

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
  const { ageGroup, token } = useTheme();
  const [data, setData] = useState(null);
  const [hidden, setHidden] = useState(false);

  const isOlder = ageGroup === '14-16' || ageGroup === '17-20';

  useEffect(() => {
    if (!isOlder || !articleId) return;
    const hdrs = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${BACKEND_URL}/api/two-takes?article_id=${articleId}&_t=${Date.now()}`, { headers: hdrs })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(res => {
        console.log('[TwoTakes] response:', res);
        if (res?.available && res?.two_takes) {
          setData(res.two_takes);
        } else {
          setHidden(true);
        }
      })
      .catch(err => {
        console.log('[TwoTakes] error:', err);
        setHidden(true);
      });
  }, [articleId, isOlder, token]);

  if (!isOlder || hidden || !data) return null;

  const colors = FORMAT_COLORS[data.format] || ['#3A86FF', '#FF6B00'];

  return (
    <div
      data-two-takes
      style={{ margin: '24px 0', animation: 'twoTakesFadeIn 0.5s ease-out both' }}
    >
      <style>{`
        @keyframes twoTakesFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-two-takes] { animation: none !important; }
        }
      `}</style>
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
  );
}

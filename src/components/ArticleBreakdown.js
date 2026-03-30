import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import { F7Icon } from './F7Icon';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const PILLS = [
  { key: 'who', emoji: '👤', label: 'Who?', header: "👤 Who's in this story?" },
  { key: 'where', emoji: '📍', label: 'Where?', header: '📍 Where is this?' },
  { key: 'backstory', emoji: '📖', label: 'Backstory', header: '📖 The Backstory' },
  { key: 'big_words', emoji: '💬', label: 'Big Words', header: '💬 Big Words' },
];

const WHATS_NEXT_PILL = { key: 'whats_next', emoji: '🔮', label: "What's Next?", header: '🔮 What Could Happen Next?' };

function BigWordsContent({ text }) {
  const lines = text.split('\n').filter(Boolean);
  return (
    <div>
      {lines.map((line, i) => {
        const colonIdx = line.indexOf(':');
        const word = colonIdx > -1 ? line.slice(0, colonIdx).trim() : line;
        const def = colonIdx > -1 ? line.slice(colonIdx + 1).trim() : '';
        return (
          <div key={i} style={{
            padding: '12px 0',
            borderBottom: i < lines.length - 1 ? '1px solid var(--light-gray)' : 'none',
          }}>
            <span style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 700, color: '#FF6B00' }}>
              {word}
            </span>
            {def && (
              <span style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 400, color: 'var(--text-color)' }}>
                : {def}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ArticleBreakdown({ articleId }) {
  const { ageGroup, token } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeKey, setActiveKey] = useState(null);
  const scrollRef = useRef(null);

  const showBreakdown = ageGroup === '8-10' || ageGroup === '11-13';

  useEffect(() => {
    if (!showBreakdown || !articleId) { setLoading(false); return; }
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    axios.get(`${BACKEND_URL}/api/article-context/${articleId}`, { headers })
      .then(res => {
        if (res.data?.available) setData(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [articleId, showBreakdown, token]);

  if (!showBreakdown) return null;

  if (loading) {
    return (
      <div ref={scrollRef} style={{
        display: 'flex', gap: 8, padding: '16px 0', overflowX: 'auto',
        scrollbarWidth: 'none', msOverflowStyle: 'none',
      }}>
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>
        {[1,2,3,4].map(i => (
          <div key={i} className="skeleton-shimmer-light" style={{
            height: 36, width: 100, borderRadius: 18, flexShrink: 0,
          }} />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const pills = [...PILLS];
  if (data.whats_next) pills.push(WHATS_NEXT_PILL);

  const activePill = pills.find(p => p.key === activeKey);
  const modalContent = activeKey && data[activeKey];

  return (
    <>
      {/* Pill row */}
      <div style={{
        display: 'flex', gap: 8, padding: '16px 0', overflowX: 'auto',
        scrollbarWidth: 'none', msOverflowStyle: 'none',
      }}>
        <style>{`.breakdown-scroll::-webkit-scrollbar { display: none; }`}</style>
        {pills.map(pill => {
          const isActive = activeKey === pill.key;
          return (
            <button
              key={pill.key}
              onClick={() => setActiveKey(pill.key)}
              className="cursor-pointer"
              style={{
                height: 36, borderRadius: 18, flexShrink: 0,
                padding: '0 14px', display: 'flex', alignItems: 'center', gap: 4,
                background: isActive ? '#FF6B00' : 'var(--surface)',
                border: `1px solid ${isActive ? '#FF6B00' : 'var(--border, var(--light-gray))'}`,
                color: isActive ? '#FFFFFF' : 'var(--text-color)',
                fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              {pill.emoji} {pill.label}
            </button>
          );
        })}
      </div>

      {/* Bottom sheet modal */}
      <AnimatePresence>
        {activeKey && activePill && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setActiveKey(null)}
              style={{
                position: 'fixed', inset: 0, zIndex: 60,
                background: 'rgba(0,0,0,0.4)',
              }}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 70,
                background: 'var(--surface)', borderRadius: '24px 24px 0 0',
                maxHeight: '70vh', maxWidth: 430, margin: '0 auto',
                display: 'flex', flexDirection: 'column',
              }}
            >
              {/* Drag handle */}
              <div style={{
                width: 40, height: 5, background: 'var(--light-gray)',
                borderRadius: 3, margin: '12px auto 0', flexShrink: 0,
              }} />

              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px 12px', flexShrink: 0,
              }}>
                <h3 style={{
                  fontFamily: 'var(--font)', fontSize: 18, fontWeight: 700,
                  color: 'var(--title-color)', margin: 0,
                }}>
                  {activePill.header}
                </h3>
                <button onClick={() => setActiveKey(null)} className="cursor-pointer"
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'var(--light-gray)', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                  <F7Icon name="xmark" size={16} color="var(--text-color)" />
                </button>
              </div>

              {/* Body */}
              <div style={{
                padding: '0 20px 24px', overflowY: 'auto', flex: 1,
              }}>
                {activeKey === 'big_words' && modalContent ? (
                  <BigWordsContent text={modalContent} />
                ) : (
                  <p style={{
                    fontFamily: 'var(--font)', fontSize: 15, fontWeight: 400,
                    color: 'var(--text-color)', lineHeight: 1.6, margin: 0,
                  }}>
                    {modalContent || 'No information available.'}
                  </p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { F7Icon } from './F7Icon';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const FORMAT_SUBTITLES = {
  agree_disagree: 'Two positions. You decide.',
  pro_con: 'Weigh the trade-offs.',
  then_now: 'How things have changed.',
  local_global: 'Near and far.',
  simple_complex: 'Two depths of the same story.',
  emotional_logical: 'Heart and head.',
};

const FORMAT_ACCENTS = {
  agree_disagree: ['#3A86FF', '#FF6B00'],
  pro_con: ['#10B981', '#EF4444'],
  then_now: ['#8B5CF6', '#F59E0B'],
  local_global: ['#06B6D4', '#EC4899'],
  simple_complex: ['#3B82F6', '#6366F1'],
  emotional_logical: ['#F43F5E', '#0EA5E9'],
};

const SkeletonCards = () => (
  <div style={{ display: 'flex', gap: 12 }}>
    {[0, 1].map(i => (
      <div key={i} style={{
        flex: 1, background: 'var(--bg)', borderRadius: 14,
        border: '1px solid var(--light-gray)', padding: 16,
      }}>
        <div className="skeleton-shimmer" style={{ width: '60%', height: 12, borderRadius: 4, marginBottom: 10 }} />
        <div className="skeleton-shimmer" style={{ width: '100%', height: 12, borderRadius: 4, marginBottom: 6 }} />
        <div className="skeleton-shimmer" style={{ width: '90%', height: 12, borderRadius: 4, marginBottom: 6 }} />
        <div className="skeleton-shimmer" style={{ width: '70%', height: 12, borderRadius: 4 }} />
      </div>
    ))}
  </div>
);

const TakeCard = ({ text, accent }) => (
  <div style={{
    flex: 1,
    background: 'var(--bg)',
    borderRadius: 14,
    border: '1px solid var(--light-gray)',
    borderLeft: `3px solid ${accent}`,
    padding: 16,
    minWidth: 0,
  }}>
    <p style={{
      fontSize: 14, color: 'var(--text-color)', lineHeight: 1.6,
      margin: 0, fontFamily: 'var(--font)',
    }}>
      {text}
    </p>
  </div>
);

export const TwoTakesSheet = ({ open, onClose }) => {
  const { ageGroup, countryCode, token } = useTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [articleTitle, setArticleTitle] = useState('');
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setData(null);
    setArticleTitle('');
    setEmpty(false);

    const band = ageGroup || '17-20';
    const cc = countryCode || 'IN';
    const url = `${BACKEND_URL}/api/two-takes?country_code=${cc}&age_group=${band}&_t=${Date.now()}`;
    const hdrs = token ? { Authorization: `Bearer ${token}` } : {};

    console.log('[TwoTakesSheet] Fetching:', url);

    fetch(url, { headers: hdrs })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(res => {
        console.log('[TwoTakesSheet] Response:', res);
        const articles = res?.articles || [];
        const match = articles.find(a => a.two_takes);
        if (match?.two_takes) {
          setData(match.two_takes);
          setArticleTitle(match.title || '');
        } else {
          setEmpty(true);
        }
      })
      .catch(err => {
        console.log('[TwoTakesSheet] Error:', err);
        setEmpty(true);
      })
      .finally(() => setLoading(false));
  }, [open, ageGroup, countryCode, token]);

  const accents = data ? (FORMAT_ACCENTS[data.format] || ['#3A86FF', '#FF6B00']) : [];
  const subtitle = data ? (FORMAT_SUBTITLES[data.format] || '') : '';

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[40]"
            style={{ background: 'rgba(0,0,0,0.45)' }}
          />

          <div className="fixed inset-x-0 top-0 z-[45] flex justify-center items-end pointer-events-none" style={{ bottom: 68 }}>
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-full max-w-[430px] pointer-events-auto"
              style={{
                background: 'var(--surface)',
                borderRadius: '24px 24px 0 0',
                maxHeight: 'calc(82vh - 68px)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Drag handle */}
              <div style={{
                width: 40, height: 4, borderRadius: 2,
                background: 'var(--text-color)', opacity: 0.3,
                margin: '12px auto 0', flexShrink: 0,
              }} />

              {/* Close button */}
              <button
                onClick={onClose}
                aria-label="Close"
                style={{
                  position: 'absolute', top: 14, right: 16,
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--bg)', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <F7Icon name="xmark" size={16} color="var(--title-color)" />
              </button>

              {/* Header (non-scrolling) */}
              <div style={{ padding: '16px 20px 0', flexShrink: 0 }}>
                <h3 style={{
                  fontSize: 22, fontWeight: 700, color: 'var(--title-color)',
                  margin: 0, fontFamily: 'var(--font)',
                }}>
                  {data?.label || 'Two Takes'}
                </h3>
                {subtitle && (
                  <p style={{
                    fontSize: 13, color: 'var(--text-color)', margin: '4px 0 0',
                    fontFamily: 'var(--font)',
                  }}>
                    {subtitle}
                  </p>
                )}
                {articleTitle && (
                  <p style={{
                    fontSize: 12, color: 'var(--text-color)', opacity: 0.7,
                    margin: '6px 0 0', fontFamily: 'var(--font)',
                    fontStyle: 'italic',
                  }}>
                    On: {articleTitle}
                  </p>
                )}
                <div style={{ height: 1, background: 'var(--light-gray)', marginTop: 14 }} />
              </div>

              {/* Scrollable cards */}
              <div style={{
                padding: '16px 20px', overflowY: 'auto', flex: 1, minHeight: 0,
              }}>
                {loading && <SkeletonCards />}

                {!loading && empty && (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <span style={{ fontSize: 32 }}>⚖️</span>
                    <p style={{
                      fontSize: 14, color: 'var(--text-color)',
                      fontFamily: 'var(--font)', margin: '12px 0 0',
                    }}>
                      No Two Takes available right now.
                    </p>
                  </div>
                )}

                {!loading && data && (
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <TakeCard text={data.card_a} accent={accents[0]} />
                    <TakeCard text={data.card_b} accent={accents[1]} />
                  </div>
                )}
              </div>

              {/* Think prompt (non-scrolling) */}
              {!loading && data?.think_prompt && (
                <div style={{
                  padding: '0 20px 24px', flexShrink: 0,
                }}>
                  <div style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--light-gray)',
                    borderRadius: 10,
                    padding: 14,
                  }}>
                    <p style={{
                      fontSize: 11, fontVariant: 'small-caps', color: 'var(--text-color)',
                      opacity: 0.6, margin: '0 0 6px', fontFamily: 'var(--font)',
                    }}>
                      Think about it
                    </p>
                    <p style={{
                      fontSize: 15, fontStyle: 'italic', color: 'var(--title-color)',
                      lineHeight: 1.5, margin: 0, fontFamily: 'var(--font)',
                    }}>
                      {data.think_prompt}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

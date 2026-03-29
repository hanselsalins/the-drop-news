import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { F7Icon } from './F7Icon';

const API_BASE = import.meta.env.VITE_API_URL || '';

const FORMAT_SUBTITLES = {
  two_sides: 'Two positions. You decide.',
  two_voices: 'Two experiences of the same story.',
  two_wonders: 'Two reasons this matters.',
  two_worlds: 'Near and far.',
  two_futures: 'Two paths forward.',
  two_lenses: 'Two ways of seeing.',
};

const FORMAT_ACCENTS = {
  two_sides: ['#3A86FF', '#FF6B00'],
  two_voices: ['#9146DA', '#9146DA'],
  two_wonders: ['#00E5CC', '#00E5CC'],
  two_worlds: ['#3A86FF', '#39FF14'],
  two_futures: ['#39FF14', '#fca5a5'],
  two_lenses: ['#FFD60A', '#9146DA'],
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

const TakeCard = ({ card, accent }) => (
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
      fontSize: 13, fontWeight: 700, color: 'var(--title-color)',
      margin: '0 0 8px', fontFamily: 'var(--font)',
    }}>
      {card.title}
    </p>
    <p style={{
      fontSize: 14, color: 'var(--text-color)', lineHeight: 1.6,
      margin: 0, fontFamily: 'var(--font)',
    }}>
      {card.body}
    </p>
  </div>
);

export const TwoTakesSheet = ({ open, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setData(null);
    setEmpty(false);

    fetch(`${API_BASE}/api/two-takes`)
      .then(r => r.json())
      .then(d => {
        if (!d || !d.card_a) {
          setEmpty(true);
        } else {
          setData(d);
        }
      })
      .catch(() => setEmpty(true))
      .finally(() => setLoading(false));
  }, [open]);

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
                <div style={{ height: 1, background: 'var(--light-gray)', marginTop: 14 }} />
              </div>

              {/* Scrollable cards */}
              <div style={{
                padding: '16px 20px', overflowY: 'auto', flex: 1, minHeight: 0,
              }}>
                {loading && <SkeletonCards />}

                {!loading && empty && (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <p style={{
                      fontSize: 14, color: 'var(--text-color)',
                      fontFamily: 'var(--font)', margin: 0,
                    }}>
                      Check back after 7am — your Two Takes is being prepared ✨
                    </p>
                  </div>
                )}

                {!loading && data && (
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <TakeCard card={data.card_a} accent={accents[0]} />
                    <TakeCard card={data.card_b} accent={accents[1]} />
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

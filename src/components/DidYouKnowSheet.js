import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { F7Icon } from './F7Icon';

const API_BASE = import.meta.env.VITE_API_URL || '';

const SkeletonCard = () => (
  <div
    style={{
      background: 'var(--bg)',
      borderRadius: 14,
      border: '1px solid rgba(255,107,0,0.15)',
      padding: 16,
      marginBottom: 12,
    }}
  >
    <div className="skeleton-shimmer" style={{ width: '40%', height: 10, borderRadius: 4, marginBottom: 10 }} />
    <div className="skeleton-shimmer" style={{ width: '100%', height: 14, borderRadius: 4, marginBottom: 6 }} />
    <div className="skeleton-shimmer" style={{ width: '85%', height: 14, borderRadius: 4, marginBottom: 10 }} />
    <div className="skeleton-shimmer" style={{ width: '70%', height: 10, borderRadius: 4 }} />
  </div>
);

const EmptyState = () => (
  <div style={{ textAlign: 'center', padding: '32px 0' }}>
    <span style={{ fontSize: 32 }}>🕐</span>
    <p style={{
      fontSize: 14,
      color: 'var(--text-color)',
      margin: '12px 0 4px',
      fontFamily: 'var(--font)',
      fontWeight: 500,
    }}>
      Your facts are being prepared...
    </p>
    <p style={{
      fontSize: 12,
      color: 'var(--text-color)',
      opacity: 0.7,
      margin: 0,
      fontFamily: 'var(--font)',
    }}>
      Check back after 7am ✨
    </p>
  </div>
);

const FactCard = ({ fact }) => (
  <div
    style={{
      background: 'var(--bg)',
      borderRadius: 14,
      border: '1px solid rgba(255,107,0,0.15)',
      padding: 16,
      marginBottom: 12,
    }}
  >
    {/* Source row */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
      <span style={{ fontSize: 20 }}>{fact.emoji}</span>
      <span style={{
        fontSize: 10,
        fontVariant: 'small-caps',
        color: 'var(--text-color)',
        opacity: 0.6,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        flex: 1,
        fontFamily: 'var(--font)',
      }}>
        {fact.article_title}
      </span>
    </div>

    {/* Fact text */}
    <p style={{
      fontSize: 15,
      fontWeight: 500,
      color: 'var(--title-color)',
      lineHeight: 1.55,
      margin: 0,
      fontFamily: 'var(--font)',
    }}>
      {fact.fact}
    </p>

    {/* Wonder row */}
    {fact.wonder_question && (
      <p style={{
        marginTop: 10,
        fontSize: 12,
        fontStyle: 'italic',
        color: '#FF6B00',
        lineHeight: 1.4,
        margin: '10px 0 0',
        fontFamily: 'var(--font)',
      }}>
        <span style={{ fontWeight: 600 }}>Wonder: </span>
        {fact.wonder_question}
      </p>
    )}
  </div>
);

export const DidYouKnowSheet = ({ open, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [facts, setFacts] = useState([]);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setFacts([]);
    setEmpty(false);

    fetch(`${API_BASE}/api/did-you-know`)
      .then(r => r.json())
      .then(data => {
        if (!data.available) {
          onClose();
          return;
        }
        if (!data.facts || data.facts.length === 0) {
          setEmpty(true);
        } else {
          setFacts(data.facts.slice(0, 5));
        }
      })
      .catch(() => setEmpty(true))
      .finally(() => setLoading(false));
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80]"
            style={{ background: 'rgba(0,0,0,0.45)' }}
          />

          {/* Sheet */}
          <div className="fixed inset-0 z-[90] flex justify-center items-end pointer-events-none">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-full max-w-[430px] pointer-events-auto"
              style={{
                background: 'var(--surface)',
                borderRadius: '24px 24px 0 0',
                maxHeight: '78vh',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Drag handle */}
              <div style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                background: 'var(--text-color)',
                opacity: 0.3,
                margin: '12px auto 0',
                flexShrink: 0,
              }} />

              {/* Close button */}
              <button
                onClick={onClose}
                aria-label="Close"
                style={{
                  position: 'absolute',
                  top: 14,
                  right: 16,
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'var(--bg)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <F7Icon name="xmark" size={16} color="var(--title-color)" />
              </button>

              {/* Header (non-scrolling) */}
              <div style={{ padding: '16px 20px 0', flexShrink: 0, textAlign: 'center' }}>
                <span style={{ fontSize: 36, display: 'block', marginBottom: 8 }}>🤔</span>
                <h3 style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: 'var(--title-color)',
                  margin: 0,
                  fontFamily: 'var(--font)',
                }}>
                  Did You Know?
                </h3>
                <p style={{
                  fontSize: 13,
                  color: 'var(--text-color)',
                  margin: '4px 0 0',
                  fontFamily: 'var(--font)',
                }}>
                  Cool facts from today's news
                </p>
                <div style={{
                  height: 1,
                  background: 'var(--light-gray)',
                  marginTop: 16,
                }} />
              </div>

              {/* Scrollable content */}
              <div style={{
                padding: '16px 20px 24px',
                overflowY: 'auto',
                flex: 1,
                minHeight: 0,
              }}>
                {loading && (
                  <>
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                  </>
                )}

                {!loading && empty && <EmptyState />}

                {!loading && !empty && facts.map((fact, i) => (
                  <FactCard key={fact.article_id || i} fact={fact} />
                ))}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

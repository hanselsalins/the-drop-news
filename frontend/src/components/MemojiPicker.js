import { useState } from 'react';
import { getBankForAge } from '../lib/memojis';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

export function MemojiPicker({ currentId, onSelect, onClose }) {
  const { ageGroup } = useTheme();
  const bank = getBankForAge(ageGroup);
  const [filter, setFilter] = useState('all'); // 'all' | 'boy' | 'girl'
  const [selected, setSelected] = useState(currentId || null);

  const filtered = filter === 'all' ? bank : bank.filter(m => m.gender === filter);

  const handleConfirm = () => {
    if (selected) onSelect(selected);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 300 }}
          animate={{ y: 0 }}
          exit={{ y: 300 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: 'var(--surface)',
            borderRadius: '24px 24px 0 0',
            width: '100%',
            maxWidth: 480,
            padding: '24px 20px 32px',
            maxHeight: '75vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <h2 style={{
              fontFamily: 'var(--font)',
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--title-color)',
            }}>
              Choose your avatar
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'var(--light-gray)',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-color)',
                fontSize: 18,
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>

          {/* Gender filter tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[
              { key: 'all', label: 'All' },
              { key: 'boy', label: '👦 Boys' },
              { key: 'girl', label: '👧 Girls' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 20,
                  border: 'none',
                  background: filter === tab.key ? 'var(--accent)' : 'var(--light-gray)',
                  color: filter === tab.key ? '#fff' : 'var(--text-color)',
                  fontFamily: 'var(--font)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 10,
            overflowY: 'auto',
            flex: 1,
            paddingBottom: 16,
          }}>
            {filtered.map(memoji => (
              <button
                key={memoji.id}
                onClick={() => setSelected(memoji.id)}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: '50%',
                  border: selected === memoji.id ? '3px solid var(--accent)' : '3px solid transparent',
                  background: selected === memoji.id ? 'var(--light-gray)' : 'transparent',
                  padding: 3,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={memoji.src}
                  alt={memoji.label}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                />
              </button>
            ))}
          </div>

          <button
            onClick={handleConfirm}
            disabled={!selected}
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 14,
              border: 'none',
              background: selected ? 'var(--accent)' : 'var(--light-gray)',
              color: selected ? '#fff' : 'var(--text-color)',
              fontFamily: 'var(--font)',
              fontSize: 16,
              fontWeight: 600,
              cursor: selected ? 'pointer' : 'default',
              marginTop: 8,
            }}
          >
            Save Avatar
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

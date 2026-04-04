import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const f = 'Rubik, var(--font), sans-serif';

export function PushPromptCard({ onSubscribe }) {
  const [visible, setVisible] = useState(true);
  const [success, setSuccess] = useState(false);

  const handleEnable = async () => {
    const ok = await onSubscribe();
    if (ok) {
      localStorage.setItem('push_prompted', 'enabled');
      setSuccess(true);
      setTimeout(() => setVisible(false), 1800);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('push_prompted', 'dismissed');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          style={{
            background: 'var(--surface)',
            borderRadius: 16,
            padding: '16px 16px 14px',
            marginBottom: 12,
          }}
        >
          {success ? (
            <p style={{ fontFamily: f, fontSize: 14, fontWeight: 600, color: '#FF6B00', textAlign: 'center' }}>
              Notifications on ✓
            </p>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontSize: 28, lineHeight: 1 }}>🔔</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: f, fontSize: 15, fontWeight: 600, color: 'var(--title-color)', margin: 0 }}>
                    Stay in the know
                  </p>
                  <p style={{ fontFamily: f, fontSize: 13, color: 'var(--text-color)', margin: '4px 0 0', lineHeight: 1.5 }}>
                    Get notified when breaking news drops and when your daily stories are ready.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
                <button onClick={handleDismiss}
                  className="cursor-pointer"
                  style={{
                    fontFamily: f, fontSize: 13, fontWeight: 600,
                    color: 'var(--text-color)', background: 'none',
                    border: 'none', padding: '8px 14px', borderRadius: 10,
                  }}>
                  Not now
                </button>
                <button onClick={handleEnable}
                  className="cursor-pointer"
                  style={{
                    fontFamily: f, fontSize: 13, fontWeight: 600,
                    color: '#fff', background: '#FF6B00',
                    border: 'none', padding: '8px 18px', borderRadius: 10,
                  }}>
                  Turn on notifications
                </button>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

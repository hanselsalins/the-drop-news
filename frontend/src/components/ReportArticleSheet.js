import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const REASONS = [
  { label: 'Not right for my age', value: 'age_inappropriate' },
  { label: 'Scary or upsetting', value: 'scary_or_upsetting' },
  { label: 'Feels inaccurate', value: 'inaccurate_or_misleading' },
  { label: 'Bad language', value: 'bad_language' },
  { label: 'Something else', value: 'other' },
];

export default function ReportArticleSheet({ open, onClose, articleId, onReported }) {
  const { token } = useTheme();
  const [reason, setReason] = useState(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // 'success' | 'already' | 'hidden'

  const reset = () => {
    setReason(null);
    setDetails('');
    setSubmitting(false);
    setResult(null);
  };

  const handleClose = () => {
    onClose();
    setTimeout(reset, 300);
  };

  const handleSubmit = async () => {
    if (!reason || submitting) return;
    setSubmitting(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/report-article`, {
        article_id: articleId,
        reason,
        details: details.trim(),
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.data?.already_reported) {
        setResult('already');
      } else if (res.data?.action_taken === 'auto_hidden') {
        setResult('hidden');
        onReported?.();
      } else {
        setResult('success');
        onReported?.();
      }
      setTimeout(handleClose, 2000);
    } catch {
      setResult('success');
      onReported?.();
      setTimeout(handleClose, 2000);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[60]"
            style={{ background: 'var(--overlay-backdrop)' }}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-0 left-0 right-0 z-[70]"
            style={{
              background: 'var(--surface)',
              borderRadius: '20px 20px 0 0',
              paddingBottom: 34,
              maxWidth: 430,
              margin: '0 auto',
            }}
          >
            {/* Drag handle */}
            <div style={{
              width: 40, height: 5, background: 'var(--light-gray)',
              borderRadius: 3, margin: '12px auto 20px',
            }} />

            {result ? (
              <div style={{ padding: '20px 24px 10px', textAlign: 'center' }}>
                <p style={{
                  fontFamily: 'var(--font)', fontSize: 16, fontWeight: 500,
                  color: 'var(--title-color)', lineHeight: 1.5,
                }}>
                  {result === 'already' && "You've already reported this article"}
                  {result === 'hidden' && "This article has been flagged for review and hidden from the feed"}
                  {result === 'success' && "Thank you for helping keep The Drop safe ✨"}
                </p>
              </div>
            ) : (
              <div style={{ padding: '0 24px' }}>
                {/* Header */}
                <h2 style={{
                  fontFamily: 'var(--font)', fontSize: 18, fontWeight: 600,
                  color: 'var(--title-color)', margin: '0 0 4px',
                }}>
                  🚩 Report this article
                </h2>
                <p style={{
                  fontFamily: 'var(--font)', fontSize: 13, fontWeight: 400,
                  color: 'var(--text-color)', margin: '0 0 18px',
                }}>
                  Help us keep The Drop safe for everyone
                </p>

                {/* Reason pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {REASONS.map(r => (
                    <button
                      key={r.value}
                      onClick={() => setReason(r.value)}
                      className="cursor-pointer"
                      style={{
                        fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500,
                        padding: '8px 14px',
                        borderRadius: 'var(--radius-pill)',
                        border: reason === r.value ? '2px solid var(--accent)' : '1.5px solid var(--light-gray)',
                        background: reason === r.value ? 'rgba(255,107,0,0.08)' : 'var(--surface)',
                        color: reason === r.value ? 'var(--accent)' : 'var(--title-color)',
                        transition: 'all 0.15s',
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>

                {/* Details field */}
                <textarea
                  value={details}
                  onChange={e => setDetails(e.target.value.slice(0, 200))}
                  placeholder="Any other details? (optional)"
                  rows={3}
                  style={{
                    width: '100%',
                    fontFamily: 'var(--font)', fontSize: 14,
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-input)',
                    border: '1.5px solid var(--light-gray)',
                    background: 'var(--bg)',
                    color: 'var(--title-color)',
                    resize: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <p style={{
                  fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-color)',
                  textAlign: 'right', margin: '4px 0 12px',
                }}>
                  {details.length}/200
                </p>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={!reason || submitting}
                  className="cursor-pointer"
                  style={{
                    width: '100%',
                    fontFamily: 'var(--font)', fontSize: 15, fontWeight: 600,
                    padding: '13px 0',
                    borderRadius: 'var(--radius-btn)',
                    border: 'none',
                    background: reason ? 'var(--accent)' : 'var(--light-gray)',
                    color: reason ? '#FFFFFF' : 'var(--text-color)',
                    opacity: submitting ? 0.6 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  {submitting ? 'Submitting…' : 'Submit Report'}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

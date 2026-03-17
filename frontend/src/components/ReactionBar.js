import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const REACTIONS = [
  { id: 'mind_blown', emoji: '🤯', label: 'Mind blown' },
  { id: 'surprising', emoji: '😮', label: 'Surprising' },
  { id: 'angry', emoji: '😡', label: 'Angry' },
  { id: 'sad', emoji: '😢', label: 'Sad' },
  { id: 'inspiring', emoji: '💪', label: 'Inspiring' },
];

export const ReactionBar = ({ articleId, categoryColor = '#3B82F6' }) => {
  const { token, band } = useTheme();
  const [counts, setCounts] = useState({});
  const [userReaction, setUserReaction] = useState(null);
  const [animating, setAnimating] = useState(null);
  const isDark = band === 'sharp-aware' || band === 'editorial';

  useEffect(() => {
    const fetchReactions = async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${BACKEND_URL}/api/articles/${articleId}/reactions`, { headers });
        setCounts(res.data.counts || {});
        setUserReaction(res.data.user_reaction);
      } catch (e) {
        console.error('Failed to fetch reactions:', e);
      }
    };
    fetchReactions();
  }, [articleId, token]);

  const handleReact = async (reactionId) => {
    if (!token) return;
    setAnimating(reactionId);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/articles/${articleId}/react`,
        { reaction: reactionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.action === 'removed') {
        setCounts(prev => ({ ...prev, [reactionId]: Math.max(0, (prev[reactionId] || 0) - 1) }));
        setUserReaction(null);
      } else {
        if (userReaction && userReaction !== reactionId) {
          setCounts(prev => ({
            ...prev,
            [userReaction]: Math.max(0, (prev[userReaction] || 0) - 1),
            [reactionId]: (prev[reactionId] || 0) + 1,
          }));
        } else {
          setCounts(prev => ({ ...prev, [reactionId]: (prev[reactionId] || 0) + 1 }));
        }
        setUserReaction(reactionId);
      }
    } catch (e) {
      console.error('React failed:', e);
    }
    setTimeout(() => setAnimating(null), 300);
  };

  return (
    <div
      data-testid="reaction-bar"
      className="mt-8 p-5"
      style={{
        background: isDark ? 'var(--drop-surface)' : 'var(--drop-surface)',
        border: `1px solid var(--drop-border)`,
        borderRadius: 'var(--drop-radius-card, 18px)',
      }}
    >
      <p className="text-[11px] font-semibold tracking-wider uppercase mb-4"
        style={{ fontFamily: 'var(--drop-font-body)', color: 'var(--drop-text-muted)' }}>
        HOW DID THIS MAKE YOU FEEL?
      </p>
      <div className="flex items-center justify-between">
        {REACTIONS.map((r) => {
          const isActive = userReaction === r.id;
          const count = counts[r.id] || 0;
          return (
            <motion.button
              key={r.id}
              data-testid={`reaction-${r.id}`}
              onClick={() => handleReact(r.id)}
              whileTap={{ scale: 1.15 }}
              className="flex flex-col items-center gap-1.5 px-2 py-2 transition-all duration-200"
              style={{
                background: isActive ? `${categoryColor}15` : 'transparent',
                border: isActive ? `1.5px solid ${categoryColor}33` : '1.5px solid transparent',
                borderRadius: 'var(--drop-radius-card, 14px)',
              }}
            >
              <motion.span
                className="text-3xl"
                animate={animating === r.id ? { scale: [1, 1.5, 1] } : {}}
                transition={{ duration: 0.3 }}
                style={{
                  filter: isActive ? 'none' : 'grayscale(0.3)',
                  opacity: isActive ? 1 : 0.5,
                }}
              >
                {r.emoji}
              </motion.span>
              <span className="text-[10px] font-bold"
                style={{ fontFamily: 'var(--drop-font-body)', color: isActive ? categoryColor : 'var(--drop-text-muted)' }}>
                {count > 0 ? count : ''}
              </span>
              <span className="text-[9px]"
                style={{ fontFamily: 'var(--drop-font-body)', color: 'var(--drop-text-muted)' }}>
                {r.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

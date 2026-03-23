import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { light } from '../lib/haptic';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const REACTIONS = [
  { id: 'mind_blown', emoji: '🤯', label: 'Mind blown' },
  { id: 'surprising', emoji: '😮', label: 'Surprising' },
  { id: 'angry', emoji: '😡', label: 'Angry' },
  { id: 'sad', emoji: '😢', label: 'Sad' },
  { id: 'inspiring', emoji: '💪', label: 'Inspiring' },
];

export const ReactionBar = ({ articleId }) => {
  const { token } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const [counts, setCounts] = useState({});
  const [userReaction, setUserReaction] = useState(null);
  const [animating, setAnimating] = useState(null);

  useEffect(() => {
    const fetchReactions = async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${BACKEND_URL}/api/articles/${articleId}/reactions`, { headers });
        setCounts(res.data.counts || {});
        setUserReaction(res.data.user_reaction);
      } catch (e) {}
    };
    fetchReactions();
  }, [articleId, token]);

  const handleReact = async (reactionId) => {
    if (!token) return;
    light();
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
    } catch (e) {}
    setTimeout(() => setAnimating(null), 300);
  };

  return (
    <div data-testid="reaction-bar" className="mt-6 p-4"
      style={{ background: 'var(--surface)', borderRadius: 14 }}>
      <p style={{
        fontFamily: 'var(--font)', fontSize: 11, fontWeight: 600,
        letterSpacing: '0.06em', textTransform: 'uppercase',
        color: 'var(--text-color)', marginBottom: 12,
      }}>
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
              aria-label={r.label}
              onClick={() => handleReact(r.id)}
              whileTap={prefersReducedMotion ? undefined : { scale: 1.15 }}
              className="flex flex-col items-center gap-1 px-2 py-2 cursor-pointer"
              style={{
                background: isActive ? 'rgba(255,107,0,0.1)' : 'transparent',
                border: isActive ? '1.5px solid rgba(255,107,0,0.3)' : '1.5px solid transparent',
                borderRadius: 12,
              }}
            >
              <motion.span className="text-2xl" aria-hidden="true"
                animate={!prefersReducedMotion && animating === r.id ? { scale: [1, 1.5, 1] } : {}}
                transition={{ duration: 0.3 }}
                style={{ filter: isActive ? 'none' : 'grayscale(0.3)', opacity: isActive ? 1 : 0.5 }}>
                {r.emoji}
              </motion.span>
              <span style={{ fontFamily: 'var(--font)', fontSize: 10, fontWeight: 700, color: isActive ? 'var(--accent)' : 'var(--text-color)' }}>
                {count > 0 ? count : ''}
              </span>
              <span style={{ fontFamily: 'var(--font)', fontSize: 9, color: 'var(--text-color)' }}>{r.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
